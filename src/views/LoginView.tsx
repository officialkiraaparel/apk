import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  Phone,
  Shield,
  ShieldCheck,
  Sparkles,
  UserPlus,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Role } from '../types';
import { KIRA_LOGO_URL } from '../utils/constants';
import { getAuthenticatedGoogleUser, requestGoogleAccessToken } from '../services/googleSheetsService';

export const LoginView: React.FC<{ onLoginSuccess: () => void }> = ({ onLoginSuccess }) => {
  const { login, registerUser, users, settings } = useApp();

  // Navigation / View Mode: 'login' | 'register' | 'forgot'
  const [viewMode, setViewMode] = useState<'login' | 'register' | 'forgot'>('login');

  // Login Form States (Empty by default for security)
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  // Register Form States
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regRole, setRegRole] = useState<Role>('marketing');
  const [regNotes, setRegNotes] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');
  const [regSuccessMessage, setRegSuccessMessage] = useState('');

  // Forgot Password Flow States
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStep, setForgotStep] = useState<'input' | 'sent'>('input');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resetSuccessMessage, setResetSuccessMessage] = useState('');

  // Resend cooldown timer
  useEffect(() => {
    let timer: any;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    const inputVal = usernameOrEmail.trim();
    if (!inputVal) {
      setErrorMessage('Please enter your username or email address.');
      setIsLoading(false);
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      setIsLoading(false);
      return;
    }

    setTimeout(() => {
      const res = login(inputVal, password);
      setIsLoading(false);
      if (res.success) {
        onLoginSuccess();
      } else {
        setErrorMessage(res.message || 'Incorrect username or password.');
      }
    }, 350);
  };

  const handleGoogleSignIn = async () => {
    setSocialLoading('google');
    setErrorMessage('');
    try {
      await requestGoogleAccessToken();
      const googleUser = getAuthenticatedGoogleUser();
      if (googleUser && googleUser.email) {
        const res = login(googleUser.email);
        if (res.success) {
          onLoginSuccess();
          return;
        } else {
          setErrorMessage(res.message || 'Akun Google Anda belum terdaftar sebagai staf atau pengguna aktif.');
        }
      } else {
        setErrorMessage('Tidak dapat mengambil data akun Google. Silakan login menggunakan email & password.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Google Sign-in dibatalkan atau tidak dapat diselesaikan.');
    } finally {
      setSocialLoading(null);
    }
  };

  const handleAppleSignIn = () => {
    setSocialLoading('apple');
    setErrorMessage('');
    setTimeout(() => {
      setSocialLoading(null);
      setErrorMessage('Apple Sign-in memerlukan sinkronisasi domain web. Silakan gunakan email & password akun Anda.');
    }, 450);
  };

  // Handle Registration
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegSuccessMessage('');

    if (!regName.trim()) {
      setRegError('Please enter your full name.');
      return;
    }
    if (!regEmail.trim()) {
      setRegError('Please enter a valid email address.');
      return;
    }
    if (regPassword.length < 6) {
      setRegError('Password must be at least 6 characters.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setRegError('Passwords do not match.');
      return;
    }

    setRegLoading(true);

    setTimeout(() => {
      setRegLoading(false);
      const res = registerUser({
        name: regName,
        email: regEmail,
        password: regPassword,
        phone: regPhone,
        requestedRole: regRole,
        notes: regNotes,
      });

      if (res.success) {
        setRegSuccessMessage(res.message);
        setUsernameOrEmail(regEmail);
        setPassword(regPassword);
        // Reset fields
        setRegName('');
        setRegEmail('');
        setRegPhone('');
        setRegPassword('');
        setRegConfirmPassword('');
        setRegNotes('');
      } else {
        setRegError(res.message);
      }
    }, 400);
  };

  // Forgot Password: Send Reset Email / OTP
  const handleSendResetEmail = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setForgotError('');

    const targetEmail = forgotEmail.trim().toLowerCase();
    if (!targetEmail) {
      setForgotError('Please enter your registered email address.');
      return;
    }

    setForgotLoading(true);

    setTimeout(() => {
      setForgotLoading(false);
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(code);
      setForgotStep('sent');
      setResendCooldown(30);
    }, 500);
  };

  // Forgot Password: Submit New Password
  const handleSaveNewPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');

    if (enteredOtp.trim() !== generatedOtp.trim()) {
      setForgotError('Invalid verification code (OTP). Please check and try again.');
      return;
    }

    if (newPassword.length < 6) {
      setForgotError('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setForgotError('Passwords do not match.');
      return;
    }

    setResetSuccessMessage('Password reset successfully! You can now sign in with your new password.');
    setUsernameOrEmail(forgotEmail);
    setPassword(newPassword);
    setViewMode('login');
    setForgotStep('input');
    setForgotEmail('');
    setEnteredOtp('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col justify-center items-center py-10 px-4 text-slate-100 font-sans selection:bg-[#1f6feb] selection:text-white">
      {/* Brand Logo & Header */}
      <div className="w-full max-w-[340px] sm:max-w-[360px] flex flex-col items-center mb-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-900 to-black p-2 border border-[#30363d] shadow-lg flex items-center justify-center mb-3">
          <img
            src={settings.logoUrl || KIRA_LOGO_URL}
            alt="Kira Apparel Logo"
            className="w-full h-full object-contain"
            referrerPolicy="no-referrer"
            onError={e => {
              (e.currentTarget as HTMLImageElement).src = KIRA_LOGO_URL;
            }}
          />
        </div>

        <h1 className="text-xl font-bold tracking-tight text-white font-['Outfit',sans-serif]">
          {settings.companyName || 'Kira Apparel'}
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          {viewMode === 'login' && 'Sign in to access production & orders'}
          {viewMode === 'register' && 'Create your official staff / client account'}
          {viewMode === 'forgot' && 'Reset your password'}
        </p>
      </div>

      {/* Main Container Card (GitHub Dark Style) */}
      <div className="w-full max-w-[340px] sm:max-w-[360px] bg-[#161b22] border border-[#30363d] rounded-xl p-5 sm:p-6 shadow-2xl">
        
        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* Reset Success Alert */}
        {resetSuccessMessage && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs rounded-lg flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{resetSuccessMessage}</span>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 1: SIGN IN (MATCHING USER SCREENSHOT)              */}
        {/* ======================================================== */}
        {viewMode === 'login' && (
          <div>
            <form onSubmit={handleSignIn} className="space-y-4">
              {/* Username or email address */}
              <div>
                <label
                  htmlFor="login-username-or-email"
                  className="block text-sm font-normal text-slate-200 mb-1.5"
                >
                  Username or email address
                </label>
                <input
                  id="login-username-or-email"
                  type="text"
                  value={usernameOrEmail}
                  onChange={e => setUsernameOrEmail(e.target.value)}
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-1.5 text-white text-sm focus:outline-none focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff] transition-all placeholder-slate-600"
                  placeholder="Enter email or username"
                  autoComplete="username"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="login-password-input"
                    className="block text-sm font-normal text-slate-200"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    id="forgot-password-link"
                    onClick={() => {
                      setForgotEmail(usernameOrEmail);
                      setForgotError('');
                      setForgotStep('input');
                      setViewMode('forgot');
                    }}
                    className="text-xs text-[#58a6ff] hover:underline transition-all"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="login-password-input"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-1.5 pr-9 text-white text-sm focus:outline-none focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff] transition-all placeholder-slate-600"
                    placeholder="Enter password"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2 p-0.5 text-slate-400 hover:text-slate-200 transition-colors"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Sign in Button (Solid Green #238636 like GitHub) */}
              <button
                type="submit"
                id="sign-in-btn"
                disabled={isLoading}
                className="w-full py-1.5 px-3 bg-[#238636] hover:bg-[#2ea043] active:bg-[#238636] text-white font-medium text-sm rounded-md shadow-sm transition-colors mt-4 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isLoading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <span>Sign in</span>
                )}
              </button>
            </form>

            {/* Divider "or" */}
            <div className="relative my-4 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#30363d]" />
              </div>
              <div className="relative bg-[#161b22] px-3 text-xs text-slate-400">
                or
              </div>
            </div>

            {/* Social Logins */}
            <div className="space-y-2">
              {/* Continue with Google */}
              <button
                type="button"
                id="continue-with-google-btn"
                onClick={handleGoogleSignIn}
                disabled={socialLoading !== null}
                className="w-full flex items-center justify-center gap-2.5 py-1.5 px-3 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-white font-medium text-sm rounded-md transition-colors cursor-pointer disabled:opacity-60"
              >
                {socialLoading === 'google' ? (
                  <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>Continue with Google</span>
              </button>

              {/* Continue with Apple */}
              <button
                type="button"
                id="continue-with-apple-btn"
                onClick={handleAppleSignIn}
                disabled={socialLoading !== null}
                className="w-full flex items-center justify-center gap-2.5 py-1.5 px-3 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-white font-medium text-sm rounded-md transition-colors cursor-pointer disabled:opacity-60"
              >
                {socialLoading === 'apple' ? (
                  <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 170 170">
                    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.66-7.83-11.89-14.36-6.19-9.58-11.08-20.57-14.67-32.96-3.59-12.39-5.39-24.16-5.39-35.31 0-14.72 3.65-27.18 10.95-37.38 7.3-10.2 16.48-15.35 27.53-15.46 5.49 0 11.58 1.48 18.27 4.44 6.69 2.96 11.05 4.49 13.08 4.58 1.63 0 6.16-1.58 13.59-4.73 7.43-3.15 13.99-4.47 19.68-3.96 15.01 1.19 26.65 6.84 34.91 16.96-13.38 8.15-19.92 19.45-19.62 33.91.29 11.2 4.42 20.65 12.38 28.36 7.97 7.71 17.51 12.08 28.64 13.11-2.45 7.42-5.54 15.03-9.27 22.84zM119.22 33.39c0-7.39 2.66-14.38 7.98-20.97 5.32-6.59 11.96-10.73 19.92-12.42.54 1.41.81 2.88.81 4.41 0 7.39-2.77 14.54-8.31 21.46-5.54 6.92-12.28 11.05-20.21 12.38-.06-1.63-.19-3.25-.19-4.86z" />
                  </svg>
                )}
                <span>Continue with Apple</span>
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 2: REGISTER NEW ACCOUNT (GITHUB DARK STYLE)         */}
        {/* ======================================================== */}
        {viewMode === 'register' && (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">New Account Registration</span>
              <button
                type="button"
                onClick={() => setViewMode('login')}
                className="text-xs text-[#58a6ff] hover:underline flex items-center gap-1"
              >
                <ArrowLeft className="w-3 h-3" /> Back
              </button>
            </div>

            {regError && (
              <div className="mb-3 p-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-md">
                {regError}
              </div>
            )}

            {regSuccessMessage ? (
              <div className="py-4 text-center space-y-3">
                <div className="w-10 h-10 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">{regSuccessMessage}</p>
                <button
                  type="button"
                  onClick={() => setViewMode('login')}
                  className="w-full py-1.5 bg-[#238636] hover:bg-[#2ea043] text-white font-medium text-xs rounded-md"
                >
                  Proceed to Sign in
                </button>
              </div>
            ) : (
              <form onSubmit={handleRegister} className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={regName}
                    onChange={e => setRegName(e.target.value)}
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-1.5 text-white text-xs focus:outline-none focus:border-[#58a6ff]"
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-1.5 text-white text-xs focus:outline-none focus:border-[#58a6ff]"
                    placeholder="name@kiraapparel.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1">Role / Access Division</label>
                  <select
                    value={regRole}
                    onChange={e => setRegRole(e.target.value as Role)}
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-1.5 text-white text-xs focus:outline-none focus:border-[#58a6ff]"
                  >
                    <option value="marketing">💼 Marketing Staff (Input Orders & Mockups)</option>
                    <option value="produksi">🏭 Production Staff (Cutting, Sewing, QC)</option>
                    <option value="admin">🛡️ Operational Admin (Finance & SPK)</option>
                    <option value="client">👤 Client (Portal Tracking & Approval)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Password</label>
                    <input
                      type="password"
                      value={regPassword}
                      onChange={e => setRegPassword(e.target.value)}
                      className="w-full bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-1.5 text-white text-xs focus:outline-none focus:border-[#58a6ff]"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Confirm</label>
                    <input
                      type="password"
                      value={regConfirmPassword}
                      onChange={e => setRegConfirmPassword(e.target.value)}
                      className="w-full bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-1.5 text-white text-xs focus:outline-none focus:border-[#58a6ff]"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1">WhatsApp Phone (Optional)</label>
                  <input
                    type="text"
                    value={regPhone}
                    onChange={e => setRegPhone(e.target.value)}
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-1.5 text-white text-xs focus:outline-none focus:border-[#58a6ff]"
                    placeholder="08123456789"
                  />
                </div>

                <button
                  type="submit"
                  disabled={regLoading}
                  className="w-full py-1.5 mt-2 bg-[#238636] hover:bg-[#2ea043] text-white font-medium text-xs rounded-md transition-colors"
                >
                  {regLoading ? 'Registering...' : 'Create Account'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 3: FORGOT PASSWORD                                  */}
        {/* ======================================================== */}
        {viewMode === 'forgot' && (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Reset Password</span>
              <button
                type="button"
                onClick={() => setViewMode('login')}
                className="text-xs text-[#58a6ff] hover:underline flex items-center gap-1"
              >
                <ArrowLeft className="w-3 h-3" /> Sign in
              </button>
            </div>

            {forgotError && (
              <div className="mb-3 p-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-md">
                {forgotError}
              </div>
            )}

            {forgotStep === 'input' && (
              <form onSubmit={handleSendResetEmail} className="space-y-3">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Enter your email address and we'll generate a verification code to reset your password.
                </p>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Email address</label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-1.5 text-white text-xs focus:outline-none focus:border-[#58a6ff]"
                    placeholder="name@kiraapparel.com"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-1.5 bg-[#238636] hover:bg-[#2ea043] text-white font-medium text-xs rounded-md transition-colors"
                >
                  {forgotLoading ? 'Sending...' : 'Send OTP Code'}
                </button>
              </form>
            )}

            {forgotStep === 'sent' && (
              <form onSubmit={handleSaveNewPassword} className="space-y-3">
                <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/30 rounded-md text-xs text-indigo-200">
                  <span>Verification code sent: </span>
                  <span className="font-mono font-bold text-white tracking-widest">{generatedOtp}</span>
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Enter 6-digit Code</label>
                  <input
                    type="text"
                    value={enteredOtp}
                    onChange={e => setEnteredOtp(e.target.value)}
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-1.5 text-white text-xs font-mono text-center tracking-widest focus:outline-none focus:border-[#58a6ff]"
                    placeholder="123456"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-1.5 text-white text-xs focus:outline-none focus:border-[#58a6ff]"
                    placeholder="••••••••"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-1.5 text-white text-xs focus:outline-none focus:border-[#58a6ff]"
                    placeholder="••••••••"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-1.5 bg-[#238636] hover:bg-[#2ea043] text-white font-medium text-xs rounded-md transition-colors"
                >
                  Update Password & Sign In
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Bottom Container: "New to Kira Apparel? Create an account" */}
      {viewMode === 'login' && (
        <div className="w-full max-w-[340px] sm:max-w-[360px] mt-4 border border-[#30363d] rounded-md p-3 text-center text-xs text-slate-300">
          <span>New to Kira Apparel? </span>
          <button
            type="button"
            id="create-account-link-btn"
            onClick={() => {
              setViewMode('register');
              setErrorMessage('');
              setRegError('');
            }}
            className="text-[#58a6ff] hover:underline font-medium cursor-pointer"
          >
            Create an account
          </button>
        </div>
      )}

      {/* Footer Info */}
      <div className="mt-8 text-center text-[11px] text-slate-500 space-x-4">
        <span>Terms</span>
        <span>Privacy</span>
        <span>Security</span>
        <span>Contact Super Admin</span>
      </div>
    </div>
  );
};
