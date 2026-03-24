import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // --- NEW: Imported for auth redirects
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, ShieldAlert } from 'lucide-react';

const ImportStudents = () => {
  const navigate = useNavigate(); // --- NEW: Added for navigation
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [user, setUser] = useState(null);

  // 1. Load User on Mount to check permissions
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('facultyUser'));
    if (storedUser) {
      setUser(storedUser);
    }
  }, []);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setStatus({ type: '', message: '' });
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    // 2. SECURITY CHECK: Ensure user is logged in
    if (!user) {
      setStatus({ type: 'error', message: 'You must be logged in to perform this action.' });
      return;
    }

    if (!file) {
      setStatus({ type: 'error', message: 'Please select an Excel file first.' });
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    
    // 3. SEND ID TO BACKEND: uploader_id is sent but PHP will prioritize the JWT token
    formData.append('uploader_id', user.id); 

    setStatus({ type: 'loading', message: 'Verifying permissions and processing data...' });

    try {
      // --- NEW: GET TOKEN ---
      const token = localStorage.getItem('token');

      const response = await fetch('http://localhost:8000/server/api/faculty/import_students.php', {
        method: 'POST',
        headers: {
            // --- UPDATED: ADDED AUTHORIZATION HEADER ---
            'Authorization': `Bearer ${token}`
        },
        body: formData,
      });
      
      // --- NEW: REDIRECT IF TOKEN EXPIRED ---
      if (response.status === 401) {
          navigate('/login/faculty');
          return;
      }

      const result = await response.json();
      
      if (result.success) {
        setStatus({ type: 'success', message: result.message });
      } else {
        setStatus({ type: 'error', message: result.message || 'Import failed.' });
      }
    } catch (error) {
      console.error(error);
      setStatus({ type: 'error', message: 'Server connection error. ' });
    }
  };

  return (
    <div className="min-h-screen bg-black text-gray-200 p-8 font-sans flex items-center justify-center">
      <div className="max-w-3xl w-full">
        
        <h1 className="text-3xl font-bold text-white mb-2">Import Students</h1>
        <p className="text-gray-500 mb-8">Bulk upload student records using Excel.</p>
        
        <div className="bg-[#111] p-8 rounded-2xl border border-gray-800 shadow-2xl relative overflow-hidden">
          
          {/* Subtle Glow Effect */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[80px] rounded-full pointer-events-none"></div>

          <div className="text-center mb-8 relative z-10">
            <div className="bg-gray-800/50 p-4 rounded-full w-20 h-20 mx-auto flex items-center justify-center mb-4 border border-gray-700">
              <FileSpreadsheet className="text-green-500" size={36} />
            </div>
            <h2 className="text-xl font-bold text-white">Upload Student Data</h2>
            <p className="text-gray-400 mt-2 text-sm">Select your <span className="text-green-400 font-mono">.xlsx</span> file containing student records.</p>
          </div>

          <form onSubmit={handleUpload} className="space-y-6 relative z-10">
            
            {/* Upload Area */}
            <div className="border-2 border-dashed border-gray-700 bg-[#161616] rounded-xl p-10 text-center hover:bg-[#1a1a1a] hover:border-blue-500/50 transition-all cursor-pointer relative group">
              <input 
                type="file" 
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
              />
              {file ? (
                <div className="flex flex-col items-center">
                  <FileSpreadsheet className="text-green-500 mb-2" size={32} />
                  <span className="text-green-400 font-bold text-lg">{file.name}</span>
                  <span className="text-gray-500 text-sm mt-1">Ready to upload</span>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                   <Upload className="text-gray-500 mb-3 group-hover:text-blue-400 transition" size={32} />
                   <span className="text-gray-400 font-medium">Click to browse or drag file here</span>
                   <span className="text-gray-600 text-xs mt-2">Supports .xlsx and .xls</span>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={status.type === 'loading'}
              className="w-full bg-linear-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-purple-900/20 hover:scale-[1.01] transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status.type === 'loading' ? (
                <span className="flex items-center">
                   <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3"></div>
                   Processing...
                </span>
              ) : (
                <>
                  <Upload size={20} className="mr-2" />
                  Start Import
                </>
              )}
            </button>
          </form>

          {/* Status Messages */}
          {status.message && (
            <div className={`mt-6 p-4 rounded-xl border flex items-center ${
              status.type === 'success' ? 'bg-green-900/20 border-green-900 text-green-400' : 
              status.type === 'error' ? 'bg-red-900/20 border-red-900 text-red-400' : 'bg-blue-900/20 border-blue-900 text-blue-400'
            }`}>
              {status.type === 'success' ? <CheckCircle className="mr-3" size={20}/> : <AlertCircle className="mr-3" size={20}/>}
              {status.message}
            </div>
          )}
        </div>
        
        {/* Instructions Footer */}
        <div className="mt-8 flex items-start space-x-3 p-4 bg-yellow-900/10 border border-yellow-900/30 rounded-xl text-sm text-yellow-500">
          <ShieldAlert className="shrink-0 mt-0.5" size={18} />
          <div>
            <strong className="block mb-1 text-yellow-400">Important Instructions:</strong>
            <ul className="list-disc list-inside space-y-1 opacity-80">
              <li>Only <strong>Head of Department (HOD)</strong> accounts can perform this action.</li>
              <li>Excel columns must be: <code className="bg-black/30 px-1 py-0.5 rounded text-yellow-300">Enrollment No</code>, <code className="bg-black/30 px-1 py-0.5 rounded text-yellow-300">Name</code>, <code className="bg-black/30 px-1 py-0.5 rounded text-yellow-300">DOB</code>, <code className="bg-black/30 px-1 py-0.5 rounded text-yellow-300">Grade</code>, <code className="bg-black/30 px-1 py-0.5 rounded text-yellow-300">Batch</code>.</li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ImportStudents;