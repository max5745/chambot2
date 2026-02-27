# ระบบงาน Chambot (System Flowcharts)

เอกสารนี้แสดงแผนผังการทำงาน (Flowcharts) ของระบบหลักในโครงการ Chambot เพื่อให้เข้าใจกระบวนการทำงานของแต่ละส่วนได้ง่ายขึ้น

---

## 0. Context Diagram — ภาพรวมระบบ (Level 0 DFD)
แสดงระบบ Chambot ในฐานะกระบวนการเดียว พร้อม External Entities ทั้งหมดที่โต้ตอบกับระบบ

```mermaid
flowchart LR
    %% ── External Entities ──
    CUST[\"👤 ลูกค้า\\n(Customer)\"]
    ADMIN[\"🛡️ ผู้ดูแลระบบ\\n(Admin)\"]
    SMS[\"📱 SMS Gateway\\n(OTP Provider)\"]
    OCR[\"🔍 OCR Service\\n(Image Processing)\"]
    SHIP[\"🚚 บริษัทขนส่ง\\n(Shipping)\"]

    %% ── System ──
    SYS[\"⚙️ ระบบ CHAMBOT\\n━━━━━━━━━━━━━━━━━\\nFrontend · Backend API\\nMySQL Database\"]

    %% ── Customer ↔ System ──
    CUST -- \"เบอร์โทร / OTP\" --> SYS
    CUST -- \"เลือกสินค้า / สั่งซื้อ\" --> SYS
    CUST -- \"แนบสลิปชำระเงิน\" --> SYS
    SYS -- \"JWT Token / สถานะออเดอร์\" --> CUST
    SYS -- \"รายการสินค้า / ยืนยันคำสั่งซื้อ\" --> CUST

    %% ── Admin ↔ System ──
    ADMIN -- \"จัดการสินค้า / อนุมัติออเดอร์\" --> SYS
    ADMIN -- \"อัปโหลดรูปสินค้า (OCR)\" --> SYS
    ADMIN -- \"เลือกดูรายงาน\" --> SYS
    SYS -- \"ข้อมูลรายงาน / สถิติ\" --> ADMIN
    SYS -- \"รายการออเดอร์ Pending\" --> ADMIN

    %% ── External Services ──
    SYS -- \"ส่งคำขอ OTP\" --> SMS
    SMS -- \"รหัส OTP\" --> CUST

    SYS -- \"ส่งรูปภาพ\" --> OCR
    OCR -- \"ข้อมูลข้อความ (ชื่อ, ราคา, จำนวน)\" --> SYS

    SYS -- \"เลขพัสดุ / ข้อมูลจัดส่ง\" --> SHIP
    SHIP -- \"สถานะการจัดส่ง\" --> SYS

    %% ── Styles ──
    style SYS fill:#1e3a5f,stroke:#4a90d9,color:#ffffff,font-size:14px
    style CUST fill:#2d6a4f,stroke:#74c69d,color:#ffffff
    style ADMIN fill:#6b2737,stroke:#e07b8a,color:#ffffff
    style SMS  fill:#5a3e8a,stroke:#a78bfa,color:#ffffff
    style OCR  fill:#7a4a1e,stroke:#f4a35a,color:#ffffff
    style SHIP fill:#1a5276,stroke:#5dade2,color:#ffffff
```

---

## 1. กระบวนการซื้อสินค้า (Shopping Flow)
แสดงขั้นตอนตั้งแต่ลูกค้าเข้าชมร้านค้าจนถึงสั่งซื้อสำเร็จ

```mermaid
graph TD
    A[ลูกค้าเข้าชมหน้าแรก] --> B[เลือกดูสินค้าตามหมวดหมู่]
    B --> C{ถูกใจสินค้า?}
    C -- ใช่ --> D[เพิ่มสินค้าลงตะกร้า]
    C -- ไม่ --> B
    D --> E[ตรวจสอบตะกร้าสินค้า]
    E --> F[เข้าสู่หน้า Checkout]
    F --> G[กรอกที่อยู่จัดส่ง]
    G --> H[เลือกวิธีชำระเงิน]
    H --> I[ยืนยันการสั่งซื้อ]
    I --> J[ระบบสร้าง Order 'Pending']
    J --> K[ลูกค้าชำระเงิน/แนบสลิป]
    K --> L[สั่งซื้อสำเร็จ - รอการยืนยัน]
```

---

## 2. กระบวนการจัดการคำสั่งซื้อ (Admin Order Flow)
แสดงขั้นตอนการทำงานของฝั่งผู้ดูแลระบบเมื่อได้รับคำสั่งซื้อ

```mermaid
graph TD
    A[รับคำสั่งซื้อใหม่ 'Pending'] --> B{ตรวจสอบการชำระเงิน}
    B -- ไม่ถูกต้อง --> C[แจ้งลูกค้า/ยกเลิกออเดอร์]
    B -- ถูกต้อง --> D[เปลี่ยนสถานะเป็น 'Processing']
    D --> E[จัดเตรียมสินค้า/แพ็คของ]
    E --> F[ออกเลขพัสดุ - Tracking Number]
    F --> G[เปลี่ยนสถานะเป็น 'Shipped']
    G --> H[บริษัทขนส่งนำส่งสินค้า]
    H --> I[ลูกค้าได้รับสินค้า]
    I --> J[เปลี่ยนสถานะเป็น 'Completed']
```

---

## 3. ระบบยืนยันตัวตน (Authentication Flow)
แสดงขั้นตอนการเข้าสู่ระบบด้วยหมายเลขโทรศัพท์และ OTP

```mermaid
graph TD
    A[ผู้ใช้กรอกเบอร์โทรศัพท์] --> B[ระบบส่งรหัส OTP ไปยัง SMS]
    B --> C[ผู้ใช้กรอกรหัส OTP 6 หลัก]
    C --> D{รหัสถูกต้อง?}
    D -- ไม่ --> E[แจ้งให้ลองใหม่ / ขอรหัสใหม่]
    D -- ใช่ --> F{มีบัญชีผู้ใช้อยู่แล้ว?}
    F -- ไม่ --> G[ไปหน้าตั้งค่าโปรไฟล์/สมัครสมาชิก]
    F -- ใช่ --> H[ระบบออก Token - JWT]
    G --> H
    H --> I[เข้าสู่ระบบสำเร็จ]
```

---

## 4. ระบบนำเข้าข้อมูลด้วยรูปภาพ (OCR Import Flow)
แสดงขั้นตอนการเพิ่มสินค้าใหม่ผ่านการสแกนรูปภาพ

```mermaid
graph TD
    A[ผู้ดูแลระบบอัปโหลดรูปภาพสินค้า/ใบเสร็จ] --> B[ระบบส่งรูปไปประมวลผล OCR]
    B --> C[ดึงข้อมูล ชื่อสินค้า, ราคา, จำนวน]
    C --> D[แสดงข้อมูลที่ดึงได้ให้ Admin ตรวจสอบ]
    D --> E{ข้อมูลถูกต้อง?}
    E -- ไม่ --> F[แก้ไขข้อมูลผ่านฟอร์ม]
    E -- ใช่ --> G[บันทึกลงฐานข้อมูล]
    F --> G
    G --> H[สินค้าใหม่ปรากฏในหน้าร้าน]
```

---

## 6. ระบบรายงานและวิเคราะห์ผล (Reporting Flow)
แสดงขั้นตอนการดึงข้อมูลจาก Database มาแสดงเป็นแผนภูมิต่างๆ

```mermaid
graph LR
    A[(Database)] -- SQL Queries --> B[Report Repository]
    B -- Raw Data --> C[Report Service]
    C -- JSON Data --> D[Express API Routes]
    D -- Axios Request --> E[Frontend API Client]
    E -- State hooks --> F[ReportPage Component]
    F -- Props --> G[Stat Cards]
    F -- Chart Data --> H[Recharts Library]
    H --> I[Visual Dashboards]
```

---

## 7. Data Flow Diagram — ภาพรวมระบบ (System-Level DFD)
แสดงการไหลของข้อมูลระหว่าง ลูกค้า, ผู้ดูแลระบบ, Backend API, และ Database

