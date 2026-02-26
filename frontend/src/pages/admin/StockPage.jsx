import React, { useState, useEffect, useCallback } from 'react';
import {
    Search, RotateCcw, Package, AlertTriangle,
    TrendingDown, TrendingUp, X, Minus, Plus, Layers
} from 'lucide-react';
import { getAllVariants, adjustStock, getImageUrl } from '../../api';
import ProductImage from '../../components/ProductImage';
import toast from 'react-hot-toast';
import './StockPage.css';

/* ─── helpers ──────────────────────────────────────────── */
const stockLevel = (qty, threshold) => {
    if (qty === 0) return 'empty';
    if (qty <= threshold) return 'low';
    return 'ok';
};

const StockBadge = ({ qty, threshold }) => {
    const level = stockLevel(qty, threshold);
    const cfg = {
        ok: { cls: 'badge badge-green', label: qty },
        low: { cls: 'badge badge-orange', label: qty },
        empty: { cls: 'badge badge-red', label: '0 (หมด)' },
    };
    return <span className={cfg[level].cls}>{cfg[level].label}</span>;
};

/* ─── Modal ─────────────────────────────────────────────── */
const AdjustModal = ({ variant, onClose, onSuccess }) => {
    const [delta, setDelta] = useState(0);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (delta === 0) { onClose(); return; }
        setSaving(true);
        try {
            await adjustStock(variant.variant_id, delta);
            toast.success(`อัปเดตสต็อก ${variant.product_name} (${variant.sku}) สำเร็จ`);
            onSuccess();
            onClose();
        } catch {
            toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่');
        } finally {
            setSaving(false);
        }
    };

    const newQty = Math.max(0, (variant.stock_quantity ?? 0) + delta);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box stock-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="stock-modal-title">
                        <Layers size={18} style={{ color: 'var(--accent)' }} />
                        <h2>ปรับสต็อก</h2>
                    </div>
                    <button className="modal-close" onClick={onClose}><X size={18} /></button>
                </div>

                <div className="modal-body">
                    <div className="stock-modal-info">
                        <div className="stock-modal-img">
                            <ProductImage src={variant.image_url} alt={variant.product_name} size={22} />
                        </div>
                        <div>
                            <p className="stock-modal-name">{variant.product_name}</p>
                            <p className="stock-modal-sku">{variant.sku} {variant.unit ? `· ${variant.unit}` : ''}</p>
                        </div>
                    </div>

                    <div className="stock-qty-summary">
                        <div className="stock-qty-item">
                            <span className="stock-qty-label">สต็อกปัจจุบัน</span>
                            <span className="stock-qty-value">{variant.stock_quantity ?? 0}</span>
                        </div>
                        <div className="stock-qty-arrow">→</div>
                        <div className="stock-qty-item">
                            <span className="stock-qty-label">หลังปรับ</span>
                            <span className={`stock-qty-value ${newQty !== variant.stock_quantity ? 'changed' : ''}`}>{newQty}</span>
                        </div>
                    </div>

                    <div className="stock-delta-row">
                        <button
                            type="button"
                            className="btn btn-secondary stock-delta-btn"
                            onClick={() => setDelta(d => d - 1)}
                        ><Minus size={16} /></button>

                        <input
                            type="number"
                            className="input-field stock-delta-input"
                            value={delta}
                            onChange={e => setDelta(Number(e.target.value))}
                        />

                        <button
                            type="button"
                            className="btn btn-secondary stock-delta-btn"
                            onClick={() => setDelta(d => d + 1)}
                        ><Plus size={16} /></button>
                    </div>

                    <div className="stock-preset-row">
                        {[1, 5, 10, 20, 50, 100].map(n => (
                            <button key={n} type="button" className="btn btn-outline btn-sm" onClick={() => setDelta(n)}>+{n}</button>
                        ))}
                        {[-1, -5, -10].map(n => (
                            <button key={n} type="button" className="btn btn-outline btn-sm stock-preset-minus" onClick={() => setDelta(n)}>{n}</button>
                        ))}
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>ยกเลิก</button>
                        <button
                            type="button"
                            className={`btn ${delta > 0 ? 'btn-primary' : delta < 0 ? 'btn-danger' : 'btn-secondary'}`}
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving
                                ? <div className="spinner" style={{ width: 16, height: 16 }} />
                                : delta >= 0
                                    ? <><TrendingUp size={15} /> บันทึก (+{delta})</>
                                    : <><TrendingDown size={15} /> บันทึก ({delta})</>
                            }
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ─── Main Page ─────────────────────────────────────────── */
const StockPage = () => {
    const [variants, setVariants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterLow, setFilterLow] = useState(false);
    const [adjustTarget, setAdjustTarget] = useState(null);

    const fetchVariants = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getAllVariants();
            setVariants(res.data.data || []);
        } catch {
            toast.error('โหลดข้อมูลไม่สำเร็จ');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchVariants(); }, [fetchVariants]);

    const filtered = variants.filter(v => {
        const q = search.toLowerCase();
        const matchSearch =
            (v.product_name || '').toLowerCase().includes(q) ||
            (v.sku || '').toLowerCase().includes(q);
        const matchLow = !filterLow || stockLevel(v.stock_quantity, v.low_stock_threshold) !== 'ok';
        return matchSearch && matchLow;
    });

    const lowCount = variants.filter(v => stockLevel(v.stock_quantity, v.low_stock_threshold) !== 'ok').length;

    return (
        <div>
            {/* Header */}
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">จัดการสต็อก</h1>
                    <p className="admin-page-subtitle">
                        {variants.length} variant
                        {lowCount > 0 && (
                            <span className="stock-low-badge">
                                <AlertTriangle size={12} /> {lowCount} รายการสต็อกต่ำ
                            </span>
                        )}
                    </p>
                </div>
                <div className="products-actions">
                    <div className="admin-search-wrap">
                        <Search size={14} />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="ค้นหาชื่อสินค้า / SKU..."
                            className="admin-search-input"
                        />
                    </div>
                    <button
                        className={`btn btn-sm ${filterLow ? 'btn-warning' : 'btn-secondary'}`}
                        onClick={() => setFilterLow(f => !f)}
                        title="แสดงเฉพาะสต็อกต่ำ"
                    >
                        <AlertTriangle size={14} />
                        {filterLow ? 'สต็อกต่ำ' : 'ทั้งหมด'}
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={fetchVariants} title="รีเฟรช">
                        <RotateCcw size={14} />
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="card" style={{ overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: 24 }}>
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="skeleton" style={{ height: 52, borderRadius: 8, marginBottom: 8 }} />
                        ))}
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>รูป</th>
                                <th>ชื่อสินค้า</th>
                                <th>SKU</th>
                                <th>หน่วย</th>
                                <th>หมวดหมู่</th>
                                <th>สต็อก</th>
                                <th>Threshold</th>
                                <th>จัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(v => {
                                const level = stockLevel(v.stock_quantity, v.low_stock_threshold);
                                return (
                                    <tr key={v.variant_id} className={`stock-row stock-row-${level}`}>
                                        <td>
                                            <div className="product-thumb">
                                                <ProductImage src={v.image_url} alt={v.product_name} />
                                            </div>
                                        </td>
                                        <td style={{ fontWeight: 600 }}>{v.product_name}</td>
                                        <td style={{ color: 'var(--text-muted)', fontSize: 13, fontFamily: 'monospace' }}>{v.sku}</td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{v.unit || '—'}</td>
                                        <td>
                                            {v.category_name
                                                ? <span className="badge badge-cyan">{v.category_name}</span>
                                                : <span style={{ color: 'var(--text-muted)' }}>—</span>
                                            }
                                        </td>
                                        <td>
                                            <StockBadge qty={v.stock_quantity} threshold={v.low_stock_threshold} />
                                        </td>
                                        <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{v.low_stock_threshold}</td>
                                        <td>
                                            <button
                                                className="btn btn-secondary btn-sm"
                                                onClick={() => setAdjustTarget(v)}
                                            >
                                                <Layers size={13} /> ปรับ
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>
                                        ไม่พบข้อมูลสต็อก
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Adjust Modal */}
            {adjustTarget && (
                <AdjustModal
                    variant={adjustTarget}
                    onClose={() => setAdjustTarget(null)}
                    onSuccess={fetchVariants}
                />
            )}
        </div>
    );
};

export default StockPage;
