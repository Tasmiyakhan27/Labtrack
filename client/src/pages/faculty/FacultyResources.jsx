import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Link as LinkIcon, CheckCircle, AlertCircle, FileText, X } from 'lucide-react';

const FacultyResources = () => {
  const navigate = useNavigate();
  // Retrieve user for the profile icon AND for the faculty_id
  const user = JSON.parse(localStorage.getItem('facultyUser'));

  const [resourceType, setResourceType] = useState('file'); 
  const [title, setTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [file, setFile] = useState(null);
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [status, setStatus] = useState({ type: '', message: '' });

  const availableClasses = ["1st Year", "2nd Year", "3rd Year"];

  const handleClassToggle = (cls) => {
    if (selectedClasses.includes(cls)) {
      setSelectedClasses(selectedClasses.filter(c => c !== cls));
    } else {
      setSelectedClasses([...selectedClasses, cls]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setFile(null);
    document.getElementById('fileInput').value = ""; 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: 'loading', message: 'Publishing resource...' });

    const formData = new FormData();
    // ✅ ADDED THIS LINE: Send the logged-in faculty's ID
    formData.append('faculty_id', user ? user.id : 1); 
    formData.append('title', title);
    formData.append('type', resourceType);
    formData.append('target_classes', selectedClasses.join(','));

    if (resourceType === 'file') {
      if (!file) return setStatus({ type: 'error', message: 'Please select a PDF or TXT file.' });
      formData.append('file', file);
    } else {
      if (!linkUrl) return setStatus({ type: 'error', message: 'Please enter a valid URL.' });
      formData.append('link', linkUrl);
    }

    if (selectedClasses.length === 0) return setStatus({ type: 'error', message: 'Select at least one class.' });

    try {
      // Note: Ensure the filename matches your PHP file
      const response = await fetch('http://localhost:8000/server/api/faculty/add_resources.php', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (data.success) {
        setStatus({ type: 'success', message: 'Resource published successfully!' });
        setTitle('');
        setFile(null);
        setLinkUrl('');
        setSelectedClasses([]);
        if(document.getElementById('fileInput')) document.getElementById('fileInput').value = "";
      } else {
        setStatus({ type: 'error', message: data.message || 'Upload failed.' });
      }
    } catch (error) {
      console.error(error);
      setStatus({ type: 'error', message: 'Server connection failed.' });
    }
  };

  return (
    <div className="min-h-screen bg-black text-gray-200 font-sans">
      
      {/* HEADER */}
        <header className="h-16 border-b border-gray-800 flex items-center justify-between px-8 bg-gray-950 sticky top-0 z-50">
          <nav className="flex gap-8 text-sm font-medium text-gray-400">
            <span className="hover:text-white cursor-pointer transition-colors" onClick={()=>navigate('/faculty/dashboard')}> Dashboard</span>
            <span className="hover:text-white cursor-pointer transition-colors" onClick={()=>navigate('/faculty/timetable')}>Timetable</span>
            <span className="hover:text-white cursor-pointer transition-colors" onClick={()=>navigate('/faculty/assignments')}>Assignments</span>
            <span className="hover:text-white cursor-pointer transition-colors" onClick={()=>navigate('/faculty/submissions')}>Submissions</span>
            <span className="text-white cursor-pointer border-b-2 border-violet-500 pb-5 pt-5">Resources</span>
            <span className="hover:text-white cursor-pointer transition-colors" onClick={()=>navigate('/faculty/analysis')}>Analysis</span>
          </nav>

          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-violet-600 rounded-full flex items-center justify-center font-bold text-white text-xs">
                {user?.full_name?.[0] || 'F'}
            </div>
          </div>
      </header>

      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">Manuals & Resources</h1>
            <p className="text-gray-500 mt-2">Upload study materials and reference links for your classes.</p>
          </div>
          
          <div className="bg-[#111111] rounded-2xl border border-gray-800 p-8 shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-black border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                  placeholder="e.g., Data Structures Lab Manual - Module 1"
                  required
                />
              </div>

              {/* Resource Type */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-3">Resource Type</label>
                <div className="flex space-x-4">
                  <button type="button" onClick={() => setResourceType('file')} className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl border transition-all duration-200 ${resourceType === 'file' ? 'bg-purple-600/20 border-purple-500 text-purple-300' : 'bg-black border-gray-700 text-gray-500 hover:border-gray-500'}`}>
                    <Upload size={18} /> <span>Upload File</span>
                  </button>
                  <button type="button" onClick={() => setResourceType('link')} className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl border transition-all duration-200 ${resourceType === 'link' ? 'bg-purple-600/20 border-purple-500 text-purple-300' : 'bg-black border-gray-700 text-gray-500 hover:border-gray-500'}`}>
                    <LinkIcon size={18} /> <span>External Link</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Input */}
              <div className="p-6 bg-black rounded-xl border border-dashed border-gray-700 hover:border-gray-500 transition-colors">
                {resourceType === 'file' ? (
                  !file ? (
                    <div className="text-center relative">
                      <div className="mx-auto h-12 w-12 text-gray-600 mb-3 flex items-center justify-center bg-gray-900 rounded-full">
                        <FileText size={24} />
                      </div>
                      <p className="text-sm text-gray-400 mb-1">Click to browse or drag file here</p>
                      <p className="text-xs text-gray-600">PDF or TXT (Max 5MB)</p>
                      <input id="fileInput" type="file" accept=".pdf,.txt" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    </div>
                  ) : (
                    <div className="flex items-center justify-between bg-gray-900 p-3 rounded-lg border border-gray-700">
                      <div className="flex items-center space-x-3 overflow-hidden">
                        <div className="bg-purple-900/30 p-2 rounded text-purple-400"><FileText size={20} /></div>
                        <span className="text-sm text-gray-200 truncate">{file.name}</span>
                      </div>
                      <button type="button" onClick={removeFile} className="text-gray-500 hover:text-red-400"><X size={20} /></button>
                    </div>
                  )
                ) : (
                  <div>
                    <input type="url" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} className="w-full bg-transparent border-b border-gray-700 px-2 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors" placeholder="https://example.com/resource..." />
                  </div>
                )}
              </div>

              {/* Class Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-3">Visible To</label>
                <div className="flex flex-wrap gap-3">
                  {availableClasses.map((cls) => (
                    <div key={cls} onClick={() => handleClassToggle(cls)} className={`cursor-pointer px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 ${selectedClasses.includes(cls) ? 'bg-purple-600 border-purple-600 text-white shadow-[0_0_10px_rgba(147,51,234,0.4)]' : 'bg-black border-gray-700 text-gray-500 hover:border-gray-500'}`}>
                      {cls}
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <button type="submit" disabled={status.type === 'loading'} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 rounded-xl transition duration-200 shadow-lg shadow-purple-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center">
                {status.type === 'loading' ? 'Publishing...' : 'Publish Resource'}
              </button>

              {/* Status Messages */}
              {status.message && (
                <div className={`flex items-center p-4 rounded-lg border ${status.type === 'success' ? 'bg-green-900/20 border-green-800 text-green-400' : 'bg-red-900/20 border-red-800 text-red-400'}`}>
                  {status.type === 'success' ? <CheckCircle size={20} className="mr-2"/> : <AlertCircle size={20} className="mr-2"/>}
                  <span>{status.message}</span>
                </div>
              )}

            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultyResources;