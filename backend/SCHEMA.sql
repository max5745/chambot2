-- USER ROLE
CREATE TYPE user_role AS ENUM ('admin','customer');

-- ORDER STATUS
CREATE TYPE order_status AS ENUM
('pending','confirmed','shipped','delivered','cancelled');

-- PAYMENT STATUS
CREATE TYPE payment_status AS ENUM
('pending','paid','failed','refunded');

-- PAYMENT METHOD
CREATE TYPE payment_method AS ENUM
('qr','cod');

-- SHIPMENT STATUS
CREATE TYPE shipment_status AS ENUM
('preparing','shipped','delivered','returned');

-- INVENTORY TRANSACTION TYPE
CREATE TYPE inventory_transaction_type AS ENUM
('purchase','restock','adjustment','cancel');

-- ==========================================
-- 1. USERS & ADDRESSES
-- ==========================================
CREATE TABLE public.users (
  id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  phone_number VARCHAR(20) NOT NULL UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'customer',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);


CREATE TABLE public.user_addresses (
  address_id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id INT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  recipient_name VARCHAR(255) NOT NULL,
  address_line TEXT NOT NULL,
  province VARCHAR(150),
  postal_code VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 2. PRODUCTS & CATEGORIES
-- ==========================================
CREATE TABLE public.categories (
  category_id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name VARCHAR(255) NOT NULL,
  parent_id INT REFERENCES public.categories(category_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(name)
);

CREATE TABLE public.products (
  product_id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name VARCHAR(255) NOT NULL CHECK (name <> ''),
  description TEXT,
  slug VARCHAR(255) UNIQUE,
  category_id INT REFERENCES public.categories(category_id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.product_variants (
  variant_id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  product_id INT NOT NULL REFERENCES public.products(product_id) ON DELETE CASCADE,
  sku VARCHAR(100) UNIQUE NOT NULL,
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  stock_quantity INT DEFAULT 0 CHECK (stock_quantity >= 0),
  reserved_quantity INT DEFAULT 0 CHECK (reserved_quantity >= 0),
  image_url TEXT,
  unit VARCHAR(50),
  low_stock_threshold INT DEFAULT 5 CHECK (low_stock_threshold >= 0),
  is_main BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
-- ==========================================
-- 3. CARTS
-- ==========================================
CREATE TABLE public.carts (
  cart_id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id INT UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.cart_items (
  cart_item_id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  cart_id INT NOT NULL REFERENCES public.carts(cart_id) ON DELETE CASCADE,
  variant_id INT NOT NULL REFERENCES public.product_variants(variant_id) ON DELETE CASCADE,
  quantity INT NOT NULL CHECK (quantity > 0),
  UNIQUE(cart_id, variant_id)
);
-- ==========================================
-- 4. ORDERS
-- ==========================================
CREATE TABLE public.orders (
  order_id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id INT REFERENCES public.users(id) ON DELETE SET NULL,
  total_amount NUMERIC(10,2) NOT NULL CHECK (total_amount >= 0),
  status order_status DEFAULT 'pending',
  payment_status payment_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.order_items (
  order_item_id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  order_id INT NOT NULL REFERENCES public.orders(order_id) ON DELETE CASCADE,
  variant_id INT REFERENCES public.product_variants(variant_id) ON DELETE SET NULL,
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  quantity INT NOT NULL CHECK (quantity > 0),
  UNIQUE(order_id, variant_id)
);

-- ==========================================
-- 5. PAYMENTS & SHIPMENTS
-- ==========================================

CREATE TABLE public.payments (
  payment_id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  order_id INT NOT NULL REFERENCES public.orders(order_id) ON DELETE CASCADE,
  method payment_method,
  transaction_ref TEXT,
  paid_at TIMESTAMPTZ,
  status payment_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.shipments (
  shipment_id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  order_id INT NOT NULL REFERENCES public.orders(order_id) ON DELETE CASCADE,
  address_id INT REFERENCES public.user_addresses(address_id) ON DELETE SET NULL,
  tracking_number VARCHAR(150),
  status shipment_status DEFAULT 'preparing',
  shipped_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
-- ==========================================
-- 6. INVENTORY TRANSACTIONS (Stock Ledger)
-- ==========================================
CREATE TABLE public.inventory_transactions (
  transaction_id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  variant_id INT NOT NULL REFERENCES public.product_variants(variant_id) ON DELETE CASCADE,
  quantity_changed INT NOT NULL CHECK (quantity_changed <> 0),
  transaction_type inventory_transaction_type NOT NULL,
  reference_order_id INT REFERENCES public.orders(order_id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
