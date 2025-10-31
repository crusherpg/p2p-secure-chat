import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import LoginPage from './pages/LoginPage';
import ChatPage from './pages/ChatPage';
import LoadingSpinner from './components/LoadingSpinner';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 transition-colors duration-200">
        <Routes>
          <Route 
            path="/login" 
            element={user ? <Navigate to="/chat" replace /> : <LoginPage />} 
          />
          <Route 
            path="/chat" 
            element={user ? <ChatPage /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/" 
            element={<Navigate to={user ? "/chat" : "/login"} replace />} 
          />
        </Routes>
        <Toaster 
          position="top-center"
          containerClassName="mt-16 md:mt-4"
          toastOptions={{
            duration: 3000,
            className: 'text-sm',
            style: {
              background: 'var(--toast-bg, #374151)',
              color: 'var(--toast-color, #ffffff)',
              border: '1px solid var(--toast-border, #4b5563)',
              borderRadius: '12px',
              fontSize: '14px',
              maxWidth: '90vw'
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#ffffff'
              }
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#ffffff'
              }
            }
          }}
        />
      </div>
    </Router>
  );
}

function App() {
  useEffect(() => {
    // Set CSS custom properties for toast styling
    const root = document.documentElement;
    const isDark = document.documentElement.classList.contains('dark');
    
    root.style.setProperty('--toast-bg', isDark ? '#374151' : '#ffffff');
    root.style.setProperty('--toast-color', isDark ? '#ffffff' : '#1f2937');
    root.style.setProperty('--toast-border', isDark ? '#4b5563' : '#e5e7eb');
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;