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
                    <div className="h-4 bg-dark-200 dark:bg-dark-700 rounded w-1/2" />
                    <div className="h-32 bg-dark-200 dark:bg-dark-700 rounded" />
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
            backgroundColor: 'rgba(249, 160, 7, 0.7)',
            borderColor: '#f9a007',
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
                backgroundColor: '#1a1b21',
                titleColor: '#fff',
                bodyColor: '#fff',
                padding: 10,
                cornerRadius: 8,
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: 'rgba(0,0,0,0.05)' },
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
            <h3 className="text-sm font-display font-bold text-dark-700 dark:text-dark-300 mb-4 flex items-center gap-2">
                📊 Focus Stats
            </h3>

            {/* Today's Stats */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-honey-50 dark:bg-honey-900/20 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-honey-600 dark:text-honey-400">
                        {stats?.today?.totalDuration || 0}
                    </p>
                    <p className="text-[10px] text-dark-500 dark:text-dark-400 mt-1">Min Today</p>
                </div>
                <div className="bg-hive-50 dark:bg-hive-900/20 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-hive-600 dark:text-hive-400">
                        {stats?.user?.focusScore || 0}
                    </p>
                    <p className="text-[10px] text-dark-500 dark:text-dark-400 mt-1">Focus Score</p>
                </div>
            </div>

            {/* Weekly Chart */}
            <div className="h-32">
                {stats?.daily?.length > 0 ? (
                    <Bar data={chartData} options={chartOptions} />
                ) : (
                    <div className="flex items-center justify-center h-full text-dark-400 dark:text-dark-500 text-sm">
                        No data yet. Complete focus sessions to see stats!
                    </div>
                )}
            </div>

            {/* Badges */}
            {stats?.user?.badges?.length > 0 && (
                <div className="mt-4">
                    <p className="text-xs font-medium text-dark-500 dark:text-dark-400 mb-2">Badges</p>
                    <div className="flex flex-wrap gap-2">
                        {stats.user.badges.map((badge, i) => (
                            <span key={i} className="badge-honey text-xs">
                                {badge.icon} {badge.name}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
