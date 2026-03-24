import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  BookOpen, FileText, Calendar, Activity, 
  LogOut, Clock, CheckCircle, AlertTriangle, 
  Users, AlertCircle, Upload // Added Upload Icon
} from 'lucide-react';


const FacultyDashboard = () => {
  const navigate = useNavigate();
  
  // 1. Unified State for all dashboard data
  const [dashboardData, setDashboardData] = useState({
      total_students: 0,
      active_assignments: 0,
      pending_reviews: 0,
      recent_activity: []
  });
  
  const [loading, setLoading] = useState(true);

  // Get user from local storage
  const user = JSON.parse(localStorage.getItem('facultyUser')); 

  // --- REAL-TIME DATA FETCHING ---
  const fetchDashboardData = async () => {
    try {
      // --- NEW: GET TOKEN ---
      const token = localStorage.getItem('token');
      const facultyId = user ? user.id : 1;
      
      // --- UPDATED: ADDED AUTHORIZATION HEADER ---
      const response = await axios.get(`http://localhost:8000/server/api/faculty/dashboard_data.php?faculty_id=${facultyId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data) {
          setDashboardData(response.data);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      // --- NEW: REDIRECT IF TOKEN EXPIRED ---
      if (error.response && error.response.status === 401) {
          navigate('/login/faculty');
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(); 
    const intervalId = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(intervalId); 
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login/faculty');
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'submission': return <CheckCircle size={20} className="text-green-500" />;
      case 'warning': return <AlertTriangle size={20} className="text-yellow-500" />;
      default: return <Activity size={20} className="text-blue-500" />;
    }
  };

  return (
    <div className="flex min-h-screen bg-black text-white font-sans">
      
      {/* 1. SIDEBAR */}
      <div className="w-20 border-r border-gray-800 flex flex-col items-center py-6 bg-gray-950">
        <div className="text-violet-500 font-bold text-xl mb-10">LT</div>
        <button 
            onClick={handleLogout}
            className="mt-auto p-3 bg-red-600/10 text-red-500 rounded-lg hover:bg-red-600 hover:text-white transition-all"
            title="Logout"
        >
            <LogOut size={20} />
        </button>
      </div>

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col">
        
        {/* TOP NAVIGATION BAR */}
        <header className="h-16 border-b border-gray-800 flex items-center justify-between px-8 bg-gray-950">
          <nav className="flex gap-8 text-sm font-medium text-gray-400">
            <span className="text-white cursor-pointer border-b-2 border-violet-500 pb-5 pt-5">Faculty Dashboard</span>
            <span className="hover:text-white cursor-pointer transition-colors" onClick={()=>navigate('/faculty/timetable')}>Timetable</span>
            <span className="hover:text-white cursor-pointer transition-colors" onClick={()=>navigate('/faculty/assignments')}>Assignments</span>
            <span className="hover:text-white cursor-pointer transition-colors" onClick={()=>navigate('/faculty/submissions')}>Submissions</span>
            <span className="hover:text-white cursor-pointer transition-colors" onClick={()=>navigate('/faculty/resources')}>Resources</span>
            <span className="hover:text-white cursor-pointer transition-colors" onClick={()=>navigate('/faculty/analysis')}>Analysis</span>

            {/* --- CONDITIONAL HOD LINK --- */}
            {(user?.role === 'hod' || user?.role === 'HOD') && (
                <span 
                    className="hover:text-violet-400 text-violet-300 cursor-pointer transition-colors flex items-center gap-1" 
                    onClick={() => navigate('/faculty/import-students')}
                > Import Students
                </span>
            )}
            
          </nav>

          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-violet-600 rounded-full flex items-center justify-center font-bold">
                {user?.full_name?.[0] || 'F'}
            </div>
          </div>
        </header>

        {/* DASHBOARD CONTENT */}
        <main className="p-8 overflow-y-auto">
            
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-4xl font-bold">Welcome, {user?.full_name || 'Professor'}!</h1>
                    { (user?.role === 'hod' || user?.role === 'HOD') && (
                        <p className="text-gray-500 text-sm mt-1">Head of Department Access Enabled</p>
                    )}
                </div>
            </div>

            {/* A. SUMMARY CARDS */}
            <div className="mb-10">
                <h3 className="text-xl font-semibold mb-4">Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Active Assignments */}
                    <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl flex flex-col justify-between h-40 relative overflow-hidden group hover:border-violet-500 transition-all">
                        <div className="absolute -right-5 -top-5 bg-violet-500/10 w-32 h-32 rounded-full blur-2xl"></div>
                        <div className="flex items-start justify-between">
                            <span className="text-gray-400 text-sm">Active Assignments</span>
                            <BookOpen className="text-violet-400" size={20} />
                        </div>
                        <span className="text-4xl font-bold mt-2">{dashboardData.active_assignments}</span>
                    </div>

                    {/* Pending Reviews */}
                    <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl flex flex-col justify-between h-40 relative overflow-hidden group hover:border-blue-500 transition-all">
                        <div className="absolute -right-5 -top-5 bg-blue-500/10 w-32 h-32 rounded-full blur-2xl"></div>
                        <div className="flex items-start justify-between">
                            <span className="text-gray-400 text-sm">Pending Grading</span>
                            <AlertCircle className="text-blue-400" size={20} />
                        </div>
                        <span className="text-4xl font-bold mt-2">{dashboardData.pending_reviews}</span>
                    </div>

                    {/* Total Students */}
                    <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl flex flex-col justify-between h-40 relative overflow-hidden group hover:border-red-500 transition-all">
                        <div className="absolute -right-5 -top-5 bg-red-500/10 w-32 h-32 rounded-full blur-2xl"></div>
                        <div className="flex items-start justify-between">
                            <span className="text-gray-400 text-sm">Total Students</span>
                            <Users className="text-red-400" size={20} />
                        </div>
                        <span className="text-4xl font-bold mt-2">{dashboardData.total_students}</span>
                    </div>
                </div>
            </div>

            {/* B. QUICK ACTIONS */}
            <div className="mb-10">
                <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <button onClick={()=>navigate('/faculty/timetable')} className="bg-blue-900/20 border border-blue-900/50 hover:bg-blue-900/40 p-8 rounded-2xl flex flex-col items-center justify-center gap-4 transition-all group">
                        <div className="bg-blue-600 p-3 rounded-full group-hover:scale-110 transition-transform">
                            <Calendar className="text-white" size={24} />
                        </div>
                        <span className="font-semibold text-blue-100">Timetable</span>
                    </button>

                    <button onClick={()=>navigate('/faculty/assignments')} className="bg-indigo-900/20 border border-indigo-900/50 hover:bg-indigo-900/40 p-8 rounded-2xl flex flex-col items-center justify-center gap-4 transition-all group">
                        <div className="bg-indigo-600 p-3 rounded-full group-hover:scale-110 transition-transform">
                            <FileText className="text-white" size={24} />
                        </div>
                        <span className="font-semibold text-indigo-100">Assignments</span>
                    </button>

                    <button onClick={()=>navigate('/faculty/analysis')}className="bg-violet-900/20 border border-violet-900/50 hover:bg-violet-900/40 p-8 rounded-2xl flex flex-col items-center justify-center gap-4 transition-all group">
                        <div className="bg-violet-600 p-3 rounded-full group-hover:scale-110 transition-transform">
                            <Activity className="text-white" size={24} />
                        </div>
                        <span className="font-semibold text-violet-100">Analytics</span>
                    </button>
                </div>
            </div>

            {/* C. RECENT ACTIVITY FEED */}
            <div>
                <h3 className="text-xl font-semibold mb-4">Recent Activity Feed</h3>
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                    {loading ? (
                        <div className="text-center py-4 text-gray-500">Loading feed...</div>
                    ) : (
                        <div className="space-y-6">
                            {dashboardData.recent_activity && dashboardData.recent_activity.length > 0 ? (
                                dashboardData.recent_activity.map((activity, index) => (
                                    <div key={index} className="flex gap-4 items-start">
                                        <div className="mt-1">
                                            {getActivityIcon(activity.type)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-200">{activity.message}</p>
                                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                                <Clock size={12} /> 
                                                {new Date(activity.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500">No recent activity found.</p>
                            )}
                        </div>
                    )}
                </div>
            </div>

        </main>
      </div>
    </div>
  );
};

export default FacultyDashboard;