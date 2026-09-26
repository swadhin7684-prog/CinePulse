import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Play, Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { EmailVerificationScreen } from '../components/auth/EmailVerificationScreen';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState(null);

  const { login, loginWithGoogle, resendVerification } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      await login({ email, password });
      toast.success('Welcome back to CinePulse!');
      navigate(from, { replace: true });
    } catch (err) {
      // If email not verified on Login -> block + show same screen
      if (
        err.message === 'EMAIL_NOT_VERIFIED' ||
        err.code === 'auth/email-not-verified' ||
        err.message?.includes('EMAIL_NOT_VERIFIED')
      ) {
        setUnverifiedEmail({
          email: email.trim(),
          idToken: err.idToken,
          password,
        });
        return;
      }

      let msg = err.message || 'Login failed. Please check your credentials.';
      if (
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/user-not-found' ||
        msg.includes('invalid-credential') ||
        msg.includes('INVALID_LOGIN_CREDENTIALS') ||
        msg.includes('wrong-password') ||
        msg.includes('user-not-found')
      ) {
        msg = 'Invalid email or password.';
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'Too many attempts. Please try again in a few minutes.';
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      toast.success('Signed in with Google successfully!');
      navigate(from, { replace: true });
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user') {
        return;
      }
      let msg = err.message || 'Google sign-in failed. Please try again.';
      if (err.code === 'auth/unauthorized-domain' || msg.includes('unauthorized-domain')) {
        msg = `This domain (${window.location.hostname}) is not authorized in Firebase. Add it to Firebase Console > Authentication > Settings > Authorized domains.`;
      }
      toast.error(msg);
    } finally {
      setGoogleLoading(false);
    }
  };

  // If email is not verified on Login -> block + show the exact same screen
  if (unverifiedEmail) {
    return (
      <EmailVerificationScreen
        email={unverifiedEmail.email}
        onGoToLogin={() => setUnverifiedEmail(null)}
        onResendEmail={() => resendVerification(unverifiedEmail)}
        isFromLogin={true}
      />
    );
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-[#08090d] overflow-hidden">
      {/* Cinematic Ambient Background */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1920&q=80"
          alt="Cinema Background"
          className="w-full h-full object-cover filter brightness-[0.25] blur-sm scale-105"
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
            Sign in to resume watching on any screen
          </p>
        </div>

        {/* Login Glassmorphic Card */}
        <div className="glass-modal p-8 sm:p-10 rounded-3xl border border-white/10 shadow-2xl space-y-6">
          <h2 className="text-xl font-bold text-white tracking-wide">Sign In</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Email Address</label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3.5 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@cinepulse.io"
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-black/60 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="btn-primary w-full text-sm !py-3 font-bold mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  Authenticating...
                </>
              ) : (
                <>
                  Sign In
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
                Or continue with
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
                {/* Official Google 'G' Logo SVG */}
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

          {/* Register Prompt */}
          <div className="text-center text-xs text-slate-400 pt-2 border-t border-white/10">
            New to CinePulse?{' '}
            <Link to="/register" className="text-amber-400 hover:underline font-semibold">
              Create an account now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
