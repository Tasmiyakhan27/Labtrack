import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Calendar, AlertTriangle, Trash2, 
  Clock, MapPin, Layers, RefreshCw 
} from 'lucide-react';

const TimetableManagement = () => {
  const navigate = useNavigate();

  // --- 1. STATE MANAGEMENT (Fixes "Disappearing Data") ---
  const [schedule, setSchedule] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Store ID in State so it survives tab switches
  const [facultyId, setFacultyId] = useState(null);

  // --- 2. LOAD USER ID ON MOUNT ---
  useEffect(() => {
    const u1 = JSON.parse(localStorage.getItem('user'));
    const u2 = JSON.parse(localStorage.getItem('facultyUser'));
    const userObj = u1 || u2;

    if (userObj && (userObj.id || userObj.faculty_id)) {
        const id = userObj.id || userObj.faculty_id;
        console.log("Logged in as Faculty ID:", id); // Check Console!
        setFacultyId(id);
    } else {
        console.error("No User Found in LocalStorage");
        setFacultyId(0);
    }
  }, []);

  // --- 3. FILTER LOGIC (Dependent on facultyId) ---
  const mySchedule = schedule.filter(slot => String(slot.faculty_id) === String(facultyId));

  const [formData, setFormData] = useState({
    subject: '', grade: '1', batch: 'B1', room: '',
    date: '', day: '', start: '09:00', end: '10:00'
  });

  // --- FETCH DATA ---
  const fetchSchedule = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:8000/server/api/faculty/timetable.php');
      setSchedule(Array.isArray(res.data) ? res.data : []);
      setError('');
    } catch (err) {
      console.error(err);
      setError("Failed to load timetable.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  // --- HELPERS ---
  const handleDateChange = (e) => {
    const selectedDate = e.target.value;
    if (!selectedDate) {
        setFormData({ ...formData, date: '', day: '' });
        return;
    }
    const d = new Date(selectedDate);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    setFormData({ ...formData, date: selectedDate, day: days[d.getDay()] });
  };

  const timeToNum = (t) => {
    const [h, m] = t.split(':').map(Number);
    return h + m / 60;
  };

  const hasConflict = (newSlot) => {
    const newStart = timeToNum(newSlot.start);
    const newEnd = timeToNum(newSlot.end);

    return schedule.some(existing => {
      if (existing.date !== newSlot.date) return false;
      if (existing.grade === newSlot.grade && existing.batch === newSlot.batch) {
        const s = timeToNum(existing.start_time);
        const e = timeToNum(existing.end_time);
        if (newStart < e && newEnd > s) return true; 
      }
      return false;
    });
  };

  // --- SUBMIT ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // STRICT CHECK: Stop if ID is missing (Fixes "Saving as 1" bug)
    if (!facultyId || facultyId === 0) {
        alert("CRITICAL ERROR: You are not logged in properly (ID is 0). Please Logout and Login again.");
        return;
    }

    if (timeToNum(formData.start) >= timeToNum(formData.end)) {
      setError("Error: End time must be after start time.");
      return;
    }
    if (!formData.date) {
        setError("Error: Please select a date.");
        return;
    }

    if (hasConflict(formData)) {
      setError(`CONFLICT: Grade ${formData.grade} (${formData.batch}) is busy!`);
      return;
    }

    try {
      const payload = {
        faculty_id: facultyId, // Using State Variable
        subject: formData.subject,
        grade: formData.grade,
        batch: formData.batch,
        day: formData.day,   
        date: formData.date, 
        start: formData.start,
        end: formData.end,
        room: formData.room
      };

      const res = await axios.post('http://localhost:8000/server/api/faculty/timetable.php', payload);
      
      if (res.status === 200) {
        alert("Class slot added successfully!");
        fetchSchedule(); 
        setFormData({ ...formData, subject: '', room: '' });
      }
    } catch (err) {
      setError(err.response?.data?.message || "Server Error");
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Delete this slot?")) return;
    try {
      await axios.delete(`http://localhost:8000/server/api/faculty/timetable.php?id=${id}`);
      fetchSchedule(); 
    } catch (err) {
      alert("Failed to delete slot.");
    }
  };

  const getCardColor = (subject) => {
    const colors = [
      'bg-blue-600/20 border-blue-500/50 text-blue-100',
      'bg-violet-600/20 border-violet-500/50 text-violet-100',
      'bg-emerald-600/20 border-emerald-500/50 text-emerald-100',
      'bg-rose-600/20 border-rose-500/50 text-rose-100'
    ];
    return colors[subject.length % colors.length];
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col">
      <header className="h-16 border-b border-gray-800 flex items-center justify-between px-8 bg-gray-950 sticky top-0 z-50">
          <div className="text-violet-500 font-bold text-xl mr-8">LT</div>
          <nav className="hidden md:flex gap-8 text-sm font-medium text-gray-400 flex-1">
            <span className="hover:text-white cursor-pointer" onClick={() => navigate('/faculty/Dashboard')}> Dashboard</span>
            <span className="text-white border-b-2 border-violet-500 pb-5 pt-5 cursor-pointer">Timetable </span>
            <span className="hover:text-white cursor-pointer" onClick={() => navigate('/faculty/assignments')}>Assignments</span>
            <span className="hover:text-white cursor-pointer" onClick={() => navigate('/faculty/submissions')}>Submissions</span>
            <span className="hover:text-white cursor-pointer" onClick={() => navigate('/faculty/resources')}>Resources</span>
             <span className="hover:text-white cursor-pointer" onClick={() => navigate('/faculty/analysis')}>Analysis</span>


          </nav>
          <div className="w-8 h-8 bg-violet-600 rounded-full flex items-center justify-center font-bold text-sm">
             {facultyId || '?'}
          </div>
      </header>

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-8">
          
          <div className="flex justify-between items-center border-b border-gray-800 pb-6">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Calendar className="text-violet-500" size={32} />
                My Timetable
              </h1>
              <p className="text-gray-400 mt-1">Manage your schedule. (Global conflicts auto-detected)</p>
            </div>
            <button onClick={fetchSchedule} className="text-gray-400 hover:text-white bg-gray-900 p-2 rounded-full">
              <RefreshCw size={20} />
            </button>
          </div>

           <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Plus className="text-violet-500" /> Add New Class Slot
            </h2>

            {error && <div className="mb-4 text-red-400">{error}</div>}
            
            {/* ALERT IF ID IS MISSING */}
            {facultyId === 0 && (
                <div className="mb-6 bg-red-900/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
                    ⚠️ <strong>Session Error:</strong> You are not logged in. Please Logout and Login again.
                </div>
            )}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* DATE */}
              <div>
                <label className="text-gray-400 text-sm font-medium mb-1.5 block">Date</label>
                <input type="date" required className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 outline-none text-white scheme-dark"
                  value={formData.date} onChange={handleDateChange}
                />
              </div>
              {/* DAY */}
              <div>
                <label className="text-gray-400 text-sm font-medium mb-1.5 block">Day (Auto)</label>
                <input type="text" readOnly className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-gray-500 cursor-not-allowed"
                  value={formData.day || '--'}
                />
              </div>
              {/* SUBJECT */}
              <div className="md:col-span-2">
                <label className="text-gray-400 text-sm font-medium mb-1.5 block">Subject Name</label>
                <input required type="text" placeholder="e.g. Data Structures Lab" className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 outline-none text-white"
                  value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})}
                />
              </div>
              {/* GRADE */}
              <div>
                <label className="text-gray-400 text-sm font-medium mb-1.5 block">Grade</label>
                <select className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 outline-none text-white" value={formData.grade} onChange={e => setFormData({...formData, grade: e.target.value})}>
                  <option value="1">First Year (FY)</option><option value="2">Second Year (SY)</option><option value="3">Third Year (TY)</option>
                </select>
              </div>
              {/* BATCH */}
              <div>
                <label className="text-gray-400 text-sm font-medium mb-1.5 block">Batch</label>
                <select className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 outline-none text-white" value={formData.batch} onChange={e => setFormData({...formData, batch: e.target.value})}>
                  <option value="B1">Batch 1</option><option value="B2">Batch 2</option><option value="B3">Batch 3</option>
                </select>
              </div>
              {/* START */}
              <div>
                <label className="text-gray-400 text-sm font-medium mb-1.5 block">Start Time</label>
                <input type="time" required className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 outline-none text-white scheme-dark"
                  value={formData.start} onChange={e => setFormData({...formData, start: e.target.value})}
                />
              </div>
              {/* END */}
              <div>
                <label className="text-gray-400 text-sm font-medium mb-1.5 block">End Time</label>
                <input type="time" required className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 outline-none text-white scheme-dark"
                  value={formData.end} onChange={e => setFormData({...formData, end: e.target.value})}
                />
              </div>
              {/* ROOM */}
              <div className="md:col-span-2">
                 <label className="text-gray-400 text-sm font-medium mb-1.5 block">Lab Room</label>
                 <input type="text" placeholder="e.g. L-201" required className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 outline-none text-white"
                   value={formData.room} onChange={e => setFormData({...formData, room: e.target.value})}
                 />
              </div>
              {/* BUTTON */}
              <div className="flex items-end md:col-span-2">
                <button className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg">
                  + Schedule Class
                </button>
              </div>

            </form>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-xl mb-10">
            <div className="p-4 border-b border-gray-800 bg-gray-950/50 flex justify-between items-center">
              <h3 className="font-semibold text-gray-200">My Weekly Schedule</h3>
              <span className="text-xs text-gray-500 bg-gray-900 px-2 py-1 rounded border border-gray-800">{mySchedule.length} Sessions</span>
            </div>
            
            <div className="overflow-x-auto">
              <div className="min-w-[1000px] grid grid-cols-7 border-b border-gray-800 bg-gray-950">
                <div className="p-4 text-center text-xs font-mono text-gray-500 border-r border-gray-800">TIME</div>
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                  <div key={day} className="p-4 text-center font-bold text-gray-300 border-r border-gray-800">{day.substring(0, 3).toUpperCase()}</div>
                ))}
              </div>

              <div className="min-w-[1000px] relative bg-gray-900/30">
                 <div className="grid grid-cols-7 divide-x divide-gray-800">
                    <div className="space-y-16 py-6 text-center text-gray-600 text-xs font-mono bg-gray-950/50">
                      <div>09:00</div><div>11:00</div><div>13:00</div><div>15:00</div><div>17:00</div>
                    </div>

                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                      <div key={day} className="p-2 min-h-[500px] relative space-y-3 bg-gray-900/20">
                        {mySchedule
                          .filter(s => s.day_of_week === day)
                          .sort((a,b) => timeToNum(a.start_time) - timeToNum(b.start_time))
                          .map(slot => (
                            <div key={slot.id} className={`p-3 rounded-xl border backdrop-blur-sm group relative hover:scale-105 transition-all cursor-default shadow-lg ${getCardColor(slot.subject_name)}`}>
                              <button onClick={() => handleDelete(slot.id)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-red-500 text-white p-1 rounded-md hover:bg-red-600 transition-all shadow-lg"><Trash2 size={12} /></button>
                              
                              <div className="font-bold text-sm truncate pr-4">{slot.subject_name}</div>
                              <div className="space-y-1 mt-2">
                                <div className="flex items-center gap-1.5 text-xs font-bold bg-black/30 p-1 rounded w-fit">
                                    <Calendar size={10} /> {slot.date}
                                </div>
                                <div className="flex items-center gap-1.5 text-xs opacity-80"><Layers size={12} /> {slot.grade} • {slot.batch}</div>
                                <div className="flex items-center gap-1.5 text-xs opacity-80 font-mono"><Clock size={12} /> {slot.start_time.substring(0,5)} - {slot.end_time.substring(0,5)}</div>
                                <div className="flex items-center gap-1.5 text-xs opacity-80"><MapPin size={12} /> {slot.room_number}</div>
                              </div>
                            </div>
                        ))}
                      </div>
                    ))}
                 </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TimetableManagement;