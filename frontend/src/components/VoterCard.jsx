import { Shield, Fingerprint } from 'lucide-react';

export default function VoterCard({ voter }) {
  if (!voter) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-tucusa-600 to-tucusa-800 text-white p-6 shadow-lg max-w-md mx-auto">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-8 -mb-8" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6" />
            <span className="font-bold text-lg tracking-wide">TUCUSA</span>
          </div>
          <span className="text-xs bg-white/20 px-2 py-1 rounded-full">OFFICIAL VOTER CARD</span>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
            {voter.full_name?.charAt(0)}
          </div>
          <div>
            <h3 className="font-bold text-lg">{voter.full_name}</h3>
            <p className="text-tucusa-100 text-sm">{voter.course} • Year {voter.year_of_study}</p>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-tucusa-200">Admission No:</span>
            <span className="font-mono">{voter.admission_number}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-tucusa-200">Voter ID:</span>
            <span className="font-mono font-bold bg-white/20 px-2 py-0.5 rounded flex items-center gap-1">
              <Fingerprint className="w-3 h-3" />
              {voter.unique_voter_id}
            </span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-white/20 flex items-center justify-between">
          <span className="text-xs text-tucusa-200">Turkana Colleges University Students Association</span>
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <Vote className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
}

import { Vote } from 'lucide-react';