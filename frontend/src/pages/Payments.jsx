import React, { useEffect, useState } from 'react';
import { CreditCard, CheckCircle, Filter, Plus, Trash2, AlertCircle, Loader2, TrendingUp, Users, XCircle, Download, MessageSquare } from 'lucide-react';
import { downloadCSV } from '../utils/exportUtils';
import api from '../api/axios';
import ConfirmModal from '../components/ConfirmModal';
import Toast from '../components/Toast';
import Skeleton from '../components/Skeleton';

const Payments = () => {
  const [activeTab, setActiveTab] = useState('status'); // 'status', 'history', 'unpaid'
  const [payments, setPayments] = useState([]);
  const [billingStatus, setBillingStatus] = useState([]);
  const [customTypes, setCustomTypes] = useState([]);
  const [summary, setSummary] = useState({});
  const [unpaidByType, setUnpaidByType] = useState({});
  const [houses, setHouses] = useState([]);
  const [selectedKeys, setSelectedKeys] = useState([]); // format: "houseId_feeType"
  const [showModal, setShowModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Feedback states
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [confirm, setConfirm] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const [formData, setFormData] = useState({
    house_id: '',
    fee_type: 'satpam',
    amount: 100000,
    payment_date: new Date().toISOString().split('T')[0],
    month: currentMonth,
    year: currentYear
  });

  const [bulkData, setBulkData] = useState({
    fee_type: '',
    amount: '',
    month: currentMonth,
    year: currentYear
  });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchPayments(), fetchHouses(), fetchBillingStatus()]);
      setLoading(false);
    };
    loadData();
  }, [currentMonth, currentYear]);

  const fetchPayments = async () => {
    try {
      const res = await api.get(`/payments?month=${currentMonth}&year=${currentYear}`);
      setPayments(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteAll = async () => {
    setConfirm({
      isOpen: true,
      title: 'Hapus Semua Data',
      message: 'PERINGATAN: Apakah Anda yakin ingin menghapus SEMUA riwayat transaksi? Tindakan ini tidak dapat dibatalkan.',
      onConfirm: async () => {
        const prevLoading = loading;
        setLoading(true);
        try {
          await api.delete('/payments/bulk-delete');
          fetchPayments();
          fetchBillingStatus();
          showToast('Semua riwayat transaksi berhasil dihapus');
        } catch (error) {
          console.error(error);
          showToast('Gagal menghapus transaksi', 'error');
        } finally {
          setLoading(prevLoading);
        }
      }
    });
  };

  const fetchBillingStatus = async () => {
    try {
      const res = await api.get(`/payments/billing-status?month=${currentMonth}&year=${currentYear}`);
      setBillingStatus(res.data.status);
      setCustomTypes(res.data.custom_types);
      setSummary(res.data.summary || {});
      setUnpaidByType(res.data.unpaid_by_type || {});
    } catch (error) {
      console.error(error);
    }
  };

  const fetchHouses = async () => {
    try {
      const res = await api.get('/houses');
      setHouses(res.data.filter(h => h.status === 'dihuni'));
    } catch (error) {
      console.error(error);
    }
  };

  const handleExport = () => {
    const headers = ['Unit', 'Penghuni', 'Jenis', 'Periode', 'Nominal', 'Status'];
    const exportData = payments.map(p => ({
      unit: p.house.house_number,
      penghuni: p.resident.full_name,
      jenis: p.fee_type,
      periode: `${months[p.month - 1]} ${p.year}`,
      nominal: p.amount,
      status: p.status
    }));
    downloadCSV(exportData, `Riwayat_Iuran_${months[currentMonth-1]}_${currentYear}`, headers);
  };

  const handleWhatsAppReminder = (item, type) => {
    const name = item.resident?.full_name || 'Warga';
    const phone = item.resident?.phone_number;
    
    if (!phone) {
      showToast('Nomor WhatsApp tidak tersedia', 'error');
      return;
    }

    const feeAmount = summary[type]?.fee_amount || 0;
    const monthName = months[currentMonth - 1];
    
    const message = `Halo Bapak/Ibu ${name},\n\nKami menginformasikan tagihan *${type.toUpperCase()}* untuk bulan *${monthName} ${currentYear}* sebesar *Rp ${feeAmount.toLocaleString('id-ID')}*.\n\nMohon dapat segera melakukan pembayaran melalui pengurus RT. Terima kasih. 🙏`;
    
    // Clean phone number (remove +, spaces, etc)
    const cleanPhone = phone.replace(/\D/g, '');
    const finalPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
    
    const url = `https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const toggleSelection = (houseId, feeType) => {
    const key = `${houseId}_${feeType}`;
    setSelectedKeys(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleBulkConfirmSelected = async () => {
    if (selectedKeys.length === 0) return;
    setLoading(true);
    try {
      const selections = selectedKeys.map(key => {
        const [house_id, fee_type] = key.split('_');
        return { house_id, fee_type };
      });

      await api.post('/payments/bulk-confirm-selected', { 
        selections,
        month: currentMonth,
        year: currentYear
      });

      showToast(`${selectedKeys.length} tagihan berhasil dikonfirmasi`);
      setSelectedKeys([]);
      fetchBillingStatus();
      fetchPayments();
    } catch (error) {
      console.error(error);
      showToast('Gagal mengkonfirmasi tagihan', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async (houseId, residentId, type, amount, paymentId = null) => {
    const label = type.charAt(0).toUpperCase() + type.slice(1);
    
    setConfirm({
      isOpen: true,
      title: 'Konfirmasi Pembayaran',
      message: `Konfirmasi pembayaran ${label} sebesar Rp ${amount.toLocaleString()}?`,
      onConfirm: async () => {
        const prevLoading = loading;
        setLoading(true);
        try {
          if (paymentId) {
            await api.put(`/payments/${paymentId}/confirm`);
          } else {
            await api.post('/payments', {
              house_id: houseId,
              resident_id: residentId,
              fee_type: type,
              amount: amount,
              payment_date: new Date().toISOString().split('T')[0],
              month: currentMonth,
              year: currentYear
            });
          }
          showToast(`Pembayaran ${label} berhasil dikonfirmasi`);
          fetchBillingStatus();
          fetchPayments();
        } catch (error) {
          console.error(error);
          showToast('Gagal mengkonfirmasi pembayaran', 'error');
        } finally {
          setLoading(prevLoading);
        }
      }
    });
  };

  const handleBulkConfirm = async (type) => {
    let amount = 0;
    if (type === 'satpam') amount = 100000;
    else if (type === 'kebersihan') amount = 15000;
    else {
      const item = billingStatus.find(b => b.fees[type] && b.fees[type].amount > 0);
      if (item) amount = item.fees[type].amount;
    }

    setConfirm({
      isOpen: true,
      title: 'Konfirmasi Massal',
      message: `Konfirmasi LUNAS semua tagihan ${type.toUpperCase()} bulan ini?`,
      onConfirm: async () => {
        const prevLoading = loading;
        setLoading(true);
        try {
          await api.post('/payments/bulk-confirm', {
            fee_type: type,
            amount: amount,
            month: currentMonth,
            year: currentYear
          });
          fetchBillingStatus();
          fetchPayments();
          showToast(`Semua tagihan ${type} berhasil dikonfirmasi`);
        } catch (error) {
          console.error(error);
          showToast('Gagal melakukan konfirmasi massal', 'error');
        } finally {
          setLoading(prevLoading);
        }
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const prevLoading = loading;
    setLoading(true);
    
    const house = houses.find(h => h.id === parseInt(formData.house_id));
    if (!house || !house.residents || house.residents.length === 0) {
      showToast('Rumah tidak memiliki penghuni aktif', 'error');
      setLoading(prevLoading);
      return;
    }

    try {
      await api.post('/payments', {
        ...formData,
        resident_id: house.residents[0].id,
        status: 'paid'
      });
      showToast('Pembayaran berhasil dicatat');
      setShowModal(false);
      fetchPayments();
      fetchBillingStatus();
    } catch (error) {
      console.error(error);
      showToast('Gagal mencatat pembayaran', 'error');
    } finally {
      setLoading(prevLoading);
    }
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    const prevLoading = loading;
    setLoading(true);
    try {
      const houseIds = houses.map(h => h.id);
      await api.post('/payments/bulk', {
        house_ids: houseIds,
        fee_type: bulkData.fee_type,
        amount: bulkData.amount,
        month: bulkData.month,
        year: bulkData.year
      });
      showToast(`Tagihan "${bulkData.fee_type}" berhasil dibuat`);
      setShowBulkModal(false);
      fetchPayments();
      fetchBillingStatus();
    } catch (error) {
      console.error(error);
      showToast('Gagal membuat tagihan kustom', 'error');
    } finally {
      setLoading(prevLoading);
    }
  };

  const handleDeletePayment = async (id) => {
    setConfirm({
      isOpen: true,
      title: 'Hapus Transaksi',
      message: 'Apakah Anda yakin ingin menghapus transaksi ini?',
      onConfirm: async () => {
        const prevLoading = loading;
        setLoading(true);
        try {
          await api.delete(`/payments/${id}`);
          showToast('Transaksi berhasil dihapus');
          fetchPayments();
          fetchBillingStatus();
        } catch (error) {
          console.error(error);
          showToast('Gagal menghapus transaksi', 'error');
        } finally {
          setLoading(prevLoading);
        }
      }
    });
  };

  // ... (UI starts here)

  // Skeleton rows for status table
  const StatusSkeletons = () => (
    [...Array(5)].map((_, i) => (
      <tr key={i}>
        <td className="px-6 py-4"><Skeleton className="h-4 w-8" /></td>
        <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
        <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
        <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
        {customTypes.map(t => <td key={t} className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>)}
      </tr>
    ))
  );

  // Skeleton rows for history table
  const HistorySkeletons = () => (
    [...Array(5)].map((_, i) => (
      <tr key={i}>
        <td className="px-6 py-4"><Skeleton className="h-4 w-8" /></td>
        <td className="px-6 py-4 flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </td>
        <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
        <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
        <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
        <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
        <td className="px-6 py-4"><Skeleton className="h-4 w-8 ml-auto" /></td>
      </tr>
    ))
  );

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  return (
    <div className="space-y-6">
      {/* ... header and tabs ... */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Iuran Bulanan</h1>
          <p className="text-text-muted mt-1 text-sm">Monitoring dan penagihan iuran warga</p>
        </div>
        <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full lg:w-auto">
          <button onClick={handleExport} className="btn-secondary flex-1 sm:flex-none flex items-center justify-center gap-2">
            <Download size={18} />
            <span className="hidden xs:inline">Ekspor</span>
          </button>
          <button onClick={() => { setBulkData({ ...bulkData, month: currentMonth, year: currentYear }); setShowBulkModal(true); }} className="flex-1 sm:flex-none px-4 py-2 bg-purple-50 text-purple-600 border border-purple-100 rounded-md text-sm font-bold hover:bg-purple-100 transition-colors whitespace-nowrap text-center">Tagihan Kustom</button>
          <button onClick={() => { setFormData({ ...formData, month: currentMonth, year: currentYear }); setShowModal(true); }} className="btn-primary flex-1 sm:flex-none justify-center whitespace-nowrap"><Plus size={18} /> <span className="hidden xs:inline">Catat Manual</span><span className="xs:hidden">Catat</span></button>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-white p-1 rounded-lg border border-border w-fit">
        <button onClick={() => setActiveTab('status')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${activeTab === 'status' ? 'bg-primary text-white shadow-sm' : 'text-text-muted hover:text-text-main'}`}>Status Tagihan</button>
        <button onClick={() => setActiveTab('history')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-primary text-white shadow-sm' : 'text-text-muted hover:text-text-main'}`}>Riwayat Transaksi</button>
        <button onClick={() => setActiveTab('unpaid')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all flex items-center gap-1.5 ${activeTab === 'unpaid' ? 'bg-red-500 text-white shadow-sm' : 'text-text-muted hover:text-text-main'}`}>
          Belum Bayar
          {Object.values(unpaidByType).reduce((a, arr) => a + (arr?.length || 0), 0) > 0 && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${activeTab === 'unpaid' ? 'bg-white/30 text-white' : 'bg-red-100 text-red-600'}`}>
              {Object.values(unpaidByType).reduce((a, arr) => a + (arr?.length || 0), 0)}
            </span>
          )}
        </button>
      </div>

      <div className="flex items-center gap-3 mb-2">
        <select className="bg-white border border-border rounded px-3 py-1.5 text-sm font-medium outline-none focus:border-primary" value={currentMonth} onChange={(e) => setCurrentMonth(parseInt(e.target.value))}>
          {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <input type="number" className="bg-white border border-border rounded px-3 py-1.5 text-sm font-medium w-24 outline-none focus:border-primary" value={currentYear} onChange={(e) => setCurrentYear(parseInt(e.target.value))} />
      </div>

      {/* Progress Summary Cards */}
      {(activeTab === 'status' || activeTab === 'unpaid') && !loading && Object.keys(summary).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {['satpam', 'kebersihan', ...customTypes].map(type => {
            const s = summary[type];
            if (!s) return null;
            return (
              <div key={type} className="glass-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">{type}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    s.percentage === 100 ? 'bg-green-100 text-green-700' :
                    s.percentage >= 50  ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-600'
                  }`}>{s.percentage}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2">
                  <div
                    className={`h-1.5 rounded-full transition-all ${
                      s.percentage === 100 ? 'bg-green-500' :
                      s.percentage >= 50  ? 'bg-yellow-400' : 'bg-red-400'
                    }`}
                    style={{ width: `${s.percentage}%` }}
                  />
                </div>
                <p className="text-xs font-bold text-text-main">{s.paid}/{s.total} Rumah Lunas</p>
                <p className="text-[10px] text-text-muted mt-0.5">
                  Rp {parseFloat(s.collected_amount).toLocaleString('id-ID')} / Rp {parseFloat(s.target_amount).toLocaleString('id-ID')}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'unpaid' ? (
        <div className="space-y-4">
          {['satpam', 'kebersihan', ...customTypes].map(type => {
            const list = unpaidByType[type] || [];
            if (list.length === 0) return null;
            return (
              <div key={type} className="glass-card overflow-hidden">
                <div className="px-6 py-3 bg-red-50 border-b border-red-100 flex items-center justify-between">
                  <h4 className="text-sm font-bold text-red-700 uppercase tracking-wider">{type}</h4>
                  <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">{list.length} belum bayar</span>
                </div>
                <div className="divide-y divide-border">
                  {list.map(item => (
                    <div key={item.house_id} className="px-6 py-3 flex items-center gap-3">
                      <div className="w-7 h-7 rounded bg-red-50 text-red-600 flex items-center justify-center text-xs font-bold border border-red-100">#{item.house_number}</div>
                      <div>
                        <p className="text-sm font-bold text-text-main">{item.resident?.full_name || '-'}</p>
                        <p className="text-[10px] text-text-muted">Unit No. {item.house_number}</p>
                      </div>
                      <div className="ml-auto flex items-center gap-2">
                        <button 
                          onClick={() => handleWhatsAppReminder(item, type)}
                          className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-600 hover:text-white transition-all flex items-center gap-1.5 text-[10px] font-bold border border-green-100"
                        >
                          <MessageSquare size={14} />
                          Tagih WA
                        </button>
                        <XCircle size={16} className="text-red-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {Object.values(unpaidByType).every(arr => arr.length === 0) && (
            <div className="glass-card p-12 flex flex-col items-center justify-center text-center">
              <CheckCircle size={32} className="text-green-400 mb-2" />
              <p className="font-bold text-green-600">Semua rumah sudah lunas bulan ini!</p>
            </div>
          )}
        </div>
      ) : activeTab === 'status' ? (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="text-[10px] font-bold uppercase tracking-wider text-text-muted border-b border-border bg-gray-50/50">
                  <th className="px-6 py-3 w-20">Unit</th>
                  <th className="px-6 py-3 min-w-[150px]">Penghuni</th>
                  <th className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <span>Satpam</span>
                      <button onClick={() => handleBulkConfirm('satpam')} className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[8px] hover:bg-blue-200">LUNAS SEMUA</button>
                    </div>
                  </th>
                  <th className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <span>Kebersihan</span>
                      <button onClick={() => handleBulkConfirm('kebersihan')} className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[8px] hover:bg-blue-200">LUNAS SEMUA</button>
                    </div>
                  </th>
                  {customTypes.map(type => (
                    <th key={type} className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <span>{type}</span>
                        <button onClick={() => handleBulkConfirm(type)} className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-[8px] hover:bg-purple-200">LUNAS SEMUA</button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? <StatusSkeletons /> : billingStatus.map((item) => (
                  <tr key={item.house_id} className="hover:bg-gray-50 transition-colors text-sm">
                    <td className="px-6 py-4 font-bold text-text-main">#{item.house_number}</td>
                    <td className="px-6 py-4 text-text-muted truncate max-w-[150px]">{item.resident?.full_name || '-'}</td>
                    {['satpam', 'kebersihan'].map(key => (
                      <td key={key} className="px-6 py-4">
                        {item.fees[key].status === 'paid' ? (
                          <span className="inline-flex items-center gap-1 text-green-600 font-bold text-[9px] uppercase bg-green-50 px-2 py-0.5 rounded border border-green-100">
                            <CheckCircle size={10} /> Lunas
                          </span>
                        ) : (
                          <label className="inline-flex items-center gap-2 cursor-pointer group">
                            <input 
                              type="checkbox" 
                              className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary"
                              checked={selectedKeys.includes(`${item.house_id}_${key}`)}
                              onChange={() => toggleSelection(item.house_id, key)}
                            />
                            <span className="text-[9px] font-bold text-text-muted group-hover:text-primary transition-colors uppercase">Pilih</span>
                          </label>
                        )}
                      </td>
                    ))}
                    {customTypes.map(type => (
                      <td key={type} className="px-6 py-4">
                        {item.fees[type].status === 'paid' ? (
                          <span className="inline-flex items-center gap-1 text-green-600 font-bold text-[9px] uppercase bg-green-50 px-2 py-0.5 rounded border border-green-100">
                            <CheckCircle size={10} /> Lunas
                          </span>
                        ) : item.fees[type].status === 'pending' || item.fees[type].status === 'none' ? (
                          <label className="inline-flex items-center gap-2 cursor-pointer group">
                            <input 
                              type="checkbox" 
                              className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary"
                              checked={selectedKeys.includes(`${item.house_id}_${type}`)}
                              onChange={() => toggleSelection(item.house_id, type)}
                            />
                            <span className="text-[9px] font-bold text-text-muted group-hover:text-primary transition-colors uppercase">Pilih</span>
                          </label>
                        ) : (
                          <span className="text-[9px] text-text-muted italic">-</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between bg-gray-50">
            <h3 className="text-base font-bold text-text-main">Riwayat Transaksi</h3>
            <button onClick={handleDeleteAll} className="px-3 py-1.5 rounded bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 text-xs font-bold border border-red-100 transition-colors flex items-center gap-2"><Trash2 size={14} /> Hapus Semua Data</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[11px] font-bold uppercase tracking-wider text-text-muted border-b border-border bg-gray-50/50">
                  <th className="px-6 py-3">Unit</th>
                  <th className="px-6 py-3">Penghuni</th>
                  <th className="px-6 py-3">Jenis</th>
                  <th className="px-6 py-3">Periode</th>
                  <th className="px-6 py-3">Nominal</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? <HistorySkeletons /> : payments.length > 0 ? payments.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors text-sm">
                    <td className="px-6 py-4 font-bold text-text-main">#{p.house.house_number}</td>
                    <td className="px-6 py-4 flex items-center gap-3"><div className="w-8 h-8 rounded bg-gray-100 text-text-muted flex items-center justify-center text-xs font-bold border border-border">{p.resident.full_name.charAt(0)}</div><span className="text-text-main font-medium">{p.resident.full_name}</span></td>
                    <td className="px-6 py-4"><span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${p.fee_type === 'satpam' ? 'bg-blue-50 text-blue-700 border-blue-100' : p.fee_type === 'kebersihan' ? 'bg-pink-50 text-pink-700 border-pink-100' : 'bg-purple-50 text-purple-700 border-purple-100'}`}>{p.fee_type}</span></td>
                    <td className="px-6 py-4"><span className="text-text-main font-medium">{months[p.month - 1]} {p.year}</span></td>
                    <td className="px-6 py-4 font-bold text-text-main">Rp {parseFloat(p.amount).toLocaleString()}</td>
                    <td className="px-6 py-4"><div className={`inline-flex items-center gap-1.5 font-bold text-[10px] uppercase px-2 py-1 rounded border ${p.status === 'paid' ? 'text-green-600 bg-green-50 border-green-100' : 'text-orange-600 bg-orange-50 border-orange-100'}`}>{p.status === 'paid' ? <CheckCircle size={12} /> : <AlertCircle size={12} />} {p.status === 'paid' ? 'Lunas' : 'Pending'}</div></td>
                    <td className="px-6 py-4 text-right"><button onClick={() => handleDeletePayment(p.id)} className="p-1.5 rounded text-text-muted hover:text-red-600 hover:bg-red-50 transition-colors" title="Hapus Transaksi"><Trash2 size={16} /></button></td>
                  </tr>
                )) : <tr><td colSpan="7" className="px-6 py-12 text-center text-text-muted italic">Belum ada data.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)}></div>
          <form onSubmit={handleSubmit} className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-md space-y-4 animate-in zoom-in duration-200">
            <h2 className="text-xl font-bold text-text-main border-b border-border pb-3">Catat Pembayaran Manual</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-text-muted mb-1 uppercase tracking-wider">Unit Rumah</label>
                <select 
                  required
                  className="input-field text-sm"
                  value={formData.house_id}
                  onChange={(e) => setFormData({...formData, house_id: e.target.value})}
                >
                  <option value="">-- Pilih Unit --</option>
                  {houses.map(h => (
                    <option key={h.id} value={h.id}>Unit #{h.house_number} — {h.residents[0]?.full_name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-text-muted mb-1 uppercase tracking-wider">Jenis</label>
                  <input type="text" className="input-field text-sm" value={formData.fee_type} onChange={(e) => setFormData({...formData, fee_type: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-text-muted mb-1 uppercase tracking-wider">Nominal (Rp)</label>
                  <input type="number" required className="input-field text-sm font-bold" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} />
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 rounded bg-gray-100 text-text-main font-bold text-sm border border-border">Batal</button>
              <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center text-sm">{loading ? 'Proses...' : 'Simpan (Lunas)'}</button>
            </div>
          </form>
        </div>
      )}

      {showBulkModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowBulkModal(false)}></div>
          <form onSubmit={handleBulkSubmit} className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-md space-y-4 animate-in zoom-in duration-200">
            <h2 className="text-xl font-bold text-text-main border-b border-border pb-3">Buat Tagihan Kustom</h2>
            <p className="text-xs text-text-muted">Tagihan ini akan dibuat sebagai **Pending** untuk semua rumah yang dihuni.</p>
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-text-muted mb-1 uppercase tracking-wider">Nama Tagihan</label>
                <input 
                  type="text" 
                  required
                  placeholder="Contoh: Iuran 17 Agustus"
                  className="input-field text-sm"
                  value={bulkData.fee_type}
                  onChange={(e) => setBulkData({...bulkData, fee_type: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-text-muted mb-1 uppercase tracking-wider">Nominal per Rumah (Rp)</label>
                <input 
                  type="number" 
                  required
                  className="input-field text-sm font-bold"
                  value={bulkData.amount}
                  onChange={(e) => setBulkData({...bulkData, amount: e.target.value})}
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowBulkModal(false)} className="flex-1 py-2 rounded bg-gray-100 text-text-main font-bold text-sm border border-border">Batal</button>
              <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center text-sm bg-purple-600 hover:bg-purple-700">{loading ? 'Proses...' : 'Buat Tagihan'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Feedback UI */}
      <div className="fixed bottom-6 right-6 z-[300] flex flex-col gap-2">
        {toast.show && (
          <Toast 
            message={toast.message} 
            type={toast.type} 
            onClose={() => setToast({ ...toast, show: false })} 
          />
        )}
      </div>

      <ConfirmModal 
        isOpen={confirm.isOpen}
        onClose={() => setConfirm({ ...confirm, isOpen: false })}
        onConfirm={confirm.onConfirm}
        title={confirm.title}
        message={confirm.message}
        confirmText="Ya, Lanjutkan"
        type={confirm.title.includes('Hapus') ? 'danger' : 'primary'}
      />

      {/* Floating Action Bar for Selection */}
      {selectedKeys.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-bottom-10 duration-300">
          <div className="bg-gray-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-8 border border-white/10 backdrop-blur-xl">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest text-center sm:text-left">Terpilih</span>
              <span className="text-lg font-bold">{selectedKeys.length} Tagihan</span>
            </div>
            <div className="h-10 w-px bg-white/10 hidden sm:block" />
            <div className="flex gap-3">
              <button 
                onClick={() => setSelectedKeys([])}
                className="px-4 py-2 rounded-xl text-sm font-bold hover:bg-white/10 transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={handleBulkConfirmSelected}
                disabled={loading}
                className="btn-primary py-2.5 px-6 rounded-xl shadow-lg shadow-primary/20"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
                Konfirmasi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};



export default Payments;
