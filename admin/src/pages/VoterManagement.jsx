import { useEffect, useMemo, useState } from 'react';
import api from '../api/axios';
import VoterTable from '../components/VoterTable';
import { Download, FileText, Users, UserCheck, Clock, UserX, MapPin, Loader2 } from 'lucide-react';

export default function VoterManagement() {
  const [voters, setVoters] = useState([]);
  const [filter, setFilter] = useState('all');
  const [constituency, setConstituency] = useState('all');
  const [downloading, setDownloading] = useState(false);

  const fetchVoters = () => {
    api.get('/students/').then((res) => setVoters(res.data));
  };

  useEffect(() => {
    fetchVoters();
  }, []);

  // Unique constituency list for the dropdown
  const constituencies = useMemo(() => {
    const set = new Set(voters.map((v) => v.constituency).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [voters]);

  // Voters in the selected constituency (before the status tab is applied)
  const byConstituency = useMemo(
    () => voters.filter((v) => constituency === 'all' || v.constituency === constituency),
    [voters, constituency]
  );

  const filtered = byConstituency.filter((v) => {
    if (filter === 'pending') return !v.is_approved && v.is_active;
    if (filter === 'approved') return v.is_approved;
    if (filter === 'rejected') return !v.is_active;
    return true;
  });

  const pendingCount = byConstituency.filter((v) => !v.is_approved && v.is_active).length;
  const approvedCount = byConstituency.filter((v) => v.is_approved).length;
  const rejectedCount = byConstituency.filter((v) => !v.is_active).length;

  const filterTabs = [
    { key: 'all', label: 'All', count: byConstituency.length, icon: Users },
    { key: 'pending', label: 'Pending', count: pendingCount, icon: Clock },
    { key: 'approved', label: 'Approved', count: approvedCount, icon: UserCheck },
    { key: 'rejected', label: 'Rejected', count: rejectedCount, icon: UserX },
  ];

  const csvCell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

  const handleExport = () => {
    const csv = [
      ['Name', 'Admission Number', 'Course', 'Year', 'Constituency', 'Email', 'Phone', 'Voter ID', 'Status'].map(csvCell).join(','),
      ...filtered.map((v) =>
        [
          v.full_name,
          v.admission_number,
          v.course,
          v.year_of_study,
          v.constituency,
          v.email,
          v.phone,
          v.unique_voter_id || '',
          v.is_approved ? 'Approved' : v.is_active ? 'Pending' : 'Rejected',
        ].map(csvCell).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tucusa_voters_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadWord = async () => {
    if (filtered.length === 0) {
      alert('There are no voters to download for this selection.');
      return;
    }
    setDownloading(true);
    try {
      const params = { status: filter };
      if (constituency !== 'all') params.constituency = constituency;

      const res = await api.get('/admin/voters/export-docx', {
        params,
        responseType: 'blob',
      });

      const slug = constituency === 'all' ? 'all' : constituency.replace(/[^A-Za-z0-9]+/g, '_');
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tucusa_voters_${slug}_${new Date().toISOString().split('T')[0]}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download the Word document. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-tucusa-600" />
            Voter Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">Review, approve, and manage student registrations</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExport}
            className="btn-secondary flex items-center gap-2 text-sm px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button
            onClick={handleDownloadWord}
            disabled={downloading}
            className="flex items-center gap-2 text-sm px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-60"
          >
            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            {downloading ? 'Preparing...' : 'Download Word'}
          </button>
        </div>
      </div>

      {/* Constituency filter + total */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 p-4 bg-white border border-gray-200 rounded-xl">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-gray-400" />
          <label htmlFor="constituency" className="text-sm font-medium text-gray-600">
            Constituency
          </label>
          <select
            id="constituency"
            value={constituency}
            onChange={(e) => setConstituency(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="all">All constituencies</option>
            {constituencies.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <p className="text-sm text-gray-600">
          Total voters{constituency !== 'all' ? ` in ${constituency}` : ''}:{' '}
          <span className="text-lg font-bold text-gray-900">{filtered.length}</span>
          {filter !== 'all' && <span className="text-gray-400"> ({filter})</span>}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`p-4 rounded-xl border transition-all text-left ${
              filter === tab.key
                ? 'bg-tucusa-50 border-tucusa-200 shadow-sm'
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <tab.icon className={`w-5 h-5 ${filter === tab.key ? 'text-tucusa-600' : 'text-gray-400'}`} />
              <span className={`text-2xl font-bold ${filter === tab.key ? 'text-tucusa-700' : 'text-gray-700'}`}>
                {tab.count}
              </span>
            </div>
            <p className={`text-sm font-medium ${filter === tab.key ? 'text-tucusa-700' : 'text-gray-500'}`}>
              {tab.label}
            </p>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No voters found in this category.</p>
          </div>
        ) : (
          <VoterTable voters={filtered} onUpdate={fetchVoters} />
        )}
      </div>
    </div>
  );
}