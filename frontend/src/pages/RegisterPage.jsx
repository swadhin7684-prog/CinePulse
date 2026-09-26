import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Play, Lock, Mail, User, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { EmailVerificationScreen } from '../components/auth/EmailVerificationScreen';

export const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [verificationPending, setVerificationPending] = useState(null);

  const { register, loginWithGoogle, resendVerification } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      toast.success('Welcome to CinePulse!');
      navigate('/');
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user') {
        return;
      }
      toast.error(err.message || 'Google sign-in failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, email, password, confirmPassword } = formData;

    if (!name || !email || !password || !confirmPassword) {
      toast.error('All fields are required');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const result = await register({ name, email, password, confirmPassword });
      toast.success('Account created! Verification email sent.');
      setVerificationPending({
        email: email.trim(),
        idToken: result?.idToken,
        password,
      });
    } catch (err) {
      let msg = err.message || 'Registration failed';
      if (
        err.code === 'auth/email-already-in-use' ||
        msg.includes('email-already-in-use') ||
        msg.includes('EMAIL_EXISTS')
      ) {
        msg = 'An account with this email already exists.';
      } else if (err.code === 'auth/weak-password' || msg.includes('weak-password')) {
        msg = 'Password must be at least 6 characters.';
      } else if (err.code === 'auth/invalid-email' || msg.includes('invalid-email')) {
        msg = 'Please enter a valid email address.';
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // If registration succeeded: Show the verification screen immediately (No auto-login!)
  if (verificationPending) {
    return (
      <EmailVerificationScreen
        email={verificationPending.email}
        onGoToLogin={() => navigate('/login')}
        onResendEmail={() => resendVerification(verificationPending)}
        isFromLogin={false}
      />
    );
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-[#08090d] overflow-hidden">
      {/* Cinematic Ambient Background */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1920&q=80"
          alt="Cinema Background"
          className="w-full h-full object-cover filter brightness-[0.22] blur-sm scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#08090d] via-[#08090d]/80 to-transparent"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8 space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <Play className="w-5 h-5 text-black fill-black ml-0.5" />
            </div>
            <span className="text-3xl font-black tracking-wider text-white">
              CINE<span className="text-amber-500">PULSE</span>
            </span>
          </Link>
          <p className="text-slate-400 text-xs sm:text-sm">
            Create your account to unlock personalized cinematic streams
          </p>
        </div>

        {/* Register Glassmorphic Card */}
        <div className="glass-modal p-8 sm:p-10 rounded-3xl border border-white/10 shadow-2xl space-y-6">
          <h2 className="text-xl font-bold text-white tracking-wide">Get Started Free</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Your Full Name</label>
              <div className="relative flex items-center">
                <User className="absolute left-3.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Alex Mercer"
                  required
                  className="w-full bg-black/60 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500 transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Email Address</label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3.5 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="alex@cinepulse.io"
                  required
                  className="w-full bg-black/60 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Password</label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Minimum 6 characters"
                  required
                  minLength={6}
                  className="w-full bg-black/60 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500 transition-all"
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Confirm Password</label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter password"
                  required
                  className="w-full bg-black/60 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-sm !py-3 font-bold mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  Creating Account...
                </>
              ) : (
                <>
                  Complete Registration
                  <ArrowRight className="w-4 h-4 stroke-[3]" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#0e1017] px-3 text-slate-400 font-medium tracking-wider">
                Or sign up with
              </span>
            </div>
          </div>

          {/* Continue with Google Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
            className="w-full py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-white font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-3 shadow-sm hover:shadow-md hover:border-white/30 group active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {googleLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                <span className="text-slate-300">Connecting to Google...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span className="tracking-wide text-slate-200 group-hover:text-white transition-colors">
                  Continue with Google
                </span>
              </>
            )}
          </button>

          {/* Login prompt */}
          <div className="text-center text-xs text-slate-400 pt-2 border-t border-white/10">
            Already have an account?{' '}
            <Link to="/login" className="text-amber-400 hover:underline font-semibold">
              Sign In here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
