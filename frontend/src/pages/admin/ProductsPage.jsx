import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, X, Upload, RotateCcw, Star, LayoutGrid, Table, Filter } from 'lucide-react';
import { getProducts, getCategories, createProduct, updateProduct, deleteProduct, uploadImage, getImageUrl, getProductById, setMainVariant, updateVariantThreshold } from '../../api';
import ProductImage from '../../components/ProductImage';
import toast from 'react-hot-toast';
import './ProductsPage.css';

const formatPrice = (p) =>
    new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(p || 0);

const emptyVariant = () => ({ sku: '', price: '', stock_quantity: 0, unit: 'ชิ้น', image_url: '', low_stock_threshold: 5, is_main: false });
const emptyProduct = () => ({ name: '', description: '', category_id: '', is_active: true, variants: [emptyVariant()] });

/* ─── Threshold Adjuster ─── */
const ThresholdAdjuster = ({ variantId, initialValue, onSaved }) => {
    const [value, setValue] = useState(initialValue ?? 5);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateVariantThreshold(variantId, value);
            toast.success('บันทึกเกณฑ์สต็อกสำเร็จ');
            if (onSaved) onSaved(variantId, value);
        } catch {
            toast.error('บันทึกล้มเหลว');
        } finally { setSaving(false); }
    };

    return (
        <div className="threshold-section">
            <span className="threshold-label">เกณฑ์สต็อกต่ำ:</span>
            <div className="threshold-row">
                <button type="button" className="threshold-btn" onClick={() => setValue(v => Math.max(0, v - 1))}>−</button>
                <input type="number" className="threshold-input" value={value} min={0}
                    onChange={e => setValue(Math.max(0, parseInt(e.target.value) || 0))} />
                <button type="button" className="threshold-btn" onClick={() => setValue(v => v + 1)}>+</button>
            </div>
            <button type="button" className="btn-save-threshold" onClick={handleSave} disabled={saving}>
                {saving ? '...' : 'บันทึก'}
            </button>
        </div>
    );
};

