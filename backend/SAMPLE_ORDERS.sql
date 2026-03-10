-- =====================================================================
-- CHAMBOT — SAMPLE ORDERS SEED DATA (100 คำสั่งซื้อ มีนาคม 2026)
-- order_status ENUM: 'pending','shipped','delivered','cancelled'
--   (ไม่มี 'confirmed' แล้ว — flow: pending → shipped → delivered)
-- =====================================================================

-- ── 1. Users ─────────────────────────────────────────────────────────
INSERT INTO public.users (phone_number, full_name, role) VALUES
  ('0812345601', 'Admin Chambot',       'admin'),
  ('0812345602', 'สมชาย ใจดี',          'customer'),
  ('0812345603', 'สมศักดิ์ รักไทย',      'customer'),
  ('0812345604', 'มาลี สวนงาม',         'customer'),
  ('0812345605', 'เกียรติ ศรีชัย',       'customer'),
  ('0812345606', 'วิภา พาวเวอร์',        'customer'),
  ('0812345607', 'อุดม โชคดี',          'customer'),
  ('0812345608', 'พัชรา เขียวชอุ่ม',    'customer'),
  ('0812345609', 'ณิชา แครฟท์',         'customer'),
  ('0812345610', 'ตะวัน ฟ้าใส',         'customer'),
  ('0891111001', 'ประภัสสร ทองดี',       'customer'),
  ('0891111002', 'วรรณา สีสด',          'customer'),
  ('0891111003', 'ชัยวัฒน์ มงคล',       'customer'),
  ('0891111004', 'นิภา รุ่งเรือง',       'customer'),
  ('0891111005', 'สุรชัย ดีงาม',         'customer')
ON CONFLICT (phone_number) DO NOTHING;

-- ── 2. Categories ────────────────────────────────────────────────────
INSERT INTO public.categories (name) VALUES
  ('กาแฟเมล็ด'), ('ชาและสมุนไพร'), ('อุปกรณ์ชงกาแฟ'),
  ('แก้วและภาชนะ'), ('เมล็ดพันธุ์เกษตร'), ('ปุ๋ยอินทรีย์'),
  ('เครื่องจักรแปรรูป'), ('ผลิตภัณฑ์แปรรูป'), ('คอร์สอบรม'), ('แพ็คเกจท่องเที่ยว')
ON CONFLICT (name) DO NOTHING;

-- ── 3. Products ───────────────────────────────────────────────────────
INSERT INTO public.products (category_id, name, description, is_active, slug)
SELECT c.category_id, p.pname, p.pdescr, true, p.slug
FROM (VALUES
  ('กาแฟเมล็ด',        'เมล็ดกาแฟอาราบิก้า คั่วกลาง', 'Premium Arabica จากภาคเหนือ',   'arabica-medium'),
  ('ชาและสมุนไพร',     'ชาเขียวออร์แกนิค',             'ใบชาสายพันธุ์พิเศษ',             'organic-greentea'),
  ('อุปกรณ์ชงกาแฟ',   'Drip Kettle 600ml',             'กาน้ำสำหรับ Pour Over',          'drip-kettle-600'),
  ('แก้วและภาชนะ',     'แก้วเซรามิคทำมือ',              'เคลือบสีฟ้าไม่ซ้ำใคร',           'handmade-ceramic-mug'),
  ('เมล็ดพันธุ์เกษตร', 'เมล็ดพันธุ์กัญชงคุณภาพ',       'เมล็ดพันธุ์รับรอง',              'hemp-seed'),
  ('ปุ๋ยอินทรีย์',     'ปุ๋ยหมักชีวภาพ 5kg',            'สูตรเข้มข้นจุลินทรีย์',          'organic-fertilizer-5kg'),
  ('เครื่องจักรแปรรูป','เครื่องสีข้าวพกพา',             'กำลังไฟ 220V',                   'portable-rice-mill'),
  ('ผลิตภัณฑ์แปรรูป',  'แยมสตรอว์เบอร์รี่ดอย',         'ไม่มีน้ำตาลเพิ่ม',               'strawberry-jam-doi'),
  ('คอร์สอบรม',        'Basic Barista Course',           'อบรม 1 วัน เต็ม',               'basic-barista-course'),
  ('แพ็คเกจท่องเที่ยว','One Day Farm Trip',              'ทัวร์ไร่กาแฟ 1 วัน',            'one-day-farm-trip')
) AS p(cat, pname, pdescr, slug)
JOIN public.categories c ON c.name = p.cat
ON CONFLICT (slug) DO NOTHING;

