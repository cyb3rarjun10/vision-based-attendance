import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, 
  Calendar, 
  BookOpen, 
  PlusCircle, 
  Check, 
  AlertCircle,
  Database,
  Camera
} from 'lucide-react';

const NODE_API = 'http://localhost:5000/api';
const PYTHON_API = 'http://localhost:5001';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    attendanceRate: 0,
    upcomingExams: 0,
  });

  const [services, setServices] = useState({
    nodeOnline: false,
    pythonOnline: false,
  });

  const [studentForm, setStudentForm] = useState({
    name: '',
    roll_no: '',
    class: '',
    parent_phone: '',
  });

  const [loading, setLoading] = useState(true);
  const [submitStatus, setSubmitStatus] = useState({ type: '', message: '' });
  const [recentStudents, setRecentStudents] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    let nodeOnline = false;
    let pythonOnline = false;

    try {
      const nodeStatus = await axios.get('http://localhost:5000/', { timeout: 2000 });
      if (nodeStatus.data.status === 'ok') {
        nodeOnline = true;
      }
    } catch (e) {
      nodeOnline = false;
    }

    try {
      const pythonStatus = await axios.get('http://localhost:5001/train', { timeout: 2000 }).catch(err => err.response);
      if (pythonStatus) {
        pythonOnline = true;
      }
    } catch (e) {
      if (e.response || e.code === 'ERR_BAD_RESPONSE') {
        pythonOnline = true;
      } else {
        pythonOnline = false;
      }
    }

    setServices({ nodeOnline, pythonOnline });

    if (nodeOnline) {
      try {
        const [studentsRes, attendanceRes, examsRes] = await Promise.all([
          axios.get(`${NODE_API}/students`),
          axios.get(`${NODE_API}/attendance`),
          axios.get(`${NODE_API}/exams`),
        ]);

        const totalStudents = studentsRes.data.length;
        const recent = studentsRes.data.slice(-5).reverse();
        
        const attendance = attendanceRes.data;
        const presentCount = attendance.filter(record => record.status === 'Present').length;
        const attendanceRate = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

        setStats({
          totalStudents,
          attendanceRate,
          upcomingExams: examsRes.data.length,
        });
        setRecentStudents(recent);
      } catch (err) {
        console.error(err);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setStudentForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRegisterStudent = async (e) => {
    e.preventDefault();
    setSubmitStatus({ type: '', message: '' });

    if (!services.nodeOnline) {
      setSubmitStatus({ type: 'error', message: 'Node.js backend is offline. Registration disabled.' });
      return;
    }

    const { name, roll_no, class: className, parent_phone } = studentForm;
    if (!name || !roll_no || !className || !parent_phone) {
      setSubmitStatus({ type: 'error', message: 'All fields are required.' });
      return;
    }

    try {
      await axios.post(`${NODE_API}/students`, studentForm);
      setSubmitStatus({ type: 'success', message: 'Student registered successfully!' });
      setStudentForm({ name: '', roll_no: '', class: '', parent_phone: '' });
      fetchData();
    } catch (err) {
      setSubmitStatus({ 
        type: 'error', 
        message: err.response?.data?.error || 'Failed to register student.' 
      });
    }
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white">
            AI Classroom Suite
          </h2>
          <p className="text-gray-400 mt-1">
            Real-time biometric attendance and academic analytics.
          </p>
        </div>

        <div className="flex items-center space-x-4 bg-white/3 border border-white/5 px-4 py-2.5 rounded-xl glass-card">
          <div className="flex items-center space-x-2">
            <Database size={15} className={services.nodeOnline ? 'text-accent-emerald' : 'text-accent-rose'} />
            <span className="text-xs text-gray-300 font-medium">Express API:</span>
            <span className={`text-xs px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${services.nodeOnline ? 'bg-accent-emerald/10 text-accent-emerald' : 'bg-accent-rose/10 text-accent-rose'}`}>
              {services.nodeOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          <div className="w-[1px] h-6 bg-white/10"></div>
          <div className="flex items-center space-x-2">
            <Camera size={15} className={services.pythonOnline ? 'text-accent-emerald' : 'text-accent-rose'} />
            <span className="text-xs text-gray-300 font-medium">Flask AI:</span>
            <span className={`text-xs px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${services.pythonOnline ? 'bg-accent-emerald/10 text-accent-emerald' : 'bg-accent-rose/10 text-accent-rose'}`}>
              {services.pythonOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="relative overflow-hidden p-6 rounded-2xl glass-panel group hover:-translate-y-1 transition-all duration-300">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <Users size={80} className="text-accent-indigo" />
          </div>
          <div className="flex items-center space-x-4">
            <div className="bg-accent-indigo/10 p-3.5 rounded-xl text-accent-indigo">
              <Users size={28} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Total Enrollment</p>
              <h3 className="text-3xl font-extrabold text-white mt-1">
                {loading ? '...' : stats.totalStudents}
              </h3>
            </div>
          </div>
          <div className="w-full bg-white/5 h-1.5 rounded-full mt-6">
            <div className="bg-accent-indigo h-1.5 rounded-full" style={{ width: '100%' }}></div>
          </div>
        </div>

        <div className="relative overflow-hidden p-6 rounded-2xl glass-panel group hover:-translate-y-1 transition-all duration-300">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <Calendar size={80} className="text-accent-cyan" />
          </div>
          <div className="flex items-center space-x-4">
            <div className="bg-accent-cyan/10 p-3.5 rounded-xl text-accent-cyan">
              <Calendar size={28} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Today's Attendance</p>
              <h3 className="text-3xl font-extrabold text-white mt-1 font-mono">
                {loading ? '...' : `${stats.attendanceRate}%`}
              </h3>
            </div>
          </div>
          <div className="w-full bg-white/5 h-1.5 rounded-full mt-6">
            <div className="bg-gradient-to-r from-accent-indigo to-accent-cyan h-1.5 rounded-full transition-all duration-500" style={{ width: `${stats.attendanceRate}%` }}></div>
          </div>
        </div>

        <div className="relative overflow-hidden p-6 rounded-2xl glass-panel group hover:-translate-y-1 transition-all duration-300">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <BookOpen size={80} className="text-accent-purple" />
          </div>
          <div className="flex items-center space-x-4">
            <div className="bg-accent-purple/10 p-3.5 rounded-xl text-accent-purple">
              <BookOpen size={28} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Active Exams</p>
              <h3 className="text-3xl font-extrabold text-white mt-1">
                {loading ? '...' : stats.upcomingExams}
              </h3>
            </div>
          </div>
          <div className="w-full bg-white/5 h-1.5 rounded-full mt-6">
            <div className="bg-accent-purple h-1.5 rounded-full" style={{ width: '100%' }}></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="p-6 rounded-2xl glass-panel flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2.5 mb-4">
              <PlusCircle className="text-accent-indigo" size={22} />
              <h4 className="text-lg font-bold text-white">Quick Student Registration</h4>
            </div>
            <p className="text-xs text-gray-400 mb-6">
              Create a student record. Once created, face samples can be captured in the Attendance module.
            </p>
            
            <form onSubmit={handleRegisterStudent} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={studentForm.name}
                    onChange={handleInputChange}
                    placeholder="e.g. John Doe"
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-accent-indigo/60 transition text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Roll Number</label>
                  <input
                    type="text"
                    name="roll_no"
                    value={studentForm.roll_no}
                    onChange={handleInputChange}
                    placeholder="e.g. R-101"
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-accent-indigo/60 transition text-sm text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Class / Grade</label>
                  <input
                    type="text"
                    name="class"
                    value={studentForm.class}
                    onChange={handleInputChange}
                    placeholder="e.g. Grade 10-A"
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-accent-indigo/60 transition text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Parent's Phone Number</label>
                  <input
                    type="text"
                    name="parent_phone"
                    value={studentForm.parent_phone}
                    onChange={handleInputChange}
                    placeholder="e.g. +1234567890"
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-accent-indigo/60 transition text-sm text-white"
                  />
                </div>
              </div>

              {submitStatus.message && (
                <div className={`p-3.5 rounded-xl text-xs flex items-center space-x-2 border ${
                  submitStatus.type === 'success' 
                    ? 'bg-accent-emerald/10 border-accent-emerald/20 text-accent-emerald' 
                    : 'bg-accent-rose/10 border-accent-rose/20 text-accent-rose'
                }`}>
                  {submitStatus.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                  <span>{submitStatus.message}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full mt-2 py-3 bg-gradient-to-r from-accent-indigo to-accent-purple text-white font-bold text-sm rounded-xl shadow-lg hover:brightness-110 active:scale-[0.99] transition duration-300"
              >
                Register Student
              </button>
            </form>
          </div>
        </div>

        <div className="p-6 rounded-2xl glass-panel">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2.5">
              <Users className="text-accent-cyan" size={22} />
              <h4 className="text-lg font-bold text-white">Recent Registrations</h4>
            </div>
            <button 
              onClick={fetchData} 
              className="text-xs font-bold text-accent-cyan hover:underline hover:text-cyan-400 transition"
            >
              Refresh
            </button>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="text-gray-400 text-center py-8 text-sm">Loading registrations...</div>
            ) : recentStudents.length === 0 ? (
              <div className="text-gray-400 text-center py-8 text-sm">No students registered yet.</div>
            ) : (
              recentStudents.map((student) => (
                <div 
                  key={student.id} 
                  className="flex items-center justify-between p-3.5 bg-white/3 border border-white/5 rounded-xl hover:bg-white/5 transition duration-300"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-accent-indigo/20 to-accent-purple/20 flex items-center justify-center border border-accent-indigo/20 text-accent-indigo font-bold text-sm">
                      {student.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h5 className="text-sm font-semibold text-white">{student.name}</h5>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Roll: {student.roll_no} | Class: {student.class}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] bg-white/5 border border-white/10 px-2.5 py-1 rounded-md text-gray-300 font-semibold tracking-wider font-mono">
                      ID: {student.id}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
