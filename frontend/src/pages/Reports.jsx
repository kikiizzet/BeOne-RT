import React, { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, DollarSign, PieChart as PieIcon, 
  FileText, Calendar, Download, Printer, ChevronRight, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import api from '../api/axios';
import Skeleton from '../components/Skeleton';
import { downloadCSV } from '../utils/exportUtils';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    monthlyTrend: [],
    expenseDistribution: [],
    summary: {
      totalIncome: 0,
      totalExpense: 0,
      netBalance: 0,
      incomeGrowth: 0,
      expenseGrowth: 0
    },
    rawExpenses: [],
    rawPayments: []
  });

  const [filterYear, setFilterYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchData();
  }, [filterYear]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [expensesRes, paymentsRes] = await Promise.all([
        api.get('/expenses', { params: { year: filterYear } }),
        api.get('/payments', { params: { year: filterYear } })
      ]);

      const expenses = expensesRes.data.data;
      const payments = paymentsRes.data;

      // Process Monthly Trend
      const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 
        'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
      ];

      const trend = months.map((name, index) => {
        const monthIncome = payments
          .filter(p => p.month === index + 1 && p.status === 'paid')
          .reduce((sum, p) => sum + parseFloat(p.amount), 0);
        
        const monthExpense = expenses
          .filter(e => new Date(e.expense_date).getMonth() === index)
          .reduce((sum, e) => sum + parseFloat(e.amount), 0);

        return { name, income: monthIncome, expense: monthExpense };
      });

      // Process Expense Distribution
      const categoryMap = {};
      expenses.forEach(e => {
        categoryMap[e.category] = (categoryMap[e.category] || 0) + parseFloat(e.amount);
      });
      const distribution = Object.entries(categoryMap).map(([name, value]) => ({ 
        name: name.replace(/_/g, ' ').toUpperCase(), 
        value 
      }));

      // Summary
      const totalIncome = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + parseFloat(p.amount), 0);
      const totalExpense = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

      setData({
        monthlyTrend: trend,
        expenseDistribution: distribution,
        summary: {
          totalIncome,
          totalExpense,
          netBalance: totalIncome - totalExpense,
          incomeGrowth: 12.5, // Mockup growth
          expenseGrowth: -5.2  // Mockup growth
        },
        rawExpenses: expenses,
        rawPayments: payments
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const headers = ['Bulan', 'Pemasukan', 'Pengeluaran', 'Selisih'];
    const exportData = data.monthlyTrend.map(t => ({
      bulan: t.name,
      pemasukan: t.income,
      pengeluaran: t.expense,
      selisih: t.income - t.expense
    }));
    downloadCSV(exportData, `Rekapitulasi_Keuangan_${filterYear}`, headers);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-[400px] w-full rounded-xl" />
          <Skeleton className="h-[400px] w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 print:p-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 print:hidden">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-text-main">Rekapitulasi Keuangan</h1>
          <p className="text-text-muted mt-1 text-xs md:text-sm">Laporan pemasukan dan pengeluaran lingkungan</p>
        </div>
        <div className="grid grid-cols-2 sm:flex sm:flex-nowrap items-center gap-3 w-full md:w-auto">
          <select 
            value={filterYear}
            onChange={(e) => setFilterYear(parseInt(e.target.value))}
            className="col-span-2 sm:col-span-1 bg-white border border-border rounded-lg px-4 py-2 text-sm font-bold outline-none focus:border-primary shadow-sm"
          >
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={handlePrint} className="col-span-1 btn-secondary flex items-center justify-center gap-2">
            <Printer size={18} />
            <span className="hidden xs:inline">Cetak</span>
          </button>
          <button onClick={handleExport} className="col-span-1 btn-primary flex items-center justify-center gap-2">
            <Download size={18} />
            <span className="hidden xs:inline">Ekspor</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Total Pemasukan" 
          value={data.summary.totalIncome} 
          icon={<TrendingUp className="text-green-600" />}
          trend={data.summary.incomeGrowth}
          color="green"
        />
        <StatCard 
          title="Total Pengeluaran" 
          value={data.summary.totalExpense} 
          icon={<TrendingDown className="text-red-600" />}
          trend={data.summary.expenseGrowth}
          color="red"
        />
        <StatCard 
          title="Saldo Akhir Kas" 
          value={data.summary.netBalance} 
          icon={<DollarSign className="text-blue-600" />}
          color="blue"
          isTotal
        />
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Chart */}
        <div className="glass-card p-6 flex flex-col h-[450px]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-text-main flex items-center gap-2">
              <FileText size={18} className="text-primary" />
              Tren Bulanan {filterYear}
            </h3>
            <div className="flex gap-4 text-[10px] font-bold uppercase tracking-wider">
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-primary" /> Pemasukan</div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-red-400" /> Pengeluaran</div>
            </div>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.monthlyTrend}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 600, fill: '#64748b'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 600, fill: '#64748b'}} tickFormatter={(v) => `Rp ${v/1000000}jt`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value) => `Rp ${value.toLocaleString('id-ID')}`}
                />
                <Area type="monotone" dataKey="income" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                <Area type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribution Chart */}
        <div className="glass-card p-6 flex flex-col h-[450px]">
          <h3 className="font-bold text-text-main mb-6 flex items-center gap-2">
            <PieIcon size={18} className="text-orange-500" />
            Alokasi Pengeluaran
          </h3>
          <div className="flex-1 flex flex-col md:flex-row items-center gap-6">
            <div className="flex-1 w-full h-full min-h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.expenseDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data.expenseDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `Rp ${value.toLocaleString('id-ID')}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full md:w-48 space-y-3">
              {data.expenseDistribution.map((entry, index) => (
                <div key={index} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="text-text-muted truncate max-w-[80px]">{entry.name}</span>
                    </div>
                    <span>{Math.round((entry.value / data.summary.totalExpense) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500" 
                      style={{ 
                        width: `${(entry.value / data.summary.totalExpense) * 100}%`,
                        backgroundColor: COLORS[index % COLORS.length] 
                      }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h3 className="font-bold text-text-main">Detail Rekapitulasi Bulanan</h3>
          <span className="text-[10px] font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
            Tahun {filterYear}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-border">
                <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider">Bulan</th>
                <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider text-right">Pemasukan</th>
                <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider text-right">Pengeluaran</th>
                <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider text-right">Selisih (Net)</th>
                <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.monthlyTrend.map((month, idx) => {
                const diff = month.income - month.expense;
                return (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-text-main text-sm">{month.name}</td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-green-600">Rp {month.income.toLocaleString('id-ID')}</td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-red-600">Rp {month.expense.toLocaleString('id-ID')}</td>
                    <td className={`px-6 py-4 text-right text-sm font-bold ${diff >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                      Rp {diff.toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                        diff >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {diff >= 0 ? 'Surplus' : 'Defisit'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, trend, color, isTotal }) => {
  const colors = {
    green: 'border-green-100 bg-green-50/30',
    red: 'border-red-100 bg-red-50/30',
    blue: 'border-blue-100 bg-blue-50/30',
  };

  return (
    <div className={`glass-card p-4 md:p-5 border ${colors[color]}`}>
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center border border-border">
          {icon}
        </div>
        {!isTotal && trend && (
          <div className={`flex items-center gap-1 text-[10px] font-bold ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-[10px] md:text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1">{title}</p>
      <h4 className={`text-xl md:text-2xl font-bold ${isTotal ? 'text-text-main' : `text-${color}-600`} break-words`}>
        Rp {value.toLocaleString('id-ID')}
      </h4>
    </div>
  );
};

export default Reports;
