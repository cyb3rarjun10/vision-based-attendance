import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Attendance from './pages/Attendance';
import Exams from './pages/Exams';
import Performance from './pages/Performance';

function App() {
  return (
    <div className="flex bg-bg-dark text-gray-100 min-h-screen font-sans">
      {/* Sidebar Navigation */}
      <Navbar />
      
      {/* Main View Pane */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/exams" element={<Exams />} />
          <Route path="/performance" element={<Performance />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
