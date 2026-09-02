import { useEffect, useState } from 'react';
import api from '../api/axios';
import VoterTable from '../components/VoterTable';
import { Download, Users, UserCheck, Clock, UserX } from 'lucide-react';

export default function VoterManagement() {
  const [voters, setVoters] = useState([]);
  const [filter, setFilter] = useState('all');

  const fetchVoters = () => {
    api.get('/students/').then((res) => setVoters(res.data));
  };

  useEffect(() => {
    fetchVoters();
  }, []);

  const filtered = voters.filter((v) => {
    if (filter === 'pending') return !v.is_approved && v.is_active;
    if (filter === 'approved') return v.is_approved;
    if (filter === 'rejected') return !v.is_active;
    return true;
  });

  const handleExport = () => {
    const csv = [
      ['Name', 'Admission Number', 'Course', 'Year', 'Constituency', 'Email', 'Phone', 'Voter ID', 'Status'].join(','),
      ...filtered.map((v) => [
        v.full_name,
        v.admission_number,
        v.course,
        v.year_of_study,
        v.constituency,
        v.email,
        v.phone,
        v.unique_voter_id || '',
        v.is_approved ? 'Approved' : v.is_active ? 'Pending' : 'Rejected',
      ].join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tucusa_voters_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const pendingCount = voters.filter((v) => !v.is_approved && v.is_active).length;
  const approvedCount = voters.filter((v) => v.is_approved).length;
  const rejectedCount = voters.filter((v) => !v.is_active).length;

  const filterTabs = [
    { key: 'all', label: 'All', count: voters.length, icon: Users },
    { key: 'pending', label: 'Pending', count: pendingCount, icon: Clock },
    { key: 'approved', label: 'Approved', count: approvedCount, icon: UserCheck },
    { key: 'rejected', label: 'Rejected', count: rejectedCount, icon: UserX },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-tucusa-600" />
            Voter Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">Review, approve, and manage student registrations</p>
        </div>
        <button 
          onClick={handleExport} 
          className="btn-secondary flex items-center gap-2 text-sm px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
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