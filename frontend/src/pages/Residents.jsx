import React, { useEffect, useState } from 'react';
import { Plus, Search, MoreVertical, Edit2, Trash2, Phone, UserCheck } from 'lucide-react';
import api from '../api/axios';

const Residents = () => {
  const [residents, setResidents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    status: 'tetap',
    phone_number: '',
    is_married: false,
    photo: null,
    ktp_image: null
  });

  useEffect(() => {
    fetchResidents();
  }, []);

  const fetchResidents = async () => {
    try {
      const res = await api.get('/residents');
      setResidents(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleEdit = (resident) => {
    setFormData({
      full_name: resident.full_name,
      status: resident.status,
      phone_number: resident.phone_number,
      is_married: resident.is_married,
      photo: null,
      ktp_image: null
    });
    setSelectedId(resident.id);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const data = new FormData();
    data.append('full_name', formData.full_name);
    data.append('status', formData.status);
    data.append('phone_number', formData.phone_number);
    data.append('is_married', formData.is_married ? '1' : '0');
    
    if (formData.photo) data.append('photo', formData.photo);
    if (formData.ktp_image) data.append('ktp_image', formData.ktp_image);

    try {
      if (isEditing) {
        // Laravel workaround for multipart/form-data with PUT
        data.append('_method', 'PUT');
        await api.post(`/residents/${selectedId}`, data);
      } else {
        await api.post('/residents', data);
      }
      
      setShowModal(false);
      setIsEditing(false);
      setSelectedId(null);
      fetchResidents();
      setFormData({ full_name: '', status: 'tetap', phone_number: '', is_married: false, photo: null, ktp_image: null });
      alert('Data berhasil disimpan!');
    } catch (error) {
      console.error(error);
      alert('Gagal menyimpan data. Pastikan file tidak terlalu besar dan format sesuai.');
    } finally {
      setLoading(false);
    }
  };

  const deleteResident = async (id) => {
    if (window.confirm('Yakin ingin menghapus data ini?')) {
      try {
        await api.delete(`/residents/${id}`);
        fetchResidents();
      } catch (error) {
        console.error(error);
      }
    }
  };

  const STORAGE_URL = 'http://localhost:8000/storage';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Data Warga</h1>
          <p className="text-text-muted mt-1 text-sm">Kelola informasi penghuni perumahan</p>
        </div>
        <button 
          onClick={() => {
            setIsEditing(false);
            setFormData({ full_name: '', status: 'tetap', phone_number: '', is_married: false, photo: null, ktp_image: null });
            setShowModal(true);
          }}
          className="btn-primary"
        >
          <Plus size={18} />
          Tambah Warga
        </button>
      </div>

      <div className="flex items-center gap-4 glass-card p-3">
        <Search className="text-text-muted ml-2" size={18} />
        <input 
          type="text" 
          placeholder="Cari nama warga..." 
          className="bg-transparent border-none outline-none text-text-main w-full placeholder:text-text-muted text-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {residents.map((resident) => (
          <div key={resident.id} className="glass-card p-4 flex flex-col">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {resident.photo_path ? (
                  <img 
                    src={`${STORAGE_URL}/${resident.photo_path}`} 
                    alt="Profile" 
                    className="w-12 h-12 rounded-full object-cover border border-border"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg border border-blue-200">
                    {resident.full_name.charAt(0)}
                  </div>
                )}
                <div>
                  <h3 className="text-base font-bold text-text-main leading-tight">{resident.full_name}</h3>
                  <span className={`inline-block mt-1 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                    resident.status === 'tetap' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {resident.status}
                  </span>
                </div>
              </div>
              <button className="text-text-muted hover:text-text-main">
                <MoreVertical size={18} />
              </button>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <Phone size={14} />
                <span>{resident.phone_number}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <UserCheck size={14} />
                <span>{resident.is_married ? 'Menikah' : 'Belum Menikah'}</span>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-[10px] font-bold text-text-muted uppercase mb-1.5">Foto KTP</label>
              {resident.ktp_image_path ? (
                <div className="relative group rounded-md overflow-hidden h-32 bg-gray-100 border border-border">
                  <img 
                    src={`${STORAGE_URL}/${resident.ktp_image_path}`} 
                    alt="KTP" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <a href={`${STORAGE_URL}/${resident.ktp_image_path}`} target="_blank" rel="noreferrer" className="text-white text-[10px] font-bold bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/30">
                      Lihat Full
                    </a>
                  </div>
                </div>
              ) : (
                <div className="rounded-md border border-dashed border-border h-32 flex flex-col items-center justify-center bg-gray-50">
                  <span className="text-[10px] text-text-muted italic">Tidak ada foto KTP</span>
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-auto">
              <button 
                onClick={() => handleEdit(resident)}
                className="flex-1 py-1.5 rounded bg-gray-100 text-text-main text-xs font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 border border-border"
              >
                <Edit2 size={12} /> Edit
              </button>
              <button 
                onClick={() => deleteResident(resident.id)}
                className="flex-1 py-1.5 rounded bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 transition-colors flex items-center justify-center gap-2 border border-red-100"
              >
                <Trash2 size={12} /> Hapus
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)}></div>
          <form onSubmit={handleSubmit} className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-md space-y-4 animate-in zoom-in duration-200">
            <div className="border-b border-border pb-3">
              <h2 className="text-xl font-bold text-text-main">{isEditing ? 'Edit Warga' : 'Tambah Warga'}</h2>
            </div>
            
            <div className="space-y-3">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-[11px] font-bold text-text-muted mb-1 uppercase tracking-wider">Nama Lengkap</label>
                  <input 
                    type="text" 
                    required
                    className="input-field text-sm"
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  />
                </div>
                <div className="w-24">
                  <label className="block text-[11px] font-bold text-text-muted mb-1 uppercase tracking-wider">Foto Profil</label>
                  <div className="relative h-12 w-12 rounded-full border-2 border-dashed border-border flex items-center justify-center hover:bg-gray-50 transition-all cursor-pointer group overflow-hidden">
                    <input 
                      type="file" 
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      onChange={(e) => setFormData({...formData, photo: e.target.files[0]})}
                    />
                    {formData.photo ? (
                      <img src={URL.createObjectURL(formData.photo)} className="w-full h-full object-cover" />
                    ) : (
                      <Plus className="text-text-muted" size={14} />
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-text-muted mb-1 uppercase tracking-wider">Status</label>
                  <select 
                    className="input-field text-sm"
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="tetap">Warga Tetap</option>
                    <option value="kontrak">Kontrak</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-text-muted mb-1 uppercase tracking-wider">WhatsApp</label>
                  <input 
                    type="text" 
                    required
                    className="input-field text-sm"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 py-1">
                <input 
                  type="checkbox" 
                  id="married"
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                  checked={formData.is_married}
                  onChange={(e) => setFormData({...formData, is_married: e.target.checked})}
                />
                <label htmlFor="married" className="text-sm text-text-main font-medium cursor-pointer">Sudah Menikah</label>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-text-muted mb-1 uppercase tracking-wider">Upload KTP</label>
                <div className="relative h-20 rounded border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 hover:bg-gray-50 transition-all cursor-pointer group">
                  <input 
                    type="file" 
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={(e) => setFormData({...formData, ktp_image: e.target.files[0]})}
                  />
                  <Plus className="text-text-muted" size={16} />
                  <span className="text-[10px] text-text-muted font-medium">{formData.ktp_image ? formData.ktp_image.name : 'Pilih Gambar KTP'}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                type="button" 
                onClick={() => setShowModal(false)}
                className="flex-1 py-2 rounded bg-gray-100 text-text-main font-bold text-sm hover:bg-gray-200 transition-all border border-border"
              >
                Batal
              </button>
              <button 
                type="submit" 
                disabled={loading}
                className="btn-primary flex-1 justify-center text-sm"
              >
                {loading ? 'Menyimpan...' : (isEditing ? 'Update Data' : 'Simpan Data')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};


export default Residents;
