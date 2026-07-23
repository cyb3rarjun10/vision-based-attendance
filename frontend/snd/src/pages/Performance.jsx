import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, 
  User, 
  Award, 
  BookOpen, 
  Check, 
  AlertCircle
} from 'lucide-react';

const NODE_API = 'http://localhost:5000/api';

const Performance = () => {
  const [students, setStudents] = useState([]);
  const [exams, setExams] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentPerformance, setStudentPerformance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    student_id: '',
    exam_id: '',
    marks: ''
  });

  const [submitStatus, setSubmitStatus] = useState({ type: '', message: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studentsRes, examsRes] = await Promise.all([
          axios.get(`${NODE_API}/students`),
          axios.get(`${NODE_API}/exams`)
        ]);
        setStudents(studentsRes.data);
        setExams(examsRes.data);

        if (studentsRes.data.length > 0) {
          setSelectedStudentId(studentsRes.data[0].id.toString());
          setForm(prev => ({ ...prev, student_id: studentsRes.data[0].id.toString() }));
        }
        if (examsRes.data.length > 0) {
          setForm(prev => ({ ...prev, exam_id: examsRes.data[0].id.toString() }));
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const fetchStudentPerformance = async (studentId) => {
    if (!studentId) return;
    setLoading(true);
    try {
      const res = await axios.get(`${NODE_API}/performance/student/${studentId}`);
      const formatted = res.data.map(item => ({
        ...item,
        percentage: item.max_marks > 0 ? Math.round((item.marks / item.max_marks) * 100) : 0,
        name: `${item.subject} (${item.date})`
      }));
      setStudentPerformance(formatted);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStudentPerformance(selectedStudentId);
  }, [selectedStudentId]);

  const handleStudentChange = (e) => {
    setSelectedStudentId(e.target.value);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRecordMarks = async (e) => {
    e.preventDefault();
    setSubmitStatus({ type: '', message: '' });

    const { student_id, exam_id, marks } = form;
    if (!student_id || !exam_id || marks === '') {
      setSubmitStatus({ type: 'error', message: 'All fields are required.' });
      return;
    }

    try {
      await axios.post(`${NODE_API}/performance`, {
        student_id: parseInt(student_id, 10),
        exam_id: parseInt(exam_id, 10),
        marks: parseInt(marks, 10)
      });
      setSubmitStatus({ type: 'success', message: 'Marks recorded successfully!' });
      setForm(prev => ({ ...prev, marks: '' }));
      
      if (student_id === selectedStudentId) {
        fetchStudentPerformance(selectedStudentId);
      }
    } catch (err) {
      setSubmitStatus({ 
        type: 'error', 
        message: err.response?.data?.error || 'Failed to record marks. Check limits.' 
      });
    }
  };

  const calculateGPA = () => {
    if (studentPerformance.length === 0) return 'N/A';
    const totalMarks = studentPerformance.reduce((acc, curr) => acc + curr.marks, 0);
    const totalMax = studentPerformance.reduce((acc, curr) => acc + curr.max_marks, 0);
    return totalMax > 0 ? `${Math.round((totalMarks / totalMax) * 100)}%` : 'N/A';
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-4 rounded-xl border border-white/10 bg-[#12131a] text-xs space-y-1">
          <p className="font-bold text-white mb-1">{label}</p>
          <p className="text-accent-indigo">Marks Obtained: <span className="font-bold">{payload[0].value}</span></p>
          <p className="text-gray-400">Max Marks: <span className="font-bold">{payload[1].value}</span></p>
          <p className="text-accent-cyan">Percentage: <span className="font-bold">{payload[0].payload.percentage}%</span></p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-3xl font-extrabold text-white">Performance Analytics</h2>
          <p className="text-gray-400 mt-1">Track student exam scores, visualize class rankings, and record grades.</p>
        </div>

        <div className="flex items-center space-x-3 bg-white/3 border border-white/5 px-4 py-2 rounded-xl glass-card">
          <User size={16} className="text-accent-cyan" />
          <span className="text-xs text-gray-300 font-medium">Student Profile:</span>
          <select
            value={selectedStudentId}
            onChange={handleStudentChange}
            className="bg-transparent border-none text-sm text-white focus:outline-none cursor-pointer font-bold"
          >
            {students.length === 0 ? (
              <option value="" className="bg-[#0b0c10]">No students registered</option>
            ) : (
              students.map(s => (
                <option key={s.id} value={s.id} className="bg-[#0b0c10] text-white">
                  {s.name} (Roll: {s.roll_no})
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl glass-panel flex items-center space-x-4">
          <div className="bg-accent-indigo/10 p-3 rounded-xl text-accent-indigo">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Overall Average</p>
            <h4 className="text-2xl font-extrabold text-white mt-0.5">{calculateGPA()}</h4>
          </div>
        </div>
        <div className="p-6 rounded-2xl glass-panel flex items-center space-x-4">
          <div className="bg-accent-purple/10 p-3 rounded-xl text-accent-purple">
            <BookOpen size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Exams Taken</p>
            <h4 className="text-2xl font-extrabold text-white mt-0.5">{studentPerformance.length}</h4>
          </div>
        </div>
        <div className="p-6 rounded-2xl glass-panel flex items-center space-x-4">
          <div className="bg-accent-cyan/10 p-3 rounded-xl text-accent-cyan">
            <Award size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Academic Standing</p>
            <h4 className="text-2xl font-extrabold text-white mt-0.5">
              {studentPerformance.length === 0 ? 'N/A' : 'Satisfactory'}
            </h4>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-2xl glass-panel">
        <h4 className="text-lg font-bold text-white mb-6 flex items-center space-x-2">
          <TrendingUp className="text-accent-indigo" size={20} />
          <span>Performance Overview Chart</span>
        </h4>
        
        {loading ? (
          <div className="text-center py-20 text-gray-400 text-sm">Loading visualization...</div>
        ) : studentPerformance.length === 0 ? (
          <div className="text-center py-20 text-gray-400 text-sm">No exam scores recorded for this student. Use the form below to add grades.</div>
        ) : (
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={studentPerformance}
                margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                barSize={32}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="name" 
                  stroke="#9ca3af" 
                  fontSize={11} 
                  tickLine={false} 
                />
                <YAxis 
                  stroke="#9ca3af" 
                  fontSize={11} 
                  tickLine={false} 
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                <Legend 
                  verticalAlign="top" 
                  height={36} 
                  iconType="circle"
                  formatter={(value) => <span className="text-xs text-gray-300 font-semibold">{value === 'marks' ? 'Marks Obtained' : 'Maximum Marks'}</span>}
                />
                <Bar dataKey="marks" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="max_marks" fill="rgba(255, 255, 255, 0.08)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 p-6 rounded-2xl glass-panel h-fit">
          <div className="flex items-center space-x-2.5 mb-6">
            <Award className="text-accent-indigo" size={22} />
            <h4 className="text-lg font-bold text-white">Record Exam Marks</h4>
          </div>

          <form onSubmit={handleRecordMarks} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Select Student</label>
              <select
                name="student_id"
                value={form.student_id}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-accent-indigo/60 transition text-sm text-white"
              >
                <option value="" className="bg-[#0b0c10] text-gray-400">Choose Student...</option>
                {students.map(s => (
                  <option key={s.id} value={s.id} className="bg-[#0b0c10] text-white">
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Select Exam</label>
              <select
                name="exam_id"
                value={form.exam_id}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-accent-indigo/60 transition text-sm text-white"
              >
                <option value="" className="bg-[#0b0c10] text-gray-400">Choose Exam...</option>
                {exams.map(e => (
                  <option key={e.id} value={e.id} className="bg-[#0b0c10] text-white">
                    {e.subject} ({e.date} | Max: {e.max_marks})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Marks Obtained</label>
              <input
                type="number"
                name="marks"
                value={form.marks}
                onChange={handleInputChange}
                placeholder="e.g. 85"
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-accent-indigo/60 transition text-sm text-white"
              />
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
              className="w-full mt-2 py-3 bg-gradient-to-r from-accent-indigo to-accent-purple text-white font-bold text-sm rounded-xl shadow-lg hover:brightness-110 active:scale-[0.99] transition duration-300 shadow-accent-indigo/10"
            >
              Record Marks
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 p-6 rounded-2xl glass-panel">
          <div className="flex items-center space-x-2.5 mb-6">
            <BookOpen className="text-accent-cyan" size={22} />
            <h4 className="text-lg font-bold text-white">Exam Score History</h4>
          </div>

          <div className="border border-white/5 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/3 border-b border-white/5 text-gray-400 text-xs font-bold uppercase tracking-wider">
                  <th className="py-4 px-6">Subject</th>
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6 text-center">Score</th>
                  <th className="py-4 px-6 text-center">Percentage</th>
                  <th className="py-4 px-6 text-right">Standing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm text-gray-300">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-gray-400">Loading student grades...</td>
                  </tr>
                ) : studentPerformance.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-gray-400">No grades recorded for this student.</td>
                  </tr>
                ) : (
                  studentPerformance.map((score) => (
                    <tr key={score.id} className="hover:bg-white/2 transition duration-200">
                      <td className="py-4 px-6 text-white font-bold">{score.subject}</td>
                      <td className="py-4 px-6 text-xs text-gray-400">{score.date}</td>
                      <td className="py-4 px-6 text-center font-mono font-bold">
                        {score.marks} / <span className="text-gray-500">{score.max_marks}</span>
                      </td>
                      <td className="py-4 px-6 text-center font-mono text-accent-cyan font-bold">
                        {score.percentage}%
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          score.percentage >= 75 ? 'bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/20' :
                          score.percentage >= 40 ? 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20' :
                          'bg-accent-rose/10 text-accent-rose border border-accent-rose/20'
                        }`}>
                          {score.percentage >= 75 ? 'Distinction' : score.percentage >= 40 ? 'Pass' : 'Fail'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Performance;
