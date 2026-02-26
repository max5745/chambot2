-- ================================================================
-- CHAMBOT E-COMMERCE — SAMPLE SEED DATA (10 PER TABLE)
-- Run this in Supabase SQL Editor AFTER SCHEMA.sql and MIGRATION.sql
-- ================================================================

-- 1. Categories (10)
INSERT INTO public.categories (name, description, image_url) VALUES
('กาแฟเมล็ด', 'Long-lasting aroma from high-altitude beans', 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=400'),
('ชาและสมุนไพร', 'Traditional Thai and exotic herbs', 'https://images.unsplash.com/photo-1594631252845-29fc45862002?q=80&w=400'),
('อุปกรณ์ชงกาแฟ', 'Brewing tools for home baristas', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=400'),
('แก้วและภาชนะ', 'Elegant ceramic and glass wares', 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=400'),
('เมล็ดพันธุ์เกษตร', 'High-quality seeds for sustainable farming', 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?q=80&w=400'),
('ปุ๋ยอินทรีย์', 'Natural nutrients for your plants', 'https://images.unsplash.com/photo-1615810212353-85e6cd908611?q=80&w=400'),
('เครื่องจักรแปรรูป', 'Small-scale processing units', 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=400'),
('ผลิตภัณฑ์แปรรูป', 'Ready-to-eat community products', 'https://images.unsplash.com/photo-1583209814683-c023dd293cc6?q=80&w=400'),
('คอร์สอบรม', 'Learning from the masters', 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=400'),
('แพ็คเกจท่องเที่ยว', 'Eco-tourism and farm visits', 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=400');

-- 2. Products (10)
INSERT INTO public.products (category_id, name, description, is_active) VALUES
(1, 'เมล็ดกาแฟ อาราบิก้า คั่วกลาง', 'Premium Arabica from Northern Thailand', true),
(2, 'ชาเขียวออร์แกนิค', 'Specialty green tea leaves', true),
(3, 'Drip Kettle 600ml', 'Precision pour-over kettle', true),
(4, 'Handmade Ceramic Mug', 'Unique blue-glaze pottery', true),
(5, 'เมล็ดพันธุ์กัญชงคุณภาพ', 'Certified seeds for industrial use', true),
(6, 'ปุ๋ยหมักชีวภาพ 5kg', 'Concentrated organic fertilizer', true),
(7, 'เครื่องสีข้าวขนาดเล็ก', 'Portable rice milling machine', true),
(8, 'แยมสตรอว์เบอร์รี่ดอยพรีเมียม', 'Natural fruit jam, no added sugar', true),
(9, 'Basic Barista Course', 'One day intensive training', true),
(10, 'One Day Farm Trip', 'Visit the coffee plantation', true);

-- 3. Product Variants (10 items - connecting to products above)
INSERT INTO public.product_variants (product_id, sku, price, stock_quantity, low_stock_threshold, is_main, image_url) VALUES
(1, 'COFFEE-AR-M-250', 350.00, 50, 10, true, 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=400'),
(2, 'TEA-GRN-50', 180.00, 15, 5, true, 'https://images.unsplash.com/photo-1594631252845-29fc45862002?q=80&w=400'),
(3, 'TOOL-KTL-600', 1200.00, 8, 3, true, 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=400'),
(4, 'WARE-MUG-HND', 450.00, 20, 5, true, 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=400'),
(5, 'SEED-HEM-100', 890.00, 100, 20, true, 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?q=80&w=400'),
(6, 'FERT-ORG-5KG', 250.00, 4, 10, true, 'https://images.unsplash.com/photo-1615810212353-85e6cd908611?q=80&w=400'),
(7, 'MACH-RICE-POR', 15500.00, 2, 1, true, 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=400'),
(8, 'FOOD-JAM-STW', 120.00, 45, 10, true, 'https://images.unsplash.com/photo-1583209814683-c023dd293cc6?q=80&w=400'),
(9, 'EDU-BAR-BASIC', 2500.00, 12, 5, true, 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=400'),
(10, 'TRP-FARM-1D', 1500.00, 20, 5, true, 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=400');

-- 4. Users (10)
-- Note: password hashed is 'password123' if using standard bcrypt
INSERT INTO public.users (phone_number, full_name, password, role) VALUES
('0812345601', 'Admin User', '$2b$10$X879x879x879x879x879u.x879x879x879x879x879x879x879', 'admin'),
('0812345602', 'Somchai Jaidee', 'pass123', 'user'),
('0812345603', 'Somsak Rakthai', 'pass123', 'user'),
('0812345604', 'Mali Garden', 'pass123', 'user'),
('0812345605', 'Kiet Srichai', 'pass123', 'user'),
('0812345606', 'Vipa Power', 'pass123', 'user'),
('0812345607', 'Udom Luck', 'pass123', 'user'),
('0812345608', 'Patcha Green', 'pass123', 'user'),
('0812345609', 'Nicha Craft', 'pass123', 'user'),
('0812345610', 'Tawan Blue', 'pass123', 'user');

-- 5. Orders (10)
INSERT INTO public.orders (user_id, total_amount, status, payment_status, shipping_provider, tracking_number) VALUES
(2, 700.00, 'completed', 'paid', 'Flash Express', 'TH12345678A'),
(3, 180.00, 'shipped', 'paid', 'Kerry Express', 'KEX9876543B'),
(4, 1200.00, 'processing', 'paid', null, null),
(5, 450.00, 'pending', 'unpaid', null, null),
(6, 890.00, 'delivered', 'paid', 'J&T Express', 'JT00998877C'),
(7, 250.00, 'pending', 'unpaid', null, null),
(8, 15500.00, 'completed', 'paid', 'DHL', 'DHL6655443D'),
(9, 240.00, 'shipped', 'paid', 'Thailand Post', 'EE123456789TH'),
(10, 2500.00, 'cancelled', 'unpaid', null, null),
(2, 1500.00, 'processing', 'paid', null, null);

-- 6. Order Items (10 items - mapping back to orders/variants)
INSERT INTO public.order_items (order_id, variant_id, price, quantity) VALUES
(1, 1, 350.00, 2),
(2, 2, 180.00, 1),
(3, 3, 1200.00, 1),
(4, 4, 450.00, 1),
(5, 5, 890.00, 1),
(6, 6, 250.00, 1),
(7, 7, 15500.00, 1),
(8, 8, 120.00, 2),
(9, 9, 2500.00, 1),
(10, 10, 1500.00, 1);

-- 7. Payments (10)
INSERT INTO public.payments (order_id, method, status) VALUES
(1, 'qr_promptpay', 'completed'),
(2, 'bank_transfer', 'completed'),
(3, 'qr_promptpay', 'completed'),
(4, 'cod', 'pending'),
(5, 'qr_promptpay', 'completed'),
(6, 'qr_promptpay', 'pending'),
(7, 'credit_card', 'completed'),
(8, 'bank_transfer', 'completed'),
(9, 'qr_promptpay', 'failed'),
(10, 'qr_promptpay', 'completed');

-- 8. Shipments (10)
INSERT INTO public.shipments (order_id, address, status, tracking_number) VALUES
(1, '123 Rama 9, Bangkok', 'delivered', 'TH12345678A'),
(2, '45/1 Nimman, Chiang Mai', 'shipped', 'KEX9876543B'),
(3, '99 Sukhumvit, Bangkok', 'preparing', null),
(4, '77 Walking St, Pattaya', 'preparing', null),
(5, '55 Klang Muang, Khon Kaen', 'delivered', 'JT00998877C'),
(6, '12 Khao San Rd, Bangkok', 'preparing', null),
(7, '88 Island View, Phuket', 'delivered', 'DHL6655443D'),
(8, '22 University Rd, Phitsanulok', 'shipped', 'EE123456789TH'),
(9, '33 Old Town, Songkhla', 'failed', null),
(10, '123 Rama 9, Bangkok', 'preparing', null);

-- 9. Inventory Transactions (10)
INSERT INTO public.inventory_transactions (variant_id, transaction_type, quantity_changed, notes) VALUES
(1, 'restock', 50, 'Initial set of Ara-M-250'),
(2, 'restock', 15, 'Monthly green tea supply'),
(3, 'adjustment', -1, 'Sample for shop display'),
(6, 'restock', 10, 'Organic batch 009'),
(10, 'restock', 20, 'Trip slots for March'),
(1, 'sale', -2, 'Order #1 sold'),
(2, 'sale', -1, 'Order #2 sold'),
(8, 'sale', -2, 'Order #8 sold'),
(5, 'sale', -1, 'Order #5 sold'),
(7, 'sale', -1, 'Order #7 sold');

-- 10. Order Status Logs (10)
INSERT INTO public.order_status_logs (order_id, status, changed_by, note) VALUES
(1, 'pending', 'system', 'Order created'),
(1, 'processing', 'admin', 'Payment verified'),
(1, 'shipped', 'admin', 'Handed to Flash'),
(1, 'completed', 'system', 'Auto-complete after delivery'),
(3, 'pending', 'system', 'Order created'),
(3, 'processing', 'admin', 'Packing started'),
(8, 'shipped', 'admin', 'Processed for shipping'),
(9, 'cancelled', 'admin', 'Payment timeout'),
(10, 'pending', 'system', 'Order created'),
(10, 'processing', 'admin', 'Preparing for farm trip');
