import { useState } from 'react';
import { 
  CheckCircle, XCircle, Fingerprint, Eye, MapPin, 
  Mail, Phone, GraduationCap, User, Calendar, X,
  FileText, CreditCard, ExternalLink
} from 'lucide-react';
import api from '../api/axios';

export default function VoterTable({ voters, onUpdate }) {
  const [selectedVoter, setSelectedVoter] = useState(null);

  const handleApprove = async (id) => {
    try {
      await api.post(`/students/${id}/approve`);
      onUpdate();
      setSelectedVoter(null);
    } catch (err) {
      alert('Failed to approve');
    }
  };

  const handleReject = async (id) => {
    if (!confirm('Are you sure you want to reject this student? This will deactivate their account.')) return;
    try {
      await api.post(`/students/${id}/reject`);
      onUpdate();
      setSelectedVoter(null);
    } catch (err) {
      alert('Failed to reject');
    }
  };

  const getImageUrl = (photoUrl) => {
    if (!photoUrl) return null;
    if (photoUrl.startsWith('http')) return photoUrl;
    return `http://localhost:8000${photoUrl}`;
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/50">
              <th className="text-left py-3 px-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">Student</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">Admission</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">Course</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">Constituency</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">IDs</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">Status</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {voters.map((v) => (
              <tr key={v.id} className="border-b border-gray-100 hover:bg-blue-50/30 transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                      {v.profile_picture ? (
                        <img 
                          src={getImageUrl(v.profile_picture)} 
                          alt={v.full_name}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      ) : (
                        <div className="w-full h-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">
                          {getInitials(v.full_name)}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{v.full_name}</p>
                      <p className="text-xs text-gray-500">{v.email}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-gray-700 font-mono text-xs">{v.admission_number}</td>
                <td className="py-3 px-4 text-gray-600 text-xs">
                  <span className="font-medium">{v.course}</span>
                  <span className="text-gray-400 ml-1">(Yr {v.year_of_study})</span>
                </td>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center gap-1 text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-md">
                    <MapPin className="w-3 h-3" />
                    {v.constituency}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    {v.national_id_photo ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium bg-green-50 text-green-700 px-2 py-1 rounded-md border border-green-100" title="National ID uploaded">
                        <FileText className="w-3 h-3" /> Nat. ID
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium bg-gray-50 text-gray-400 px-2 py-1 rounded-md border border-gray-100">
                        <FileText className="w-3 h-3" /> Nat. ID
                      </span>
                    )}
                    {v.student_id_photo ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium bg-green-50 text-green-700 px-2 py-1 rounded-md border border-green-100" title="Student ID uploaded">
                        <CreditCard className="w-3 h-3" /> Stud. ID
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium bg-gray-50 text-gray-400 px-2 py-1 rounded-md border border-gray-100">
                        <CreditCard className="w-3 h-3" /> Stud. ID
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4">
                  {v.is_approved ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold bg-green-50 text-green-700 px-2.5 py-1 rounded-full border border-green-100">
                      <CheckCircle className="w-3 h-3" /> Approved
                    </span>
                  ) : !v.is_active ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold bg-red-50 text-red-700 px-2.5 py-1 rounded-full border border-red-100">
                      <XCircle className="w-3 h-3" /> Rejected
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold bg-yellow-50 text-yellow-700 px-2.5 py-1 rounded-full border border-yellow-100">
                      <Fingerprint className="w-3 h-3" /> Pending
                    </span>
                  )}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => setSelectedVoter(v)}
                      className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"
                      title="View Details & IDs"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {!v.is_approved && v.is_active && (
                      <>
                        <button 
                          onClick={() => handleApprove(v.id)}
                          className="p-1.5 hover:bg-green-50 rounded-lg text-green-600 transition-colors"
                          title="Approve"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleReject(v.id)}
                          className="p-1.5 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
                          title="Reject"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {selectedVoter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedVoter(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white relative">
              <button 
                onClick={() => setSelectedVoter(null)}
                className="absolute top-4 right-4 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl border-3 border-white/30 overflow-hidden bg-white/20 flex items-center justify-center">
                  {selectedVoter.profile_picture ? (
                    <img 
                      src={getImageUrl(selectedVoter.profile_picture)} 
                      alt={selectedVoter.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-bold">{getInitials(selectedVoter.full_name)}</span>
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{selectedVoter.full_name}</h3>
                  <p className="text-blue-100 text-sm">{selectedVoter.email}</p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Personal Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                    <GraduationCap className="w-3.5 h-3.5" /> Admission
                  </div>
                  <p className="font-semibold text-gray-900 text-sm font-mono">{selectedVoter.admission_number}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                    <User className="w-3.5 h-3.5" /> Course
                  </div>
                  <p className="font-semibold text-gray-900 text-sm">{selectedVoter.course}</p>
                  <p className="text-xs text-gray-500">Year {selectedVoter.year_of_study}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                    <MapPin className="w-3.5 h-3.5" /> Constituency
                  </div>
                  <p className="font-semibold text-gray-900 text-sm">{selectedVoter.constituency}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                    <Phone className="w-3.5 h-3.5" /> Phone
                  </div>
                  <p className="font-semibold text-gray-900 text-sm">{selectedVoter.phone}</p>
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                  <Mail className="w-3.5 h-3.5" /> Email
                </div>
                <p className="font-semibold text-gray-900 text-sm">{selectedVoter.email}</p>
              </div>

              {/* ID Documents Section */}
              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Verification Documents
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* National ID */}
                  <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                    <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5" /> National ID
                      </span>
                      {selectedVoter.national_id_photo && (
                        <a 
                          href={getImageUrl(selectedVoter.national_id_photo)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
                        >
                          Open <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    <div className="p-3">
                      {selectedVoter.national_id_photo ? (
                        <a href={getImageUrl(selectedVoter.national_id_photo)} target="_blank" rel="noopener noreferrer">
                          <img 
                            src={getImageUrl(selectedVoter.national_id_photo)} 
                            alt="National ID"
                            className="w-full h-40 object-contain bg-white rounded-lg border border-gray-200 hover:opacity-90 transition-opacity cursor-zoom-in"
                          />
                        </a>
                      ) : (
                        <div className="h-40 flex flex-col items-center justify-center text-gray-400 bg-white rounded-lg border border-dashed border-gray-300">
                          <FileText className="w-8 h-8 mb-2 opacity-50" />
                          <span className="text-xs">No National ID uploaded</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Student ID */}
                  <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                    <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5" /> Student ID
                      </span>
                      {selectedVoter.student_id_photo && (
                        <a 
                          href={getImageUrl(selectedVoter.student_id_photo)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
                        >
                          Open <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    <div className="p-3">
                      {selectedVoter.student_id_photo ? (
                        <a href={getImageUrl(selectedVoter.student_id_photo)} target="_blank" rel="noopener noreferrer">
                          <img 
                            src={getImageUrl(selectedVoter.student_id_photo)} 
                            alt="Student ID"
                            className="w-full h-40 object-contain bg-white rounded-lg border border-gray-200 hover:opacity-90 transition-opacity cursor-zoom-in"
                          />
                        </a>
                      ) : (
                        <div className="h-40 flex flex-col items-center justify-center text-gray-400 bg-white rounded-lg border border-dashed border-gray-300">
                          <CreditCard className="w-8 h-8 mb-2 opacity-50" />
                          <span className="text-xs">No Student ID uploaded</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                  <Calendar className="w-3.5 h-3.5" /> Registered
                </div>
                <p className="font-semibold text-gray-900 text-sm">
                  {new Date(selectedVoter.created_at).toLocaleDateString('en-KE', { 
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </p>
              </div>

              {selectedVoter.unique_voter_id && (
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="flex items-center gap-2 text-xs text-blue-600 mb-1">
                    <Fingerprint className="w-3.5 h-3.5" /> Voter ID
                  </div>
                  <p className="font-mono font-bold text-blue-900 text-sm">{selectedVoter.unique_voter_id}</p>
                </div>
              )}

              {/* Status Banner */}
              <div className={`p-3 rounded-xl border ${
                selectedVoter.is_approved 
                  ? 'bg-green-50 border-green-200 text-green-800' 
                  : !selectedVoter.is_active
                    ? 'bg-red-50 border-red-200 text-red-800'
                    : 'bg-yellow-50 border-yellow-200 text-yellow-800'
              }`}>
                <div className="flex items-center gap-2 font-semibold text-sm">
                  {selectedVoter.is_approved ? (
                    <><CheckCircle className="w-4 h-4" /> Approved & Active</>
                  ) : !selectedVoter.is_active ? (
                    <><XCircle className="w-4 h-4" /> Rejected / Inactive</>
                  ) : (
                    <><Fingerprint className="w-4 h-4" /> Pending Approval</>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {!selectedVoter.is_approved && selectedVoter.is_active && (
                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => handleApprove(selectedVoter.id)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve Student
                  </button>
                  <button 
                    onClick={() => handleReject(selectedVoter.id)}
                    className="flex-1 bg-white hover:bg-red-50 text-red-600 border-2 border-red-200 font-semibold py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}