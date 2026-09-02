import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeft, Save, User, Camera, Mail, BookOpen, GraduationCap, 
  Phone, Shield, CheckCircle2, AlertCircle, MapPin, FileText, CreditCard 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const TURKANA_CONSTITUENCIES = [
  'Turkana North',
  'Turkana West',
  'Turkana Central',
  'Loima',
  'Turkana South',
  'Turkana East',
];

export default function ProfilePage() {
  const { user, updateProfile, setUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    course: user?.course || '',
    year_of_study: user?.year_of_study || 1,
    constituency: user?.constituency || '',
    phone: user?.phone || '',
  });
  
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(
    user?.profile_picture ? `http://localhost:8000${user.profile_picture}` : null
  );
  
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setSaved(false);
    setError(null);
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.type)) {
        setError('Please upload a valid image (JPEG, PNG, WEBP)');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be less than 5MB');
        return;
      }
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
      setSaved(false);
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    
    try {
      let updatedUser = { ...user };
      
      if (photo) {
        const formData = new FormData();
        formData.append('photo', photo);
        const uploadRes = await api.post('/students/upload-photo', formData);
        updatedUser.profile_picture = uploadRes.data.photo_url;
        setPhoto(null);
      }
      
      await updateProfile(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  };

  const getIdImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `http://localhost:8000${path}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900">My Profile</h1>
            <p className="text-sm text-gray-500">Manage your account settings</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Profile Hero Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"></div>
          <div className="px-6 pb-6 relative">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-12 mb-4">
              <div className="relative group">
                <div className="w-24 h-24 rounded-2xl border-4 border-white shadow-lg overflow-hidden bg-white">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                      <span className="text-2xl font-bold text-blue-600">{getInitials(user?.full_name)}</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={handlePhotoClick}
                  className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-md transition-colors"
                  title="Change photo"
                >
                  <Camera className="w-4 h-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,image/webp"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </div>
              
              <div className="flex-1 pt-2 sm:pb-1">
                <h2 className="text-xl font-bold text-gray-900">{user?.full_name}</h2>
                <div className="flex items-center gap-2 text-sm text-gray-500 mt-0.5">
                  <Mail className="w-3.5 h-3.5" />
                  <span>{user?.email}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold border border-blue-100">
                <Shield className="w-3.5 h-3.5" />
                {user?.role === 'student' ? 'Student Voter' : user?.role}
              </div>
            </div>

            {user?.unique_voter_id && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl">
                <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Voter ID</span>
                <span className="text-sm font-mono font-bold text-gray-900">{user.unique_voter_id}</span>
              </div>
            )}
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <User className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="font-bold text-gray-900">Personal Information</h3>
          </div>

          {saved && (
            <div className="mb-6 flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium">Profile updated successfully!</span>
            </div>
          )}
          
          {error && (
            <div className="mb-6 flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <User className="w-4 h-4 text-gray-400" />
                Full Name
              </label>
              <input
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
                placeholder="Enter your full name"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <BookOpen className="w-4 h-4 text-gray-400" />
                  Course
                </label>
                <input
                  name="course"
                  value={form.course}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
                  placeholder="e.g. Computer Science"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <GraduationCap className="w-4 h-4 text-gray-400" />
                  Year of Study
                </label>
                <select
                  name="year_of_study"
                  value={form.year_of_study}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 appearance-none cursor-pointer"
                >
                  <option value={1}>First Year</option>
                  <option value={2}>Second Year</option>
                  <option value={3}>Third Year</option>
                  <option value={4}>Fourth Year</option>
                </select>
              </div>
            </div>

            {/* Constituency + Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  Constituency
                </label>
                <select
                  name="constituency"
                  value={form.constituency}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 appearance-none cursor-pointer"
                >
                  <option value="" disabled>Select constituency</option>
                  {TURKANA_CONSTITUENCIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  Phone Number
                </label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
                  placeholder="+254 700 000 000"
                />
              </div>
            </div>

            {/* Read-only Info */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Admission Number</span>
                <span className="font-mono font-semibold text-gray-900">{user?.admission_number || '—'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Constituency</span>
                <span className="font-semibold text-gray-900">{user?.constituency || '—'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Account Status</span>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  user?.is_approved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${user?.is_approved ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                  {user?.is_approved ? 'Approved' : 'Pending Approval'}
                </span>
              </div>
            </div>

            {/* Uploaded Documents (National ID + Student ID) */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-400" />
                Uploaded Documents
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* National ID */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-3 py-2 bg-gray-100 border-b border-gray-100 text-xs font-semibold text-gray-600 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" /> National ID
                  </div>
                  {user?.national_id_photo ? (
                    <a 
                      href={getIdImageUrl(user.national_id_photo)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <img 
                        src={getIdImageUrl(user.national_id_photo)} 
                        alt="National ID"
                        className="w-full h-36 object-contain hover:opacity-90 transition-opacity bg-white"
                        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                      />
                      <div className="hidden h-36 items-center justify-center text-gray-400 text-xs">
                        Unable to load image
                      </div>
                    </a>
                  ) : (
                    <div className="h-36 flex flex-col items-center justify-center text-gray-400">
                      <FileText className="w-8 h-8 mb-2 opacity-40" />
                      <span className="text-xs">Not uploaded</span>
                    </div>
                  )}
                </div>

                {/* Student ID */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-3 py-2 bg-gray-100 border-b border-gray-100 text-xs font-semibold text-gray-600 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5" /> Student ID
                  </div>
                  {user?.student_id_photo ? (
                    <a 
                      href={getIdImageUrl(user.student_id_photo)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <img 
                        src={getIdImageUrl(user.student_id_photo)} 
                        alt="Student ID"
                        className="w-full h-36 object-contain hover:opacity-90 transition-opacity bg-white"
                        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                      />
                      <div className="hidden h-36 items-center justify-center text-gray-400 text-xs">
                        Unable to load image
                      </div>
                    </a>
                  ) : (
                    <div className="h-36 flex flex-col items-center justify-center text-gray-400">
                      <CreditCard className="w-8 h-8 mb-2 opacity-40" />
                      <span className="text-xs">Not uploaded</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-semibold shadow-sm shadow-blue-200 transition-all disabled:cursor-not-allowed active:scale-[0.98]"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving Changes...' : 'Save Changes'}
              </button>
              
              {saved && (
                <span className="text-sm text-green-600 font-medium animate-pulse">Saved!</span>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}