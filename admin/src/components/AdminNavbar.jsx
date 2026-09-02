import { Link, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import {
  LayoutDashboard,
  Users,
  Vote,
  BarChart3,
  Megaphone,
  LogOut,
  Shield,
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/voters', label: 'Voters', icon: Users },
  { path: '/elections', label: 'Elections', icon: Vote },
  { path: '/results', label: 'Results', icon: BarChart3 },
  { path: '/announcements', label: 'Announcements', icon: Megaphone },
];

export default function AdminNavbar() {
  const { admin, logout } = useAdminAuth();
  const location = useLocation();

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Shield className="w-7 h-7 text-tucusa-600" />
          <div>
            <h1 className="font-bold text-lg text-tucusa-900">TUCUSA</h1>
            <p className="text-xs text-gray-500">Admin Panel</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-tucusa-50 text-tucusa-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="mb-3 px-4">
          <p className="text-sm font-medium text-gray-900">{admin?.full_name}</p>
          <p className="text-xs text-gray-500">{admin?.email}</p>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-2 w-full text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </div>
  );
}