import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Search, Filter, FileText, ExternalLink, 
  CheckCircle, Save, Download, Eye, Play, X, Terminal 
} from 'lucide-react';

const Submissions = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const facultyId = user?.id; 

  // --- STATE ---
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters State
  const [filters, setFilters] = useState({
    grade: 'All',
    batch: 'All',
    subject: 'All'
  });

  // Grading State
  const [gradingData, setGradingData] = useState({}); 

  // --- CODE EXECUTION STATE ---
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [currentCode, setCurrentCode] = useState({ content: '', student: '' });
  const [executionOutput, setExecutionOutput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('python'); 

  // Supported Judge0 Languages (IDs are required)
  const languages = [
    { name: 'Python (3.8.1)', id: 71, alias: 'python' },
    { name: 'JavaScript (Node.js 12.14.0)', id: 63, alias: 'javascript' },
    { name: 'C++ (GCC 9.2.0)', id: 54, alias: 'c++' },
    { name: 'Java (OpenJDK 13.0.1)', id: 62, alias: 'java' },
    { name: 'PHP (7.4.1)', id: 68, alias: 'php' },
  ];

  // --- 1. FETCH DATA ---
  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('faculty_id', facultyId);
      
      if (filters.grade !== 'All') params.append('grade', filters.grade);
      if (filters.batch !== 'All') params.append('batch', filters.batch);
      if (filters.subject !== 'All') params.append('subject', filters.subject);

      const res = await axios.get(`http://localhost:8000/server/api/faculty/submissions.php?${params.toString()}`);
      setSubmissions(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching submissions:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [filters]);

  // --- 2. HANDLE GRADING INPUT ---
  const handleGradeChange = (id, field, value) => {
    setGradingData(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }));
  };

  // --- 3. SAVE GRADE ---
  const saveGrade = async (submissionId, originalMarks, originalFeedback, min, max) => {
    const newData = gradingData[submissionId];
    const marks = newData?.marks ?? originalMarks;
    const feedback = newData?.feedback ?? originalFeedback;

    if (marks !== null && marks !== "") {
        if (parseInt(marks) < min || parseInt(marks) > max) {
            alert(`Error: Marks must be between ${min} and ${max}`);
            return;
        }
    }

    try {
      await axios.post('http://localhost:8000/server/api/faculty/submissions.php', {
        submission_id: submissionId,
        marks: marks,
        feedback: feedback
      });
      alert("Grade Saved!");
      fetchSubmissions(); 
    } catch (err) {
      alert("Failed to save grade.");
    }
  };

  // --- 4. CODE MODAL LOGIC ---
  const openCodeModal = (code, studentName) => {
    setCurrentCode({ content: code, student: studentName });
    setExecutionOutput(''); 
    setShowCodeModal(true);
  };

 const runCode = async () => {
    setIsExecuting(true);
    setExecutionOutput('Running on Judge0...');

    // 1. Find the ID for Judge0 based on selection
    const langConfig = languages.find(l => l.alias === selectedLanguage);

    // Safety check
    if (!langConfig) {
      setExecutionOutput("Error: Unsupported language selected.");
      setIsExecuting(false);
      return;
    }

    try {
      // 2. Prepare Payload for Judge0
      const payload = {
        source_code: currentCode.content,
        language_id: langConfig.id,
        stdin: "", // Standard input (leave empty for now)
      };

      // 3. Send Request to Judge0 CE (Community Edition)
      // 'wait=true' makes it wait for the result (synchronous)
      const res = await axios.post(
        'https://ce.judge0.com/submissions/?base64_encoded=false&wait=true',
        payload
      );

      // 4. Handle Response
      if (res.data.stdout) {
        setExecutionOutput(res.data.stdout);
      } else if (res.data.stderr) {
        setExecutionOutput("Runtime Error:\n" + res.data.stderr);
      } else if (res.data.compile_output) {
        setExecutionOutput("Compilation Error:\n" + res.data.compile_output);
      } else if (res.data.message) {
        setExecutionOutput("Error: " + res.data.message);
      } else {
        setExecutionOutput("Execution completed with no output.");
      }

    } catch (error) {
      console.error("Judge0 API Error:", error);
      setExecutionOutput("Error: Failed to connect to compiler service. It might be overloaded.");
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col relative">
      
      {/* HEADER */}
      <header className="h-16 border-b border-gray-800 flex items-center justify-between px-6 bg-gray-950 sticky top-0 z-30">
          <nav className="flex gap-8 text-sm font-medium text-gray-400">
            <span className="hover:text-white cursor-pointer" onClick={()=>navigate('/faculty/dashboard')}>Dashboard</span>
            <span className="hover:text-white cursor-pointer" onClick={()=>navigate('/faculty/timetable')}>Timetable </span>
            <span className="hover:text-white cursor-pointer" onClick={()=>navigate('/faculty/assignments')}>Assignments</span>
            <span className="text-white cursor-pointer border-b-2 border-violet-500 pb-5 pt-5">Submissions</span>
            <span className="hover:text-white cursor-pointer" onClick={()=>navigate('/faculty/resources')}>Resources</span>
            <span className="hover:text-white cursor-pointer" onClick={()=>navigate('/faculty/analysis')}>Analysis</span>
          </nav>
      </header>

      {/* --- FILTER BAR --- */}
      <div className="bg-[#111] p-4 border-b border-gray-800 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 text-violet-400 font-medium text-sm mr-2">
            <Filter size={16} /> Filters:
        </div>
        
        <select 
            className="bg-black border border-gray-700 rounded px-3 py-2 text-sm outline-none focus:border-violet-500" 
            value={filters.grade} 
            onChange={e => setFilters({...filters, grade: e.target.value})}
        >
            <option value="All">All Grades</option>
            <option value="1">1st Year</option>
            <option value="2">2nd Year</option>
            <option value="3">3rd Year</option>
        </select>

        <select 
            className="bg-black border border-gray-700 rounded px-3 py-2 text-sm outline-none focus:border-violet-500" 
            value={filters.batch} 
            onChange={e => setFilters({...filters, batch: e.target.value})}
        >
            <option value="All">All Batches</option>
            <option value="B1">Batch 1 (B1)</option>
            <option value="B2">Batch 2 (B2)</option>
            <option value="B3">Batch 3 (B3)</option>
        </select>

        <input 
            type="text"
            placeholder="Filter by Subject..."
            className="bg-black border border-gray-700 rounded px-3 py-2 text-sm outline-none focus:border-violet-500 w-40"
            value={filters.subject === 'All' ? '' : filters.subject}
            onChange={e => setFilters({...filters, subject: e.target.value || 'All'})}
        />
      </div>

      {/* MAIN TABLE AREA */}
      <main className="flex-1 p-6 overflow-x-auto">
        <div className="bg-[#151515] border border-gray-800 rounded-lg overflow-hidden min-w-[1000px]">
            {/* Table Header */}
            <div className="grid grid-cols-12 bg-gray-900 p-4 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-800">
                <div className="col-span-3">Student Details</div>
                <div className="col-span-3">Assignment</div>
                <div className="col-span-2">Submitted Work</div>
                <div className="col-span-1">Marks</div>
                <div className="col-span-2">Feedback</div>
                <div className="col-span-1 text-center">Action</div>
            </div>

            {/* Table Body */}
            {loading ? (
                <div className="p-10 text-center text-gray-500">Loading submissions...</div>
            ) : submissions.length === 0 ? (
                <div className="p-10 text-center text-gray-500">No submissions found.</div>
            ) : (
                submissions.map((item) => {
                    const currentInputMarks = gradingData[item.submission_id]?.marks ?? item.marks;
                    const isInvalid = currentInputMarks !== null && currentInputMarks !== "" && (parseInt(currentInputMarks) < item.min_marks || parseInt(currentInputMarks) > item.max_marks);

                    return (
                    <div key={item.submission_id} className="grid grid-cols-12 p-4 border-b border-gray-800 items-center hover:bg-gray-900/50 transition-colors">
                        
                        {/* 1. Student Details */}
                        <div className="col-span-3">
                            <div className="font-bold text-white">{item.student_name}</div>
                            <div className="text-xs text-gray-500 flex gap-2 mt-1">
                                <span className="bg-gray-800 px-1.5 rounded">{item.roll_number}</span>
                                <span className="text-violet-400">{item.batch}</span>
                                <span className="text-gray-500 border border-gray-700 px-1 rounded">
                                    {item.grade === '1' ? 'FY' : item.grade === '2' ? 'SY' : 'TY'}
                                </span>
                            </div>
                        </div>

                        {/* 2. Assignment Info */}
                        <div className="col-span-3 pr-4">
                            <div className="text-sm font-medium text-gray-300 truncate" title={item.assignment_title}>{item.assignment_title}</div>
                            <div className="text-xs text-gray-500 mt-1">
                                {new Date(item.submitted_at).toLocaleDateString()}
                            </div>
                        </div>

                        {/* 3. Submitted Work */}
                        <div className="col-span-2 flex gap-2">
                            {item.code_content && (
                                <button onClick={() => openCodeModal(item.code_content, item.student_name)} className="p-2 bg-green-900/20 text-green-400 rounded hover:bg-green-600 hover:text-white transition-colors">
                                    <Terminal size={16} />
                                </button>
                            )}
                            {item.file_path && (
                                /* --- FIXED LINK: Removed '/server' prefix --- */
                                <a href={`http://localhost:8000/server/api/${item.file_path}`} target="_blank" rel="noreferrer" className="p-2 bg-blue-900/20 text-blue-400 rounded hover:bg-blue-600 hover:text-white transition-colors">
                                    <FileText size={16} />
                                </a>
                            )}
                            {item.submission_link && (
                                <a href={item.submission_link} target="_blank" rel="noreferrer" className="p-2 bg-purple-900/20 text-purple-400 rounded hover:bg-purple-600 hover:text-white transition-colors">
                                    <ExternalLink size={16} />
                                </a>
                            )}
                            {!item.code_content && !item.file_path && !item.submission_link && (
                                <span className="text-xs text-gray-600 italic">No files</span>
                            )}
                        </div>

                        {/* 4. Marks Input */}
                        <div className="col-span-1 flex flex-col">
                            <div className="flex items-center gap-1">
                                <input 
                                    type="number" 
                                    className={`w-14 bg-black border rounded p-1.5 text-center text-sm outline-none focus:border-violet-500 
                                        ${isInvalid ? 'border-red-500 text-red-400' : 'border-gray-700'}`}
                                    defaultValue={item.marks} 
                                    onChange={(e) => handleGradeChange(item.submission_id, 'marks', e.target.value)} 
                                    placeholder="--" 
                                />
                                <span className="text-xs text-gray-500">/{item.max_marks}</span>
                            </div>
                            <span className="text-[10px] text-gray-500 mt-1">Range: {item.min_marks}-{item.max_marks}</span>
                        </div>

                        {/* 5. Feedback Input */}
                        <div className="col-span-2 px-2">
                            <input type="text" className="w-full bg-black border border-gray-700 rounded p-1.5 text-sm focus:border-violet-500 outline-none" defaultValue={item.feedback} onChange={(e) => handleGradeChange(item.submission_id, 'feedback', e.target.value)} placeholder="Write review..." />
                        </div>

                        {/* 6. Save Button */}
                        <div className="col-span-1 flex justify-center">
                            <button onClick={() => saveGrade(item.submission_id, item.marks, item.feedback, item.min_marks, item.max_marks)} className="p-2 bg-violet-600 hover:bg-violet-700 rounded text-white shadow-lg transition-all">
                                <Save size={16} />
                            </button>
                        </div>
                    </div>
                )})
)}
            
            <div className="bg-gray-900 p-4 border-t border-gray-800 flex justify-between items-center text-sm text-gray-400">
                <span>Showing {submissions.length} submissions</span>
                <span className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500"/> Filters Applied</span>
            </div>
        </div>
      </main>

      {/* Code Modal */}
      {showCodeModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1a1a] border border-gray-700 rounded-xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-[#111] rounded-t-xl">
                    <div className="flex items-center gap-3">
                        <Terminal className="text-violet-500" size={20} />
                        <h3 className="text-white font-bold">{currentCode.student}'s Submission</h3>
                    </div>
                    <div className="flex items-center gap-3">
                        <select value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)} className="bg-gray-900 text-sm text-white border border-gray-600 rounded px-3 py-1.5 focus:border-violet-500 outline-none">
                            {languages.map(lang => (<option key={lang.alias} value={lang.alias}>{lang.name}</option>))}
                        </select>
                        <button onClick={runCode} disabled={isExecuting} className={`flex items-center gap-2 px-4 py-1.5 rounded text-sm font-medium transition-all ${isExecuting ? 'bg-gray-600' : 'bg-green-600 hover:bg-green-700 text-white'}`}>
                            <Play size={14} fill="currentColor" /> {isExecuting ? 'Running...' : 'Run Code'}
                        </button>
                        <button onClick={() => setShowCodeModal(false)} className="p-1.5 bg-gray-800 hover:bg-red-900/50 hover:text-red-400 rounded transition-colors"><X size={20} /></button>
                    </div>
                </div>
                <div className="flex-1 overflow-hidden flex flex-col md:flex-row h-full">
                    <div className="flex-1 p-0 border-r border-gray-700 flex flex-col">
                        <textarea className="flex-1 w-full bg-[#0d0d0d] text-gray-300 p-4 font-mono text-sm resize-none outline-none focus:bg-black transition-colors" value={currentCode.content} onChange={(e) => setCurrentCode({...currentCode, content: e.target.value})} spellCheck="false"/>
                    </div>
                    <div className="w-full md:w-1/3 flex flex-col bg-[#0f0f0f]">
                        <pre className="flex-1 p-4 font-mono text-xs text-green-400 overflow-auto whitespace-pre-wrap">{executionOutput || <span className="text-gray-600 italic">Run code to see output...</span>}</pre>
                    </div>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default Submissions;