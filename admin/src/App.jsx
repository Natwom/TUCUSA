import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import VoterManagement from './pages/VoterManagement';
import ElectionManagement from './pages/ElectionManagement';
import ResultsView from './pages/ResultsView';
import AnnouncementManager from './pages/AnnouncementManager';
import AdminNavbar from './components/AdminNavbar';

const ProtectedRoute = ({ children }) => {
  const { admin, loading } = useAdminAuth();
  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  if (!admin) return <Navigate to="/login" />;
  return (
    <div className="flex h-screen">
      <AdminNavbar />
      <div className="flex-1 overflow-auto ml-64">
        {children}
      </div>
    </div>
  );
};

function App() {
  return (
    <AdminAuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<AdminLogin />} />
          <Route path="/" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="/voters" element={<ProtectedRoute><VoterManagement /></ProtectedRoute>} />
          <Route path="/elections" element={<ProtectedRoute><ElectionManagement /></ProtectedRoute>} />
          <Route path="/results" element={<ProtectedRoute><ResultsView /></ProtectedRoute>} />
          <Route path="/announcements" element={<ProtectedRoute><AnnouncementManager /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AdminAuthProvider>
  );
}

export default App;