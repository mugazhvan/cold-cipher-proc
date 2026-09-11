import React from 'react';
import { useKisanFlow } from '../../context/KisanFlowContext';
import {
  LayoutDashboard,
  MapPin,
  CalendarCheck,
  ListTodo,
  Activity,
  CheckCircle2,
  Wallet,
  ShieldCheck,
  FileText,
  Bell,
  User,
  Settings,
  LogOut
} from 'lucide-react';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface SidebarGroup {
  groupName: string;
  items: SidebarItem[];
}

interface FarmerSidebarProps {
  activeItem: string;
  setActiveItem: (id: string) => void;
}

export const FarmerSidebar: React.FC<FarmerSidebarProps> = ({ activeItem, setActiveItem }) => {
  const { logout } = useKisanFlow();

  const menuGroups: SidebarGroup[] = [
    {
      groupName: '',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> }
      ]
    },
    {
      groupName: 'Plan & Book',
      items: [
        { id: 'find-centre', label: 'Find Centre', icon: <MapPin className="w-5 h-5" /> },
        { id: 'recommended-slots', label: 'Recommended Slots', icon: <CalendarCheck className="w-5 h-5" /> },
        { id: 'my-bookings', label: 'My Bookings', icon: <ListTodo className="w-5 h-5" /> }
      ]
    },
    {
      groupName: 'My Journey',
      items: [
        { id: 'live-queue', label: 'Live Queue', icon: <Activity className="w-5 h-5" /> },
        { id: 'procurement-status', label: 'Procurement Status', icon: <CheckCircle2 className="w-5 h-5" /> },
        { id: 'payment-status', label: 'Payment Status', icon: <Wallet className="w-5 h-5" /> }
      ]
    },
    {
      groupName: 'Documents',
      items: [
        { id: 'e-pass', label: 'E-Pass', icon: <ShieldCheck className="w-5 h-5" /> },
        { id: 'receipts', label: 'Receipts', icon: <FileText className="w-5 h-5" /> }
      ]
    }
  ];

  return (
    <div className="w-64 bg-white border-r border-slate-200 h-[calc(100vh-100px)] sticky top-24 overflow-y-auto flex flex-col shadow-xs rounded-2xl mr-6 hidden lg:flex shrink-0">
      <div className="flex-1 py-6 px-4 space-y-6">
        {menuGroups.map((group, idx) => (
          <div key={idx}>
            {group.groupName && (
              <h3 className="px-3 text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                {group.groupName}
              </h3>
            )}
            <ul className="space-y-1">
              {group.items.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveItem(item.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
                      activeItem === item.id
                        ? 'bg-emerald-50 text-emerald-700 shadow-xs'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <span className={activeItem === item.id ? 'text-emerald-600' : 'text-slate-400'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-slate-200 space-y-1 bg-slate-50">
        <button
          onClick={() => setActiveItem('notifications')}
          className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-bold transition-all ${
            activeItem === 'notifications'
              ? 'bg-emerald-50 text-emerald-700'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Bell className="w-4 h-4 text-slate-400" />
          <span>Notifications</span>
        </button>
        <button
          onClick={() => setActiveItem('profile')}
          className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-bold transition-all ${
            activeItem === 'profile'
              ? 'bg-emerald-50 text-emerald-700'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <User className="w-4 h-4 text-slate-400" />
          <span>Profile</span>
        </button>
        <button
          onClick={() => setActiveItem('settings')}
          className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-bold transition-all ${
            activeItem === 'settings'
              ? 'bg-emerald-50 text-emerald-700'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Settings className="w-4 h-4 text-slate-400" />
          <span>Settings</span>
        </button>
        <button
          onClick={logout}
          className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-bold text-red-600 hover:bg-red-50 transition-all mt-2"
        >
          <LogOut className="w-4 h-4 text-red-500" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};
