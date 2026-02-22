import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, ArrowRight, AlertCircle } from 'lucide-react';

const StudentLogin = () => {
  const [username, setUsername] = useState(''); // Enrollment No
  const [password, setPassword] = useState(''); // DOB
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/server/api/auth/student_login.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        // --- 1. CLEANUP OLD SESSIONS (The Fix) ---
        // Remove any leftover Faculty data to prevent role mixing
        localStorage.removeItem('facultyUser');
        localStorage.removeItem('user'); // Remove generic user key if it exists
        localStorage.removeItem('token');

        // --- 2. SAVE NEW STUDENT SESSION ---
        localStorage.setItem('studentUser', JSON.stringify(data.user));
        
        // Optional: If you use a generic 'user' key for shared components, set it now:
        // localStorage.setItem('user', JSON.stringify(data.user)); 

        navigate('/student/dashboard');
      } else {
        setError(data.message || 'Invalid Enrollment No or DOB');
      }
    } catch (err) {
      setError('Server connection failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-[#111] border border-gray-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        
        {/* Background Decoration */}
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-purple-600 to-blue-600"></div>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">Student Portal</h1>
          <p className="text-gray-500">Login to access your labs and assignments</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          
          {/* Enrollment Input */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Enrollment Number</label>
            <div className="relative group">
              <User className="absolute left-4 top-3.5 text-gray-600 group-focus-within:text-purple-500 transition-colors" size={20} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-black border border-gray-800 text-white pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all placeholder-gray-700"
                placeholder="e.g. 1234567890"
                required
              />
            </div>
          </div>

          {/* DOB Input */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Password (DOB)</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-3.5 text-gray-600 group-focus-within:text-purple-500 transition-colors" size={20} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black border border-gray-800 text-white pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all placeholder-gray-700"
                placeholder="DDMMYYYY"
                required
              />
            </div>
            <p className="text-right text-xs text-gray-600 mt-2">Format: DDMMYYYY (e.g. 25012004)</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center p-3 bg-red-900/10 border border-red-900/30 rounded-lg text-red-400 text-sm">
              <AlertCircle size={16} className="mr-2 shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 rounded-xl transition duration-200 flex items-center justify-center group shadow-lg shadow-purple-900/20 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span>Verifying...</span>
            ) : (
              <>
                <span>Login to Dashboard</span>
                <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>

        </form>
      </div>
    </div>
  );
};

export default StudentLogin;