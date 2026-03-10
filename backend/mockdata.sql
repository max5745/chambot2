-- ══════════════════════════════════════════════════════════════════════════════
-- CHAMBOT — MOCK DATA (Fixed Version)
-- แก้ไขปัญหา: DATE_TRUNC matching → ใช้ CTE + order_id โดยตรง
-- เพิ่ม: SHIPMENTS seed data
-- รัน SQL นี้หลังจากรัน schema setup แล้ว
-- ══════════════════════════════════════════════════════════════════════════════


-- ============================================================
-- CATEGORIES
-- ============================================================
INSERT INTO public.categories (name) VALUES
  ('ข้าวและธัญพืช'),
  ('เครื่องปรุงรส'),
  ('น้ำมันและไขมัน'),
  ('เครื่องดื่ม'),
  ('ขนมและของว่าง'),
  ('ผลิตภัณฑ์นมและไข่'),
  ('อาหารกระป๋องและสำเร็จรูป'),
  ('ของใช้ในครัวเรือน'),
  ('สินค้าส่วนตัวและสุขอนามัย'),
  ('ผักและผลไม้แห้ง')
ON CONFLICT (name) DO NOTHING;


-- ============================================================
-- PRODUCTS (ใช้ subquery lookup category_id จากชื่อ — ไม่ hardcode ตัวเลข)
-- ============================================================
INSERT INTO public.products (name, description, slug, category_id, is_active)
SELECT v.name, v.description, v.slug, c.category_id, v.is_active
FROM (VALUES
  ('ข้าวหอมมะลิ 5 กก.',             'ข้าวหอมมะลิแท้ 100% จากทุ่งกุลาร้องไห้',       'khao-hom-mali-5kg',         'ข้าวและธัญพืช',              true),
  ('ข้าวเหนียว 1 กก.',               'ข้าวเหนียวขาว เหมาะสำหรับทำข้าวเหนียวมูน',    'khao-niao-1kg',             'ข้าวและธัญพืช',              true),
  ('ข้าวโพดคั่ว 500 ก.',             'ข้าวโพดคั่วพร้อมชง ไม่เติมน้ำตาล',            'popcorn-kernel-500g',       'ข้าวและธัญพืช',              true),
  ('ซีอิ๊วขาว Healthy Boy 700 มล.', 'ซีอิ๊วขาวสูตรดั้งเดิม เกรดพรีเมียม',          'soy-sauce-hb-700ml',        'เครื่องปรุงรส',              true),
  ('น้ำปลา Tiparos 700 มล.',         'น้ำปลาแท้ หมักนาน 12 เดือน',                  'fish-sauce-tiparos-700ml',  'เครื่องปรุงรส',              true),
  ('ซอสหอยนางรม Maekrua 300 ก.',     'ซอสหอยนางรมเข้มข้น',                           'oyster-sauce-mk-300g',      'เครื่องปรุงรส',              true),
  ('ผงปรุงรส Knorr 400 ก.',          'ผงปรุงรสไก่ สูตรพิเศษ',                        'seasoning-knorr-400g',      'เครื่องปรุงรส',              true),
  ('พริกแห้งป่น 100 ก.',             'พริกแห้งป่นละเอียด เผ็ดปานกลาง',              'dried-chili-powder-100g',   'เครื่องปรุงรส',              true),
  ('น้ำมันพืช Morakot 1 ล.',         'น้ำมันพืชบริสุทธิ์ ไม่มีคอเลสเตอรอล',         'veg-oil-morakot-1l',        'น้ำมันและไขมัน',             true),
  ('น้ำมันมะพร้าว 500 มล.',          'น้ำมันมะพร้าวบริสุทธิ์ Virgin',               'coconut-oil-500ml',         'น้ำมันและไขมัน',             true),
  ('ชาเขียวพร้อมดื่ม Oishi 350 มล.','ชาเขียวญี่ปุ่น ไม่หวาน',                       'oishi-green-tea-350ml',     'เครื่องดื่ม',                true),
  ('น้ำดื่ม Crystal 1.5 ล.',         'น้ำดื่มบริสุทธิ์ มาตรฐาน มอก.',               'water-crystal-1-5l',        'เครื่องดื่ม',                true),
  ('กาแฟสำเร็จรูป Nescafe 3in1',     'กาแฟผสม 3in1 รสชาติต้นตำรับ (กล่อง 27 ซอง)', 'nescafe-3in1-box',          'เครื่องดื่ม',                true),
  ('น้ำแดง Spy Wine Cooler 275 มล.', 'เครื่องดื่มน้ำผลไม้ผสมไวน์ (สำหรับผู้ใหญ่)', 'spy-wine-cooler-275ml',     'เครื่องดื่ม',                false),
  ('มาม่า รสต้มยำกุ้ง',              'บะหมี่กึ่งสำเร็จรูป รสชาติยอดนิยม',           'mama-tomyum-noodle',        'ขนมและของว่าง',              true),
  ('มันฝรั่ง Lays รสเกลือ 48 ก.',    'มันฝรั่งทอดกรอบ รสออริจินัล',                 'lays-salt-48g',             'ขนมและของว่าง',              true),
  ('คุกกี้ Oreo 133 ก.',              'คุกกี้ช็อกโกแลตสอดไส้ครีม',                   'oreo-cookie-133g',          'ขนมและของว่าง',              true),
  ('นมสด Dutch Mill 1 ล.',            'นมสดพาสเจอไรซ์ รสจืด ไขมันเต็ม',             'dutch-mill-fresh-milk-1l',  'ผลิตภัณฑ์นมและไข่',          true),
  ('ไข่ไก่ไซส์ M แผง 30 ฟอง',        'ไข่ไก่สดไซส์กลาง เกรด A',                     'chicken-egg-m-30pcs',       'ผลิตภัณฑ์นมและไข่',          true),
  ('โยเกิร์ต Meiji รสสตรอเบอร์รี่',  'โยเกิร์ตรสผลไม้ 135 ก.',                      'meiji-yogurt-strawberry',   'ผลิตภัณฑ์นมและไข่',          true),
  ('ปลาทูน่ากระป๋อง Sealect 185 ก.', 'ทูน่าในน้ำมันพืช',                             'sealect-tuna-185g',         'อาหารกระป๋องและสำเร็จรูป',   true),
  ('ข้าวโพดอ่อนกระป๋อง 425 ก.',      'ข้าวโพดอ่อนในน้ำเกลือ',                        'baby-corn-can-425g',        'อาหารกระป๋องและสำเร็จรูป',   true),
  ('แกงเขียวหวานกระป๋อง Mae Ploy',   'แกงสำเร็จรูป พร้อมทาน 400 ก.',                'green-curry-can-400g',      'อาหารกระป๋องและสำเร็จรูป',   true),
  ('น้ำยาล้างจาน Sunlight 750 มล.',  'น้ำยาล้างจานสูตรมะนาว ตัดไขมัน',              'sunlight-dishwash-750ml',   'ของใช้ในครัวเรือน',           true),
  ('กระดาษทิชชู Cellox 3 ชั้น 6 ม้วน','กระดาษทิชชูนุ่ม 3 ชั้น',                    'cellox-tissue-6rolls',      'ของใช้ในครัวเรือน',           true),
  ('ถุงขยะดำ 18x20 นิ้ว 1 แพ็ค',    'ถุงขยะสีดำ 30 ใบ/แพ็ค',                       'black-trash-bag-18x20',     'ของใช้ในครัวเรือน',           true),
  ('สบู่ Lifebuoy 75 ก.',             'สบู่ฆ่าเชื้อโรค 99.9%',                        'lifebuoy-soap-75g',         'สินค้าส่วนตัวและสุขอนามัย',  true),
  ('แชมพู Sunsilk 200 มล.',           'แชมพูบำรุงผม สูตรเส้นใยเงา',                  'sunsilk-shampoo-200ml',     'สินค้าส่วนตัวและสุขอนามัย',  true),
  ('ยาสีฟัน Colgate 150 ก.',          'ยาสีฟันป้องกันฟันผุ ฟลูออไรด์',              'colgate-toothpaste-150g',   'สินค้าส่วนตัวและสุขอนามัย',  true),
  ('เห็ดหอมแห้ง 100 ก.',              'เห็ดหอมแห้งธรรมชาติ คัดพิเศษ',                'dried-shiitake-100g',       'ผักและผลไม้แห้ง',             true),
  ('กุ้งแห้ง 100 ก.',                 'กุ้งแห้งตากแดด รสเข้ม',                        'dried-shrimp-100g',         'ผักและผลไม้แห้ง',             true)
) AS v(name, description, slug, cat_name, is_active)
JOIN public.categories c ON c.name = v.cat_name
ON CONFLICT (slug) DO NOTHING;


