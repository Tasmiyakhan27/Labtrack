import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Projector, ArrowRight } from 'lucide-react'; 

// 1. Import the logo here
import logo from '../assets/labtrack_logo.png'; 

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans selection:bg-violet-500 selection:text-white">
      
      {/* 2. Updated Navbar */}
      <nav className="p-6 flex justify-between items-center max-w-7xl mx-auto">
        <div className="text-2xl font-bold flex items-center gap-3 text-violet-400">
          {/* Using the imported logo */}
          <img src={logo} alt="LabTrack Logo" className="w-10 h-10 object-contain" />
          <span>LabTrack</span>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="text-center mt-10 px-4">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6">
          Your Lab, <span className="text-violet-500">Simplified.</span> <br />
          Track, Learn, Succeed.
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto text-lg mb-12">
          LabTrack streamlines practical lab management for students and faculty alike, 
          making education more engaging and efficient.
        </p>
      </div>

      {/* Role Selection */}
      <div className="max-w-4xl mx-auto px-6 mb-20">
        <h2 className="text-3xl font-bold text-center mb-8">Choose Your Role</h2>
        
        <div className="grid md:grid-cols-2 gap-8">
          
          {/* Student Card */}
          <div 
            onClick={() => navigate('/login/student')}
            className="group relative bg-gray-900 border border-gray-800 p-8 rounded-2xl cursor-pointer hover:border-violet-500 transition-all duration-300 hover:shadow-[0_0_30px_rgba(139,92,246,0.3)] flex flex-col items-center text-center"
          >
            <div className="bg-gray-800 p-4 rounded-full mb-4 group-hover:bg-violet-600 transition-colors">
              <GraduationCap size={48} />
            </div>
            <h3 className="text-2xl font-bold mb-2">Student</h3>
            <p className="text-gray-400 text-sm mb-6">
              Access practicals, submit assignments, track grades, and collaborate.
            </p>
            <span className="text-violet-400 text-sm font-semibold flex items-center gap-2 group-hover:translate-x-1 transition-transform">
              Login as Student <ArrowRight size={16}/>
            </span>
          </div>

          {/* Faculty Card */}
          <div 
            onClick={() => navigate('/login/faculty')}
            className="group relative bg-gray-900 border border-gray-800 p-8 rounded-2xl cursor-pointer hover:border-violet-500 transition-all duration-300 hover:shadow-[0_0_30px_rgba(139,92,246,0.3)] flex flex-col items-center text-center"
          >
            <div className="bg-gray-800 p-4 rounded-full mb-4 group-hover:bg-violet-600 transition-colors">
              <Projector size={48} />
            </div>
            <h3 className="text-2xl font-bold mb-2">Faculty</h3>
            <p className="text-gray-400 text-sm mb-6">
              Manage labs, create assignments, track submissions, and analyze performance.
            </p>
            <span className="text-violet-400 text-sm font-semibold flex items-center gap-2 group-hover:translate-x-1 transition-transform">
              Login as Faculty <ArrowRight size={16}/>
            </span>
          </div>

        </div>
      </div>

      {/* Features Section */}
      <div className="bg-gray-900/50 py-16 px-6 rounded-t-3xl border-t border-gray-800">
        <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
                About LabTrack: Your Partner in Practical Excellence
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
            
            {/* Student Features */}
            <div className="group relative bg-gray-900 border border-gray-800 p-8 rounded-2xl hover:border-violet-500 transition-all duration-300 hover:shadow-[0_0_30px_rgba(139,92,246,0.3)]">
                <div className="flex flex-col items-center text-center">
                    <div className="bg-gray-800 p-4 rounded-full mb-4 group-hover:bg-violet-600 transition-colors">
                        <GraduationCap size={48} />
                    </div>
                    <h3 className="text-2xl font-bold mb-4">For Student</h3>
                </div>
                <div className="text-gray-400 text-sm text-left">
                    <ul className="list-disc pl-5 space-y-2">
                        <li>Seamlessly join virtual and physical practical sessions.</li>
                        <li>Effortlessly submit assignments and projects on time.</li>
                        <li>Monitor your academic progress and track grades.</li>
                        <li>Collaborate with peers and engage in discussion.</li>
                    </ul>
                </div>
            </div>

            {/* Faculty Features */}
            <div className="group relative bg-gray-900 border border-gray-800 p-8 rounded-2xl hover:border-violet-500 transition-all duration-300 hover:shadow-[0_0_30px_rgba(139,92,246,0.3)]">
                <div className="flex flex-col items-center text-center">
                    <div className="bg-gray-800 p-4 rounded-full mb-4 group-hover:bg-violet-600 transition-colors">
                        <Projector size={48} />
                    </div>
                    <h3 className="text-2xl font-bold mb-4">For Faculty</h3>
                </div>
                <div className="text-gray-400 text-sm text-left">
                    <ul className="list-disc pl-5 space-y-2">
                        <li>Efficiently manage lab schedules and resources.</li>
                        <li>Create and distribute assignments with ease.</li>
                        <li>Track student submissions and provide timely feedback.</li>
                        <li>Access powerful analytics on performance and attendance.</li>
                    </ul>
                </div>
            </div>
          
            </div>
        </div>
      </div>

    </div>
  );
};

export default LandingPage;