import { useState } from 'react';
import api from '../api/axios';

export default function CandidateForm({ electionId, onSuccess, onCancel }) {
  const [form, setForm] = useState({ name: '', manifesto: '' });
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append('election_id', electionId);
    formData.append('name', form.name);
    formData.append('manifesto', form.manifesto);
    if (photo) {
      formData.append('photo', photo);
    }

    try {
      await api.post('/candidates/', formData);
      setForm({ name: '', manifesto: '' });
      setPhoto(null);
      setPreview(null);
      onSuccess();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to add candidate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <h3 className="font-bold text-lg">Add Candidate</h3>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
        <input
          name="name"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="input"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Photo</label>
        <input
          type="file"
          accept="image/jpeg,image/png,image/jpg,image/webp"
          onChange={handleFileChange}
          className="input"
        />
        {preview && (
          <img src={preview} alt="Preview" className="mt-2 h-24 w-24 object-cover rounded-lg border" />
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Manifesto</label>
        <textarea
          name="manifesto"
          rows="3"
          value={form.manifesto}
          onChange={(e) => setForm({ ...form, manifesto: e.target.value })}
          className="input"
        />
      </div>
      <div className="flex gap-3">
        <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
          {loading ? 'Adding...' : 'Add Candidate'}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
}