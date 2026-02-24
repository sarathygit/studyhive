import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Notifications from './Notifications';

export default function Navbar() {
    const { dark, toggleTheme } = useTheme();
    const { user, logout } = useAuth();
    const { notifications } = useSocket();

    return (
        <nav className="h-16 bg-white dark:bg-dark-900 border-b border-dark-100 dark:border-dark-800 px-6 flex items-center justify-between sticky top-0 z-50">
            <div className="flex items-center gap-3">
                <span className="text-2xl">🐝</span>
                <h1 className="text-xl font-display font-bold gradient-text hidden sm:block">StudyHive</h1>
            </div>

            <div className="flex items-center gap-3">
                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="w-10 h-10 rounded-xl bg-dark-100 dark:bg-dark-800 flex items-center justify-center hover:bg-dark-200 dark:hover:bg-dark-700 transition-colors"
                    title={dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                    {dark ? '☀️' : '🌙'}
                </button>

                {/* Notifications */}
                <Notifications notifications={notifications} />

                {/* User */}
                <div className="flex items-center gap-2 ml-2">
                    <div className="w-9 h-9 rounded-full gradient-bg flex items-center justify-center text-white font-bold text-sm">
                        {user?.username?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="hidden sm:block">
                        <p className="text-sm font-medium text-dark-900 dark:text-white">{user?.username}</p>
                        <p className="text-xs text-dark-500 dark:text-dark-400">🔥 {user?.streak || 0} day streak</p>
                    </div>
                </div>

                <button onClick={logout} className="btn-ghost text-sm ml-2">
                    Logout
                </button>
            </div>
        </nav>
    );
}
