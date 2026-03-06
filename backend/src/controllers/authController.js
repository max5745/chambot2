const db = require("../config/supabaseClient");
const { signToken } = require("../middleware/auth");

// ─── In-memory OTP store { phone: { otp, expiresAt } } ─────────────────────
const otpStore = new Map();
const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ─── POST /api/auth/request-otp ──────────────────────────────────────────────
const requestOtp = async (req, res) => {
    const { phone } = req.body;
    if (!phone || !/^[0-9]{9,10}$/.test(phone.replace(/[-\s]/g, ""))) {
        return res.status(400).json({ success: false, message: "กรุณากรอกเบอร์โทรที่ถูกต้อง" });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
    otpStore.set(phone, { otp, expiresAt: Date.now() + OTP_TTL_MS });

    // Print to terminal (developer view) — no SMS
    console.log("\n╔══════════════════════════════╗");
    console.log(`  📱 OTP สำหรับ ${phone}`);
    console.log(`  🔑 รหัส OTP: ${otp}`);
    console.log("╚══════════════════════════════╝\n");

    res.status(200).json({ success: true, message: `ส่ง OTP สำเร็จ กรุณาตรวจสอบ Terminal` });
};

// ─── POST /api/auth/verify-otp ───────────────────────────────────────────────
const verifyOtp = async (req, res) => {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
        return res.status(400).json({ success: false, message: "กรุณากรอกเบอร์โทรและ OTP" });
    }

    const record = otpStore.get(phone);
    if (!record) {
        return res.status(400).json({ success: false, message: "ไม่พบ OTP — กรุณาขอใหม่" });
    }
    if (Date.now() > record.expiresAt) {
        otpStore.delete(phone);
        return res.status(400).json({ success: false, message: "OTP หมดอายุแล้ว กรุณาขอใหม่" });
    }
    if (record.otp !== otp.trim()) {
        return res.status(400).json({ success: false, message: "OTP ไม่ถูกต้อง" });
    }

    otpStore.delete(phone); // one-time use

    // ─── Check or create user ────────────────────────────────────────────────
    let user;
    let isNewUser = false;

    try {
        const result = await db.query(
            `SELECT u.*, a.phone_number AS suspended_by_phone
             FROM users u
             LEFT JOIN users a ON a.id = u.suspended_by
             WHERE u.phone_number = $1 LIMIT 1`,
            [phone]
        );
        if (result.rows.length > 0) {
            user = result.rows[0];
        } else {
            // Create new user
            const insert = await db.query(
                "INSERT INTO users (phone_number, role) VALUES ($1, 'customer') RETURNING *",
                [phone]
            );
            user = insert.rows[0];
            isNewUser = true;
        }
    } catch (err) {
        return res.status(500).json({ success: false, message: "DB error: " + err.message });
    }

    // ─── Sign JWT ────────────────────────────────────────────────────────────
    const token = signToken({
        id: user.id,
        phone: user.phone_number,
        role: user.role,
        full_name: user.full_name,
    });

    res.status(200).json({
        success: true,
        token,
        isNewUser,
        user: {
            id: user.id,
            phone: user.phone_number,
            role: user.role,
            full_name: user.full_name,
            is_active: user.is_active,
            suspended_by_phone: user.suspended_by_phone || null,
        },
    });
};

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
const getMe = async (req, res) => {
    try {
        const result = await db.query(
            "SELECT id, phone_number, full_name, role, is_active FROM users WHERE id = $1", [req.user.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: "User not found" });
        res.status(200).json({ success: true, user: result.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─── PATCH /api/auth/profile ──────────────────────────────────────────────────
const updateProfile = async (req, res) => {
    const { full_name } = req.body;
    try {
        const result = await db.query(
            "UPDATE users SET full_name = $1 WHERE id = $2 RETURNING *",
            [full_name, req.user.id]
        );
        res.status(200).json({ success: true, user: result.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = { requestOtp, verifyOtp, getMe, updateProfile };
