import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Clock, ChevronLeft, CheckCircle, Upload, FileText, Terminal, Link as LinkIcon, AlertTriangle } from 'lucide-react';

const StudentWorkspace = () => {
  const { id } = useParams(); 
  const navigate = useNavigate();
  
  // Data State
  const [assignment, setAssignment] = useState(null);
  const [user, setUser] = useState(null);
  
  // Submission State
  const [code, setCode] = useState('// Write your code here...');
  const [output, setOutput] = useState('');
  const [file, setFile] = useState(null);
  const [link, setLink] = useState('');
  
  // UI State
  const [language, setLanguage] = useState('python');
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);

  // --- CHANGED: Judge0 Configuration (IDs instead of versions) ---
  const LANGUAGES = {
    python: { id: 71, name: "Python (3.8.1)" },
    javascript: { id: 63, name: "JavaScript (Node.js 12.14.0)" },
    cpp: { id: 54, name: "C++ (GCC 9.2.0)" },
    java: { id: 62, name: "Java (OpenJDK 13.0.1)" },
    php: { id: 68, name: "PHP (7.4.1)" }
  };

  // 1. Fetch Assignment Details
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('studentUser'));
    if (storedUser) setUser(storedUser);

    fetch(`http://localhost:8000/server/api/student/get_assignment_details.php?id=${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setAssignment(data.data);
          // Initialize Timer
          const deadline = new Date(data.data.deadline).getTime();
          const now = new Date().getTime();
          setTimeLeft(Math.max(0, Math.floor((deadline - now) / 1000)));
        } else {
          alert(data.message); 
          navigate('/student/assignments'); 
        }
      })
      .catch(err => {
        console.error("Fetch Error:", err);
        alert("Could not connect to server. Please check your connection.");
        navigate('/student/assignments');
      });
  }, [id, navigate]);

  // 2. Countdown Timer
  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft === 0) {
      handleAutoSubmit(); 
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  // --- CHANGED: RUN CODE (Judge0 API) ---
  const runCode = async () => {
    setIsRunning(true);
    setOutput("Running on Judge0...");
    
    try {
      const langId = LANGUAGES[language].id;

      // 'wait=true' keeps the connection open until execution finishes
      const response = await fetch("https://ce.judge0.com/submissions/?base64_encoded=false&wait=true", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_code: code,
          language_id: langId,
          stdin: "" // Standard input
        })
      });

      const result = await response.json();

      // Handle Judge0 Output Fields
      if (result.stdout) {
        setOutput(result.stdout);
      } else if (result.stderr) {
        setOutput("Runtime Error:\n" + result.stderr);
      } else if (result.compile_output) {
        setOutput("Compilation Error:\n" + result.compile_output);
      } else if (result.message) {
        setOutput("Error: " + result.message);
      } else {
        setOutput("Execution finished with no output.");
      }

    } catch (error) {
      console.error(error);
      setOutput("Error connecting to compiler service. It might be overloaded.");
    } finally {
      setIsRunning(false);
    }
  };

  // 4. SUBMIT ASSIGNMENT
  const handleSubmit = async () => {
    if (!user) return;
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('assignment_id', id);
    formData.append('student_id', user.id);
    formData.append('link', link); 
    
    if (assignment.type === 'Practical') {
        formData.append('code', code); 
    } else {
        if (file) formData.append('file', file);
    }

    try {
      const response = await fetch('http://localhost:8000/server/api/student/submit_assignment.php', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      
      if (data.success) {
        alert("✅ " + data.message);
        navigate('/student/dashboard');
      } else {
        alert("❌ SUBMISSION FAILED\n\n" + data.message);
      }
    } catch (error) {
      alert("Network Error: Could not reach server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAutoSubmit = () => {
    alert("⏳ Time is up! Attempting auto-submission...");
    handleSubmit();
  };

  // Loading State
  if (!assignment) return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>Verifying Access & Loading Workspace...</p>
        </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-[#0d0d0d] text-gray-300 font-sans overflow-hidden">
      
      {/* --- TOP HEADER --- */}
      <header className="h-16 border-b border-gray-800 bg-[#111] flex items-center justify-between px-6 shadow-lg z-10">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate('/student/assignments')} className="p-2 hover:bg-gray-800 rounded-lg transition">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-white font-bold text-lg truncate max-w-md">{assignment.title}</h1>
            <div className="flex items-center space-x-2">
                <span className={`text-[10px] px-2 py-0.5 rounded border ${assignment.type === 'Practical' ? 'border-purple-500 text-purple-400' : 'border-blue-500 text-blue-400'}`}>
                    {assignment.type}
                </span>
                <span className="text-xs text-gray-500">{assignment.subject}</span>
            </div>
          </div>
        </div>

        {/* Timer */}
        <div className={`flex items-center space-x-2 font-mono text-lg font-bold px-4 py-2 rounded-lg border ${timeLeft < 300 ? 'bg-red-900/20 text-red-500 border-red-900 animate-pulse' : 'bg-gray-800 border-gray-700 text-blue-400'}`}>
          <Clock size={18} />
          <span>{timeLeft !== null ? formatTime(timeLeft) : "--:--:--"}</span>
        </div>

        {/* Submit Button */}
        <button 
          onClick={handleSubmit} 
          disabled={isSubmitting}
          className="flex items-center space-x-2 bg-linear-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white px-6 py-2 rounded-lg font-bold transition shadow-lg shadow-green-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? <span>Sending...</span> : (
            <>
              <CheckCircle size={18} />
              <span>Submit</span>
            </>
          )}
        </button>
      </header>

      {/* --- MAIN SPLIT SCREEN --- */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT PANEL: PROBLEM & LINKS */}
        <div className="w-1/3 bg-[#0d0d0d] border-r border-gray-800 flex flex-col overflow-y-auto custom-scrollbar">
          <div className="p-8 pb-40">
            <h2 className="text-2xl font-bold text-white mb-6">Problem Statement</h2>
            <div className="prose prose-invert max-w-none text-gray-400 mb-8 leading-relaxed whitespace-pre-wrap">
              {assignment.description}
            </div>

            {/* Submission Link Input */}
            <div className="bg-[#161616] p-5 rounded-xl border border-gray-800 mb-6">
                <label className="block text-sm font-bold text-gray-300 mb-2 items-center">
                    <LinkIcon size={16} className="mr-2 text-blue-400"/>
                    Project Link (Optional)
                </label>
                <input 
                    type="url" 
                    placeholder="Paste Figma, GitHub, or Drive link here..."
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    className="w-full bg-black border border-gray-700 text-white rounded-lg px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
            </div>

            {/* Rules */}
            <div className="p-5 bg-blue-900/10 rounded-xl border border-blue-900/30">
              <h3 className="text-sm font-bold text-blue-400 mb-2 flex items-center">
                <AlertTriangle size={16} className="mr-2" />
                Submission Rules:
              </h3>
              <ul className="list-disc list-inside text-sm text-gray-400 space-y-1">
                <li>Must be on <strong>College Lab Network</strong>.</li>
                <li>Submission marks you <strong>Present</strong>.</li>
                <li>One submission per session allowed.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: EDITOR OR UPLOAD */}
        <div className="flex-1 flex flex-col bg-[#1e1e1e] relative">
            
            {assignment.type === 'Practical' ? (
                // --- CODE EDITOR ---
                <>
                    <div className="h-12 bg-[#252526] border-b border-gray-700 flex items-center justify-between px-4">
                        <div className="flex items-center space-x-4">
                            <span className="text-xs text-gray-400 uppercase font-bold">Language:</span>
                            <select 
                                value={language} 
                                onChange={(e) => setLanguage(e.target.value)}
                                className="bg-[#3c3c3c] text-white text-sm px-3 py-1 rounded border border-gray-600 focus:outline-none focus:border-blue-500"
                            >
                                <option value="python">Python 3</option>
                                <option value="javascript">Node JS</option>
                                <option value="cpp">C++</option>
                                <option value="java">Java</option>
                                <option value="php">PHP</option>
                            </select>
                        </div>
                        <button onClick={runCode} disabled={isRunning} className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded text-sm font-bold transition">
                            <Play size={14} />
                            <span>{isRunning ? "Running..." : "Run Code"}</span>
                        </button>
                    </div>

                    <textarea
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        className="flex-1 bg-[#1e1e1e] text-gray-300 font-mono text-sm p-4 resize-none focus:outline-none leading-6"
                        spellCheck="false"
                        placeholder="// Write your code here..."
                    ></textarea>

                    <div className="h-1/3 bg-[#0d0d0d] border-t border-gray-700 flex flex-col">
                        <div className="h-8 bg-[#252526] px-4 flex items-center text-xs text-gray-400 font-bold border-b border-gray-800">
                            <Terminal size={12} className="mr-2" /> CONSOLE OUTPUT
                        </div>
                        <pre className="flex-1 p-4 font-mono text-sm text-green-400 overflow-y-auto whitespace-pre-wrap">
                            {output || "Waiting for output..."}
                        </pre>
                    </div>
                </>
            ) : (
                // --- FILE UPLOAD ---
                <div className="flex-1 flex flex-col items-center justify-center p-12 bg-[#121212]">
                    <div className="max-w-md w-full text-center">
                        <div className="bg-gray-800/50 p-6 rounded-full w-24 h-24 mx-auto flex items-center justify-center mb-6">
                            <FileText size={48} className="text-purple-500" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Upload Theory Document</h3>
                        <p className="text-gray-500 mb-8">Upload your answer script as PDF/Word.</p>

                        <div className="border-2 border-dashed border-gray-700 rounded-2xl p-10 hover:bg-gray-800/50 transition cursor-pointer relative group">
                            <input 
                                type="file" 
                                onChange={(e) => setFile(e.target.files[0])}
                                accept=".pdf,.doc,.docx"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            {file ? (
                                <div className="text-green-400 font-bold flex flex-col items-center">
                                    <CheckCircle size={32} className="mb-2" />
                                    <span>{file.name}</span>
                                </div>
                            ) : (
                                <div className="text-gray-400 group-hover:text-white transition flex flex-col items-center">
                                    <Upload size={32} className="mb-2" />
                                    <span className="font-medium">Browse File</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

        </div>
      </div>
    </div>
  );
};

export default StudentWorkspace;