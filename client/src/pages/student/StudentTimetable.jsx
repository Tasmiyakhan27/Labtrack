import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, Clock, MapPin, ChevronLeft, ChevronRight,
  Coffee, CalendarDays 
} from 'lucide-react';

const StudentTimetable = () => {
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- NEW: Force Re-render every minute to update "Live" status ---
  const [, setTick] = useState(0); 

  useEffect(() => {
    // Update the UI every 60 seconds so the green dot appears automatically
    const timer = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  // --- DATE STATE MANAGEMENT ---
  // 1. Tracks the Month we are currently viewing (defaults to today)
  const [viewDate, setViewDate] = useState(new Date()); 
  
  // 2. Tracks the specific day selected by the user (YYYY-MM-DD string)
  // Fix: Use local date string instead of ISO (which is UTC)
  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const [selectedDate, setSelectedDate] = useState(getTodayString());

  // --- 1. GENERATE DAYS FOR THE SELECTED MONTH ---
  const getDaysInMonth = (dateObj) => {
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth();
    
    // Get number of days in this month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const daysArray = [];
    for (let i = 1; i <= daysInMonth; i++) {
        // Create date object for specific day (handling local time correctly)
        const d = new Date(year, month, i);
        
        // Manual formatting to avoid timezone offset issues on ISOString
        const yearStr = d.getFullYear();
        const monthStr = String(d.getMonth() + 1).padStart(2, '0');
        const dayStr = String(d.getDate()).padStart(2, '0');
        const fullDateStr = `${yearStr}-${monthStr}-${dayStr}`;

        daysArray.push({
            dayName: d.toLocaleDateString('en-US', { weekday: 'short' }), // Mon, Tue
            dayNumber: i, // 1, 2, 3
            fullDate: fullDateStr // 2026-02-14
        });
    }
    return daysArray;
  };

  const monthDays = getDaysInMonth(viewDate);

  // --- 2. HANDLE MONTH CHANGE ---
  const changeMonth = (direction) => {
    const newDate = new Date(viewDate);
    newDate.setMonth(viewDate.getMonth() + direction);
    setViewDate(newDate);
    
    // Optional: Automatically select the 1st of the new month
    // Handle timezone manually to ensure YYYY-MM-01
    const year = newDate.getFullYear();
    const month = String(newDate.getMonth() + 1).padStart(2, '0');
    setSelectedDate(`${year}-${month}-01`);
  };

  // --- 3. FETCH DATA ---
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('studentUser'));
    if (!user) {
        navigate('/student/login');
        return;
    }

    axios.get(`http://localhost:8000/server/api/student/get_student_timetable.php?grade=${user.grade}&batch=${user.batch}`)
      .then(res => {
        setSchedule(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [navigate]);

  // --- 4. FILTER SCHEDULE BY SELECTED DATE ---
  const daySchedule = schedule.filter(slot => slot.date === selectedDate);

  // Helper: Formatting Time
  const formatTime = (timeStr) => {
    const [h, m] = timeStr.split(':');
    const date = new Date();
    date.setHours(h, m);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // --- UPDATED HELPER: Check if class is LIVE ---
  const isLive = (slot) => {
    const now = new Date();
    
    // 1. Get Local Date string (YYYY-MM-DD) correctly
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    // If the slot date is not today, it can't be live
    if (slot.date !== todayStr) return false; 
    
    // 2. Check Time
    const currentMins = now.getHours() * 60 + now.getMinutes();
    
    const [startH, startM] = slot.start_time.split(':').map(Number);
    const [endH, endM] = slot.end_time.split(':').map(Number);
    
    const startMins = startH * 60 + startM;
    const endMins = endH * 60 + endM;

    return currentMins >= startMins && currentMins < endMins;
  };

  return (
    <div className="min-h-screen bg-black text-gray-200 font-sans flex flex-col">
      
      {/* Header */}
      <header className="h-16 border-b border-gray-800 bg-[#111] flex items-center justify-between px-6 sticky top-0 z-20 shadow-lg">
        <div className="flex items-center gap-4">
            <button onClick={() => navigate('/student/dashboard')} className="text-gray-400 hover:text-white">
                <ChevronLeft size={24} />
            </button>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <CalendarDays className="text-blue-500" size={20} />
                Timetable
            </h1>
        </div>
      </header>

      <div className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full">

        {/* --- MONTH CONTROLLER --- */}
        <div className="flex items-center justify-between mb-6 bg-[#151515] p-4 rounded-2xl border border-gray-800">
            <button onClick={() => changeMonth(-1)} className="p-2 bg-black border border-gray-700 rounded-full hover:bg-gray-800 transition-colors">
                <ChevronLeft size={20} />
            </button>
            
            <div className="text-center">
                <h2 className="text-lg font-bold text-white">
                    {viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h2>
                <span className="text-xs text-gray-500 uppercase tracking-widest">Select Date</span>
            </div>

            <button onClick={() => changeMonth(1)} className="p-2 bg-black border border-gray-700 rounded-full hover:bg-gray-800 transition-colors">
                <ChevronRight size={20} />
            </button>
        </div>

        {/* --- DATE SCROLLER (Full Month) --- */}
        <div className="flex overflow-x-auto pb-4 gap-2 mb-6 custom-scrollbar">
          {monthDays.map(dayObj => (
            <button
              key={dayObj.fullDate}
              onClick={() => setSelectedDate(dayObj.fullDate)}
              className={`px-3 py-3 rounded-2xl flex flex-col items-center min-w-18 transition-all border shrink-0 ${
                selectedDate === dayObj.fullDate
                  ? 'bg-blue-600 text-white border-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.5)] scale-105'
                  : 'bg-[#1a1a1a] text-gray-500 border-gray-800 hover:bg-[#222] hover:text-gray-300'
              }`}
            >
              <span className="text-xs uppercase font-bold opacity-70">{dayObj.dayName}</span>
              <span className="text-xl font-bold">{dayObj.dayNumber}</span>
            </button>
          ))}
        </div>

        {/* --- TIMELINE CONTENT --- */}
        <div className="space-y-6 relative min-h-[300px]">
            
            {/* Vertical Line */}
            <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gray-800 hidden md:block"></div>

            {loading ? (
                <div className="text-center py-20 text-gray-500">Loading schedule...</div>
            ) : daySchedule.length > 0 ? (
                daySchedule.map((slot, index) => {
                    const active = isLive(slot);
                    return (
                        <div key={index} className={`relative md:pl-12 transition-all duration-300 ${active ? 'scale-[1.02]' : ''}`}>
                            {/* Dot */}
                            <div className={`absolute left-2.5 top-8 w-3 h-3 rounded-full border-2 hidden md:block z-10 ${active ? 'bg-green-500 border-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-[#111] border-gray-600'}`}></div>

                            <div className={`rounded-2xl p-6 border ${active ? 'bg-green-900/10 border-green-500/50' : 'bg-[#111] border-gray-800 hover:border-blue-500/30'} transition-colors group`}>
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    
                                    {/* Time */}
                                    <div className="flex items-center gap-3">
                                        <div className={`p-3 rounded-xl ${active ? 'bg-green-500/20 text-green-400' : 'bg-gray-800 text-gray-400'}`}>
                                            <Clock size={24} />
                                        </div>
                                        <div>
                                            <p className={`text-sm font-bold ${active ? 'text-green-400' : 'text-gray-300'}`}>
                                                {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                                            </p>
                                            <p className="text-xs text-gray-500 font-mono">
                                                {active ? 'HAPPENING NOW' : 'Scheduled'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Subject */}
                                    <div className="flex-1 md:px-8">
                                        <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
                                            {slot.subject_name}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1 text-sm text-gray-400">
                                            <span className="bg-gray-800 px-2 py-0.5 rounded text-xs border border-gray-700">{slot.grade}</span>
                                            <span className="bg-gray-800 px-2 py-0.5 rounded text-xs border border-gray-700">{slot.batch}</span>
                                        </div>
                                    </div>

                                    {/* Room */}
                                    <div className="flex items-center gap-2 text-gray-400 bg-black/50 px-4 py-2 rounded-lg border border-gray-800">
                                        <MapPin size={16} className="text-purple-500" />
                                        <span className="text-sm font-medium">{slot.room_number}</span>
                                    </div>

                                </div>
                            </div>
                        </div>
                    );
                })
            ) : (
                // Empty State
                <div className="flex flex-col items-center justify-center py-20 bg-[#111] rounded-3xl border border-dashed border-gray-800 text-center">
                    <div className="bg-gray-800/50 p-4 rounded-full mb-4">
                        <Coffee size={32} className="text-gray-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No Classes Scheduled</h3>
                    <p className="text-gray-500">
                        There are no classes scheduled for <span className="text-blue-400 font-bold">{new Date(selectedDate).toLocaleDateString()}</span>.
                    </p>
                </div>
            )}
        </div>

      </div>
    </div>
  );
};

export default StudentTimetable;