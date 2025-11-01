import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Shield, Mail, Lock, Eye, EyeOff, Loader2, Sun, Moon } from 'lucide-react';

const LoginPage = () => {
  const { user, login, register, loading } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showTOTP, setShowTOTP] = useState(false);
  const [formData, setFormData] = useState({ email: '', username: '', password: '', confirmPassword: '', totpCode: '' });
  const [errors, setErrors] = useState({});

  if (user && !loading) return <Navigate to="/chat" replace />;

  const validateForm = () => {
    const e = {};
    if (!formData.email) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email = 'Please enter a valid email';
    if (!formData.password) e.password = 'Password is required';
    else if (!isLogin && formData.password.length < 8) e.password='Password must be at least 8 characters';
    if (!isLogin){
      if (!formData.username) e.username='Username is required';
      else if (formData.username.length < 2) e.username='Username must be at least 2 characters';
      if (formData.password !== formData.confirmPassword) e.confirmPassword='Passwords do not match';
    }
    if (showTOTP && (!formData.totpCode || formData.totpCode.length !== 6)) e.totpCode='Enter a valid 6-digit code';
    setErrors(e); return Object.keys(e).length===0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault(); if (!validateForm()) return; setIsLoading(true); setErrors({});
    try{
      let result;
      if (isLogin) {
        result = await login({ email: formData.email.trim().toLowerCase(), password: formData.password, ...(showTOTP && { totpCode: formData.totpCode }) });
      } else {
        result = await register({ email: formData.email.trim().toLowerCase(), username: formData.username.trim(), password: formData.password });
      }
      if (result?.requiresTOTP) { setShowTOTP(true); setFormData(p=>({...p, totpCode:''})); }
      else if (!result?.success && result?.message) { setErrors({ general: result.message }); }
    } catch { setErrors({ general: 'An unexpected error occurred. Please try again.' }); }
    finally{ setIsLoading(false);} };

  const input = (field, props={}) => (
    <input
      {...props}
      value={formData[field]}
      onChange={(e)=>{ setFormData(p=>({...p,[field]: e.target.value})); if(errors[field]) setErrors(p=>({...p,[field]:null})); }}
      className={`input-primary ${props.className||''} ${errors[field]?'border-red-300 focus:border-red-500 focus:ring-red-500':''}`}
      disabled={isLoading}
    />
  );

  const switchMode = () => { setIsLogin(!isLogin); setShowTOTP(false); setFormData({ email:'', username:'', password:'', confirmPassword:'', totpCode:'' }); setErrors({}); };

  return (
    <div className="min-h-screen flex flex-col justify-center login-bg bg-gray-50 dark:bg-gray-900 py-12 sm:px-6 lg:px-8">
      <div className="absolute top-4 right-4">
        <button onClick={toggleTheme} className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-md hover:shadow-lg border border-gray-200 dark:border-gray-700">
          {isDark ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-gray-700" />}
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg">
            <Shield className="w-7 h-7 text-white" />
          </div>
        </div>
        <h1 className="mt-4 text-center text-3xl font-bold text-gray-900 dark:text-white">P2P Secure Chat</h1>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">End-to-end encrypted messaging</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-6 shadow-xl rounded-2xl border border-gray-200 dark:border-gray-700">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-center text-gray-900 dark:text-white">{isLogin ? 'Sign in to your account' : 'Create your account'}</h2>
            {showTOTP && (
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 text-center text-sm text-blue-800 dark:text-blue-200">Enter your 6‑digit authentication code</div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {errors.general && (<div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-800 dark:text-red-200">{errors.general}</div>)}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email address</label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                {input('email', { type:'email', placeholder:'Enter your email', className:'pl-10' })}
              </div>
              {errors.email && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>}
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Username</label>
                {input('username', { type:'text', placeholder:'Choose a username' })}
                {errors.username && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.username}</p>}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password</label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                {input('password', { type: showPassword?'text':'password', placeholder:'Enter your password', className:'pl-10 pr-10' })}
                <button type="button" onClick={()=>setShowPassword(!showPassword)} className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">{showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button>
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>}
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Confirm Password</label>
                {input('confirmPassword', { type: showPassword?'text':'password', placeholder:'Confirm your password', className:'pl-10' })}
                {errors.confirmPassword && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.confirmPassword}</p>}
              </div>
            )}

            {showTOTP && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Authentication Code</label>
                {input('totpCode', { type:'text', placeholder:'000000', maxLength:6, className:'text-center text-lg tracking-widest', onChange: (e)=>{ const v=e.target.value.replace(/\D/g,'').slice(0,6); setFormData(p=>({...p, totpCode:v})); if(errors.totpCode) setErrors(p=>({...p, totpCode:null})); } })}
                {errors.totpCode && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.totpCode}</p>}
              </div>
            )}

            <div className="pt-2">
              <button type="submit" disabled={isLoading || loading} className="btn-primary w-full flex items-center justify-center py-3 text-base">
                {isLoading || loading ? (<><Loader2 className="w-5 h-5 mr-2 animate-spin" />{isLogin ? 'Signing in...' : 'Creating account...'}</>) : (<>{isLogin ? 'Sign In' : 'Create Account'}</>)}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <button onClick={switchMode} disabled={isLoading || loading} className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
            {showTOTP && (
              <div className="text-center mt-3">
                <button onClick={()=>{ setShowTOTP(false); setFormData(p=>({...p, totpCode:''})); setErrors(p=>({...p, totpCode:null})); }} disabled={isLoading} className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">← Back to login</button>
              </div>
            )}
          </div>
        </div>

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
