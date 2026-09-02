import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import CandidateCard from '../components/CandidateCard';
import { 
  ArrowLeft, CheckCircle, AlertTriangle, Shield, 
  Vote, Clock, Lock, Sparkles, X, ChevronRight 
} from 'lucide-react';

export default function VotePage() {
  const { electionId } = useParams();
  const navigate = useNavigate();
  const [election, setElection] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [selected, setSelected] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [elecRes, candRes, voteCheck] = await Promise.all([
          api.get(`/elections/${electionId}`),
          api.get(`/candidates/election/${electionId}`),
          api.get(`/votes/election/${electionId}/has-voted`),
        ]);
        setElection(elecRes.data);
        setCandidates(candRes.data);
        setHasVoted(voteCheck.data.has_voted);
      } catch (err) {
        setError('Failed to load election data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [electionId]);

  const handleVote = async () => {
    if (!selected) return;
    setError('');
    try {
      await api.post('/votes/', { election_id: parseInt(electionId), candidate_id: selected });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to cast vote. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-tucusa-200 border-t-tucusa-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Loading election...</p>
        </div>
      </div>
    );
  }

  if (hasVoted && !submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-10 text-center max-w-md w-full">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Already Voted</h2>
          <p className="text-gray-600 mb-6 leading-relaxed">
            You have already cast your vote in this election. Thank you for participating!
          </p>
          <button 
            onClick={() => navigate('/dashboard')} 
            className="w-full bg-tucusa-600 hover:bg-tucusa-700 text-white font-bold py-3 px-6 rounded-xl transition-all hover:shadow-lg flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-10 text-center max-w-md w-full">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-[bounce_1s_ease-in-out]">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Vote Cast Successfully!</h2>
          <p className="text-gray-600 mb-2 leading-relaxed">
            Thank you for participating in the democratic process.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Your vote has been recorded securely and anonymously.
          </p>
          <button 
            onClick={() => navigate('/dashboard')} 
            className="w-full bg-tucusa-600 hover:bg-tucusa-700 text-white font-bold py-3 px-6 rounded-xl transition-all hover:shadow-lg flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-12">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <button 
            onClick={() => navigate('/dashboard')} 
            className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Cast Your Vote</h1>
            <p className="text-xs text-gray-500">Secure & Anonymous</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Election Info Card */}
        <div className="bg-gradient-to-br from-tucusa-600 to-blue-700 rounded-2xl p-6 sm:p-8 text-white shadow-lg shadow-tucusa-200 mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2 opacity-90">
                <Vote className="w-4 h-4" />
                <span className="text-xs font-medium uppercase tracking-wide">Active Election</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold">{election?.title}</h2>
              <p className="text-tucusa-100 text-lg mt-1">{election?.position}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Shield className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-tucusa-100 text-sm leading-relaxed max-w-2xl">
            {election?.description || 'Select your preferred candidate below. Your vote is anonymous and cannot be changed once submitted.'}
          </p>
          <div className="flex items-center gap-4 mt-5 pt-5 border-t border-white/20">
            <div className="flex items-center gap-1.5 text-xs text-tucusa-100">
              <Clock className="w-3.5 h-3.5" />
              <span>Ends {new Date(election?.end_time).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-tucusa-100">
              <Lock className="w-3.5 h-3.5" />
              <span>Anonymous Voting</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-tucusa-100">
              <Sparkles className="w-3.5 h-3.5" />
              <span>One Vote Only</span>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-700 text-sm">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Candidates */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-sm">
                {candidates.length}
              </span>
              Candidates
            </h3>
            {selected && (
              <button 
                onClick={() => setSelected(null)}
                className="text-sm text-gray-500 hover:text-red-600 flex items-center gap-1 transition-colors"
              >
                <X className="w-4 h-4" />
                Clear selection
              </button>
            )}
          </div>

          <div className="space-y-4">
            {candidates.map((c) => (
              <CandidateCard
                key={c.id}
                candidate={c}
                selected={selected === c.id}
                onSelect={setSelected}
              />
            ))}
          </div>

          {candidates.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Vote className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-gray-900 font-semibold mb-1">No Candidates Yet</h3>
              <p className="text-gray-500 text-sm">Candidates will be added soon.</p>
            </div>
          )}
        </div>

        {/* Action Area */}
        {confirming ? (
          <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-2">Confirm Your Vote</h3>
                <p className="text-gray-600 mb-1">
                  You are voting for{' '}
                  <span className="font-bold text-tucusa-700 text-lg">
                    {candidates.find((c) => c.id === selected)?.name}
                  </span>
                </p>
                <p className="text-amber-700 text-sm mb-6">
                  This action is final and cannot be undone. Please verify your choice before confirming.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button 
                    onClick={handleVote} 
                    className="flex-1 bg-tucusa-600 hover:bg-tucusa-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Confirm Vote
                  </button>
                  <button 
                    onClick={() => setConfirming(false)} 
                    className="flex-1 bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200 font-bold py-3.5 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <X className="w-5 h-5" />
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            disabled={!selected}
            className="w-full bg-tucusa-600 hover:bg-tucusa-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl transition-all hover:shadow-lg hover:shadow-tucusa-200 hover:-translate-y-0.5 flex items-center justify-center gap-2 text-lg"
          >
            {selected ? (
              <>
                Continue
                <ChevronRight className="w-5 h-5" />
              </>
            ) : (
              <>
                <Vote className="w-5 h-5" />
                Select a candidate to continue
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}