-- ============================================================
-- PRODUCT_VARIANTS
-- ============================================================
INSERT INTO public.product_variants
  (product_id, sku, price, stock_quantity, reserved_quantity, unit, low_stock_threshold, is_main, is_active)
SELECT p.product_id, v.sku, v.price, v.stock, v.reserved, v.unit, v.threshold, v.is_main, true
FROM public.products p
JOIN (VALUES
  ('ข้าวหอมมะลิ 5 กก.',             'SKU-KHM-5KG',       185.00,  80,  5, 'ถุง',       10, true),
  ('ข้าวหอมมะลิ 5 กก.',             'SKU-KHM-1KG',        42.00,  50,  2, 'ถุง',        8, false),
  ('ข้าวเหนียว 1 กก.',               'SKU-KHN-1KG',        35.00,  60,  0, 'ถุง',       10, true),
  ('ข้าวโพดคั่ว 500 ก.',             'SKU-KPK-500G',       55.00,  40,  0, 'ถุง',        5, true),
  ('ซีอิ๊วขาว Healthy Boy 700 มล.', 'SKU-SIW-HB-700',     45.00, 100,  3, 'ขวด',       15, true),
  ('น้ำปลา Tiparos 700 มล.',         'SKU-NMP-TP-700',     38.00,  90,  2, 'ขวด',       15, true),
  ('ซอสหอยนางรม Maekrua 300 ก.',     'SKU-SOH-MK-300',     42.00,  70,  0, 'ขวด',       10, true),
  ('ผงปรุงรส Knorr 400 ก.',          'SKU-PPR-KN-400',     55.00,   5,  0, 'กล่อง',      8, true),
  ('พริกแห้งป่น 100 ก.',             'SKU-PHG-100G',       25.00,  45,  0, 'ซอง',        5, true),
  ('น้ำมันพืช Morakot 1 ล.',         'SKU-NMP-MK-1L',      58.00, 120,  5, 'ขวด',       20, true),
  ('น้ำมันพืช Morakot 1 ล.',         'SKU-NMP-MK-5L',     260.00,  30,  2, 'แกลลอน',     5, false),
  ('น้ำมันมะพร้าว 500 มล.',          'SKU-NMK-500ML',     145.00,   3,  0, 'ขวด',        5, true),
  ('ชาเขียวพร้อมดื่ม Oishi 350 มล.','SKU-CKO-350ML',       18.00, 200, 10, 'ขวด',       30, true),
  ('น้ำดื่ม Crystal 1.5 ล.',         'SKU-NDC-1500ML',     12.00, 300, 20, 'ขวด',       48, true),
  ('กาแฟสำเร็จรูป Nescafe 3in1',     'SKU-KFF-NC-3IN1',    89.00,  80,  3, 'กล่อง',     10, true),
  ('น้ำแดง Spy Wine Cooler 275 มล.', 'SKU-SPY-275ML',      35.00,  20,  0, 'ขวด',        5, true),
  ('มาม่า รสต้มยำกุ้ง',              'SKU-MAM-TYG',         6.00, 500, 30, 'ซอง',       60, true),
  ('มันฝรั่ง Lays รสเกลือ 48 ก.',    'SKU-LYS-SLT-48G',   25.00, 150,  5, 'ถุง',       20, true),
  ('คุกกี้ Oreo 133 ก.',              'SKU-ORE-133G',       49.00,  80,  0, 'แพ็ค',      10, true),
  ('นมสด Dutch Mill 1 ล.',            'SKU-NMS-DM-1L',      52.00,  60,  5, 'กล่อง',     10, true),
  ('ไข่ไก่ไซส์ M แผง 30 ฟอง',        'SKU-EGG-M-30',      130.00,  40,  2, 'แผง',        5, true),
  ('โยเกิร์ต Meiji รสสตรอเบอร์รี่',  'SKU-YOG-MJ-STR',    25.00,  55,  0, 'ถ้วย',       8, true),
  ('ปลาทูน่ากระป๋อง Sealect 185 ก.', 'SKU-TUN-SL-185G',   39.00, 200,  5, 'กระป๋อง',   20, true),
  ('ข้าวโพดอ่อนกระป๋อง 425 ก.',      'SKU-KPO-425G',       28.00, 100,  0, 'กระป๋อง',   10, true),
  ('แกงเขียวหวานกระป๋อง Mae Ploy',   'SKU-GKW-MP-400',     45.00,  60,  0, 'กระป๋อง',    8, true),
  ('น้ำยาล้างจาน Sunlight 750 มล.',  'SKU-NLJ-SL-750',     45.00, 110,  5, 'ขวด',       15, true),
  ('กระดาษทิชชู Cellox 3 ชั้น 6 ม้วน','SKU-TIS-CLX-6R',   65.00,  80,  0, 'แพ็ค',      10, true),
  ('ถุงขยะดำ 18x20 นิ้ว 1 แพ็ค',    'SKU-TBG-BLK-1820',   25.00,  90,  0, 'แพ็ค',      10, true),
  ('สบู่ Lifebuoy 75 ก.',             'SKU-SBU-LFB-75',     22.00, 120,  0, 'ก้อน',      20, true),
  ('แชมพู Sunsilk 200 มล.',           'SKU-SMP-SNS-200',    75.00,  70,  2, 'ขวด',       10, true),
  ('ยาสีฟัน Colgate 150 ก.',          'SKU-YSF-CLG-150',    65.00,  90,  0, 'หลอด',      10, true),
  ('เห็ดหอมแห้ง 100 ก.',              'SKU-HHD-100G',       55.00,  50,  0, 'ถุง',        5, true),
  ('กุ้งแห้ง 100 ก.',                 'SKU-KHD-100G',       75.00,  45,  0, 'ถุง',        5, true)
) AS v(pname, sku, price, stock, reserved, unit, threshold, is_main)
  ON p.name = v.pname
