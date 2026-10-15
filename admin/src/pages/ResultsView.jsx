import { useEffect, useMemo, useState } from 'react';
import api from '../api/axios';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Trophy, Download, Vote, Users, Crown, AlertCircle, Loader2 } from 'lucide-react';

const csvCell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

const STATUS_BADGE = {
  active: 'bg-green-50 text-green-700 border-green-200',
  upcoming: 'bg-amber-50 text-amber-700 border-amber-200',
  closed: 'bg-gray-100 text-gray-600 border-gray-200',
};

export default function ResultsView() {
  const [elections, setElections] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [results, setResults] = useState(null);
  const [loadingResults, setLoadingResults] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/elections/')
      .then((res) => {
        setElections(res.data);
        if (res.data.length > 0) setSelectedId(res.data[0].id);
      })
      .catch(() => setError('Could not load elections.'));
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    setLoadingResults(true);
    setError('');
    setResults(null);
    api
      .get(`/votes/election/${selectedId}/results`)
      .then((res) => setResults(res.data))
      .catch((err) => setError(err.response?.data?.detail || 'Could not load results for this election.'))
      .finally(() => setLoadingResults(false));
  }, [selectedId]);

  const selectedElection = elections.find((e) => e.id === selectedId);

  const ranked = useMemo(() => {
    if (!results) return [];
    return [...results.candidates].sort((a, b) => b.votes_count - a.votes_count);
  }, [results]);

  const topVotes = ranked.length ? ranked[0].votes_count : 0;
  const leaders = topVotes > 0 ? ranked.filter((c) => c.votes_count === topVotes) : [];

  const handleExport = () => {
    if (!results) return;
    const csv = [
      ['Rank', 'Candidate', 'Votes', 'Percentage'].map(csvCell).join(','),
      ...ranked.map((c, i) => [i + 1, c.name, c.votes_count, `${c.percentage}%`].map(csvCell).join(',')),
      ['', 'Total', results.total_votes, ''].map(csvCell).join(','),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `results_${results.title.replace(/\s+/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-blue-600" />
            Election Results
          </h1>
          <p className="text-sm text-gray-500 mt-1">Monitor live and final results for each election.</p>
        </div>
        <button
          onClick={handleExport}
          disabled={!results}
          className="flex items-center gap-2 text-sm font-medium px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <Download className="w-4 h-4" /> Export Results
        </button>
      </div>

      {/* Election selector */}
      <div className="flex flex-wrap items-center gap-3 mb-6 p-4 bg-white border border-gray-200 rounded-xl">
        <label htmlFor="election" className="text-sm font-medium text-gray-600">
          Select election
        </label>
        <select
          id="election"
          value={selectedId || ''}
          onChange={(e) => setSelectedId(Number(e.target.value))}
          className="flex-1 min-w-[220px] max-w-md text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          {elections.map((e) => (
            <option key={e.id} value={e.id}>
              {e.title} ({e.status})
            </option>
          ))}
        </select>
        {selectedElection && (
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold border capitalize ${
              STATUS_BADGE[selectedElection.status] || STATUS_BADGE.upcoming
            }`}
          >
            {selectedElection.status}
          </span>
        )}
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-medium">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {loadingResults && (
        <div className="flex items-center justify-center gap-2 py-20 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading results...
        </div>
      )}

      {!loadingResults && elections.length === 0 && !error && (
        <div className="bg-white border border-gray-200 rounded-2xl text-center py-16 text-gray-500">
          No elections available yet.
        </div>
      )}

      {results && !loadingResults && (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid sm:grid-cols-3 gap-5">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <Vote className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total votes</p>
                <p className="text-3xl font-bold text-gray-900 tabular-nums">{results.total_votes.toLocaleString()}</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Candidates</p>
                <p className="text-3xl font-bold text-gray-900 tabular-nums">{results.candidates.length}</p>
              </div>
            </div>
            <div className="rounded-2xl shadow-sm p-5 flex items-center gap-4 bg-gradient-to-r from-amber-400 to-orange-400 text-white">
              <div className="w-12 h-12 rounded-xl bg-white/25 flex items-center justify-center">
                <Crown className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-white/90">{leaders.length > 1 ? 'Currently tied' : 'Currently leading'}</p>
                <p className="text-lg font-bold truncate">
                  {leaders.length === 0 ? 'No votes yet' : leaders.map((l) => l.name).join(' & ')}
                </p>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900">{results.title}</h2>
            <p className="text-sm text-gray-500 mb-4">Votes per candidate</p>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ranked} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb' }} />
                  <Bar dataKey="votes_count" name="Votes" radius={[8, 8, 0, 0]}>
                    {ranked.map((c) => (
                      <Cell key={c.candidate_id} fill={topVotes > 0 && c.votes_count === topVotes ? '#2563eb' : '#93c5fd'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Breakdown */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Detailed Breakdown</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/60 border-b border-gray-200">
                    <th className="text-left py-3 px-6 font-semibold text-gray-500 text-xs uppercase tracking-wider w-16">Rank</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">Candidate</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-500 text-xs uppercase tracking-wider w-64">Share</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">Votes</th>
                    <th className="text-right py-3 px-6 font-semibold text-gray-500 text-xs uppercase tracking-wider">Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {ranked.map((c, i) => {
                    const isLeader = topVotes > 0 && c.votes_count === topVotes;
                    return (
                      <tr key={c.candidate_id} className="border-b border-gray-100 hover:bg-blue-50/30 transition-colors">
                        <td className="py-3 px-6">
                          <span
                            className={`inline-flex w-7 h-7 items-center justify-center rounded-full text-xs font-bold ${
                              isLeader ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {i + 1}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-gray-900">
                          <span className="flex items-center gap-2">
                            {c.name}
                            {isLeader && <Crown className="w-4 h-4 text-amber-500" />}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${
                                isLeader ? 'bg-blue-600' : 'bg-blue-300'
                              }`}
                              style={{ width: `${Math.min(Number(c.percentage) || 0, 100)}%` }}
                            />
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-gray-900 tabular-nums">{c.votes_count}</td>
                        <td className="py-3 px-6 text-right text-gray-600 tabular-nums">{c.percentage}%</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50/60">
                    <td colSpan={3} className="py-3 px-6 font-semibold text-gray-700">
                      Total
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-gray-900 tabular-nums">{results.total_votes}</td>
                    <td className="py-3 px-6" />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}