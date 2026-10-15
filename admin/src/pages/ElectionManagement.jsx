import { useEffect, useMemo, useState } from 'react';
import api from '../api/axios';
import ElectionForm from '../components/ElectionForm';
import CandidateForm from '../components/CandidateForm';
import {
  Plus,
  Play,
  Square,
  Trash2,
  UserPlus,
  CalendarCheck,
  Activity,
  Clock,
  CheckCircle2,
  X,
  Loader2,
  AlertCircle,
  CalendarDays,
} from 'lucide-react';

const STATUS_STYLES = {
  active: { label: 'Active', badge: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500', bar: 'bg-green-500' },
  upcoming: { label: 'Upcoming', badge: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500', bar: 'bg-amber-500' },
  closed: { label: 'Closed', badge: 'bg-gray-100 text-gray-600 border-gray-200', dot: 'bg-gray-400', bar: 'bg-gray-400' },
};

const formatDate = (value) =>
  new Date(value).toLocaleString('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

function Modal({ title, onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="font-bold text-lg text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export default function ElectionManagement() {
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('all');
  const [busyId, setBusyId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedElection, setSelectedElection] = useState(null);
  const [showCandidateForm, setShowCandidateForm] = useState(false);

  const fetchElections = () => {
    setError('');
    return api
      .get('/elections/')
      .then((res) => setElections(res.data))
      .catch(() => setError('Could not load elections. Please try again.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchElections();
  }, []);

  const runAction = async (id, fn, failMessage) => {
    setBusyId(id);
    try {
      await fn();
      await fetchElections();
    } catch (err) {
      alert(err.response?.data?.detail || failMessage);
    } finally {
      setBusyId(null);
    }
  };

  const handleStart = (id) => {
    if (!confirm('Start this election now? Students will be able to vote immediately.')) return;
    runAction(id, () => api.post(`/elections/${id}/start`), 'Failed to start the election.');
  };

  const handleStop = (id) => {
    if (!confirm('Stop this election? Voting will close and cannot be reopened.')) return;
    runAction(id, () => api.post(`/elections/${id}/stop`), 'Failed to stop the election.');
  };

  const handleDelete = (id) => {
    if (!confirm('Delete this election? Its candidates and votes will be removed. This cannot be undone.')) return;
    runAction(id, () => api.delete(`/elections/${id}`), 'Failed to delete the election.');
  };

  const counts = useMemo(
    () => ({
      all: elections.length,
      active: elections.filter((e) => e.status === 'active').length,
      upcoming: elections.filter((e) => e.status === 'upcoming').length,
      closed: elections.filter((e) => e.status === 'closed').length,
    }),
    [elections]
  );

  const visible = elections.filter((e) => tab === 'all' || e.status === tab);

  const tabs = [
    { key: 'all', label: 'All', icon: CalendarDays },
    { key: 'active', label: 'Active', icon: Activity },
    { key: 'upcoming', label: 'Upcoming', icon: Clock },
    { key: 'closed', label: 'Closed', icon: CheckCircle2 },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-blue-600" />
            Election Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">Create elections, add candidates, and control voting.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 text-sm font-medium px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> New Election
        </button>
      </div>

      {/* Status tabs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`p-4 rounded-xl border text-left transition-all ${
              tab === t.key ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <t.icon className={`w-5 h-5 ${tab === t.key ? 'text-blue-600' : 'text-gray-400'}`} />
              <span className={`text-2xl font-bold tabular-nums ${tab === t.key ? 'text-blue-700' : 'text-gray-700'}`}>
                {counts[t.key]}
              </span>
            </div>
            <p className={`text-sm font-medium ${tab === t.key ? 'text-blue-700' : 'text-gray-500'}`}>{t.label}</p>
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-6 flex items-center justify-between gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3">
          <span className="flex items-center gap-2 text-sm font-medium">
            <AlertCircle className="w-4 h-4" /> {error}
          </span>
          <button onClick={fetchElections} className="text-sm font-semibold underline hover:no-underline">
            Try again
          </button>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-32 bg-white border border-gray-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CalendarCheck className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-600 font-medium">
            {elections.length === 0 ? 'No elections created yet.' : 'No elections in this category.'}
          </p>
          {elections.length === 0 && (
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" /> Create your first election
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {visible.map((e) => {
            const s = STATUS_STYLES[e.status] || STATUS_STYLES.upcoming;
            const busy = busyId === e.id;
            return (
              <div
                key={e.id}
                className="relative overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className={`absolute left-0 top-0 h-full w-1.5 ${s.bar}`} />
                <div className="p-5 pl-7">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-bold text-lg text-gray-900">{e.title}</h3>
                      <p className="text-blue-600 font-medium text-sm mt-0.5">{e.position}</p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${s.badge}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${s.dot} ${e.status === 'active' ? 'animate-pulse' : ''}`} />
                      {s.label}
                    </span>
                  </div>

                  {e.description && <p className="text-sm text-gray-600 mt-3 line-clamp-2">{e.description}</p>}

                  <div className="flex flex-wrap items-center gap-x-6 gap-y-1 mt-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5" /> Starts: <b className="text-gray-700">{formatDate(e.start_time)}</b>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> Ends: <b className="text-gray-700">{formatDate(e.end_time)}</b>
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                    {e.status === 'upcoming' && (
                      <button
                        onClick={() => handleStart(e.id)}
                        disabled={busy}
                        className="flex items-center gap-1.5 text-sm font-medium px-3.5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60 transition-colors"
                      >
                        {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />} Start
                      </button>
                    )}
                    {e.status === 'active' && (
                      <button
                        onClick={() => handleStop(e.id)}
                        disabled={busy}
                        className="flex items-center gap-1.5 text-sm font-medium px-3.5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60 transition-colors"
                      >
                        {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Square className="w-3.5 h-3.5" />} Stop
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectedElection(e);
                        setShowCandidateForm(true);
                      }}
                      className="flex items-center gap-1.5 text-sm font-medium px-3.5 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <UserPlus className="w-3.5 h-3.5" /> Add Candidate
                    </button>
                    <button
                      onClick={() => handleDelete(e.id)}
                      disabled={busy}
                      title="Delete election"
                      className="ml-auto p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-60 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {showForm && (
        <Modal title="New Election" onClose={() => setShowForm(false)}>
          <ElectionForm
            onSuccess={() => {
              setShowForm(false);
              fetchElections();
            }}
            onCancel={() => setShowForm(false)}
          />
        </Modal>
      )}

      {showCandidateForm && selectedElection && (
        <Modal title={`Add Candidate: ${selectedElection.position}`} onClose={() => setShowCandidateForm(false)}>
          <CandidateForm
            electionId={selectedElection.id}
            onSuccess={() => {
              setShowCandidateForm(false);
              fetchElections();
            }}
            onCancel={() => setShowCandidateForm(false)}
          />
        </Modal>
      )}
    </div>
  );
}