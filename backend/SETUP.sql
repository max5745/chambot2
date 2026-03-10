-- ══════════════════════════════════════════════════════════════════════════════
-- CHAMBOT — SUPABASE COMPLETE SETUP
-- รัน SQL นี้ใน Supabase Dashboard → SQL Editor → New Query
-- คัดลอกทั้งหมดแล้วกด Run เพียงครั้งเดียว
-- ══════════════════════════════════════════════════════════════════════════════


-- ════════════════════════════════════════
-- SECTION 1: EXTENSIONS
-- ════════════════════════════════════════

-- pgvector — สำหรับ semantic search (AI embedding)
CREATE EXTENSION IF NOT EXISTS vector;


-- ════════════════════════════════════════
-- SECTION 2: ENUM TYPES
-- ════════════════════════════════════════

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin','customer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE order_status AS ENUM ('pending','shipped','delivered','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('pending','paid','failed','refunded');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM ('qr','cod');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE shipment_status AS ENUM ('preparing','shipped','delivered','returned');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE inventory_transaction_type AS ENUM ('purchase','restock','adjustment','cancel');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ════════════════════════════════════════
-- SECTION 3: CORE TABLES
-- ════════════════════════════════════════

-- 3.1 USERS
CREATE TABLE IF NOT EXISTS public.users (
    id              INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    phone_number    VARCHAR(20) NOT NULL UNIQUE,
    full_name       VARCHAR(255),
    role            user_role NOT NULL DEFAULT 'customer',
    is_active       BOOLEAN DEFAULT true,
    suspended_by    INT REFERENCES public.users(id) ON DELETE SET NULL,
    suspended_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

-- 3.2 USER ADDRESSES
CREATE TABLE IF NOT EXISTS public.user_addresses (
    address_id      INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id         INT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    recipient_name  VARCHAR(255) NOT NULL,
    address_line    TEXT NOT NULL,
    province        VARCHAR(150),
    postal_code     VARCHAR(20),
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- 3.3 CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
    category_id     INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name            VARCHAR(255) NOT NULL UNIQUE,
    parent_id       INT REFERENCES public.categories(category_id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

-- 3.4 PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
    product_id      INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name            VARCHAR(255) NOT NULL CHECK (name <> ''),
    description     TEXT,
    slug            VARCHAR(255) UNIQUE,
    category_id     INT REFERENCES public.categories(category_id) ON DELETE SET NULL,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

-- 3.5 PRODUCT VARIANTS
CREATE TABLE IF NOT EXISTS public.product_variants (
    variant_id          INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    product_id          INT NOT NULL REFERENCES public.products(product_id) ON DELETE CASCADE,
    sku                 VARCHAR(100) UNIQUE NOT NULL,
    price               NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    stock_quantity      INT DEFAULT 0 CHECK (stock_quantity >= 0),
    reserved_quantity   INT DEFAULT 0 CHECK (reserved_quantity >= 0),
    image_url           TEXT,
    unit                VARCHAR(50),
    low_stock_threshold INT DEFAULT 5 CHECK (low_stock_threshold >= 0),
    is_main             BOOLEAN DEFAULT false,
    is_active           BOOLEAN DEFAULT true,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);

-- 3.6 CARTS
CREATE TABLE IF NOT EXISTS public.carts (
    cart_id     INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id     INT UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cart_items (
    cart_item_id    INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    cart_id         INT NOT NULL REFERENCES public.carts(cart_id) ON DELETE CASCADE,
    variant_id      INT NOT NULL REFERENCES public.product_variants(variant_id) ON DELETE CASCADE,
    quantity        INT NOT NULL CHECK (quantity > 0),
    UNIQUE(cart_id, variant_id)
);

-- 3.7 ORDERS
CREATE TABLE IF NOT EXISTS public.orders (
    order_id            INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id             INT REFERENCES public.users(id) ON DELETE SET NULL,
    total_amount        NUMERIC(10,2) NOT NULL CHECK (total_amount >= 0),
    status              order_status DEFAULT 'pending',
    payment_status      payment_status DEFAULT 'pending',
    tracking_number     VARCHAR(150),
    shipping_provider   VARCHAR(100),
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.order_items (
    order_item_id   INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    order_id        INT NOT NULL REFERENCES public.orders(order_id) ON DELETE CASCADE,
    variant_id      INT REFERENCES public.product_variants(variant_id) ON DELETE SET NULL,
    price           NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    quantity        INT NOT NULL CHECK (quantity > 0),
    UNIQUE(order_id, variant_id)
);

-- 3.8 ORDER STATUS LOGS
CREATE TABLE IF NOT EXISTS public.order_status_logs (
    log_id      INT PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    order_id    INT NOT NULL REFERENCES public.orders(order_id) ON DELETE CASCADE,
    status      VARCHAR(50) NOT NULL,
    changed_by  VARCHAR(100) DEFAULT 'system',
    note        TEXT,
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- 3.9 PAYMENTS
CREATE TABLE IF NOT EXISTS public.payments (
    payment_id      INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    order_id        INT NOT NULL REFERENCES public.orders(order_id) ON DELETE CASCADE,
    method          payment_method,
    transaction_ref TEXT,
    paid_at         TIMESTAMPTZ,
    status          payment_status DEFAULT 'pending',
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- 3.10 SHIPMENTS
CREATE TABLE IF NOT EXISTS public.shipments (
    shipment_id     INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    order_id        INT NOT NULL REFERENCES public.orders(order_id) ON DELETE CASCADE,
    address_id      INT REFERENCES public.user_addresses(address_id) ON DELETE SET NULL,
    address         TEXT,
    status          shipment_status DEFAULT 'preparing',
    shipped_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- 3.11 INVENTORY TRANSACTIONS (Stock Ledger)
CREATE TABLE IF NOT EXISTS public.inventory_transactions (
    transaction_id      INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    variant_id          INT NOT NULL REFERENCES public.product_variants(variant_id) ON DELETE CASCADE,
    quantity_changed    INT NOT NULL CHECK (quantity_changed <> 0),
    transaction_type    inventory_transaction_type NOT NULL,
    reference_order_id  INT REFERENCES public.orders(order_id) ON DELETE SET NULL,
    notes               TEXT,
    created_at          TIMESTAMPTZ DEFAULT now()
);

-- 3.12 PRODUCT EMBEDDINGS (Vector Search)
CREATE TABLE IF NOT EXISTS public.product_embeddings (
    product_id  INT PRIMARY KEY REFERENCES public.products(product_id) ON DELETE CASCADE,
    embedding   vector(768) NOT NULL,
    text_used   TEXT,
    updated_at  TIMESTAMPTZ DEFAULT now()
);


-- ════════════════════════════════════════
-- SECTION 4: COLUMN DESCRIPTIONS (COMMENTS)
-- ════════════════════════════════════════

-- ── users ────────────────────────────────────────────────────────────────────
COMMENT ON COLUMN public.users.id             IS 'Primary key — auto-increment user ID';
COMMENT ON COLUMN public.users.phone_number   IS 'เบอร์โทรศัพท์ผู้ใช้ (ใช้เป็น username สำหรับเข้าสู่ระบบ), ต้องไม่ซ้ำ';
COMMENT ON COLUMN public.users.full_name      IS 'ชื่อ-นามสกุลผู้ใช้ (optional)';
COMMENT ON COLUMN public.users.role           IS 'บทบาทของผู้ใช้: admin = ผู้ดูแลระบบ, customer = ลูกค้าทั่วไป';
COMMENT ON COLUMN public.users.is_active      IS 'true = บัญชีใช้งานได้ปกติ, false = ถูกระงับ';
COMMENT ON COLUMN public.users.suspended_by   IS 'FK → users.id ของ admin ที่สั่งระงับบัญชีนี้';
COMMENT ON COLUMN public.users.suspended_at   IS 'วันเวลาที่บัญชีถูกระงับ';
COMMENT ON COLUMN public.users.created_at     IS 'วันเวลาที่สร้างบัญชี';
COMMENT ON COLUMN public.users.updated_at     IS 'วันเวลาที่แก้ไขข้อมูลล่าสุด';

-- ── user_addresses ───────────────────────────────────────────────────────────
COMMENT ON COLUMN public.user_addresses.address_id      IS 'Primary key — auto-increment address ID';
COMMENT ON COLUMN public.user_addresses.user_id         IS 'FK → users.id เจ้าของที่อยู่นี้';
COMMENT ON COLUMN public.user_addresses.recipient_name  IS 'ชื่อผู้รับสินค้า (อาจต่างจากชื่อผู้ใช้)';
COMMENT ON COLUMN public.user_addresses.address_line    IS 'ที่อยู่แบบเต็ม เช่น บ้านเลขที่ ถนน แขวง เขต';
COMMENT ON COLUMN public.user_addresses.province        IS 'จังหวัด';
COMMENT ON COLUMN public.user_addresses.postal_code     IS 'รหัสไปรษณีย์';
COMMENT ON COLUMN public.user_addresses.created_at      IS 'วันเวลาที่บันทึกที่อยู่';

-- ── categories ───────────────────────────────────────────────────────────────
COMMENT ON COLUMN public.categories.category_id IS 'Primary key — auto-increment category ID';
COMMENT ON COLUMN public.categories.name        IS 'ชื่อหมวดหมู่สินค้า ต้องไม่ซ้ำ';
COMMENT ON COLUMN public.categories.parent_id   IS 'FK → categories.category_id สำหรับหมวดหมู่ย่อย (subcategory), NULL = หมวดหมู่หลัก';
COMMENT ON COLUMN public.categories.created_at  IS 'วันเวลาที่สร้างหมวดหมู่';
COMMENT ON COLUMN public.categories.updated_at  IS 'วันเวลาที่แก้ไขล่าสุด';

-- ── products ─────────────────────────────────────────────────────────────────
COMMENT ON COLUMN public.products.product_id   IS 'Primary key — auto-increment product ID';
COMMENT ON COLUMN public.products.name         IS 'ชื่อสินค้า ต้องไม่ว่าง';
COMMENT ON COLUMN public.products.description  IS 'คำอธิบายสินค้า (optional)';
COMMENT ON COLUMN public.products.slug         IS 'URL-friendly identifier ของสินค้า เช่น ''vitamin-c-1000mg'', ต้องไม่ซ้ำ';
COMMENT ON COLUMN public.products.category_id  IS 'FK → categories.category_id หมวดหมู่ของสินค้า';
COMMENT ON COLUMN public.products.is_active    IS 'true = สินค้าแสดงในระบบ, false = ซ่อน/ลบแบบ soft delete';
COMMENT ON COLUMN public.products.created_at   IS 'วันเวลาที่สร้างสินค้า';
COMMENT ON COLUMN public.products.updated_at   IS 'วันเวลาที่แก้ไขสินค้าล่าสุด';

-- ── product_variants ─────────────────────────────────────────────────────────
COMMENT ON COLUMN public.product_variants.variant_id          IS 'Primary key — auto-increment variant ID';
COMMENT ON COLUMN public.product_variants.product_id          IS 'FK → products.product_id สินค้าที่ variant นี้สังกัด';
COMMENT ON COLUMN public.product_variants.sku                 IS 'Stock Keeping Unit — รหัสสินค้าประจำ variant, ต้องไม่ซ้ำทั้งระบบ';
COMMENT ON COLUMN public.product_variants.price               IS 'ราคาขายของ variant นี้ (บาท), ต้องไม่ติดลบ';
COMMENT ON COLUMN public.product_variants.stock_quantity      IS 'จำนวนสต็อกที่มีอยู่ในคลัง, ปรับเปลี่ยนผ่าน inventory_transactions เท่านั้น';
COMMENT ON COLUMN public.product_variants.image_url           IS 'URL รูปภาพของ variant นี้';
COMMENT ON COLUMN public.product_variants.unit                IS 'หน่วยของสินค้า เช่น กระป๋อง, ชิ้น, กล่อง';
COMMENT ON COLUMN public.product_variants.low_stock_threshold IS 'จำนวนขั้นต่ำที่ถือว่าสต็อกใกล้หมด ใช้สำหรับแจ้งเตือน low stock alert';
COMMENT ON COLUMN public.product_variants.is_main             IS 'true = variant หลักของสินค้า (ใช้แสดงรูปและราคาตั้งต้น), มีได้ variant เดียวต่อสินค้า';
COMMENT ON COLUMN public.product_variants.is_active           IS 'true = variant นี้แสดงในระบบ, false = ซ่อน';
COMMENT ON COLUMN public.product_variants.created_at          IS 'วันเวลาที่สร้าง variant';
COMMENT ON COLUMN public.product_variants.updated_at          IS 'วันเวลาที่แก้ไข variant ล่าสุด';

-- ── carts / cart_items ───────────────────────────────────────────────────────
COMMENT ON COLUMN public.carts.cart_id    IS 'Primary key — auto-increment cart ID';
COMMENT ON COLUMN public.carts.user_id    IS 'FK → users.id เจ้าของตะกร้า (1 user มีได้ 1 cart เท่านั้น)';
COMMENT ON COLUMN public.carts.created_at IS 'วันเวลาที่สร้างตะกร้า';
COMMENT ON COLUMN public.carts.updated_at IS 'วันเวลาที่แก้ไขตะกร้าล่าสุด';

COMMENT ON COLUMN public.cart_items.cart_item_id IS 'Primary key — auto-increment cart item ID';
COMMENT ON COLUMN public.cart_items.cart_id      IS 'FK → carts.cart_id ตะกร้าที่ item นี้อยู่';
COMMENT ON COLUMN public.cart_items.variant_id   IS 'FK → product_variants.variant_id สินค้า variant ที่เพิ่มในตะกร้า';
COMMENT ON COLUMN public.cart_items.quantity     IS 'จำนวนสินค้าที่เพิ่มในตะกร้า ต้องมากกว่า 0';

-- ── orders / order_items ─────────────────────────────────────────────────────
COMMENT ON COLUMN public.orders.order_id          IS 'Primary key — auto-increment order ID';
COMMENT ON COLUMN public.orders.user_id           IS 'FK → users.id ผู้สั่งซื้อ (NULL ได้ หากบัญชีถูกลบ)';
COMMENT ON COLUMN public.orders.total_amount      IS 'ยอดรวมของ order (บาท) คำนวณจาก order_items';
COMMENT ON COLUMN public.orders.status            IS 'สถานะ order: pending → shipped → delivered | cancelled';
COMMENT ON COLUMN public.orders.payment_status    IS 'สถานะการชำระเงิน: pending, paid, failed, refunded';
COMMENT ON COLUMN public.orders.tracking_number   IS 'เลขพัสดุสำหรับติดตามการจัดส่ง (บันทึกเมื่อ admin อัปเดตสถานะเป็น shipped)';
COMMENT ON COLUMN public.orders.shipping_provider IS 'ชื่อบริษัทขนส่ง เช่น Kerry, Flash, Thailand Post';
COMMENT ON COLUMN public.orders.created_at        IS 'วันเวลาที่สร้าง order';
COMMENT ON COLUMN public.orders.updated_at        IS 'วันเวลาที่แก้ไข order ล่าสุด';

COMMENT ON COLUMN public.order_items.order_item_id IS 'Primary key — auto-increment order item ID';
COMMENT ON COLUMN public.order_items.order_id      IS 'FK → orders.order_id คำสั่งซื้อที่ item นี้สังกัด';
COMMENT ON COLUMN public.order_items.variant_id    IS 'FK → product_variants.variant_id สินค้า variant ที่สั่ง (NULL ได้ หาก variant ถูกลบ)';
COMMENT ON COLUMN public.order_items.price         IS 'ราคาขาย ณ เวลาที่สั่งซื้อ (snapshot — ไม่เปลี่ยนตามราคาสินค้าที่แก้ไขในภายหลัง)';
COMMENT ON COLUMN public.order_items.quantity      IS 'จำนวนสินค้าที่สั่งซื้อ';

-- ── order_status_logs ────────────────────────────────────────────────────────
COMMENT ON COLUMN public.order_status_logs.log_id     IS 'Primary key — auto-increment log ID';
COMMENT ON COLUMN public.order_status_logs.order_id   IS 'FK → orders.order_id คำสั่งซื้อที่ log นี้เกี่ยวข้อง';
COMMENT ON COLUMN public.order_status_logs.status     IS 'สถานะที่ถูกบันทึก เช่น pending, confirmed, shipped';
COMMENT ON COLUMN public.order_status_logs.changed_by IS 'ผู้ที่เปลี่ยนสถานะ เช่น ''system'', ''admin'', หรือ phone number ของ admin';
COMMENT ON COLUMN public.order_status_logs.note       IS 'หมายเหตุเพิ่มเติม เช่น เหตุผลยกเลิก';
COMMENT ON COLUMN public.order_status_logs.created_at IS 'วันเวลาที่บันทึก log';

-- ── payments ─────────────────────────────────────────────────────────────────
COMMENT ON COLUMN public.payments.payment_id IS 'Primary key — auto-increment payment ID';
COMMENT ON COLUMN public.payments.order_id   IS 'FK → orders.order_id คำสั่งซื้อที่ชำระเงินนี้';
COMMENT ON COLUMN public.payments.method     IS 'วิธีชำระเงิน: qr = QR Code พร้อมเพย์, cod = เก็บเงินปลายทาง';
COMMENT ON COLUMN public.payments.paid_at    IS 'วันเวลาที่ชำระเงินสำเร็จ (NULL = ยังไม่ชำระ)';
COMMENT ON COLUMN public.payments.status     IS 'สถานะการชำระ: pending, paid, failed, refunded';
COMMENT ON COLUMN public.payments.created_at IS 'วันเวลาที่สร้างรายการชำระเงิน';

-- ── shipments ─────────────────────────────────────────────────────────────────
COMMENT ON COLUMN public.shipments.shipment_id IS 'Primary key — auto-increment shipment ID';
COMMENT ON COLUMN public.shipments.order_id    IS 'FK → orders.order_id คำสั่งซื้อที่จัดส่ง';
COMMENT ON COLUMN public.shipments.address_id  IS 'FK → user_addresses.address_id ที่อยู่ที่บันทึกไว้ในระบบ (NULL หากใช้ address แบบ text)';
COMMENT ON COLUMN public.shipments.address     IS 'ที่อยู่จัดส่งแบบ plain text (ใช้เมื่อ address_id เป็น NULL)';
COMMENT ON COLUMN public.shipments.status      IS 'สถานะการจัดส่ง: preparing, shipped, delivered, returned';
COMMENT ON COLUMN public.shipments.shipped_at  IS 'วันเวลาที่ส่งสินค้าออก';
COMMENT ON COLUMN public.shipments.created_at  IS 'วันเวลาที่สร้างรายการจัดส่ง';

-- ── inventory_transactions ────────────────────────────────────────────────────
COMMENT ON COLUMN public.inventory_transactions.transaction_id     IS 'Primary key — auto-increment transaction ID';
COMMENT ON COLUMN public.inventory_transactions.variant_id         IS 'FK → product_variants.variant_id สินค้า variant ที่เคลื่อนไหวสต็อก';
COMMENT ON COLUMN public.inventory_transactions.quantity_changed   IS 'จำนวนสต็อกที่เปลี่ยน: บวก = เพิ่มสต็อก, ลบ = ตัดสต็อก, ต้องไม่เป็น 0';
COMMENT ON COLUMN public.inventory_transactions.transaction_type   IS 'ประเภทการเคลื่อนไหว: purchase=ลูกค้าซื้อ, restock=รับสินค้าเข้า, adjustment=ปรับปรุงสต็อก, cancel=ยกเลิกคืนสต็อก';
COMMENT ON COLUMN public.inventory_transactions.reference_order_id IS 'FK → orders.order_id อ้างอิง order ที่ทำให้เกิดการเคลื่อนไหวนี้ (NULL สำหรับ restock/adjustment)';
COMMENT ON COLUMN public.inventory_transactions.notes              IS 'หมายเหตุประกอบรายการ';
COMMENT ON COLUMN public.inventory_transactions.created_at         IS 'วันเวลาที่บันทึกรายการ';

-- ── product_embeddings ────────────────────────────────────────────────────────
COMMENT ON COLUMN public.product_embeddings.product_id IS 'Primary key + FK → products.product_id (1 ต่อ 1 กับสินค้า)';
COMMENT ON COLUMN public.product_embeddings.embedding  IS 'Vector embedding ขนาด 384 มิติ สำหรับ semantic search ด้วย pgvector';
COMMENT ON COLUMN public.product_embeddings.text_used  IS 'ข้อความที่ใช้สร้าง embedding เช่น ชื่อ+คำอธิบายสินค้า';
COMMENT ON COLUMN public.product_embeddings.updated_at IS 'วันเวลาที่อัปเดต embedding ล่าสุด';


-- ════════════════════════════════════════
-- SECTION 5: INDEXES
-- ════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_users_role            ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active       ON public.users(is_active);
CREATE INDEX IF NOT EXISTS idx_orders_status         ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_user_id        ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at     ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_status_logs_order_id ON public.order_status_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id  ON public.order_items(order_id);

-- HNSW index for fast cosine similarity (pgvector)
CREATE INDEX IF NOT EXISTS idx_product_embeddings_hnsw
    ON public.product_embeddings
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);


-- ════════════════════════════════════════
-- SECTION 5: VIEWS
-- ════════════════════════════════════════

-- 5.1 Product list view (used by GET /api/products)
CREATE OR REPLACE VIEW public.product_list_view AS
SELECT
    p.product_id,
    p.name AS product_name,
    p.description,
    p.slug,
    p.is_active,
    p.category_id,
    p.created_at,
    p.updated_at,
    c.name AS category_name,
    COUNT(pv.variant_id)::int AS variant_count,
    COALESCE(SUM(pv.stock_quantity), 0)::int AS total_stock,
    MIN(pv.price) AS min_price,
    MAX(pv.price) AS max_price,
    MIN(pv.low_stock_threshold) AS low_stock_threshold,
    (
        SELECT pv2.image_url
        FROM product_variants pv2
        WHERE pv2.product_id = p.product_id AND pv2.is_main = true AND pv2.is_active = true
        LIMIT 1
    ) AS image_url
FROM public.products p
LEFT JOIN public.categories c ON p.category_id = c.category_id
LEFT JOIN public.product_variants pv
    ON pv.product_id = p.product_id AND pv.is_active = true
GROUP BY p.product_id, c.name, c.category_id;

-- 5.2 Order list view (used by admin orders API)
CREATE OR REPLACE VIEW public.order_list_view AS
SELECT
    o.order_id,
    o.user_id,
    o.total_amount,
    o.status,
    o.payment_status,
    o.tracking_number,
    o.shipping_provider,
    o.created_at,
    o.updated_at,
    s.status          AS shipment_status,
    s.tracking_number AS shipment_tracking,
    s.address,
    u.full_name       AS customer_name,
    u.phone_number
FROM public.orders o
LEFT JOIN public.shipments s ON o.order_id = s.order_id
LEFT JOIN public.users u ON o.user_id = u.id;


-- ════════════════════════════════════════
-- SECTION 6: FUNCTIONS
-- ════════════════════════════════════════

-- Semantic search helper: returns product_id ranked by cosine similarity
-- Usage: SELECT * FROM search_products_by_embedding('[0.1,0.2,...]'::vector, 10);
CREATE OR REPLACE FUNCTION search_products_by_embedding(
    query_embedding vector(768),
    match_count     INT DEFAULT 10
)
RETURNS TABLE (
    product_id  INT,
    similarity  FLOAT
)
LANGUAGE sql STABLE
AS $$
    SELECT
        pe.product_id,
        1 - (pe.embedding <=> query_embedding) AS similarity
    FROM public.product_embeddings pe
    JOIN public.products p ON p.product_id = pe.product_id
    WHERE p.is_active = true
    ORDER BY pe.embedding <=> query_embedding
    LIMIT match_count;
$$;
