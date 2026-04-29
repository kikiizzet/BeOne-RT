import React, { useEffect, useState } from 'react';
import { 
  Users, Home, TrendingUp, Wallet, ArrowUpRight, ArrowDownRight, Loader2 
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Skeleton from '../components/Skeleton';

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  // ... (rest of the states)
  const [summary, setSummary] = useState({
    total_residents: 0,
    occupied_houses: 0,
    total_income: 0,
    total_expenses: 0,
    balance: 0,
    pending_payments: 0,
    recent_transactions: []
  });

  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      // Artificial delay to show skeletons (optional for demo, but good for UX testing)
      // await new Promise(resolve => setTimeout(resolve, 1000));
      await Promise.all([fetchSummary(), fetchChartData()]);
      setLoading(false);
    };
    loadData();
  }, []);

  const fetchSummary = async () => {
    try {
      const res = await api.get('/dashboard/summary');
      setSummary(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchChartData = async () => {
    try {
      const res = await api.get('/dashboard/charts');
      const allMonths = Array.from({ length: 12 }, (_, i) => i + 1);
      const formatted = allMonths.map(month => {
        const incomeItem = res.data.income.find(i => parseInt(i.month) === month);
        const expenseItem = res.data.expenses.find(e => parseInt(e.month) === month);
        return {
          name: `Bulan ${month}`,
          income: incomeItem ? parseFloat(incomeItem.total) : 0,
          expenses: expenseItem ? parseFloat(expenseItem.total) : 0
        };
      });
      setChartData(formatted);
    } catch (error) {
      console.error(error);
    }
  };

  const stats = [
    { label: 'Total Warga', value: summary.total_residents, icon: <Users size={20} />, color: 'bg-blue-100 text-blue-600', path: '/residents' },
    { label: 'Total Saldo', value: `Rp ${parseFloat(summary.balance || 0).toLocaleString('id-ID')}`, icon: <Wallet size={20} />, color: 'bg-purple-100 text-purple-600', path: '/payments' },
    { label: 'Pemasukan', value: `Rp ${parseFloat(summary.total_income || 0).toLocaleString('id-ID')}`, icon: <TrendingUp size={20} />, color: 'bg-green-100 text-green-600', path: '/payments' },
    { label: 'Pengeluaran', value: `Rp ${parseFloat(summary.total_expenses || 0).toLocaleString('id-ID')}`, icon: <TrendingUp size={20} className="rotate-180" />, color: 'bg-red-100 text-red-600', path: '/expenses' },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-text-main mb-1">Dashboard Utama</h1>
        <p className="text-text-muted">Ringkasan administrasi RT Elite Housing</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="glass-card p-4 flex items-center gap-4">
              <Skeleton className="w-12 h-12 rounded-lg" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-6 w-3/4" />
              </div>
            </div>
          ))
        ) : (
          stats.map((stat, i) => (
            <div 
              key={i} 
              onClick={() => navigate(stat.path)}
              className="glass-card p-4 flex items-center gap-4 cursor-pointer hover:border-primary group transition-all"
            >
              <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-xs text-text-muted font-medium">{stat.label}</p>
                <h3 className="text-xl font-bold text-text-main">{stat.value}</h3>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-text-main">Grafik Keuangan</h3>
            {loading ? <Skeleton className="h-4 w-32" /> : (
              <div className="flex gap-4 text-xs font-medium">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-text-muted">Pemasukan</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <span className="text-text-muted">Pengeluaran</span>
                </div>
              </div>
            )}
          </div>
          
          <div className="h-[300px] w-full">
            {loading ? (
              <Skeleton className="w-full h-full rounded-lg" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d6efd" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#0d6efd" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#dc3545" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#dc3545" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" vertical={false} />
                  <XAxis dataKey="name" stroke="#adb5bd" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#adb5bd" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `Rp${val/1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #dee2e6', borderRadius: '4px', fontSize: '12px' }}
                    formatter={(value, name) => [`Rp ${value.toLocaleString('id-ID')}`, name === 'income' ? 'Pemasukan' : 'Pengeluaran']}
                  />
                  <Area type="monotone" dataKey="income" stroke="#0d6efd" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={2} />
                  <Area type="monotone" dataKey="expenses" stroke="#dc3545" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="glass-card p-6 flex flex-col">
          <h3 className="text-lg font-bold text-text-main mb-4">Ringkasan Cepat</h3>
          <div className="space-y-4 flex-1">
            <div className="p-3 rounded-lg bg-gray-50 border border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded flex items-center justify-center ${summary.pending_payments > 0 ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                  <ArrowUpRight size={16} />
                </div>
                <div>
                  <p className="text-[10px] text-text-muted font-medium">Tagihan (Bulan Ini)</p>
                  <p className="text-xs text-text-main font-bold">
                    {summary.pending_payments > 0 ? `${summary.pending_payments} Tagihan Belum Lunas` : 'Semua Lunas'}
                  </p>
                </div>
              </div>
              <span className={`text-[10px] text-white px-1.5 py-0.5 rounded font-bold uppercase ${summary.pending_payments > 0 ? 'bg-orange-500' : 'bg-green-500'}`}>
                {summary.pending_payments > 0 ? 'PERHATIAN' : 'LANCAR'}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-gray-50 border border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-red-100 text-red-600 flex items-center justify-center">
                  <ArrowDownRight size={16} />
                </div>
                <div>
                  <p className="text-[10px] text-text-muted font-medium">Total Pengeluaran</p>
                  <p className="text-xs text-text-main font-bold">Rp {parseFloat(summary.total_expenses || 0).toLocaleString('id-ID')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card p-6">
        <h3 className="text-lg font-bold text-text-main mb-4">Transaksi Terakhir</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-bold uppercase text-text-muted border-b border-border">
                <th className="pb-3">Tanggal</th>
                <th className="pb-3">Deskripsi</th>
                <th className="pb-3 text-right">Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {summary.recent_transactions && summary.recent_transactions.length > 0 ? summary.recent_transactions.map((t, i) => (
                <tr key={i} className="hover:bg-gray-50/50">
                  <td className="py-3 text-text-muted">{new Date(t.date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}</td>
                  <td className="py-3 font-medium text-text-main">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${t.type === 'income' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      {t.description}
                    </div>
                  </td>
                  <td className={`py-3 text-right font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {t.type === 'income' ? '+' : '-'} Rp {parseFloat(t.amount).toLocaleString('id-ID')}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="3" className="py-4 text-center text-text-muted text-xs">Belum ada transaksi</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};


export default Dashboard;
