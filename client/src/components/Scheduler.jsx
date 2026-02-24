import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function Scheduler({ roomId }) {
    const [sessions, setSessions] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ title: '', description: '', scheduledAt: '', duration: 60 });
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        fetchSessions();
    }, [roomId]);

    const fetchSessions = async () => {
        try {
            const res = await api.get(`/sessions/${roomId}`);
            setSessions(res.data);
        } catch (err) {
            console.error('Failed to fetch sessions');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/sessions', { ...form, roomId });
            setSessions(prev => [...prev, res.data]);
            setShowForm(false);
            setForm({ title: '', description: '', scheduledAt: '', duration: 60 });
        } catch (err) {
            console.error('Failed to create session');
        }
    };

    const handleJoin = async (id) => {
        try {
            const res = await api.post(`/sessions/${id}/join`);
            setSessions(prev => prev.map(s => s._id === id ? res.data : s));
        } catch (err) {
            console.error('Failed to join session');
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/sessions/${id}`);
            setSessions(prev => prev.filter(s => s._id !== id));
        } catch (err) {
            console.error('Failed to delete session');
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleString('en', {
            weekday: 'short', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const isJoined = (session) => {
        return session.participants?.some(p => p._id === user?._id);
    };

    return (
        <div className="p-4 space-y-4 overflow-y-auto h-full">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-display font-bold text-dark-900 dark:text-white flex items-center gap-2">
                    📅 Study Sessions
                </h3>
                <button onClick={() => setShowForm(!showForm)} className="btn-primary text-xs">
                    + Schedule
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleCreate} className="card p-4 space-y-3 animate-slide-up">
                    <input
                        type="text"
                        placeholder="Session title"
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        className="input-field text-sm"
                        required
                    />
                    <textarea
                        placeholder="Description (optional)"
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        className="input-field text-sm min-h-[60px]"
                    />
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-medium text-dark-500 dark:text-dark-400 mb-1 block">Date & Time</label>
                            <input
                                type="datetime-local"
                                value={form.scheduledAt}
                                onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                                className="input-field text-sm"
                                required
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-dark-500 dark:text-dark-400 mb-1 block">Duration (min)</label>
                            <input
                                type="number"
                                value={form.duration}
                                onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) })}
                                className="input-field text-sm"
                                min="15"
                                max="240"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button type="submit" className="btn-primary text-sm">📅 Schedule</button>
                        <button type="button" onClick={() => setShowForm(false)} className="btn-ghost text-sm">Cancel</button>
                    </div>
                </form>
            )}

            {loading ? (
                <div className="space-y-3">
                    {[1, 2].map(i => (
                        <div key={i} className="animate-pulse card p-4">
                            <div className="h-4 bg-dark-200 dark:bg-dark-700 rounded w-3/4 mb-2" />
                            <div className="h-3 bg-dark-200 dark:bg-dark-700 rounded w-1/2" />
                        </div>
                    ))}
                </div>
            ) : sessions.length === 0 ? (
                <div className="text-center py-8 text-dark-400 dark:text-dark-500">
                    <span className="text-4xl">📅</span>
                    <p className="text-sm mt-2">No upcoming sessions</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {sessions.map(session => (
                        <div key={session._id} className="card p-4 animate-fade-in">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="font-medium text-sm text-dark-900 dark:text-white">{session.title}</p>
                                    <p className="text-xs text-dark-500 dark:text-dark-400 mt-1">
                                        🕐 {formatDate(session.scheduledAt)} · {session.duration}min
                                    </p>
                                    {session.description && (
                                        <p className="text-xs text-dark-500 dark:text-dark-400 mt-1">{session.description}</p>
                                    )}
                                </div>
                                {session.createdBy?._id === user?._id && (
                                    <button onClick={() => handleDelete(session._id)} className="text-dark-400 hover:text-red-500 text-xs">
                                        🗑
                                    </button>
                                )}
                            </div>
                            <div className="flex items-center justify-between mt-3">
                                <div className="flex -space-x-2">
                                    {session.participants?.slice(0, 5).map((p, i) => (
                                        <div key={i} className="w-7 h-7 rounded-full gradient-bg flex items-center justify-center text-white text-[10px] font-bold border-2 border-white dark:border-dark-900">
                                            {p.username?.[0]?.toUpperCase()}
                                        </div>
                                    ))}
                                    {session.participants?.length > 5 && (
                                        <div className="w-7 h-7 rounded-full bg-dark-200 dark:bg-dark-700 flex items-center justify-center text-[10px] font-bold border-2 border-white dark:border-dark-900">
                                            +{session.participants.length - 5}
                                        </div>
                                    )}
                                </div>
                                {!isJoined(session) && (
                                    <button onClick={() => handleJoin(session._id)} className="btn-primary text-xs py-1.5">
                                        Join
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
