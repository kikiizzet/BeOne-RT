import React, { useEffect, useState } from 'react';
import { Home, UserPlus, History, CheckCircle2, XCircle, Trash2, LogOut, Calendar, Clock, Users, Download } from 'lucide-react';
import { downloadCSV } from '../utils/exportUtils';
import api from '../api/axios';
import ConfirmModal from '../components/ConfirmModal';
import Toast from '../components/Toast';
import Skeleton from '../components/Skeleton';

const Houses = () => {
  const [houses, setHouses] = useState([]);
  const [residents, setResidents] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedHouse, setSelectedHouse] = useState(null);
  const [houseDetail, setHouseDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ 
    resident_id: '', 
    start_date: new Date().toISOString().split('T')[0],
    end_date: ''
  });

  // Feedback states
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [confirm, setConfirm] = useState({ isOpen: false, id: null, number: '', action: null });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchHouses(), fetchResidents()]);
      setLoading(false);
    };
    loadData();
  }, []);

  const fetchHouses = async () => {
    try {
      const res = await api.get('/houses');
      setHouses(res.data);
    } catch (error) {
      console.error(error);
      showToast('Gagal memuat data rumah', 'error');
    }
  };

  const fetchResidents = async () => {
    try {
      const res = await api.get('/residents');
      setResidents(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const openDetailModal = async (house) => {
    setSelectedHouse(house);
    setShowDetailModal(true);
    setHouseDetail(null);
    setDetailLoading(true);
    try {
      const res = await api.get(`/houses/${house.id}`);
      setHouseDetail(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post(`/houses/${selectedHouse.id}/assign`, formData);
      showToast(`Rumah No. ${selectedHouse.house_number} berhasil dihuni`);
      setShowAssignModal(false);
      fetchHouses();
      setFormData({ resident_id: '', start_date: new Date().toISOString().split('T')[0], end_date: '' });
    } catch (error) {
      console.error(error);
      showToast('Gagal memproses penempatan rumah', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (house) => {
    setConfirm({
      isOpen: true,
      id: house.id,
      number: house.house_number,
      status: house.residents[0].status,
      action: 'checkout'
    });
  };

  const handleDeleteHouse = async (id, number) => {
    setConfirm({
      isOpen: true,
      id: id,
      number: number,
      action: 'delete'
    });
  };

  const executeAction = async () => {
    const { id, number, action } = confirm;
    setLoading(true);
    try {
      if (action === 'delete') {
        await api.delete(`/houses/${id}`);
        showToast(`Rumah No. ${number} berhasil dihapus`);
      } else if (action === 'checkout') {
        await api.post(`/houses/${id}/checkout`);
        showToast(`Penghuni rumah No. ${number} berhasil checkout`);
      }
      fetchHouses();
    } catch (error) {
      console.error(error);
      showToast(action === 'delete' ? 'Gagal menghapus rumah' : 'Gagal memproses checkout', 'error');
    } finally {
      setLoading(false);
      setConfirm({ ...confirm, isOpen: false });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const handleExport = () => {
    const headers = ['House Number', 'Status', 'Current Resident', 'Resident Status'];
    const exportData = houses.map(h => ({
      house_number: h.house_number,
      status: h.status,
      current_resident: h.residents?.[0]?.full_name || '-',
      resident_status: h.residents?.[0]?.status || '-'
    }));
    downloadCSV(exportData, 'Data_Rumah', headers);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Data Rumah</h1>
          <p className="text-text-muted mt-1 text-sm">Status hunian dan manajemen penyewa</p>
        </div>
        <button onClick={handleExport} className="btn-secondary w-full sm:w-auto flex items-center justify-center gap-2">
          <Download size={18} />
          <span className="hidden xs:inline">Ekspor Excel</span>
          <span className="xs:hidden">Ekspor</span>
        </button>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {loading ? (
          [...Array(10)].map((_, i) => (
            <div key={i} className="glass-card p-4 space-y-4">
              <div className="flex justify-between">
                <Skeleton className="w-10 h-10 rounded" />
                <Skeleton className="w-12 h-4" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-12 w-full rounded" />
              <div className="flex gap-1.5">
                <Skeleton className="h-8 flex-1" />
                <Skeleton className="h-8 flex-1" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
          ))
        ) : houses.length > 0 ? (
          houses.map((house) => (
            <div key={house.id} className="glass-card p-4 flex flex-col hover:border-primary/30 group">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded flex items-center justify-center transition-colors ${
                  house.status === 'dihuni' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  <Home size={20} />
                </div>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                  house.status === 'dihuni' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {house.status === 'dihuni' ? 'Terisi' : 'Kosong'}
                </span>
              </div>
              
              <div className="flex justify-between items-start mb-1">
                <h3 className="text-xl font-bold text-text-main">No. {house.house_number}</h3>
                <button 
                  onClick={() => handleDeleteHouse(house.id, house.house_number)}
                  className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  title="Hapus Unit"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-4">Tipe Standar</p>

              <div className="mt-auto space-y-3">
                {house.residents && house.residents.length > 0 ? (
                  <div className="p-2.5 rounded-lg bg-gray-50 border border-border space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[9px] text-text-muted uppercase font-bold tracking-tight">Penghuni Aktif</p>
                      <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        house.residents[0].status === 'tetap' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {house.residents[0].status === 'tetap' ? 'Tetap' : 'Kontrak'}
                      </span>
                    </div>
                    <p className="text-xs text-text-main font-bold truncate">{house.residents[0].full_name}</p>
                    
                    <div className="flex items-center gap-1.5 text-[9px] text-text-muted font-medium pt-1 border-t border-gray-100">
                      <Calendar size={10} />
                      <span>
                        {formatDate(house.residents[0].pivot.start_date)}
                        {house.residents[0].status === 'kontrak' && house.residents[0].pivot.end_date && ` - ${formatDate(house.residents[0].pivot.end_date)}`}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg border border-dashed border-border flex items-center justify-center bg-gray-50/50 h-[64px]">
                    <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Kosong</p>
                  </div>
                )}

                <div className="flex gap-1.5 pt-1">
                  {house.status === 'dihuni' ? (
                    <button 
                      onClick={() => handleCheckout(house)}
                      className={`flex-1 py-1.5 rounded text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-1 border ${
                        house.residents[0].status === 'kontrak' 
                        ? 'bg-orange-50 text-orange-600 border-orange-100 hover:bg-orange-600 hover:text-white' 
                        : 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-600 hover:text-white'
                      }`}
                    >
                      {house.residents[0].status === 'kontrak' ? (
                        <><LogOut size={12} /> Checkout</>
                      ) : (
                        <><History size={12} /> Pindah</>
                      )}
                    </button>
                  ) : (
                    <button 
                      onClick={() => { setSelectedHouse(house); setShowAssignModal(true); }}
                      className="flex-1 py-1.5 rounded bg-blue-600 text-white text-[10px] font-bold uppercase hover:bg-blue-700 transition-all shadow-sm flex items-center justify-center gap-1"
                    >
                      <UserPlus size={12} /> Huni
                    </button>
                  )}
                  <button 
                    onClick={() => openDetailModal(house)}
                    className="px-3 py-1.5 rounded bg-white text-text-main text-[10px] font-bold uppercase hover:bg-gray-50 transition-all border border-border"
                  >
                    Detail
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-text-muted italic border border-dashed rounded-lg bg-gray-50/50">
            Belum ada data rumah.
          </div>
        )}
      </div>

      {showAssignModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAssignModal(false)}></div>
          <form onSubmit={handleAssign} className="relative bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm space-y-4 animate-in zoom-in duration-200">
            <div className="border-b border-border pb-3">
              <h2 className="text-xl font-bold text-text-main">Pendaftaran Penghuni</h2>
              <p className="text-xs text-text-muted mt-0.5">Unit Rumah No. {selectedHouse?.house_number}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-text-muted mb-1.5 uppercase tracking-wider">Pilih Warga</label>
                <select 
                  required
                  className="input-field text-sm"
                  value={formData.resident_id}
                  onChange={(e) => setFormData({...formData, resident_id: e.target.value})}
                >
                  <option value="">-- Pilih Warga --</option>
                  {residents.map(r => (
                    <option key={r.id} value={r.id}>{r.full_name} ({r.status})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-text-muted mb-1.5 uppercase tracking-wider">Mulai Huni</label>
                  <input 
                    type="date" 
                    required
                    className="input-field text-sm"
                    value={formData.start_date}
                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                  />
                </div>
                {residents.find(r => r.id === parseInt(formData.resident_id))?.status === 'kontrak' && (
                  <div className="animate-in slide-in-from-top-2 duration-200">
                    <label className="block text-[11px] font-bold text-text-muted mb-1.5 uppercase tracking-wider">Sampai (Sewa Berakhir)</label>
                    <input 
                      type="date" 
                      required
                      className="input-field text-sm border-orange-200 focus:border-orange-500"
                      value={formData.end_date}
                      onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                    />
                    <p className="text-[9px] text-orange-600 mt-1 font-medium">*Wajib diisi untuk status Kontrak</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button 
                type="button" 
                onClick={() => setShowAssignModal(false)}
                className="flex-1 py-2.5 rounded-lg bg-gray-100 text-text-main font-bold text-sm hover:bg-gray-200 transition-colors border border-border"
              >
                Batal
              </button>
              <button 
                type="submit" 
                disabled={loading}
                className="btn-primary flex-1 justify-center text-sm"
              >
                {loading ? 'Proses...' : 'Konfirmasi'}
              </button>
            </div>
          </form>
        </div>
      )}

      {showDetailModal && selectedHouse && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDetailModal(false)}></div>
          <div className="relative bg-white rounded-xl shadow-2xl p-0 w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
            <div className="bg-primary p-6 text-white relative">
              <button onClick={() => setShowDetailModal(false)} className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-full transition-colors"><XCircle size={24} /></button>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30">
                  <Home size={32} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Unit No. {selectedHouse.house_number}</h2>
                  <p className="text-white/80 text-sm font-medium">Informasi Detail Aset Lingkungan</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {selectedHouse.residents && selectedHouse.residents.length > 0 ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-2xl bg-gray-100 border border-border overflow-hidden">
                      {selectedHouse.residents[0].photo_path ? (
                        <img src={`http://localhost:8000/storage/${selectedHouse.residents[0].photo_path}`} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300"><UserPlus size={32} /></div>
                      )}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-text-main">{selectedHouse.residents[0].full_name}</h4>
                      <span className={`inline-block text-[10px] font-bold uppercase px-2.5 py-1 rounded-full mt-1 ${
                        selectedHouse.residents[0].status === 'tetap' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        Status: {selectedHouse.residents[0].status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                    <DetailItem label="Mulai Menetap" value={formatDate(selectedHouse.residents[0].pivot.start_date)} />
                    {selectedHouse.residents[0].status === 'kontrak' && (
                      <DetailItem label="Rencana Selesai" value={formatDate(selectedHouse.residents[0].pivot.end_date) || '-'} />
                    )}
                    <DetailItem label="Kontak" value={selectedHouse.residents[0].phone_number || '-'} />
                    <DetailItem label="Pernikahan" value={selectedHouse.residents[0].is_married ? 'Menikah' : 'Single'} />
                  </div>

                  {/* Riwayat Hunian Sebelumnya */}
                  <div>
                    <h5 className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Clock size={12} /> Riwayat Hunian Sebelumnya
                    </h5>
                    {detailLoading ? (
                      <div className="space-y-2">
                        {[1,2].map(i => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}
                      </div>
                    ) : houseDetail && houseDetail.residents && houseDetail.residents.filter(r => !r.pivot.is_current).length > 0 ? (
                      <div className="space-y-2">
                        {houseDetail.residents.filter(r => !r.pivot.is_current).map((r, idx) => (
                          <div key={idx} className="flex items-start gap-3 p-2.5 rounded-lg bg-gray-50 border border-border">
                            <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                              {r.full_name?.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-text-main truncate">{r.full_name}</p>
                              <p className="text-[10px] text-text-muted">
                                {formatDate(r.pivot.start_date)} — {formatDate(r.pivot.end_date) || 'sekarang'}
                              </p>
                            </div>
                            <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded flex-shrink-0 ${
                              r.status === 'tetap' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                            }`}>{r.status}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-text-muted italic text-center py-3 bg-gray-50 rounded-lg border border-dashed border-border">
                        Belum ada riwayat penghuni sebelumnya
                      </p>
                    )}
                  </div>
                </div>

              ) : (
                <div className="py-10 text-center space-y-2">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
                    <Home size={32} />
                  </div>
                  <p className="text-sm font-bold text-text-muted uppercase tracking-widest">Rumah Kosong</p>
                  <p className="text-xs text-text-muted">Unit ini saat ini tidak memiliki penghuni aktif.</p>
                </div>
              )}
              
              <button onClick={() => setShowDetailModal(false)} className="w-full py-3 rounded-xl bg-gray-900 text-white font-bold text-sm hover:bg-black transition-colors shadow-lg">
                Tutup Detail
              </button>
            </div>
          </div>
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
        onConfirm={executeAction}
        title={confirm.action === 'delete' ? 'Hapus Unit Rumah' : (confirm.status === 'kontrak' ? 'Konfirmasi Checkout' : 'Konfirmasi Pindah')}
        message={confirm.action === 'delete' 
          ? `Apakah Anda yakin ingin menghapus rumah No. ${confirm.number}? Semua data riwayat terkait akan terpengaruh.` 
          : (confirm.status === 'kontrak' 
              ? `Apakah Anda yakin ingin melakukan Checkout untuk penghuni rumah No. ${confirm.number}? Status rumah akan kembali menjadi Kosong.`
              : `Apakah Anda yakin ingin mengosongkan rumah No. ${confirm.number} karena penghuni tetap telah pindah?`
            )
        }
        confirmText={confirm.action === 'delete' ? 'Ya, Hapus' : (confirm.status === 'kontrak' ? 'Ya, Checkout' : 'Ya, Kosongkan')}
        type={confirm.action === 'delete' ? 'danger' : 'warning'}
      />
    </div>
  );
};

const DetailItem = ({ label, value }) => (
  <div>
    <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-0.5">{label}</p>
    <p className="font-bold text-text-main text-sm">{value}</p>
  </div>
);

export default Houses;