```mermaid
flowchart TD
    subgraph Actors["👥 ผู้ใช้งาน"]
        U["👤 ลูกค้า (Customer)"]
        A["🛡️ ผู้ดูแลระบบ (Admin)"]
    end

    subgraph Frontend["🖥️ Frontend (React)"]
        FE_AUTH["หน้าล็อกอิน / OTP"]
        FE_SHOP["หน้าร้านค้า / รายละเอียดสินค้า"]
        FE_CART["หน้าตะกร้า / Checkout"]
        FE_ORDER["หน้าติดตามคำสั่งซื้อ"]
        FE_ADMIN["Admin Dashboard"]
        FE_REPORT["หน้ารายงาน"]
    end

    subgraph API["⚙️ Backend API (Express.js)"]
        API_AUTH["authRoutes\n/api/auth"]
        API_PROD["productRoutes\n/api/products"]
        API_CAT["categoryRoutes\n/api/categories"]
        API_ORDER["orderRoutes\n/api/orders"]
        API_ADMIN_ORD["adminOrderRoutes\n/api/admin/orders"]
        API_REPORT["reportRoutes\n/api/reports"]
    end

    subgraph DB["🗄️ Database (MySQL)"]
        DB_USERS[("users")]
        DB_PROD[("products")]
        DB_CAT[("categories")]
        DB_ORDERS[("orders\norder_items")]
        DB_PAYMENTS[("payments")]
        DB_INVENTORY[("inventory_transactions")]
    end

    %% ลูกค้า → Frontend
    U -->|"กรอกเบอร์ / OTP"| FE_AUTH
    U -->|"เลือกสินค้า"| FE_SHOP
    U -->|"จัดการตะกร้า"| FE_CART
    U -->|"ติดตามสถานะ"| FE_ORDER

    %% Admin → Frontend
    A -->|"จัดการสินค้า / ออเดอร์"| FE_ADMIN
    A -->|"ดูรายงาน"| FE_REPORT

    %% Frontend → API
    FE_AUTH <-->|"JWT Token / OTP"| API_AUTH
    FE_SHOP <-->|"ข้อมูลสินค้า"| API_PROD
    FE_SHOP <-->|"หมวดหมู่"| API_CAT
    FE_CART <-->|"สร้าง / ยืนยัน Order"| API_ORDER
    FE_ORDER <-->|"สถานะการจัดส่ง"| API_ORDER
    FE_ADMIN <-->|"อัปเดต Order / สต็อก"| API_ADMIN_ORD
    FE_REPORT <-->|"ข้อมูลรายงาน JSON"| API_REPORT

    %% API → Database
    API_AUTH <-->|"CRUD ผู้ใช้"| DB_USERS
    API_PROD <-->|"CRUD สินค้า"| DB_PROD
    API_CAT <-->|"CRUD หมวดหมู่"| DB_CAT
    API_ORDER <-->|"สร้าง / ดึง Order"| DB_ORDERS
    API_ORDER <-->|"บันทึกการชำระเงิน"| DB_PAYMENTS
    API_ADMIN_ORD <-->|"อัปเดตสถานะ / สต็อก"| DB_ORDERS
    API_ADMIN_ORD <-->|"บันทึกรายการสต็อก"| DB_INVENTORY
    API_REPORT -->|"SQL Queries"| DB_ORDERS
    API_REPORT -->|"SQL Queries"| DB_PROD
    API_REPORT -->|"SQL Queries"| DB_PAYMENTS
```

---

## 8. Data Flow — ฝั่งลูกค้า (Customer Data Flow)
แสดงการไหลของข้อมูลตั้งแต่การยืนยันตัวตนจนถึงการสั่งซื้อสำเร็จ

