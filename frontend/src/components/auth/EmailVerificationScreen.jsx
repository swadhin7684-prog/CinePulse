import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, MailCheck, ArrowRight, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

export const EmailVerificationScreen = ({
  email,
  onGoToLogin,
  onResendEmail,
  isFromLogin = false,
}) => {
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setResendStatus(null);
    try {
      if (onResendEmail) {
        await onResendEmail();
      }
      setResendStatus({
        type: 'success',
        message: 'A fresh verification email has been sent! Please check your inbox and spam folder.',
      });
      setCooldown(60);
    } catch (err) {
      setResendStatus({
        type: 'error',
        message: err.message || 'Failed to resend email. Please try again in a few moments.',
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-[#08090d] overflow-hidden">
      {/* Cinematic Ambient Background */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1920&q=80"
          alt="Cinema Background"
          className="w-full h-full object-cover filter brightness-[0.2] blur-sm scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#08090d] via-[#08090d]/85 to-transparent"></div>
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
        </div>

        {/* Verification Modal Card */}
        <div className="glass-modal p-8 sm:p-10 rounded-3xl border border-white/10 shadow-2xl text-center space-y-6">
          {/* Animated Mail Icon */}
          <div className="relative mx-auto w-16 h-16">
            <div className="absolute inset-0 rounded-2xl bg-amber-500/20 blur-xl animate-pulse"></div>
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-amber-400/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/20">
              <MailCheck className="w-8 h-8" />
            </div>
          </div>

          {/* Heading requested by user */}
          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-white tracking-wide">
              Check your email and verify, then login
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              We sent a verification link to{' '}
              <span className="text-amber-400 font-semibold break-all">{email}</span>.
              Please verify your email address to activate your CinePulse account.
            </p>
          </div>

          {/* Alert / Notice Box */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-400 text-left space-y-1">
            <div className="flex items-center gap-2 text-slate-200 font-medium">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              <span>Can't find the email?</span>
            </div>
            <p className="pl-5 text-slate-400">
              Check your Spam, Junk, or Promotions folder. It typically arrives in less than a minute.
            </p>
          </div>

          {/* Resend Status Message */}
          {resendStatus && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 text-left ${
                resendStatus.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                  : 'bg-red-500/10 border border-red-500/30 text-red-300'
              }`}
            >
              {resendStatus.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
              )}
              <span>{resendStatus.message}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            {/* Login button */}
            <button
              type="button"
              onClick={onGoToLogin}
              className="btn-primary w-full text-sm !py-3.5 font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
            >
              <span>Login</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>

            {/* Resend Verification Email button */}
            <button
              type="button"
              onClick={handleResend}
              disabled={cooldown > 0 || resending}
              className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin text-amber-400' : ''}`} />
              {resending ? (
                'Sending verification email...'
              ) : cooldown > 0 ? (
                `Resend Email in ${cooldown}s`
              ) : (
                'Resend Verification Email'
              )}
            </button>
          </div>

          {/* Switch Account link */}
          <div className="text-center text-xs text-slate-500 pt-2 border-t border-white/10">
            {isFromLogin ? (
              <>
                Need to create a new account?{' '}
                <Link to="/register" className="text-amber-400 hover:underline font-semibold">
                  Sign Up here
                </Link>
              </>
            ) : (
              <>
                Already verified?{' '}
                <button
                  type="button"
                  onClick={onGoToLogin}
                  className="text-amber-400 hover:underline font-semibold ml-1 inline"
                >
                  Proceed to Login
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
