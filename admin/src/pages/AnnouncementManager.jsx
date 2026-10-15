import { useEffect, useState } from 'react';
import api from '../api/axios';
import AnnouncementForm from '../components/AnnouncementForm';
import { Plus, Trash2, Megaphone, X, Clock, AlertCircle, Loader2 } from 'lucide-react';

const formatDate = (value) =>
  new Date(value).toLocaleString('en-KE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export default function AnnouncementManager() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchAnnouncements = () => {
    setError('');
    return api
      .get('/announcements/')
      .then((res) => setAnnouncements(res.data))
      .catch(() => setError('Could not load announcements. Please try again.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this announcement? Students will no longer see it.')) return;
    setDeletingId(id);
    try {
      await api.delete(`/announcements/${id}`);
      await fetchAnnouncements();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete the announcement.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-blue-600" />
            Announcements
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Post updates that all students will see.
            {!loading && announcements.length > 0 && (
              <span className="ml-1 font-medium text-gray-700">
                {announcements.length} posted
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 text-sm font-medium px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> New Announcement
        </button>
      </div>

      {error && (
        <div className="mb-6 flex items-center justify-between gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3">
          <span className="flex items-center gap-2 text-sm font-medium">
            <AlertCircle className="w-4 h-4" /> {error}
          </span>
          <button onClick={fetchAnnouncements} className="text-sm font-semibold underline hover:no-underline">
            Try again
          </button>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-28 bg-white border border-gray-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Megaphone className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-600 font-medium">No announcements posted yet.</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" /> Post your first announcement
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((a) => (
            <div
              key={a.id}
              className="relative overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b from-blue-500 to-indigo-500" />
              <div className="flex items-start gap-4 p-5 pl-7">
                <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900">{a.title}</h3>
                  <p className="text-gray-600 text-sm mt-1.5 whitespace-pre-line break-words">{a.content}</p>
                  <p className="flex items-center gap-1.5 text-xs text-gray-400 mt-3">
                    <Clock className="w-3.5 h-3.5" /> {formatDate(a.created_at)}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(a.id)}
                  disabled={deletingId === a.id}
                  title="Delete announcement"
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-60 transition-colors"
                >
                  {deletingId === a.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowForm(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="font-bold text-lg text-gray-900">New Announcement</h2>
              <button
                onClick={() => setShowForm(false)}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6">
              <AnnouncementForm
                onSuccess={() => {
                  setShowForm(false);
                  fetchAnnouncements();
                }}
                onCancel={() => setShowForm(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}