# Chambot E-Commerce System

ระบบจัดการร้านค้าออนไลน์ (E-commerce) ครบวงจร พร้อมแดชบอร์ดผู้ดูแลระบบสไตล์โมเดิร์น เชื่อมต่อกับ Supabase PostgreSQL และรองรับการนำเข้าข้อมูลด้วย OCR

## 🚀 คุณสมบัติเด่น (Features)
- **Admin Dashboard**: แดชบอร์ดมืดดีไซน์พรีเมียม (Dark Theme) พร้อมกราฟรายได้และสถิติเรียลไทม์
- **Product & Stock Management**: ระบบจัดการสินค้าและสต็อกแบบ MVC (Product, Variant, Stock services) พร้อมระบบ Inventory Transactions และแจ้งเตือนสินค้าใกล้หมด
- **Order Tracking**: ระบบติดตามสถานะคำสั่งซื้อแบบ Pipeline
- **Supabase Integration**: ฐานข้อมูลประสิทธิภาพสูง เชื่อมต่อผ่าน pg pool
- **OCR Import**: นำเข้าข้อมูลสินค้าจากรูปภาพใบเสร็จอัตโนมัติ
- **System Architecture**: [แผนผังการทำงานและการไหลของข้อมูล](FLOWCHARTS.md)


---

## 🛠️ ขั้นตอนการติดตั้ง (Installation)

### 1. เตรียมฐานข้อมูล (Supabase Setup)
1. สมัครใช้งานที่ [Supabase](https://supabase.com/)
2. สร้าง Project ใหม่ และจดจำ `Project URL` และ `Service Role Key`
3. ไปที่เมนู **SQL Editor** ใน Supabase:
   - รัน Code จากไฟล์ `backend/SCHEMA.sql` เพื่อสร้างโครงสร้างตาราง
   - รัน Code จากไฟล์ `backend/MIGRATION.sql` เพื่อเพิ่มฟีเจอร์ Tracking
   - รัน Code จากไฟล์ `backend/SEED_DATA.sql` เพื่อเพิ่มข้อมูลตัวอย่าง (10 รายการต่อตาราง)

### 2. ตั้งค่า Backend
1. เปิดโฟลเดอร์ `backend`
2. สร้างไฟล์ `.env` และเพิ่มข้อมูลดังนี้:
   ```env
   PORT=5000
   DATABASE_URL=postgres://postgres:[YOUR_PASSWORD]@[YOUR_DB_HOST]:5432/postgres
   JWT_SECRET=your_jwt_secret_key
   ```
3. ติดตั้ง Dependencies และเริ่ม Server:
   ```bash
   npm install
   npm run dev
   ```

### 3. ตั้งค่า Frontend
1. เปิดโฟลเดอร์ `frontend`
2. ติดตั้ง Dependencies และเข้าสู่โหมด Developer:
   ```bash
   npm install
   npm start
   ```

---

## 📈 ข้อมูลตัวอย่าง (Sample Data)
ระบบมาพร้อมกับไฟล์ `SEED_DATA.sql` ซึ่งประกอบด้วย:
- **10 หมวดหมู่สินค้า**: กาแฟ, ชา, อุปกรณ์ชง, ฯลฯ
- **10 รายการสินค้า**: พร้อมรูปภาพตัวอย่างและตัวแปรสินค้า (Variants)
- **10 บัญชีผู้ใช้**: รวมทั้ง User ทั่วไปและ Admin
- **10 ออเดอร์ทดสอบ**: พร้อมประวัติสถานะการชำระเงินและขนส่ง

---

## 🖥️ หน้าจอการใช้งาน (Screenshots)
- **Admin UI**: ระบบจัดการธีมสีเข้มสไตล์ Medusa/Shopify
- **Dashboard**: แสดงรายได้รวมและรายการที่ต้องดำเนินการทันที

---

## 👥 ติดต่อ (Contact)
หากพบปัญหาหรือต้องการคำแนะนำเพิ่มเติม สามารถสอบถามผ่านทาง GitHub Issues ได้เลยครับ!
