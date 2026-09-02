import { useEffect, useState } from 'react';
import api from '../api/axios';
import AnnouncementForm from '../components/AnnouncementForm';
import { Plus, Trash2, Megaphone } from 'lucide-react';

export default function AnnouncementManager() {
  const [announcements, setAnnouncements] = useState([]);
  const [showForm, setShowForm] = useState(false);

  const fetchAnnouncements = () => {
    api.get('/announcements/').then((res) => setAnnouncements(res.data));
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this announcement?')) return;
    await api.delete(`/announcements/${id}`);
    fetchAnnouncements();
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Megaphone className="w-6 h-6 text-tucusa-600" />
          Announcements
        </h1>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Announcement
        </button>
      </div>

      {showForm && (
        <div className="mb-6">
          <AnnouncementForm onSuccess={() => { setShowForm(false); fetchAnnouncements(); }} onCancel={() => setShowForm(false)} />
        </div>
      )}

      <div className="space-y-4">
        {announcements.map((a) => (
          <div key={a.id} className="card flex items-start justify-between">
            <div>
              <h3 className="font-bold text-gray-900">{a.title}</h3>
              <p className="text-gray-600 text-sm mt-1">{a.content}</p>
              <p className="text-xs text-gray-400 mt-2">{new Date(a.created_at).toLocaleString()}</p>
            </div>
            <button onClick={() => handleDelete(a.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}

        {announcements.length === 0 && (
          <div className="card text-center py-12 text-gray-500">No announcements posted yet.</div>
        )}
      </div>
    </div>
  );
}