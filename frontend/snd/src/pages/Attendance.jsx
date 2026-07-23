import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Camera, 
  Download, 
  UserCheck, 
  UserMinus, 
  Calendar,
  Zap,
  Play,
  RotateCw,
  Sliders,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  Search,
  Bell
} from 'lucide-react';

const NODE_API = 'http://localhost:5000/api';
const PYTHON_API = 'http://localhost:5001';

const Attendance = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [date, setDate] = useState(() => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localToday = new Date(today.getTime() - (offset * 60 * 1000));
    return localToday.toISOString().split('T')[0];
  });

  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [useMock, setUseMock] = useState(true);
  const [scannerActive, setScannerActive] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [training, setTraining] = useState(false);
  const [trainStatus, setTrainStatus] = useState({ type: '', message: '' });
  const [capturingId, setCapturingId] = useState(null);
  const [captureStatus, setCaptureStatus] = useState({ type: '', message: '' });
  const [alerting, setAlerting] = useState(false);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${NODE_API}/attendance?date=${date}`);
      setAttendanceData(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAttendance();
  }, [date]);

  const handleToggleStatus = async (studentId, currentStatus) => {
    const newStatus = currentStatus === 'Present' ? 'Absent' : 'Present';
    try {
      await axios.post(`${NODE_API}/attendance`, {
        student_id: studentId,
        date: date,
        status: newStatus
      });
      setAttendanceData(prev => 
        prev.map(item => 
          item.student_id === studentId ? { ...item, status: newStatus } : item
        )
      );
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    }
  };

  const handleStartRecognition = async () => {
    setScannerActive(true);
    setScanResult(null);
    try {
      const res = await axios.post(`${PYTHON_API}/recognize?mock=${useMock}`);
      const data = res.data;
      if (data.success) {
        setScanResult({
          type: 'success',
          studentId: data.student_id,
          name: data.name,
          confidence: data.confidence,
          message: `Recognized: ${data.name} (Conf: ${Math.round(data.confidence)})`
        });

        await axios.post(`${PYTHON_API}/mark-attendance`, {
          student_id: data.student_id
        });

        fetchAttendance();

        setTimeout(() => {
          setScannerActive(false);
          setScanResult(null);
        }, 4000);
      }
    } catch (err) {
      setScanResult({
        type: 'error',
        message: err.response?.data?.error || 'Biometric recognition failed or face was not found.'
      });
      setTimeout(() => {
        setScannerActive(false);
        setScanResult(null);
      }, 5000);
    }
  };

  const handleCaptureDataset = async (studentId) => {
    setCapturingId(studentId);
    setCaptureStatus({ type: 'loading', message: 'Initializing camera. Look at the webcam...' });
    try {
      const res = await axios.post(`${PYTHON_API}/capture-dataset?student_id=${studentId}&mock=${useMock}`);
      if (res.data.success) {
        setCaptureStatus({
          type: 'success',
          message: res.data.message
        });
      }
    } catch (err) {
      setCaptureStatus({
        type: 'error',
        message: err.response?.data?.error || 'Webcam capture failed. Ensure webcam is connected.'
      });
    }
    setTimeout(() => {
      setCapturingId(null);
      setCaptureStatus({ type: '', message: '' });
    }, 5000);
  };

  const handleTrainModel = async () => {
    setTraining(true);
    setTrainStatus({ type: '', message: '' });
    try {
      const res = await axios.post(`${PYTHON_API}/train`);
      if (res.data.success) {
        setTrainStatus({ type: 'success', message: res.data.message });
      }
    } catch (err) {
      setTrainStatus({
        type: 'error',
        message: err.response?.data?.error || 'Model training failed.'
      });
    }
    setTraining(false);
    setTimeout(() => setTrainStatus({ type: '', message: '' }), 5000);
  };

  const handleTriggerAbsenceAlerts = async () => {
    if (!window.confirm("This will mark all unregistered/unmarked students today as ABSENT and dispatch Twilio SMS alerts to their parents. Proceed?")) {
      return;
    }
    setAlerting(true);
    try {
      const res = await axios.post(`${PYTHON_API}/trigger-absent-alerts`);
      alert(`Absence alerts dispatched! ${res.data.alerted_students.length} parents notified.`);
      fetchAttendance();
    } catch (err) {
      alert('Alert dispatch failed: ' + (err.response?.data?.error || err.message));
    }
    setAlerting(false);
  };

  const handleExportCSV = () => {
    if (attendanceData.length === 0) return;
    
    const headers = ['Student ID', 'Roll No', 'Name', 'Class', 'Date', 'Status', 'Parent Phone'];
    const rows = attendanceData.map(item => [
      item.student_id,
      `"${item.roll_no}"`,
      `"${item.name}"`,
      `"${item.class}"`,
      item.date,
      item.status,
      `"${item.parent_phone}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `attendance_report_${date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredData = attendanceData.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.roll_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.class.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 p-8 overflow-y-auto space-y-8">
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between space-y-4 xl:space-y-0">
        <div>
          <h2 className="text-3xl font-extrabold text-white">Attendance Management</h2>
          <p className="text-gray-400 mt-1">Biometric verification logs, dataset collections, and SMS alerts.</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2 bg-white/3 border border-white/5 px-3 py-2 rounded-xl glass-card">
            <Sliders size={14} className="text-accent-indigo" />
            <span className="text-xs text-gray-300">Scanner mode:</span>
            <button
              onClick={() => setUseMock(prev => !prev)}
              className={`text-xs px-2.5 py-1 rounded-md font-bold uppercase transition tracking-wider ${useMock ? 'bg-accent-indigo/20 text-accent-indigo' : 'bg-accent-cyan/20 text-accent-cyan'}`}
            >
              {useMock ? 'Mock Scan' : 'Real Camera'}
            </button>
          </div>

          <button
            onClick={handleTrainModel}
            disabled={training}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-accent-purple to-accent-indigo text-white font-bold text-xs rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition disabled:opacity-50"
          >
            {training ? <RotateCw className="animate-spin" size={14} /> : <Sparkles size={14} />}
            <span>{training ? 'Training Model...' : 'Train AI Recognizer'}</span>
          </button>

          <button
            onClick={handleTriggerAbsenceAlerts}
            disabled={alerting}
            className="flex items-center space-x-2 px-4 py-2 bg-accent-rose/10 border border-accent-rose/20 text-accent-rose font-bold text-xs rounded-xl hover:bg-accent-rose hover:text-white active:scale-95 transition disabled:opacity-50"
          >
            {alerting ? <RotateCw className="animate-spin" size={14} /> : <Bell size={14} />}
            <span>Trigger Absence Alerts</span>
          </button>
        </div>
      </div>

      {trainStatus.message && (
        <div className={`p-4 rounded-2xl text-sm flex items-center space-x-3 border ${
          trainStatus.type === 'success' 
            ? 'bg-accent-emerald/10 border-accent-emerald/20 text-accent-emerald' 
            : 'bg-accent-rose/10 border-accent-rose/20 text-accent-rose'
        }`}>
          {trainStatus.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
          <span>{trainStatus.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        <div className="flex items-center space-x-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white">
          <Calendar size={18} className="text-gray-400" />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-transparent border-none text-sm focus:outline-none w-full text-white cursor-pointer"
          />
        </div>

        <div className="flex items-center space-x-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white">
          <Search size={18} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search student, class, roll..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none text-sm focus:outline-none w-full text-white placeholder-gray-500"
          />
        </div>

        <button
          onClick={handleStartRecognition}
          disabled={scannerActive}
          className="py-2.5 bg-gradient-to-r from-accent-indigo to-accent-cyan text-white font-bold text-sm rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition flex items-center justify-center space-x-2 shadow-accent-indigo/10"
        >
          <Camera size={16} />
          <span>Start Biometric Scanner</span>
        </button>

        <button
          onClick={handleExportCSV}
          disabled={attendanceData.length === 0}
          className="py-2.5 bg-white/5 border border-white/10 text-white font-bold text-sm rounded-xl hover:bg-white/10 active:scale-95 transition flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          <Download size={16} />
          <span>Export Daily Logs (CSV)</span>
        </button>
      </div>

      {scannerActive && (
        <div className="p-6 rounded-2xl glass-panel pulse-glow-indigo flex flex-col items-center justify-center space-y-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-full border-4 border-dashed border-accent-indigo animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Camera size={32} className="text-accent-indigo animate-pulse" />
            </div>
          </div>
          <div className="text-center">
            <h4 className="text-lg font-bold text-white">Scanning Face...</h4>
            <p className="text-xs text-gray-400 mt-1">
              {useMock ? 'Generating mock facial signature...' : 'Webcam window active on system desktop.'}
            </p>
          </div>

          {scanResult && (
            <div className={`p-4 rounded-xl border max-w-md w-full flex items-center space-x-3 ${
              scanResult.type === 'success' 
                ? 'bg-accent-emerald/10 border-accent-emerald/20 text-accent-emerald' 
                : 'bg-accent-rose/10 border-accent-rose/20 text-accent-rose'
            }`}>
              {scanResult.type === 'success' ? <CheckCircle size={24} /> : <AlertTriangle size={24} />}
              <div>
                <p className="text-sm font-bold">{scanResult.message}</p>
                {scanResult.type === 'success' && (
                  <p className="text-[10px] text-gray-400 mt-0.5">Biometric verification record and parent SMS complete.</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {capturingId !== null && (
        <div className="p-5 rounded-2xl glass-panel border border-accent-cyan/30 flex flex-col items-center space-y-3">
          <div className="flex items-center space-x-2">
            <RotateCw size={18} className="animate-spin text-accent-cyan" />
            <h5 className="font-bold text-white">Capture Face Dataset (ID: {capturingId})</h5>
          </div>
          <p className={`text-xs font-semibold ${
            captureStatus.type === 'error' ? 'text-accent-rose' : 
            captureStatus.type === 'success' ? 'text-accent-emerald' : 'text-accent-cyan'
          }`}>
            {captureStatus.message}
          </p>
        </div>
      )}

      <div className="rounded-2xl border border-white/5 overflow-hidden glass-panel">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/3 border-b border-white/5 text-gray-400 text-xs font-bold uppercase tracking-wider">
              <th className="py-4 px-6">Student ID</th>
              <th className="py-4 px-6">Roll No</th>
              <th className="py-4 px-6">Name</th>
              <th className="py-4 px-6">Class</th>
              <th className="py-4 px-6">Status</th>
              <th className="py-4 px-6 text-center">Dataset</th>
              <th className="py-4 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm text-gray-300">
            {loading ? (
              <tr>
                <td colSpan="7" className="py-12 text-center text-gray-400">Loading student attendance log...</td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-12 text-center text-gray-400">No student records match search filters.</td>
              </tr>
            ) : (
              filteredData.map((item) => (
                <tr key={item.student_id} className="hover:bg-white/2 transition duration-200">
                  <td className="py-4 px-6 font-mono text-xs">{item.student_id}</td>
                  <td className="py-4 px-6 font-semibold">{item.roll_no}</td>
                  <td className="py-4 px-6 text-white font-bold">{item.name}</td>
                  <td className="py-4 px-6">{item.class}</td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                      item.status === 'Present' 
                        ? 'bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/20' 
                        : 'bg-accent-rose/10 text-accent-rose border border-accent-rose/20'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'Present' ? 'bg-accent-emerald' : 'bg-accent-rose'}`}></span>
                      <span>{item.status}</span>
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <button
                      onClick={() => handleCaptureDataset(item.student_id)}
                      className="px-3 py-1.5 bg-white/5 border border-white/10 hover:bg-accent-cyan/10 hover:border-accent-cyan/20 hover:text-accent-cyan text-xs font-bold rounded-lg transition duration-300 flex items-center space-x-1 mx-auto"
                    >
                      <Camera size={12} />
                      <span>Capture Faces</span>
                    </button>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => handleToggleStatus(item.student_id, item.status)}
                      className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition duration-300 ${
                        item.status === 'Present'
                          ? 'bg-accent-rose/10 border border-accent-rose/20 text-accent-rose hover:bg-accent-rose hover:text-white'
                          : 'bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald hover:bg-accent-emerald hover:text-white'
                      }`}
                    >
                      {item.status === 'Present' ? (
                        <span className="flex items-center space-x-1"><UserMinus size={12} /> <span>Mark Absent</span></span>
                      ) : (
                        <span className="flex items-center space-x-1"><UserCheck size={12} /> <span>Mark Present</span></span>
                      )}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Attendance;