/* ─── Main Component ─── */
const ProductsPage = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [search, setSearch] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [viewMode, setViewMode] = useState('grid');
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editData, setEditData] = useState(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState(emptyProduct());
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [pr, cr] = await Promise.all([getProducts(), getCategories()]);
            setProducts(pr.data.data || []);
            setCategories(cr.data.data || []);
        } catch { }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchAll(); }, []);

    const handleSelectProduct = async (p) => {
        setDetailLoading(true);
        setSelectedProduct(p);
        try {
            const res = await getProductById(p.product_id);
            setSelectedProduct(res.data.data);
        } catch {
            toast.error('ไม่สามารถโหลดข้อมูลสินค้าได้');
            setSelectedProduct(null);
        } finally { setDetailLoading(false); }
    };

    const handleSetMain = async (variantId) => {
        try {
            await setMainVariant(variantId);
            toast.success('ตั้งเป็นตัวเลือกหลักสำเร็จ');
            const res = await getProductById(selectedProduct.product_id);
            setSelectedProduct(res.data.data);
            getProducts().then(r => setProducts(r.data.data || []));
        } catch { toast.error('เกิดข้อผิดพลาด'); }
    };

    const handleThresholdSaved = (variantId, newValue) => {
        setSelectedProduct(prev => ({
            ...prev,
            variants: prev.variants.map(v =>
                v.variant_id === variantId ? { ...v, low_stock_threshold: newValue } : v
            )
        }));
    };

    const openAdd = () => {
        // Only reset form if we were previously in edit mode
        // (so draft data from a previous openAdd attempt is preserved)
        if (editData !== null) {
            setForm(emptyProduct());
        }
        setEditData(null);
        setModalOpen(true);
    };
    const openEdit = (p) => {
        setForm({ name: p.product_name || p.name, description: p.description || '', category_id: p.category_id || '', is_active: p.is_active, variants: [] });
        setEditData(p);
        getProductById(p.product_id).then(r => {
            const prod = r.data.data;
            setForm(f => ({ ...f, variants: prod.variants?.length ? prod.variants : [emptyVariant()] }));
        });
        setModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('ต้องการลบสินค้านี้?')) return;
        try {
            await deleteProduct(id);
            toast.success('ลบสินค้าสำเร็จ');
            fetchAll();
        } catch { toast.error('เกิดข้อผิดพลาด'); }
    };

    const handleImageUpload = async (e, varIdx) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const res = await uploadImage(file);
            const url = res.data.url || res.data.path || '';
            setForm(f => ({ ...f, variants: f.variants.map((v, i) => i === varIdx ? { ...v, image_url: url } : v) }));
            toast.success('อัปโหลดรูปสำเร็จ');
        } catch { toast.error('อัปโหลดล้มเหลว'); }
    };

    const handleVarChange = (idx, key, val) =>
        setForm(f => ({ ...f, variants: f.variants.map((v, i) => i === idx ? { ...v, [key]: val } : v) }));

    const handleSetMainInForm = (idx) => {
        setForm(f => ({ ...f, variants: f.variants.map((v, i) => ({ ...v, is_main: i === idx })) }));
    };

    const addVariant = () => setForm(f => ({ ...f, variants: [...f.variants, emptyVariant()] }));
    const removeVariant = (idx) => setForm(f => ({ ...f, variants: f.variants.filter((_, i) => i !== idx) }));

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = { ...form, category_id: form.category_id ? Number(form.category_id) : null };
            if (payload.variants.length > 0 && !payload.variants.some(v => v.is_main)) {
                payload.variants[0].is_main = true;
            }
            if (editData) {
                await updateProduct(editData.product_id, payload);
                toast.success('แก้ไขสินค้าสำเร็จ');
            } else {
                await createProduct(payload);
                toast.success('เพิ่มสินค้าสำเร็จ');
            }
            setModalOpen(false);
            // Reset form to empty draft only after successful save
            setForm(emptyProduct());
            fetchAll();
        } catch { toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่'); }
        finally { setSaving(false); }
    };

    const filtered = products.filter(p => {
        const matchSearch = (p.product_name || '').toLowerCase().includes(search.toLowerCase());
        const matchCategory = !filterCategory || String(p.category_id) === String(filterCategory);
        return matchSearch && matchCategory;
    });

    return (
        <div>
            {/* ── Header ── */}
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">สินค้าทั้งหมด</h1>
                    <p className="admin-page-subtitle">{filtered.length} / {products.length} รายการ</p>
                </div>
                <div className="products-actions">
                    <div className="admin-search-wrap" style={{ gap: 6, padding: '6px 12px' }}>
                        <Filter size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                        <select className="admin-search-input" value={filterCategory}
                            onChange={e => setFilterCategory(e.target.value)} style={{ width: 140, cursor: 'pointer' }}>
                            <option value="">ทุกหมวดหมู่</option>
                            {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="admin-search-wrap">
                        <Search size={16} />
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="ค้นหาสินค้า..." className="admin-search-input" />
                    </div>
                    <div className="view-toggle">
                        <button className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                            onClick={() => setViewMode('grid')} title="Grid"><LayoutGrid size={16} /></button>
                        <button className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
                            onClick={() => setViewMode('table')} title="Table"><Table size={16} /></button>
                    </div>
                    <button className="btn btn-secondary btn-sm" onClick={fetchAll} title="รีเฟรช"><RotateCcw size={15} /></button>
                    <button className="btn btn-primary" onClick={openAdd}><Plus size={18} /> เพิ่มสินค้า</button>
                </div>
            </div>

            {/* ── Content ── */}
            {loading ? (
                <div className="products-grid">
                    {[...Array(8)].map((_, i) => <div key={i} className="skeleton" style={{ height: 300, borderRadius: 18 }} />)}
                </div>
            ) : viewMode === 'grid' ? (
                <>
                    <div className="products-grid">
                        {filtered.map(p => (
                            <div key={p.product_id} className="product-card" onClick={() => handleSelectProduct(p)}>
                                {/* Hover action buttons */}
                                <div className="product-card-actions" onClick={e => e.stopPropagation()}>
                                    <button className="product-card-action-btn edit" title="แก้ไข" onClick={() => openEdit(p)}>
                                        <Pencil size={13} />
                                    </button>
                                    <button className="product-card-action-btn del" title="ลบ" onClick={() => handleDelete(p.product_id)}>
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                                <div className="product-card-image">
                                    <ProductImage src={p.image_url} alt={p.product_name} />
                                    {p.total_stock <= (p.low_stock_threshold || 5) && (
                                        <div className="stock-badge warning">⚠ สต็อกต่ำ</div>
                                    )}
                                </div>
                                <div className="product-card-content">
                                    {p.category_name && <div className="product-card-cat">{p.category_name}</div>}
                                    <h3 className="product-card-title">{p.product_name}</h3>
                                    <p className="product-card-price">
                                        {p.min_price ? formatPrice(p.min_price) : '—'}
                                        {p.max_price && p.max_price !== p.min_price ? ` – ${formatPrice(p.max_price)}` : ''}
                                    </p>
                                    <div className="product-card-stock">สต็อก: {p.total_stock ?? 0}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {filtered.length === 0 && (
                        <div className="empty-state"><Search size={52} /><p>ไม่พบสินค้าที่คุณค้นหา</p></div>
                    )}
                </>
            ) : (
                /* ── Table View ── */
                <div className="card" style={{ overflow: 'hidden' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>รูป</th><th>ชื่อสินค้า</th><th>หมวดหมู่</th>
                                <th>ราคา</th><th>สต็อกรวม</th><th>สถานะ</th><th>จัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(p => (
                                <tr key={p.product_id} style={{ cursor: 'pointer' }} onClick={() => handleSelectProduct(p)}>
                                    <td><div className="product-thumb"><ProductImage src={p.image_url} alt={p.product_name} /></div></td>
                                    <td>
                                        <div style={{ fontWeight: 700, fontSize: 14 }}>{p.product_name}</div>
                                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{p.variant_count || 0} variant</div>
                                    </td>
                                    <td>{p.category_name ? <span className="badge badge-purple">{p.category_name}</span> : <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                                    <td><span style={{ fontWeight: 700, color: '#AA5DC6' }}>{p.min_price ? formatPrice(p.min_price) : '—'}</span></td>
                                    <td>
                                        {p.total_stock <= (p.low_stock_threshold || 5)
                                            ? <span className="badge badge-orange">⚠ {p.total_stock ?? 0}</span>
                                            : <span className="badge badge-green">{p.total_stock ?? 0}</span>}
                                    </td>
                                    <td><span className={`badge ${p.is_active ? 'badge-green' : 'badge-gray'}`}>{p.is_active ? 'เปิด' : 'ปิด'}</span></td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 8 }} onClick={e => e.stopPropagation()}>
                                            <button className="btn btn-secondary btn-sm" onClick={() => openEdit(p)}><Pencil size={13} /></button>
                                            <button className="btn btn-outline btn-sm" style={{ color: '#f87171', borderColor: 'rgba(248,113,113,0.3)' }}
                                                onClick={() => handleDelete(p.product_id)}><Trash2 size={13} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 48 }}>ไม่พบสินค้า</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ─── Detail Modal (center popup, large readable) ─── */}
            {selectedProduct && (
                <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
                    <div className="modal-box prod-detail-modal" onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div className="modal-header" style={{ padding: '22px 28px 18px' }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'rgba(255,255,255,0.95)' }}>
                                    {selectedProduct.product_name || selectedProduct.name}
                                </h2>
                                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                                    <span className="badge badge-purple" style={{ fontSize: 13, padding: '5px 14px' }}>
                                        {selectedProduct.category_name || 'ไม่ระบุหมวดหมู่'}
                                    </span>
                                    <span className={`badge ${selectedProduct.is_active ? 'badge-green' : 'badge-gray'}`}
                                        style={{ fontSize: 13, padding: '5px 14px' }}>
                                        {selectedProduct.is_active ? '✅ เปิดใช้งาน' : '⏸️ ปิดใช้งาน'}
                                    </span>
                                </div>
                            </div>
                            <button className="modal-close" onClick={() => setSelectedProduct(null)}>
                                <X size={24} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="modal-body" style={{ padding: '0 28px 8px' }}>
                            {detailLoading ? (
                                <div className="spinner-wrap"><div className="spinner" /></div>
                            ) : (
                                <div className="prod-detail-grid">
                                    {/* Left: Image + numbers */}
                                    <div className="prod-detail-img-col">
                                        <div className="prod-detail-img">
                                            <ProductImage src={selectedProduct.image_url} alt={selectedProduct.product_name} />
                                        </div>
                                        <div className="prod-detail-numbers">
                                            <div className="prod-num-box">
                                                <div className="prod-num-label">💰 ราคาขาย</div>
                                                <div className="prod-num-val" style={{ color: '#AA5DC6' }}>
                                                    {(() => {
                                                        const prices = selectedProduct.variants?.map(v => Number(v.price)).filter(p => p > 0) || [];
                                                        if (prices.length === 0) return formatPrice(selectedProduct.min_price || 0);
                                                        const minP = Math.min(...prices);
                                                        const maxP = Math.max(...prices);
                                                        return minP === maxP
                                                            ? formatPrice(minP)
                                                            : <>{formatPrice(minP)}<span style={{ fontSize: 16 }}> – {formatPrice(maxP)}</span></>;
                                                    })()}
                                                </div>
                                            </div>
                                            <div className="prod-num-box">
                                                <div className="prod-num-label">📦 สต็อกรวมทั้งหมด</div>
                                                <div className="prod-num-val">
                                                    {(() => {
                                                        const totalStock = selectedProduct.variants?.reduce((sum, v) => sum + (Number(v.stock_quantity) || 0), 0)
                                                            ?? selectedProduct.total_stock ?? 0;
                                                        // Find most common unit among variants
                                                        const units = selectedProduct.variants?.map(v => v.unit).filter(Boolean) || [];
                                                        const unit = units.length > 0 ? units[0] : 'ชิ้น';
                                                        return <>{totalStock}<span style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', marginLeft: 6 }}>{unit}</span></>;
                                                    })()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Description + Variants */}
                                    <div className="prod-detail-info-col">
                                        {selectedProduct.description && (
                                            <div className="prod-detail-section">
                                                <div className="prod-detail-section-title">📝 รายละเอียดสินค้า</div>
                                                <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.65)', lineHeight: 1.8, margin: 0 }}>
                                                    {selectedProduct.description}
                                                </p>
                                            </div>
                                        )}

                                        <div className="prod-detail-section">
                                            <div className="prod-detail-section-title">
                                                🏷️ ตัวเลือกสินค้า ({selectedProduct.variants?.length || 0} รายการ)
                                            </div>
                                            <div className="variant-list">
                                                {selectedProduct.variants?.map(v => (
                                                    <div key={v.variant_id}
                                                        className={`variant-item ${v.is_main ? 'main' : ''}`}
                                                        style={{ padding: '14px 16px', gap: 14 }}>
                                                        <div className="v-img" style={{ width: 52, height: 52, borderRadius: 10 }}>
                                                            <ProductImage src={v.image_url} size={14} />
                                                        </div>
                                                        <div className="v-info">
                                                            <div style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.9)', marginBottom: 4 }}>
                                                                {v.sku || 'ไม่มีรหัสสินค้า'}
                                                            </div>
                                                            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
                                                                {v.unit && <span>{v.unit} · </span>}
                                                                {formatPrice(v.price)} · สต็อก: <strong style={{ color: 'rgba(255,255,255,0.8)' }}>{v.stock_quantity}</strong>
                                                            </div>
                                                            <ThresholdAdjuster
                                                                variantId={v.variant_id}
                                                                initialValue={v.low_stock_threshold}
                                                                onSaved={handleThresholdSaved}
                                                            />
                                                        </div>
                                                        <div className="v-actions">
                                                            {v.is_main ? (
                                                                <span title="ตัวเลือกหลัก">
                                                                    <Star size={22} fill="#AA5DC6" color="#AA5DC6" />
                                                                </span>
                                                            ) : (
                                                                <button title="ตั้งเป็นตัวหลัก"
                                                                    onClick={() => handleSetMain(v.variant_id)}
                                                                    className="btn-set-main">
                                                                    <Star size={22} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="modal-footer" style={{ padding: '16px 28px 24px', gap: 12 }}>
                            <button className="btn btn-secondary"
                                style={{ minHeight: 52, fontSize: 16, color: '#f87171', gap: 8 }}
                                onClick={() => { const p = selectedProduct; setSelectedProduct(null); handleDelete(p.product_id); }}>
                                <Trash2 size={18} /> ลบสินค้า
                            </button>
                            <button className="btn btn-primary"
                                style={{ minHeight: 52, fontSize: 16, gap: 8, flex: 1 }}
                                onClick={() => { const p = selectedProduct; setSelectedProduct(null); openEdit(p); }}>
                                <Pencil size={18} /> แก้ไขข้อมูล
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Form Modal (Add / Edit) ─── */}
            {modalOpen && (
                <div className="modal-overlay" onClick={() => setModalOpen(false)}>
                    <div className="modal-box" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editData ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่'}</h2>
                            <button className="modal-close" onClick={() => setModalOpen(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSave} className="modal-body">
                            <div className="form-row">
                                <div className="input-group">
                                    <label className="input-label">ชื่อสินค้า *</label>
                                    <input className="input-field" value={form.name}
                                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                        required placeholder="ชื่อสินค้า" />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">หมวดหมู่</label>
                                    <select className="input-field" value={form.category_id}
                                        onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}>
                                        <option value="">-- ไม่ระบุ --</option>
                                        {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="input-group">
                                <label className="input-label">คำอธิบาย</label>
                                <textarea className="input-field" rows={3} value={form.description}
                                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                    placeholder="รายละเอียดสินค้า" />
                            </div>
                            <div className="input-group">
                                <label className="input-label">สถานะ</label>
                                <select className="input-field" value={form.is_active}
                                    onChange={e => setForm(f => ({ ...f, is_active: e.target.value === 'true' }))}>
                                    <option value="true">เปิดใช้งาน</option>
                                    <option value="false">ปิดใช้งาน</option>
                                </select>
                            </div>

                            {/* Variants */}
                            <div className="variants-section">
                                <div className="variants-header">
                                    <h4>ตัวเลือกสินค้า</h4>
                                </div>
                                {form.variants.map((v, i) => (
                                    <div key={i} className="variant-form-card">
                                        <div className="variant-form-header">
                                            <span>ตัวเลือกที่ {i + 1}</span>
                                            <div style={{ display: 'flex', gap: 10 }}>
                                                <button type="button"
                                                    onClick={() => handleSetMainInForm(i)}
                                                    className={`btn-star ${v.is_main ? 'active' : ''}`}
                                                    title="ตั้งเป็นตัวเลือกหลัก">
                                                    <Star size={16} fill={v.is_main ? '#AA5DC6' : 'none'} color={v.is_main ? '#AA5DC6' : 'currentColor'} />
                                                </button>
                                                {form.variants.length > 1 && (
                                                    <button type="button" className="remove-btn" onClick={() => removeVariant(i)}>
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="variant-form-grid">
                                            <div className="input-group">
                                                <label className="input-label">คุณลักษณะสินค้า</label>
                                                <input className="input-field" value={v.sku}
                                                    onChange={e => handleVarChange(i, 'sku', e.target.value)}
                                                    placeholder="SKU-001" />
                                            </div>
                                            <div className="input-group">
                                                <label className="input-label">ราคา (บาท) *</label>
                                                <input type="number" className="input-field" value={v.price}
                                                    onChange={e => handleVarChange(i, 'price', e.target.value)}
                                                    required placeholder="0.00" />
                                            </div>
                                            <div className="input-group">
                                                <label className="input-label">จำนวนสต็อก</label>
                                                <input type="number" className="input-field" value={v.stock_quantity}
                                                    onChange={e => handleVarChange(i, 'stock_quantity', Number(e.target.value))} />
                                            </div>
                                            <div className="input-group">
                                                <label className="input-label">หน่วย</label>
                                                <input className="input-field" value={v.unit}
                                                    onChange={e => handleVarChange(i, 'unit', e.target.value)}
                                                    placeholder="ชิ้น / kg / กล่อง" />
                                            </div>
                                            <div className="input-group">
                                                <label className="input-label">เกณฑ์แจ้งสต็อกต่ำ</label>
                                                <input type="number" className="input-field" value={v.low_stock_threshold}
                                                    onChange={e => handleVarChange(i, 'low_stock_threshold', Number(e.target.value))}
                                                    min={0} />
                                            </div>
                                        </div>
                                        <div className="input-group">
                                            <label className="input-label">รูปภาพ</label>
                                            <div className="image-upload-row">
                                                <input className="input-field" value={v.image_url}
                                                    onChange={e => handleVarChange(i, 'image_url', e.target.value)}
                                                    placeholder="URL รูปภาพ" style={{ flex: 1 }} />
                                                <label className="upload-label">
                                                    <Upload size={14} /> อัปโหลด
                                                    <input type="file" accept="image/*"
                                                        style={{ display: 'none' }}
                                                        onChange={e => handleImageUpload(e, i)} />
                                                </label>
                                            </div>
                                            {v.image_url && <img src={getImageUrl(v.image_url)} alt="preview" className="image-preview" />}
                                            <p style={{ margin: '6px 0 0', fontSize: 11.5, color: 'rgba(255,255,255,0.28)', lineHeight: 1.6 }}>
                                                📐 แนะนำขนาด <strong style={{ color: 'rgba(255,255,255,0.45)' }}>800×800 px</strong> ขึ้นไป, อัตราส่วน 1:1<br />
                                                🖼️ รองรับไฟล์: <strong style={{ color: 'rgba(255,255,255,0.45)' }}>JPG, PNG, WEBP</strong> · ขนาดไม่เกิน 5 MB
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {/* ── Add Variant button at bottom of list ── */}
                                <button
                                    type="button"
                                    className="btn btn-outline btn-sm"
                                    onClick={addVariant}
                                    style={{ width: '100%', marginTop: 10, justifyContent: 'center' }}
                                >
                                    <Plus size={14} /> เพิ่มตัวเลือก
                                </button>
                            </div>

                            <div className="modal-footer" style={{ padding: '16px 0 0', border: 'none' }}>
                                <button type="button" className="btn btn-secondary" style={{ minHeight: 52, fontSize: 16 }}
                                    onClick={() => setModalOpen(false)}>ยกเลิก</button>
                                <button type="submit" className="btn btn-primary" style={{ minHeight: 52, fontSize: 16, flex: 1 }}
                                    disabled={saving}>
                                    {saving ? <div className="spinner" style={{ width: 18, height: 18 }} /> : (editData ? 'บันทึกการแก้ไข' : 'เพิ่มสินค้า')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductsPage;