ON CONFLICT (sku) DO NOTHING;


-- ============================================================
-- IMAGE_URL (Supabase Storage path)
-- ============================================================
UPDATE public.product_variants SET image_url = v.path
FROM (VALUES
  -- ข้าวและธัญพืช
  ('SKU-KHM-5KG',      'https://images.openfoodfacts.org/images/products/885/000/050/0018/front_en.3.400.jpg'),
  ('SKU-KHM-1KG',      'https://images.openfoodfacts.org/images/products/885/000/050/0018/front_en.3.400.jpg'),
  ('SKU-KHN-1KG',      'https://images.openfoodfacts.org/images/products/885/000/623/1005/front_en.3.400.jpg'),
  ('SKU-KPK-500G',     'https://images.openfoodfacts.org/images/products/001/670/003/1071/front_en.14.400.jpg'),
  -- เครื่องปรุงรส
  ('SKU-SIW-HB-700',   'https://images.openfoodfacts.org/images/products/885/000/003/7712/front_en.8.400.jpg'),
  ('SKU-NMP-TP-700',   'https://images.openfoodfacts.org/images/products/885/000/024/5018/front_en.5.400.jpg'),
  ('SKU-SOH-MK-300',   'https://images.openfoodfacts.org/images/products/885/000/002/0012/front_en.6.400.jpg'),
  ('SKU-PPR-KN-400',   'https://images.openfoodfacts.org/images/products/800/034/000/1706/front_en.17.400.jpg'),
  ('SKU-PHG-100G',     'https://images.openfoodfacts.org/images/products/885/726/400/2002/front_en.3.400.jpg'),
  -- น้ำมันและไขมัน
  ('SKU-NMP-MK-1L',    'https://images.openfoodfacts.org/images/products/885/000/065/2019/front_en.4.400.jpg'),
  ('SKU-NMP-MK-5L',    'https://images.openfoodfacts.org/images/products/885/000/065/2019/front_en.4.400.jpg'),
  ('SKU-NMK-500ML',    'https://images.openfoodfacts.org/images/products/461/834/902/0019/front_en.13.400.jpg'),
  -- เครื่องดื่ม
  ('SKU-CKO-350ML',    'https://images.openfoodfacts.org/images/products/885/020/002/5209/front_en.11.400.jpg'),
  ('SKU-NDC-1500ML',   'https://images.openfoodfacts.org/images/products/885/000/053/0155/front_en.5.400.jpg'),
  ('SKU-KFF-NC-3IN1',  'https://images.openfoodfacts.org/images/products/762/667/100/4005/front_en.18.400.jpg'),
  ('SKU-SPY-275ML',    'https://images.openfoodfacts.org/images/products/885/020/002/5209/front_en.11.400.jpg'),
  -- ขนมและของว่าง
  ('SKU-MAM-TYG',      'https://images.openfoodfacts.org/images/products/885/000/006/0039/front_en.10.400.jpg'),
  ('SKU-LYS-SLT-48G',  'https://images.openfoodfacts.org/images/products/401/638/403/0069/front_en.30.400.jpg'),
  ('SKU-ORE-133G',     'https://images.openfoodfacts.org/images/products/762/667/200/0011/front_en.27.400.jpg'),
  -- ผลิตภัณฑ์นมและไข่
  ('SKU-NMS-DM-1L',    'https://images.openfoodfacts.org/images/products/885/040/001/4500/front_en.6.400.jpg'),
  ('SKU-EGG-M-30',     'https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Chicken_eggs_2.jpg/320px-Chicken_eggs_2.jpg'),
  ('SKU-YOG-MJ-STR',   'https://images.openfoodfacts.org/images/products/490/000/281/0039/front_en.8.400.jpg'),
  -- อาหารกระป๋อง
  ('SKU-TUN-SL-185G',  'https://images.openfoodfacts.org/images/products/885/000/040/5016/front_en.5.400.jpg'),
  ('SKU-KPO-425G',     'https://images.openfoodfacts.org/images/products/885/726/500/4009/front_en.4.400.jpg'),
  ('SKU-GKW-MP-400',   'https://images.openfoodfacts.org/images/products/885/000/005/0017/front_en.7.400.jpg'),
  -- ของใช้ในครัวเรือน
  ('SKU-NLJ-SL-750',   'https://images.openfoodfacts.org/images/products/885/726/100/2118/front_en.3.400.jpg'),
  ('SKU-TIS-CLX-6R',   'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Toilet_paper_3.jpg/240px-Toilet_paper_3.jpg'),
  ('SKU-TBG-BLK-1820', 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Plastic_bag.jpg/240px-Plastic_bag.jpg'),
  -- สินค้าส่วนตัว
  ('SKU-SBU-LFB-75',   'https://images.openfoodfacts.org/images/products/800/095/002/0050/front_en.9.400.jpg'),
  ('SKU-SMP-SNS-200',  'https://images.openfoodfacts.org/images/products/800/095/012/8742/front_en.10.400.jpg'),
  ('SKU-YSF-CLG-150',  'https://images.openfoodfacts.org/images/products/800/095/005/7605/front_en.14.400.jpg'),
  -- ผักและผลไม้แห้ง
  ('SKU-HHD-100G',     'https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Shiitaki_mushroom.jpg/240px-Shiitaki_mushroom.jpg'),
  ('SKU-KHD-100G',     'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Dried_shrimp.jpg/320px-Dried_shrimp.jpg')
) AS v(sku, path)
WHERE product_variants.sku = v.sku;


-- ============================================================
-- INVENTORY_TRANSACTIONS
-- ============================================================
INSERT INTO public.inventory_transactions
  (variant_id, quantity_changed, transaction_type, notes)
SELECT pv.variant_id, t.qty, t.ttype::inventory_transaction_type, t.notes
FROM public.product_variants pv
JOIN (VALUES
  ('SKU-KHM-5KG',       200, 'restock',    'รับของใหม่จากซัพพลายเออร์ ล็อต #001'),
  ('SKU-KHM-5KG',      -120, 'purchase',   'ยอดขายสัปดาห์ที่ 1'),
  ('SKU-KHM-1KG',       100, 'restock',    'รับของใหม่ ล็อต #001'),
  ('SKU-KHM-1KG',       -50, 'purchase',   'ยอดขายสัปดาห์ที่ 1'),
  ('SKU-KHN-1KG',       100, 'restock',    'รับของใหม่'),
  ('SKU-KHN-1KG',       -40, 'purchase',   'ขายปลีก'),
  ('SKU-SIW-HB-700',    150, 'restock',    'รับของล็อตใหม่'),
  ('SKU-SIW-HB-700',    -50, 'purchase',   'ขายปลีก'),
  ('SKU-NMP-TP-700',    120, 'restock',    'รับของล็อตใหม่'),
  ('SKU-NMP-TP-700',    -30, 'purchase',   'ขายปลีก'),
  ('SKU-NMP-MK-1L',     200, 'restock',    'รับน้ำมันล็อตใหม่'),
  ('SKU-NMP-MK-1L',     -80, 'purchase',   'ขายสัปดาห์ที่ 1'),
  ('SKU-NMP-MK-1L',       2, 'adjustment', 'ลูกค้าคืนสินค้า ขวดบุบ'),
  ('SKU-NMP-MK-5L',      50, 'restock',    'รับสต็อกแกลลอนใหม่'),
  ('SKU-NMP-MK-5L',     -20, 'purchase',   'ขายส่ง'),
  ('SKU-CKO-350ML',     300, 'restock',    'รับชาเขียวล็อตใหม่'),
  ('SKU-CKO-350ML',    -100, 'purchase',   'ขายสัปดาห์ที่ 1'),
  ('SKU-NDC-1500ML',    500, 'restock',    'รับน้ำดื่มล็อตใหม่'),
  ('SKU-NDC-1500ML',   -200, 'purchase',   'ขายสัปดาห์ที่ 1-2'),
  ('SKU-MAM-TYG',       800, 'restock',    'รับมาม่าล็อตใหม่'),
  ('SKU-MAM-TYG',      -300, 'purchase',   'ขายสัปดาห์ที่ 1-2'),
  ('SKU-LYS-SLT-48G',  200, 'restock',    'รับขนมล็อตใหม่'),
  ('SKU-LYS-SLT-48G',  -50, 'purchase',   'ขายปลีก'),
  ('SKU-NMS-DM-1L',     100, 'restock',    'รับนมสดล็อตใหม่'),
  ('SKU-NMS-DM-1L',     -40, 'purchase',   'ขายสัปดาห์ที่ 1'),
  ('SKU-EGG-M-30',       60, 'restock',    'รับไข่ล็อตใหม่'),
  ('SKU-EGG-M-30',      -20, 'purchase',   'ขายปลีก'),
  ('SKU-EGG-M-30',       -3, 'adjustment', 'ปรับลด: ไข่แตกระหว่างขนส่ง'),
  ('SKU-TUN-SL-185G',   300, 'restock',    'รับปลากระป๋องล็อตใหม่'),
  ('SKU-TUN-SL-185G',  -100, 'purchase',   'ขายสัปดาห์ที่ 1-2'),
  ('SKU-NLJ-SL-750',    150, 'restock',    'รับน้ำยาล้างจานล็อตใหม่'),
  ('SKU-NLJ-SL-750',    -40, 'purchase',   'ขายปลีก'),
  ('SKU-SBU-LFB-75',    200, 'restock',    'รับสบู่ล็อตใหม่'),
  ('SKU-SBU-LFB-75',    -80, 'purchase',   'ขายสัปดาห์ที่ 1'),
  ('SKU-SMP-SNS-200',   100, 'restock',    'รับแชมพูล็อตใหม่'),
  ('SKU-SMP-SNS-200',   -30, 'purchase',   'ขายปลีก'),
  ('SKU-YSF-CLG-150',   120, 'restock',    'รับยาสีฟันล็อตใหม่'),
  ('SKU-YSF-CLG-150',   -30, 'purchase',   'ขายปลีก'),
  ('SKU-HHD-100G',       80, 'restock',    'รับเห็ดหอมแห้งล็อตใหม่'),
  ('SKU-HHD-100G',      -30, 'purchase',   'ขายปลีก'),
  ('SKU-KHD-100G',       80, 'restock',    'รับกุ้งแห้งล็อตใหม่'),
  ('SKU-KHD-100G',      -35, 'purchase',   'ขายปลีก'),
  ('SKU-PPR-KN-400',     70, 'restock',    'รับผงปรุงรสล็อตใหม่'),
  ('SKU-PPR-KN-400',    -65, 'purchase',   'ขายสัปดาห์ที่ 1-3'),
  ('SKU-NMK-500ML',      50, 'restock',    'รับน้ำมันมะพร้าวล็อตใหม่'),
  ('SKU-NMK-500ML',     -47, 'purchase',   'ขายเกือบหมด'),
  ('SKU-SPY-275ML',      20, 'restock',    'รับสินค้าก่อน inactive')
) AS t(sku, qty, ttype, notes)
  ON pv.sku = t.sku;


-- ============================================================
-- USERS  (1 admin + 10 customers)
-- ============================================================
INSERT INTO public.users (phone_number, full_name, role, is_active) VALUES
('0812345678', 'สมชาย มีสุข',       'admin',    true),
('0898765432', 'วิภา ใจดี',          'customer', true),
('0823456789', 'ประสิทธิ์ ทองดี',    'customer', true),
('0834567890', 'นภา สวัสดี',         'customer', true),
('0845678901', 'กิตติ รักเรียน',     'customer', true),
('0856789012', 'สุดา พานิช',         'customer', true),
('0867890123', 'ชาญ วงศ์ดี',         'customer', true),
('0878901234', 'มาลี สุขสันต์',      'customer', true),
('0889012345', 'อนุชา พึ่งพา',       'customer', true),
('0890123456', 'พิมพ์ใจ ศรีสุข',     'customer', true),
('0801234567', 'ธนา บุญมี',          'customer', false)
ON CONFLICT (phone_number) DO NOTHING;

-- suspend user คนสุดท้ายโดย admin (id=1)
UPDATE public.users
SET suspended_by = (SELECT id FROM public.users WHERE phone_number = '0812345678'),
    suspended_at = now() - INTERVAL '3 days'
WHERE phone_number = '0801234567';


-- ============================================================
-- USER_ADDRESSES
-- ============================================================
INSERT INTO public.user_addresses (user_id, recipient_name, address_line, province, postal_code)
SELECT u.id, a.recipient_name, a.address_line, a.province, a.postal_code
FROM public.users u
JOIN (VALUES
  ('0898765432', 'วิภา ใจดี',       '12/3 ม.1 ต.หนองจ๊อม อ.สันทราย',   'เชียงใหม่', '50210'),
  ('0823456789', 'ประสิทธิ์ ทองดี', '88 ม.4 ต.สันทรายน้อย อ.สันทราย',  'เชียงใหม่', '50210'),
  ('0823456789', 'แม่ประสิทธิ์',    '22 ม.6 ต.สันทรายน้อย อ.สันทราย',  'เชียงใหม่', '50210'),
  ('0834567890', 'นภา สวัสดี',      '45/7 ม.2 ต.หนองหาร อ.สันทราย',    'เชียงใหม่', '50290'),
  ('0845678901', 'กิตติ รักเรียน',  '9/1 ม.3 ต.สันพระเนตร อ.สันทราย',  'เชียงใหม่', '50210'),
  ('0856789012', 'สุดา พานิช',      '100 ม.5 ต.หนองจ๊อม อ.สันทราย',    'เชียงใหม่', '50210'),
  ('0867890123', 'ชาญ วงศ์ดี',      '55 ม.7 ต.สันทรายหลวง อ.สันทราย',  'เชียงใหม่', '50210'),
  ('0878901234', 'มาลี สุขสันต์',   '3/2 ม.1 ต.ป่าไผ่ อ.สันทราย',      'เชียงใหม่', '50210'),
  ('0889012345', 'อนุชา พึ่งพา',    '77 ม.8 ต.หนองหาร อ.สันทราย',      'เชียงใหม่', '50290'),
  ('0890123456', 'พิมพ์ใจ ศรีสุข',  '18/4 ม.2 ต.สันทรายหลวง อ.สันทราย','เชียงใหม่', '50210'),
  ('0801234567', 'ธนา บุญมี',       '66 ม.4 ต.ป่าไผ่ อ.สันทราย',       'เชียงใหม่', '50210')
) AS a(phone, recipient_name, address_line, province, postal_code)
  ON u.phone_number = a.phone;


-- ============================================================
-- ORDERS
-- ใช้ CTE เพื่อให้ reference order_id ได้ในขั้นตอนถัดไป
-- ============================================================
INSERT INTO public.orders
  (user_id, total_amount, status, payment_status, tracking_number, shipping_provider, created_at)
SELECT u.id, o.total, o.status::order_status, o.pstatus::payment_status,
       o.tracking, o.provider, o.created_at
FROM public.users u
JOIN (VALUES
  ('0898765432',  397.00, 'delivered',  'paid',     'TH123456789',  'Flash Express',  TIMESTAMPTZ '2026-03-01 09:15:00+07'),
  ('0898765432',  246.00, 'shipped',    'paid',     'TH987654321',  'Kerry Express',  TIMESTAMPTZ '2026-03-07 14:30:00+07'),
  ('0823456789',  185.00, 'delivered',  'paid',     'TH111222333',  'Thailand Post',  TIMESTAMPTZ '2026-03-03 10:00:00+07'),
  ('0823456789',  318.00, 'pending',    'pending',   NULL,           NULL,             TIMESTAMPTZ '2026-03-08 16:45:00+07'),
  ('0834567890',  552.00, 'delivered',  'paid',     'TH444555666',  'Flash Express',  TIMESTAMPTZ '2026-03-02 11:20:00+07'),
  ('0845678901',   96.00, 'cancelled',  'refunded',  NULL,           NULL,             TIMESTAMPTZ '2026-03-04 13:00:00+07'),
  ('0856789012',  267.00, 'shipped',    'paid',     'TH777888999',  'Kerry Express',  TIMESTAMPTZ '2026-03-06 08:50:00+07'),
  ('0867890123',  430.00, 'delivered',  'paid',     'TH222333444',  'Flash Express',  TIMESTAMPTZ '2026-03-01 15:30:00+07'),
  ('0878901234',  130.00, 'pending',    'pending',   NULL,           NULL,             TIMESTAMPTZ '2026-03-09 09:00:00+07'),
  ('0889012345',  714.00, 'delivered',  'paid',     'TH555666777',  'Thailand Post',  TIMESTAMPTZ '2026-03-02 17:10:00+07'),
  ('0890123456',  189.00, 'shipped',    'paid',     'TH888999000',  'Kerry Express',  TIMESTAMPTZ '2026-03-05 12:00:00+07'),
  ('0801234567',   78.00, 'cancelled',  'refunded',  NULL,           NULL,             TIMESTAMPTZ '2026-03-03 19:25:00+07')
) AS o(phone, total, status, pstatus, tracking, provider, created_at)
  ON u.phone_number = o.phone;


-- ============================================================
-- ORDER_ITEMS
-- แก้ไข: ใช้ ROW_NUMBER() เรียง created_at เพื่อ map แทน DATE_TRUNC
-- ============================================================
WITH ranked_orders AS (
  SELECT
    o.order_id,
    u.phone_number,
    ROW_NUMBER() OVER (PARTITION BY u.phone_number ORDER BY o.created_at DESC) AS rn
  FROM public.orders o
  JOIN public.users u ON o.user_id = u.id
),
order_map AS (
  -- map ลำดับ: rn=1 = order ล่าสุด, rn=2 = order ก่อนหน้า (เฉพาะ user ที่มีหลาย order)
  SELECT order_id, phone_number, rn FROM ranked_orders
)
INSERT INTO public.order_items (order_id, variant_id, price, quantity)
SELECT om.order_id, pv.variant_id, oi.price, oi.qty
FROM (VALUES
  -- วิภา ใจดี (0898765432) — rn1=order ล่าสุด (shipped,2วัน), rn2=order เก่า (delivered,10วัน)
  ('0898765432', 2, 'SKU-KHM-5KG',      185.00, 1),
  ('0898765432', 2, 'SKU-MAM-TYG',        6.00, 5),
  ('0898765432', 2, 'SKU-NMP-TP-700',    38.00, 2),
  ('0898765432', 2, 'SKU-SIW-HB-700',    45.00, 1),
  ('0898765432', 2, 'SKU-NDC-1500ML',    12.00, 8),
  ('0898765432', 1, 'SKU-NMS-DM-1L',     52.00, 2),
  ('0898765432', 1, 'SKU-EGG-M-30',     130.00, 1),
  ('0898765432', 1, 'SKU-CKO-350ML',     18.00, 3),

  -- ประสิทธิ์ ทองดี (0823456789) — rn1=pending(1วัน), rn2=delivered(15วัน)
  ('0823456789', 2, 'SKU-KHM-5KG',      185.00, 1),
  ('0823456789', 1, 'SKU-NMP-MK-1L',     58.00, 2),
  ('0823456789', 1, 'SKU-SOH-MK-300',    42.00, 1),
  ('0823456789', 1, 'SKU-PPR-KN-400',    55.00, 1),
  ('0823456789', 1, 'SKU-PHG-100G',      25.00, 1),
  ('0823456789', 1, 'SKU-MAM-TYG',        6.00, 5),
  ('0823456789', 1, 'SKU-NDC-1500ML',    12.00,10),

  -- นภา สวัสดี (0834567890) — rn1=delivered(8วัน)
  ('0834567890', 1, 'SKU-NLJ-SL-750',    45.00, 2),
  ('0834567890', 1, 'SKU-TIS-CLX-6R',    65.00, 2),
  ('0834567890', 1, 'SKU-SBU-LFB-75',    22.00, 4),
  ('0834567890', 1, 'SKU-SMP-SNS-200',   75.00, 2),
  ('0834567890', 1, 'SKU-YSF-CLG-150',   65.00, 2),
  ('0834567890', 1, 'SKU-TBG-BLK-1820',  25.00, 4),

  -- กิตติ รักเรียน (0845678901) — rn1=cancelled(5วัน)
  ('0845678901', 1, 'SKU-CKO-350ML',     18.00, 2),
  ('0845678901', 1, 'SKU-ORE-133G',      49.00, 1),

  -- สุดา พานิช (0856789012) — rn1=shipped(3วัน)
  ('0856789012', 1, 'SKU-TUN-SL-185G',   39.00, 3),
  ('0856789012', 1, 'SKU-KPO-425G',      28.00, 2),
  ('0856789012', 1, 'SKU-GKW-MP-400',    45.00, 2),
  ('0856789012', 1, 'SKU-HHD-100G',      55.00, 1),

  -- ชาญ วงศ์ดี (0867890123) — rn1=delivered(20วัน)
  ('0867890123', 1, 'SKU-KHM-5KG',      185.00, 1),
  ('0867890123', 1, 'SKU-KHN-1KG',       35.00, 2),
  ('0867890123', 1, 'SKU-NMP-MK-1L',     58.00, 1),
  ('0867890123', 1, 'SKU-SIW-HB-700',    45.00, 1),
  ('0867890123', 1, 'SKU-NMP-TP-700',    38.00, 1),

  -- มาลี สุขสันต์ (0878901234) — rn1=pending(วันนี้)
  ('0878901234', 1, 'SKU-EGG-M-30',     130.00, 1),

  -- อนุชา พึ่งพา (0889012345) — rn1=delivered(12วัน)
  ('0889012345', 1, 'SKU-KFF-NC-3IN1',   89.00, 2),
  ('0889012345', 1, 'SKU-CKO-350ML',     18.00,10),
  ('0889012345', 1, 'SKU-NDC-1500ML',    12.00,20),
  ('0889012345', 1, 'SKU-MAM-TYG',        6.00,20),
  ('0889012345', 1, 'SKU-LYS-SLT-48G',   25.00, 4),

  -- พิมพ์ใจ ศรีสุข (0890123456) — rn1=shipped(4วัน)
  ('0890123456', 1, 'SKU-YOG-MJ-STR',    25.00, 3),
  ('0890123456', 1, 'SKU-NMS-DM-1L',     52.00, 2),

  -- ธนา บุญมี (0801234567) — rn1=cancelled(7วัน)
  ('0801234567', 1, 'SKU-MAM-TYG',        6.00,10),
  ('0801234567', 1, 'SKU-NDC-1500ML',    12.00, 1)
) AS oi(phone, rn, sku, price, qty)
JOIN order_map om ON om.phone_number = oi.phone AND om.rn = oi.rn
JOIN public.product_variants pv ON pv.sku = oi.sku
ON CONFLICT (order_id, variant_id) DO NOTHING;


-- ============================================================
-- ORDER_STATUS_LOGS
-- แก้ไข: ใช้ ROW_NUMBER() เหมือนกัน
-- ============================================================
WITH ranked_orders AS (
  SELECT
    o.order_id,
    o.created_at,
    u.phone_number,
    ROW_NUMBER() OVER (PARTITION BY u.phone_number ORDER BY o.created_at DESC) AS rn
  FROM public.orders o
  JOIN public.users u ON o.user_id = u.id
)
INSERT INTO public.order_status_logs (order_id, status, changed_by, note, created_at)
SELECT ro.order_id, log.status, log.changed_by, log.note,
       ro.created_at + log.time_offset
FROM (VALUES
  ('0898765432', 2, 'pending',   'system',          'สร้างออเดอร์',                    INTERVAL '0 minutes'),
  ('0898765432', 2, 'shipped',   'สมชาย มีสุข',     'แพ็คสินค้าและส่ง Flash',          INTERVAL '3 hours'),
  ('0898765432', 2, 'delivered', 'system',          'ลูกค้าได้รับสินค้าแล้ว',           INTERVAL '2 days'),
  ('0898765432', 1, 'pending',   'system',          'สร้างออเดอร์',                    INTERVAL '0 minutes'),
  ('0898765432', 1, 'shipped',   'สมชาย มีสุข',     'ส่ง Kerry',                       INTERVAL '5 hours'),

  ('0823456789', 2, 'pending',   'system',          'สร้างออเดอร์',                    INTERVAL '0 minutes'),
  ('0823456789', 2, 'shipped',   'สมชาย มีสุข',     'ส่ง Thailand Post',               INTERVAL '4 hours'),
  ('0823456789', 2, 'delivered', 'system',          'ลูกค้าได้รับสินค้าแล้ว',           INTERVAL '3 days'),
  ('0823456789', 1, 'pending',   'system',          'สร้างออเดอร์ รอชำระเงิน',          INTERVAL '0 minutes'),

  ('0834567890', 1, 'pending',   'system',          'สร้างออเดอร์',                    INTERVAL '0 minutes'),
  ('0834567890', 1, 'shipped',   'สมชาย มีสุข',     'ส่ง Flash Express',               INTERVAL '2 hours'),
  ('0834567890', 1, 'delivered', 'system',          'ลูกค้าได้รับสินค้าแล้ว',           INTERVAL '2 days'),

  ('0845678901', 1, 'pending',   'system',          'สร้างออเดอร์',                    INTERVAL '0 minutes'),
  ('0845678901', 1, 'cancelled', 'กิตติ รักเรียน',  'ลูกค้ายกเลิก เปลี่ยนใจ',          INTERVAL '1 hours'),

  ('0856789012', 1, 'pending',   'system',          'สร้างออเดอร์',                    INTERVAL '0 minutes'),
  ('0856789012', 1, 'shipped',   'สมชาย มีสุข',     'ส่ง Kerry',                       INTERVAL '6 hours'),

  ('0867890123', 1, 'pending',   'system',          'สร้างออเดอร์',                    INTERVAL '0 minutes'),
  ('0867890123', 1, 'shipped',   'สมชาย มีสุข',     'ส่ง Flash Express',               INTERVAL '3 hours'),
  ('0867890123', 1, 'delivered', 'system',          'ลูกค้าได้รับสินค้าแล้ว',           INTERVAL '4 days'),

  ('0878901234', 1, 'pending',   'system',          'สร้างออเดอร์ใหม่',                INTERVAL '0 minutes'),

  ('0889012345', 1, 'pending',   'system',          'สร้างออเดอร์',                    INTERVAL '0 minutes'),
  ('0889012345', 1, 'shipped',   'สมชาย มีสุข',     'ส่ง Thailand Post',               INTERVAL '5 hours'),
  ('0889012345', 1, 'delivered', 'system',          'ลูกค้าได้รับสินค้าแล้ว',           INTERVAL '3 days'),

  ('0890123456', 1, 'pending',   'system',          'สร้างออเดอร์',                    INTERVAL '0 minutes'),
  ('0890123456', 1, 'shipped',   'สมชาย มีสุข',     'ส่ง Kerry',                       INTERVAL '4 hours'),

  ('0801234567', 1, 'pending',   'system',          'สร้างออเดอร์',                    INTERVAL '0 minutes'),
  ('0801234567', 1, 'cancelled', 'สมชาย มีสุข',     'ยกเลิกเนื่องจาก user ถูก suspend', INTERVAL '2 hours')
) AS log(phone, rn, status, changed_by, note, time_offset)
JOIN ranked_orders ro ON ro.phone_number = log.phone AND ro.rn = log.rn;


-- ============================================================
-- PAYMENTS
-- แก้ไข: ใช้ ROW_NUMBER() เหมือนกัน
-- ============================================================
WITH ranked_orders AS (
  SELECT
    o.order_id,
    o.created_at,
    u.phone_number,
    ROW_NUMBER() OVER (PARTITION BY u.phone_number ORDER BY o.created_at DESC) AS rn
  FROM public.orders o
  JOIN public.users u ON o.user_id = u.id
)
INSERT INTO public.payments
  (order_id, method, transaction_ref, paid_at, status, created_at)
SELECT
  ro.order_id,
  p.method::payment_method,
  p.ref,
  CASE
    WHEN p.pstatus = 'paid'     THEN ro.created_at + INTERVAL '30 minutes'
    WHEN p.pstatus = 'refunded' THEN ro.created_at + INTERVAL '2 hours'
    ELSE NULL
  END,
  p.pstatus::payment_status,
  ro.created_at + INTERVAL '5 minutes'
FROM (VALUES
  ('0898765432', 2, 'qr',  'QR2024100100001', 'paid'),
  ('0898765432', 1, 'qr',  'QR2024102400002', 'paid'),
  ('0823456789', 2, 'cod', 'COD20240926003',  'paid'),
  ('0823456789', 1, 'qr',  NULL,              'pending'),
  ('0834567890', 1, 'qr',  'QR2024100300005', 'paid'),
  ('0845678901', 1, 'cod', NULL,              'refunded'),
  ('0856789012', 1, 'qr',  'QR2024100800007', 'paid'),
  ('0867890123', 1, 'cod', 'COD20240921008',  'paid'),
  ('0878901234', 1, 'qr',  NULL,              'pending'),
  ('0889012345', 1, 'qr',  'QR2024100100010', 'paid'),
  ('0890123456', 1, 'cod', 'COD20241007011',  'paid'),
  ('0801234567', 1, 'qr',  NULL,              'refunded')
) AS p(phone, rn, method, ref, pstatus)
JOIN ranked_orders ro ON ro.phone_number = p.phone AND ro.rn = p.rn;


-- ============================================================
-- SHIPMENTS (เพิ่มใหม่ — ตารางนี้ขาดใน mock เดิม)
-- ============================================================
WITH ranked_orders AS (
  SELECT
    o.order_id,
    o.created_at,
    u.phone_number,
    ROW_NUMBER() OVER (PARTITION BY u.phone_number ORDER BY o.created_at DESC) AS rn
  FROM public.orders o
  JOIN public.users u ON o.user_id = u.id
),
addr AS (
  SELECT DISTINCT ON (u.phone_number)
    u.phone_number,
    ua.address_id,
    ua.address_line || ' ' || ua.province || ' ' || ua.postal_code AS full_address
  FROM public.users u
  JOIN public.user_addresses ua ON ua.user_id = u.id
  ORDER BY u.phone_number, ua.address_id
)
INSERT INTO public.shipments
  (order_id, address_id, address, tracking_number, status, shipped_at, created_at)
SELECT
  ro.order_id,
  addr.address_id,
  addr.full_address,
  s.tracking,
  s.ship_status::shipment_status,
  CASE WHEN s.ship_status IN ('shipped','delivered') THEN ro.created_at + INTERVAL '4 hours' ELSE NULL END,
  ro.created_at + INTERVAL '10 minutes'
FROM (VALUES
  -- (phone, rn, tracking, shipment_status)
  ('0898765432', 2, 'TH123456789',  'delivered'),
  ('0898765432', 1, 'TH987654321',  'shipped'),
  ('0823456789', 2, 'TH111222333',  'delivered'),
  ('0823456789', 1,  NULL,          'preparing'),
  ('0834567890', 1, 'TH444555666',  'delivered'),
  -- กิตติ cancelled — ไม่มี shipment
  ('0856789012', 1, 'TH777888999',  'shipped'),
  ('0867890123', 1, 'TH222333444',  'delivered'),
  -- มาลี pending — ไม่มี shipment
  ('0889012345', 1, 'TH555666777',  'delivered'),
  ('0890123456', 1, 'TH888999000',  'shipped')
  -- ธนา cancelled — ไม่มี shipment
) AS s(phone, rn, tracking, ship_status)
JOIN ranked_orders ro ON ro.phone_number = s.phone AND ro.rn = s.rn
JOIN addr ON addr.phone_number = s.phone;


-- ============================================================
-- CARTS (optional seed — 3 users มีของในตะกร้า)
-- ============================================================
INSERT INTO public.carts (user_id)
SELECT id FROM public.users WHERE phone_number IN ('0823456789','0878901234','0890123456')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.cart_items (cart_id, variant_id, quantity)
SELECT c.cart_id, pv.variant_id, ci.qty
FROM public.carts c
JOIN public.users u ON c.user_id = u.id
JOIN (VALUES
  ('0823456789', 'SKU-KHM-5KG',    2),
  ('0823456789', 'SKU-MAM-TYG',    5),
  ('0878901234', 'SKU-NMS-DM-1L',  1),
  ('0878901234', 'SKU-CKO-350ML',  3),
  ('0890123456', 'SKU-TUN-SL-185G',2),
  ('0890123456', 'SKU-HHD-100G',   1)
) AS ci(phone, sku, qty) ON u.phone_number = ci.phone
JOIN public.product_variants pv ON pv.sku = ci.sku
ON CONFLICT (cart_id, variant_id) DO NOTHING;