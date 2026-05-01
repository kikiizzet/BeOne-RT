import React, { useEffect, useState } from 'react';
import { Receipt, Plus, TrendingDown, Calendar, Trash2, Filter, Tag, ChevronDown, RefreshCw, Download, Edit3 } from 'lucide-react';
import { downloadCSV } from '../utils/exportUtils';
import api from '../api/axios';
import ConfirmModal from '../components/ConfirmModal';
import Toast from '../components/Toast';
import Skeleton from '../components/Skeleton';

const CATEGORIES = [
  { value: 'gaji_satpam',    label: 'Gaji Satpam',         color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'token_listrik',  label: 'Token Listrik',        color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { value: 'perbaikan',      label: 'Perbaikan Fasilitas',  color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { value: 'operasional',    label: 'Operasional',          color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { value: 'lainnya',        label: 'Lainnya',              color: 'bg-gray-100 text-gray-600 border-gray-200' },
];

const getCategoryInfo = (val) => CATEGORIES.find(c => c.value === val) || CATEGORIES[CATEGORIES.length - 1];

const months = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState({ total_amount: 0, total_count: 0, by_category: {} });
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filterCategory, setFilterCategory] = useState('');

  const [formData, setFormData] = useState({
    description: '',
    category: 'operasional',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    is_recurring: false
  });

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [confirm, setConfirm] = useState({ isOpen: false, id: null });
  const [editingId, setEditingId] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  useEffect(() => {
    fetchExpenses();
  }, [filterMonth, filterYear, filterCategory]);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterMonth) params.month = filterMonth;
      if (filterYear)  params.year  = filterYear;
      if (filterCategory) params.category = filterCategory;

      const res = await api.get('/expenses', { params });
      setExpenses(res.data.data);
      setSummary(res.data.summary);
    } catch (error) {
      console.error(error);
      showToast('Gagal memuat data pengeluaran', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingId) {
        await api.put(`/expenses/${editingId}`, formData);
        showToast('Catatan pengeluaran berhasil diperbarui');
      } else {
        await api.post('/expenses', formData);
        showToast('Catatan pengeluaran berhasil disimpan');
      }
      setShowModal(false);
      setEditingId(null);
      fetchExpenses();
      setFormData({ description: '', category: 'operasional', amount: '', expense_date: new Date().toISOString().split('T')[0], is_recurring: false });
    } catch (error) {
      console.error(error);
      showToast('Gagal menyimpan pengeluaran', 'error');
    } finally {
      setLoading(false);
    }
  };

  const deleteExpense = (id) => {
    setConfirm({ isOpen: true, id });
  };

  const executeDelete = async () => {
    setLoading(true);
    try {
      await api.delete(`/expenses/${confirm.id}`);
      showToast('Catatan pengeluaran berhasil dihapus');
      fetchExpenses();
    } catch (error) {
      console.error(error);
      showToast('Gagal menghapus catatan', 'error');
    } finally {
      setLoading(false);
      setConfirm({ ...confirm, isOpen: false });
    }
  };

  const startEdit = (expense) => {
    setEditingId(expense.id);
    setFormData({
      description: expense.description,
      category: expense.category,
      amount: expense.amount,
      expense_date: expense.expense_date,
      is_recurring: !!expense.is_recurring
    });
    setShowModal(true);
  };

  const handleExport = () => {
    const headers = ['Description', 'Category', 'Amount', 'Expense Date', 'Is Recurring'];
    const exportData = expenses.map(e => ({
      description: e.description,
      category: e.category,
      amount: e.amount,
      expense_date: e.expense_date,
      is_recurring: e.is_recurring ? 'Yes' : 'No'
    }));
    downloadCSV(exportData, `Pengeluaran_${filterMonth || 'Semua'}_${filterYear}`, headers);
  };

  const isFiltered = filterMonth || filterCategory;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Pengeluaran Lingkungan</h1>
          <p className="text-text-muted mt-1 text-sm">Catatan biaya operasional dan perbaikan fasilitas</p>
        </div>
        <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full md:w-auto">
          <button onClick={handleExport} className="btn-secondary flex-1 sm:flex-none flex items-center justify-center gap-2">
            <Download size={18} />
            <span className="hidden xs:inline">Ekspor Excel</span>
            <span className="xs:hidden">Ekspor</span>
          </button>
          <button onClick={() => { setEditingId(null); setShowModal(true); }} className="btn-primary flex-1 sm:flex-none justify-center">
            <Plus size={18} />
            <span className="hidden xs:inline">Tambah Pengeluaran</span>
            <span className="xs:hidden">Tambah</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-3 flex flex-wrap items-center gap-3">
        <Filter size={15} className="text-text-muted" />
        <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Filter:</span>
        <select
          className="bg-white border border-border rounded px-3 py-1.5 text-sm font-medium outline-none focus:border-primary"
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
        >
          <option value="">Semua Bulan</option>
          {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <input
          type="number"
          className="bg-white border border-border rounded px-3 py-1.5 text-sm font-medium w-24 outline-none focus:border-primary"
          value={filterYear}
          onChange={(e) => setFilterYear(e.target.value)}
          placeholder="Tahun"
        />
        <select
          className="bg-white border border-border rounded px-3 py-1.5 text-sm font-medium outline-none focus:border-primary"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="">Semua Kategori</option>
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        {isFiltered && (
          <button
            onClick={() => { setFilterMonth(''); setFilterCategory(''); }}
            className="text-xs text-red-500 font-bold hover:underline"
          >
            Reset Filter
          </button>
        )}
      </div>

      {/* Summary Bar */}
      {!loading && (
        <div className="glass-card p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                Total {filterMonth ? `${months[filterMonth - 1]} ${filterYear}` : `Tahun ${filterYear}`}
              </span>
              <span className="text-xl font-bold text-red-600">
                Rp {parseFloat(summary.total_amount || 0).toLocaleString('id-ID')}
              </span>
            </div>
            <div className="h-8 w-px bg-border hidden sm:block" />
            <div className="flex flex-wrap gap-2">
              {Object.entries(summary.by_category || {}).map(([cat, data]) => {
                const info = getCategoryInfo(cat);
                return (
                  <div key={cat} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold ${info.color}`}>
                    <Tag size={10} />
                    {info.label}: Rp {parseFloat(data.amount).toLocaleString('id-ID')}
                    <span className="opacity-60">({data.count}x)</span>
                  </div>
                );
              })}
              {Object.keys(summary.by_category || {}).length === 0 && (
                <span className="text-xs text-text-muted italic">Belum ada data untuk periode ini</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Expense Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="glass-card p-5 space-y-4">
              <div className="flex justify-between">
                <Skeleton className="w-10 h-10 rounded" />
                <Skeleton className="w-16 h-4" />
              </div>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="pt-4 border-t border-border flex justify-between items-center">
                <div className="space-y-1">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-6 w-24" />
                </div>
                <Skeleton className="w-8 h-8 rounded" />
              </div>
            </div>
          ))
        ) : expenses.length > 0 ? (
          expenses.map((expense) => {
            const catInfo = getCategoryInfo(expense.category);
            return (
              <div key={expense.id} className="glass-card p-5 flex flex-col hover:border-red-200 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded bg-red-50 text-red-600 flex items-center justify-center border border-red-100">
                    <TrendingDown size={20} />
                  </div>
                  <div className="flex gap-2">
                    {!!expense.is_recurring && (
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded border bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
                        <RefreshCw size={10} className="animate-spin-slow" /> Rutin
                      </span>
                    )}
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${catInfo.color}`}>
                      {catInfo.label}
                    </span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-text-main mb-2 leading-tight">{expense.description}</h3>

                <div className="flex items-center gap-2 text-text-muted text-[11px] mb-4">
                  <Calendar size={12} />
                  <span className="font-medium">
                    {new Date(expense.expense_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>

                <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Nominal</span>
                    <span className="text-xl font-bold text-text-main">Rp {parseFloat(expense.amount).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(expense)}
                      className="w-8 h-8 rounded bg-gray-50 text-text-muted hover:text-primary hover:bg-primary/5 transition-colors flex items-center justify-center border border-border"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => deleteExpense(expense.id)}
                      className="w-8 h-8 rounded bg-gray-50 text-text-muted hover:text-red-600 hover:bg-red-50 transition-colors flex items-center justify-center border border-border"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full glass-card p-12 flex flex-col items-center justify-center border-dashed">
            <Receipt size={32} className="text-gray-300 mb-2" />
            <p className="text-text-muted font-bold uppercase tracking-wider text-xs">Belum ada pengeluaran</p>
            <p className="text-text-muted text-[11px] mt-1">untuk periode yang dipilih</p>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)}></div>
          <form onSubmit={handleSubmit} className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-md space-y-4 animate-in zoom-in duration-200">
            <div className="border-b border-border pb-3">
              <h2 className="text-xl font-bold text-text-main">{editingId ? 'Edit' : 'Tambah'} Pengeluaran</h2>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-text-muted mb-1 uppercase tracking-wider">Keterangan</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Perbaikan jalan Blok B"
                  className="input-field text-sm"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-text-muted mb-1 uppercase tracking-wider">Kategori</label>
                <select
                  required
                  className="input-field text-sm"
                  value={formData.category}
                  onChange={(e) => {
                    const cat = e.target.value;
                    const isRecurring = cat === 'gaji_satpam' || cat === 'token_listrik';
                    setFormData({ ...formData, category: cat, is_recurring: isRecurring });
                  }}
                >
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-text-muted mb-1 uppercase tracking-wider">Nominal (Rp)</label>
                  <input
                    type="number"
                    required
                    className="input-field text-sm font-bold"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-text-muted mb-1 uppercase tracking-wider">Tanggal</label>
                  <input
                    type="date"
                    required
                    className="input-field text-sm"
                    value={formData.expense_date}
                    onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-3 p-3 rounded-lg border border-border bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded text-primary focus:ring-primary border-border"
                    checked={formData.is_recurring}
                    onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
                  />
                  <div>
                    <p className="text-xs font-bold text-text-main">Pengeluaran Rutin Tiap Bulan</p>
                    <p className="text-[10px] text-text-muted">Centang jika biaya ini selalu ada setiap bulannya (Contoh: Gaji Satpam, Listrik)</p>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 py-2 rounded bg-gray-100 text-text-main font-bold text-sm hover:bg-gray-200 border border-border"
              >
                Batal
              </button>
              <button type="submit" className="btn-primary flex-1 justify-center text-sm">
                Simpan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Feedback UI */}
      <div className="fixed bottom-6 right-6 z-[300] flex flex-col gap-2">
        {toast.show && (
          <Toast message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />
        )}
      </div>

      <ConfirmModal
        isOpen={confirm.isOpen}
        onClose={() => setConfirm({ ...confirm, isOpen: false })}
        onConfirm={executeDelete}
        title="Hapus Pengeluaran"
        message="Apakah Anda yakin ingin menghapus catatan pengeluaran ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Ya, Hapus"
        type="danger"
      />
    </div>
  );
};

export default Expenses;
