import { useState } from 'react';
import api from '../api/axios';

export default function AnnouncementForm({ onSuccess, onCancel }) {
  const [form, setForm] = useState({ title: '', content: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/announcements/', form);
      onSuccess();
    } catch (err) {
      alert('Failed to post announcement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <h3 className="font-bold text-lg">New Announcement</h3>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
        <textarea rows="4" required value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="input" />
      </div>
      <div className="flex gap-3">
        <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
          {loading ? 'Posting...' : 'Post Announcement'}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
      </div>
    </form>
  );
}