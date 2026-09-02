import { Link } from 'react-router-dom';
import { Vote, Shield, Users, BarChart3, ChevronRight, Fingerprint, Lock, Zap } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-gray-100 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-tucusa-600 rounded-lg flex items-center justify-center">
                <Vote className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-tucusa-900 tracking-tight">TUCUSA VOTE</span>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/login" className="hidden sm:block text-gray-600 hover:text-tucusa-700 font-medium px-4 py-2 transition-colors">
                Sign In
              </Link>
              <Link to="/register" className="bg-tucusa-600 hover:bg-tucusa-700 text-white font-semibold px-5 py-2.5 rounded-lg transition-all hover:shadow-lg hover:shadow-tucusa-200">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 bg-gradient-to-br from-tucusa-50 via-white to-blue-50" />
        <div className="absolute top-20 right-0 w-96 h-96 bg-tucusa-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-tucusa-50 border border-tucusa-100 text-tucusa-700 text-sm font-medium mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tucusa-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-tucusa-500" />
              </span>
              Official Voting Platform for TUCUSA
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 tracking-tight leading-tight mb-6">
              Your Voice, Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-tucusa-600 to-blue-600">Vote</span>, Your Future
            </h1>
            
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
              The secure, transparent, and modern digital voting platform built exclusively for 
              Turkana Colleges University Students Association members.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link 
                to="/register" 
                className="group w-full sm:w-auto bg-tucusa-600 hover:bg-tucusa-700 text-white text-lg font-semibold px-8 py-4 rounded-xl transition-all hover:shadow-xl hover:shadow-tucusa-200 hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                Register to Vote
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link 
                to="/login" 
                className="w-full sm:w-auto bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200 hover:border-tucusa-300 text-lg font-semibold px-8 py-4 rounded-xl transition-all hover:shadow-lg flex items-center justify-center"
              >
                Already a Member? Sign In
              </Link>
            </div>

            {/* Trust badges */}
            <div className="mt-12 pt-8 border-t border-gray-200/60">
              <p className="text-sm text-gray-500 mb-4">Trusted by Turkana Colleges Students</p>
              <div className="flex justify-center gap-8 text-gray-400">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  <span className="text-sm font-medium">Bank-Grade Security</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  <span className="text-sm font-medium">End-to-End Encrypted</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  <span className="text-sm font-medium">Real-Time Results</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-tucusa-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '100%', label: 'Secure Voting' },
              { value: '1', label: 'Vote Per Student' },
              { value: '24/7', label: 'Platform Access' },
              { value: '0', label: 'Paper Waste' },
            ].map((stat, i) => (
              <div key={i} className="space-y-1">
                <div className="text-3xl md:text-4xl font-bold text-white">{stat.value}</div>
                <div className="text-tucusa-200 text-sm font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Vote with Confidence
            </h2>
            <p className="text-lg text-gray-600">
              A complete digital voting experience designed for transparency, security, and ease of use.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: 'Secure & Anonymous',
                desc: 'JWT-secured authentication with bcrypt password hashing. Your vote is anonymous and tamper-proof.',
                color: 'bg-emerald-50 text-emerald-600',
              },
              {
                icon: Fingerprint,
                title: 'Digital Voter Card',
                desc: 'Every approved student receives a unique TUCUSA-VOTE ID card. One student, one card, one vote.',
                color: 'bg-tucusa-50 text-tucusa-600',
              },
              {
                icon: BarChart3,
                title: 'Live Results',
                desc: 'Watch election results update in real-time with beautiful bar charts and percentage breakdowns.',
                color: 'bg-violet-50 text-violet-600',
              },
              {
                icon: Users,
                title: 'Student Dashboard',
                desc: 'View your voter card, active elections, candidate profiles, and announcements all in one place.',
                color: 'bg-amber-50 text-amber-600',
              },
              {
                icon: Lock,
                title: 'One Vote Guarantee',
                desc: 'Enforced at the database level. No double voting, no proxy voting, no exceptions.',
                color: 'bg-rose-50 text-rose-600',
              },
              {
                icon: Zap,
                title: 'Instant Confirmation',
                desc: 'Receive immediate confirmation after casting your vote. No ambiguity, no waiting.',
                color: 'bg-cyan-50 text-cyan-600',
              },
            ].map((feature, i) => (
              <div 
                key={i} 
                className="group bg-white rounded-2xl p-8 border border-gray-100 hover:border-tucusa-200 hover:shadow-xl hover:shadow-tucusa-100/50 transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`w-14 h-14 ${feature.color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-lg text-gray-600">Four simple steps from registration to results.</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 relative">
            {/* Connecting line (desktop only) */}
            <div className="hidden md:block absolute top-12 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-tucusa-200 via-tucusa-400 to-tucusa-600" />

            {[
              { step: '01', title: 'Register', desc: 'Sign up with your student details and await admin approval.' },
              { step: '02', title: 'Get Verified', desc: 'Receive your unique digital voter card upon approval.' },
              { step: '03', title: 'Cast Your Vote', desc: 'Browse candidates, read manifestos, and vote securely.' },
              { step: '04', title: 'View Results', desc: 'Watch live results roll in after voting closes.' },
            ].map((item, i) => (
              <div key={i} className="relative text-center">
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-tucusa-500 to-tucusa-700 rounded-2xl flex items-center justify-center shadow-lg shadow-tucusa-200 mb-6 rotate-3 hover:rotate-0 transition-transform duration-300">
                  <span className="text-2xl font-bold text-white">{item.step}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed max-w-xs mx-auto">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-tucusa-600 to-blue-700" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full -ml-20 -mb-20 blur-3xl" />
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Ready to Make Your Voice Heard?
          </h2>
          <p className="text-xl text-tucusa-100 mb-10 max-w-2xl mx-auto">
            Join thousands of TUCUSA members who are shaping the future of student leadership through secure digital voting.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/register" 
              className="bg-white text-tucusa-700 hover:bg-gray-100 font-bold text-lg px-10 py-4 rounded-xl transition-all hover:shadow-2xl hover:-translate-y-0.5"
            >
              Create Your Account
            </Link>
            <Link 
              to="/login" 
              className="bg-tucusa-500/30 hover:bg-tucusa-500/50 text-white border-2 border-white/30 hover:border-white/50 font-bold text-lg px-10 py-4 rounded-xl transition-all backdrop-blur-sm"
            >
              Sign In to Vote
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-tucusa-600 rounded-lg flex items-center justify-center">
                <Vote className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg text-white">TUCUSA VOTE</span>
            </div>
            <div className="flex gap-8 text-sm">
              <Link to="/login" className="hover:text-white transition-colors">Student Login</Link>
              <Link to="/register" className="hover:text-white transition-colors">Register</Link>
              <span className="hover:text-white transition-colors cursor-pointer">Help Center</span>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm">
            © {new Date().getFullYear()} Turkana Colleges University Students Association. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}