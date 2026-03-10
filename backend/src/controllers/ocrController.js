const Groq = require("groq-sdk");
const multer = require("multer");
const db = require("../config/supabaseClient");
const embeddingService = require("../services/embeddingService");
const productService = require("../services/productService");

// ─── Multer (in-memory for OCR) ─────────────────────────────────────────────
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    fileFilter: (req, file, cb) => {
        const ok = /jpeg|jpg|png|webp|gif/.test(file.mimetype);
        ok ? cb(null, true) : cb(new Error("Only image files are allowed"));
    },
});

// ─── Groq client ────────────────────────────────────────────────────────────
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ─── OCR Scan ───────────────────────────────────────────────────────────────
const scanImage = async (req, res) => {
    // Diagnostic logging
    console.log(`[${new Date().toISOString()}] 📥 OCR Request received`);
    if (!req.file) {
        console.warn("⚠️ OCR Request missing file. Body:", req.body);
        return res.status(400).json({ success: false, message: "กรุณาอัปโหลดรูปภาพ" });
    }
    console.log(`📸 File: "${req.file.originalname}" Size: ${req.file.size} bytes`);

    try {
        const now = new Date().toISOString();
        const base64Image = req.file.buffer.toString("base64");
        const dataUrl = `data:${req.file.mimetype};base64,${base64Image}`;

        const prompt = `
Timestamp: ${now}
วิเคราะห์รูปภาพนี้และดึงข้อมูลสินค้าออกมาให้ได้มากที่สุด
ถ้าเป็นใบเสร็จ รายการสั่งซื้อ หรือรูปสินค้าเดี่ยว:

1. ดึงชื่อสินค้า (name): 
   - ให้พยายามหาทั้งภาษาไทยและภาษาอังกฤษ (ถ้ามี) เช่น "โอเลย์ รีเจนเนอริส / Olay Regenerist"
   - ถ้ามีชื่อในรูปเป็นภาษาอังกฤษอย่างเดียว แต่คุณรู้คำแปลภาษาไทย ให้ใส่มาด้วย
2. แยกชื่อแบรนด์ (brand): ถ้าพบ
3. ข้อมูลอื่น: sku, price, stock_quantity, unit, category_name

ตอบเป็น JSON array เท่านั้น:
[
  {
    "name": "ชื่อสินค้า (ไทย/Eng)",
    "brand": "ชื่อแบรนด์ หรือ null",
    "description": "รายละเอียดสั้นๆ หรือ null",
    "sku": "รหัสสินค้าหรือบาร์โค้ด หรือ null",
    "price": ตัวเลขราคา (number หรือ null),
    "stock_quantity": จำนวน (number, default 1),
    "unit": "หน่วย เช่น ชิ้น, กล่อง หรือ null",
    "category_name": "หมวดหมู่ หรือ null"
  }
]

กฎ:
- ห้ามตอบอย่างอื่นนอกจาก JSON
- ถ้าอ่านราคาไม่ได้ให้ใส่ null
- stock_quantity default เป็น 1
- ถ้าไม่มีสินค้าเลย ให้ตอบ []
`;

        const response = await groq.chat.completions.create({
            model: "meta-llama/llama-4-scout-17b-16e-instruct",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: prompt },
                        { type: "image_url", image_url: { url: dataUrl } },
                    ],
                },
            ],
            temperature: 0.2,
            max_tokens: 2048,
        });

        const rawText = response.choices[0]?.message?.content?.trim() || "";

        // Parse JSON (strip markdown fences if present)
        let jsonText = rawText;
        const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch) jsonText = jsonMatch[1];

        let products;
        try {
            products = JSON.parse(jsonText);
        } catch (parseErr) {
            console.error("❌ OCR JSON Parse Error:", parseErr.message);
            console.log("Raw text from AI:", rawText);
            return res.status(422).json({
                success: false,
                message: "ไม่สามารถอ่านข้อมูลสินค้าจากรูปภาพได้ กรุณาลองด้วยรูปภาพอื่น",
                raw: rawText,
            });
        }

        if (!Array.isArray(products) || products.length === 0) {
            return res.status(200).json({
                success: true,
                data: [],
                message: "ไม่พบรายการสินค้าในรูปภาพ",
            });
        }

        // ─── Enrich: check if SKU or name already exists ────────────────────
        const enriched = await Promise.all(products.map(async (p) => {
            let existingVariant = null;

            // 1. Try match by SKU first
            if (p.sku) {
                try {
                    const r = await db.query(
                        `SELECT pv.variant_id, pv.sku, pv.stock_quantity, p.name as product_name, p.product_id
                         FROM product_variants pv
                         JOIN products p ON p.product_id = pv.product_id
                         WHERE pv.sku = $1 LIMIT 1`,
                        [p.sku]
                    );
                    if (r.rows.length > 0) existingVariant = r.rows[0];
                } catch (skuErr) {
                    console.error("SKU match error:", skuErr.message);
                }
            }

            // 2. Fallback: match by product name (case-insensitive + normalized)
            if (!existingVariant && p.name) {
                try {
                    const r = await db.query(
                        `SELECT pv.variant_id, pv.sku, pv.stock_quantity, p.name as product_name, p.product_id
                         FROM product_variants pv
                         JOIN products p ON p.product_id = pv.product_id
                         WHERE REPLACE(LOWER(p.name), ' ', '') = REPLACE(LOWER($1), ' ', '')
                         OR LOWER(TRIM(p.name)) = LOWER(TRIM($1))
                         ORDER BY pv.variant_id ASC LIMIT 1`,
                        [p.name]
                    );
                    if (r.rows.length > 0) existingVariant = r.rows[0];
                } catch (nameErr) {
                    console.error("Name match error:", nameErr.message);
                }
            }

            // 3. Fallback: Semantic Match (AI Matching)
            if (!existingVariant && p.name) {
                try {
                    const vec = await embeddingService.embedQuery(p.name);
                    const vecStr = `[${vec.join(",")}]`;
                    const r = await db.query(
                        `SELECT pv.variant_id, pv.sku, pv.stock_quantity, p.name as product_name, p.product_id,
                                1 - (pe.embedding <=> $1::vector) as similarity
                         FROM product_embeddings pe
                         JOIN products p ON p.product_id = pe.product_id
                         JOIN product_variants pv ON pv.product_id = p.product_id
                         WHERE p.is_active = true
                         AND (1 - (pe.embedding <=> $1::vector)) > 0.75
                         ORDER BY similarity DESC LIMIT 1`,
                        [vecStr]
                    );
                    if (r.rows.length > 0) {
                        existingVariant = r.rows[0];
                        console.log(`🤖 OCR Semantic Match: "${p.name}" -> "${existingVariant.product_name}" (sim: ${Number(existingVariant.similarity).toFixed(3)})`);
                    }
                } catch (err) {
                    console.error("Semantic OCR match failing (silently falling back):", err.message);
                }
            }

            // 4. If still no match, create a NEW product automatically
            if (!existingVariant) {
                try {
                    console.log(`✨ OCR creating new product: "${p.name}"`);
                    const newProd = await productService.create({
                        name: p.name,
                        description: p.description || `Auto-created from OCR scan (Brand: ${p.brand || 'Unknown'})`,
                        category_id: null,
                        is_active: true,
                        variants: [{
                            sku: p.sku || `OCR-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                            price: p.price || 0,
                            stock_quantity: 0,
                            unit: p.unit,
                            is_main: true
                        }]
                    });

                    // Fetch the variant for consistent data
                    const r = await db.query(
                        `SELECT pv.variant_id, pv.sku, pv.stock_quantity, p.name as product_name, p.product_id
                         FROM product_variants pv
                         JOIN products p ON p.product_id = pv.product_id
                         WHERE p.product_id = $1 LIMIT 1`,
                        [newProd.product_id]
                    );
                    if (r.rows.length > 0) existingVariant = r.rows[0];
                } catch (createErr) {
                    console.error(`❌ OCR auto-creation failed for "${p.name}":`, createErr.message);
                }
            }

            return {
                ...p,
                is_new: !existingVariant,
                existing_variant_id: existingVariant?.variant_id || null,
                existing_variant_stock: existingVariant?.stock_quantity ?? null,
                existing_product_name: existingVariant?.product_name || null,
                price: existingVariant ? null : p.price,
            };
        }));

        res.status(200).json({ success: true, data: enriched });
    } catch (globalErr) {
        console.error("OCR Global Error:", globalErr);
        res.status(500).json({
            success: false,
            message: globalErr.message || "เกิดข้อผิดพลาดในการวิเคราะห์รูปภาพ",
        });
    }
};

module.exports = { upload, scanImage };