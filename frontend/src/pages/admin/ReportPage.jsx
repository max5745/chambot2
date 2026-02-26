import React, { useState, useEffect, useCallback } from 'react';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
    TrendingUp, Package, Archive, Users, DollarSign,
    AlertTriangle, RefreshCw, ChevronDown,
} from 'lucide-react';
import {
    getSalesReport, getProductReport, getInventoryReport,
    getCustomerReport, getFinancialReport,
} from '../../api';
import toast from 'react-hot-toast';
import './ReportPage.css';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (n) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(n || 0);
const num = (n) => new Intl.NumberFormat('th-TH').format(n || 0);
const pct = (a, b) => (b ? ((a / b) * 100).toFixed(1) + '%' : '—');

const TABS = [
    { id: 'sales', label: 'ยอดขาย', icon: TrendingUp },
    { id: 'products', label: 'สินค้า', icon: Package },
    { id: 'inventory', label: 'คลังสินค้า', icon: Archive },
    { id: 'customers', label: 'ลูกค้า', icon: Users },
    { id: 'financial', label: 'การเงิน', icon: DollarSign },
];

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6', '#ec4899', '#14b8a6'];

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent }) {
    return (
        <div className="rpt-stat-card">
            <div className="rpt-stat-label">{label}</div>
            <div className="rpt-stat-value" style={{ color: accent }}>{value}</div>
            {sub && <div className="rpt-stat-sub">{sub}</div>}
        </div>
    );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────
function Skeleton({ h = 240 }) {
    return <div className="skeleton rpt-skeleton" style={{ height: h }} />;
}

// ─── Date Range Picker ────────────────────────────────────────────────────────
function DateFilter({ start, end, onStart, onEnd, onReset, loading, groupBy, onGroupBy }) {
    return (
        <div className="rpt-date-bar">
            <div className="rpt-date-group">
                <label>จาก</label>
                <input type="date" className="input-field rpt-date-input" value={start} onChange={e => onStart(e.target.value)} />
            </div>
            <div className="rpt-date-group">
                <label>ถึง</label>
                <input type="date" className="input-field rpt-date-input" value={end} onChange={e => onEnd(e.target.value)} />
            </div>
            {onGroupBy && (
                <div className="rpt-date-group">
                    <label>กลุ่มตาม</label>
                    <select className="input-field rpt-date-input" value={groupBy} onChange={e => onGroupBy(e.target.value)}>
                        <option value="day">รายวัน</option>
                        <option value="month">รายเดือน</option>
                    </select>
                </div>
            )}
            <button className="btn btn-secondary btn-sm" onClick={onReset} disabled={loading} title="รีเซ็ต">
                <RefreshCw size={14} />
            </button>
        </div>
    );
}

// ─── SALES TAB ────────────────────────────────────────────────────────────────
function SalesTab({ start, end, groupBy }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        getSalesReport({ startDate: start, endDate: end, groupBy })
            .then(r => setData(r.data.data))
            .catch(() => toast.error('โหลด Sales Report ไม่สำเร็จ'))
            .finally(() => setLoading(false));
    }, [start, end, groupBy]);

    if (loading) return (<><Skeleton /><Skeleton h={200} /></>);
    if (!data) return null;
    const { summary, by_period, by_product, by_category } = data;

    return (
        <div className="rpt-tab-content">
            {/* Summary cards */}
            <div className="rpt-stat-grid">
                <StatCard label="รายได้รวม" value={fmt(summary.total_revenue)} accent="#10b981" />
                <StatCard label="คำสั่งซื้อทั้งหมด" value={num(summary.total_orders)} accent="#6366f1" />
                <StatCard label="ค่าเฉลี่ย/ออเดอร์" value={fmt(summary.avg_order_value)} accent="#f59e0b" />
            </div>

            {/* Revenue by period */}
            <div className="rpt-chart-card">
                <h3 className="rpt-chart-title">📈 รายได้ตามช่วงเวลา</h3>
                {by_period.length === 0
                    ? <p className="rpt-empty">ไม่มีข้อมูลในช่วงที่เลือก</p>
                    : (
                        <ResponsiveContainer width="100%" height={260}>
                            <LineChart data={by_period}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                <XAxis dataKey="period" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                                <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} tickFormatter={v => '฿' + (v / 1000).toFixed(0) + 'k'} />
                                <Tooltip
                                    contentStyle={{ background: '#13151f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                                    itemStyle={{ fontSize: 13 }}
                                    formatter={(v, n) => [n === 'revenue' ? fmt(v) : num(v), n === 'revenue' ? 'รายได้' : 'ออเดอร์']}
                                />
                                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2.5} dot={false} name="revenue" />
                                <Line type="monotone" dataKey="orders" stroke="#6366f1" strokeWidth={2} dot={false} name="orders" />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
            </div>

            <div className="rpt-two-col">
                {/* Revenue by product */}
                <div className="rpt-chart-card">
                    <h3 className="rpt-chart-title">🛍️ รายได้ตามสินค้า (Top 10)</h3>
                    {by_product.length === 0
                        ? <p className="rpt-empty">ไม่มีข้อมูล</p>
                        : (
                            <ResponsiveContainer width="100%" height={260}>
                                <BarChart data={by_product.slice(0, 10)} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
                                    <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 10 }} tickFormatter={v => '฿' + (v / 1000).toFixed(0) + 'k'} />
                                    <YAxis type="category" dataKey="product_name" tick={{ fill: '#9ca3af', fontSize: 10 }} width={120} />
                                    <Tooltip contentStyle={{ background: '#13151f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                                        itemStyle={{ fontSize: 13 }}
                                        formatter={v => [fmt(v), 'รายได้']} />
                                    <Bar dataKey="revenue" fill="#6366f1" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                </div>

                {/* Revenue by category */}
                <div className="rpt-chart-card">
                    <h3 className="rpt-chart-title">🏷️ รายได้ตามหมวดหมู่</h3>
                    {by_category.length === 0
                        ? <p className="rpt-empty">ไม่มีข้อมูล</p>
                        : (
                            <ResponsiveContainer width="100%" height={260}>
                                <PieChart>
                                    <Pie data={by_category} dataKey="revenue" nameKey="category_name"
                                        cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        labelLine={false}>
                                        {by_category.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ background: '#13151f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                                        itemStyle={{ fontSize: 13 }}
                                        formatter={v => [fmt(v), 'รายได้']} />
                                    <Legend wrapperStyle={{ fontSize: 12, color: '#9ca3af' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                </div>
            </div>
        </div>
    );
}

// ─── PRODUCTS TAB ─────────────────────────────────────────────────────────────
function ProductsTab({ start, end }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        getProductReport({ startDate: start, endDate: end })
            .then(r => setData(r.data.data))
            .catch(() => toast.error('โหลด Product Report ไม่สำเร็จ'))
            .finally(() => setLoading(false));
    }, [start, end]);

    if (loading) return <Skeleton />;
    if (!data) return null;
    const { top_selling, low_selling } = data;

    return (
        <div className="rpt-tab-content">
            <div className="rpt-two-col">
                <div className="rpt-chart-card">
                    <h3 className="rpt-chart-title">🏆 สินค้าขายดี Top 10</h3>
                    <table className="data-table rpt-table">
                        <thead><tr><th>#</th><th>สินค้า</th><th>ขายได้</th><th>รายได้</th></tr></thead>
                        <tbody>
                            {top_selling.map((p, i) => (
                                <tr key={p.product_id}>
                                    <td style={{ fontWeight: 700, color: i < 3 ? '#f59e0b' : '#6b7280' }}>{i + 1}</td>
                                    <td style={{ fontSize: 13 }}>{p.product_name}</td>
                                    <td style={{ color: '#10b981', textAlign: 'right' }}>{num(p.units_sold)} ชิ้น</td>
                                    <td style={{ color: '#6366f1', fontWeight: 600, textAlign: 'right' }}>{fmt(p.revenue)}</td>
                                </tr>
                            ))}
                            {top_selling.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', color: '#6b7280' }}>ไม่มีข้อมูล</td></tr>}
                        </tbody>
                    </table>
                </div>

                <div className="rpt-chart-card">
                    <h3 className="rpt-chart-title">📉 สินค้าขายช้า</h3>
                    <table className="data-table rpt-table">
                        <thead><tr><th>สินค้า</th><th>ขายได้</th><th>คงเหลือ</th></tr></thead>
                        <tbody>
                            {low_selling.map(p => (
                                <tr key={p.product_id}>
                                    <td style={{ fontSize: 13 }}>{p.product_name}</td>
                                    <td style={{ color: '#f59e0b', textAlign: 'right' }}>{num(p.units_sold)} ชิ้น</td>
                                    <td style={{ textAlign: 'right' }}>{num(p.stock_remaining)}</td>
                                </tr>
                            ))}
                            {low_selling.length === 0 && <tr><td colSpan={3} style={{ textAlign: 'center', color: '#6b7280' }}>ไม่มีข้อมูล</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="rpt-chart-card">
                <h3 className="rpt-chart-title">📊 ยอดขายสินค้า (กราฟ)</h3>
                {top_selling.length > 0 ? (
                    <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={top_selling.slice(0, 10)}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                            <XAxis dataKey="product_name" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                            <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} />
                            <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }}
                                formatter={v => [num(v), 'จำนวน']} />
                            <Bar dataKey="units_sold" radius={[4, 4, 0, 0]}>
                                {top_selling.slice(0, 10).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                ) : <p className="rpt-empty">ไม่มีข้อมูล</p>}
            </div>
        </div>
    );
}

// ─── INVENTORY TAB ────────────────────────────────────────────────────────────
function InventoryTab() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        getInventoryReport()
            .then(r => setData(r.data.data))
            .catch(() => toast.error('โหลด Inventory Report ไม่สำเร็จ'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <Skeleton />;
    if (!data) return null;
    const { low_stock, out_of_stock, summary } = data;

    return (
        <div className="rpt-tab-content">
            <div className="rpt-stat-grid">
                <StatCard label="สินค้าทั้งหมด (variant)" value={num(summary?.total_variants)} accent="#6366f1" />
                <StatCard label="จำนวนหน่วยคงเหลือ" value={num(summary?.total_units)} accent="#10b981" />
                <StatCard label="มูลค่าสินค้าในคลัง" value={fmt(summary?.inventory_value_at_price)} accent="#f59e0b" />
            </div>

            {out_of_stock.length > 0 && (
                <div className="rpt-alert-box">
                    <AlertTriangle size={16} /> สินค้าหมดสต็อก {out_of_stock.length} รายการ
                </div>
            )}

            <div className="rpt-two-col">
                <div className="rpt-chart-card">
                    <h3 className="rpt-chart-title">⚠️ สต็อกต่ำ ({low_stock.length} รายการ)</h3>
                    <table className="data-table rpt-table">
                        <thead><tr><th>สินค้า</th><th>SKU</th><th>คงเหลือ</th><th>ขั้นต่ำ</th></tr></thead>
                        <tbody>
                            {low_stock.map(v => (
                                <tr key={v.variant_id}>
                                    <td style={{ fontSize: 13 }}>{v.product_name}</td>
                                    <td style={{ fontSize: 12, color: '#6b7280' }}>{v.sku}</td>
                                    <td><span className="badge badge-orange">{v.stock_quantity}</span></td>
                                    <td style={{ color: '#6b7280' }}>{v.low_stock_threshold}</td>
                                </tr>
                            ))}
                            {low_stock.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', color: '#10b981' }}>✅ สต็อกปกติทุกรายการ</td></tr>}
                        </tbody>
                    </table>
                </div>

                <div className="rpt-chart-card">
                    <h3 className="rpt-chart-title">🚫 สินค้าหมดสต็อก ({out_of_stock.length} รายการ)</h3>
                    <table className="data-table rpt-table">
                        <thead><tr><th>สินค้า</th><th>SKU</th></tr></thead>
                        <tbody>
                            {out_of_stock.map(v => (
                                <tr key={v.variant_id}>
                                    <td style={{ fontSize: 13 }}>{v.product_name}</td>
                                    <td style={{ fontSize: 12, color: '#ef4444' }}>{v.sku}</td>
                                </tr>
                            ))}
                            {out_of_stock.length === 0 && <tr><td colSpan={2} style={{ textAlign: 'center', color: '#10b981' }}>✅ ไม่มีสินค้าหมด</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// ─── CUSTOMERS TAB ────────────────────────────────────────────────────────────
function CustomersTab({ start, end }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        getCustomerReport({ startDate: start, endDate: end })
            .then(r => setData(r.data.data))
            .catch(() => toast.error('โหลด Customer Report ไม่สำเร็จ'))
            .finally(() => setLoading(false));
    }, [start, end]);

    if (loading) return <Skeleton />;
    if (!data) return null;
    const { new_customers, top_spenders, repeat_buyers } = data;

    return (
        <div className="rpt-tab-content">
            <div className="rpt-stat-grid">
                <StatCard label="ลูกค้าใหม่ (ช่วงที่เลือก)" value={num(new_customers)} accent="#10b981" />
                <StatCard label="ลูกค้าซื้อซ้ำ" value={num(repeat_buyers.length)} accent="#6366f1" />
                <StatCard label="LTV สูงสุด" value={fmt(top_spenders[0]?.total_spent)} accent="#f59e0b" />
            </div>

            <div className="rpt-two-col">
                <div className="rpt-chart-card">
                    <h3 className="rpt-chart-title">💎 ลูกค้ายอดชมรม (Top 10 ใช้จ่ายสูงสุด)</h3>
                    <table className="data-table rpt-table">
                        <thead><tr><th>#</th><th>ชื่อ</th><th>ออเดอร์</th><th>ใช้จ่ายรวม</th></tr></thead>
                        <tbody>
                            {top_spenders.map((c, i) => (
                                <tr key={c.id}>
                                    <td style={{ fontWeight: 700, color: i < 3 ? '#f59e0b' : '#6b7280' }}>{i + 1}</td>
                                    <td>
                                        <div style={{ fontSize: 13, fontWeight: 600 }}>{c.full_name || 'ไม่ระบุ'}</div>
                                        <div style={{ fontSize: 11, color: '#6b7280' }}>{c.phone_number}</div>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>{c.total_orders}</td>
                                    <td style={{ color: '#10b981', fontWeight: 700, textAlign: 'right' }}>{fmt(c.total_spent)}</td>
                                </tr>
                            ))}
                            {top_spenders.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', color: '#6b7280' }}>ไม่มีข้อมูล</td></tr>}
                        </tbody>
                    </table>
                </div>

                <div className="rpt-chart-card">
                    <h3 className="rpt-chart-title">🔁 ลูกค้าซื้อซ้ำ</h3>
                    <table className="data-table rpt-table">
                        <thead><tr><th>ชื่อ</th><th>ครั้ง</th><th>LTV</th></tr></thead>
                        <tbody>
                            {repeat_buyers.slice(0, 15).map(c => (
                                <tr key={c.id}>
                                    <td>
                                        <div style={{ fontSize: 13 }}>{c.full_name || 'ไม่ระบุ'}</div>
                                        <div style={{ fontSize: 11, color: '#6b7280' }}>{c.phone_number}</div>
                                    </td>
                                    <td style={{ textAlign: 'center' }}><span className="badge badge-cyan">{c.order_count}x</span></td>
                                    <td style={{ color: '#f59e0b', fontWeight: 600, textAlign: 'right' }}>{fmt(c.lifetime_value)}</td>
                                </tr>
                            ))}
                            {repeat_buyers.length === 0 && <tr><td colSpan={3} style={{ textAlign: 'center', color: '#6b7280' }}>ไม่มีข้อมูล</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// ─── FINANCIAL TAB ────────────────────────────────────────────────────────────
function FinancialTab({ start, end }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        getFinancialReport({ startDate: start, endDate: end })
            .then(r => setData(r.data.data))
            .catch(() => toast.error('โหลด Financial Report ไม่สำเร็จ'))
            .finally(() => setLoading(false));
    }, [start, end]);

    if (loading) return <Skeleton />;
    if (!data) return null;
    const { summary, by_status, by_payment_method } = data;

    return (
        <div className="rpt-tab-content">
            <div className="rpt-stat-grid rpt-stat-grid-5">
                <StatCard label="รายได้รวม" value={fmt(summary.total_revenue)} accent="#10b981" />
                <StatCard label="คำสั่งซื้อ" value={num(summary.total_orders)} accent="#6366f1" />
                <StatCard label="ค่าเฉลี่ย/ออเดอร์" value={fmt(summary.avg_order_value)} accent="#f59e0b" />
                <StatCard label="ออเดอร์เล็กสุด" value={fmt(summary.min_order)} accent="#06b6d4" />
                <StatCard label="ออเดอร์ใหญ่สุด" value={fmt(summary.max_order)} accent="#ec4899" />
            </div>

            <div className="rpt-two-col">
                <div className="rpt-chart-card">
                    <h3 className="rpt-chart-title">📊 ออเดอร์แยกตามสถานะ</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={by_status}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                            <XAxis dataKey="status" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                            <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
                            <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }} />
                            <Bar dataKey="count" name="จำนวน" radius={[4, 4, 0, 0]}>
                                {by_status.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="rpt-chart-card">
                    <h3 className="rpt-chart-title">💳 วิธีชำระเงิน</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                            <Pie data={by_payment_method} dataKey="count" nameKey="method"
                                cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name || 'N/A'} ${(percent * 100).toFixed(0)}%`}
                                labelLine={false}>
                                {by_payment_method.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Pie>
                            <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }}
                                formatter={v => [num(v), 'จำนวน']} />
                        </PieChart>
                    </ResponsiveContainer>
                    <table className="data-table rpt-table" style={{ marginTop: 12 }}>
                        <thead><tr><th>วิธี</th><th>จำนวน</th><th>รวม</th></tr></thead>
                        <tbody>
                            {by_payment_method.map((m, i) => (
                                <tr key={i}>
                                    <td><span style={{ color: COLORS[i % COLORS.length], fontWeight: 600 }}>{m.method || 'N/A'}</span></td>
                                    <td style={{ textAlign: 'center' }}>{num(m.count)}</td>
                                    <td style={{ textAlign: 'right', color: '#10b981', fontWeight: 600 }}>{fmt(m.total)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ReportPage() {
    const [tab, setTab] = useState('sales');
    const [start, setStart] = useState('');
    const [end, setEnd] = useState('');
    const [groupBy, setGroupBy] = useState('day');

    const today = new Date().toISOString().slice(0, 10);
    const thirtyDays = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);

    useEffect(() => {
        setStart(thirtyDays);
        setEnd(today);
    }, []);

    const resetDates = () => { setStart(thirtyDays); setEnd(today); };

    return (
        <div className="rpt-page">
            {/* Header */}
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">รายงาน</h1>
                    <p className="admin-page-subtitle">วิเคราะห์ข้อมูลธุรกิจแบบ Real-time</p>
                </div>
            </div>

            {/* Date Filter + Group by */}
            <DateFilter
                start={start} end={end} groupBy={groupBy}
                onStart={setStart} onEnd={setEnd} onReset={resetDates}
                onGroupBy={tab === 'sales' ? setGroupBy : null}
            />

            {/* Tab Bar */}
            <div className="rpt-tab-bar">
                {TABS.map(t => {
                    const Icon = t.icon;
                    return (
                        <button key={t.id}
                            className={`rpt-tab-btn ${tab === t.id ? 'active' : ''}`}
                            onClick={() => setTab(t.id)}>
                            <Icon size={15} />
                            {t.label}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            {tab === 'sales' && <SalesTab start={start} end={end} groupBy={groupBy} />}
            {tab === 'products' && <ProductsTab start={start} end={end} />}
            {tab === 'inventory' && <InventoryTab />}
            {tab === 'customers' && <CustomersTab start={start} end={end} />}
            {tab === 'financial' && <FinancialTab start={start} end={end} />}
        </div>
    );
}
