import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CalendarCheck, 
  BookOpen, 
  TrendingUp, 
  Cpu
} from 'lucide-react';

const Navbar = () => {
  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Attendance', path: '/attendance', icon: CalendarCheck },
    { name: 'Exams', path: '/exams', icon: BookOpen },
    { name: 'Performance', path: '/performance', icon: TrendingUp },
  ];

  return (
    <aside className="w-64 h-screen sticky top-0 bg-[#0c0d12]/90 border-r border-white/5 flex flex-col justify-between py-6 px-4 shrink-0 glass-panel">
      <div>
        {/* Brand Header */}
        <div className="flex items-center space-x-3 px-3 mb-8">
          <div className="bg-gradient-to-tr from-accent-indigo via-accent-cyan to-accent-purple p-2 rounded-xl text-white shadow-lg pulse-glow-indigo">
            <Cpu size={24} className="animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wider bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
              AURA
            </h1>
            <span className="text-[10px] text-accent-cyan font-semibold tracking-widest uppercase">
              AI Classroom
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `
                  flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium group
                  ${isActive 
                    ? 'bg-gradient-to-r from-accent-indigo/20 to-accent-purple/10 text-white border-l-4 border-accent-indigo shadow-md shadow-accent-indigo/5' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5 hover:translate-x-1'
                  }
                `}
              >
                {({ isActive }) => (
                  <>
                    <Icon 
                      size={20} 
                      className={`transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-accent-indigo' : 'text-gray-400 group-hover:text-gray-200'}`} 
                    />
                    <span>{item.name}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Branding */}
      <div className="px-4 py-3 bg-white/3 rounded-xl border border-white/5 text-center">
        <p className="text-xs text-gray-500 font-medium">System Status</p>
        <div className="flex items-center justify-center space-x-2 mt-1.5">
          <span className="w-2 h-2 rounded-full bg-accent-emerald animate-ping"></span>
          <span className="w-2 h-2 rounded-full bg-accent-emerald absolute"></span>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
            Servers Connected
          </span>
        </div>
      </div>
    </aside>
  );
};

export default Navbar;
