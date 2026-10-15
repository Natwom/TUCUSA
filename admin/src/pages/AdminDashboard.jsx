import { useEffect, useState } from 'react';
import api from '../api/axios';
import {
  Users,
  Vote,
  Activity,
  UserCheck,
  CalendarCheck,
  BarChart3,
  Megaphone,
  FileText,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Clock,
} from 'lucide-react';

const STAT_STYLES = {
  blue: { iconBg: 'bg-blue-100', iconText: 'text-blue-600', bar: 'bg-blue-500' },
  green: { iconBg: 'bg-green-100', iconText: 'text-green-600', bar: 'bg-green-500' },
  yellow: { iconBg: 'bg-amber-100', iconText: 'text-amber-600', bar: 'bg-amber-500' },
  red: { iconBg: 'bg-rose-100', iconText: 'text-rose-600', bar: 'bg-rose-500' },
};

const QUICK_ACTIONS = [
  {
    href: '/elections',
    title: 'Manage Elections',
    description: 'Create, start, or stop elections',
    icon: CalendarCheck,
    iconBg: 'bg-blue-100 text-blue-600',
  },
  {
    href: '/voters',
    title: 'Approve Voters',
    description: 'Review and approve student registrations',
    icon: UserCheck,
    iconBg: 'bg-green-100 text-green-600',
  },
  {
    href: '/voters',
    title: 'Download Voter Register',
    description: 'Export the Word register for clerks, by constituency',
    icon: FileText,
    iconBg: 'bg-indigo-100 text-indigo-600',
  },
  {
    href: '/results',
    title: 'View Results',
    description: 'Monitor live and final election results',
    icon: BarChart3,
    iconBg: 'bg-amber-100 text-amber-600',
  },
  {
    href: '/announcements',
    title: 'Post Announcement',
    description: 'Send updates to all students',
    icon: Megaphone,
    iconBg: 'bg-rose-100 text-rose-600',
  },
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function StatCard({ title, value, icon: Icon, color, hint, loading }) {
  const s = STAT_STYLES[color];
  return (
    <div className="relative overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className={`absolute top-0 left-0 h-1 w-full ${s.bar}`} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          {loading ? (
            <div className="mt-3 h-9 w-20 bg-gray-100 rounded-lg animate-pulse" />
          ) : (
            <p className="mt-2 text-3xl font-bold text-gray-900 tabular-nums">
              {Number(value || 0).toLocaleString()}
            </p>
          )}
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${s.iconBg}`}>
          <Icon className={`w-5 h-5 ${s.iconText}`} />
        </div>
      </div>
      {hint && <p className="mt-3 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadStats = () => {
    setLoading(true);
    setError('');
    api
      .get('/admin/stats')
      .then((res) => setStats(res.data))
      .catch(() => setError('Could not load dashboard statistics.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadStats();
  }, []);

  const totalStudents = stats?.total_students || 0;
  const pending = stats?.pending_approvals || 0;
  const approved = Math.max(totalStudents - pending, 0);
  const approvalRate = totalStudents > 0 ? Math.round((approved / totalStudents) * 100) : 0;

  const today = new Date().toLocaleDateString('en-KE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 p-8 text-white shadow-lg mb-8">
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/10 rounded-full" />
        <div className="absolute -bottom-20 right-24 w-48 h-48 bg-white/10 rounded-full" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-blue-100 text-sm">{today}</p>
            <h1 className="text-3xl font-bold mt-1">{getGreeting()}, Admin</h1>
            <p className="text-blue-100 mt-2 text-sm max-w-xl">
              Here is an overview of the TUCUSA voting system: registrations, elections, and votes at a glance.
            </p>
          </div>
          <button
            onClick={loadStats}
            disabled={loading}
            className="flex items-center gap-2 bg-white/15 hover:bg-white/25 border border-white/20 text-sm font-medium px-4 py-2.5 rounded-xl transition-colors disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="mb-6 flex items-center justify-between gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
          <button onClick={loadStats} className="text-sm font-semibold underline hover:no-underline">
            Try again
          </button>
        </div>
      )}

      {/* Pending approvals alert */}
      {!loading && !error && pending > 0 && (
        <a
          href="/voters"
          className="mb-6 flex items-center justify-between gap-3 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 hover:bg-amber-100/70 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="font-semibold text-amber-900 text-sm">
                {pending} registration{pending !== 1 ? 's' : ''} waiting for review
              </p>
              <p className="text-xs text-amber-700">Approve or reject them so students can vote.</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-amber-600 group-hover:translate-x-1 transition-transform" />
        </a>
      )}

      {/* Stat cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard
          title="Total Students"
          value={stats?.total_students}
          icon={Users}
          color="blue"
          hint="Registered on the platform"
          loading={loading}
        />
        <StatCard
          title="Votes Cast"
          value={stats?.total_votes_cast}
          icon={Vote}
          color="green"
          hint="Across all elections"
          loading={loading}
        />
        <StatCard
          title="Active Elections"
          value={stats?.active_elections}
          icon={Activity}
          color="yellow"
          hint="Open for voting right now"
          loading={loading}
        />
        <StatCard
          title="Pending Approvals"
          value={stats?.pending_approvals}
          icon={UserCheck}
          color="red"
          hint="Awaiting your review"
          loading={loading}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Quick actions */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="font-bold text-lg text-gray-900">Quick Actions</h2>
          <p className="text-sm text-gray-500 mb-5">Jump straight to the tasks you use most.</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {QUICK_ACTIONS.map((a) => (
              <a
                key={a.title}
                href={a.href}
                className="group flex items-start gap-4 p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50/40 hover:shadow-sm transition-all"
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${a.iconBg}`}>
                  <a.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm">{a.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{a.description}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 mt-1 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
              </a>
            ))}
          </div>
        </div>

        {/* Registration progress */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="font-bold text-lg text-gray-900">Registration Progress</h2>
          <p className="text-sm text-gray-500 mb-6">Share of students already approved.</p>

          {loading ? (
            <div className="space-y-3">
              <div className="h-10 w-24 bg-gray-100 rounded-lg animate-pulse" />
              <div className="h-3 w-full bg-gray-100 rounded-full animate-pulse" />
            </div>
          ) : (
            <>
              <p className="text-4xl font-bold text-gray-900 tabular-nums">{approvalRate}%</p>
              <div className="mt-4 h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-700"
                  style={{ width: `${approvalRate}%` }}
                />
              </div>

              <div className="mt-6 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-gray-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Approved
                  </span>
                  <span className="font-semibold text-gray-900 tabular-nums">{approved.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-gray-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-gray-300" /> Not approved
                  </span>
                  <span className="font-semibold text-gray-900 tabular-nums">{pending.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                  <span className="text-gray-600">Total students</span>
                  <span className="font-semibold text-gray-900 tabular-nums">{totalStudents.toLocaleString()}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}