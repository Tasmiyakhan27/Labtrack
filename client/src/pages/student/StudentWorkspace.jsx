import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Clock, ChevronLeft, CheckCircle, Terminal, Link as LinkIcon, AlertTriangle } from 'lucide-react';

const StudentWorkspace = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Your IPv4 address
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const [assignment, setAssignment] = useState(null);
  const [user, setUser] = useState(null);
  const [code, setCode] = useState('// Write your code here...');
  const [output, setOutput] = useState('');
  const [file, setFile] = useState(null);
  const [link, setLink] = useState('');
  const [language, setLanguage] = useState('python');
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);

  const LANGUAGES = {
         C : {id: 50, alias: 'c'},

    python: { id: 71, name: "Python 3" },
    javascript: { id: 63, name: "Node JS" },
    cpp: { id: 54, name: "C++" },
    java: { id: 62, name: "Java" },
    php: { id: 68, name: "PHP" }
  };

  // 1. Fetch Assignment Details
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('studentUser'));
    const token = localStorage.getItem('token');

    if (!storedUser || !token) {
      navigate('/login/student');
      return;
    }
    setUser(storedUser);

    fetch(`${API_BASE_URL}/server/api/student/get_assignment_details.php?id=${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setAssignment(data.data);
          const deadline = new Date(data.data.deadline).getTime();
          const now = new Date().getTime();
          setTimeLeft(Math.max(0, Math.floor((deadline - now) / 1000)));
        } else {
          alert(data.message);
          navigate('/student/assignments');
        }
      })
      .catch(() => alert("Network Error: Check if PHP server is running at " + API_BASE_URL));
  }, [id, navigate]);

  // 2. RUN CODE
  const runCode = async () => {
    setIsRunning(true);
    setOutput("Running...");
    try {
      const response = await fetch("https://ce.judge0.com/submissions/?base64_encoded=false&wait=true", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source_code: code, language_id: LANGUAGES[language].id })
      });
      const result = await response.json();
      setOutput(result.stdout || result.stderr || result.compile_output || "No output.");
    } catch (error) {
      setOutput("Error connecting to compiler.");
    } finally { setIsRunning(false); }
  };

  // 3. SUBMIT
  const handleSubmit = async () => {
    const token = localStorage.getItem('token');
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('assignment_id', id);
    formData.append('link', link);
    if (assignment.type === 'Practical') formData.append('code', code);
    else if (file) formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE_URL}/server/api/student/submit_assignment.php`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await response.json();
      if (data.success) {
        alert("✅ " + data.message);
        navigate('/student/dashboard');
      } else {
        alert("❌ " + data.message);
      }
    } catch (error) {
      alert("Submission Error.");
    } finally { setIsSubmitting(false); }
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  if (!assignment) return <div className="h-screen bg-black flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="h-screen flex flex-col bg-[#0d0d0d] text-gray-300 overflow-hidden font-sans">
      
      {/* HEADER */}
      <header className="h-16 border-b border-gray-800 bg-[#111] flex items-center justify-between px-6 z-10">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate('/student/assignments')} className="p-2 hover:bg-gray-800 rounded-lg transition text-gray-400">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-white font-bold text-lg">{assignment.title}</h1>
            <div className="flex items-center space-x-2">
                <span className="text-[10px] px-2 py-0.5 rounded border border-purple-500 text-purple-400 uppercase">
                    {assignment.type}
                </span>
                <span className="text-xs text-gray-500">{assignment.subject}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 bg-blue-900/30 text-blue-400 px-4 py-2 rounded-lg border border-blue-900/50 font-mono font-bold">
          <Clock size={18} />
          <span>{timeLeft !== null ? formatTime(timeLeft) : "--h --m --s"}</span>
        </div>

        <button 
          onClick={handleSubmit} 
          disabled={isSubmitting}
          className="flex items-center space-x-2 bg-[#10b981] hover:bg-[#059669] text-white px-6 py-2 rounded-lg font-bold transition disabled:opacity-50"
        >
          <CheckCircle size={18} />
          <span>{isSubmitting ? "Sending..." : "Submit"}</span>
        </button>
      </header>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT PANEL */}
        <div className="w-1/3 border-r border-gray-800 p-8 overflow-y-auto">
          <h2 className="text-2xl font-bold text-white mb-6">Problem Statement</h2>
          <p className="text-gray-400 mb-8 whitespace-pre-wrap">{assignment.description}</p>

          <div className="bg-[#161616] p-5 rounded-xl border border-gray-800 mb-6">
            <label className="flex items-center text-sm font-bold text-gray-300 mb-3">
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

          <div className="p-5 bg-blue-900/10 rounded-xl border border-blue-900/30">
            <h3 className="text-sm font-bold text-blue-400 mb-3 flex items-center">
              <AlertTriangle size={16} className="mr-2" />
              Submission Rules:
            </h3>
            <ul className="list-disc list-inside text-sm text-gray-400 space-y-2">
              <li>Must be on <span className="text-gray-300 font-bold">College Lab Network</span>.</li>
              <li>Submission marks you <span className="text-gray-300 font-bold">Present</span>.</li>
              <li>One submission per session allowed.</li>
            </ul>
          </div>
        </div>

        {/* RIGHT PANEL (EDITOR) */}
        <div className="flex-1 flex flex-col bg-[#1e1e1e]">
          
          {assignment.type === 'Practical' ? (
            <>
              <div className="h-12 bg-[#252526] border-b border-gray-700 flex items-center justify-between px-4">
                <div className="flex items-center space-x-4">
                  <span className="text-xs text-gray-400 font-bold uppercase">Language:</span>
                  <select 
                    value={language} 
                    onChange={(e) => setLanguage(e.target.value)}
                    className="bg-[#3c3c3c] text-white text-sm px-3 py-1 rounded border border-gray-600 focus:outline-none"
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
                className="flex-1 bg-[#1e1e1e] text-gray-300 font-mono text-sm p-6 outline-none resize-none leading-relaxed"
                spellCheck="false"
              ></textarea>

              <div className="h-1/3 bg-[#0d0d0d] border-t border-gray-700 flex flex-col">
                <div className="h-8 bg-[#252526] px-4 flex items-center text-[10px] text-gray-400 font-bold border-b border-gray-800">
                  <Terminal size={12} className="mr-2" /> CONSOLE OUTPUT
                </div>
                <pre className="flex-1 p-4 font-mono text-sm text-green-400 overflow-y-auto">
                  {output || "Waiting for output..."}
                </pre>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
               <label className="cursor-pointer bg-gray-800/50 p-10 rounded-2xl border-2 border-dashed border-gray-700 hover:border-blue-500 transition">
                  <input type="file" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
                  <span className="text-gray-400">{file ? file.name : "Click to Upload Theory File"}</span>
               </label>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentWorkspace;