import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Vote, User, LogOut, Home } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/dashboard" className="flex items-center gap-2">
            <Vote className="w-7 h-7 text-tucusa-600" />
            <span className="font-bold text-xl text-tucusa-900">TUCUSA VOTE</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 hidden sm:block">Hi, {user?.full_name}</span>
            <Link to="/dashboard" className="p-2 hover:bg-gray-100 rounded-lg">
              <Home className="w-5 h-5 text-gray-600" />
            </Link>
            <Link to="/profile" className="p-2 hover:bg-gray-100 rounded-lg">
              <User className="w-5 h-5 text-gray-600" />
            </Link>
            <button onClick={handleLogout} className="p-2 hover:bg-red-50 rounded-lg">
              <LogOut className="w-5 h-5 text-red-500" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}