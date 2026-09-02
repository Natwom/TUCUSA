import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AdminAuthContext = createContext(null);

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      api.get('/students/me')
        .then((res) => {
          if (res.data.role === 'admin') setAdmin(res.data);
          else localStorage.removeItem('admin_token');
        })
        .catch(() => localStorage.removeItem('admin_token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/admin-login', { email, password });
    localStorage.setItem('admin_token', res.data.access_token);
    const me = await api.get('/students/me');
    setAdmin(me.data);
    return me.data;
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    setAdmin(null);
  };

  return (
    <AdminAuthContext.Provider value={{ admin, login, logout, loading }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => useContext(AdminAuthContext);