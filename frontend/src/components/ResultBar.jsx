export default function ResultBar({ candidate, totalVotes, rank = 0 }) {
  const percentage = totalVotes > 0 ? (candidate.votes_count / totalVotes) * 100 : 0;

  const getRankColor = () => {
    if (rank === 0) return 'from-yellow-400 to-amber-400 shadow-yellow-400/30';
    if (rank === 1) return 'from-gray-300 to-gray-400 shadow-gray-400/20';
    if (rank === 2) return 'from-amber-600 to-orange-500 shadow-orange-500/20';
    return 'from-blue-500 to-indigo-500 shadow-blue-500/20';
  };

  const getRankBadge = () => {
    if (rank === 0) return (
      <div className="w-7 h-7 rounded-full bg-yellow-100 border-2 border-yellow-400 flex items-center justify-center shadow-sm">
        <span className="text-xs font-bold text-yellow-700">1</span>
      </div>
    );
    if (rank === 1) return (
      <div className="w-7 h-7 rounded-full bg-gray-100 border-2 border-gray-400 flex items-center justify-center shadow-sm">
        <span className="text-xs font-bold text-gray-600">2</span>
      </div>
    );
    if (rank === 2) return (
      <div className="w-7 h-7 rounded-full bg-orange-100 border-2 border-orange-500 flex items-center justify-center shadow-sm">
        <span className="text-xs font-bold text-orange-700">3</span>
      </div>
    );
    return (
      <div className="w-7 h-7 rounded-full bg-gray-50 border-2 border-gray-200 flex items-center justify-center">
        <span className="text-xs font-bold text-gray-400">{rank + 1}</span>
      </div>
    );
  };

  const getPhotoUrl = () => {
    if (!candidate.photo_url) return null;
    if (candidate.photo_url.startsWith('http')) return candidate.photo_url;
    return `http://localhost:8000${candidate.photo_url}`;
  };

  return (
    <div className="group">
      <div className="flex items-center gap-3 mb-2">
        {/* Rank Badge */}
        {getRankBadge()}

        {/* Photo */}
        <div className={`relative w-10 h-10 rounded-full overflow-hidden border-2 flex-shrink-0 transition-transform duration-300 group-hover:scale-105 ${
          rank === 0 ? 'border-yellow-400 shadow-md' : 'border-gray-200'
        }`}>
          {candidate.photo_url ? (
            <img 
              src={getPhotoUrl()} 
              alt={candidate.name} 
              className="w-full h-full object-cover"
              onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
            />
          ) : null}
          <div 
            className={`w-full h-full flex items-center justify-center text-sm font-bold ${
              rank === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'
            }`}
            style={{ display: candidate.photo_url ? 'none' : 'flex' }}
          >
            {candidate.name.charAt(0).toUpperCase()}
          </div>
        </div>

        {/* Name & Stats */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className={`font-semibold truncate ${
              rank === 0 ? 'text-gray-900 text-base' : 'text-gray-800 text-sm'
            }`}>
              {candidate.name}
            </h4>
            <div className="flex items-center gap-2 flex-shrink-0 ml-3">
              <span className={`font-bold ${
                rank === 0 ? 'text-lg text-gray-900' : 'text-sm text-gray-700'
              }`}>
                {candidate.votes_count.toLocaleString()}
              </span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                rank === 0 
                  ? 'bg-yellow-100 text-yellow-700' 
                  : rank === 1 
                    ? 'bg-gray-100 text-gray-600'
                    : rank === 2
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-blue-50 text-blue-600'
              }`}>
                {percentage.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="ml-14">
        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden shadow-inner">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${getRankColor()} shadow-lg transition-all duration-1000 ease-out`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}