import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import VoterCard from '../components/VoterCard';
import ElectionCard from '../components/ElectionCard';
import AnnouncementItem from '../components/AnnouncementItem';
import { 
  Megaphone, Vote, AlertCircle, TrendingUp, 
  Clock, CheckCircle2, Inbox, Sparkles,
  Phone, Mail, X, MessageCircle
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [voterCard, setVoterCard] = useState(null);
  const [elections, setElections] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [votesMap, setVotesMap] = useState({});
  const [stats, setStats] = useState({ total: 0, voted: 0, pending: 0 });
  const [showSupport, setShowSupport] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (user?.role === 'student') {
          const vc = await api.get('/students/voter-card').catch(() => ({ data: null }));
          setVoterCard(vc.data);
        }

        const [elecRes, annRes] = await Promise.all([
          api.get('/elections/'),
          api.get('/announcements/'),
        ]);
        setElections(elecRes.data);
        setAnnouncements(annRes.data);

        const voteChecks = await Promise.all(
          elecRes.data.map((e) =>
            api.get(`/votes/election/${e.id}/has-voted`).catch(() => ({ data: { has_voted: false } }))
          )
        );
        const map = {};
        let votedCount = 0;
        elecRes.data.forEach((e, i) => {
          map[e.id] = voteChecks[i].data.has_voted;
          if (voteChecks[i].data.has_voted) votedCount++;
        });
        setVotesMap(map);
        setStats({
          total: elecRes.data.length,
          voted: votedCount,
          pending: elecRes.data.filter(e => e.status === 'active').length - votedCount,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-tucusa-200 border-t-tucusa-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const activeElections = elections.filter((e) => e.status === 'active');
  const closedElections = elections.filter((e) => e.status === 'closed');
  const upcomingElections = elections.filter((e) => e.status === 'upcoming');

  return (
    <div className="min-h-screen bg-gray-50/50 pb-12">
      {/* Support Modal */}
      {showSupport && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" 
          onClick={() => setShowSupport(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative animate-[fadeIn_0.2s_ease-out]" 
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => setShowSupport(false)}
              className="absolute top-4 right-4 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
            
            <div className="w-14 h-14 bg-tucusa-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <MessageCircle className="w-7 h-7 text-tucusa-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Contact Support</h2>
            <p className="text-gray-500 text-center text-sm mb-8">
              Need help with voting or your account? Reach out directly.
            </p>
            
            <div className="space-y-4">
              {/* Phone - Opens phone dialer */}
              <a 
                href="tel:0716889657" 
                className="flex items-center gap-4 p-4 bg-gray-50 hover:bg-green-50 border border-gray-100 hover:border-green-200 rounded-xl transition-all group"
              >
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Phone className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Phone</p>
                  <p className="text-lg font-bold text-gray-900 group-hover:text-green-700 transition-colors">0716889657</p>
                </div>
              </a>
              
              {/* Email - Opens email client */}
              <a 
                href="mailto:natwomdaniel@gmail.com" 
                className="flex items-center gap-4 p-4 bg-gray-50 hover:bg-tucusa-50 border border-gray-100 hover:border-tucusa-200 rounded-xl transition-all group"
              >
                <div className="w-12 h-12 bg-tucusa-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Mail className="w-6 h-6 text-tucusa-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Email</p>
                  <p className="text-lg font-bold text-gray-900 group-hover:text-tucusa-700 transition-colors">natwomdaniel@gmail.com</p>
                </div>
              </a>
            </div>
            
            <p className="text-center text-xs text-gray-400 mt-6">
              Available during business hours. Response within 24 hours.
            </p>
          </div>
        </div>
      )}

      {/* Top Stats Bar */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Welcome back, <span className="text-tucusa-700">{user?.full_name?.split(' ')[0]}</span>
              </h1>
              <p className="text-gray-500 mt-1 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Your TUCUSA voter dashboard
              </p>
            </div>
            <div className="flex items-center gap-2 bg-tucusa-50 text-tucusa-700 px-4 py-2 rounded-full text-sm font-medium border border-tucusa-100">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              {user?.is_approved ? 'Verified Voter' : 'Pending Approval'}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-tucusa-500 to-tucusa-700 rounded-xl p-4 text-white">
              <div className="flex items-center gap-2 mb-1 opacity-90">
                <Vote className="w-4 h-4" />
                <span className="text-xs font-medium">Total Elections</span>
              </div>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl p-4 text-white">
              <div className="flex items-center gap-2 mb-1 opacity-90">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-xs font-medium">Votes Cast</span>
              </div>
              <p className="text-2xl font-bold">{stats.voted}</p>
            </div>
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-4 text-white">
              <div className="flex items-center gap-2 mb-1 opacity-90">
                <Clock className="w-4 h-4" />
                <span className="text-xs font-medium">Pending</span>
              </div>
              <p className="text-2xl font-bold">{Math.max(0, stats.pending)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Not approved warning */}
        {user?.role === 'student' && !user?.is_approved && (
          <div className="mb-8 p-5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-4 shadow-sm">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-amber-900 mb-1">Account Pending Approval</h3>
              <p className="text-amber-800 text-sm leading-relaxed">
                Your registration is being reviewed by the admin team. Once approved, you will receive your unique digital voter card and be able to participate in elections.
              </p>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-8">
            {voterCard && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-tucusa-100 rounded-lg flex items-center justify-center">
                    <Vote className="w-4 h-4 text-tucusa-600" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">Your Digital Voter Card</h2>
                </div>
                <VoterCard voter={voterCard} />
              </section>
            )}

            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">Active Elections</h2>
                </div>
                {activeElections.length > 0 && (
                  <span className="text-xs font-medium bg-green-100 text-green-700 px-3 py-1 rounded-full">
                    {activeElections.length} open
                  </span>
                )}
              </div>
              
              {activeElections.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center shadow-sm">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Inbox className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-gray-900 font-semibold mb-1">No Active Elections</h3>
                  <p className="text-gray-500 text-sm">Check back later for upcoming elections.</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {activeElections.map((e) => (
                    <ElectionCard key={e.id} election={e} hasVoted={votesMap[e.id]} />
                  ))}
                </div>
              )}
            </section>

            {upcomingElections.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-4 h-4 text-amber-600" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">Upcoming Elections</h2>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {upcomingElections.map((e) => (
                    <ElectionCard key={e.id} election={e} hasVoted={votesMap[e.id]} />
                  ))}
                </div>
              </section>
            )}

            {closedElections.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-gray-600" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">Past Elections</h2>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {closedElections.map((e) => (
                    <ElectionCard key={e.id} election={e} hasVoted={votesMap[e.id]} />
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex items-center gap-2">
                <div className="w-8 h-8 bg-tucusa-100 rounded-lg flex items-center justify-center">
                  <Megaphone className="w-4 h-4 text-tucusa-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Announcements</h2>
              </div>
              <div className="p-5">
                {announcements.length === 0 ? (
                  <div className="text-center py-8">
                    <Inbox className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">No announcements yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {announcements.slice(0, 5).map((a) => (
                      <AnnouncementItem key={a.id} announcement={a} />
                    ))}
                    {announcements.length > 5 && (
                      <button className="w-full text-center text-sm text-tucusa-600 font-medium hover:text-tucusa-700 pt-2">
                        View all {announcements.length} announcements
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Contact Support Card */}
            <div className="bg-gradient-to-br from-tucusa-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg shadow-tucusa-200">
              <h3 className="font-bold text-lg mb-2">Need Help?</h3>
              <p className="text-tucusa-100 text-sm mb-5 leading-relaxed">
                Having trouble voting or accessing your voter card? Contact the TUCUSA admin team for assistance.
              </p>
              <button 
                onClick={() => setShowSupport(true)}
                className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-semibold py-3 rounded-xl transition-all text-sm flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4" />
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}