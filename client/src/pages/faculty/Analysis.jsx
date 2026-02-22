import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { Filter, ArrowLeft, RefreshCw } from 'lucide-react';

const AnalysisDashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const facultyId = user?.id || 1;

  // --- STATE ---
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ grade: 'All', batch: 'All' });

  // --- FETCH DATA (Calls PHP -> Calls Python) ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:8000/server/api/faculty/analysis.php?faculty_id=${facultyId}&grade=${filters.grade}&batch=${filters.batch}`);
      setData(res.data);
    } catch (err) {
      console.error("Analytics Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [filters]);

  // --- CHART COLORS ---
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042'];

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col">
      
      {/* HEADER */}
      <header className="h-16 border-b border-gray-800 flex items-center justify-between px-8 bg-gray-950">
         
          {/* Menu Links */}
          <nav className="flex gap-8 text-sm font-medium text-gray-400">
            <span className="hover:text-white cursor-pointer "
            onClick={()=>navigate('/faculty/dashboard')}>
            Faculty Dashboard</span>
            <span className="hover:text-white cursor-pointer transition-colors" 
            onClick={()=>navigate('/faculty/timetable')}>
                Timetable Management</span>
            <span className="hover:text-white cursor-pointer transition-colors " 
            onClick={()=>navigate('/faculty/assignments')}> Faculty Assignments</span>
            <span className="hover:text-white cursor-pointer transition-colors"
            onClick={()=>navigate('/faculty/submissions')}>
            Submissions</span>
            <span className="hover:text-white cursor-pointer transition-colors"
            onClick={()=>navigate('/faculty/resources')}>
            Resources</span>
            <span className="text-white cursor-pointer transition-colors border-b-2 border-violet-500 pb-5 pt-5">Analysis</span>
          </nav>
         {/* FILTERS */}
         <div className="flex gap-4">
            <select className="bg-gray-900 border border-gray-700 rounded px-3 py-1.5 text-sm outline-none"
                onChange={e => setFilters({...filters, grade: e.target.value})}>
                <option value="All">All Grades</option>
                <option value="FY">FY</option><option value="SY">SY</option><option value="TY">TY</option>
            </select>
            <select className="bg-gray-900 border border-gray-700 rounded px-3 py-1.5 text-sm outline-none"
                onChange={e => setFilters({...filters, batch: e.target.value})}>
                <option value="All">All Batches</option>
                <option value="Batch 1">Batch 1</option><option value="Batch 2">Batch 2</option>
            </select>
            <button onClick={fetchData} className="p-2 bg-violet-600 rounded hover:bg-violet-700"><RefreshCw size={16}/></button>
         </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-7xl mx-auto w-full">
        
        {loading ? <div className="col-span-2 text-center py-20">Running Python Analytics...</div> : (
          <>
             {/* 1. ASSIGNMENT COMPLETION RATES (Bar Chart) */}
             <div className="bg-[#111] border border-gray-800 p-6 rounded-2xl shadow-lg">
                <h3 className="text-lg font-bold mb-4">Assignment Completion Rates</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data?.completion} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis type="number" stroke="#666" />
                    <YAxis dataKey="name" type="category" width={100} stroke="#666" tick={{fontSize: 10}} />
                    <Tooltip contentStyle={{backgroundColor: '#333', border: 'none'}} />
                    <Bar dataKey="completed" fill="#4f46e5" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
             </div>

             {/* 2. AVERAGE STUDENT PERFORMANCE (Line Chart) */}
             <div className="bg-[#111] border border-gray-800 p-6 rounded-2xl shadow-lg">
                <h3 className="text-lg font-bold mb-4">Average Student Performance</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data?.performance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="name" stroke="#666" />
                    <YAxis stroke="#666" domain={[0, 100]} />
                    <Tooltip contentStyle={{backgroundColor: '#333', border: 'none'}} />
                    <Legend />
                    <Line type="monotone" dataKey="score" stroke="#f43f5e" strokeWidth={3} dot={{r: 4}} activeDot={{r: 8}} />
                  </LineChart>
                </ResponsiveContainer>
             </div>

             {/* 3. LAB PARTICIPATION (Donut Chart) */}
             <div className="bg-[#111] border border-gray-800 p-6 rounded-2xl shadow-lg">
                <h3 className="text-lg font-bold mb-4">Lab Participation by Subject</h3>
                <div className="flex justify-center">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie 
                        data={data?.subjects} cx="50%" cy="50%" innerRadius={60} outerRadius={80} 
                        fill="#8884d8" paddingAngle={5} dataKey="value"
                      >
                        {data?.subjects?.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{backgroundColor: '#333', border: 'none'}} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
             </div>

             {/* 4. BATCH ATTENDANCE (Bar Chart) */}
             <div className="bg-[#111] border border-gray-800 p-6 rounded-2xl shadow-lg">
                <h3 className="text-lg font-bold mb-4">Attendance by Batch</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data?.batches}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="name" stroke="#666" />
                    <YAxis stroke="#666" />
                    <Tooltip contentStyle={{backgroundColor: '#333', border: 'none'}} />
                    <Bar dataKey="attendance" fill="#06b6d4" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
             </div>
          </>
        )}

      </main>
    </div>
  );
};

export default AnalysisDashboard;