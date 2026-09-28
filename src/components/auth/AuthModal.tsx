'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import {
  Lock,
  Mail,
  User,
  Calendar,
  Briefcase,
  Sparkles,
  AlertCircle,
  X,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'signin' | 'signup';
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'signin',
  onSuccess,
}) => {
  const [tab, setTab] = useState<'signin' | 'signup'>(defaultTab);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sign In form
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Sign Up form (with strictly name, email, dob, occupation as requested)
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dob, setDob] = useState('');
  const [occupation, setOccupation] = useState('');

  if (!isOpen) return null;

  const handleOAuthSignIn = async (provider: 'google' | 'twitter' | 'instagram') => {
    setLoading(true);
    setError(null);
    try {
      await signIn(provider, { callbackUrl: window.location.href });
    } catch (err: any) {
      setError(err?.message || `Failed to sign in with ${provider}`);
      setLoading(false);
    }
  };

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await signIn('credentials', {
        redirect: false,
        email: signInEmail,
        password: signInPassword,
      });

      if (res?.error) {
        setError(res.error || 'Invalid email or password');
        setLoading(false);
      } else {
        setSuccessMessage('Signed in successfully!');
        if (onSuccess) onSuccess();
        setTimeout(() => {
          onClose();
          window.location.reload();
        }, 600);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to sign in');
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          dob,
          occupation,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Auto sign in after registration
      const loginRes = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (loginRes?.error) {
        setTab('signin');
        setSignInEmail(email);
        setSuccessMessage('Account registered in MongoDB! Please enter your password to sign in.');
      } else {
        setSuccessMessage('Account created and logged in! 10 generations quota unlocked.');
        if (onSuccess) onSuccess();
        setTimeout(() => {
          onClose();
          window.location.reload();
        }, 800);
      }
    } catch (err: any) {
      setError(err?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#fcfcf9] border-4 border-black p-5 sm:p-6 w-full max-w-md shadow-[10px_10px_0px_#000000] font-mono space-y-4 relative max-h-[92vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-black hover:bg-black hover:text-[#ccff00] border-2 border-black w-7 h-7 flex items-center justify-center transition-colors cursor-pointer font-bold"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="border-b-2 border-black pb-3">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-[#ccff00] border border-black inline-block" />
            <h2 className="text-sm font-black uppercase text-black">
              ATHLETE &amp; USER AUTHENTICATION
            </h2>
          </div>
          <p className="text-[11px] text-zinc-600 font-bold mt-0.5">
            UNLOCK 10 GENERATIONS QUOTA · MONGODB USER PROFILE SYNC
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 border-2 border-black bg-zinc-100 p-0.5 text-xs font-black">
          <button
            type="button"
            onClick={() => {
              setTab('signin');
              setError(null);
            }}
            className={`py-1.5 transition-colors cursor-pointer uppercase ${
              tab === 'signin'
                ? 'bg-black text-[#ccff00] shadow-[1px_1px_0px_#000000]'
                : 'text-zinc-600 hover:text-black'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('signup');
              setError(null);
            }}
            className={`py-1.5 transition-colors cursor-pointer uppercase ${
              tab === 'signup'
                ? 'bg-black text-[#ccff00] shadow-[1px_1px_0px_#000000]'
                : 'text-zinc-600 hover:text-black'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="bg-rose-50 border-2 border-rose-600 p-2.5 text-rose-800 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="bg-emerald-50 border-2 border-emerald-600 p-2.5 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* 1. OAUTH PROVIDERS (Google, X, Instagram) */}
        <div className="space-y-2">
          <div className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">
            QUICK ONE-CLICK OAUTH SIGN IN
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {/* Google */}
            <button
              type="button"
              onClick={() => handleOAuthSignIn('google')}
              disabled={loading}
              className="px-3 py-2 border-2 border-black bg-white hover:bg-zinc-100 font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-[2px_2px_0px_#000000] cursor-pointer disabled:opacity-50"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
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
              <span>Google</span>
            </button>

            {/* X (Twitter) */}
            <button
              type="button"
              onClick={() => handleOAuthSignIn('twitter')}
              disabled={loading}
              className="px-3 py-2 border-2 border-black bg-black text-white hover:bg-zinc-800 font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-[2px_2px_0px_#000000] cursor-pointer disabled:opacity-50"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <span>X</span>
            </button>

            {/* Instagram */}
            <button
              type="button"
              onClick={() => handleOAuthSignIn('instagram')}
              disabled={loading}
              className="px-3 py-2 border-2 border-black bg-[#E1306C] text-white hover:bg-[#c1275d] font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-[2px_2px_0px_#000000] cursor-pointer disabled:opacity-50"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
              <span>Instagram</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 my-2">
          <div className="h-0.5 bg-black/20 flex-1" />
          <span className="text-[10px] font-bold text-zinc-500 uppercase">
            OR CREDENTIALS
          </span>
          <div className="h-0.5 bg-black/20 flex-1" />
        </div>

        {/* 2. SIGN IN FORM */}
        {tab === 'signin' && (
          <form onSubmit={handleCredentialsSignIn} className="space-y-3 text-xs">
            <div>
              <label className="block font-black mb-1 text-black flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" />
                <span>EMAIL ADDRESS</span>
              </label>
              <input
                type="email"
                required
                value={signInEmail}
                onChange={(e) => setSignInEmail(e.target.value)}
                placeholder="athlete@example.com"
                className="w-full p-2 border-2 border-black bg-white font-bold"
              />
            </div>

            <div>
              <label className="block font-black mb-1 text-black flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" />
                <span>PASSWORD</span>
              </label>
              <input
                type="password"
                required
                value={signInPassword}
                onChange={(e) => setSignInPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-2 border-2 border-black bg-white font-bold"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 border-2 border-black bg-black text-[#ccff00] hover:bg-[#ccff00] hover:text-black font-black text-xs uppercase transition-all shadow-[3px_3px_0px_#000000] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>{loading ? 'AUTHENTICATING...' : 'SIGN IN & UNLOCK QUOTA'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        )}

        {/* 3. SIGN UP FORM (Only storing name, email, dob, occupation as specified) */}
        {tab === 'signup' && (
          <form onSubmit={handleSignUp} className="space-y-3 text-xs">
            <div>
              <label className="block font-black mb-1 text-black flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                <span>FULL NAME</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Neeraj Rekwar"
                className="w-full p-2 border-2 border-black bg-white font-bold"
              />
            </div>

            <div>
              <label className="block font-black mb-1 text-black flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" />
                <span>EMAIL ADDRESS</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="athlete@example.com"
                className="w-full p-2 border-2 border-black bg-white font-bold"
              />
            </div>

            <div>
              <label className="block font-black mb-1 text-black flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" />
                <span>PASSWORD</span>
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full p-2 border-2 border-black bg-white font-bold"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block font-black mb-1 text-black flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>DOB (DATE OF BIRTH)</span>
                </label>
                <input
                  type="date"
                  required
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full p-2 border-2 border-black bg-white font-bold"
                />
              </div>

              <div>
                <label className="block font-black mb-1 text-black flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>OCCUPATION</span>
                </label>
                <input
                  type="text"
                  required
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  placeholder="Software / Fitness Engineer"
                  className="w-full p-2 border-2 border-black bg-white font-bold"
                />
              </div>
            </div>

            <div className="bg-[#f0fde8] border border-black p-2 text-[10px] text-zinc-700 font-bold">
              ✓ Database schema strictly saves: Name, Email, DOB, and Occupation.
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 border-2 border-black bg-[#ccff00] text-black hover:bg-black hover:text-[#ccff00] font-black text-xs uppercase transition-all shadow-[3px_3px_0px_#000000] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{loading ? 'SAVING TO MONGODB...' : 'REGISTER & UNLOCK 10 LIMITS'}</span>
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
