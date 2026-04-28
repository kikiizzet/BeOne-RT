import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Home, CreditCard, Receipt } from 'lucide-react';

const Sidebar = () => {
  const menuItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={18} />, path: '/' },
    { name: 'Data Warga', icon: <Users size={18} />, path: '/residents' },
    { name: 'Data Rumah', icon: <Home size={18} />, path: '/houses' },
    { name: 'Iuran Bulanan', icon: <CreditCard size={18} />, path: '/payments' },
    { name: 'Pengeluaran', icon: <Receipt size={18} />, path: '/expenses' },
  ];

  return (
    <div className="w-[260px] h-screen fixed left-0 top-0 bg-white border-r border-border z-50 flex flex-col">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-primary flex items-center justify-center text-white font-bold text-lg">
            B
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-main leading-none">Beon RT</h2>
            <p className="text-[10px] text-text-muted uppercase tracking-wider mt-1 font-semibold">Management</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-4 flex flex-col gap-1 overflow-y-auto">
        <p className="px-4 text-[11px] font-bold text-text-muted uppercase tracking-widest mb-2 mt-4">Menu Utama</p>
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => 
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            {item.icon}
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-border bg-gray-50">
        
          <p className="text-xs font-bold text-text-main">Developed By izzetnity</p>
          
        
      </div>
    </div>
  );
};

export default Sidebar;

