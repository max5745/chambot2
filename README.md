# Chambot E-Commerce System

ระบบจัดการร้านค้าออนไลน์ (E-commerce) ครบวงจร พร้อมแดชบอร์ดผู้ดูแลระบบสไตล์โมเดิร์น เชื่อมต่อกับ Supabase PostgreSQL และรองรับการนำเข้าข้อมูลด้วย OCR

## 🚀 คุณสมบัติเด่น (Features)
- **Admin Dashboard**: แดชบอร์ดมืดดีไซน์พรีเมียม (Dark Theme) พร้อมกราฟรายได้และสถิติเรียลไทม์
- **Product & Stock Management**: ระบบจัดการสินค้าและสต็อกแบบ MVC พร้อม Inventory Transactions และแจ้งเตือนสินค้าใกล้หมด
- **Order Tracking**: ระบบติดตามสถานะคำสั่งซื้อแบบ Pipeline
- **Member Management**: ระงับ/เปิดใช้บัญชีสมาชิก, เพิ่มผู้ดูแลด้วยระบบ Dual OTP
- **Semantic Search**: ค้นหาสินค้าด้วย AI Embedding (`intfloat/multilingual-e5-small`, 384 มิติ)
- **OCR Import**: นำเข้าข้อมูลสินค้าจากรูปภาพใบเสร็จอัตโนมัติ
- **System Architecture**: [แผนผังการทำงานและการไหลของข้อมูล](FLOWCHARTS.md)

---

## 🛠️ ขั้นตอนการติดตั้ง (Installation)

### 1. เตรียมฐานข้อมูล (Supabase Setup)
1. สมัครใช้งานที่ [Supabase](https://supabase.com/) แล้วสร้าง Project ใหม่
2. ไปที่ **SQL Editor** → กด **New Query**
3. เปิดไฟล์ `backend/SETUP.sql` → คัดลอกทั้งหมด → วางใน SQL Editor → กด **Run**

> ไฟล์เดียวนี้ครอบคลุมทั้งหมด: ตาราง, View, Index, Extension (pgvector), และ Function สำหรับ semantic search

### 2. ตั้งค่า Backend
1. เปิดโฟลเดอร์ `backend/` แล้วสร้างไฟล์ `.env`:
   ```env
   PORT=5000
   DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   JWT_SECRET=your_random_secret_key_here
   GROQ_API_KEY=your_groq_api_key_here
   ```
   > `DATABASE_URL` หาได้จาก Supabase → **Settings → Database → Connection String → Transaction pooler**

2. ติดตั้ง Dependencies และเริ่ม Server:
   ```bash
   npm install
   npm run dev
   ```

### 3. ตั้งค่า Frontend
1. เปิดโฟลเดอร์ `frontend/` แล้วรัน:
   ```bash
   npm install
   npm start
   ```

---

## 📦 ข้อมูลตัวอย่าง (Sample Data)
หากต้องการใส่ข้อมูลทดสอบ ให้รัน `backend/SAMPLE_ORDERS.sql` ใน SQL Editor ต่อจาก SETUP.sql

---

## 📁 โครงสร้างไฟล์ SQL

| ไฟล์ | คำอธิบาย |
|------|-----------|
| `SETUP.sql` ⭐ | **รัน SQL เพียงไฟล์นี้ไฟล์เดียว** — ครอบคลุมทุก Schema |
| `SAMPLE_ORDERS.sql` | ข้อมูลทดสอบ (ไม่บังคับ) |
| `SCHEMA.sql` | (Legacy) Schema ต้นฉบับ, แทนที่โดย SETUP.sql |
| `MIGRATION.sql` | (Legacy) Migration order tracking, รวมใน SETUP.sql แล้ว |
| `CREATE_VIEWS.sql` | (Legacy) Views, รวมใน SETUP.sql แล้ว |
| `MEMBER_MANAGEMENT_MIGRATION.sql` | (Legacy) Member columns, รวมใน SETUP.sql แล้ว |
| `EMBEDDING_MIGRATION.sql` | (Legacy) Vector columns, รวมใน SETUP.sql แล้ว |

---

## 👥 ติดต่อ (Contact)
หากพบปัญหาหรือต้องการคำแนะนำเพิ่มเติม สามารถสอบถามผ่านทาง GitHub Issues ได้เลยครับ!

