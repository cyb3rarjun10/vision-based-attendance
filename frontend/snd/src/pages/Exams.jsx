import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BookOpen, 
  Calendar, 
  PlusCircle, 
  Check, 
  AlertCircle
} from 'lucide-react';

const NODE_API = 'http://localhost:5000/api';

const Exams = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    subject: '',
    date: '',
    class: '',
    max_marks: ''
  });

  const [submitStatus, setSubmitStatus] = useState({ type: '', message: '' });

  const fetchExams = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${NODE_API}/exams`);
      setExams(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateExam = async (e) => {
    e.preventDefault();
    setSubmitStatus({ type: '', message: '' });

    const { subject, date, class: className, max_marks } = form;
    if (!subject || !date || !className || !max_marks) {
      setSubmitStatus({ type: 'error', message: 'All fields are required.' });
      return;
    }

    try {
      await axios.post(`${NODE_API}/exams`, form);
      setSubmitStatus({ type: 'success', message: 'Exam scheduled successfully!' });
      setForm({ subject: '', date: '', class: '', max_marks: '' });
      fetchExams();
    } catch (err) {
      setSubmitStatus({ 
        type: 'error', 
        message: err.response?.data?.error || 'Failed to schedule exam. Try again.' 
      });
    }
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto space-y-8">
      <div>
        <h2 className="text-3xl font-extrabold text-white">Exam Scheduler</h2>
        <p className="text-gray-400 mt-1">Schedule and monitor exams, manage maximum mark definitions.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 p-6 rounded-2xl glass-panel h-fit">
          <div className="flex items-center space-x-2.5 mb-6">
            <PlusCircle className="text-accent-purple" size={22} />
            <h4 className="text-lg font-bold text-white">Schedule New Exam</h4>
          </div>

          <form onSubmit={handleCreateExam} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Subject</label>
              <input
                type="text"
                name="subject"
                value={form.subject}
                onChange={handleInputChange}
                placeholder="e.g. Mathematics"
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-accent-purple/60 transition text-sm text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Exam Date</label>
              <div className="flex items-center space-x-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white">
                <Calendar size={16} className="text-gray-400" />
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleInputChange}
                  className="bg-transparent border-none text-sm focus:outline-none w-full text-white cursor-pointer"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Class / Grade</label>
              <input
                type="text"
                name="class"
                value={form.class}
                onChange={handleInputChange}
                placeholder="e.g. Grade 10-A"
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-accent-purple/60 transition text-sm text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Maximum Marks</label>
              <input
                type="number"
                name="max_marks"
                value={form.max_marks}
                onChange={handleInputChange}
                placeholder="e.g. 100"
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-accent-purple/60 transition text-sm text-white"
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
              className="w-full mt-2 py-3 bg-gradient-to-r from-accent-purple to-accent-indigo text-white font-bold text-sm rounded-xl shadow-lg hover:brightness-110 active:scale-[0.99] transition duration-300 shadow-accent-purple/10"
            >
              Schedule Exam
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 p-6 rounded-2xl glass-panel">
          <div className="flex items-center space-x-2.5 mb-6">
            <BookOpen className="text-accent-indigo" size={22} />
            <h4 className="text-lg font-bold text-white">Active Exam Schedules</h4>
          </div>

          <div className="border border-white/5 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/3 border-b border-white/5 text-gray-400 text-xs font-bold uppercase tracking-wider">
                  <th className="py-4 px-6">ID</th>
                  <th className="py-4 px-6">Subject</th>
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6">Class</th>
                  <th className="py-4 px-6 text-right">Max Marks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm text-gray-300">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-gray-400">Loading exams schedule...</td>
                  </tr>
                ) : exams.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-gray-400">No exams scheduled yet.</td>
                  </tr>
                ) : (
                  exams.map((exam) => (
                    <tr key={exam.id} className="hover:bg-white/2 transition duration-200">
                      <td className="py-4 px-6 font-mono text-xs">{exam.id}</td>
                      <td className="py-4 px-6 text-white font-bold">{exam.subject}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2 text-xs">
                          <Calendar size={13} className="text-accent-indigo" />
                          <span>{exam.date}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">{exam.class}</td>
                      <td className="py-4 px-6 text-right font-mono font-bold text-white pr-8">
                        {exam.max_marks}
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

export default Exams;
