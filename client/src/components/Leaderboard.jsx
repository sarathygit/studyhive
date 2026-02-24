import { useState, useEffect } from 'react';
import api from '../utils/api';

export default function Leaderboard() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLeaderboard();
    }, []);

    const fetchLeaderboard = async () => {
        try {
            const res = await api.get('/focus/leaderboard');
            setUsers(res.data);
        } catch (err) {
            console.error('Failed to fetch leaderboard');
        } finally {
            setLoading(false);
        }
    };

    const getMedal = (index) => {
        if (index === 0) return '🥇';
        if (index === 1) return '🥈';
        if (index === 2) return '🥉';
        return `#${index + 1}`;
    };

    return (
        <div className="card p-5">
            <h3 className="text-sm font-display font-bold text-dark-700 dark:text-dark-300 mb-4 flex items-center gap-2">
                🏆 Leaderboard
            </h3>

            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="animate-pulse flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-dark-200 dark:bg-dark-700" />
                            <div className="flex-1 h-4 bg-dark-200 dark:bg-dark-700 rounded" />
                        </div>
                    ))}
                </div>
            ) : users.length === 0 ? (
                <p className="text-sm text-dark-400 dark:text-dark-500 text-center py-4">
                    No users yet. Be the first!
                </p>
            ) : (
                <div className="space-y-2">
                    {users.slice(0, 10).map((u, i) => (
                        <div key={u._id} className={`flex items-center gap-3 p-2 rounded-xl transition-colors ${i < 3 ? 'bg-honey-50/50 dark:bg-honey-900/10' : ''
                            }`}>
                            <span className="text-lg w-8 text-center font-bold">{getMedal(i)}</span>
                            <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center text-white font-bold text-xs">
                                {u.username?.[0]?.toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-dark-900 dark:text-white truncate">
                                    {u.username}
                                </p>
                                <p className="text-[10px] text-dark-500 dark:text-dark-400">
                                    🔥 {u.streak} streak · {Math.floor(u.totalFocusTime / 60)}h {u.totalFocusTime % 60}m
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold text-honey-600 dark:text-honey-400">{u.focusScore}</p>
                                <p className="text-[10px] text-dark-400">pts</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
