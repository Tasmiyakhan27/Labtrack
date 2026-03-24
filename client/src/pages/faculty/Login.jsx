// src/pages/faculty/Login.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, LogIn } from 'lucide-react';

// Ensure this path is correct
import facultyIllustration from '../../assets/faculty-illustration.jpg'; 

const FacultyLogin = () => {
  const navigate = useNavigate();
  
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState(''); 

  // --- NEW: Security measure for shared college computers ---
  // Wipes any existing session data when the login page is opened
  useEffect(() => {
    localStorage.clear();
  }, []);

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // POINT TO CORRECT PHP FILE 
      // (Changed to login_faculty.php to match your backend code block. Change back if necessary!)
      const response = await axios.post('http://localhost:8000/server/api/auth/login_faculty.php', credentials);

      if (response.status === 200 && response.data.user) {
        
        const userData = response.data.user;

        // SAVE TO STORAGE (Both Keys for Safety)
        localStorage.setItem('facultyUser', JSON.stringify(userData));
        localStorage.setItem('user', JSON.stringify(userData)); 
        
        // CRITICAL: Save the JWT Token
        if(response.data.token) {
            localStorage.setItem('token', response.data.token);
        }

        alert("Login Successful! Welcome " + userData.name);
        navigate('/faculty/dashboard');
      }

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Login failed. Server error.");
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-950 text-white font-sans">
      
      {/* LEFT SIDE */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-violet-900/20">
        <img 
          src={facultyIllustration} 
          alt="Faculty Login" 
          onError={(e) => {e.target.style.display='none'}}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-violet-900/30"></div>
      </div>

      {/* RIGHT SIDE */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          
          <div className="text-center">
            <h2 className="text-4xl font-extrabold tracking-tight mb-2">Welcome Back</h2>
            <p className="text-gray-400">Faculty Access Portal</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded-lg mb-6 text-center text-sm">
                {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 mt-8">
            
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 text-gray-500" size={20} />
                <input 
                  type="email" 
                  name="email"
                  placeholder="faculty_abc@gmail.com"
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-violet-600 focus:outline-none transition-all"
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 text-gray-500" size={20} />
                <input 
                  type="password" 
                  name="password"
                  placeholder="Enter your password"
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-violet-600 focus:outline-none transition-all"
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Login Button */}
            <button 
              type="submit" 
              className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-3.5 rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_30px_rgba(124,58,237,0.5)] flex items-center justify-center gap-2"
            >
              <LogIn size={20} /> Login
            </button>

            <div className="text-center mt-6">
              <p className="text-gray-400 text-sm">
                New Faculty Member?{' '}
                <Link to="/register/faculty" className="text-violet-400 hover:text-violet-300 font-semibold hover:underline">
                  Register Account
                </Link>
              </p>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default FacultyLogin;