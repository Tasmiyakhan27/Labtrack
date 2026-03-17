import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, Calendar, Upload, Trash2, Bell, Clock, 
  Code, BookOpen, CheckCircle, Edit 
} from 'lucide-react';

const FacultyAssignments = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [editId, setEditId] = useState(null); // Added for edit tracking
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    grade: '1st Year', 
    batch: 'B1',       
    deadline: '',
    type: 'Practical', 
    file: null,
    min_marks: 0,    
    max_marks: 50   
  });

  // --- HELPER: GET USER SAFELY ---
  const getFacultyUser = () => {
    const user = localStorage.getItem('facultyUser') || localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  };

  // 1. FETCH ASSIGNMENTS
  const fetchAssignments = async () => {
    const user = getFacultyUser();
    
    if (!user) {
        return;
    }

    try {
      const userId = user.id || user.faculty_id || 1; 
      const res = await axios.get(`http://localhost:8000/server/api/faculty/assignment.php?faculty_id=${userId}`);
      setAssignments(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Fetch Error:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  // --- POPULATE FORM FOR EDITING ---
  const handleEdit = (item) => {
    setEditId(item.id);
    
    const formattedDeadline = item.deadline ? item.deadline.replace(' ', 'T').substring(0, 16) : '';

    setFormData({
      title: item.title,
      description: item.description,
      subject: item.subject,
      grade: item.grade,
      batch: item.batch,
      deadline: formattedDeadline,
      type: item.type,
      file: null, 
      min_marks: item.min_marks,
      max_marks: item.max_marks
    });
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- CANCEL EDIT ---
  const handleCancelEdit = () => {
    setEditId(null);
    setFormData({
      title: '', description: '', subject: '', 
      grade: '1st Year', batch: 'B1', deadline: '', 
      type: 'Practical', file: null,
      min_marks: 0, max_marks: 50
    });
  };

  // 2. HANDLE SUBMIT
  const handleSubmit = async (e) => {
    e.preventDefault();
    const user = getFacultyUser();

    if (!user) {
        alert("You must be logged in to post an assignment.");
        navigate('/login/faculty');
        return;
    }

    const userId = user.id;
    if (!userId) {
        alert("User ID missing. Please log out and log in again.");
        return;
    }    

    const data = new FormData();
    if (editId) {
        data.append('id', editId);
    }
    data.append('faculty_id', userId); 
    data.append('title', formData.title);
    data.append('description', formData.description);
    data.append('subject', formData.subject);
    data.append('grade', formData.grade);
    data.append('batch', formData.batch);
    data.append('deadline', formData.deadline); 
    data.append('type', formData.type);
    
    // Append Marks
    data.append('min_marks', formData.min_marks); 
    data.append('max_marks', formData.max_marks);         

    if (formData.file) {
      data.append('attachment', formData.file);
    }

    try {
      await axios.post('http://localhost:8000/server/api/faculty/assignment.php', data);
      
      alert(editId ? "Assignment Updated Successfully!" : "Assignment Posted Successfully!");
      fetchAssignments();
      
      // Reset Form
      setEditId(null);
      setFormData({
        title: '', description: '', subject: '', 
        grade: '1st Year', batch: 'B1', deadline: '', 
        type: 'Practical', file: null,
        min_marks: 0, max_marks: 50
      });
    } catch (err) {
      console.error(err);
      alert(editId ? "Failed to update assignment." : "Failed to post assignment.");
    }
  };

  // 3. DELETE ASSIGNMENT
  const handleDelete = async (id) => {
    if(!window.confirm("Delete this assignment?")) return;
    try {
        await axios.delete(`http://localhost:8000/server/api/faculty/assignment.php?id=${id}`);
        fetchAssignments();
    } catch (err) {
        alert("Failed to delete.");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col">
       
       {/* HEADER */}
        <header className="h-16 border-b border-gray-800 flex items-center justify-between px-8 bg-gray-950 sticky top-0 z-50">
          <nav className="flex gap-8 text-sm font-medium text-gray-400">
            <span className="hover:text-white cursor-pointer transition-colors" onClick={()=>navigate('/faculty/dashboard')}>Faculty Dashboard</span>
            <span className="hover:text-white cursor-pointer transition-colors" onClick={()=>navigate('/faculty/timetable')}>Timetable</span>
            <span className="text-white cursor-pointer border-b-2 border-violet-500 pb-5 pt-5">Assignments</span>
            <span className="hover:text-white cursor-pointer transition-colors" onClick={()=>navigate('/faculty/submissions')}>Submissions</span>
            <span className="hover:text-white cursor-pointer transition-colors" onClick={()=>navigate('/faculty/resources')}>Resources</span>
            <span className="hover:text-white cursor-pointer transition-colors" onClick={()=>navigate('/faculty/analysis')}>Analysis</span>
          </nav>
        </header>

       <div className="p-8 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* --- LEFT COLUMN: CREATE FORM --- */}
        <div className="lg:col-span-2">
            <div className="bg-[#111] border border-gray-800 rounded-2xl p-8 shadow-2xl">
                <h2 className="text-2xl font-bold mb-6 flex items-center">
                    <span className="bg-blue-600 w-2 h-8 mr-4 rounded-full"></span>
                    {editId ? "Edit Assignment" : "Create New Assignment"}
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    
                    {/* Row 1: Title & Subject */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-400 mb-2">Assignment Title</label>
                            <input 
                                type="text" required
                                placeholder="e.g., Array Implementation"
                                className="w-full bg-black border border-gray-700 rounded-xl p-3 focus:border-blue-500 outline-none text-white transition-colors"
                                value={formData.title}
                                onChange={e => setFormData({...formData, title: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-400 mb-2">Subject</label>
                            <input 
                                type="text" required
                                placeholder="e.g. Data Structures"
                                className="w-full bg-black border border-gray-700 rounded-xl p-3 outline-none focus:border-blue-500 transition-colors"
                                value={formData.subject}
                                onChange={e => setFormData({...formData, subject: e.target.value})}
                            />
                        </div>
                    </div>

                    {/* Row 2: Type, Grade, Batch */}
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-blue-400 uppercase mb-2">Type</label>
                            <select 
                                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-xl p-3 outline-none focus:border-blue-500"
                                value={formData.type}
                                onChange={e => setFormData({...formData, type: e.target.value})}
                            >
                                <option value="Practical">Practical (Coding)</option>
                                <option value="Theory">Theory (Upload)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Grade</label>
                            <select 
                                className="w-full bg-black border border-gray-700 rounded-xl p-3 outline-none"
                                value={formData.grade}
                                onChange={e => setFormData({...formData, grade: e.target.value})}
                            >
                                <option value="1">1st Year</option>
                                <option value="2">2nd Year</option>
                                <option value="3">3rd Year</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Batch</label>
                            <select 
                                className="w-full bg-black border border-gray-700 rounded-xl p-3 outline-none"
                                value={formData.batch}
                                onChange={e => setFormData({...formData, batch: e.target.value})}
                            >
                                <option value="B1">B1</option>
                                <option value="B2">B2</option>
                                <option value="B3">B3</option>
                            </select>
                        </div>
                    </div>

                    {/* Row 3: Min & Max Marks (NEW) */}
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-400 mb-2">Min Marks</label>
                            <input 
                                type="number" 
                                min="0"
                                className="w-full bg-black border border-gray-700 rounded-xl p-3 focus:border-blue-500 outline-none text-white transition-colors"
                                value={formData.min_marks}
                                onChange={e => setFormData({...formData, min_marks: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-400 mb-2">Max Marks</label>
                            <input 
                                type="number" 
                                min="1"
                                className="w-full bg-black border border-gray-700 rounded-xl p-3 focus:border-blue-500 outline-none text-white transition-colors"
                                value={formData.max_marks}
                                onChange={e => setFormData({...formData, max_marks: e.target.value})}
                            />
                        </div>
                    </div>

                    {/* Dynamic Hint */}
                    <div className={`p-3 rounded-lg text-sm flex items-center ${formData.type === 'Practical' ? 'bg-purple-900/20 text-purple-300' : 'bg-blue-900/20 text-blue-300'}`}>
                        {formData.type === 'Practical' ? <Code size={16} className="mr-2"/> : <BookOpen size={16} className="mr-2"/>}
                        {formData.type === 'Practical' 
                            ? "Students will see the Piston Code Compiler in their workspace."
                            : "Students will be asked to upload PDF/Word documents."}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-bold text-gray-400 mb-2">Problem Statement / Instructions</label>
                        <textarea 
                            rows="4"
                            placeholder="Write the full problem statement here..."
                            className="w-full bg-black border border-gray-700 rounded-xl p-3 focus:border-blue-500 outline-none text-white"
                            value={formData.description}
                            onChange={e => setFormData({...formData, description: e.target.value})}
                        ></textarea>
                    </div>

                    {/* Row 4: Deadline & File */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-red-400 mb-2">Deadline</label>
                            <input 
                                type="datetime-local" required
                                className="w-full bg-black border border-gray-700 rounded-xl p-3 outline-none text-white scheme-dark"
                                value={formData.deadline}
                                onChange={e => setFormData({...formData, deadline: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-400 mb-2">Reference Material (Optional)</label>
                            <input 
                                type="file" 
                                className="block w-full text-sm text-gray-400
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-sm file:font-semibold
                                file:bg-gray-800 file:text-blue-400
                                hover:file:bg-gray-700 cursor-pointer"
                                onChange={e => setFormData({...formData, file: e.target.files[0]})}
                            />
                        </div>
                    </div>

                    {/* Form Buttons */}
                    <div className="flex gap-4">
                        <button type="submit" className="flex-1 bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-purple-900/20 transform hover:scale-[1.01]">
                            {editId ? "Update Assignment" : "Publish Assignment"}
                        </button>
                        
                        {editId && (
                            <button type="button" onClick={handleCancelEdit} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-4 rounded-xl transition-all">
                                Cancel Edit
                            </button>
                        )}
                    </div>

                </form>
            </div>
        </div>

        {/* --- RIGHT COLUMN: LIST --- */}
        <div className="lg:col-span-1">
            <div className="bg-[#111] border border-gray-800 rounded-2xl p-6 h-full overflow-y-auto custom-scrollbar">
                <h3 className="text-xl font-bold mb-6 text-gray-200 flex items-center">
                    <Bell size={20} className="mr-2 text-yellow-500" />
                    Active Work
                </h3>

                <div className="space-y-4">
                    {loading ? <p className="text-center text-gray-500">Loading...</p> : assignments.map((item) => (
                        <div key={item.id} className="bg-black border border-gray-800 p-5 rounded-xl relative group hover:border-blue-500/50 transition-all">
                            
                            <div className="flex justify-between items-start mb-2">
                                <span className={`text-[10px] px-2 py-0.5 rounded border uppercase tracking-wider font-bold ${item.type === 'Practical' ? 'border-purple-500 text-purple-500' : 'border-blue-500 text-blue-500'}`}>
                                    {item.type}
                                </span>
                                <div className="flex gap-3">
                                    <button onClick={() => handleEdit(item)} className="text-gray-500 hover:text-blue-400 transition">
                                        <Edit size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(item.id)} className="text-gray-600 hover:text-red-500 transition">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <h4 className="font-bold text-white text-lg leading-tight mb-1">{item.title}</h4>
                            <p className="text-xs text-gray-500 mb-3">{item.subject}</p>
                            
                            {/* Marks Range Badge */}
                            <div className="mb-3">
                                <span className="text-[10px] bg-gray-900 border border-gray-700 px-2 py-1 rounded text-gray-300">
                                    Marks Range: {item.min_marks} - {item.max_marks}
                                </span>
                            </div>

                            <div className="flex items-center justify-between text-xs text-gray-400 bg-gray-900 p-2 rounded-lg">
                                <div className="flex flex-col">
                                    <span className="font-bold text-gray-300">{item.grade} - {item.batch}</span>
                                    <span className="text-[10px]">Target Class</span>
                                </div>
                                <div className="text-right">
                                    <span className="block text-red-400 font-bold">
                                        {new Date(item.deadline).toLocaleDateString()}
                                    </span>
                                    <span className="text-[10px]">Deadline</span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {!loading && assignments.length === 0 && (
                        <div className="text-center text-gray-600 mt-10 p-4 border border-dashed border-gray-800 rounded-xl">
                            No active assignments.
                        </div>
                    )}
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default FacultyAssignments;