import { useEffect, useState } from 'react';
import api from '../api/axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Trophy, Download } from 'lucide-react';

export default function ResultsView() {
  const [elections, setElections] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [results, setResults] = useState(null);

  useEffect(() => {
    api.get('/elections/').then((res) => {
      setElections(res.data);
      if (res.data.length > 0) setSelectedId(res.data[0].id);
    });
  }, []);

  useEffect(() => {
    if (selectedId) {
      api.get(`/votes/election/${selectedId}/results`).then((res) => setResults(res.data));
    }
  }, [selectedId]);

  const handleExport = () => {
    if (!results) return;
    const csv = [
      ['Candidate', 'Votes', 'Percentage'].join(','),
      ...results.candidates.map((c) => [c.name, c.votes_count, c.percentage + '%'].join(',')),
      ['', 'Total', results.total_votes].join(','),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `results_${results.title.replace(/\s+/g, '_')}.csv`;
    a.click();
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Trophy className="w-6 h-6 text-tucusa-600" />
          Election Results
        </h1>
        <button onClick={handleExport} disabled={!results} className="btn-secondary flex items-center gap-2 text-sm disabled:opacity-50">
          <Download className="w-4 h-4" /> Export Results
        </button>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Election</label>
        <select
          value={selectedId || ''}
          onChange={(e) => setSelectedId(Number(e.target.value))}
          className="input max-w-md"
        >
          {elections.map((e) => (
            <option key={e.id} value={e.id}>{e.title} ({e.status})</option>
          ))}
        </select>
      </div>

      {results && (
        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">{results.title}</h2>
                <p className="text-gray-600">Total votes: <span className="font-bold text-tucusa-700">{results.total_votes}</span></p>
              </div>
            </div>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={results.candidates}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="votes_count" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <h3 className="font-bold mb-4">Detailed Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-4">Candidate</th>
                    <th className="text-right py-2 px-4">Votes</th>
                    <th className="text-right py-2 px-4">Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {results.candidates.map((c) => (
                    <tr key={c.candidate_id} className="border-b border-gray-100">
                      <td className="py-2 px-4 font-medium">{c.name}</td>
                      <td className="py-2 px-4 text-right">{c.votes_count}</td>
                      <td className="py-2 px-4 text-right">{c.percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}