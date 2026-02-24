import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Notifications from './Notifications';

export default function Navbar() {
    const { dark, toggleTheme } = useTheme();
    const { user, logout } = useAuth();
    const { notifications } = useSocket();

    return (
        <nav className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between sticky top-0 z-50">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xs font-bold">SH</span>
                </div>
                <h1 className="text-lg font-display font-semibold text-slate-900 dark:text-white hidden sm:block">StudyHive</h1>
            </div>

            <div className="flex items-center gap-2">
                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm"
                    title={dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                    {dark ? (
                        <svg className="w-4 h-4 text-slate-600 dark:text-slate-300" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><circle cx="12" cy="12" r="5" /><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>
                    ) : (
                        <svg className="w-4 h-4 text-slate-600 dark:text-slate-300" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
                    )}
                </button>

                {/* Notifications */}
                <Notifications notifications={notifications} />

                {/* User */}
                <div className="flex items-center gap-2 ml-1">
                    <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white font-semibold text-xs">
                        {user?.username?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="hidden sm:block">
                        <p className="text-sm font-medium text-slate-900 dark:text-white leading-tight">{user?.username}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{user?.streak || 0} day streak</p>
                    </div>
                </div>

                <button onClick={logout} className="btn-ghost text-sm ml-1">
                    Logout
                </button>
            </div>
        </nav>
    );
}
