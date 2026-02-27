INSERT INTO public.categories (name) VALUES
('กาแฟเมล็ด'),
('ชาและสมุนไพร'),
('อุปกรณ์ชงกาแฟ'),
('แก้วและภาชนะ'),
('เมล็ดพันธุ์เกษตร'),
('ปุ๋ยอินทรีย์'),
('เครื่องจักรแปรรูป'),
('ผลิตภัณฑ์แปรรูป'),
('คอร์สอบรม'),
('แพ็คเกจท่องเที่ยว');
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
INSERT INTO public.product_variants 
(product_id, sku, price, stock_quantity, low_stock_threshold, is_main, image_url) VALUES
(1, 'COFFEE-AR-M-250', 350.00, 50, 10, true, 'img1'),
(2, 'TEA-GRN-50', 180.00, 15, 5, true, 'img2'),
(3, 'TOOL-KTL-600', 1200.00, 8, 3, true, 'img3'),
(4, 'WARE-MUG-HND', 450.00, 20, 5, true, 'img4'),
(5, 'SEED-HEM-100', 890.00, 100, 20, true, 'img5'),
(6, 'FERT-ORG-5KG', 250.00, 4, 10, true, 'img6'),
(7, 'MACH-RICE-POR', 15500.00, 2, 1, true, 'img7'),
(8, 'FOOD-JAM-STW', 120.00, 45, 10, true, 'img8'),
(9, 'EDU-BAR-BASIC', 2500.00, 12, 5, true, 'img9'),
(10, 'TRP-FARM-1D', 1500.00, 20, 5, true, 'img10');
INSERT INTO public.users (phone_number, full_name, role) VALUES
('0812345601', 'Admin User', 'admin'),
('0812345602', 'Somchai Jaidee', 'user'),
('0812345603', 'Somsak Rakthai', 'user'),
('0812345604', 'Mali Garden', 'user'),
('0812345605', 'Kiet Srichai', 'user'),
('0812345606', 'Vipa Power', 'user'),
('0812345607', 'Udom Luck', 'user'),
('0812345608', 'Patcha Green', 'user'),
('0812345609', 'Nicha Craft', 'user'),
('0812345610', 'Tawan Blue', 'user');
INSERT INTO public.user_addresses (user_id, recipient_name, address_line) VALUES
(2, 'Somchai Jaidee', '123 Rama 9, Bangkok'),
(3, 'Somsak Rakthai', '45/1 Nimman, Chiang Mai'),
(4, 'Mali Garden', '99 Sukhumvit, Bangkok'),
(5, 'Kiet Srichai', '77 Walking St, Pattaya'),
(6, 'Vipa Power', '55 Klang Muang, Khon Kaen'),
(7, 'Udom Luck', '12 Khao San Rd, Bangkok'),
(8, 'Patcha Green', '88 Island View, Phuket'),
(9, 'Nicha Craft', '22 University Rd, Phitsanulok'),
(10, 'Tawan Blue', '33 Old Town, Songkhla'),
(2, 'Somchai Jaidee', '456 Latphrao, Bangkok');
INSERT INTO public.orders (user_id, total_amount, status, payment_status) VALUES
(2, 700.00, 'completed', 'paid'),
(3, 180.00, 'shipped', 'paid'),
(4, 1200.00, 'processing', 'paid'),
(5, 450.00, 'pending', 'unpaid'),
(6, 890.00, 'completed', 'paid'),
(7, 250.00, 'pending', 'unpaid'),
(8, 15500.00, 'completed', 'paid'),
(9, 240.00, 'shipped', 'paid'),
(10, 2500.00, 'cancelled', 'unpaid'),
(2, 1500.00, 'processing', 'paid');
INSERT INTO public.order_items (order_id, variant_id, price, quantity) VALUES
(1,1,350.00,2),
(2,2,180.00,1),
(3,3,1200.00,1),
(4,4,450.00,1),
(5,5,890.00,1),
(6,6,250.00,1),
(7,7,15500.00,1),
(8,8,120.00,2),
(9,9,2500.00,1),
(10,10,1500.00,1);
INSERT INTO public.payments (order_id, method, status) VALUES
(1,'qr_promptpay','completed'),
(2,'bank_transfer','completed'),
(3,'qr_promptpay','completed'),
(4,'cod','pending'),
(5,'qr_promptpay','completed'),
(6,'qr_promptpay','pending'),
(7,'credit_card','completed'),
(8,'bank_transfer','completed'),
(9,'qr_promptpay','failed'),
(10,'qr_promptpay','completed');
INSERT INTO public.shipments (order_id, address_id, status, tracking_number) VALUES
(1,1,'delivered','TH12345678A'),
(2,2,'shipped','KEX9876543B'),
(3,3,'preparing',null),
(4,4,'preparing',null),
(5,5,'delivered','JT00998877C'),
(6,6,'preparing',null),
(7,7,'delivered','DHL6655443D'),
(8,8,'shipped','EE123456789TH'),
(9,9,'failed',null),
(10,10,'preparing',null);
INSERT INTO public.inventory_transactions 
(variant_id, transaction_type, quantity_changed, notes) VALUES
(1,'restock',50,'Initial stock'),
(2,'restock',15,'Monthly supply'),
(3,'adjustment',-1,'Display item'),
(6,'restock',10,'New batch'),
(10,'restock',20,'Trip slots'),
(1,'sale',-2,'Order #1'),
(2,'sale',-1,'Order #2'),
(8,'sale',-2,'Order #8'),
(5,'sale',-1,'Order #5'),
(7,'sale',-1,'Order #7');