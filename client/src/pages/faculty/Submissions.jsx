import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  Filter, FileText, ExternalLink, 
  CheckCircle, Save, Play, X, Terminal, Download 
} from 'lucide-react';
import DocViewer, { DocViewerRenderers } from "@cyntler/react-doc-viewer";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from 'xlsx';

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
  const [selectedLanguage, setSelectedLanguage] = useState('c'); // Defaulted to C

  // --- UPDATED: Added C (ID 50) to the languages array ---
  const languages = [
    { name: 'C (GCC 9.2.0)', id: 50, alias: 'c' },
    { name: 'C++ (GCC 9.2.0)', id: 54, alias: 'c++' },
    { name: 'Python (3.8.1)', id: 71, alias: 'python' },
    { name: 'JavaScript (Node.js 12.14.0)', id: 63, alias: 'javascript' },
    { name: 'Java (OpenJDK 13.0.1)', id: 62, alias: 'java' },
    { name: 'PHP (7.4.1)', id: 68, alias: 'php' },
  ];

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token'); 
      
      const params = new URLSearchParams();
      params.append('faculty_id', facultyId);
      
      if (filters.grade !== 'All') params.append('grade', filters.grade);
      if (filters.batch !== 'All') params.append('batch', filters.batch);
      if (filters.subject !== 'All') params.append('subject', filters.subject);

      const res = await axios.get(`http://localhost:8000/server/api/faculty/submissions.php?${params.toString()}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
      });
      
      setSubmissions(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching submissions:", err);
      if (err.response && err.response.status === 401) {
          navigate('/login');
      }
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
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:8000/server/api/faculty/submissions.php', {
        submission_id: submissionId,
        marks: marks,
        feedback: feedback
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
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
  
  const groupedStudents = Object.values(studentsMap).sort((a, b) => 
    a.roll_number.localeCompare(b.roll_number, undefined, { numeric: true })
  );

  const generateExcel = () => {
    try {
      const uniqueSubjects = [...new Set(submissions.map(s => s.subject_name).filter(Boolean))];
      const displaySubject = uniqueSubjects.length === 1 ? uniqueSubjects[0] : (filters.subject !== 'All' ? filters.subject : '___________________');
      
      const exps = assignmentTitles;
      const numExps = exps.length > 0 ? exps.length : 1; 

      const excelAOA = [
        [...Array(4 + numExps).fill(""), "Format K3"], 
        ["Maharashtra State Board of Technical Education"], 
        ["FORMATIVE ASSESSMENT OF PRACTICAL (FA-PR)"], 
        [], 
        ["Institute Code and Name:", "__________________________________________________________________"], 
        ["Academic Year:", "2025-26", "", "Semester:", "________", "", "Exam:", "Winter / Summer..................."], 
        ["Programme:", "_____________________", "", "Course:", displaySubject, "", "Course Code:", "__________________"], 
        ["", "", "", "Maximum Marks:", "_________________", "", "Minimum Marks:", "_________________"], 
        [], 
        ["Sr No.", "Enrollment No.", "Exam Seat Number", "Name of the Student", "Experiment / Practical / Tutorial (Marks out of 25)"] 
      ];

      for (let i = 1; i < numExps; i++) {
          excelAOA[9].push("");
      }
      excelAOA[9].push("Total Marks", "FA Marks", "Signature");

      const headerRow2 = ["", "", "", ""]; 
      exps.forEach((_, i) => headerRow2.push((i + 1).toString()));
      headerRow2.push("", "", "");
      excelAOA.push(headerRow2);

      const headerRow3 = ["1", "2", "3", "4"];
      exps.forEach(() => headerRow3.push("5"));
      headerRow3.push("6", "7", "");
      excelAOA.push(headerRow3);

      groupedStudents.forEach((student, index) => {
        let total = 0;
        const marksRow = exps.map(title => {
          const subs = student.assignments[title];
          if (!subs || subs.length === 0) return 'AB';
          const sub = subs[0];
          const m = gradingData[sub.submission_id]?.marks ?? sub.marks;
          if (m === null || m === "") return "UA";
          total += Number(m);
          return m;
        });

        excelAOA.push([
          index + 1,
          student.roll_number,
          "", 
          student.student_name,
          ...marksRow,
          total > 0 ? total : "",
          "", 
          ""  
        ]);
      });

      const ws = XLSX.utils.aoa_to_sheet(excelAOA);

      ws['!merges'] = [
        { s: { r: 1, c: 0 }, e: { r: 1, c: 4 + numExps } }, 
        { s: { r: 2, c: 0 }, e: { r: 2, c: 4 + numExps } }, 
        { s: { r: 9, c: 0 }, e: { r: 10, c: 0 } }, 
        { s: { r: 9, c: 1 }, e: { r: 10, c: 1 } }, 
        { s: { r: 9, c: 2 }, e: { r: 10, c: 2 } }, 
        { s: { r: 9, c: 3 }, e: { r: 10, c: 3 } }, 
        { s: { r: 9, c: 4 }, e: { r: 9, c: 4 + numExps - 1 } }, 
        { s: { r: 9, c: 4 + numExps }, e: { r: 10, c: 4 + numExps } }, 
        { s: { r: 9, c: 4 + numExps + 1 }, e: { r: 10, c: 4 + numExps + 1 } }, 
        { s: { r: 9, c: 4 + numExps + 2 }, e: { r: 10, c: 4 + numExps + 2 } }  
      ];

      ws['!cols'] = [
        { wch: 8 },  
        { wch: 20 }, 
        { wch: 15 }, 
        { wch: 35 }, 
        ...Array(numExps).fill({ wch: 6 }), 
        { wch: 12 }, 
        { wch: 12 }, 
        { wch: 15 }  
      ];

      const wb = XLSX.utils.book_new(); 
      XLSX.utils.book_append_sheet(wb, ws, "Format_K3"); 
      
      const safeSubject = (filters.subject !== 'All' ? filters.subject : 'All_Subjects').replace(/[^a-zA-Z0-9]/g, '_');
      XLSX.writeFile(wb, `LabTrack_Format_K3_${safeSubject}.xlsx`);

    } catch (e) {
      console.error(e);
      alert("Excel export failed: " + e.message);
    }
  };

  const generatePDF = () => {
    try {
      const doc = new jsPDF('landscape', 'mm', 'a4');

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Format K3", 280, 15, { align: "right" });

      doc.setFontSize(12);
      doc.text("Maharashtra State Board of Technical Education", 148, 22, { align: "center" });
      doc.text("FORMATIVE ASSESSMENT OF PRACTICAL (FA-PR)", 148, 28, { align: "center" });

      const uniqueSubjects = [...new Set(submissions.map(s => s.subject_name).filter(Boolean))];
      const displaySubject = uniqueSubjects.length === 1 ? uniqueSubjects[0] : (filters.subject !== 'All' ? filters.subject : '___________________');

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      
      const startY = 40;
      doc.text("Institute Code and Name: __________________________________________________________________", 14, startY);
      
      doc.text(`Academic Year: __________________`, 14, startY + 8);
      doc.text(`Semester: __________________`, 105, startY + 8);
      doc.text(`Exam: Winter / Summer...................`, 185, startY + 8);

      doc.text(`Programme: _____________________`, 14, startY + 16);
      doc.text(`Course: ${displaySubject}`, 105, startY + 16); 
      doc.text(`Course Code: __________________`, 185, startY + 16);
      
      doc.text(`Maximum Marks: _________________`, 105, startY + 24);
      doc.text(`Minimum Marks: _________________`, 185, startY + 24);

      const exps = assignmentTitles;
      const numExps = exps.length > 0 ? exps.length : 1; 

      const headerRow1 = [
        { content: 'Roll\nNo.', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
        { content: 'Enroll\nment\nNo.', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
        { content: 'Exam\nSeat\nNumber', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
        { content: 'Name of\nthe\nStudent', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
        { content: 'Experiment / Practical / Tutorial\n(Marks out of 25 per Experiment)', colSpan: numExps, styles: { halign: 'center', valign: 'middle' } },
        { content: 'Total\nMarks\n(25 x\nNo. of\nExpt.)', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
        { content: 'FA Marks of\nPractical\nConverted\naccording to\nL-A Scheme\n(Max\nMarks......)', rowSpan: 2, styles: { halign: 'center', valign: 'middle', fontSize: 8 } },
        { content: 'Signature\nof\nStudent', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } }
      ];

      const headerRow2 = exps.length > 0 ? exps.map((_, i) => (i + 1).toString()) : ['1'];

      const headerRow3 = [
        { content: '1', styles: { halign: 'center', fillColor: [230,230,240] } },
        { content: '2', styles: { halign: 'center', fillColor: [230,230,240] } },
        { content: '3', styles: { halign: 'center', fillColor: [230,230,240] } },
        { content: '4', styles: { halign: 'center', fillColor: [230,230,240] } },
        { content: '5', colSpan: numExps, styles: { halign: 'center', fillColor: [230,230,240] } },
        { content: '6', styles: { halign: 'center', fillColor: [230,230,240] } },
        { content: '7', styles: { halign: 'center', fillColor: [230,230,240] } },
        { content: '', styles: { halign: 'center', fillColor: [230,230,240] } } 
      ];

      const tableColumn = [headerRow1, headerRow2, headerRow3];
      const tableRows = [];

      groupedStudents.forEach((student, index) => {
        let marksArray = Array(numExps).fill('');
        let totalMarks = 0;

        exps.forEach((title, i) => {
          const subs = student.assignments[title];
          
          if (!subs || subs.length === 0) {
              marksArray[i] = 'AB';
          } else {
              const sub = subs[0];
              const currentInputMarks = gradingData[sub.submission_id]?.marks ?? sub.marks;
              
              if (currentInputMarks === null || currentInputMarks === "") {
                  marksArray[i] = 'Unassessed';
              } else {
                  marksArray[i] = currentInputMarks;
                  totalMarks += Number(currentInputMarks);
              }
          }
        });

        tableRows.push([
          (index + 1).toString(), 
          student.roll_number,    
          '', 
          student.student_name,
          ...marksArray,
          totalMarks > 0 ? totalMarks.toString() : '',
          '', 
          ''  
        ]);
      });

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
           0: { cellWidth: 10 }, 
           1: { cellWidth: 28 }, 
           2: { cellWidth: 15 }, 
           3: { cellWidth: 35, halign: 'left' }, 
           [4 + numExps]: { cellWidth: 12 }, 
           [4 + numExps + 1]: { cellWidth: 20 }, 
           [4 + numExps + 2]: { cellWidth: 20 }, 
        },
        margin: { left: 14, right: 14 }
      });

      const finalY = doc.lastAutoTable.finalY || startY + 32;
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("Note: Fractional marks shall be rounded to next full number.", 14, finalY + 6);

      const safeSubjectName = displaySubject.replace(/[^a-zA-Z0-9]/g, '_');
      doc.save(`LabTrack_Format_K3_${safeSubjectName}.pdf`);
      
    } catch (error) {
      console.error("PDF Generation Error: ", error);
      alert("Error generating PDF: " + error.message);
    }
  };

  return (
    <div className="h-screen bg-black text-white font-sans flex flex-col relative overflow-hidden">
      
      <header className="h-14 border-b border-gray-800 flex items-center justify-between px-4 bg-gray-950 shrink-0 z-40">
          <nav className="flex gap-6 text-xs font-medium text-gray-400">
            <span className="hover:text-white cursor-pointer" onClick={()=>navigate('/faculty/dashboard')}>Dashboard</span>
            <span className="hover:text-white cursor-pointer" onClick={()=>navigate('/faculty/timetable')}>Timetable </span>
            <span className="hover:text-white cursor-pointer" onClick={()=>navigate('/faculty/assignments')}>Assignments</span>
            <span className="text-white cursor-pointer border-b-2 border-violet-500 pb-4 pt-4">Submissions</span>
            <span className="hover:text-white cursor-pointer" onClick={()=>navigate('/faculty/resources')}>Resources</span>
            <span className="hover:text-white cursor-pointer" onClick={()=>navigate('/faculty/analysis')}>Analysis</span>
          </nav>
      </header>

      <div className="bg-[#111] py-2 px-4 border-b border-gray-800 flex flex-wrap gap-3 items-center shrink-0">
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
        
        <div className="bg-gray-900 p-2 px-4 border border-gray-700 border-t-0 rounded-b-lg flex justify-between items-center text-xs text-gray-400 shrink-0 mt-2">
            <span>Showing {groupedStudents.length} students</span>
            
            <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5"><CheckCircle size={12} className="text-green-500"/> Filters Applied</span>
                
                <button 
                  onClick={generateExcel} 
                  disabled={groupedStudents.length === 0}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded text-white font-medium transition-colors ${
                    groupedStudents.length === 0 
                      ? 'bg-gray-700 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-500 shadow-lg'
                  }`}
                >
                  <FileText size={14} />
                  Export Excel
                </button>

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

      {showCodeModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-100 p-4">
            <div className="bg-[#1a1a1a] border border-gray-700 rounded-xl w-full max-w-[95vw] h-[90vh] shadow-2xl flex flex-col overflow-hidden">
                
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-[#111] rounded-t-xl">
                    <div className="flex items-center gap-3">
                        <Terminal className="text-violet-500" size={24} />
                        <div>
                            <h3 className="text-white text-base font-bold leading-none">{currentCode.student}'s Submission</h3>
                            <p className="text-[11px] text-gray-500 mt-1 uppercase tracking-widest">Code Review & Execution</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <select 
                            value={selectedLanguage} 
                            onChange={(e) => setSelectedLanguage(e.target.value)} 
                            className="bg-gray-900 text-sm text-white border border-gray-600 rounded px-3 py-1.5 focus:border-violet-500 outline-none"
                        >
                            {languages.map(lang => (<option key={lang.alias} value={lang.alias}>{lang.name}</option>))}
                        </select>
                        <button 
                            onClick={runCode} 
                            disabled={isExecuting} 
                            className={`flex items-center gap-2 px-5 py-2 rounded text-sm font-bold transition-all ${isExecuting ? 'bg-gray-600' : 'bg-green-600 hover:bg-green-500 text-white'}`}
                        >
                            <Play size={16} fill="currentColor" /> {isExecuting ? 'Running...' : 'Run Code'}
                        </button>
                        <button 
                            onClick={() => setShowCodeModal(false)} 
                            className="p-2 bg-gray-800 hover:bg-red-900/50 hover:text-red-400 rounded-lg transition-colors border border-gray-700"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-hidden flex flex-col md:flex-row h-full">
                    
                    {/* Left Side: Code Editor (65% width) */}
                    <div className="flex-[6.5] p-0 border-r border-gray-700 flex flex-col">
                        <textarea 
                            className="flex-1 w-full bg-[#0d0d0d] text-gray-300 p-6 font-mono text-sm leading-relaxed resize-none outline-none focus:bg-black transition-colors custom-scrollbar" 
                            value={currentCode.content} 
                            onChange={(e) => setCurrentCode({...currentCode, content: e.target.value})} 
                            spellCheck="false"
                        />
                    </div>

                    {/* Right Side: Execution Output (35% width) */}
                    <div className="flex-[3.5] flex flex-col bg-[#0f0f0f]">
                        <div className="bg-[#111] px-4 py-2 text-[11px] text-violet-400 font-mono border-b border-gray-800">
                            OUTPUT CONSOLE
                        </div>
                        <pre className="flex-1 p-6 font-mono text-sm text-green-400 overflow-auto whitespace-pre-wrap custom-scrollbar leading-relaxed">
                            {executionOutput || <span className="text-gray-600 italic">Run code to see output...</span>}
                        </pre>
                    </div>
                    
                </div>
            </div>
        </div>
      )}

      {showDocModal && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-100 p-4">
              <div className="bg-white rounded-xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
                  <div className="bg-gray-100 p-3 border-b flex justify-between items-center text-black">
                      <span className="text-sm font-bold">Document Preview</span>
                      <button onClick={() => setShowDocModal(false)} className="p-1.5 bg-gray-200 hover:bg-red-500 hover:text-white rounded-full transition-colors"><X size={16} /></button>
                  </div>
                  <div className="flex-1">
                      <DocViewer documents={selectedDoc} pluginRenderers={DocViewerRenderers} />
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default Submissions;