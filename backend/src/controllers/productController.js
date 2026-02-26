const db = require("../config/supabaseClient");

const getLowStockProducts = async (req, res) => {
    try {
        const query = `
            SELECT 
                p.name as product_name,
                pv.variant_id,
                pv.sku,
                pv.stock_quantity,
                pv.low_stock_threshold,
                pv.image_url,
                p.product_id
            FROM product_variants pv
            JOIN products p ON pv.product_id = p.product_id

            WHERE pv.stock_quantity <= pv.low_stock_threshold
            ORDER BY pv.stock_quantity ASC
        `;
        const result = await db.query(query);
        res.status(200).json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all products (using the view for summary info)
const getAllProducts = async (req, res) => {

    try {
        const { category, search } = req.query;
        let query = "SELECT * FROM product_list_view";
        const params = [];

        if (category || search) {
            query += " WHERE";
            if (category) {
                params.push(category);
                query += ` category_id = $${params.length}`;
            }
            if (search) {
                if (category) query += " AND";
                params.push(`%${search}%`);
                query += ` product_name ILIKE $${params.length}`;
            }
        }

        query += " ORDER BY product_id DESC";

        const result = await db.query(query, params);
        res.status(200).json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get product with all its variants
const getProductById = async (req, res) => {
    try {
        const { id } = req.params;

        // Get product details
        const productResult = await db.query(
            "SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.category_id WHERE p.product_id = $1",
            [id]
        );

        if (productResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        // Get variants
        const variantsResult = await db.query(
            "SELECT * FROM product_variants WHERE product_id = $1 ORDER BY variant_id ASC",
            [id]
        );

        const product = productResult.rows[0];
        product.product_name = product.name; // For consistency with view
        product.variants = variantsResult.rows;

        res.status(200).json({
            success: true,
            data: product
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── helper: ensure SKU is unique ──────────────────────────────────────────
const generateUniqueSku = async (base) => {
    // If base is provided try it first, else start with timestamp
    const candidates = base
        ? [base, `${base}-${Date.now()}`, `${base}-${Date.now()}${Math.floor(Math.random() * 1000)}`]
        : [`SKU-${Date.now()}`, `SKU-${Date.now()}${Math.floor(Math.random() * 1000)}`];

    for (const candidate of candidates) {
        const res = await db.query("SELECT 1 FROM product_variants WHERE sku = $1 LIMIT 1", [candidate]);
        if (res.rows.length === 0) return candidate;
    }
    // Absolute fallback
    return `SKU-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
};

// Create product and its variants
const createProduct = async (req, res) => {
    try {
        const { name, description, category_id, is_active, variants } = req.body;

        await db.query("BEGIN");

        const productQuery = `
            INSERT INTO products (name, description, category_id, is_active)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        const productResult = await db.query(productQuery, [name, description, category_id, is_active]);
        const newProduct = productResult.rows[0];

        if (variants && Array.isArray(variants)) {
            for (const variant of variants) {
                // Auto-generate SKU when empty/null to avoid unique constraint violation
                const sku = (variant.sku && variant.sku.trim())
                    ? await generateUniqueSku(variant.sku.trim())
                    : await generateUniqueSku(null);

                const variantQuery = `
                    INSERT INTO product_variants (product_id, sku, price, stock_quantity, image_url, unit, low_stock_threshold, is_main)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                `;
                await db.query(variantQuery, [
                    newProduct.product_id,
                    sku,
                    variant.price,
                    variant.stock_quantity || 0,
                    variant.image_url,
                    variant.unit,
                    variant.low_stock_threshold || 5,
                    variant.is_main || false
                ]);
            }
        }

        await db.query("COMMIT");

        res.status(201).json({
            success: true,
            data: newProduct
        });
    } catch (error) {
        await db.query("ROLLBACK");
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, category_id, is_active, variants } = req.body;

        await db.query("BEGIN");

        // 1. Update Product info
        const productQuery = `
            UPDATE products 
            SET name = $1, description = $2, category_id = $3, is_active = $4, updated_at = NOW()
            WHERE product_id = $5
            RETURNING *
        `;
        const result = await db.query(productQuery, [name, description, category_id, is_active, id]);

        if (result.rows.length === 0) {
            await db.query("ROLLBACK");
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        // 2. Manage Variants
        if (variants && Array.isArray(variants)) {
            // Get existing variant IDs
            const existingVariantsRes = await db.query("SELECT variant_id FROM product_variants WHERE product_id = $1", [id]);
            const existingIds = existingVariantsRes.rows.map(v => v.variant_id);
            const currentIds = variants.map(v => v.variant_id).filter(vid => vid);

            // Delete variants not in the current request
            const idsToDelete = existingIds.filter(eid => !currentIds.includes(eid));
            if (idsToDelete.length > 0) {
                await db.query("DELETE FROM product_variants WHERE variant_id = ANY($1)", [idsToDelete]);
            }

            // Update or Insert variants
            for (const variant of variants) {
                if (variant.variant_id) {
                    // Update existing
                    const updateVarQuery = `
                        UPDATE product_variants 
                        SET sku = $1, price = $2, stock_quantity = $3, image_url = $4, unit = $5, low_stock_threshold = $6, is_main = $7, updated_at = NOW()
                        WHERE variant_id = $8 AND product_id = $9
                    `;
                    await db.query(updateVarQuery, [
                        variant.sku, variant.price, variant.stock_quantity,
                        variant.image_url, variant.unit, variant.low_stock_threshold,
                        variant.is_main || false, variant.variant_id, id
                    ]);
                } else {
                    // Insert new
                    const insertVarQuery = `
                        INSERT INTO product_variants (product_id, sku, price, stock_quantity, image_url, unit, low_stock_threshold, is_main)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    `;
                    await db.query(insertVarQuery, [
                        id, variant.sku, variant.price, variant.stock_quantity,
                        variant.image_url, variant.unit, variant.low_stock_threshold,
                        variant.is_main || false
                    ]);
                }
            }
        }

        await db.query("COMMIT");

        res.status(200).json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        await db.query("ROLLBACK");
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query("DELETE FROM products WHERE product_id = $1 RETURNING *", [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        res.status(200).json({
            success: true,
            message: "Product deleted successfully"
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get ALL variants (for stock management page)
const getAllVariants = async (req, res) => {
    try {
        const query = `
            SELECT
                pv.variant_id,
                pv.sku,
                pv.price,
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
            WHERE p.is_active = true
            ORDER BY p.name ASC, pv.sku ASC
        `;
        const result = await db.query(query);
        res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Adjust stock by delta (positive = add, negative = subtract)
const adjustStock = async (req, res) => {
    try {
        const { variantId } = req.params;
        const { delta } = req.body;

        if (delta === undefined || isNaN(Number(delta))) {
            return res.status(400).json({ success: false, message: 'delta is required and must be a number' });
        }

        const result = await db.query(
            `UPDATE product_variants
             SET stock_quantity = GREATEST(0, stock_quantity + $1), updated_at = NOW()
             WHERE variant_id = $2
             RETURNING *`,
            [Number(delta), variantId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Variant not found' });
        }

        res.status(200).json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const setMainVariant = async (req, res) => {
    try {
        const { variantId } = req.params;

        await db.query("BEGIN");

        // 1. Get product_id for this variant
        const findRes = await db.query("SELECT product_id FROM product_variants WHERE variant_id = $1", [variantId]);
        if (findRes.rows.length === 0) {
            await db.query("ROLLBACK");
            return res.status(404).json({ success: false, message: "Variant not found" });
        }
        const productId = findRes.rows[0].product_id;

        // 2. Set all variants of this product to is_main = false
        await db.query("UPDATE product_variants SET is_main = false WHERE product_id = $1", [productId]);

        // 3. Set target variant to is_main = true
        await db.query("UPDATE product_variants SET is_main = true WHERE variant_id = $1", [variantId]);

        await db.query("COMMIT");

        res.status(200).json({ success: true, message: "Main variant updated" });
    } catch (error) {
        await db.query("ROLLBACK");
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getAllProducts,
    getLowStockProducts,
    getAllVariants,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    adjustStock,
    setMainVariant
};


