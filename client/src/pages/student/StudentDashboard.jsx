import React, { useState, useEffect } from 'react';
import { 
  Clock, Calendar, CheckCircle, AlertCircle, 
  BookOpen, Terminal, LogOut
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  
  // Data States
  const [assignments, setAssignments] = useState([]);
  const [scores, setScores] = useState([]);
  const [labs, setLabs] = useState([]);
  const [nextLab, setNextLab] = useState(null);
  const [loading, setLoading] = useState(true);

  // Timer State
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  // 1. Load User & Fetch Data on Mount
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('studentUser'));
    if (!storedUser) {
      navigate('/'); // Redirect if not logged in
      return;
    }
    setUser(storedUser);

    // Fetch Dashboard Data/api/get_student_dashboard.php
    fetch(`http://localhost:8000/server/api/student/student_dashboard.php?student_id=${storedUser.id}&grade=${storedUser.grade}&batch=${storedUser.batch}`)
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setAssignments(result.data.assignments);
          setScores(result.data.scores);
          setLabs(result.data.upcoming_labs);
          
          if (result.data.next_lab) {
             setNextLab(result.data.next_lab);
             // Initialize timer immediately
             calculateTimeLeft(result.data.next_lab.seconds_left);
          }
        }
      })
      .catch(err => console.error("Dashboard fetch error:", err))
      .finally(() => setLoading(false));

  }, [navigate]);

  // 2. Countdown Timer Logic
  useEffect(() => {
    if (!nextLab) return;

    const timer = setInterval(() => {
      setNextLab(prev => {
        if (!prev || prev.seconds_left <= 0) return prev;
        const newSeconds = prev.seconds_left - 1;
        calculateTimeLeft(newSeconds);
        return { ...prev, seconds_left: newSeconds };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [nextLab]);

  const calculateTimeLeft = (totalSeconds) => {
    if (totalSeconds <= 0) {
      setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
      return;
    }
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    setTimeLeft({ hours: h, minutes: m, seconds: s });
  };

  // 3. Helper for Colors based on status
  const getStatusColor = (status) => {
    switch(status) {
      case 'Submitted': return 'text-green-500';
      case 'Overdue': return 'text-red-500';
      default: return 'text-yellow-500';
    }
  };

  const getBarColor = (status) => {
    switch(status) {
      case 'Submitted': return 'bg-green-500';
      case 'Overdue': return 'bg-red-500';
      default: return 'bg-yellow-500';
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('studentUser');
    navigate('/login/student');
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading Dashboard...</div>;

  return (
    <div className="min-h-screen bg-black text-white font-sans flex">
      
      {/* --- LEFT SIDEBAR (Desktop) --- */}
      <div className="w-20 hidden md:flex flex-col items-center py-8 border-r border-gray-800 bg-black fixed h-full z-20">
        <div className="mb-auto">
            <div className="w-10 h-10 bg-linear-to-br from-purple-500 to-blue-600 rounded-lg mb-8 shadow-lg shadow-blue-900/50"></div>
        </div>
        
        <button onClick={handleLogout} className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all mt-auto mb-8">
            <LogOut size={24} />
        </button>
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="flex-1 md:ml-20 p-8">
        
        {/* TOP NAVIGATION */}
        <header className="flex justify-between items-center mb-10">
          <div className="text-2xl font-bold text-blue-500 tracking-wide">LabTrack</div>
          
          <nav className="hidden md:flex space-x-8 text-sm font-medium text-gray-400">
            <Link to="/student/dashboard" className="text-white">Dashboard</Link>
            <Link to="/student/workspace" className="hover:text-white transition">Workspace</Link>
            <Link to="/student/assignments" className="hover:text-white transition">Assignments</Link>
            <Link to="/student/timetable" className="hover:text-white transition">Timetable</Link>
            <Link to="/student/resources" className="hover:text-white transition">Resources</Link>
          </nav>

          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-white">{user?.full_name}</p>
                <p className="text-xs text-gray-500">{user?.username}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden border border-gray-600 flex items-center justify-center text-xl font-bold text-gray-400">
                {user?.full_name?.charAt(0)}
            </div>
          </div>
        </header>

        {/* HERO SECTION: COUNTDOWN */}
        <div className="relative rounded-3xl overflow-hidden bg-linear-to-r from-[#0f172a] via-[#1e1b4b] to-[#0f172a] border border-gray-800 p-10 mb-12 shadow-2xl">
          {/* Glow Effect */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 blur-[100px] rounded-full"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center">
            <div className="text-center md:text-left mb-6 md:mb-0">
              <h2 className="text-2xl font-bold text-gray-200 mb-6 tracking-wider">
                {nextLab ? `Next Practical: ${nextLab.title}` : "No Upcoming Practicals Today"}
              </h2>
              
              {nextLab ? (
                <div className="flex space-x-6 text-center">
                    <div>
                        <span className="text-5xl md:text-6xl font-bold text-blue-400 block">{String(timeLeft.hours).padStart(2, '0')}</span>
                        <span className="text-xs text-gray-500 uppercase tracking-widest">Hours</span>
                    </div>
                    <div>
                        <span className="text-5xl md:text-6xl font-bold text-purple-400 block">{String(timeLeft.minutes).padStart(2, '0')}</span>
                        <span className="text-xs text-gray-500 uppercase tracking-widest">Minutes</span>
                    </div>
                    <div>
                        <span className="text-5xl md:text-6xl font-bold text-blue-400 block">{String(timeLeft.seconds).padStart(2, '0')}</span>
                        <span className="text-xs text-gray-500 uppercase tracking-widest">Seconds</span>
                    </div>
                </div>
              ) : (
                <div className="text-gray-400 text-lg">Relax! You are free for now.</div>
              )}
            </div>

            <div className="flex flex-col space-y-3">
                <button className="px-6 py-2 bg-gray-700/50 text-gray-400 rounded-full text-sm font-medium cursor-not-allowed">
                   {nextLab ? "Waiting for Session Start" : "No Session Active"}
                </button>
                {nextLab && (
                  <button className="px-8 py-3 bg-linear-to-r from-blue-600 to-purple-600 text-white rounded-full font-bold shadow-lg shadow-purple-900/40 hover:scale-105 transition-transform">
                      Join Practical
                  </button>
                )}
            </div>
          </div>
        </div>

        {/* SECTION HEADER */}
        <h2 className="text-2xl font-bold text-white mb-6">Your Overview</h2>

        {/* GRID LAYOUT */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
          
          {/* 1. ASSIGNMENTS */}
          {assignments.length > 0 ? assignments.map((item, idx) => (
            <div key={idx} className="bg-[#111] p-6 rounded-2xl border border-gray-800 hover:border-gray-700 transition group">
              <h3 className="font-bold text-lg mb-1 group-hover:text-blue-400 transition truncate">{item.title}</h3>
              <p className="text-xs text-gray-500 mb-4">Due: {new Date(item.deadline).toLocaleDateString()}</p>
              
              <div className={`flex items-center text-xs font-bold mb-2 ${getStatusColor(item.status)}`}>
                 {item.status === 'Submitted' ? <CheckCircle size={14} className="mr-1"/> : 
                  item.status === 'Overdue' ? <AlertCircle size={14} className="mr-1"/> : 
                  <Clock size={14} className="mr-1"/>}
                 {item.status}
              </div>

              {/* Progress Bar (Visual only for now) */}
              <div className="w-full bg-gray-800 rounded-full h-1.5 mb-2">
                <div 
                    className={`${getBarColor(item.status)} h-1.5 rounded-full`} 
                    style={{ width: item.status === 'Submitted' ? '100%' : '50%' }}
                ></div>
              </div>
            </div>
          )) : (
            <div className="bg-[#111] p-6 rounded-2xl border border-gray-800 text-gray-500 text-center flex flex-col items-center justify-center">
                <CheckCircle size={32} className="mb-2 text-green-500/50" />
                <p>No pending assignments!</p>
            </div>
          )}

          {/* 2. EXAM SCORES */}
          {scores.length > 0 ? scores.map((item, idx) => (
            <div key={idx} className="bg-[#111] p-6 rounded-2xl border border-gray-800 hover:border-gray-700 transition">
              <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-lg w-3/4 truncate">{item.subject_name}</h3>
                  <span className="text-green-400 font-bold text-sm">
                    {item.score_obtained}/{item.total_score}
                  </span>
              </div>
              
              <div className="flex items-center text-green-400 font-bold text-sm mb-3">
                <Terminal size={16} className="mr-2" />
                {Math.round((item.score_obtained / item.total_score) * 100)}%
              </div>
              
              <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                {item.feedback || "No feedback provided."}
              </p>
            </div>
          )) : (
             <div className="bg-[#111] p-6 rounded-2xl border border-gray-800 text-gray-500 text-center flex flex-col items-center justify-center">
                <Terminal size={32} className="mb-2 text-blue-500/50" />
                <p>No scores released yet.</p>
            </div>
          )}

          {/* 3. UPCOMING LABS */}
          {labs.length > 0 ? labs.map((item, idx) => (
            <div key={idx} className="bg-[#111] p-6 rounded-2xl border border-gray-800 hover:border-gray-700 transition">
              <h3 className="font-bold text-lg mb-1">{item.subject_name}</h3>
              <p className="text-xs text-gray-500 mb-4">{item.subject_code}</p>
              
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-400">
                    <Calendar size={16} className="mr-2 text-blue-500" />
                    {item.day_of_week}
                </div>
                <div className="flex items-center text-sm text-gray-400">
                    <Clock size={16} className="mr-2 text-blue-500" />
                    {item.start_time}
                </div>
                <div className="flex items-center text-sm text-gray-400">
                    <BookOpen size={16} className="mr-2 text-blue-500" />
                    {item.room_number}
                </div>
              </div>
            </div>
          )) : (
            <div className="bg-[#111] p-6 rounded-2xl border border-gray-800 text-gray-500 text-center flex flex-col items-center justify-center">
                <Calendar size={32} className="mb-2 text-purple-500/50" />
                <p>No upcoming labs found.</p>
            </div>
          )}

        </div>
      </div>
      
      {/* Footer Mobile Logout */}
      <div className="fixed bottom-6 left-6 md:hidden">
         <button onClick={handleLogout} className="flex items-center bg-red-500/90 text-white px-6 py-2 rounded-lg shadow-lg font-bold">
            <LogOut size={18} className="mr-2" /> Logout
         </button>
      </div>

    </div>
  );
};

export default StudentDashboard;