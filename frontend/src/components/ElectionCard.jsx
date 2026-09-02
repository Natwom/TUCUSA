import { Link } from 'react-router-dom';
import { Calendar, Clock, Vote as VoteIcon } from 'lucide-react';

export default function ElectionCard({ election, hasVoted }) {
  const isActive = election.status === 'active';
  const isClosed = election.status === 'closed';

  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-bold text-lg text-gray-900">{election.title}</h3>
          <p className="text-tucusa-600 font-medium">{election.position}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
          isActive ? 'bg-green-100 text-green-700' :
          isClosed ? 'bg-gray-100 text-gray-600' :
          'bg-yellow-100 text-yellow-700'
        }`}>
          {election.status.toUpperCase()}
        </span>
      </div>

      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{election.description}</p>

      <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
        <div className="flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          {new Date(election.start_time).toLocaleDateString()}
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          {new Date(election.end_time).toLocaleDateString()}
        </div>
      </div>

      {isActive && !hasVoted && (
        <Link to={`/vote/${election.id}`} className="btn-primary w-full flex items-center justify-center gap-2">
          <VoteIcon className="w-4 h-4" />
          Vote Now
        </Link>
      )}

      {isActive && hasVoted && (
        <div className="w-full py-2 px-4 bg-green-50 text-green-700 rounded-lg text-center font-medium flex items-center justify-center gap-2">
          <VoteIcon className="w-4 h-4" />
          You have voted
        </div>
      )}

      {isClosed && (
        <Link to={`/results/${election.id}`} className="btn-secondary w-full flex items-center justify-center gap-2">
          View Results
        </Link>
      )}

      {election.status === 'upcoming' && (
        <div className="w-full py-2 px-4 bg-yellow-50 text-yellow-700 rounded-lg text-center font-medium">
          Starts {new Date(election.start_time).toLocaleString()}
        </div>
      )}
    </div>
  );
}