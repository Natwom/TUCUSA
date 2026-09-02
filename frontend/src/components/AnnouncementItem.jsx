import { Megaphone } from 'lucide-react';

export default function AnnouncementItem({ announcement }) {
  return (
    <div className="flex gap-3 p-4 bg-white rounded-lg border border-gray-100 hover:shadow-sm transition-shadow">
      <div className="flex-shrink-0 w-10 h-10 bg-tucusa-100 rounded-full flex items-center justify-center">
        <Megaphone className="w-5 h-5 text-tucusa-600" />
      </div>
      <div>
        <h4 className="font-semibold text-gray-900">{announcement.title}</h4>
        <p className="text-sm text-gray-600 mt-1">{announcement.content}</p>
        <p className="text-xs text-gray-400 mt-2">
          {new Date(announcement.created_at).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}