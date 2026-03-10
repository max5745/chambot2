const db = require('../config/supabaseClient');

// ═══════════════════════════════════════════════════════════════════════════════
// STOCK SERVICE
// All stock changes MUST go through inventory_transactions.
// ═══════════════════════════════════════════════════════════════════════════════

const VALID_TYPES = ['restock', 'adjustment', 'cancel', 'purchase'];

/**
 * Internal: apply a stock change inside an EXISTING transaction (BEGIN already called).
 */
const _applyChange = async (client, variantId, delta, txType, notes, referenceOrderId = null) => {
    // 1. Get current stock with row lock
    const lockRes = await client.query(
        'SELECT stock_quantity FROM product_variants WHERE variant_id = $1 FOR UPDATE',
        [variantId]
    );
    if (lockRes.rows.length === 0) throw Object.assign(new Error(`Variant ${variantId} not found`), { status: 404 });

    const before = lockRes.rows[0].stock_quantity;
    const after = Math.max(0, before + delta);

    if (delta < 0 && before + delta < 0) {
        throw Object.assign(
            new Error(`Insufficient stock for variant ${variantId}: has ${before}, requested ${Math.abs(delta)}`),
            { status: 422 }
        );
    }

    // 2. Update stock
    await client.query(
        `UPDATE product_variants SET stock_quantity = $1, updated_at = NOW() WHERE variant_id = $2`,
        [after, variantId]
    );

    // 3. Record transaction
    await client.query(
        `INSERT INTO inventory_transactions
            (variant_id, quantity_changed, transaction_type, reference_order_id, notes)
         VALUES ($1, $2, $3, $4, $5)`,
        [variantId, delta, txType, referenceOrderId || null, notes || null]
    );

    return { variant_id: variantId, before, delta, after };
};

// ── Use a pg Pool client for manual transaction control ──────────────────────
const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

/**
 * Restock: add positive quantity.
 * Body: [{ variant_id, quantity, notes? }, ...]  OR single object
 */
const restock = async (items) => {
    const list = Array.isArray(items) ? items : [items];
    if (!list.length) throw Object.assign(new Error('No items provided'), { status: 400 });

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const results = [];
        for (const item of list) {
            const { variant_id, quantity, notes } = item;
            if (!variant_id) throw Object.assign(new Error('variant_id is required'), { status: 400 });
            const qty = Number(quantity);
            if (!qty || qty <= 0) throw Object.assign(new Error(`quantity must be a positive number`), { status: 400 });
            const r = await _applyChange(client, variant_id, qty, 'restock', notes || 'Manual restock');
            results.push(r);
        }
        await client.query('COMMIT');
        return results;
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
};

/**
 * Adjust: positive or negative delta — for corrections/losses/returns.
 * transaction_type resolved from the sign and reason.
 */
const adjust = async (items) => {
    const list = Array.isArray(items) ? items : [items];
    if (!list.length) throw Object.assign(new Error('No items provided'), { status: 400 });

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const results = [];
        for (const item of list) {
            const { variant_id, delta, reason, notes } = item;
            if (!variant_id) throw Object.assign(new Error('variant_id is required'), { status: 400 });
            const d = Number(delta);
            if (isNaN(d) || d === 0) throw Object.assign(new Error('delta must be a non-zero number'), { status: 400 });

            // Pick transaction type
            let txType = 'adjustment';
            if (reason === 'cancel') txType = 'cancel';
            else if (reason === 'purchase') txType = 'purchase';
            else if (reason === 'restock') txType = 'restock';

            const r = await _applyChange(client, variant_id, d, txType, notes || reason || 'Manual adjustment');
            results.push(r);
        }
        await client.query('COMMIT');
        return results;
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
};

/**
 * Cancel: deduct stock for a cancelled order (positive quantity = amount to deduct).
 */
const cancel = async (items) => {
    const list = Array.isArray(items) ? items : [items];
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const results = [];
        for (const item of list) {
            const { variant_id, quantity, notes, reference_order_id } = item;
            if (!variant_id) throw Object.assign(new Error('variant_id is required'), { status: 400 });
            const qty = Number(quantity);
            if (!qty || qty <= 0) throw Object.assign(new Error('quantity must be positive'), { status: 400 });
            const r = await _applyChange(client, variant_id, -qty, 'cancel', notes || 'Order cancelled', reference_order_id);
            results.push(r);
        }
        await client.query('COMMIT');
        return results;
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
};

/**
 * Low stock alert list.
 */
const getLowStock = async () => {
    const r = await db.query(
        `SELECT
            pv.variant_id,
            pv.sku,
            pv.stock_quantity,
            pv.low_stock_threshold,
            pv.unit,
            pv.image_url,
            p.product_id,
            p.name AS product_name,
            c.name AS category_name
         FROM product_variants pv
         JOIN products p ON pv.product_id = p.product_id
         LEFT JOIN categories c ON p.category_id = c.category_id
         WHERE pv.stock_quantity <= pv.low_stock_threshold
           AND p.is_active = true
           AND pv.is_active = true
         ORDER BY pv.stock_quantity ASC`
    );
    return r.rows;
};

/**
 * Stock history for a variant (or all if variantId omitted).
 */
const getHistory = async (variantId = null, limit = 50) => {
    const cap = Math.min(Number(limit) || 50, 200);
    const params = variantId ? [variantId, cap] : [cap];
    const where = variantId ? 'WHERE it.variant_id = $1' : '';
    const r = await db.query(
        `SELECT
            it.transaction_id AS id,
            it.variant_id,
            it.quantity_changed AS quantity_change,
            it.transaction_type,
            it.reference_order_id,
            it.notes,
            it.created_at,
            pv.sku,
            p.name AS product_name
         FROM inventory_transactions it
         JOIN product_variants pv ON it.variant_id = pv.variant_id
         JOIN products p ON pv.product_id = p.product_id
         ${where}
         ORDER BY it.created_at DESC
         LIMIT $${params.length}`,
        params
    );
    return r.rows;
};

module.exports = { restock, adjust, cancel, getLowStock, getHistory };
