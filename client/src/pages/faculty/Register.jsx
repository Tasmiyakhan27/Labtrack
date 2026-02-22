import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Building2, Hash, KeyRound, Shield, AlertTriangle } from 'lucide-react';

// IMPORTANT: Ensure you have an image at this path, or remove this import
import facultyIllustration from '../../assets/faculty-illustration.jpg'; 

const FacultyRegister = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    fullName: '',
    department: '',
    facultyId: '',
    email: '',
    password: '',
    role: 'faculty', 
    secretCode: '' 
  });

  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear error when user types to improve UX
    if(error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // --- SECURITY CHECKPOINT ---
    // 1. Check HOD Key
    if (formData.role === 'hod' && formData.secretCode !== 'ADMIN123') {
        setError(" Invalid HOD Key. Authorization failed.");
        return;
    }

    // 2. Check Faculty Key
    if (formData.role === 'faculty' && formData.secretCode !== 'FACULTY123') {
        setError(" Invalid Faculty Key. Students are not allowed here.");
        return;
    }
    // ---------------------------

    // Prepare Payload
    const payload = {
        full_name: formData.fullName,
        faculty_id: formData.facultyId,
        department: formData.department,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        secret_code: formData.secretCode // Send code to backend for double-verification
    };

    try {
      const response = await fetch('http://localhost:8000/server/api/auth/register_faculty.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
      });
      
      const data = await response.json();

      if (response.ok) {
        alert("✅ Registration Successful! Please Login.");
        navigate('/login/faculty');
      } else {
        setError(data.message || "Registration failed");
      }
    } catch (err) {
      console.error("Registration Error:", err);
      setError("Server connection failed. Please try again later.");
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-950 text-white font-sans">
      
      {/* LEFT SIDE: Illustration */}
      <div className="hidden lg:flex w-1/2 bg-violet-900/20 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute w-[500px] h-[500px] bg-violet-600/20 rounded-full blur-3xl"></div>
        {/* Make sure this image exists in your assets folder */}
        <img 
          src={facultyIllustration} 
          alt="Faculty Workspace" 
          className="relative z-10 w-full max-w-md object-contain drop-shadow-2xl rounded-2xl"
        />
        <div className="absolute bottom-10 text-center px-10 text-gray-400 text-sm">
            <h3 className="text-white font-bold text-lg mb-2">Secure Faculty Portal</h3>
            <p>Manage assignments, attendance, and student performance in one place.</p>
        </div>
      </div>

      {/* RIGHT SIDE: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-md space-y-6">
          
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white">Faculty Registration</h2>
            <p className="text-gray-400 mt-2">Join the academic staff network</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg text-sm flex items-center justify-center gap-2 animate-pulse">
              <AlertTriangle size={18} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-gray-500" size={18} />
                <input 
                  type="text" 
                  name="fullName"
                  placeholder="Prof. John Doe"
                  className="w-full bg-black border border-gray-800 rounded-lg py-2.5 pl-10 pr-4 focus:border-violet-600 focus:outline-none transition-colors text-white"
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Row: Role & Department */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Role</label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-3 text-gray-500" size={18} />
                    <select 
                      name="role"
                      className="w-full bg-black border border-gray-800 rounded-lg py-2.5 pl-10 pr-4 focus:border-violet-600 focus:outline-none appearance-none text-gray-300 cursor-pointer"
                      onChange={handleChange}
                      value={formData.role}
                    >
                      <option value="faculty">Faculty</option>
                      <option value="hod">Head of Dept (HOD)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Department</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 text-gray-500" size={18} />
                    <select 
                      name="department"
                      className="w-full bg-black border border-gray-800 rounded-lg py-2.5 pl-10 pr-4 focus:border-violet-600 focus:outline-none appearance-none text-gray-300 cursor-pointer"
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Dept</option>
                      <option value="CS">Comp Engg (CO)</option>
                      <option value="IT">Info Tech (IT)</option>
                    </select>
                  </div>
                </div>
            </div>

            {/* Faculty ID */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Faculty ID</label>
              <div className="relative">
                <Hash className="absolute left-3 top-3 text-gray-500" size={18} />
                <input 
                  type="text" 
                  name="facultyId"
                  placeholder="e.g., CS-FAC-001"
                  className="w-full bg-black border border-gray-800 rounded-lg py-2.5 pl-10 pr-4 focus:border-violet-600 focus:outline-none transition-colors text-white"
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-500" size={18} />
                <input 
                  type="email" 
                  name="email"
                  placeholder="faculty@gmail.com"
                  className="w-full bg-black border border-gray-800 rounded-lg py-2.5 pl-10 pr-4 focus:border-violet-600 focus:outline-none transition-colors text-white"
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-500" size={18} />
                <input 
                  type="password" 
                  name="password"
                  placeholder="••••••••"
                  className="w-full bg-black border border-gray-800 rounded-lg py-2.5 pl-10 pr-4 focus:border-violet-600 focus:outline-none transition-colors text-white"
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* SECURITY KEY FIELD (Conditional Rendering) */}
            <div className={`p-4 rounded-xl border transition-all duration-300 ${
                formData.role === 'hod' 
                ? 'bg-yellow-900/10 border-yellow-600/50' 
                : 'bg-violet-900/10 border-violet-600/50'
            }`}>
                <label className={`block text-xs font-bold uppercase mb-2 items-center ${
                    formData.role === 'hod' ? 'text-yellow-500' : 'text-violet-400'
                }`}>
                    <KeyRound size={14} className="mr-2"/> 
                    {formData.role === 'hod' ? 'HOD Authorization Key' : 'Staff Verification Code'}
                </label>
                
                <input 
                    type="password" 
                    name="secretCode"
                    placeholder={formData.role === 'hod' ? "Enter Admin Key " : "Enter Staff Key "}
                    className="w-full bg-black/50 border border-gray-700 rounded-lg py-2 px-4 focus:ring-1 focus:outline-none transition-all text-white placeholder-gray-600 text-sm"
                    onChange={handleChange}
                    required
                />
                
                <p className="text-[10px] text-gray-500 mt-2">
                    {formData.role === 'hod' 
                        ? 'Restricted to Head of Department only.' 
                        : 'Required to prevent unauthorized student registration.'}
                </p>
            </div>

            <button 
              type="submit" 
              className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-3.5 rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_30px_rgba(124,58,237,0.5)] transform hover:scale-[1.02]"
            >
              Create Account
            </button>

            <p className="text-center text-gray-400 text-sm">
              Already have an account?{' '}
              <Link to="/login/faculty" className="text-violet-400 hover:text-violet-300 font-medium hover:underline">
                Sign in
              </Link>
            </p>

          </form>
        </div>
      </div>
    </div>
  );
};

export default FacultyRegister;