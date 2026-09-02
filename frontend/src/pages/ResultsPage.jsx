import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import ResultBar from '../components/ResultBar';
import { ArrowLeft, Trophy, Users, Calendar, Crown, Medal } from 'lucide-react';

export default function ResultsPage() {
  const { electionId } = useParams();
  const navigate = useNavigate();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get(`/votes/election/${electionId}/results`)
      .then((res) => setResults(res.data))
      .catch(() => setError('Failed to load results. Please try again later.'))
      .finally(() => setLoading(false));
  }, [electionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">Loading results...</p>
        </div>
      </div>
    );
  }

  if (error || !results) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-500 mb-6">{error || 'No results available.'}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const sortedCandidates = [...results.candidates].sort((a, b) => b.votes_count - a.votes_count);
  const winner = sortedCandidates[0];
  const totalVotes = results.total_votes;

  const getRankIcon = (index) => {
    if (index === 0) return <Crown className="w-5 h-5 text-yellow-500" />;
    if (index === 1) return <Medal className="w-5 h-5 text-gray-400" />;
    if (index === 2) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-gray-400">#{index + 1}</span>;
  };

  const getRankStyle = (index) => {
    if (index === 0) return 'bg-gradient-to-r from-yellow-50 via-amber-50 to-yellow-50 border-yellow-200 shadow-yellow-100';
    if (index === 1) return 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200';
    if (index === 2) return 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200';
    return 'bg-white border-gray-100 hover:border-gray-200';
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Election Results</h1>
            <p className="text-sm text-gray-500">Official tally & breakdown</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Election Title Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold mb-3">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                Final Results
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">{results.title}</h2>
              <p className="text-gray-500 text-sm flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Election #{electionId}
              </p>
            </div>
            <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-5 py-3 border border-gray-100">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 leading-none">{totalVotes.toLocaleString()}</p>
                <p className="text-xs text-gray-500 font-medium mt-0.5">Total Votes Cast</p>
              </div>
            </div>
          </div>
        </div>

        {/* Winner Podium */}
        {winner && (
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-8 text-white shadow-xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
            
            <div className="relative flex flex-col md:flex-row items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-yellow-400 overflow-hidden bg-gray-200 shadow-lg shadow-yellow-400/20">
                  <img
                    src={winner.photo_url ? `http://localhost:8000${winner.photo_url}` : '/default-avatar.png'}
                    alt={winner.name}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = '/default-avatar.png'; }}
                  />
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-yellow-400 text-slate-900 text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                  <Crown className="w-3 h-3" /> WINNER
                </div>
              </div>
              
              <div className="text-center md:text-left flex-1">
                <p className="text-yellow-400 text-sm font-semibold tracking-wider uppercase mb-1">Elected Candidate</p>
                <h3 className="text-3xl md:text-4xl font-bold mb-2">{winner.name}</h3>
                <div className="flex items-center justify-center md:justify-start gap-4 text-sm text-gray-300">
                  <span className="flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-yellow-400" />
                    <span className="font-bold text-white">{winner.votes_count.toLocaleString()}</span> votes
                  </span>
                  <span className="w-1 h-1 bg-gray-500 rounded-full"></span>
                  <span className="font-bold text-white">{winner.percentage}%</span> of total
                </div>
              </div>
              
              <div className="hidden md:flex flex-col items-center justify-center w-28 h-28 rounded-full border-2 border-yellow-400/30 bg-yellow-400/10">
                <span className="text-3xl font-bold text-yellow-400">{winner.percentage}%</span>
                <span className="text-xs text-gray-400">Vote Share</span>
              </div>
            </div>
          </div>
        )}

        {/* Results Breakdown */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Trophy className="w-4 h-4 text-blue-600" />
            </span>
            Full Results Breakdown
          </h3>
          
          <div className="space-y-3">
            {sortedCandidates.map((candidate, index) => (
              <div
                key={candidate.candidate_id}
                className={`rounded-xl border p-4 transition-all duration-300 ${getRankStyle(index)} ${
                  index === 0 ? 'shadow-lg' : 'shadow-sm hover:shadow-md'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-8 flex justify-center">
                    {getRankIcon(index)}
                  </div>
                  
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 border-2 border-white shadow-sm">
                      <img
                        src={candidate.photo_url ? `http://localhost:8000${candidate.photo_url}` : '/default-avatar.png'}
                        alt={candidate.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.src = '/default-avatar.png'; }}
                      />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <h4 className={`font-bold truncate ${index === 0 ? 'text-lg text-gray-900' : 'text-gray-900'}`}>
                        {candidate.name}
                      </h4>
                      <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                        <span className={`text-sm font-bold ${index === 0 ? 'text-yellow-600' : 'text-gray-700'}`}>
                          {candidate.votes_count.toLocaleString()}
                        </span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          index === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {candidate.percentage}%
                        </span>
                      </div>
                    </div>
                    <ResultBar candidate={candidate} totalVotes={totalVotes} rank={index} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center py-4">
          <p className="text-xs text-gray-400">Results are final and verified by the election committee.</p>
        </div>
      </div>
    </div>
  );
}