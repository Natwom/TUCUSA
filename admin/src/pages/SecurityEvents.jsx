import { useCallback, useEffect, useState } from 'react';
import api from '../api/axios';

const BADGE = {
  critical: 'bg-red-100 text-red-800',
  warning: 'bg-amber-100 text-amber-800',
  info: 'bg-slate-100 text-slate-700',
};

export default function SecurityEvents() {
  const [events, setEvents] = useState([]);
  const [summary, setSummary] = useState(null);
  const [severity, setSeverity] = useState('');
  const [integrity, setIntegrity] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [ev, sm] = await Promise.all([
        api.get('/admin/security-events', { params: { severity: severity || undefined, limit: 200 } }),
        api.get('/admin/security-events/summary'),
      ]);
      setEvents(ev.data);
      setSummary(sm.data.last_24h);
      setError('');
    } catch {
      setError('Could not load security events.');
    }
  }, [severity]);

  useEffect(() => {
    load();
    const t = setInterval(load, 30000); // refresh every 30s
    return () => clearInterval(t);
  }, [load]);

  const runIntegrity = async () => {
    try {
      const res = await api.get('/admin/integrity-check');
      setIntegrity(res.data);
      load();
    } catch {
      setError('Integrity check failed.');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl font-bold">Security Monitor</h1>
        <div className="flex gap-2">
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            className="border rounded px-3 py-2 text-sm"
          >
            <option value="">All severities</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </select>
          <button onClick={load} className="border rounded px-3 py-2 text-sm hover:bg-slate-50">Refresh</button>
          <button onClick={runIntegrity} className="bg-slate-900 text-white rounded px-3 py-2 text-sm">
            Run vote integrity check
          </button>
        </div>
      </div>

      {error && <p className="text-red-600 mb-3">{error}</p>}

      {integrity && (
        <div className={`mb-4 p-3 rounded text-sm ${integrity.ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {integrity.ok
            ? 'Vote counts match the votes table.'
            : `Mismatch found for ${integrity.mismatches.length} candidate(s). Investigate immediately.`}
        </div>
      )}

      {summary && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="border rounded p-4"><p className="text-xs text-slate-500">Events (24h)</p><p className="text-2xl font-semibold">{summary.total}</p></div>
          <div className="border rounded p-4"><p className="text-xs text-slate-500">Warnings (24h)</p><p className="text-2xl font-semibold text-amber-600">{summary.warning}</p></div>
          <div className="border rounded p-4"><p className="text-xs text-slate-500">Critical (24h)</p><p className="text-2xl font-semibold text-red-600">{summary.critical}</p></div>
        </div>
      )}

      <div className="overflow-x-auto border rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="p-2">Time</th><th className="p-2">Severity</th><th className="p-2">Event</th>
              <th className="p-2">IP</th><th className="p-2">Email</th><th className="p-2">Detail</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id} className="border-t align-top">
                <td className="p-2 whitespace-nowrap">{new Date(e.created_at).toLocaleString()}</td>
                <td className="p-2"><span className={`px-2 py-0.5 rounded text-xs ${BADGE[e.severity] || BADGE.info}`}>{e.severity}</span></td>
                <td className="p-2 font-mono text-xs">{e.event_type}</td>
                <td className="p-2 font-mono text-xs">{e.ip}</td>
                <td className="p-2">{e.email}</td>
                <td className="p-2 text-slate-600">{e.detail}</td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr><td colSpan="6" className="p-6 text-center text-slate-500">No events.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}