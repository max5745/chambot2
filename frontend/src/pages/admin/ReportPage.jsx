import React, { useState, useEffect, useCallback, useRef } from 'react';
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

// ─── SALES TAB ─────────────────────────────────────────────────────────────────────────────────
const CAT_COLORS = ['#f59e0b', '#6366f1', '#10b981', '#ec4899', '#06b6d4', '#f97316', '#8b5cf6', '#14b8a6'];

function DrillDown({ period, groupBy, onClose }) {
    const [drill, setDrill] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState('revenue'); // 'revenue' | 'units_sold'

    // For hour groupBy, period is like "14:00", map back to start/end of that day's hour
    // We pass the outer start/end in via props and just re-fetch by the period label
    useEffect(() => {
        setLoading(true);
        getSalesReport({ startDate: period.start, endDate: period.end, groupBy: 'day' })
            .then(r => setDrill(r.data.data))
            .catch(() => toast.error('โหลดรายละเอียดไม่สำเร็จ'))
            .finally(() => setLoading(false));
    }, [period.start, period.end]);

    const products = drill?.by_product || [];
    const sorted = [...products].sort((a, b) => Number(b[sortBy]) - Number(a[sortBy]));

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000,
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        }} onClick={onClose}>
            <div style={{
                background: '#181926', borderRadius: '20px 20px 0 0',
                width: '100%', maxWidth: 640, maxHeight: '80vh',
                overflow: 'auto', padding: 24,
                boxShadow: '0 -20px 60px rgba(0,0,0,0.6)',
            }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>
                            📅 {period.label}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>สินค้าขายดีในช่วงนี้</div>
                    </div>
                    <button className="btn btn-secondary btn-sm" onClick={onClose}>✕</button>
                </div>

                {/* Sort toggle */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                    {[['revenue', '💰 ยอดขาย'], ['units_sold', '📦 จำนวน']].map(([k, l]) => (
                        <button key={k}
                            className={`btn btn-sm ${sortBy === k ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setSortBy(k)}>{l}</button>
                    ))}
                </div>

                {loading ? <Skeleton h={200} /> : sorted.length === 0
                    ? <p className="rpt-empty">ไม่มีข้อมูลสินค้า</p>
                    : sorted.map((p, i) => {
                        const val = Number(p[sortBy] || 0);
                        const max = Number(sorted[0][sortBy] || 1);
                        return (
                            <div key={p.product_id} style={{
                                display: 'flex', alignItems: 'center', gap: 12,
                                padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)',
                            }}>
                                <span style={{ fontSize: 15, minWidth: 24, color: i < 3 ? '#f59e0b' : '#6b7280', fontWeight: 700 }}>
                                    {i < 3 ? ['🥇', '🥈', '🥉'][i] : `${i + 1}`}
                                </span>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.88)' }}>{p.product_name}</div>
                                    <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, marginTop: 4 }}>
                                        <div style={{ width: `${(val / max * 100).toFixed(0)}%`, height: '100%', background: CAT_COLORS[i % CAT_COLORS.length], borderRadius: 2 }} />
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right', minWidth: 80 }}>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: sortBy === 'revenue' ? '#10b981' : '#6366f1' }}>
                                        {sortBy === 'revenue' ? fmt(val) : `${num(val)} ชิ้น`}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                }
            </div>
        </div>
    );
}

function SalesTab({ start, end, groupBy, onDrillDay }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [drill, setDrill] = useState(null); // { start, end, label } for DrillDown
    const [chartType, setChartType] = useState('bar'); // 'bar' | 'line'

    useEffect(() => {
        setLoading(true);
        getSalesReport({ startDate: start, endDate: end, groupBy })
            .then(r => setData(r.data.data))
            .catch(() => toast.error('โหลด Sales Report ไม่สำเร็จ'))
            .finally(() => setLoading(false));
    }, [start, end, groupBy]);

    if (loading) return (<><Skeleton /><Skeleton h={200} /></>);
    if (!data) return null;
    const { summary, by_period, by_category } = data;

    const totalRev = by_category.reduce((s, c) => s + Number(c.revenue || 0), 0);

    // Build period label for drill-down
    const getDrillPeriod = (row) => {
        const date = row._date || row.period; // _date is actual ISO date; period may be display label
        if (groupBy === 'hour') return { start, end, label: `${start} เวลา ${row.period}` };
        return { start: date, end: date, label: date };
    };

    const PERIOD_LABEL = { hour: 'ชั่วโมง', day: 'วัน', week: 'สัปดาห์', month: 'เดือน' };

    // Zero-fill helper: generate full sequence of expected period keys
    const TH_DOW_SHORT = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
    const fillPeriods = () => {
        const map = Object.fromEntries(by_period.map(r => [r.period, r]));
        const zero = { revenue: 0, orders: 0 };

        if (groupBy === 'hour') {
            return Array.from({ length: 24 }, (_, h) => {
                const key = String(h).padStart(2, '0') + ':00';
                return {
                    period: key, _date: start,
                    ...(map[key] ? { revenue: Number(map[key].revenue || 0), orders: Number(map[key].orders || 0) } : zero)
                };
            });
        }
        if (groupBy === 'week') {
            // Show exactly 7 days Mon–Sun, labels as จ./อ./พ./พฤ./ศ./ส./อา.
            const days = [];
            const cur = new Date(start + 'T00:00:00');
            const last = new Date(end + 'T00:00:00');
            while (cur <= last) {
                const isoDate = toISO(cur);
                const dayName = TH_DOW_SHORT[cur.getDay()];
                const lookupKey = isoDate; // in week mode backend groups by day
                days.push({
                    period: dayName, _date: isoDate,
                    ...(map[lookupKey] ? { revenue: Number(map[lookupKey].revenue || 0), orders: Number(map[lookupKey].orders || 0) } : zero)
                });
                cur.setDate(cur.getDate() + 1);
            }
            return days;
        }
        if (groupBy === 'day' || groupBy === 'month') {
            // Show all days in range; label = day number
            const days = [];
            const cur = new Date(start + 'T00:00:00');
            const last = new Date(end + 'T00:00:00');
            while (cur <= last) {
                const isoDate = toISO(cur);
                const lookupKey = isoDate; // day groupBy: period is YYYY-MM-DD
                days.push({
                    period: String(cur.getDate()), _date: isoDate,
                    ...(map[lookupKey] ? { revenue: Number(map[lookupKey].revenue || 0), orders: Number(map[lookupKey].orders || 0) } : zero)
                });
                cur.setDate(cur.getDate() + 1);
            }
            return days;
        }
        return by_period.map(r => ({ ...r, _date: r.period }));
    };
    const chartData = fillPeriods();

    return (
        <div className="rpt-tab-content">
            {/* Summary */}
            <div className="rpt-stat-grid">
                <StatCard label="รายได้รวม" value={fmt(summary.total_revenue)} accent="#10b981" />
                <StatCard label="คำสั่งซื้อทั้งหมด" value={num(summary.total_orders)} accent="#6366f1" />
                <StatCard label="เฉลี่ย/ออเดอร์" value={fmt(summary.avg_order_value)} accent="#f59e0b" />
            </div>

            {/* Bar chart */}
            <div className="rpt-chart-card">
                <div className="rpt-chart-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h3 className="rpt-chart-title" style={{ margin: 0 }}>
                        📊 ยอดขายราย{PERIOD_LABEL[groupBy]}
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400, marginLeft: 8 }}>
                            {groupBy === 'hour' ? 'กดแต่ละส่วนเพื่อดูสินค้า' : 'กดแต่ละวันเพื่อดูรายชั่วโมง'}
                        </span>
                    </h3>
                    <div className="rpt-chart-toggle" style={{ display: 'flex', background: 'var(--bg-surface)', padding: 3, borderRadius: 8, border: '1px solid var(--border)' }}>
                        <button
                            className={`btn btn-sm ${chartType === 'bar' ? 'active-toggle' : ''}`}
                            onClick={() => setChartType('bar')}
                            style={{
                                padding: '4px 10px', fontSize: 11, borderRadius: 6, border: 'none', cursor: 'pointer',
                                background: chartType === 'bar' ? 'var(--accent)' : 'transparent',
                                color: chartType === 'bar' ? '#fff' : 'var(--text-muted)',
                                fontWeight: 600, transition: '0.2s'
                            }}
                        >เเท่ง</button>
                        <button
                            className={`btn btn-sm ${chartType === 'line' ? 'active-toggle' : ''}`}
                            onClick={() => setChartType('line')}
                            style={{
                                padding: '4px 10px', fontSize: 11, borderRadius: 6, border: 'none', cursor: 'pointer',
                                background: chartType === 'line' ? 'var(--accent)' : 'transparent',
                                color: chartType === 'line' ? '#fff' : 'var(--text-muted)',
                                fontWeight: 600, transition: '0.2s'
                            }}
                        >จุด/เส้น</button>
                    </div>
                </div>
                {chartData.length === 0
                    ? <p className="rpt-empty">ไม่มีข้อมูลในช่วงที่เลือก</p>
                    : (
                        <ResponsiveContainer width="100%" height={240}>
                            {chartType === 'bar' ? (
                                <BarChart data={chartData} margin={{ bottom: 8 }}
                                    onClick={(e) => {
                                        if (e && e.activePayload && e.activePayload[0]) {
                                            const row = e.activePayload[0].payload;
                                            if (groupBy === 'hour') setDrill(getDrillPeriod(row));
                                            else onDrillDay && onDrillDay(row._date || row.period);
                                        }
                                    }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} strokeOpacity={0.5} />
                                    <XAxis dataKey="period" tick={{ fill: '#64748b', fontSize: 11 }} />
                                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => '฿' + (v / 1000).toFixed(0) + 'k'} />
                                    <Tooltip
                                        cursor={{ fill: 'var(--bg-surface)', opacity: 0.5 }}
                                        contentStyle={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, boxShadow: 'var(--shadow-lg)' }}
                                        itemStyle={{ fontSize: 13, color: '#1e293b' }}
                                        formatter={(v, n) => [n === 'revenue' ? fmt(v) : num(v) + '  ออเดอร์', n === 'revenue' ? 'รายได้' : 'ออเดอร์']}
                                        labelStyle={{ color: '#64748b', fontSize: 11, marginBottom: 4 }}
                                    />
                                    <Bar dataKey="revenue" name="revenue" radius={[6, 6, 0, 0]} style={{ cursor: 'pointer' }}>
                                        {chartData.map((row, i) => {
                                            const base = by_category.length > 0 ? CAT_COLORS[0] : '#6366f1';
                                            const opacity = Number(row.revenue) > 0 ? 1 : 0.22;
                                            return <Cell key={i} fill={base} fillOpacity={opacity} />;
                                        })}
                                    </Bar>
                                </BarChart>
                            ) : (
                                <LineChart data={chartData} margin={{ bottom: 8, left: 10, right: 10 }}
                                    onClick={(e) => {
                                        if (e && e.activePayload && e.activePayload[0]) {
                                            const row = e.activePayload[0].payload;
                                            if (groupBy === 'hour') setDrill(getDrillPeriod(row));
                                            else onDrillDay && onDrillDay(row._date || row.period);
                                        }
                                    }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} strokeOpacity={0.5} />
                                    <XAxis dataKey="period" tick={{ fill: '#64748b', fontSize: 11 }} />
                                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => '฿' + (v / 1000).toFixed(0) + 'k'} />
                                    <Tooltip
                                        contentStyle={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, boxShadow: 'var(--shadow-lg)' }}
                                        itemStyle={{ fontSize: 13, color: '#1e293b' }}
                                        formatter={(v, n) => [n === 'revenue' ? fmt(v) : num(v) + '  ออเดอร์', n === 'revenue' ? 'รายได้' : 'ออเดอร์']}
                                        labelStyle={{ color: '#64748b', fontSize: 11, marginBottom: 4 }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="revenue"
                                        name="revenue"
                                        stroke="#6366f1"
                                        strokeWidth={3}
                                        dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                                        activeDot={{ r: 6, stroke: '#6366f1', strokeWidth: 2, fill: '#fff' }}
                                        style={{ cursor: 'pointer' }}
                                    />
                                </LineChart>
                            )}
                        </ResponsiveContainer>
                    )}
            </div>

            {/* Category breakdown */}
            {by_category.length > 0 && (
                <div className="rpt-chart-card">
                    <h3 className="rpt-chart-title">🏷️ หมวดหมู่สินค้า</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
                        {by_category.map((c, i) => {
                            const rev = Number(c.revenue || 0);
                            const share = totalRev > 0 ? (rev / totalRev) * 100 : 0;
                            return (
                                <div key={c.category_id || i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                    {/* Color dot */}
                                    <div style={{
                                        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                                        background: CAT_COLORS[i % CAT_COLORS.length] + '22',
                                        border: `2px solid ${CAT_COLORS[i % CAT_COLORS.length]}44`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 18,
                                    }}>{'🏷️'}</div>

                                    {/* Name + bar */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                                            <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.88)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {c.category_name}
                                            </span>
                                            <span style={{ fontSize: 13, fontWeight: 700, color: '#10b981', marginLeft: 8, flexShrink: 0 }}>
                                                {fmt(rev)}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3 }}>
                                                <div style={{
                                                    width: `${share.toFixed(1)}%`, height: '100%',
                                                    background: CAT_COLORS[i % CAT_COLORS.length],
                                                    borderRadius: 3, transition: 'width 0.4s ease',
                                                }} />
                                            </div>
                                            <span style={{ fontSize: 11, color: 'var(--text-muted)', minWidth: 62, textAlign: 'right' }}>
                                                {c.order_count} รายการ &middot; {share.toFixed(1)}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Drill-down modal */}
            {drill && <DrillDown period={drill} groupBy={groupBy} onClose={() => setDrill(null)} />}
        </div>
    );
}

// ─── PRODUCTS TAB ─────────────────────────────────────────────────────────────
const MEDALS = ['🥇', '🥈', '🥉'];

function RankTable({ title, data, rankBy, valueKey, valueLabel, valueFormat, accentColor }) {
    return (
        <div className="rpt-chart-card">
            <h3 className="rpt-chart-title">{title}</h3>
            <table className="data-table rpt-table">
                <thead>
                    <tr>
                        <th style={{ width: 32 }}>#</th>
                        <th>สินค้า</th>
                        <th>หมวดหมู่</th>
                        <th style={{ textAlign: 'right', minWidth: 90 }}>{valueLabel}</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((p, i) => (
                        <tr key={p.product_id} style={{ background: i === 0 ? 'rgba(245,158,11,0.04)' : undefined }}>
                            <td>
                                <span style={{
                                    fontWeight: 800,
                                    fontSize: i < 3 ? 16 : 13,
                                    color: i < 3 ? '#f59e0b' : 'var(--text-muted)'
                                }}>
                                    {i < 3 ? MEDALS[i] : i + 1}
                                </span>
                            </td>
                            <td>
                                <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>
                                    {p.product_name}
                                </div>
                                {p.stock_remaining !== undefined && (
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                                        คงเหลือ {num(p.stock_remaining)} ชิ้น
                                    </div>
                                )}
                            </td>
                            <td>
                                {p.category_name
                                    ? <span className="badge badge-cyan" style={{ fontSize: 11 }}>{p.category_name}</span>
                                    : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                                    <span style={{ fontWeight: 700, color: accentColor, fontSize: 13 }}>
                                        {valueFormat(p[valueKey])}
                                    </span>
                                    {/* Mini progress bar relative to top item */}
                                    {data.length > 0 && (
                                        <div style={{ width: 70, height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                                            <div style={{
                                                width: `${Math.round((p[valueKey] / data[0][valueKey]) * 100)}%`,
                                                height: '100%',
                                                background: accentColor,
                                                borderRadius: 2,
                                                opacity: 0.7,
                                                transition: 'width 0.4s ease'
                                            }} />
                                        </div>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                    {data.length === 0 && (
                        <tr>
                            <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>
                                ไม่มีข้อมูลในช่วงที่เลือก
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

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
    const { top_selling = [], top_by_revenue = [], low_selling = [] } = data;

    return (
        <div className="rpt-tab-content">
            {/* ── Top 10 dual tables ── */}
            <div className="rpt-two-col">
                <RankTable
                    title="🏅 Top 10 — จำนวนชิ้นที่ขายได้"
                    data={top_selling}
                    valueKey="units_sold"
                    valueLabel="จำนวน (ชิ้น)"
                    valueFormat={v => `${num(v)} ชิ้น`}
                    accentColor="#10b981"
                />
                <RankTable
                    title="💰 Top 10 — ยอดขาย (บาท)"
                    data={top_by_revenue}
                    valueKey="revenue"
                    valueLabel="ยอดขาย"
                    valueFormat={v => fmt(v)}
                    accentColor="#a5b4fc"
                />
            </div>

            {/* ── Bar chart: units sold ── */}
            <div className="rpt-chart-card">
                <h3 className="rpt-chart-title">📊 เปรียบเทียบจำนวนชิ้นขาย vs ยอดขาย (Top 10)</h3>
                {top_selling.length > 0 ? (
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={top_selling.slice(0, 10)} margin={{ left: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                            <XAxis dataKey="product_name" tick={{ fill: '#9ca3af', fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={50} />
                            <YAxis yAxisId="left" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                            <YAxis yAxisId="right" orientation="right" tick={{ fill: '#9ca3af', fontSize: 10 }} tickFormatter={v => '฿' + (v / 1000).toFixed(0) + 'k'} />
                            <Tooltip
                                contentStyle={{ background: '#13151f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                                itemStyle={{ fontSize: 13 }}
                                formatter={(v, n) => n === 'units_sold' ? [`${num(v)} ชิ้น`, 'จำนวน'] : [fmt(v), 'ยอดขาย']}
                            />
                            <Legend wrapperStyle={{ fontSize: 12, color: '#9ca3af' }} />
                            <Bar yAxisId="left" dataKey="units_sold" name="จำนวน (ชิ้น)" fill="#10b981" radius={[4, 4, 0, 0]} />
                            <Bar yAxisId="right" dataKey="revenue" name="ยอดขาย (฿)" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                ) : <p className="rpt-empty">ไม่มีข้อมูล</p>}
            </div>

            {/* ── Low Selling ── */}
            <div className="rpt-chart-card">
                <h3 className="rpt-chart-title">📉 สินค้าขายช้า (ยอดขาย &lt; 5 ชิ้น)</h3>
                <table className="data-table rpt-table">
                    <thead>
                        <tr>
                            <th>สินค้า</th>
                            <th>หมวดหมู่</th>
                            <th style={{ textAlign: 'right' }}>ขายได้</th>
                            <th style={{ textAlign: 'right' }}>คงเหลือ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {low_selling.map(p => (
                            <tr key={p.product_id}>
                                <td style={{ fontSize: 13 }}>{p.product_name}</td>
                                <td>
                                    {p.category_name
                                        ? <span className="badge badge-cyan" style={{ fontSize: 11 }}>{p.category_name}</span>
                                        : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                                </td>
                                <td style={{ color: '#f59e0b', textAlign: 'right', fontWeight: 600 }}>{num(p.units_sold)} ชิ้น</td>
                                <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{num(p.stock_remaining)}</td>
                            </tr>
                        ))}
                        {low_selling.length === 0 && (
                            <tr><td colSpan={4} style={{ textAlign: 'center', color: '#10b981', padding: 24 }}>✅ ทุกสินค้ามียอดขายปกติ</td></tr>
                        )}
                    </tbody>
                </table>
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

// ─── Calendar helpers ───────────────────────────────────────────────────────────────────────────────
const toISO = (d) => d.toISOString().slice(0, 10);
const thDay = new Intl.DateTimeFormat('th-TH', { dateStyle: 'long' });
const thMonth = new Intl.DateTimeFormat('th-TH', { year: 'numeric', month: 'long' });
const thShort = new Intl.DateTimeFormat('th-TH', { day: '2-digit', month: 'short' });
const getMon = (d) => { const dt = new Date(d); dt.setDate(dt.getDate() - ((dt.getDay() + 6) % 7)); return dt; };
const isoSame = (a, b) => toISO(a) === toISO(b);
const TH_DOW = ['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา'];

const getPeriodFromDate = (type, sel) => {
    if (type === 'day') {
        const iso = toISO(sel);
        return { start: iso, end: iso, groupBy: 'hour', label: thDay.format(sel) };
    }
    if (type === 'week') {
        const mon = getMon(sel);
        const sun = new Date(mon); sun.setDate(sun.getDate() + 6);
        return {
            start: toISO(mon), end: toISO(sun), groupBy: 'day',
            label: `${thShort.format(mon)} – ${thShort.format(sun)}`
        };
    }
    const first = new Date(sel.getFullYear(), sel.getMonth(), 1);
    const last = new Date(sel.getFullYear(), sel.getMonth() + 1, 0);
    return { start: toISO(first), end: toISO(last), groupBy: 'day', label: thMonth.format(sel) };
};

// ─── MiniCalendar component ──────────────────────────────────────────────────────────────────────
function MiniCalendar({ type, selected, onSelect }) {
    const [viewYear, setViewYear] = useState(selected.getFullYear());
    const [viewMonth, setViewMonth] = useState(selected.getMonth());
    const [showMonthPicker, setShowMonthPicker] = useState(type === 'month');

    useEffect(() => { setShowMonthPicker(type === 'month'); }, [type]);

    const today = new Date();
    const mon = getMon(selected); // Monday of selected week

    // Build day grid
    const firstDay = new Date(viewYear, viewMonth, 1);
    const startDow = (firstDay.getDay() + 6) % 7; // Mon=0
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < startDow; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(viewYear, viewMonth, d));
    while (cells.length % 7 !== 0) cells.push(null);

    const prevMonth = () => { if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); } else setViewMonth(m => m - 1); };
    const nextMonth = () => { if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); } else setViewMonth(m => m + 1); };

    const isSelected = (d) => {
        if (!d) return false;
        if (type === 'day') return isoSame(d, selected);
        if (type === 'week') return d >= mon && d <= new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + 6);
        return d.getMonth() === selected.getMonth() && d.getFullYear() === selected.getFullYear();
    };
    const isToday = (d) => d && isoSame(d, today);
    const isFuture = (d) => d && d > today;

    const CAL_STYLE = {
        position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 999,
        background: '#181926', border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 16, padding: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
        minWidth: 280, userSelect: 'none',
    };
    const MONTH_NAMES = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

    if (showMonthPicker) return (
        <div style={CAL_STYLE}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setViewYear(y => y - 1)}>&#8592;</button>
                <span style={{ fontWeight: 700, fontSize: 14, color: 'rgba(255,255,255,0.9)' }}>{viewYear + 543}</span>
                <button className="btn btn-secondary btn-sm"
                    onClick={() => setViewYear(y => y + 1)}
                    disabled={viewYear >= today.getFullYear()}>&#8594;</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6 }}>
                {MONTH_NAMES.map((name, i) => {
                    const isFut = viewYear > today.getFullYear() || (viewYear === today.getFullYear() && i > today.getMonth());
                    const isSel = selected.getMonth() === i && selected.getFullYear() === viewYear;
                    return (
                        <button key={i}
                            disabled={isFut}
                            style={{
                                padding: '6px 2px', borderRadius: 8, fontSize: 12, border: 'none', cursor: isFut ? 'default' : 'pointer',
                                background: isSel ? '#6366f1' : 'rgba(255,255,255,0.04)',
                                color: isSel ? '#fff' : isFut ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.8)',
                                fontWeight: isSel ? 700 : 400,
                            }}
                            onClick={() => { onSelect(new Date(viewYear, i, 1)); }}
                        >{name}</button>
                    );
                })}
            </div>
        </div>
    );

    return (
        <div style={CAL_STYLE}>
            {/* Month nav */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <button className="btn btn-secondary btn-sm" onClick={prevMonth}>&#8592;</button>
                <span style={{ fontWeight: 700, fontSize: 13, color: 'rgba(255,255,255,0.9)' }}>
                    {MONTH_NAMES[viewMonth]} {viewYear + 543}
                </span>
                <button className="btn btn-secondary btn-sm"
                    onClick={nextMonth}
                    disabled={viewYear === today.getFullYear() && viewMonth >= today.getMonth()}>&#8594;</button>
            </div>
            {/* DOW headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, marginBottom: 4 }}>
                {TH_DOW.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 11, color: '#6b7280', fontWeight: 600, padding: '2px 0' }}>{d}</div>)}
            </div>
            {/* Day cells */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
                {cells.map((d, i) => {
                    const sel = d && isSelected(d);
                    const tod = isToday(d);
                    const fut = isFuture(d);
                    return (
                        <div key={i} onClick={() => d && !fut && onSelect(d)}
                            style={{
                                textAlign: 'center', padding: '5px 2px', borderRadius: 6, fontSize: 12,
                                cursor: d && !fut ? 'pointer' : 'default',
                                background: sel ? '#6366f1' :
                                    (tod && !sel) ? 'rgba(99,102,241,0.2)' : 'transparent',
                                color: sel ? '#fff' : fut ? 'rgba(255,255,255,0.2)' :
                                    d ? 'rgba(255,255,255,0.85)' : 'transparent',
                                fontWeight: tod || sel ? 700 : 400,
                                outline: tod && !sel ? '1px solid rgba(99,102,241,0.5)' : 'none',
                                transition: 'all 0.1s',
                            }}
                        >{d ? d.getDate() : ''}</div>
                    );
                })}
            </div>
        </div>
    );
}

export default function ReportPage() {
    const [tab, setTab] = useState('sales');
    const [type, setType] = useState('day');
    const [sel, setSel] = useState(new Date());
    const [calOpen, setCalOpen] = useState(false);
    const calRef = useRef(null);

    // close cal on outside click
    useEffect(() => {
        const h = (e) => { if (calRef.current && !calRef.current.contains(e.target)) setCalOpen(false); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

    const changeType = (t) => { setType(t); setSel(new Date()); setCalOpen(false); };
    const handleSelect = (d) => { setSel(d); setCalOpen(false); };

    const { start, end, groupBy, label } = getPeriodFromDate(type, sel);

    return (
        <div className="rpt-page">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">รายงาน</h1>
                    <p className="admin-page-subtitle">วิเคราะห์ข้อมูลธุรกิจแบบ Real-time</p>
                </div>
            </div>

            {/* Period Mode + Calendar picker */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 18, alignItems: 'center', flexWrap: 'wrap' }}>
                {[['day', '◕ รายวัน'], ['week', '📆 รายสัปดาห์'], ['month', '📅 รายเดือน']].map(([k, l]) => (
                    <button key={k}
                        className={`btn btn-sm ${type === k ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ fontWeight: type === k ? 700 : 400, fontSize: 13 }}
                        onClick={() => changeType(k)}>{l}</button>
                ))}

                <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 18 }}>|</span>

                {/* Calendar trigger */}
                <div ref={calRef} style={{ position: 'relative' }}>
                    <button
                        className="btn btn-secondary btn-sm"
                        style={{
                            fontSize: 13, fontWeight: 600, minWidth: 200,
                            color: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', gap: 8
                        }}
                        onClick={() => setCalOpen(o => !o)}
                    >
                        📆 {label}
                    </button>
                    {calOpen && (
                        <MiniCalendar type={type} selected={sel} onSelect={handleSelect} />
                    )}
                </div>
            </div>

            <div className="rpt-tab-bar">
                {TABS.map(t => {
                    const Icon = t.icon; return (
                        <button key={t.id} className={`rpt-tab-btn ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
                            <Icon size={15} />{t.label}
                        </button>
                    );
                })}
            </div>

            {tab === 'sales' && <SalesTab start={start} end={end} groupBy={groupBy}
                onDrillDay={(isoDate) => {
                    // FIX: set sel first, then type — must NOT call changeType() which resets sel to today
                    setSel(new Date(isoDate + 'T00:00:00'));
                    setType('day');
                    setCalOpen(false);
                }}
            />}
            {tab === 'products' && <ProductsTab start={start} end={end} />}
            {tab === 'inventory' && <InventoryTab />}
            {tab === 'customers' && <CustomersTab start={start} end={end} />}
            {tab === 'financial' && <FinancialTab start={start} end={end} />}
        </div>
    );
}
