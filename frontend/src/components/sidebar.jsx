
import React from 'react';
import {
  LayoutDashboard,
  ClipboardList,
  FileCheck,
  LogOut,
  FilePlus,
  PlayCircle,
  History,
  Trophy,
} from 'lucide-react';

const menuItems = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Assessments', icon: ClipboardList },
  { label: 'Create Assessment', icon: FilePlus },
  { label: 'Take Assessment', icon: PlayCircle },
  { label: 'Results', icon: FileCheck },
  { label: 'Attempt History', icon: History },
  { label: 'Leaderboard', icon: Trophy },
];

export default function Sidebar() {
  const [activeItem, setActiveItem] = React.useState('Dashboard');

  React.useEffect(() => {
    const handleNavigation = (event) => {
      setActiveItem(event.detail?.page || 'Dashboard');
    };

    window.addEventListener('quizmaster:navigate', handleNavigation);
    return () => window.removeEventListener('quizmaster:navigate', handleNavigation);
  }, []);

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col overflow-hidden border-r border-[#E1E9DD] bg-white">
      <div className="shrink-0 border-b border-[#E1E9DD] px-6 py-5">
        <h2 className="text-xl font-bold text-[#718F6D]">QuizMaster</h2>
        <p className="mt-1 text-xs text-[#718071]">
          Online Assessment System
        </p>
      </div>

      <nav className="min-h-0 flex-1 space-y-1 overflow-hidden p-4">
        {menuItems.map(({ label, icon: Icon }) => (
          <button
            key={label}
            onClick={() => {
              setActiveItem(label);
              window.dispatchEvent(
                new CustomEvent('quizmaster:navigate', {
                  detail: { page: label },
                })
              );
            }}
            className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium transition-colors ${
              activeItem === label
                ? 'bg-[#EAF1E7] text-[#718F6D]'
                : 'text-[#718071] hover:bg-[#F5F8F2] hover:text-[#718F6D]'
            }`}
          >
            <Icon size={19} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="shrink-0 border-t border-[#E1E9DD] p-4">
        <button
          onClick={() => window.location.reload()}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-[#718071] transition-colors hover:bg-[#F5F8F2] hover:text-[#718F6D]"
        >
          <LogOut size={19} />
          Log Out
        </button>
      </div>
    </aside>
  );
}
