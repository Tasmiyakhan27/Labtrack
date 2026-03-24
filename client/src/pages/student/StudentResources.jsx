import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // --- NEW: Added for redirects
import { FileText, Link as LinkIcon, Download, ExternalLink, Search, BookOpen } from 'lucide-react';

const StudentResources = () => {
  const navigate = useNavigate(); // --- NEW ---
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Fetch Resources on Load
  useEffect(() => {
    // Get logged-in user from LocalStorage
    const user = JSON.parse(localStorage.getItem('studentUser'));
    // --- NEW: GET TOKEN ---
    const token = localStorage.getItem('token');
    
    if (user && user.grade && token) {
      // --- UPDATED: Added Authorization Header ---
      fetch(`http://localhost:8000/server/api/student/get_student_resources.php?grade=${user.grade}`, {
          headers: {
              'Authorization': `Bearer ${token}`
          }
      })
        .then(res => {
            // --- NEW: REDIRECT IF TOKEN EXPIRED ---
            if (res.status === 401) {
                navigate('/student/login');
                throw new Error("Session expired.");
            }
            return res.json();
        })
        .then(data => {
          if (data.success) {
            setResources(data.data);
          }
        })
        .catch(err => console.error("Error fetching resources:", err))
        .finally(() => setLoading(false));
    } else {
      setLoading(false); // No user found
      navigate('/student/login'); // Redirect to login
    }
  }, [navigate]); // Added navigate to dependency array

  // 2. Filter Logic (Search Bar)
  const filteredResources = resources.filter(item => 
    item.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black text-gray-200 p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 border-b border-gray-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Learning Resources</h1>
            <p className="text-gray-500">Access manuals, reference guides, and external links for your subjects.</p>
          </div>
          
          {/* Search Bar */}
          <div className="relative w-full md:w-64 mt-4 md:mt-0">
            <Search className="absolute left-3 top-3 text-gray-500" size={18} />
            <input 
              type="text" 
              placeholder="Search resources..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#111] border border-gray-700 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
        </div>

        {/* Loading State */}
        {loading && <div className="text-center py-20 text-gray-500">Loading your resources...</div>}

        {/* Empty State */}
        {!loading && resources.length === 0 && (
          <div className="text-center py-20 bg-[#111] rounded-2xl border border-dashed border-gray-800">
            <BookOpen className="mx-auto text-gray-700 mb-4" size={48} />
            <h3 className="text-xl font-bold text-gray-400">No Resources Found</h3>
            <p className="text-gray-600">Your faculty hasn't uploaded any materials for your grade yet.</p>
          </div>
        )}

        {/* Resources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((item) => (
            <div 
              key={item.id} 
              className="group bg-[#111] border border-gray-800 hover:border-purple-500/50 rounded-2xl p-6 transition-all duration-300 hover:shadow-lg hover:shadow-purple-900/10 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  {/* Icon Badge */}
                  <div className={`p-3 rounded-xl ${item.type === 'file' ? 'bg-blue-900/20 text-blue-400' : 'bg-green-900/20 text-green-400'}`}>
                    {item.type === 'file' ? <FileText size={24} /> : <LinkIcon size={24} />}
                  </div>
                  <span className="text-xs font-mono text-gray-600 bg-black px-2 py-1 rounded border border-gray-800">
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-purple-400 transition-colors line-clamp-2">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  {item.type === 'file' ? 'PDF / Document' : 'External Website'}
                </p>
              </div>

              {/* Action Button */}
              {item.type === 'file' ? (
                <a 
                  href={`http://localhost:8000/server/${item.content_path}`} 
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-full py-3 rounded-xl bg-gray-800 hover:bg-blue-600 text-gray-300 hover:text-white transition-all font-medium text-sm"
                >
                  <Download size={16} className="mr-2" />
                  Download File
                </a>
              ) : (
                <a 
                  href={item.content_path} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-full py-3 rounded-xl bg-gray-800 hover:bg-green-600 text-gray-300 hover:text-white transition-all font-medium text-sm"
                >
                  <ExternalLink size={16} className="mr-2" />
                  Open Link
                </a>
              )}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default StudentResources;