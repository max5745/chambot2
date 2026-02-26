const db = require("../config/supabaseClient");

const updateVariant = async (req, res) => {
    try {
        const { id } = req.params;
        const { sku, price, stock_quantity, image_url, unit, low_stock_threshold, is_active } = req.body;

        const query = `
            UPDATE product_variants 
            SET sku = $1, price = $2, stock_quantity = $3, image_url = $4, unit = $5, low_stock_threshold = $6, is_active = $7, updated_at = NOW()
            WHERE variant_id = $8
            RETURNING *
        `;
        const result = await db.query(query, [sku, price, stock_quantity, image_url, unit, low_stock_threshold, is_active, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Variant not found" });
        }

        res.status(200).json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const adjustStock = async (req, res) => {
    try {
        const { id } = req.params;
        const { adjustment, delta, low_stock_threshold } = req.body;
        const deltaVal = delta !== undefined ? delta : adjustment;

        let query = "UPDATE product_variants SET updated_at = NOW()";
        const params = [];

        if (deltaVal !== undefined) {
            params.push(parseInt(deltaVal));
            query += `, stock_quantity = GREATEST(0, stock_quantity + $${params.length})`;
        }

        if (low_stock_threshold !== undefined) {
            params.push(parseInt(low_stock_threshold));
            query += `, low_stock_threshold = $${params.length}`;
        }

        params.push(id);
        query += ` WHERE variant_id = $${params.length} RETURNING *`;

        const result = await db.query(query, params);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Variant not found" });
        }

        res.status(200).json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteVariant = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query("DELETE FROM product_variants WHERE variant_id = $1", [id]);
        res.status(200).json({
            success: true,
            message: "Variant deleted successfully"
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    updateVariant,
    adjustStock,
    deleteVariant
};

