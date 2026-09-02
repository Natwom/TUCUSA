import { useEffect, useState } from 'react';
import api from '../api/axios';
import StatCard from '../components/StatCard';
import { Users, Vote, Activity, UserCheck } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/admin/stats').then((res) => setStats(res.data));
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Dashboard Overview</h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Students" value={stats?.total_students || 0} icon={Users} color="blue" />
        <StatCard title="Votes Cast" value={stats?.total_votes_cast || 0} icon={Vote} color="green" />
        <StatCard title="Active Elections" value={stats?.active_elections || 0} icon={Activity} color="yellow" />
        <StatCard title="Pending Approvals" value={stats?.pending_approvals || 0} icon={UserCheck} color="red" />
      </div>

      <div className="card">
        <h2 className="font-bold text-lg mb-4">Quick Actions</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <a href="/elections" className="p-4 border border-gray-200 rounded-lg hover:border-tucusa-300 hover:bg-tucusa-50 transition-colors">
            <h3 className="font-semibold text-tucusa-700">Manage Elections</h3>
            <p className="text-sm text-gray-500 mt-1">Create, start, or stop elections</p>
          </a>
          <a href="/voters" className="p-4 border border-gray-200 rounded-lg hover:border-tucusa-300 hover:bg-tucusa-50 transition-colors">
            <h3 className="font-semibold text-tucusa-700">Approve Voters</h3>
            <p className="text-sm text-gray-500 mt-1">Review and approve student registrations</p>
          </a>
          <a href="/results" className="p-4 border border-gray-200 rounded-lg hover:border-tucusa-300 hover:bg-tucusa-50 transition-colors">
            <h3 className="font-semibold text-tucusa-700">View Results</h3>
            <p className="text-sm text-gray-500 mt-1">Monitor live and final election results</p>
          </a>
          <a href="/announcements" className="p-4 border border-gray-200 rounded-lg hover:border-tucusa-300 hover:bg-tucusa-50 transition-colors">
            <h3 className="font-semibold text-tucusa-700">Post Announcement</h3>
            <p className="text-sm text-gray-500 mt-1">Send updates to all students</p>
          </a>
        </div>
      </div>
    </div>
  );
}