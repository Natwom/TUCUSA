import { useState } from 'react';
import api from '../api/axios';

export default function ElectionForm({ onSuccess, onCancel, initialData = null }) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [position, setPosition] = useState(initialData?.position || '');
  const [description, setDescription] = useState(initialData?.description || '');

  // Convert UTC ISO string from backend → datetime-local input format (YYYY-MM-DDTHH:mm)
  const toLocalInput = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    // Shift by timezone offset so toISOString() gives us local time
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  // Convert datetime-local input → UTC ISO string for backend
  const toUTCISO = (localString) => {
    if (!localString) return null;
    const d = new Date(localString);
    return d.toISOString(); // e.g. "2024-09-05T11:00:00.000Z"
  };

  const [startTime, setStartTime] = useState(toLocalInput(initialData?.start_time) || '');
  const [endTime, setEndTime] = useState(toLocalInput(initialData?.end_time) || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim() || !position.trim() || !startTime || !endTime) {
      setError('Please fill in all required fields.');
      return;
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    if (end <= start) {
      setError('End time must be after start time.');
      return;
    }

    const payload = {
      title: title.trim(),
      position: position.trim(),
      description: description.trim(),
      start_time: toUTCISO(startTime),
      end_time: toUTCISO(endTime),
    };

    setLoading(true);
    try {
      if (initialData?.id) {
        await api.put(`/elections/${initialData.id}`, payload);
      } else {
        await api.post('/elections/', payload);
      }
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save election. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h2 className="text-lg font-bold text-gray-900 mb-4">
        {initialData ? 'Edit Election' : 'Create New Election'}
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Student President Election 2024"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tucusa-500 focus:border-tucusa-500 outline-none transition-all"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Position *</label>
          <input
            type="text"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            placeholder="e.g. Student President"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tucusa-500 focus:border-tucusa-500 outline-none transition-all"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of the election..."
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tucusa-500 focus:border-tucusa-500 outline-none transition-all resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tucusa-500 focus:border-tucusa-500 outline-none transition-all"
              required
            />
            <p className="text-xs text-gray-400 mt-1">Your local time will be sent as UTC</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Time *</label>
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tucusa-500 focus:border-tucusa-500 outline-none transition-all"
              required
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-tucusa-600 hover:bg-tucusa-700 disabled:bg-gray-300 text-white font-semibold py-2.5 px-4 rounded-lg transition-all"
          >
            {loading ? 'Saving...' : initialData ? 'Update Election' : 'Create Election'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}