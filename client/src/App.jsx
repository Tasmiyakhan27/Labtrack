// client/src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Importing pages 
import LandingPage from './pages/LandingPage';

// Faculty Pages
import FacultyRegister from './pages/faculty/Register'; 
import FacultyLogin from './pages/faculty/Login';
import FacultyDashboard from './pages/faculty/Dashboard';
import TimetableManagement from './pages/faculty/timetable';
//import FacultyAssignments from './pages/faculty/assignments';
import FacultyAssignments from './pages/faculty/FacultyAssignments';
import Submissions from './pages/faculty/Submissions';
import FacultyResources from './pages/faculty/FacultyResources';
import AnalysisDashboard from './pages/faculty/Analysis';
import ImportStudents from './pages/faculty/ImportStudents';

// Student Pages
import StudentLogin from './pages/student/StudentLogin';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentTimetable from './pages/student/StudentTimetable';
import StudentAssignments from './pages/student/StudentAssignments';
import StudentResources from './pages/student/StudentResources';
import StudentWorkspace from './pages/student/StudentWorkspace';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Route 1: The Landing Page  */}
        <Route path="/" element={<LandingPage />} />

        {/* Route 2: Faculty Registration and login */}
        <Route path="/login/faculty" element={<FacultyLogin />} />
        <Route path="/register/faculty" element={<FacultyRegister />} />
        
        {/* Faculty Routes */}
        <Route path="/faculty/dashboard" element={<FacultyDashboard />} />
        <Route path="/faculty/timetable" element={<TimetableManagement />} />
        <Route path="/faculty/assignments" element={<FacultyAssignments />} />
        <Route path="/faculty/submissions" element={<Submissions/>} />
        <Route path="/faculty/resources" element={<FacultyResources />} />
        <Route path="/faculty/analysis" element={<AnalysisDashboard />} />
        <Route path="/faculty/import-students" element={<ImportStudents />} />

        {/* Student Routes*/}
                <Route path="/login/student" element={<StudentLogin />} />
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/student/timetable" element={<StudentTimetable />} />
        <Route path="/student/assignments" element={<StudentAssignments />} />
        <Route path="/student/resources" element={<StudentResources />} />
        <Route path="/student/workspace/:id" element={<StudentWorkspace />} />
        

      </Routes>
    </BrowserRouter>
  );
}

export default App;