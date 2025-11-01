import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Shield, Mail, Lock, Eye, EyeOff, Loader2, Sun, Moon } from 'lucide-react';

const AuthCard = ({ children, title, subtitle }) => (
  <div className="bg-white dark:bg-gray-900 py-8 px-6 shadow-xl rounded-2xl border border-gray-200 dark:border-gray-800">
    <div className="mb-6 text-center">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
    </div>
    {children}
  </div>
);

const LoginPage = () => {
  const { user, login, register, loading } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [mode, setMode] = useState('login'); // login | signup
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email:'', username:'', password:'', confirm:'' });
  const [errors, setErrors] = useState({});

  if (user && !loading) return <Navigate to="/chat" replace/>;

  const set = (k)=>(e)=>{ setForm(p=>({...p,[k]: e.target.value})); if(errors[k]) setErrors(p=>({...p,[k]:null})); };

  const validate = () => {
    const e={};
    if(!form.email) e.email='Email is required';
    else if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email='Enter a valid email';
    if(!form.password) e.password='Password is required';
    else if(mode==='signup' && form.password.length<8) e.password='Min 8 characters';
    if(mode==='signup'){
      if(!form.username || form.username.length<2) e.username='Username must be at least 2 characters';
      if(form.password!==form.confirm) e.confirm='Passwords do not match';
    }
    setErrors(e); return Object.keys(e).length===0;
  };

  const submit = async (ev)=>{
    ev.preventDefault(); if(!validate()) return; setBusy(true);
    try{
      if(mode==='login'){
        await login({ email: form.email.trim().toLowerCase(), password: form.password });
      } else {
        await register({ email: form.email.trim().toLowerCase(), username: form.username.trim(), password: form.password });
      }
    } finally{ setBusy(false); }
  };

  return (
    <div className="min-h-screen login-bg bg-gray-50 dark:bg-gray-950 flex flex-col items-center pt-16 sm:pt-24 px-4">
      {/* theme toggle */}
      <button onClick={toggleTheme} className="fixed top-4 right-4 p-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
        {isDark ? <Sun className="w-5 h-5 text-yellow-400"/> : <Moon className="w-5 h-5 text-gray-700"/>}
      </button>

      {/* brand */}
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg">
          <Shield className="w-7 h-7 text-white" />
        </div>
        <h1 className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">P2P Secure Chat</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">End-to-end encrypted messaging</p>
      </div>

      {/* card */}
      <div className="w-full max-w-md mt-8">
        <AuthCard title={mode==='login'?'Sign in to your account':'Create your account'} subtitle={mode==='login'?'Use your credentials to continue':'We’ll create a secure account for you'}>
          <form onSubmit={submit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email address</label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
                <input className={`input-primary pl-10 ${errors.email?'border-red-300 focus:ring-red-500 focus:border-red-500':''}`} type="email" placeholder="Enter your email" value={form.email} onChange={set('email')} />
              </div>
              {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
            </div>

            {/* Username */}
            {mode==='signup' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
                <input className={`input-primary ${errors.username?'border-red-300 focus:ring-red-500 focus:border-red-500':''}`} type="text" placeholder="Choose a username" value={form.username} onChange={set('username')} />
                {errors.username && <p className="text-xs text-red-600 mt-1">{errors.username}</p>}
              </div>
            )}

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
                <input className={`input-primary pl-10 pr-10 ${errors.password?'border-red-300 focus:ring-red-500 focus:border-red-500':''}`} type={showPassword?'text':'password'} placeholder="Enter your password" value={form.password} onChange={set('password')} />
                <button type="button" onClick={()=>setShowPassword(s=>!s)} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  {showPassword ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password}</p>}
            </div>

            {/* Confirm */}
            {mode==='signup' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm Password</label>
                <input className={`input-primary ${errors.confirm?'border-red-300 focus:ring-red-500 focus:border-red-500':''}`} type={showPassword?'text':'password'} placeholder="Confirm your password" value={form.confirm} onChange={set('confirm')} />
                {errors.confirm && <p className="text-xs text-red-600 mt-1">{errors.confirm}</p>}
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={busy||loading} className="btn-primary w-full py-3">
              {busy||loading ? (<><Loader2 className="w-5 h-5 mr-2 animate-spin"/> {mode==='login'?'Signing in...':'Creating account...'}</>) : (mode==='login'?'Sign In':'Create Account')}
            </button>
          </form>

          {/* Switch */}
          <div className="text-center mt-4">
            <button onClick={()=>{ setMode(mode==='login'?'signup':'login'); setErrors({}); }} className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
              {mode==='login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </AuthCard>

        {/* footer notice */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <Shield className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span>Your messages are end‑to‑end encrypted and stored securely</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
