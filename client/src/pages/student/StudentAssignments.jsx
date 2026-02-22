import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, Terminal, Clock, CheckCircle, 
  AlertCircle, ChevronRight, XCircle 
} from 'lucide-react';

const StudentAssignments = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Assignments on Load
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('studentUser'));
    
    // Redirect if not logged in
    if (!user) {
      navigate('/student/login');
      return;
    }

    // Call the  Backend Script
    fetch(`http://localhost:8000/server/api/student/get_student_assignments.php?student_id=${user.id}&grade=${user.grade}&batch=${user.batch}`)
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setAssignments(result.data);
        }
      })
      .catch(err => console.error("Error fetching assignments:", err))
      .finally(() => setLoading(false));

  }, [navigate]);

  // 2. Helper for Status Colors
  const getStatusColor = (status) => {
    switch(status) {
      case 'Submitted': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'Late':      return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'Missed':    return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:          return 'bg-blue-500/10 text-blue-400 border-blue-500/20'; // Pending
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'Submitted': return <CheckCircle size={14} className="mr-1" />;
      case 'Late':      return <Clock size={14} className="mr-1" />;
      case 'Missed':    return <XCircle size={14} className="mr-1" />;
      default:          return <Clock size={14} className="mr-1" />;
    }
  };

  return (
    <div className="min-h-screen bg-black text-gray-200 p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="mb-10 border-b border-gray-800 pb-6">
          <h1 className="text-3xl font-bold text-white mb-2">My Assignments</h1>
          <p className="text-gray-500">View your pending labs and theory work.</p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-20 text-gray-500">
            Loading assignments...
          </div>
        )}

        {/* Empty State */}
        {!loading && assignments.length === 0 && (
          <div className="text-center py-20 bg-[#111] rounded-2xl border border-dashed border-gray-800">
            <Terminal className="mx-auto text-gray-700 mb-4" size={48} />
            <h3 className="text-xl font-bold text-gray-400">No Assignments Found</h3>
            <p className="text-gray-600">You are all caught up! Great job.</p>
          </div>
        )}

        {/* Assignments Grid */}
        <div className="grid gap-6">
          {assignments.map((item) => (
            <div 
              key={item.id} 
              className="bg-[#111] rounded-2xl border border-gray-800 p-6 flex flex-col md:flex-row items-start md:items-center justify-between hover:border-purple-500/50 transition-all duration-300 group"
            >
              
              {/* Left Side: Icon & Info */}
              <div className="flex items-start space-x-5 mb-4 md:mb-0">
                {/* Type Icon (Practical vs Theory) */}
                <div className={`p-4 rounded-xl ${item.type === 'Practical' ? 'bg-purple-900/20 text-purple-400' : 'bg-blue-900/20 text-blue-400'}`}>
                  {item.type === 'Practical' ? <Terminal size={24} /> : <FileText size={24} />}
                </div>
                
                <div>
                  <div className="flex items-center space-x-3 mb-1">
                    <h3 className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors">
                      {item.title}
                    </h3>
                    
                    {/* Status Badge */}
                    <span className={`px-3 py-0.5 rounded-full text-xs font-medium border flex items-center ${getStatusColor(item.display_status)}`}>
                      {getStatusIcon(item.display_status)}
                      {item.display_status}
                    </span>
                  </div>
                  
                  <p className="text-gray-400 text-sm mb-2">{item.subject}</p>
                  
                  <div className="flex items-center space-x-6 text-sm text-gray-500">
                    <span className="flex items-center">
                      <Clock size={14} className="mr-1" />
                      Due: {new Date(item.deadline).toLocaleDateString()}
                    </span>
                    
                    {/* Show marks if graded */}
                    {item.marks && (
                      <span className="flex items-center text-green-400 font-bold">
                        Score: {item.marks}/100
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Side: Action Button */}
              <div>
                {/* Logic: 
                   1. If Submitted -> Show "Completed" (Disabled)
                   2. If Missed -> Show "Closed" (Disabled)
                   3. If Pending -> Show "Start" (Active)
                */}
                
                {item.display_status === 'Pending' ? (
                  <button 
                    onClick={() => navigate(`/student/workspace/${item.id}`)}
                    className="flex items-center bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-xl font-bold transition shadow-lg shadow-purple-900/20 hover:scale-105"
                  >
                    <span>Start Practical</span>
                    <ChevronRight size={18} className="ml-2" />
                  </button>
                ) : (
                  <button 
                    disabled 
                    className="flex items-center bg-[#1a1a1a] text-gray-500 border border-gray-700 px-6 py-3 rounded-xl font-medium cursor-not-allowed opacity-70"
                  >
                    {item.display_status === 'Submitted' || item.display_status === 'Late' 
                      ? 'Assignment Submitted' 
                      : 'Deadline Missed'}
                  </button>
                )}
              </div>

            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default StudentAssignments;