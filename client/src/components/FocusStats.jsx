import { useState, useEffect } from 'react';
import api from '../utils/api';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function FocusStats() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await api.get('/focus/stats');
            setStats(res.data);
        } catch (err) {
            console.error('Failed to fetch stats');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="card p-5">
                <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                    <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded" />
                </div>
            </div>
        );
    }

    const chartData = {
        labels: stats?.daily?.map(d => {
            const date = new Date(d._id);
            return date.toLocaleDateString('en', { weekday: 'short' });
        }) || [],
        datasets: [{
            label: 'Focus Time (min)',
            data: stats?.daily?.map(d => d.totalDuration) || [],
            backgroundColor: 'rgba(37, 99, 235, 0.6)',
            borderColor: '#2563eb',
            borderWidth: 1,
            borderRadius: 6,
        }]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#0f172a',
                titleColor: '#fff',
                bodyColor: '#fff',
                padding: 10,
                cornerRadius: 8,
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: 'rgba(0,0,0,0.04)' },
                ticks: { font: { size: 10 } }
            },
            x: {
                grid: { display: false },
                ticks: { font: { size: 10 } }
            }
        }
    };

    return (
        <div className="card p-5">
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
                Focus Stats
            </h3>

            {/* Today's Stats */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-brand-50 dark:bg-brand-900/20 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-brand-600 dark:text-brand-400">
                        {stats?.today?.totalDuration || 0}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Min Today</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-slate-700 dark:text-slate-300">
                        {stats?.user?.focusScore || 0}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Focus Score</p>
                </div>
            </div>

            {/* Weekly Chart */}
            <div className="h-32">
                {stats?.daily?.length > 0 ? (
                    <Bar data={chartData} options={chartOptions} />
                ) : (
                    <div className="flex items-center justify-center h-full text-slate-400 dark:text-slate-500 text-sm">
                        No data yet. Complete focus sessions to see stats.
                    </div>
                )}
            </div>

            {/* Badges */}
            {stats?.user?.badges?.length > 0 && (
                <div className="mt-4">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Badges</p>
                    <div className="flex flex-wrap gap-2">
                        {stats.user.badges.map((badge, i) => (
                            <span key={i} className="badge-brand text-xs">
                                {badge.name}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
