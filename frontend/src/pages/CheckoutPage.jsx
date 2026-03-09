import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Truck, MapPin, Phone, User, CheckCircle } from 'lucide-react';
import { createOrder, getImageUrl } from '../api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './CheckoutPage.css';

const formatPrice = (p) =>
    new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(p);

const PAYMENT_METHODS = [
    { value: 'QR', label: 'QR Code', icon: '📱', desc: 'สแกนจ่ายง่าย' },
    { value: 'PromptPay', label: 'PromptPay', icon: '⚡', desc: 'โอนรวดเร็วทันที' },
    { value: 'COD', label: 'เก็บเงินปลายทาง', icon: '💵', desc: 'จ่ายตอนรับสินค้า' },
];

const CheckoutPage = () => {
    const { items, totalPrice, clearCart } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({
        name: user?.name || '', phone: user?.phone || '',
        address: '', payment_method: 'QR'
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.address || !form.name || !form.phone) {
            toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
            return;
        }
        setLoading(true);
        try {
            await createOrder({
                user_id: user?.id || 1,
                total_amount: totalPrice,
                payment_method: form.payment_method,
                address: `${form.name} | ${form.phone} | ${form.address}`,
                items: items.map(i => ({ variant_id: i.variant_id, price: i.price, quantity: i.quantity })),
            });
            clearCart();
            navigate('/order-success');
        } catch (err) {
            toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
        } finally {
            setLoading(false);
        }
    };

    if (items.length === 0) {
        navigate('/cart');
        return null;
    }

    return (
        <div className="page-wrapper">
            <div className="container checkout-layout">
                {/* Form */}
                <form className="checkout-form" onSubmit={handleSubmit}>
                    <h1 className="checkout-title">ชำระเงิน</h1>

                    {/* Delivery Info */}
                    <div className="checkout-section">
                        <h3 className="checkout-section-title"><Truck size={18} /> ข้อมูลการจัดส่ง</h3>
                        <div className="form-grid">
                            <div className="input-group">
                                <label className="input-label"><User size={13} /> ชื่อ-นามสกุล</label>
                                <input name="name" value={form.name} onChange={handleChange} className="input-field" placeholder="กรอกชื่อ-นามสกุล" required />
                            </div>
                            <div className="input-group">
                                <label className="input-label"><Phone size={13} /> เบอร์โทรศัพท์</label>
                                <input name="phone" value={form.phone} onChange={handleChange} className="input-field" placeholder="08X-XXX-XXXX" required />
                            </div>
                        </div>
                        <div className="input-group">
                            <label className="input-label"><MapPin size={13} /> ที่อยู่จัดส่ง</label>
                            <textarea name="address" value={form.address} onChange={handleChange} className="input-field checkout-textarea" placeholder="กรอกที่อยู่จัดส่งให้ครบถ้วน" rows={3} required />
                        </div>
                    </div>

                    {/* Payment */}
                    <div className="checkout-section">
                        <h3 className="checkout-section-title"><CreditCard size={18} /> วิธีชำระเงิน</h3>
                        <div className="payment-grid">
                            {PAYMENT_METHODS.map(m => (
                                <label key={m.value} className={`payment-option ${form.payment_method === m.value ? 'selected' : ''}`}>
                                    <input type="radio" name="payment_method" value={m.value} checked={form.payment_method === m.value} onChange={handleChange} />
                                    <span className="payment-icon">{m.icon}</span>
                                    <div>
                                        <div className="payment-label">{m.label}</div>
                                        <div className="payment-desc">{m.desc}</div>
                                    </div>
                                    {form.payment_method === m.value && <CheckCircle size={16} className="payment-check" />}
                                </label>
                            ))}
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
                        {loading ? <><div className="spinner" style={{ width: 18, height: 18 }} /> กำลังดำเนินการ...</> : `ยืนยันคำสั่งซื้อ • ${formatPrice(totalPrice)}`}
                    </button>
                </form>

                {/* Order Summary */}
                <div className="checkout-summary card">
                    <h3>รายการสินค้า</h3>
                    <div className="divider" />
                    {items.map(item => (
                        <div key={item.key} className="checkout-item">
                            <div className="checkout-item-image">
                                {item.image_url ? <img src={getImageUrl(item.image_url)} alt={item.product_name} /> : <span>🛍️</span>}
                            </div>
                            <div className="checkout-item-info">
                                <p>{item.product_name}</p>
                                <p className="checkout-item-meta">{item.sku} × {item.quantity}</p>
                            </div>
                            <p className="checkout-item-price">{formatPrice(item.price * item.quantity)}</p>
                        </div>
                    ))}
                    <div className="divider" />
                    <div className="checkout-total">
                        <span>ยอดรวม</span>
                        <span className="checkout-total-price">{formatPrice(totalPrice)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;
