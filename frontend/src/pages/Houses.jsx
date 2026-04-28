import React, { useEffect, useState } from 'react';
import { Home, UserPlus, History, CheckCircle2, XCircle, Trash2 } from 'lucide-react';
import api from '../api/axios';

const Houses = () => {
  const [houses, setHouses] = useState([]);
  const [residents, setResidents] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedHouse, setSelectedHouse] = useState(null);
  const [formData, setFormData] = useState({ resident_id: '', start_date: '' });

  useEffect(() => {
    fetchHouses();
    fetchResidents();
  }, []);

  const fetchHouses = async () => {
    try {
      const res = await api.get('/houses');
      setHouses(res.data);
    } catch (error) {
      console.error(error);
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

  const handleAssign = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/houses/${selectedHouse.id}/assign`, formData);
      setShowAssignModal(false);
      fetchHouses();
      setFormData({ resident_id: '', start_date: '' });
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteHouse = async (id, number) => {
    if (!window.confirm(`Hapus rumah No. ${number}? Data tidak dapat dikembalikan.`)) return;
    try {
      await api.delete(`/houses/${id}`);
      fetchHouses();
    } catch (error) {
      console.error(error);
      alert('Gagal menghapus rumah. Pastikan tidak ada transaksi atau riwayat yang terkait.');
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-text-main">Data Rumah</h1>
        <p className="text-text-muted mt-1 text-sm">Status hunian dan riwayat penghuni</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {houses.map((house) => (
          <div key={house.id} className="glass-card p-4 flex flex-col hover:border-primary/30">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded flex items-center justify-center ${
                house.status === 'dihuni' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
              }`}>
                <Home size={20} />
              </div>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                house.status === 'dihuni' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
              }`}>
                {house.status === 'dihuni' ? 'Terisi' : 'Kosong'}
              </span>
            </div>
            
            <h3 className="text-xl font-bold text-text-main mb-1">No. {house.house_number}</h3>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-4">Tipe Standar</p>

            <div className="mt-auto space-y-3">
              {house.residents && house.residents.length > 0 ? (
                <div className="p-2 rounded bg-gray-50 border border-border">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-[9px] text-text-muted uppercase font-bold">Penghuni</p>
                    <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${
                      house.residents[0].status === 'tetap' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {house.residents[0].status === 'tetap' ? 'Tetap' : 'Kontrak'}
                    </span>
                  </div>
                  <p className="text-xs text-text-main font-bold truncate">{house.residents[0].full_name}</p>
                </div>
              ) : (
                <div className="p-2 rounded border border-dashed border-border flex items-center justify-center bg-gray-50 h-[42px]">
                  <p className="text-[10px] text-text-muted font-bold">Belum Ada</p>
                </div>
              )}

              <div className="flex gap-1.5">
                <button 
                  onClick={() => { setSelectedHouse(house); setShowAssignModal(true); }}
                  className="flex-1 py-1.5 rounded bg-blue-50 text-blue-600 text-[10px] font-bold uppercase hover:bg-blue-100 transition-all border border-blue-100"
                >
                  Huni
                </button>
                <button 
                  onClick={() => { setSelectedHouse(house); setShowDetailModal(true); }}
                  className="flex-1 py-1.5 rounded bg-purple-50 text-purple-600 text-[10px] font-bold uppercase hover:bg-purple-100 transition-all border border-purple-100"
                >
                  Detail
                </button>
                <button 
                  onClick={() => handleDeleteHouse(house.id, house.house_number)}
                  className="px-2 py-1.5 rounded bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700 transition-colors border border-red-100"
                  title="Hapus Rumah"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showAssignModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAssignModal(false)}></div>
          <form onSubmit={handleAssign} className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-sm space-y-4 animate-in zoom-in duration-200">
            <div className="border-b border-border pb-3">
              <h2 className="text-lg font-bold text-text-main">Set Penghuni Rumah</h2>
              <p className="text-xs text-text-muted mt-0.5">Rumah No. {selectedHouse?.house_number}</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-text-muted mb-1 uppercase tracking-wider">Pilih Warga</label>
                <select 
                  required
                  className="input-field text-sm"
                  value={formData.resident_id}
                  onChange={(e) => setFormData({...formData, resident_id: e.target.value})}
                >
                  <option value="">-- Pilih Warga --</option>
                  {residents.map(r => (
                    <option key={r.id} value={r.id}>{r.full_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-text-muted mb-1 uppercase tracking-wider">Tanggal Mulai</label>
                <input 
                  type="date" 
                  required
                  className="input-field text-sm"
                  value={formData.start_date}
                  onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button 
                type="button" 
                onClick={() => setShowAssignModal(false)}
                className="flex-1 py-2 rounded bg-gray-100 text-text-main font-bold text-xs hover:bg-gray-200 border border-border"
              >
                Batal
              </button>
              <button 
                type="submit" 
                className="btn-primary flex-1 justify-center text-xs"
              >
                Simpan
              </button>
            </div>
          </form>
        </div>
      )}

      {showDetailModal && selectedHouse && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDetailModal(false)}></div>
          <div className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-md space-y-4 animate-in zoom-in duration-200">
            <div className="border-b border-border pb-3 flex justify-between items-start">
              <div>
                <h2 className="text-lg font-bold text-text-main">Detail Rumah No. {selectedHouse.house_number}</h2>
                <span className={`inline-block mt-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                  selectedHouse.status === 'dihuni' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {selectedHouse.status === 'dihuni' ? 'Terisi' : 'Kosong'}
                </span>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="p-1 rounded hover:bg-gray-100"><XCircle size={20} className="text-gray-400" /></button>
            </div>
            
            {selectedHouse.residents && selectedHouse.residents.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center bg-gray-100 rounded-lg h-32 overflow-hidden border border-border">
                  {selectedHouse.residents[0].photo_path ? (
                    <img src={`http://localhost:8000/storage/${selectedHouse.residents[0].photo_path}`} alt="KTP" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs text-text-muted italic">Tidak ada foto KTP</span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-[10px] font-bold text-text-muted uppercase">Nama Lengkap</p>
                    <p className="font-semibold text-text-main">{selectedHouse.residents[0].full_name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-text-muted uppercase">Status Warga</p>
                    <span className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded mt-0.5 ${
                      selectedHouse.residents[0].status === 'tetap' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {selectedHouse.residents[0].status === 'tetap' ? 'Tetap' : 'Kontrak'}
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-text-muted uppercase">No HP</p>
                    <p className="font-semibold text-text-main">{selectedHouse.residents[0].phone}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-text-muted uppercase">Status Pernikahan</p>
                    <p className="font-semibold text-text-main">{selectedHouse.residents[0].is_married ? 'Menikah' : 'Belum Menikah'}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-text-muted">
                <p className="text-sm font-medium">Rumah ini belum dihuni</p>
              </div>
            )}
            <div className="pt-2">
              <button onClick={() => setShowDetailModal(false)} className="w-full py-2 rounded bg-gray-100 text-text-main font-bold text-xs border border-border hover:bg-gray-200 transition-colors">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


export default Houses;
