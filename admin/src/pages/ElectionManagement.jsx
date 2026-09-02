import { useEffect, useState } from 'react';
import api from '../api/axios';
import ElectionForm from '../components/ElectionForm';
import CandidateForm from '../components/CandidateForm';
import { Plus, Play, Square, Trash2, Users } from 'lucide-react';

export default function ElectionManagement() {
  const [elections, setElections] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedElection, setSelectedElection] = useState(null);
  const [showCandidateForm, setShowCandidateForm] = useState(false);

  const fetchElections = () => {
    api.get('/elections/').then((res) => setElections(res.data));
  };

  useEffect(() => {
    fetchElections();
  }, []);

  const handleStart = async (id) => {
    await api.post(`/elections/${id}/start`);
    fetchElections();
  };

  const handleStop = async (id) => {
    await api.post(`/elections/${id}/stop`);
    fetchElections();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this election?')) return;
    await api.delete(`/elections/${id}`);
    fetchElections();
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Election Management</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Election
        </button>
      </div>

      {showForm && (
        <div className="mb-6">
          <ElectionForm onSuccess={() => { setShowForm(false); fetchElections(); }} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {showCandidateForm && selectedElection && (
        <div className="mb-6">
          <CandidateForm
            electionId={selectedElection.id}
            onSuccess={() => { setShowCandidateForm(false); fetchElections(); }}
            onCancel={() => setShowCandidateForm(false)}
          />
        </div>
      )}

      <div className="space-y-4">
        {elections.map((e) => (
          <div key={e.id} className="card">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold text-lg">{e.title}</h3>
                <p className="text-tucusa-600">{e.position}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {new Date(e.start_time).toLocaleString()} → {new Date(e.end_time).toLocaleString()}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                e.status === 'active' ? 'bg-green-100 text-green-700' :
                e.status === 'closed' ? 'bg-gray-100 text-gray-600' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {e.status.toUpperCase()}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {e.status === 'upcoming' && (
                <button onClick={() => handleStart(e.id)} className="btn-success text-sm flex items-center gap-1">
                  <Play className="w-3 h-3" /> Start
                </button>
              )}
              {e.status === 'active' && (
                <button onClick={() => handleStop(e.id)} className="btn-danger text-sm flex items-center gap-1">
                  <Square className="w-3 h-3" /> Stop
                </button>
              )}
              <button
                onClick={() => { setSelectedElection(e); setShowCandidateForm(true); }}
                className="btn-secondary text-sm flex items-center gap-1"
              >
                <Users className="w-3 h-3" /> Add Candidate
              </button>
              <button onClick={() => handleDelete(e.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {elections.length === 0 && (
          <div className="card text-center py-12 text-gray-500">No elections created yet.</div>
        )}
      </div>
    </div>
  );
}