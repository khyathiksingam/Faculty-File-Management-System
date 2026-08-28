import React, { useState, useEffect } from 'react';
import { 
  Building2, Lock, User, Eye, EyeOff, ArrowRight, ShieldCheck, 
  Mail, KeyRound, RotateCcw, CheckCircle2, AlertCircle, ArrowLeft,
  Sparkles, Check, UserCheck, PlusCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

export default function LoginPage() {
  const { login, loginWithGoogle, signup, collegeSettings } = useAuth();

  // Mode: 'login' | 'signup' | 'forgot_password' | 'otp_verify' | 'google_access'
  const [mode, setMode] = useState('login');

  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Signup form state
  const [signupFullName, setSignupFullName] = useState('');
  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  // Google Direct Access state
  const [googleEmail, setGoogleEmail] = useState('lingampallisaivarsha@gmail.com');
  const [googleName, setGoogleName] = useState('Lingampalli Sai Varsha');

  // Forgot password & OTP state
  const [resetEmailOrUser, setResetEmailOrUser] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [receivedOtpPreview, setReceivedOtpPreview] = useState('');
  const [targetEmail, setTargetEmail] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Countdown timer for Resend OTP
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const clearMessages = () => {
    setError('');
    setSuccessMessage('');
  };

  // ---------------- Handlers ----------------

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Please enter your username or email and password.');
      return;
    }

    setLoading(true);
    clearMessages();

    try {
      await login(username.trim(), password);
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please verify your username/email and password.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    if (!signupFullName.trim() || !signupUsername.trim() || !signupEmail.trim() || !signupPassword) {
      setError('All registration fields are required.');
      return;
    }

    if (signupPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    clearMessages();

    try {
      await signup({
        full_name: signupFullName.trim(),
        username: signupUsername.trim().toLowerCase(),
        email: signupEmail.trim().toLowerCase(),
        password: signupPassword
      });
      setSuccessMessage('Account created successfully! Welcome to FFMS.');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Google Direct Instant Login / Auto-Signup
  const handleGoogleDirectAccess = async (emailToUse, nameToUse) => {
    const finalEmail = (emailToUse || googleEmail || '').trim().toLowerCase();
    const finalName = (nameToUse || googleName || '').trim();

    if (!finalEmail) {
      setError('Please enter a valid Google Mail address.');
      return;
    }

    setLoading(true);
    clearMessages();

    try {
      await loginWithGoogle({
        email: finalEmail,
        full_name: finalName || finalEmail.split('@')[0]
      });
    } catch (err) {
      setError(err.message || 'Google authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!resetEmailOrUser.trim()) {
      setError('Please enter your username or email address.');
      return;
    }

    setLoading(true);
    clearMessages();

    try {
      const res = await api.post('/auth/forgot-password', {
        emailOrUsername: resetEmailOrUser.trim()
      });

      setTargetEmail(res.email || resetEmailOrUser.trim());
      setReceivedOtpPreview(res.otp || '');
      setSuccessMessage(res.message || `OTP sent to ${res.email}`);
      setResendCooldown(45);
      setMode('otp_verify');
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please check your email or username.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    clearMessages();

    try {
      const res = await api.post('/auth/forgot-password', {
        emailOrUsername: resetEmailOrUser.trim()
      });

      setReceivedOtpPreview(res.otp || '');
      setSuccessMessage(`New verification OTP sent to ${res.email}`);
      setResendCooldown(45);
    } catch (err) {
      setError(err.message || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtpAndReset = async (e) => {
    e.preventDefault();
    if (!otpCode.trim() || !newPassword || !confirmPassword) {
      setError('Please fill in all OTP and password fields.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    setLoading(true);
    clearMessages();

    try {
      const res = await api.post('/auth/reset-password', {
        emailOrUsername: resetEmailOrUser.trim(),
        otp: otpCode.trim(),
        newPassword: newPassword
      });

      setSuccessMessage(res.message || 'Password reset successfully! Please sign in with your new password.');
      setTimeout(() => {
        setMode('login');
        setPassword('');
        setUsername(resetEmailOrUser.trim());
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to verify OTP or reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-indigo-50/40 to-blue-50/50 p-4">
      <div className="w-full max-w-md">
        {/* Main Card */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-8 shadow-2xl backdrop-blur-xl text-left">
          {/* College Header */}
          <div className="text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl bg-slate-950 shadow-xl shadow-indigo-500/30 ring-2 ring-indigo-500/40">
              <img src="/logo.png" alt="FFMS VNR VJIET" className="h-full w-full object-cover" />
            </div>
            <h2 className="mt-4 text-xs font-extrabold uppercase tracking-wide text-indigo-900 line-clamp-2 px-2">
              {collegeSettings?.college_name || 'Vallurupalli Nageswara Rao Vignana Jyothi Institute of Engineering &Technology'}
            </h2>
            <h1 className="mt-1 text-xl font-extrabold text-slate-900">
              {collegeSettings?.system_name || 'Faculty File Management System'}
            </h1>
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-bold text-indigo-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Authorized Faculty & Admin Portal</span>
            </div>
          </div>

          {/* Success Banner */}
          {successMessage && (
            <div className="mt-5 rounded-2xl bg-emerald-50 p-3.5 text-xs font-semibold text-emerald-800 border border-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="mt-5 rounded-2xl bg-rose-50 p-3.5 text-xs font-medium text-rose-700 border border-rose-100 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* MODE 1: STANDARD LOGIN */}
          {mode === 'login' && (
            <div className="mt-6 space-y-4">
              {/* Google Mail Direct Sign In / Auto Sign-Up Button */}
              <button
                type="button"
                onClick={() => {
                  clearMessages();
                  setMode('google_access');
                }}
                className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white py-3 px-4 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 hover:border-indigo-300 hover:shadow-md active:scale-98 transition cursor-pointer"
              >
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Sign in / Sign up with Google Mail</span>
              </button>

              {/* Divider */}
              <div className="relative my-3 flex items-center justify-center">
                <div className="w-full border-t border-slate-200" />
                <span className="bg-white px-3 text-[11px] font-bold text-slate-400 uppercase">Or Sign In with Password</span>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    Username or Email (Gmail / @vnrvjiet.in)
                  </label>
                  <div className="relative mt-1.5">
                    <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. devika or yourname@gmail.com"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-2.5 pl-10 pr-3 text-xs text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        clearMessages();
                        setResetEmailOrUser(username);
                        setMode('forgot_password');
                      }}
                      className="text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative mt-1.5">
                    <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-2.5 pl-10 pr-10 text-xs text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-600 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-500/25 transition hover:from-blue-800 hover:to-indigo-700 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                >
                  {loading ? 'Authenticating...' : 'Sign In to FFMS'}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>

              {/* Toggle to Signup */}
              <div className="pt-2 text-center">
                <span className="text-xs text-slate-500">New Faculty member? </span>
                <button
                  type="button"
                  onClick={() => {
                    clearMessages();
                    setMode('signup');
                  }}
                  className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
                >
                  Create Faculty Account
                </button>
              </div>
            </div>
          )}

          {/* MODE 2: GOOGLE MAIL DIRECT ACCESS (SIGN IN / AUTO SIGN-UP) */}
          {mode === 'google_access' && (
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border border-blue-100 text-slate-800">
                <div className="flex items-center gap-2 font-black text-xs text-indigo-900">
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>Google Mail Direct Login & Auto-Registration</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1">
                  Enter your Google Mail. If your account exists, you will be signed in instantly. If you are new, your faculty account will be created automatically in 1 click!
                </p>
              </div>

              {/* 1-Tap Quick Profiles */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Quick 1-Tap Accounts
                </span>
                <div className="grid grid-cols-1 gap-2">
                  {/* Lingampalli Sai Varsha */}
                  <button
                    type="button"
                    onClick={() => handleGoogleDirectAccess('lingampallisaivarsha@gmail.com', 'Lingampalli Sai Varsha')}
                    disabled={loading}
                    className="flex items-center justify-between rounded-xl border border-indigo-200 bg-indigo-50/50 p-2.5 text-left hover:bg-indigo-100/70 active:scale-98 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-black text-white">
                        LS
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-900">Lingampalli Sai Varsha</p>
                        <p className="text-[10px] text-slate-500 font-mono">lingampallisaivarsha@gmail.com</p>
                      </div>
                    </div>
                    <span className="rounded-md bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white">
                      1-Tap Login
                    </span>
                  </button>

                  {/* Potta Devika */}
                  <button
                    type="button"
                    onClick={() => handleGoogleDirectAccess('p.devika@vnrvjiet.in', 'Potta Devika')}
                    disabled={loading}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-left hover:bg-slate-100 active:scale-98 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-700 text-xs font-black text-white">
                        PD
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-900">Mrs. Potta Devika</p>
                        <p className="text-[10px] text-slate-500 font-mono">p.devika@vnrvjiet.in (Admin)</p>
                      </div>
                    </div>
                    <span className="rounded-md bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                      1-Tap Login
                    </span>
                  </button>
                </div>
              </div>

              {/* Custom Google Email Input */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    Or Enter Any Google Email (@gmail.com or @vnrvjiet.in)
                  </label>
                  <input
                    type="email"
                    required
                    value={googleEmail}
                    onChange={(e) => setGoogleEmail(e.target.value)}
                    placeholder="e.g. yourname@gmail.com or name@vnrvjiet.in"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    Faculty Full Name
                  </label>
                  <input
                    type="text"
                    value={googleName}
                    onChange={(e) => setGoogleName(e.target.value)}
                    placeholder="e.g. Dr. Sai Varsha"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleGoogleDirectAccess()}
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-600 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-500/25 hover:from-blue-800 hover:to-indigo-700 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                >
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#ffffff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#ffffff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#ffffff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#ffffff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>{loading ? 'Authenticating...' : 'Sign In / Auto-Create Account'}</span>
                </button>
              </div>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    clearMessages();
                    setMode('login');
                  }}
                  className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-600 hover:text-indigo-600 mx-auto cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back to Password Login</span>
                </button>
              </div>
            </div>
          )}

          {/* MODE 3: SIGN UP */}
          {mode === 'signup' && (
            <div className="mt-6 space-y-4">
              {/* Google Fast Register Button */}
              <button
                type="button"
                onClick={() => {
                  clearMessages();
                  setMode('google_access');
                }}
                className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 active:scale-95 transition cursor-pointer"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Fast Sign Up with Google Mail</span>
              </button>

              <div className="relative my-3 flex items-center justify-center">
                <div className="w-full border-t border-slate-200" />
                <span className="bg-white px-3 text-[11px] font-bold text-slate-400 uppercase">Or Register with Form</span>
              </div>

              <form onSubmit={handleSignupSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    Full Name (with Designation)
                  </label>
                  <input
                    type="text"
                    required
                    value={signupFullName}
                    onChange={(e) => setSignupFullName(e.target.value)}
                    placeholder="e.g. Dr. B. Rajesh Kumar"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={signupUsername}
                    onChange={(e) => setSignupUsername(e.target.value)}
                    placeholder="e.g. rajeshkumar"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    Email Address (Gmail or @vnrvjiet.in)
                  </label>
                  <input
                    type="email"
                    required
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="e.g. yourname@gmail.com or name@vnrvjiet.in"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    Password (Min 6 chars)
                  </label>
                  <input
                    type="password"
                    required
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="Create a secure password"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-600 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-500/25 hover:from-blue-800 hover:to-indigo-700 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                >
                  {loading ? 'Creating Account...' : 'Register Account'}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    clearMessages();
                    setMode('login');
                  }}
                  className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-600 hover:text-indigo-600 mx-auto cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Already have an account? Sign In</span>
                </button>
              </div>
            </div>
          )}

          {/* MODE 4: FORGOT PASSWORD (REQUEST OTP) */}
          {mode === 'forgot_password' && (
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl bg-indigo-50/60 p-4 border border-indigo-100">
                <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
                  <Mail className="h-4 w-4 text-indigo-600" />
                  <span>Google Mail / Mailbox OTP Verification</span>
                </div>
                <p className="text-[11px] text-indigo-700 mt-1">
                  Enter your Username or Email address (Gmail @gmail.com or @vnrvjiet.in). We will send a 6-digit OTP code to verify your account.
                </p>
              </div>

              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    Username or Email (Gmail / @vnrvjiet.in)
                  </label>
                  <div className="relative mt-1.5">
                    <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={resetEmailOrUser}
                      onChange={(e) => setResetEmailOrUser(e.target.value)}
                      placeholder="Enter your username or email"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-2.5 pl-10 pr-3 text-xs text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-600 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-500/25 hover:from-blue-800 hover:to-indigo-700 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                >
                  {loading ? 'Generating OTP...' : 'Send Verification OTP'}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    clearMessages();
                    setMode('login');
                  }}
                  className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-600 hover:text-indigo-600 mx-auto cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back to Sign In</span>
                </button>
              </div>
            </div>
          )}

          {/* MODE 5: VERIFY OTP & SET NEW PASSWORD */}
          {mode === 'otp_verify' && (
            <div className="mt-6 space-y-4">
              {/* Simulated Mailbox Notification Banner */}
              {receivedOtpPreview && (
                <div className="rounded-2xl bg-amber-50 p-3.5 border border-amber-200 text-amber-900">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-amber-600" />
                      Google Mail / Mailbox OTP Code:
                    </span>
                    <span className="font-mono text-sm font-black tracking-widest bg-amber-200/80 px-2 py-0.5 rounded-md text-amber-950">
                      {receivedOtpPreview}
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-700 mt-1">
                    Sent to: <span className="font-bold underline">{targetEmail}</span> (Valid for 15 minutes).
                  </p>
                </div>
              )}

              <form onSubmit={handleVerifyOtpAndReset} className="space-y-3.5">
                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700">
                      Enter 6-Digit OTP
                    </label>
                    <button
                      type="button"
                      disabled={resendCooldown > 0 || loading}
                      onClick={handleResendOtp}
                      className="text-[11px] font-bold text-indigo-600 hover:underline disabled:opacity-50 cursor-pointer"
                    >
                      {resendCooldown > 0 ? `Resend OTP (${resendCooldown}s)` : 'Resend OTP'}
                    </button>
                  </div>
                  <div className="relative mt-1.5">
                    <KeyRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="6-digit code e.g. 482910"
                      className="w-full font-mono tracking-widest rounded-xl border border-slate-200 bg-slate-50/80 py-2.5 pl-10 pr-3 text-xs text-slate-900 font-bold focus:border-indigo-600 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    New Password (Min 6 chars)
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new strong password"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-700 via-teal-600 to-emerald-600 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-500/25 hover:from-emerald-800 hover:to-teal-700 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                >
                  {loading ? 'Verifying...' : 'Reset Password & Proceed'}
                  <CheckCircle2 className="h-4 w-4" />
                </button>
              </form>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    clearMessages();
                    setMode('login');
                  }}
                  className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-600 hover:text-indigo-600 mx-auto cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Cancel & Back to Sign In</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="mt-4 text-center text-xs font-medium text-slate-400">
          VNR VJIET • Secure College Cloud Repository
        </p>
      </div>
    </div>
  );
}