```mermaid
sequenceDiagram
    actor Customer as 👤 ลูกค้า
    participant FE as React Frontend
    participant API as Express API
    participant DB as MySQL DB
    participant SMS as SMS Gateway

    Note over Customer,SMS: ── ขั้นตอนที่ 1: ยืนยันตัวตน ──
    Customer->>FE: กรอกเบอร์โทรศัพท์
    FE->>API: POST /api/auth/send-otp
    API->>SMS: ส่งรหัส OTP
    SMS-->>Customer: รับ SMS รหัส OTP
    Customer->>FE: กรอก OTP 6 หลัก
    FE->>API: POST /api/auth/verify-otp
    API->>DB: ตรวจสอบ/สร้าง users record
    DB-->>API: ข้อมูลผู้ใช้
    API-->>FE: JWT Token
    FE-->>Customer: เข้าสู่ระบบสำเร็จ

    Note over Customer,DB: ── ขั้นตอนที่ 2: เลือกสินค้า ──
    Customer->>FE: เปิดหน้าร้านค้า
    FE->>API: GET /api/products
    API->>DB: SELECT products + categories
    DB-->>API: รายการสินค้า
    API-->>FE: JSON สินค้าทั้งหมด
    FE-->>Customer: แสดงสินค้า

    Note over Customer,DB: ── ขั้นตอนที่ 3: สั่งซื้อ ──
    Customer->>FE: กดชำระเงิน + แนบสลิป
    FE->>API: POST /api/orders (JWT Header)
    API->>DB: INSERT orders + order_items
    API->>DB: INSERT payments (slip_url)
    API->>DB: UPDATE products stock
    DB-->>API: order_id
    API-->>FE: { order_id, status: "pending" }
    FE-->>Customer: หน้ายืนยันการสั่งซื้อ
```

---

## 9. Data Flow — ฝั่งผู้ดูแลระบบ (Admin Data Flow)
แสดงการไหลของข้อมูลสำหรับการจัดการสินค้า, ออเดอร์, และดูรายงาน

```mermaid
sequenceDiagram
    actor Admin as 🛡️ Admin
    participant FE as React Admin Panel
    participant API as Express API
    participant DB as MySQL DB
    participant OCR as OCR Service

    Note over Admin,DB: ── การจัดการสินค้าด้วย OCR ──
    Admin->>FE: อัปโหลดรูปภาพสินค้า
    FE->>API: POST /api/products/ocr
    API->>OCR: ส่งรูปไปประมวลผล
    OCR-->>API: ชื่อ, ราคา, จำนวน (Text)
    API-->>FE: ข้อมูลที่ดึงได้ (JSON)
    FE-->>Admin: แสดงฟอร์มพร้อมข้อมูล
    Admin->>FE: ตรวจสอบ/แก้ไข แล้วกดบันทึก
    FE->>API: POST /api/products
    API->>DB: INSERT products
    DB-->>API: product_id
    API-->>FE: สินค้าสำเร็จ

    Note over Admin,DB: ── การจัดการออเดอร์ ──
    Admin->>FE: เปิดรายการออเดอร์ Pending
    FE->>API: GET /api/admin/orders
    API->>DB: SELECT orders + payments + users
    DB-->>API: รายการออเดอร์พร้อมสลิป
    API-->>FE: JSON รายการออเดอร์
    Admin->>FE: อนุมัติ + ใส่เลข Tracking
    FE->>API: PATCH /api/admin/orders/:id
    API->>DB: UPDATE orders SET status, tracking_number
    API->>DB: INSERT inventory_transactions
    DB-->>API: สำเร็จ
    API-->>FE: สถานะอัปเดตแล้ว

    Note over Admin,DB: ── การดูรายงาน ──
    Admin->>FE: เลือกประเภทรายงาน + ช่วงวันที่
    FE->>API: GET /api/reports/sales?start=&end=
    API->>DB: Complex SQL JOIN (orders, products, payments)
    DB-->>API: Aggregated Data
    API-->>FE: JSON สถิติและตัวเลข
    FE-->>Admin: แสดงกราฟและสรุปผล (Recharts)
```

---

## 5. ระบบจัดการสต็อก (Inventory Flow)
แสดงขั้นตอนการปรับปรุงจำนวนสินค้าและระบบแจ้งเตือน

```mermaid
graph TD
    A[สินค้าถูกขาย] --> B[ระบบลดสต็อกอัตโนมัติ]
    B --> C{จำนวน < จุดสั่งซื้อต่ำสุด?}
    C -- ใช่ --> D[แสดงการแจ้งเตือน Low Stock ที่ Dashboard]
    C -- ไม่ --> E[สต็อกปกติ]
    F[ผู้บริหารเติมสินค้า] --> G[อัปเดตสต็อกในระบบ]
    G --> H[บันทึกประวัติ Inventory Transaction]
```
