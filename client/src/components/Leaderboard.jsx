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

    const getRank = (index) => {
        if (index === 0) return '1st';
        if (index === 1) return '2nd';
        if (index === 2) return '3rd';
        return `#${index + 1}`;
    };

    return (
        <div className="card p-5">
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
                Leaderboard
            </h3>

            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="animate-pulse flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700" />
                            <div className="flex-1 h-4 bg-slate-200 dark:bg-slate-700 rounded" />
                        </div>
                    ))}
                </div>
            ) : users.length === 0 ? (
                <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">
                    No users yet. Be the first!
                </p>
            ) : (
                <div className="space-y-2">
                    {users.slice(0, 10).map((u, i) => (
                        <div key={u._id} className={`flex items-center gap-3 p-2 rounded-xl transition-colors ${i < 3 ? 'bg-brand-50/50 dark:bg-brand-900/10' : ''
                            }`}>
                            <span className={`text-xs w-8 text-center font-semibold ${i < 3 ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400'}`}>{getRank(i)}</span>
                            <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white font-semibold text-xs">
                                {u.username?.[0]?.toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                    {u.username}
                                </p>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                    {u.streak} streak · {Math.floor(u.totalFocusTime / 60)}h {u.totalFocusTime % 60}m
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold text-brand-600 dark:text-brand-400">{u.focusScore}</p>
                                <p className="text-[10px] text-slate-400">pts</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
