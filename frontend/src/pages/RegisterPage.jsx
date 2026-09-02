import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Vote, Eye, EyeOff, CheckCircle, Shield, User, BookOpen, 
  Calendar, Mail, Phone, Lock, ChevronDown, ChevronUp, AlertCircle,
  MapPin, Upload, FileImage, X
} from 'lucide-react';

const TURKANA_CONSTITUENCIES = [
  'Turkana North',
  'Turkana West',
  'Turkana Central',
  'Loima',
  'Turkana South',
  'Turkana East',
];

const VALID_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

export default function RegisterPage() {
  const [form, setForm] = useState({
    full_name: '',
    admission_number: '',
    course: '',
    year_of_study: 1,
    constituency: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // ID files
  const [nationalId, setNationalId] = useState(null);
  const [studentId, setStudentId] = useState(null);
  const [nationalIdPreview, setNationalIdPreview] = useState(null);
  const [studentIdPreview, setStudentIdPreview] = useState(null);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleFileChange = (type, file) => {
    setError('');
    if (!file) return;
    
    if (!VALID_IMAGE_TYPES.includes(file.type)) {
      setError(`${type === 'national' ? 'National' : 'Student'} ID must be an image (JPEG, PNG, WEBP)`);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError(`${type === 'national' ? 'National' : 'Student'} ID must be less than 5MB`);
      return;
    }

    if (type === 'national') {
      setNationalId(file);
      setNationalIdPreview(URL.createObjectURL(file));
    } else {
      setStudentId(file);
      setStudentIdPreview(URL.createObjectURL(file));
    }
  };

  const removeFile = (type) => {
    if (type === 'national') {
      setNationalId(null);
      setNationalIdPreview(null);
    } else {
      setStudentId(null);
      setStudentIdPreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.constituency) {
      setError('Please select your constituency.');
      return;
    }
    if (!nationalId) {
      setError('Please upload your National ID.');
      return;
    }
    if (!studentId) {
      setError('Please upload your Student ID.');
      return;
    }
    if (!agreedToTerms) {
      setError('You must agree to the Terms & Conditions to register.');
      return;
    }
    if (form.password !== form.confirm_password) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('full_name', form.full_name);
      formData.append('admission_number', form.admission_number);
      formData.append('course', form.course);
      formData.append('year_of_study', form.year_of_study);
      formData.append('constituency', form.constituency);
      formData.append('email', form.email);
      formData.append('phone', form.phone);
      formData.append('password', form.password);
      formData.append('national_id', nationalId);
      formData.append('student_id', studentId);

      await register(formData);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 4000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-tucusa-500 focus:border-transparent transition-all outline-none text-gray-900 placeholder-gray-400";
  const labelClass = "block text-sm font-semibold text-gray-700 mb-1.5";

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-tucusa-50 to-white px-4">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-10 text-center max-w-md w-full">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Registration Successful!</h2>
          <p className="text-gray-600 mb-2 leading-relaxed">
            Your account has been created successfully.
          </p>
          <p className="text-gray-500 text-sm mb-6">
            Please wait for admin approval before you can vote. You will receive your digital voter card once approved.
          </p>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mb-4 overflow-hidden">
            <div className="bg-tucusa-500 h-full rounded-full animate-[shrink_4s_linear_forwards]" style={{width: '100%'}} />
          </div>
          <p className="text-xs text-gray-400">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-tucusa-50/30 flex items-center justify-center px-4 py-12">
      <div className="fixed top-0 right-0 w-96 h-96 bg-tucusa-100 rounded-full mix-blend-multiply filter blur-3xl opacity-40 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-40 pointer-events-none" />

      <div className="w-full max-w-2xl relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4 group">
            <div className="w-10 h-10 bg-tucusa-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
              <Vote className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-2xl text-tucusa-900 tracking-tight">TUCUSA VOTE</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Your Account</h1>
          <p className="text-gray-500">Join the official TUCUSA digital voting platform</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8 md:p-10">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-700 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Row 1: Name + Admission */}
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input name="full_name" required placeholder="John Doe" value={form.full_name} onChange={handleChange} className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Admission Number</label>
                <div className="relative">
                  <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input name="admission_number" required placeholder="TUC/001/2026" value={form.admission_number} onChange={handleChange} className={inputClass} />
                </div>
              </div>
            </div>

            {/* Row 2: Course + Year */}
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>Course</label>
                <div className="relative">
                  <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input name="course" required placeholder="e.g. Computer Science" value={form.course} onChange={handleChange} className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Year of Study</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  <select name="year_of_study" value={form.year_of_study} onChange={handleChange} className={`${inputClass} appearance-none`}>
                    <option value={1}>Year 1</option>
                    <option value={2}>Year 2</option>
                    <option value={3}>Year 3</option>
                    <option value={4}>Year 4</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Row 3: Constituency + Phone */}
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>Constituency</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  <select name="constituency" required value={form.constituency} onChange={handleChange} className={`${inputClass} appearance-none`}>
                    <option value="" disabled>Select your constituency</option>
                    {TURKANA_CONSTITUENCIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className={labelClass}>Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type="tel" name="phone" required placeholder="+254 7XX XXX XXX" value={form.phone} onChange={handleChange} className={inputClass} />
                </div>
              </div>
            </div>

            {/* Row 4: Email */}
            <div>
              <label className={labelClass}>Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="email" name="email" required placeholder="student@tucusa.ac.ke" value={form.email} onChange={handleChange} className={inputClass} />
              </div>
            </div>

            {/* ID Documents Section */}
            <div className="border border-gray-200 rounded-xl p-5 bg-gray-50/50">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4" /> Verification Documents <span className="text-red-500">*</span>
              </h3>
              <div className="grid md:grid-cols-2 gap-5">
                {/* National ID */}
                <div>
                  <label className={labelClass}>National ID</label>
                  <div className="relative">
                    <div className={`w-full border border-dashed border-gray-300 rounded-xl bg-white p-4 transition-all hover:border-tucusa-400 ${nationalId ? 'border-tucusa-400 bg-tucusa-50/30' : ''}`}>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/jpg,image/webp"
                        onChange={(e) => handleFileChange('national', e.target.files[0])}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      {nationalIdPreview ? (
                        <div className="relative">
                          <img src={nationalIdPreview} alt="National ID Preview" className="w-full h-32 object-contain rounded-lg" />
                          <button
                            type="button"
                            onClick={() => removeFile('national')}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-sm hover:bg-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-xs text-gray-500 font-medium">Click to upload National ID</p>
                          <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WEBP (max 5MB)</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Student ID */}
                <div>
                  <label className={labelClass}>Student ID</label>
                  <div className="relative">
                    <div className={`w-full border border-dashed border-gray-300 rounded-xl bg-white p-4 transition-all hover:border-tucusa-400 ${studentId ? 'border-tucusa-400 bg-tucusa-50/30' : ''}`}>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/jpg,image/webp"
                        onChange={(e) => handleFileChange('student', e.target.files[0])}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      {studentIdPreview ? (
                        <div className="relative">
                          <img src={studentIdPreview} alt="Student ID Preview" className="w-full h-32 object-contain rounded-lg" />
                          <button
                            type="button"
                            onClick={() => removeFile('student')}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-sm hover:bg-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <FileImage className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-xs text-gray-500 font-medium">Click to upload Student ID</p>
                          <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WEBP (max 5MB)</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 5: Password + Confirm */}
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    name="password" 
                    required
                    placeholder="Min. 6 characters"
                    value={form.password} 
                    onChange={handleChange}
                    className={`${inputClass} pr-10`}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className={labelClass}>Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    name="confirm_password" 
                    required
                    placeholder="Re-enter password"
                    value={form.confirm_password} 
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Shield className="w-4 h-4" />
              <span>Your password must be at least 6 characters long.</span>
            </div>

            {/* Terms */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <button type="button" onClick={() => setShowTerms(!showTerms)} className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left">
                <span className="font-semibold text-gray-800 text-sm">Terms & Conditions</span>
                {showTerms ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
              </button>
              {showTerms && (
                <div className="p-4 bg-white max-h-48 overflow-y-auto text-xs text-gray-600 leading-relaxed space-y-2 border-t border-gray-100">
                  <p><strong>1. Eligibility:</strong> You must be a registered student of TUCUSA to use this platform.</p>
                  <p><strong>2. One Account:</strong> Each student is permitted only one account.</p>
                  <p><strong>3. Voter Card:</strong> Upon admin approval, you will receive a unique digital voter card.</p>
                  <p><strong>4. One Vote:</strong> You may cast only one vote per election.</p>
                  <p><strong>5. ID Verification:</strong> Your National ID and Student ID are required for verification and will be reviewed by admins.</p>
                  <p><strong>6. Data Privacy:</strong> Your personal information is stored securely.</p>
                  <p><strong>7. Admin Approval:</strong> Registration does not guarantee immediate voting rights.</p>
                </div>
              )}
            </div>

            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative flex items-center">
                <input type="checkbox" checked={agreedToTerms} onChange={(e) => { setAgreedToTerms(e.target.checked); setError(''); }} className="peer sr-only" />
                <div className="w-5 h-5 border-2 border-gray-300 rounded-md peer-checked:bg-tucusa-600 peer-checked:border-tucusa-600 transition-all flex items-center justify-center">
                  {agreedToTerms && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                </div>
              </div>
              <span className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors leading-tight">
                I have read and agree to the <button type="button" onClick={() => setShowTerms(true)} className="text-tucusa-600 font-semibold hover:underline">Terms & Conditions</button>.
              </span>
            </label>

            <button type="submit" disabled={loading || !agreedToTerms} className="w-full bg-tucusa-600 hover:bg-tucusa-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3.5 px-6 rounded-xl transition-all hover:shadow-lg hover:shadow-tucusa-200 hover:-translate-y-0.5 flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="text-tucusa-600 font-semibold hover:underline">Sign in here</Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          © {new Date().getFullYear()} Turkana Colleges University Students Association. All rights reserved.
        </p>
      </div>
    </div>
  );
}