import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, ChevronDown, Eye, X, Phone, MessageSquare } from 'lucide-react';
import { getAdminOrders, getAdminOrderById, updateOrderStatus } from '../../api';
import toast from 'react-hot-toast';

const formatPrice = (p) =>
    new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(p || 0);

const ALL_STATUSES = ['pending', 'paid', 'processing', 'shipped', 'in_transit', 'delivered', 'cancelled', 'refunded'];

const NEXT_STATUSES = {
    pending: ['paid', 'cancelled'],
    paid: ['processing', 'refunded'],
    processing: ['shipped', 'cancelled'],
    shipped: ['in_transit', 'delivered'],
    in_transit: ['delivered'],
    delivered: ['refunded'],
    cancelled: [],
    refunded: [],
};

const STATUS_COLORS = {
    pending: 'badge-orange', paid: 'badge-cyan', processing: 'badge-purple',
    shipped: 'badge-blue', in_transit: 'badge-indigo', delivered: 'badge-green',
    cancelled: 'badge-red', refunded: 'badge-gray',
};

const STATUS_TH = {
    pending: 'รอดำเนินการ', paid: 'ชำระแล้ว', processing: 'กำลังเตรียม',
    shipped: 'จัดส่งแล้ว', in_transit: 'กำลังจัดส่ง', delivered: 'ส่งถึงแล้ว',
    cancelled: 'ยกเลิก', refunded: 'คืนเงินแล้ว',
};

const PAYMENT_TH = {
    cash: 'เงินสด', transfer: 'โอนเงิน', credit_card: 'บัตรเครดิต',
    promptpay: 'พร้อมเพย์', cod: 'เก็บเงินปลายทาง',
};

const STATUS_TIMELINE_COLORS = {
    pending: '#f59e0b', paid: '#06b6d4', processing: '#8b5cf6',
    shipped: '#3b82f6', in_transit: '#6366f1', delivered: '#10b981',
    cancelled: '#ef4444', refunded: '#6b7280',
};

// ─── Update Status Modal ──────────────────────────────────────────────────────
function UpdateModal({ order, onClose, onUpdated }) {
    const [status, setStatus] = useState('');
    const [note, setNote] = useState('');
    const [tracking, setTracking] = useState(order.tracking_number || '');
    const [provider, setProvider] = useState(order.shipping_provider || '');
    const [loading, setLoading] = useState(false);

    const allowed = NEXT_STATUSES[order.status] || [];

    const handleSubmit = async () => {
        if (!status) return toast.error('กรุณาเลือกสถานะ');
        setLoading(true);
        try {
            await updateOrderStatus(order.order_id, {
                status, note: note || undefined,
                tracking_number: tracking || undefined,
                shipping_provider: provider || undefined,
            });
            toast.success(`อัปเดตเป็น "${STATUS_TH[status]}" แล้ว`);
            onUpdated(); onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาด');
        } finally { setLoading(false); }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>อัปเดตสถานะ — #{order.order_id}</h3>
                    <button className="modal-close" onClick={onClose}><X size={18} /></button>
                </div>
                <div className="modal-body">
                    <div className="current-status-row">
                        สถานะปัจจุบัน:&nbsp;
                        <span className={`badge ${STATUS_COLORS[order.status]}`}>{STATUS_TH[order.status]}</span>
                    </div>
                    {allowed.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>ไม่มีสถานะที่สามารถเปลี่ยนได้</p>
                    ) : (
                        <>
                            <div className="input-group" style={{ marginTop: 16 }}>
                                <label className="input-label">สถานะใหม่ *</label>
                                <select className="input-field" value={status} onChange={e => setStatus(e.target.value)}>
                                    <option value="">— เลือกสถานะ —</option>
                                    {allowed.map(s => <option key={s} value={s}>{STATUS_TH[s]}</option>)}
                                </select>
                            </div>
                            <div className="input-group">
                                <label className="input-label">เลขพัสดุ</label>
                                <input className="input-field" value={tracking} onChange={e => setTracking(e.target.value)} placeholder="TH1234567890" />
                            </div>
                            <div className="input-group">
                                <label className="input-label">ขนส่ง</label>
                                <input className="input-field" value={provider} onChange={e => setProvider(e.target.value)} placeholder="Flash Express / Kerry / J&T" />
                            </div>
                            <div className="input-group">
                                <label className="input-label">หมายเหตุ</label>
                                <input className="input-field" value={note} onChange={e => setNote(e.target.value)} placeholder="หมายเหตุเพิ่มเติม..." />
                            </div>
                            <button className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} onClick={handleSubmit} disabled={loading}>
                                {loading ? 'กำลังบันทึก...' : 'บันทึก'}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Order Detail Modal ───────────────────────────────────────────────────────
function OrderDetailModal({ orderId, onClose, onUpdate }) {
    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showUpdateModal, setShowUpdateModal] = useState(false);

    const load = () => {
        setLoading(true);
        getAdminOrderById(orderId)
            .then(res => setDetail(res.data.data))
            .catch(() => toast.error('โหลดข้อมูลไม่สำเร็จ'))
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, [orderId]);

    const handleUpdated = () => { load(); onUpdate(); };

    if (loading) return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box modal-wide" onClick={e => e.stopPropagation()}>
                <div style={{ padding: '3rem', display: 'flex', justifyContent: 'center' }}>
                    <div className="spinner" />
                </div>
            </div>
        </div>
    );

    if (!detail) return null;

    const phone = detail.customer_phone;
    const shipment = detail.shipment;
    const payment = detail.payment;
    const address = shipment?.address || shipment?.address_line || shipment?.recipient_name;
    const payMethod = (payment?.method && (PAYMENT_TH[payment.method] || payment.method)) || '—';
    const payStatus = payment?.status === 'paid' ? '✅ ชำระแล้ว' : payment?.status === 'pending' ? '⏳ รอชำระ' : payment?.status || '—';
    const timeline = detail.timeline || [];

    return (
        <>
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-box modal-wide modal-detail" onClick={e => e.stopPropagation()}>
                    {/* Header */}
                    <div className="modal-header">
                        <div>
                            <h3 style={{ margin: 0 }}>รายละเอียดคำสั่งซื้อ #{detail.order_id}</h3>
                            <div style={{ marginTop: 4, display: 'flex', gap: 8, alignItems: 'center' }}>
                                <span className={`badge ${STATUS_COLORS[detail.status]}`}>{STATUS_TH[detail.status]}</span>
                                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                    {detail.created_at ? new Date(detail.created_at).toLocaleString('th-TH') : ''}
                                </span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            {(NEXT_STATUSES[detail.status] || []).length > 0 && (
                                <button className="btn btn-primary btn-sm" onClick={() => setShowUpdateModal(true)}>
                                    <ChevronDown size={13} /> อัปเดตสถานะ
                                </button>
                            )}
                            <button className="modal-close" onClick={onClose}><X size={18} /></button>
                        </div>
                    </div>

                    <div className="modal-body detail-body">

                        {/* ── Info Cards Row ── */}
                        <div className="detail-info-grid">

                            {/* Customer */}
                            <div className="detail-card">
                                <div className="detail-card-title">👤 ลูกค้า</div>
                                <div className="detail-card-value">{detail.customer_name || 'ไม่ระบุชื่อ'}</div>
                                {phone && (
                                    <div className="contact-links">
                                        <a href={`tel:${phone}`} className="contact-btn call">
                                            <Phone size={13} /> {phone}
                                        </a>
                                        <a
                                            href={`https://line.me/ti/p/~${phone}`}
                                            target="_blank" rel="noreferrer"
                                            className="contact-btn line"
                                        >
                                            💬 LINE
                                        </a>
                                        <a
                                            href={`sms:${phone}?body=สวัสดีครับ เรื่องคำสั่งซื้อ #${detail.order_id}`}
                                            className="contact-btn sms"
                                        >
                                            <MessageSquare size={13} /> SMS
                                        </a>
                                    </div>
                                )}
                            </div>

                            {/* Shipping */}
                            <div className="detail-card">
                                <div className="detail-card-title">📦 การจัดส่ง</div>
                                {detail.tracking_number && (
                                    <div style={{ marginBottom: 6 }}>
                                        <span className="detail-label">ขนส่ง</span>
                                        <span className="detail-val">{detail.shipping_provider || '—'}</span>
                                    </div>
                                )}
                                {detail.tracking_number && (
                                    <div style={{ marginBottom: 6 }}>
                                        <span className="detail-label">เลขพัสดุ</span>
                                        <code className="tracking-code">{detail.tracking_number}</code>
                                    </div>
                                )}
                                <div>
                                    <span className="detail-label">ที่อยู่</span>
                                    <span className="detail-val">{address || 'ไม่มีข้อมูล'}</span>
                                </div>
                            </div>

                            {/* Payment */}
                            <div className="detail-card">
                                <div className="detail-card-title">💳 การชำระเงิน</div>
                                <div style={{ marginBottom: 6 }}>
                                    <span className="detail-label">วิธีชำระ</span>
                                    <span className="detail-val">{payMethod}</span>
                                </div>
                                <div style={{ marginBottom: 6 }}>
                                    <span className="detail-label">สถานะ</span>
                                    <span className="detail-val">{payStatus}</span>
                                </div>
                                {payment?.transaction_ref && (
                                    <div>
                                        <span className="detail-label">Ref</span>
                                        <code className="tracking-code">{payment.transaction_ref}</code>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ── Items Table ── */}
                        <div className="detail-section">
                            <div className="detail-section-title">🛍️ สินค้าในคำสั่งซื้อ</div>
                            {detail.items && detail.items.length > 0 ? (
                                <table className="data-table items-table">
                                    <thead>
                                        <tr>
                                            <th>สินค้า</th>
                                            <th>SKU</th>
                                            <th style={{ textAlign: 'right' }}>ราคา/ชิ้น</th>
                                            <th style={{ textAlign: 'center' }}>จำนวน</th>
                                            <th style={{ textAlign: 'right' }}>รวม</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {detail.items.map((item, idx) => (
                                            <tr key={idx}>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                        {item.image_url && (
                                                            <img src={item.image_url} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }} />
                                                        )}
                                                        <span style={{ fontWeight: 600, fontSize: 14 }}>{item.product_name}</span>
                                                    </div>
                                                </td>
                                                <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.sku || '—'}</td>
                                                <td style={{ textAlign: 'right', color: 'var(--accent)' }}>{formatPrice(item.price)}</td>
                                                <td style={{ textAlign: 'center' }}>×{item.quantity}</td>
                                                <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--accent)' }}>{formatPrice(item.price * item.quantity)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>ไม่มีข้อมูลสินค้า</p>}

                            {/* Total */}
                            <div className="total-row">
                                <span>ยอดรวมทั้งหมด</span>
                                <span className="total-amount">{formatPrice(detail.total_amount)}</span>
                            </div>
                        </div>

                        {/* ── Timeline ── */}
                        <div className="detail-section">
                            <div className="detail-section-title">📋 ประวัติสถานะ</div>
                            {timeline.length === 0 ? (
                                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>ยังไม่มีประวัติ</p>
                            ) : (
                                <div className="admin-timeline">
                                    {[...timeline].reverse().map((entry, idx) => (
                                        <div key={idx} className="atl-item">
                                            <div className="atl-dot" style={{ background: STATUS_TIMELINE_COLORS[entry.status] || '#6b7280' }} />
                                            <div className="atl-content">
                                                <span className={`badge ${STATUS_COLORS[entry.status] || 'badge-gray'}`}>{STATUS_TH[entry.status] || entry.status}</span>
                                                {entry.note && <span className="atl-note">{entry.note}</span>}
                                                <div className="atl-meta">
                                                    {entry.changed_by && <span>{entry.changed_by}</span>}
                                                    <span>{new Date(entry.created_at).toLocaleString('th-TH')}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {showUpdateModal && (
                <UpdateModal order={detail} onClose={() => setShowUpdateModal(false)} onUpdated={handleUpdated} />
            )}
        </>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const OrdersPage = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [updateModal, setUpdateModal] = useState(null);
    const [detailModal, setDetailModal] = useState(null);
    const LIMIT = 15;

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const params = { page, limit: LIMIT };
            if (statusFilter) params.status = statusFilter;
            if (search) params.search = search;
            const res = await getAdminOrders(params);
            setOrders(res.data.data || []);
            setTotal(res.data.total || 0);
        } catch { }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchOrders(); }, [statusFilter, page]);

    const totalPages = Math.ceil(total / LIMIT);

    return (
        <div>
            {updateModal && (
                <UpdateModal order={updateModal} onClose={() => setUpdateModal(null)} onUpdated={fetchOrders} />
            )}
            {detailModal && (
                <OrderDetailModal orderId={detailModal} onClose={() => setDetailModal(null)} onUpdate={fetchOrders} />
            )}

            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">คำสั่งซื้อ</h1>
                    <p className="admin-page-subtitle">{total} รายการ</p>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <div className="admin-search-wrap">
                        <Search size={14} />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && fetchOrders()}
                            placeholder="Order ID / ชื่อ / tracking..."
                            className="admin-search-input"
                        />
                    </div>
                    <select className="input-field" style={{ width: 160 }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
                        <option value="">ทุกสถานะ</option>
                        {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_TH[s]}</option>)}
                    </select>
                    <button className="btn btn-secondary btn-sm" onClick={fetchOrders}><RefreshCw size={14} /></button>
                </div>
            </div>

            <div className="card" style={{ overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: 24 }}>
                        {[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: 52, borderRadius: 8, marginBottom: 8 }} />)}
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>ลูกค้า</th>
                                <th>ยอดรวม</th>
                                <th>สถานะ</th>
                                <th>ชำระเงิน</th>
                                <th>เลขพัสดุ</th>
                                <th>วันที่</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map(o => (
                                <tr key={o.order_id} style={{ cursor: 'pointer' }} onClick={() => setDetailModal(o.order_id)}>
                                    <td style={{ fontWeight: 700 }}>#{o.order_id}</td>
                                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{o.customer_name || '—'}</td>
                                    <td style={{ color: 'var(--accent)', fontWeight: 600 }}>{formatPrice(o.total_amount)}</td>
                                    <td><span className={`badge ${STATUS_COLORS[o.status] || 'badge-gray'}`}>{STATUS_TH[o.status] || o.status}</span></td>
                                    <td><span className={`badge ${o.payment_status === 'paid' ? 'badge-green' : o.payment_status === 'refunded' ? 'badge-red' : 'badge-orange'}`}>{o.payment_status || '—'}</span></td>
                                    <td onClick={e => e.stopPropagation()}>
                                        {o.tracking_number
                                            ? <code style={{ fontSize: 11, background: 'rgba(99,102,241,0.12)', padding: '2px 6px', borderRadius: 4, color: '#a5b4fc' }}>{o.tracking_number}</code>
                                            : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>}
                                    </td>
                                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                                        {o.created_at ? new Date(o.created_at).toLocaleDateString('th-TH') : '—'}
                                    </td>
                                    <td onClick={e => e.stopPropagation()}>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button className="btn btn-secondary btn-sm" onClick={() => setUpdateModal(o)} title="อัปเดตสถานะ">
                                                <ChevronDown size={12} /> อัปเดต
                                            </button>
                                            <button className="btn btn-secondary btn-sm" onClick={() => setDetailModal(o.order_id)} title="รายละเอียด">
                                                <Eye size={12} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {orders.length === 0 && (
                                <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>ไม่พบคำสั่งซื้อ</td></tr>
                            )}
                        </tbody>
                    </table>
                )}

                {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 12, padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← ก่อนหน้า</button>
                        <span style={{ color: 'var(--text-muted)', alignSelf: 'center', fontSize: 13 }}>{page} / {totalPages}</span>
                        <button className="btn btn-secondary btn-sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>ถัดไป →</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrdersPage;
