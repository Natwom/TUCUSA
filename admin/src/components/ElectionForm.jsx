import { useState } from 'react';
import api from '../api/axios';

export default function ElectionForm({ onSuccess, onCancel }) {
  const [form, setForm] = useState({
    title: '',
    position: '',
    description: '',
    start_time: '',
    end_time: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/elections/', {
        ...form,
        start_time: new Date(form.start_time).toISOString(),
        end_time: new Date(form.end_time).toISOString(),
      });
      onSuccess();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create election');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <h3 className="font-bold text-lg">Create New Election</h3>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <input name="title" required value={form.title} onChange={handleChange} className="input" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
        <input name="position" required value={form.position} onChange={handleChange} className="input" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea name="description" rows="3" value={form.description} onChange={handleChange} className="input" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
          <input type="datetime-local" name="start_time" required value={form.start_time} onChange={handleChange} className="input" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
          <input type="datetime-local" name="end_time" required value={form.end_time} onChange={handleChange} className="input" />
        </div>
      </div>
      <div className="flex gap-3">
        <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
          {loading ? 'Creating...' : 'Create Election'}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
      </div>
    </form>
  );
}