-- ── 4. Product Variants ───────────────────────────────────────────────
INSERT INTO public.product_variants (product_id, sku, price, stock_quantity, low_stock_threshold, is_main)
SELECT p.product_id, v.sku, v.price, v.stock, v.threshold, true
FROM (VALUES
  ('arabica-medium',        'COFFEE-AR-250G',  350.00, 200, 10),
  ('organic-greentea',      'TEA-GRN-50G',     180.00, 200,  5),
  ('drip-kettle-600',       'TOOL-KTL-600',   1200.00, 100,  3),
  ('handmade-ceramic-mug',  'WARE-MUG-HND',    450.00, 200,  5),
  ('hemp-seed',             'SEED-HEM-100G',   890.00, 300, 20),
  ('organic-fertilizer-5kg','FERT-ORG-5KG',   250.00, 200, 10),
  ('portable-rice-mill',    'MACH-RICE-POR', 15500.00,  50,  1),
  ('strawberry-jam-doi',    'FOOD-JAM-STW',    120.00, 300, 10),
  ('basic-barista-course',  'EDU-BAR-BASIC',  2500.00, 100,  5),
  ('one-day-farm-trip',     'TRP-FARM-1D',    1500.00, 100,  5)
) AS v(slug, sku, price, stock, threshold)
JOIN public.products p ON p.slug = v.slug
ON CONFLICT (sku) DO NOTHING;

-- ── 5. User Addresses ─────────────────────────────────────────────────
INSERT INTO public.user_addresses (user_id, recipient_name, address_line, province, postal_code)
SELECT u.id, u.full_name, a.addr, a.prov, a.zip
FROM (VALUES
  ('0812345602', '123 ถ.พระราม 9 แขวงห้วยขวาง',  'กรุงเทพมหานคร', '10310'),
  ('0812345603', '45/1 ถ.นิมมานเหมินท์',           'เชียงใหม่',      '50200'),
  ('0812345604', '99 ถ.สุขุมวิท ซ.11',              'กรุงเทพมหานคร', '10110'),
  ('0812345605', '77 ม.3 ต.นาเกลือ',                'ชลบุรี',         '20150'),
  ('0812345606', '55 ถ.กลางเมือง',                  'ขอนแก่น',       '40000'),
  ('0812345607', '12 ถ.ข้าวสาร แขวงบวรนิเวศ',       'กรุงเทพมหานคร', '10200'),
  ('0812345608', '88 ถ.วิชิตสงคราม',                'ภูเก็ต',         '83000'),
  ('0812345609', '22 ถ.มหาวิทยาลัย',                'พิษณุโลก',      '65000'),
  ('0812345610', '33 ถ.นครใน อ.เมือง',              'สงขลา',          '90000'),
  ('0891111001', '101 ถ.เจริญกรุง',                 'กรุงเทพมหานคร', '10500'),
  ('0891111002', '202 ถ.เชิงดอย',                   'เชียงราย',       '57000'),
  ('0891111003', '303 ม.7 ต.บางพลี',                'สมุทรปราการ',   '10540'),
  ('0891111004', '404 ถ.มิตรภาพ',                   'นครราชสีมา',    '30000'),
  ('0891111005', '505 ถ.ราษฎร์นิยม',                'นนทบุรี',        '11000')
) AS a(phone, addr, prov, zip)
JOIN public.users u ON u.phone_number = a.phone
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_addresses ua WHERE ua.user_id = u.id
);

