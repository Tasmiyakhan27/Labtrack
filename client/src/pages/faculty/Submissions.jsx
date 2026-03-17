import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  Filter, FileText, ExternalLink, 
  CheckCircle, Save, Play, X, Terminal, Download 
} from 'lucide-react';
import DocViewer, { DocViewerRenderers } from "@cyntler/react-doc-viewer";

// --- UPDATED IMPORTS HERE ---
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const Submissions = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const facultyId = user?.id; 

  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showDocModal, setShowDocModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState([]);

  const [filters, setFilters] = useState({
    grade: 'All',
    batch: 'All',
    subject: 'All'
  });

  const [gradingData, setGradingData] = useState({}); 

  const [showCodeModal, setShowCodeModal] = useState(false);
  const [currentCode, setCurrentCode] = useState({ content: '', student: '' });
  const [executionOutput, setExecutionOutput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('python'); 

  const languages = [
    { name: 'Python (3.8.1)', id: 71, alias: 'python' },
    { name: 'JavaScript (Node.js 12.14.0)', id: 63, alias: 'javascript' },
    { name: 'C++ (GCC 9.2.0)', id: 54, alias: 'c++' },
    { name: 'Java (OpenJDK 13.0.1)', id: 62, alias: 'java' },
    { name: 'PHP (7.4.1)', id: 68, alias: 'php' },
  ];

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
    const delayDebounceFn = setTimeout(() => {
      fetchSubmissions();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [filters]);

  const handleGradeChange = (id, field, value) => {
    setGradingData(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }));
  };

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

  const openCodeModal = (code, studentName) => {
    setCurrentCode({ content: code, student: studentName });
    setExecutionOutput(''); 
    setShowCodeModal(true);
  };

  const openDocPreview = (filePath) => {
    const fileName = filePath.split('/').pop();
    const fileExtension = fileName.split('.').pop().toLowerCase();
    const fullUrl = `http://localhost:8000/server/api/view_file.php?file=${fileName}`;

    if (fileExtension === 'pdf' || fileExtension === 'png' || fileExtension === 'jpg') {
        setSelectedDoc([{ uri: fullUrl, fileType: fileExtension }]);
        setShowDocModal(true);
    } else {
        window.open(fullUrl, '_blank');
        alert("Word/Excel files will be downloaded for viewing.");
    }
  };

  const runCode = async () => {
    setIsExecuting(true);
    setExecutionOutput('Running on Judge0...');

    const langConfig = languages.find(l => l.alias === selectedLanguage);

    if (!langConfig) {
      setExecutionOutput("Error: Unsupported language selected.");
      setIsExecuting(false);
      return;
    }

    try {
      const payload = {
        source_code: currentCode.content,
        language_id: langConfig.id,
        stdin: "", 
      };

      const res = await axios.post(
        'https://ce.judge0.com/submissions/?base64_encoded=false&wait=true',
        payload
      );

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
      setExecutionOutput("Error: Failed to connect to compiler service.");
    } finally {
      setIsExecuting(false);
    }
  };

  // --- DATA GROUPING ---
  const assignmentTitles = [...new Set(submissions.map(s => s.assignment_title))];

  const studentsMap = {};
  submissions.forEach(sub => {
      const studentKey = sub.roll_number; 
      if (!studentsMap[studentKey]) {
          studentsMap[studentKey] = {
              student_name: sub.student_name,
              roll_number: sub.roll_number,
              batch: sub.batch,
              grade: sub.grade,
              assignments: {}
          };
      }
      if (!studentsMap[studentKey].assignments[sub.assignment_title]) {
          studentsMap[studentKey].assignments[sub.assignment_title] = [];
      }
      studentsMap[studentKey].assignments[sub.assignment_title].push(sub);
  });
  const groupedStudents = Object.values(studentsMap);

  // --- PDF GENERATION (FORMAT K3) ---
  const generatePDF = () => {
    try {
      const doc = new jsPDF('landscape', 'mm', 'a4');

      // Headers
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Format K3", 280, 15, { align: "right" });

      doc.setFontSize(12);
      doc.text("Maharashtra State Board of Technical Education", 148, 22, { align: "center" });
      doc.text("FORMATIVE ASSESSMENT OF PRACTICAL (FA-PR)", 148, 28, { align: "center" });

      // Meta Details Form
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      
      const startY = 40;
      doc.text("Institute Code and Name: __________________________________________________________________", 14, startY);
      
      doc.text(`Academic Year: __________________`, 14, startY + 8);
      doc.text(`Semester: __________________`, 105, startY + 8);
      doc.text(`Exam: Winter / Summer...................`, 185, startY + 8);

      doc.text(`Programme: _____________________`, 14, startY + 16);
      doc.text(`Course: ${filters.subject !== 'All' ? filters.subject : '___________________'}`, 105, startY + 16);
      doc.text(`Course Code: __________________`, 185, startY + 16);
      
      doc.text(`Maximum Marks: _________________`, 105, startY + 24);
      doc.text(`Minimum Marks: _________________`, 185, startY + 24);

      // Limit to exactly 12 columns to match the Format K3 Image
      const exps = assignmentTitles.slice(0, 12);

      // Table Header Structure matching the image
      const tableColumn = [
        [
          { content: 'Roll\nNo.', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
          { content: 'Enroll\nment\nNo.', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
          { content: 'Exam\nSeat\nNumber', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
          { content: 'Name of\nthe\nStudent', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
          { content: 'Experiment / Practical / Tutorial\n(Marks out of 25 per Experiment)', colSpan: 12, styles: { halign: 'center', valign: 'middle' } },
          { content: 'Total\nMarks\n(25 x\nNo. of\nExpt.)', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
          { content: 'FA Marks of\nPractical\nConverted\naccording to\nL-A Scheme\n(Max\nMarks......)', rowSpan: 2, styles: { halign: 'center', valign: 'middle', fontSize: 8 } },
          { content: 'Signature\nof\nStudent', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } }
        ],
        // Row 2: Experiment Numbers
        ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        // Row 3: Grey Numbering Row
        [
          { content: '1', styles: { halign: 'center', fillColor: [230,230,240] } },
          { content: '2', styles: { halign: 'center', fillColor: [230,230,240] } },
          { content: '3', styles: { halign: 'center', fillColor: [230,230,240] } },
          { content: '4', styles: { halign: 'center', fillColor: [230,230,240] } },
          { content: '5', colSpan: 12, styles: { halign: 'center', fillColor: [230,230,240] } },
          { content: '6', styles: { halign: 'center', fillColor: [230,230,240] } },
          { content: '7', styles: { halign: 'center', fillColor: [230,230,240] } },
          { content: '', styles: { halign: 'center', fillColor: [230,230,240] } } 
        ]
      ];

      const tableRows = [];

      // Table Data
      groupedStudents.forEach(student => {
        let marksArray = Array(12).fill('');
        let totalMarks = 0;

        exps.forEach((title, index) => {
          const subs = student.assignments[title];
          
          if (!subs || subs.length === 0) {
              marksArray[index] = 'AB';
          } else {
              const sub = subs[0];
              const currentInputMarks = gradingData[sub.submission_id]?.marks ?? sub.marks;
              
              if (currentInputMarks === null || currentInputMarks === "") {
                  marksArray[index] = 'Unassessed';
              } else {
                  marksArray[index] = currentInputMarks;
                  totalMarks += Number(currentInputMarks);
              }
          }
        });

        tableRows.push([
          student.roll_number,
          '', // Enroll No
          '', // Exam Seat
          student.student_name,
          ...marksArray,
          totalMarks > 0 ? totalMarks.toString() : '',
          '', // FA Converted
          ''  // Signature
        ]);
      });

      // --- EXPLICIT AUTOTABLE CALL HERE ---
      autoTable(doc, {
        head: tableColumn,
        body: tableRows,
        startY: startY + 32,
        theme: 'grid',
        styles: { 
          fontSize: 7, 
          cellPadding: 2,
          lineColor: [0, 0, 0],
          lineWidth: 0.1,
          textColor: [0,0,0],
          overflow: 'linebreak',
          halign: 'center',
          valign: 'middle'
        },
        headStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          fontStyle: 'bold',
          lineWidth: 0.1,
          lineColor: [0,0,0]
        },
        columnStyles: {
           0: { cellWidth: 12 }, 
           1: { cellWidth: 15 }, 
           2: { cellWidth: 15 }, 
           3: { cellWidth: 35, halign: 'left' }, 
           16: { cellWidth: 12 }, 
           17: { cellWidth: 20 }, 
           18: { cellWidth: 20 }, 
        },
        margin: { left: 14, right: 14 }
      });

      const finalY = doc.lastAutoTable.finalY || startY + 32;
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("Note: Fractional marks shall be rounded to next full number.", 14, finalY + 6);

      doc.save(`LabTrack_Format_K3_${filters.subject !== 'All' ? filters.subject : 'Report'}.pdf`);
      
    } catch (error) {
      console.error("PDF Generation Error: ", error);
      alert("Error generating PDF: " + error.message);
    }
  };

  return (
    <div className="h-screen bg-black text-white font-sans flex flex-col relative overflow-hidden">
      
      {/* HEADER */}
      <header className="h-14 border-b border-gray-800 flex items-center justify-between px-4 bg-gray-950 flex-shrink-0 z-40">
          <nav className="flex gap-6 text-xs font-medium text-gray-400">
            <span className="hover:text-white cursor-pointer" onClick={()=>navigate('/faculty/dashboard')}>Dashboard</span>
            <span className="hover:text-white cursor-pointer" onClick={()=>navigate('/faculty/timetable')}>Timetable </span>
            <span className="hover:text-white cursor-pointer" onClick={()=>navigate('/faculty/assignments')}>Assignments</span>
            <span className="text-white cursor-pointer border-b-2 border-violet-500 pb-4 pt-4">Submissions</span>
            <span className="hover:text-white cursor-pointer" onClick={()=>navigate('/faculty/resources')}>Resources</span>
            <span className="hover:text-white cursor-pointer" onClick={()=>navigate('/faculty/analysis')}>Analysis</span>
          </nav>
      </header>

      {/* --- FILTER BAR --- */}
      <div className="bg-[#111] py-2 px-4 border-b border-gray-800 flex flex-wrap gap-3 items-center flex-shrink-0">
        <div className="flex items-center gap-1 text-violet-400 font-medium text-xs mr-2">
            <Filter size={14} /> Filters:
        </div>
        
        <select className="bg-black border border-gray-700 rounded px-2 py-1 text-xs outline-none focus:border-violet-500" 
            value={filters.grade} onChange={e => setFilters({...filters, grade: e.target.value})}>
            <option value="All">All Grades</option>
            <option value="1">1st Year</option>
            <option value="2">2nd Year</option>
            <option value="3">3rd Year</option>
        </select>

        <select className="bg-black border border-gray-700 rounded px-2 py-1 text-xs outline-none focus:border-violet-500" 
            value={filters.batch} onChange={e => setFilters({...filters, batch: e.target.value})}>
            <option value="All">All Batches</option>
            <option value="B1">Batch 1 (B1)</option>
            <option value="B2">Batch 2 (B2)</option>
            <option value="B3">Batch 3 (B3)</option>
        </select>

        <input type="text" placeholder="Filter by Subject..."
            className="bg-black border border-gray-700 rounded px-2 py-1 text-xs outline-none focus:border-violet-500 w-32"
            value={filters.subject === 'All' ? '' : filters.subject}
            onChange={e => setFilters({...filters, subject: e.target.value || 'All'})}
        />
      </div>

      {/* MAIN TABLE AREA */}
      <main className="flex-1 p-4 flex flex-col min-h-0 overflow-hidden">
        <div className="bg-[#151515] border border-gray-700 rounded-t-lg flex-1 overflow-auto relative custom-scrollbar">
            {loading ? (
                <div className="p-6 text-center text-xs text-gray-500">Loading submissions...</div>
            ) : groupedStudents.length === 0 ? (
                <div className="p-6 text-center text-xs text-gray-500">No submissions found.</div>
            ) : (
                <table className="w-full text-left border-collapse min-w-max text-xs">
                    <thead>
                        <tr>
                            <th className="p-2 border-b-2 border-r-2 border-gray-600 bg-gray-900 sticky top-0 left-0 z-50 min-w-[150px] shadow-[4px_0_10px_rgba(0,0,0,0.6)] align-bottom">
                                Student
                            </th>
                            {assignmentTitles.map((title, idx) => (
                                <th key={idx} className="p-0 border-b-2 border-r-2 border-gray-600 bg-gray-900 sticky top-0 z-40 min-w-[260px] align-top">
                                    <div className="p-2 text-center font-semibold text-violet-400 border-b border-gray-700 bg-[#1a1a2e] truncate" title={title}>
                                        {title}
                                    </div>
                                    <div className="flex font-bold text-gray-400 uppercase tracking-wider text-[10px]">
                                        <div className="w-[35%] p-1.5 text-center border-r border-gray-700 bg-gray-900">Work</div>
                                        <div className="w-[65%] p-1.5 text-center bg-gray-900">Marks & Feedback</div>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {groupedStudents.map((student) => (
                            <tr key={student.roll_number} className="hover:bg-gray-900/40 transition-colors group">
                                <td className="p-2 border-b border-r-2 border-gray-600 bg-[#151515] group-hover:bg-[#1a1a1a] sticky left-0 z-30 shadow-[4px_0_10px_rgba(0,0,0,0.6)] transition-colors">
                                    <div className="font-bold text-white truncate max-w-[130px]" title={student.student_name}>{student.student_name}</div>
                                    <div className="text-[10px] text-gray-500 flex gap-1 mt-1">
                                        <span className="bg-gray-800 px-1 rounded text-white">{student.roll_number}</span>
                                        <span className="text-violet-400">{student.batch}</span>
                                    </div>
                                </td>

                                {assignmentTitles.map((title, idx) => {
                                    const subsForAssignment = student.assignments[title];

                                    if (!subsForAssignment || subsForAssignment.length === 0) {
                                        return (
                                            <td key={idx} className="p-0 border-b border-r-2 border-gray-600 bg-black/30 align-top">
                                                <div className="flex h-full items-center min-h-[50px]">
                                                    <div className="w-[35%] p-1 flex justify-center border-r border-gray-700 h-full items-center">
                                                        <span className="text-[10px] text-red-500/70 italic">Absent</span>
                                                    </div>
                                                    <div className="w-[65%] p-1 flex justify-center text-gray-700 h-full items-center">-</div>
                                                </div>
                                            </td>
                                        );
                                    }

                                    return (
                                        <td key={idx} className="p-0 border-b border-r-2 border-gray-600 align-top h-full">
                                            {subsForAssignment.map((item, i) => {
                                                const currentInputMarks = gradingData[item.submission_id]?.marks ?? item.marks;
                                                const isInvalid = currentInputMarks !== null && currentInputMarks !== "" && (parseInt(currentInputMarks) < item.min_marks || parseInt(currentInputMarks) > item.max_marks);
                                                const isUnassessed = item.marks === null || item.marks === "";

                                                return (
                                                    <div key={item.submission_id} className={`flex h-full min-h-[50px] ${i !== subsForAssignment.length - 1 ? 'border-b border-gray-700' : ''}`}>
                                                        
                                                        {/* Work Sub-Column */}
                                                        <div className="w-[35%] p-1.5 border-r border-gray-700 flex flex-col gap-1.5 bg-gray-900/10 justify-center items-center">
                                                            <div className="flex gap-1 flex-wrap justify-center">
                                                                {item.code_content && (
                                                                    <button onClick={() => openCodeModal(item.code_content, item.student_name)} className="p-1 bg-green-900/20 text-green-400 rounded hover:bg-green-600 hover:text-white" title="View Code"><Terminal size={12} /></button>
                                                                )}
                                                                {item.file_path && (
                                                                    <button onClick={() => openDocPreview(item.file_path)} className="p-1 bg-blue-900/20 text-blue-400 rounded hover:bg-blue-600 hover:text-white" title="View Document"><FileText size={12} /></button>
                                                                )}
                                                                {item.submission_link && (
                                                                    <a href={item.submission_link} target="_blank" rel="noreferrer" className="p-1 bg-purple-900/20 text-purple-400 rounded hover:bg-purple-600 hover:text-white" title="External Link"><ExternalLink size={12} /></a>
                                                                )}
                                                                {!item.code_content && !item.file_path && !item.submission_link && (
                                                                    <span className="text-[9px] text-gray-600 italic">No files</span>
                                                                )}
                                                            </div>
                                                            <div className="text-[9px] font-medium">
                                                                {isUnassessed ? <span className="text-yellow-600">Unassessed</span> : <span className="text-green-600">Graded</span>}
                                                            </div>
                                                        </div>

                                                        {/* Marks Sub-Column */}
                                                        <div className="w-[65%] p-1.5 flex flex-col gap-1.5 justify-center bg-transparent">
                                                            <div className="flex items-center gap-1.5">
                                                                <input type="number" 
                                                                    className={`w-10 bg-black border rounded p-0.5 text-center text-[11px] outline-none focus:border-violet-500 
                                                                        ${isInvalid ? 'border-red-500 text-red-400 bg-red-900/10' : 'border-gray-600'}`}
                                                                    defaultValue={item.marks} onChange={(e) => handleGradeChange(item.submission_id, 'marks', e.target.value)} placeholder="--" />
                                                                <span className="text-[10px] text-gray-500">/{item.max_marks}</span>
                                                                
                                                                <button onClick={() => saveGrade(item.submission_id, item.marks, item.feedback, item.min_marks, item.max_marks)} 
                                                                    className="ml-auto p-1 bg-violet-600 hover:bg-violet-500 rounded text-white" title="Save Grade">
                                                                    <Save size={12} />
                                                                </button>
                                                            </div>
                                                            <input type="text" 
                                                                className="w-full bg-black border border-gray-700 rounded p-1 text-[10px] focus:border-violet-500 outline-none text-gray-300" 
                                                                defaultValue={item.feedback} onChange={(e) => handleGradeChange(item.submission_id, 'feedback', e.target.value)} placeholder="Feedback..." />
                                                        </div>

                                                    </div>
                                                );
                                            })}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
        
        <div className="bg-gray-900 p-2 px-4 border border-gray-700 border-t-0 rounded-b-lg flex justify-between items-center text-xs text-gray-400 flex-shrink-0 mt-2">
            <span>Showing {groupedStudents.length} students</span>
            
            <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5"><CheckCircle size={12} className="text-green-500"/> Filters Applied</span>
                
                {/* Generate Report Button */}
                <button 
                  onClick={generatePDF} 
                  disabled={groupedStudents.length === 0}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded text-white font-medium transition-colors ${
                    groupedStudents.length === 0 
                      ? 'bg-gray-700 cursor-not-allowed' 
                      : 'bg-violet-600 hover:bg-violet-500 shadow-lg'
                  }`}
                >
                  <Download size={14} />
                  Generate Report
                </button>
            </div>
        </div>
      </main>

      {/* Code Modal */}
      {showCodeModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-[#1a1a1a] border border-gray-700 rounded-xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-3 border-b border-gray-700 bg-[#111] rounded-t-xl">
                    <div className="flex items-center gap-2">
                        <Terminal className="text-violet-500" size={16} />
                        <h3 className="text-white text-sm font-bold">{currentCode.student}'s Submission</h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <select value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)} className="bg-gray-900 text-xs text-white border border-gray-600 rounded px-2 py-1 focus:border-violet-500 outline-none">
                            {languages.map(lang => (<option key={lang.alias} value={lang.alias}>{lang.name}</option>))}
                        </select>
                        <button onClick={runCode} disabled={isExecuting} className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-all ${isExecuting ? 'bg-gray-600' : 'bg-green-600 hover:bg-green-500 text-white'}`}>
                            <Play size={12} fill="currentColor" /> {isExecuting ? 'Running...' : 'Run'}
                        </button>
                        <button onClick={() => setShowCodeModal(false)} className="p-1 bg-gray-800 hover:bg-red-900/50 hover:text-red-400 rounded transition-colors"><X size={16} /></button>
                    </div>
                </div>
                <div className="flex-1 overflow-hidden flex flex-col md:flex-row h-full">
                    <div className="flex-1 p-0 border-r border-gray-700 flex flex-col">
                        <textarea className="flex-1 w-full bg-[#0d0d0d] text-gray-300 p-3 font-mono text-xs resize-none outline-none focus:bg-black transition-colors" value={currentCode.content} onChange={(e) => setCurrentCode({...currentCode, content: e.target.value})} spellCheck="false"/>
                    </div>
                    <div className="w-full md:w-1/3 flex flex-col bg-[#0f0f0f]">
                        <pre className="flex-1 p-3 font-mono text-[10px] text-green-400 overflow-auto whitespace-pre-wrap">{executionOutput || <span className="text-gray-600 italic">Run code to see output...</span>}</pre>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {showDocModal && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
              <div className="bg-white rounded-xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
                  <div className="bg-gray-100 p-3 border-b flex justify-between items-center">
                      <span className="text-black text-sm font-bold">Document Preview</span>
                      <button onClick={() => setShowDocModal(false)} className="p-1.5 bg-gray-200 hover:bg-red-500 hover:text-white rounded-full text-black transition-colors">
                          <X size={16} />
                      </button>
                  </div>
                  <div className="flex-1">
                      <DocViewer documents={selectedDoc} pluginRenderers={DocViewerRenderers} theme={{ primary: "#8b5cf6", secondary: "#ffffff", tertiary: "#f3f4f6" }} />
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default Submissions;