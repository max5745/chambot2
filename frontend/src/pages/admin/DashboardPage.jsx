import React, { useEffect, useState } from 'react';
import {
    Package, ShoppingBag, AlertTriangle, TrendingUp,
    ArrowUp, ChevronRight, DollarSign, Users, Eye, Plus
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getProducts, getOrders, getLowStockProducts } from '../../api';
import ProductImage from '../../components/ProductImage';
import './DashboardPage.css';

const StatCard = ({ icon, label, value, color, sub, trend, trendUp }) => (
    <div className="stat-card card">
        <div className="stat-card-icon" style={{ background: color }}>
            {icon}
        </div>
        <div className="stat-card-info">
            <p className="stat-card-label">{label}</p>
            <p className="stat-card-value">{value}</p>
            {trend && (
                <p className={`stat-card-trend ${trendUp ? 'trend-up' : 'trend-down'}`}>
                    <ArrowUp size={11} style={{ transform: trendUp ? 'none' : 'rotate(180deg)' }} />
                    {trend}
                </p>
            )}
            {sub && !trend && <p className="stat-card-sub">{sub}</p>}
        </div>
    </div>
);

const DashboardPage = () => {
    const [stats, setStats] = useState({ products: 0, orders: 0, lowStock: 0, pending: 0, revenue: 0 });
    const [lowStockItems, setLowStockItems] = useState([]);
    const [recentOrders, setRecentOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [prodRes, ordersRes, lowRes] = await Promise.allSettled([
                    getProducts(), getOrders(), getLowStockProducts()
                ]);
                const products = prodRes.status === 'fulfilled' ? prodRes.value.data.data || [] : [];
                const orders = ordersRes.status === 'fulfilled' ? ordersRes.value.data.data || [] : [];
                const low = lowRes.status === 'fulfilled' ? lowRes.value.data.data || [] : [];

                const revenue = orders
                    .filter(o => ['completed', 'delivered', 'shipped'].includes(o.status))
                    .reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);

                setStats({
                    products: products.length,
                    orders: orders.length,
                    lowStock: low.length,
                    pending: orders.filter(o => o.status === 'pending').length,
                    revenue,
                });
                setLowStockItems(low.slice(0, 6));
                setRecentOrders(orders.slice(0, 6));
            } catch { }
            finally { setLoading(false); }
        };
        fetchAll();
    }, []);

    const fmt = (n) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(n);

    const getStatusBadge = (status) => {
        const map = {
            pending: 'badge-orange',
            processing: 'badge-cyan',
            shipped: 'badge-blue',
            in_transit: 'badge-purple',
            delivered: 'badge-green',
            completed: 'badge-green',
            cancelled: 'badge-red'
        };
        return `badge ${map[status] || 'badge-gray'}`;
    };

    const statusLabel = {
        pending: 'รอดำเนินการ', processing: 'กำลังเตรียม', shipped: 'จัดส่งแล้ว',
        in_transit: 'อยู่ระหว่างขนส่ง', delivered: 'ส่งมอบแล้ว',
        completed: 'สำเร็จ', cancelled: 'ยกเลิก'
    };

    return (
        <div className="fade-in">
            {/* Page Header */}
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">Dashboard</h1>
                    <p className="admin-page-subtitle">ภาพรวมร้านค้า Chambot — อัปเดตล่าสุดวันนี้</p>
                </div>
                <div className="quick-actions">
                    <Link to="/admin/products" className="quick-action-btn">
                        <Plus size={14} /> เพิ่มสินค้า
                    </Link>
                    <Link to="/admin/orders" className="quick-action-btn">
                        <Eye size={14} /> ดูคำสั่งซื้อ
                    </Link>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="stats-grid">
                <div className="stat-card card">
                    <div className="stat-card-icon" style={{ background: 'rgba(99,102,241,0.15)' }}>
                        <DollarSign size={22} color="#a5b4fc" />
                    </div>
                    <div className="stat-card-info">
                        <p className="stat-card-label">รายได้รวม</p>
                        {loading
                            ? <div className="skeleton" style={{ height: 32, width: 140, marginTop: 4 }} />
                            : <p className="revenue-highlight">{fmt(stats.revenue).replace('฿', '฿')}</p>
                        }
                        <p className="revenue-period">จากออเดอร์ที่สำเร็จ</p>
                    </div>
                </div>
                <StatCard icon={<ShoppingBag size={22} color="#22d3ee" />} label="คำสั่งซื้อทั้งหมด"
                    value={loading ? '—' : stats.orders} color="rgba(34,211,238,0.12)"
                    sub="ทุกสถานะ" />
                <StatCard icon={<Package size={22} color="#34d399" />} label="สินค้าในระบบ"
                    value={loading ? '—' : stats.products} color="rgba(52,211,153,0.12)"
                    sub="รายการทั้งหมด" />
                <StatCard icon={<AlertTriangle size={22} color="#fb923c" />} label="รอดำเนินการ"
                    value={loading ? '—' : stats.pending} color="rgba(251,146,60,0.12)"
                    sub="ออเดอร์ใหม่" />
            </div>

            {/* Low Stock Alert banner */}
            {stats.lowStock > 0 && !loading && (
                <div style={{
                    background: 'rgba(251,146,60,0.08)',
                    border: '1px solid rgba(251,146,60,0.2)',
                    borderRadius: 12,
                    padding: '14px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 20,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <AlertTriangle size={16} color="#fb923c" />
                        <span style={{ color: '#fb923c', fontWeight: 600, fontSize: 14 }}>
                            มี {stats.lowStock} รายการที่สต็อกใกล้หมด — ควรเติมสต็อกเพิ่ม
                        </span>
                    </div>
                    <Link to="/admin/stock" className="view-all-link">
                        จัดการสต็อก <ChevronRight size={14} />
                    </Link>
                </div>
            )}

            {/* Tables Grid */}
            <div className="dashboard-grid">
                {/* Low Stock Table */}
                <div className="card dashboard-card">
                    <div className="dashboard-card-header">
                        <h3><AlertTriangle size={15} color="#fb923c" /> สินค้าสต็อกต่ำ</h3>
                        <Link to="/admin/stock" className="view-all-link">
                            จัดการทั้งหมด <ChevronRight size={13} />
                        </Link>
                    </div>
                    {loading ? (
                        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 44 }} />)}
                        </div>
                    ) : lowStockItems.length === 0 ? (
                        <div className="empty-state">
                            <Package size={40} />
                            <p>สต็อกปกติทุกรายการ 🎉</p>
                        </div>
                    ) : (
                        <table className="data-table">
                            <thead><tr><th>รูป</th><th>สินค้า</th><th>SKU</th><th>สต็อก</th></tr></thead>
                            <tbody>
                                {lowStockItems.map(i => (
                                    <tr key={i.variant_id}>
                                        <td>
                                            <div style={{ width: 32, height: 32, borderRadius: 6, overflow: 'hidden', background: 'rgba(255,255,255,0.05)' }}>
                                                <ProductImage src={i.image_url} alt={i.product_name} size={14} />
                                            </div>
                                        </td>
                                        <td style={{ fontWeight: 500, color: 'rgba(255,255,255,0.8)' }}>{i.product_name}</td>
                                        <td style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, fontFamily: 'monospace' }}>{i.sku}</td>
                                        <td><span className="badge badge-orange">{i.stock_quantity}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Recent Orders Table */}
                <div className="card dashboard-card">
                    <div className="dashboard-card-header">
                        <h3><ShoppingBag size={15} color="#22d3ee" /> คำสั่งซื้อล่าสุด</h3>
                        <Link to="/admin/orders" className="view-all-link">
                            ดูทั้งหมด <ChevronRight size={13} />
                        </Link>
                    </div>
                    {loading ? (
                        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 44 }} />)}
                        </div>
                    ) : recentOrders.length === 0 ? (
                        <div className="empty-state">
                            <ShoppingBag size={40} />
                            <p>ยังไม่มีคำสั่งซื้อ</p>
                        </div>
                    ) : (
                        <table className="data-table">
                            <thead><tr><th>Order</th><th>ลูกค้า</th><th>ยอด</th><th>สถานะ</th></tr></thead>
                            <tbody>
                                {recentOrders.map(o => (
                                    <tr key={o.order_id}>
                                        <td style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace', fontSize: 13 }}>
                                            #{o.order_id}
                                        </td>
                                        <td style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
                                            {o.customer_name || '—'}
                                        </td>
                                        <td style={{ color: '#a5b4fc', fontWeight: 600, fontSize: 13 }}>
                                            {fmt(o.total_amount || 0)}
                                        </td>
                                        <td><span className={getStatusBadge(o.status)}>{statusLabel[o.status] || o.status}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
