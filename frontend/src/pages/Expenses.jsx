import React, { useEffect, useState } from 'react';
import { Receipt, Plus, TrendingDown, Calendar, Trash2 } from 'lucide-react';
import api from '../api/axios';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const res = await api.get('/expenses');
      setExpenses(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/expenses', formData);
      setShowModal(false);
      fetchExpenses();
      setFormData({ description: '', amount: '', expense_date: new Date().toISOString().split('T')[0] });
    } catch (error) {
      console.error(error);
    }
  };

  const deleteExpense = async (id) => {
    if (window.confirm('Yakin ingin menghapus catatan pengeluaran ini?')) {
      try {
        await api.delete(`/expenses/${id}`);
        fetchExpenses();
      } catch (error) {
        console.error(error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Pengeluaran Lingkungan</h1>
          <p className="text-text-muted mt-1 text-sm">Catatan biaya operasional dan perbaikan fasilitas</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="btn-primary"
        >
          <Plus size={18} />
          Tambah Pengeluaran
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {expenses.length > 0 ? (
          expenses.map((expense) => (
            <div key={expense.id} className="glass-card p-5 flex flex-col hover:border-red-200">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded bg-red-50 text-red-600 flex items-center justify-center border border-red-100">
                  <TrendingDown size={20} />
                </div>
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider bg-gray-50 px-2 py-0.5 rounded border border-border">
                  Operasional
                </span>
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
                  <span className="text-xl font-bold text-text-main">Rp {parseFloat(expense.amount).toLocaleString()}</span>
                </div>
                <button 
                  onClick={() => deleteExpense(expense.id)}
                  className="w-8 h-8 rounded bg-gray-50 text-text-muted hover:text-red-600 hover:bg-red-50 transition-colors flex items-center justify-center border border-border"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full glass-card p-12 flex flex-col items-center justify-center border-dashed">
            <Receipt size={32} className="text-gray-300 mb-2" />
            <p className="text-text-muted font-bold uppercase tracking-wider text-xs">Belum ada pengeluaran</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)}></div>
          <form onSubmit={handleSubmit} className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-md space-y-4 animate-in zoom-in duration-200">
            <div className="border-b border-border pb-3">
              <h2 className="text-xl font-bold text-text-main">Tambah Pengeluaran</h2>
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
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-text-muted mb-1 uppercase tracking-wider">Nominal (Rp)</label>
                  <input 
                    type="number" 
                    required
                    className="input-field text-sm font-bold"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-text-muted mb-1 uppercase tracking-wider">Tanggal</label>
                  <input 
                    type="date" 
                    required
                    className="input-field text-sm"
                    value={formData.expense_date}
                    onChange={(e) => setFormData({...formData, expense_date: e.target.value})}
                  />
                </div>
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
              <button 
                type="submit" 
                className="btn-primary flex-1 justify-center text-sm"
              >
                Simpan
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};


export default Expenses;