-- ── 6. 100 Sample Orders — March 2026 ────────────────────────────────
-- order_status: pending | shipped | delivered | cancelled  (ไม่มี confirmed)
-- ทุก order อยู่ในช่วง 2026-03-01 ถึง 2026-03-09
DO $$
DECLARE
  -- user IDs
  uid   int[];
  -- variant lookups
  vids  int[];
  prices numeric[];
  -- working vars
  i       int;
  oid     int;
  rand_u  int;
  rand_v  int;
  rand_v2 int;
  qty1    int;
  qty2    int;
  amt     numeric;
  ostatus order_status;
  pstatus payment_status;
  pmethod payment_method;
  sstat   shipment_status;
  oday    int;
  created_ts timestamptz;
  paid_ts    timestamptz;
  shipped_ts timestamptz;
  providers text[] := ARRAY['Thailand Post','Kerry Express','Flash Express','J&T Express','DHL'];
  phones text[] := ARRAY[
    '0812345602','0812345603','0812345604','0812345605','0812345606',
    '0812345607','0812345608','0812345609','0812345610',
    '0891111001','0891111002','0891111003','0891111004','0891111005'
  ];
BEGIN
  -- รวบรวม user IDs
  uid := ARRAY(
    SELECT id FROM public.users
    WHERE phone_number = ANY(phones)
    ORDER BY id
  );

  -- รวบรวม variant IDs และราคา
  SELECT ARRAY_AGG(variant_id ORDER BY variant_id),
         ARRAY_AGG(price      ORDER BY variant_id)
  INTO vids, prices
  FROM public.product_variants
  WHERE sku = ANY(ARRAY[
    'COFFEE-AR-250G','TEA-GRN-50G','TOOL-KTL-600','WARE-MUG-HND','SEED-HEM-100G',
    'FERT-ORG-5KG','MACH-RICE-POR','FOOD-JAM-STW','EDU-BAR-BASIC','TRP-FARM-1D'
  ]);

  FOR i IN 1..100 LOOP
    -- วันที่สุ่มใน March 2026 (1–9)
    oday       := (i % 9) + 1;
    created_ts := ('2026-03-'|| LPAD(oday::text,2,'0') ||' 08:00:00+07')::timestamptz
                  + (((i * 7919) % 36000) || ' seconds')::interval;

  -- ── ORDER 1: สมชาย — กาแฟ 2 ถุง → delivered / paid (55 วันที่แล้ว)
  -- order_status: 'delivered'  payment_status: 'paid'
  INSERT INTO orders (user_id,total_amount,status,payment_status,created_at,updated_at)
    VALUES (u2, 700.00,'delivered','paid', NOW()-'55 days'::interval, NOW()-'53 days'::interval)
    RETURNING order_id INTO o1;
  INSERT INTO order_items(order_id,variant_id,price,quantity) VALUES(o1,v1,350.00,2);
  -- payment_method: 'qr'  payment_status: 'paid'
  INSERT INTO payments(order_id,method,status,paid_at)
    VALUES(o1,'qr','paid', NOW()-'55 days'::interval);
  -- shipment_status: 'delivered'
  INSERT INTO shipments(order_id,address_id,status,tracking_number,shipped_at)
    VALUES(o1,a2,'delivered','TH-001-SAMPLE', NOW()-'54 days'::interval);
  INSERT INTO order_status_logs(order_id,status,changed_by,note) VALUES
    (o1,'pending',  'system','Order created'),
    (o1,'shipped',  'admin', 'Payment verified & Dispatched via Thailand Post'),
    (o1,'delivered','system','Parcel delivered');

  -- ── ORDER 2: สมศักดิ์ — ชาเขียว 1 กล่อง → shipped / paid (40 วัน)
  INSERT INTO orders (user_id,total_amount,status,payment_status,created_at,updated_at)
    VALUES (u3, 180.00,'shipped','paid', NOW()-'40 days'::interval, NOW()-'38 days'::interval)
    RETURNING order_id INTO o2;
  INSERT INTO order_items(order_id,variant_id,price,quantity) VALUES(o2,v2,180.00,1);
  INSERT INTO payments(order_id,method,status,paid_at)
    VALUES(o2,'qr','paid', NOW()-'40 days'::interval);
  INSERT INTO shipments(order_id,address_id,status,tracking_number,shipped_at)
    VALUES(o2,a3,'shipped','KEX-002-SAMPLE', NOW()-'38 days'::interval);
  INSERT INTO order_status_logs(order_id,status,changed_by,note) VALUES
    (o2,'pending',  'system','Order created'),
    (o2,'shipped',  'admin', 'QR payment confirmed & In transit via Kerry');

  -- ── ORDER 3: มาลี — Drip Kettle 1 → shipped / paid (30 วัน)
  INSERT INTO orders (user_id,total_amount,status,payment_status,created_at,updated_at)
    VALUES (u4, 1200.00,'shipped','paid', NOW()-'30 days'::interval, NOW()-'29 days'::interval)
    RETURNING order_id INTO o3;
  INSERT INTO order_items(order_id,variant_id,price,quantity) VALUES(o3,v3,1200.00,1);
  INSERT INTO payments(order_id,method,status,paid_at)
    VALUES(o3,'qr','paid', NOW()-'30 days'::interval);
  INSERT INTO shipments(order_id,address_id,status) VALUES(o3,a4,'preparing');
  INSERT INTO order_status_logs(order_id,status,changed_by,note) VALUES
    (o3,'pending',  'system','Order placed'),
    (o3,'shipped',  'admin', 'QR scanned & Dispatched');

    -- บางออเดอร์มี 2 รายการ (ทุก i ที่หาร 3 ลงตัว)
    IF i % 3 = 0 THEN
      rand_v2 := ((i * 17 + 3) % 10) + 1;
      IF rand_v2 = rand_v THEN
        rand_v2 := (rand_v % 10) + 1;
      END IF;
      qty2 := ((i * 11) % 2) + 1;
      amt  := amt + prices[rand_v2] * qty2;
    ELSE
      rand_v2 := NULL;
      qty2    := 0;
    END IF;

  -- ── ORDER 5: วิภา — เมล็ดพันธุ์ 1 → delivered / paid (20 วัน)
  INSERT INTO orders (user_id,total_amount,status,payment_status,created_at,updated_at)
    VALUES (u6, 890.00,'delivered','paid', NOW()-'20 days'::interval, NOW()-'17 days'::interval)
    RETURNING order_id INTO o5;
  INSERT INTO order_items(order_id,variant_id,price,quantity) VALUES(o5,v5,890.00,1);
  INSERT INTO payments(order_id,method,status,paid_at)
    VALUES(o5,'qr','paid', NOW()-'20 days'::interval);
  INSERT INTO shipments(order_id,address_id,status,tracking_number,shipped_at)
    VALUES(o5,a6,'delivered','JT-005-SAMPLE', NOW()-'19 days'::interval);
  INSERT INTO order_status_logs(order_id,status,changed_by,note) VALUES
    (o5,'pending', 'system','Order created'),
    (o5,'shipped', 'admin', 'Payment verified & Out for delivery'),
    (o5,'delivered','system','Successfully delivered');

    -- วิธีชำระเงิน (qr 70%, cod 30%)
    IF i % 10 < 7 THEN
      pmethod := 'qr';
    ELSE
      pmethod := 'cod';
      -- COD ที่ยังไม่ส่งให้ payment pending
      IF ostatus = 'pending' THEN pstatus := 'pending'; END IF;
    END IF;

  -- ── ORDER 7: พัชรา — เครื่องสีข้าว 1 → delivered / paid (12 วัน)
  INSERT INTO orders (user_id,total_amount,status,payment_status,created_at,updated_at)
    VALUES (u8, 15500.00,'delivered','paid', NOW()-'12 days'::interval, NOW()-'9 days'::interval)
    RETURNING order_id INTO o7;
  INSERT INTO order_items(order_id,variant_id,price,quantity) VALUES(o7,v7,15500.00,1);
  INSERT INTO payments(order_id,method,status,paid_at)
    VALUES(o7,'qr','paid', NOW()-'12 days'::interval);
  INSERT INTO shipments(order_id,address_id,status,tracking_number,shipped_at)
    VALUES(o7,a8,'delivered','DHL-007-SAMPLE', NOW()-'11 days'::interval);
  INSERT INTO order_status_logs(order_id,status,changed_by,note) VALUES
    (o7,'pending', 'system','Large order placed'),
    (o7,'shipped', 'admin', 'QR payment confirmed & Dispatched via DHL'),
    (o7,'delivered','system','Signature obtained');

  -- ── ORDER 8: ณิชา — แยม 3 ขวด → shipped / paid (8 วัน)
  INSERT INTO orders (user_id,total_amount,status,payment_status,created_at,updated_at)
    VALUES (u9, 360.00,'shipped','paid', NOW()-'8 days'::interval, NOW()-'7 days'::interval)
    RETURNING order_id INTO o8;
  INSERT INTO order_items(order_id,variant_id,price,quantity) VALUES(o8,v8,120.00,3);
  INSERT INTO payments(order_id,method,status,paid_at)
    VALUES(o8,'qr','paid', NOW()-'8 days'::interval);
  INSERT INTO shipments(order_id,address_id,status,tracking_number,shipped_at)
    VALUES(o8,a9,'shipped','EE-008-SAMPLE', NOW()-'7 days'::interval);
  INSERT INTO order_status_logs(order_id,status,changed_by,note) VALUES
    (o8,'pending', 'system','Order placed'),
    (o8,'shipped', 'admin', 'Payment received & In transit — EMS');

    -- INSERT order_items (รายการแรก)
    INSERT INTO public.order_items (order_id, variant_id, price, quantity)
    VALUES (oid, vids[rand_v], prices[rand_v], qty1);

  -- ── ORDER 10: สมชาย — Farm Trip 2 ที่ → pending / paid (2 วัน)
  INSERT INTO orders (user_id,total_amount,status,payment_status,created_at,updated_at)
    VALUES (u2, 3000.00,'pending','paid', NOW()-'2 days'::interval, NOW()-'2 days'::interval)
    RETURNING order_id INTO o10;
  INSERT INTO order_items(order_id,variant_id,price,quantity) VALUES(o10,v10,1500.00,2);
  INSERT INTO payments(order_id,method,status,paid_at)
    VALUES(o10,'qr','paid', NOW()-'2 days'::interval);
  INSERT INTO shipments(order_id,address_id,status) VALUES(o10,a2,'preparing');
  INSERT INTO order_status_logs(order_id,status,changed_by,note) VALUES
    (o10,'pending',  'system','Trip reservation');

    -- INSERT payment
    INSERT INTO public.payments (order_id, method, status, paid_at, created_at)
    VALUES (oid, pmethod, pstatus, paid_ts, created_ts);

    -- INSERT shipment
    INSERT INTO public.shipments (order_id, address_id, status, shipped_at, created_at)
    SELECT oid, ua.address_id, sstat, shipped_ts, created_ts
    FROM public.user_addresses ua
    WHERE ua.user_id = rand_u
    LIMIT 1;

    -- INSERT status logs (ไม่มี 'confirmed')
    INSERT INTO public.order_status_logs
      (order_id, status, changed_by, note, created_at)
    VALUES
      (oid, 'pending', 'system', 'Order created', created_ts);

    IF ostatus IN ('shipped','delivered','cancelled') THEN
      IF ostatus = 'cancelled' THEN
        INSERT INTO public.order_status_logs
          (order_id, status, changed_by, note, created_at)
        VALUES
          (oid, 'cancelled', 'admin', 'ลูกค้าขอยกเลิก', created_ts + '2 hours'::interval);
      ELSE
        INSERT INTO public.order_status_logs
          (order_id, status, changed_by, note, created_at)
        VALUES
          (oid, 'shipped', 'admin', 'จัดส่งสินค้าแล้ว', created_ts + '1 day'::interval);
        IF ostatus = 'delivered' THEN
          INSERT INTO public.order_status_logs
            (order_id, status, changed_by, note, created_at)
          VALUES
            (oid, 'delivered', 'system', 'ส่งสำเร็จ', created_ts + '3 days'::interval);
        END IF;
      END IF;
    END IF;

    -- INSERT inventory transaction
    INSERT INTO public.inventory_transactions
      (variant_id, transaction_type, quantity_changed, reference_order_id, notes, created_at)
    VALUES
      (vids[rand_v],
       CASE WHEN ostatus = 'cancelled' THEN 'cancel' ELSE 'purchase' END,
       CASE WHEN ostatus = 'cancelled' THEN qty1 ELSE -qty1 END,
       oid,
       'Order #' || oid || ' — มีนาคม 2026',
       created_ts);

  END LOOP;

  RAISE NOTICE '✅ 100 March-2026 sample orders inserted (no "confirmed" status)!';
END $$;
