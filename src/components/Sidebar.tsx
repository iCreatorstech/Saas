import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Globe,
  Cloud,
  Smartphone,
  FolderCog,
  CreditCard,
  Headphones,
  MessageSquare,
  LineChart,
  Settings,
  LogOut,
  Bell,
  Calendar,
  FileSpreadsheet,
  CloudCog,
  ListTodo,
  Users2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
//import { ThemeToggle } from './ThemeToggle';
import { Button } from './ui/button';

const menuSections = [
  {
    name: 'Overview',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
      { icon: Users, label: 'Client Management', path: '/clients' },
      { icon: Globe, label: 'Site Management', path: '/sites' },
      { icon: Cloud, label: 'Hosting Management', path: '/hosting' },
      { icon: Smartphone, label: 'Mobile Apps', path: '/mobile-apps' },
      { icon: FolderCog, label: 'Developer Accounts', path: '/developer-accounts' },
    ]
  },
  {
    name: 'Workspace',
    items: [
      { icon: ListTodo, label: 'Tasks & To-Do', path: '/tasks' },
      { icon: Calendar, label: 'Task Calendar', path: '/task-calendar' },
      { icon: FileSpreadsheet, label: 'Task Reports', path: '/task-reports' },
    ]
  },

  {
    name: 'Teams & Collaboration',
    items: [
      { icon: Users2, label: 'Teams', path: '/teams' },
      { icon: MessageSquare, label: 'Team Communication', path: '/team-communication' },
      { icon: Calendar, label: 'Team Calendar', path: '/team-calendar' },
      { icon: FileSpreadsheet, label: 'Team Reports', path: '/team-reports' },
    ]
  },

  {
    name: 'Important',
    items: [
      { icon: Bell, label: 'Notifications', path: '/notifications' },
      { icon: LineChart, label: 'Reports', path: '/reports' },
      { icon: Headphones, label: 'Support', path: '/support' },
    ]
  },
  {
    name: 'Billing & System',
    items: [
      { icon: CreditCard, label: 'Billing', path: '/billing' },
      { icon: CloudCog, label: 'System Status', path: '/system-status' },
      { icon: Settings, label: 'Settings', path: '/settings' },
    ]
  }
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm lg:hidden z-40"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        bg-white dark:bg-[#1A1A1A] w-64 border-r border-gray-200 dark:border-gray-700/50 
        flex flex-col transform transition-transform duration-200 ease-in-out
        lg:transform-none lg:flex
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
      <div className="p-5 flex items-center gap-2">
        <LayoutDashboard className="w-8 h-8 text-gray-900 dark:text-white" />
        <span className="text-xl font-semibold text-gray-900 dark:text-white">STACK ASSIST</span>
      </div>

      <nav className="flex-grow p-5 space-y-8 overflow-y-auto">
        {menuSections.map((section, index) => (
          <div key={index} className="space-y-4">
            <h3 className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-medium">
              {section.name}
            </h3>
            <div className="space-y-1">
              {section.items.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                    location.pathname === item.path 
                      ? 'text-indigo-600 dark:text-[#3765F0] bg-indigo-50 dark:bg-[#3765F0]/10 font-medium' 
                      : 'text-gray-700 dark:text-[#A1A1A1] hover:text-indigo-600 dark:hover:text-[#3765F0] hover:bg-gray-100 dark:hover:bg-[#1A1A1A]/60'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div>
 {/*<div className="relative p-8 min-h-[280px] overflow-hidden rounded-lg">
    <img
      alt="Upgrade Storage"
      loading="lazy"
      decoding="async"
      data-nimg="fill"
      sizes="(max-width: 768px) 100vw"
      src="https://isomorphic-furyroad.vercel.app/_next/image?url=https%3A%2F%2Fisomorphic-furyroad.s3.amazonaws.com%2Fpublic%2Fupgrade-storage-bg.webp&w=3840&q=75"
      style={{
        position: "absolute",
        height: "100%",
        width: "100%",
        inset: 0,
        color: "transparent"
      }}
    />
    <div className="relative z-10">
      <h2 className="rizzui-title-h2 text-2xl font-semibold text-white">
      Boost Your Productivity
      </h2>
      <div className="my-5">
        <p className="rizzui-text-p flex items-center gap-2 py-1 text-sm font-medium text-white">
          <svg
            stroke="currentColor"
            fill="currentColor"
            strokeWidth={0}
            viewBox="0 0 256 256"
            className="h-5 w-5 text-xl text-white"
            height="1em"
            width="1em"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm45.66,85.66-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35a8,8,0,0,1,11.32,11.32Z" />
          </svg>
          Premium features with customization.
        </p>
        <p className="rizzui-text-p flex items-center gap-2 py-1 text-sm font-medium text-white">
          <svg
            stroke="currentColor"
            fill="currentColor"
            strokeWidth={0}
            viewBox="0 0 256 256"
            className="h-5 w-5 text-xl text-white"
            height="1em"
            width="1em"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm45.66,85.66-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35a8,8,0,0,1,11.32,11.32Z" />
          </svg>
          Team Collaboration Made Easy.
        </p>
        <p className="rizzui-text-p flex items-center gap-2 py-1 text-sm font-medium text-white">
          <svg
            stroke="currentColor"
            fill="currentColor"
            strokeWidth={0}
            viewBox="0 0 256 256"
            className="h-5 w-5 text-xl text-white"
            height="1em"
            width="1em"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm45.66,85.66-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35a8,8,0,0,1,11.32,11.32Z" />
          </svg>
          Expand Your Reach.
        </p>
      </div>
      <a
        className="inline-block rounded-md bg-white px-4 py-2.5 text-sm font-medium text-gray-900 dark:bg-gray-100"
        href="/file"
      >
        Upgrade Storage
      </a>
    </div>
  </div>*/}
</div>

    <div className="p-5">
        <Button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white dark:bg-[#FF3B30] dark:hover:bg-[#FF3B30]/90 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="sm:inline">Logout</span>
        </Button>
      </div>
      </aside>
    </>
  );
};

export default Sidebar;