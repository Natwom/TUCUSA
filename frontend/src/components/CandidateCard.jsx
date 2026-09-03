import { User } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const getImageUrl = (photoUrl) => {
  if (!photoUrl) return '/default-avatar.png';
  if (photoUrl.startsWith('http')) return photoUrl;
  return `${API_BASE}${photoUrl}`;
};

export default function CandidateCard({ candidate, selected, onSelect }) {
  return (
    <button
      onClick={() => onSelect(candidate.id)}
      className={`w-full text-left card transition-all ${
        selected
          ? 'ring-2 ring-tucusa-500 bg-tucusa-50'
          : 'hover:shadow-md'
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-xl bg-gray-200 flex-shrink-0 overflow-hidden">
          <img
            src={getImageUrl(candidate.photo_url)}
            alt={candidate.name}
            className="w-full h-full object-cover"
            onError={(e) => { e.target.src = '/default-avatar.png'; }}
          />
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-gray-900">{candidate.name}</h4>
          <p className="text-sm text-gray-600 mt-1 line-clamp-3">{candidate.manifesto}</p>
        </div>
        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
          selected ? 'border-tucusa-500 bg-tucusa-500' : 'border-gray-300'
        }`}>
          {selected && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
        </div>
      </div>
    </button>
  );
}