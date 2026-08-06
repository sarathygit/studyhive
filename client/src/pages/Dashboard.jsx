import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import PomodoroTimer from '../components/PomodoroTimer';
import FocusStats from '../components/FocusStats';
import Leaderboard from '../components/Leaderboard';

export default function Dashboard() {
    const [rooms, setRooms] = useState([]);
    const [activeRoom, setActiveRoom] = useState(null);
    const [loading, setLoading] = useState(true);
    const [discoverRooms, setDiscoverRooms] = useState([]);
    const [showDiscover, setShowDiscover] = useState(false);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetchRooms();
    }, []);

    const fetchRooms = async () => {
        try {
            const res = await api.get('/rooms');
            setRooms(res.data);
        } catch (err) {
            console.error('Failed to fetch rooms');
        } finally {
            setLoading(false);
        }
    };

    const handleDiscover = async () => {
        setShowDiscover(true);
        try {
            const res = await api.get('/rooms/discover');
            setDiscoverRooms(res.data);
        } catch (err) {
            console.error('Failed to discover rooms');
        }
    };

    const handleSelectRoom = (room) => {
        setActiveRoom(room);
        navigate(`/room/${room._id}`);
    };

    // Rooms from Discover aren't joined yet, and room pages are members-only now,
    // so join first and add it to the sidebar before navigating.
    const handleJoinDiscovered = async (room) => {
        try {
            const res = await api.post(`/rooms/${room._id}/join`);
            setRooms(prev => prev.some(r => r._id === res.data._id) ? prev : [res.data, ...prev]);
            handleSelectRoom(res.data);
        } catch (err) {
            console.error('Failed to join room', err);
        }
    };

    const handleRoomCreated = (room) => {
        setRooms(prev => [room, ...prev]);
        handleSelectRoom(room);
    };

    return (
        <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
            <Navbar />
            <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar */}
                <Sidebar
                    rooms={rooms}
                    activeRoom={activeRoom}
                    onSelectRoom={handleSelectRoom}
                    onRoomCreated={handleRoomCreated}
                />

                {/* Center Content */}
                <div className="flex-1 flex flex-col overflow-y-auto">
                    {/* Welcome Banner */}
                    <div className="p-6">
                        <div className="rounded-2xl p-8 gradient-bg text-white">
                            <h2 className="text-3xl font-display font-bold mb-2">
                                Welcome back, {user?.username}
                            </h2>
                            <p className="text-white/80 text-lg mb-6">
                                Ready to study? Create or join a room to get started.
                            </p>
                            <div className="flex items-center gap-4 flex-wrap">
                                <div className="bg-white/15 backdrop-blur-sm rounded-xl px-5 py-3">
                                    <p className="text-2xl font-bold">{user?.focusScore || 0}</p>
                                    <p className="text-xs text-white/70">Focus Score</p>
                                </div>
                                <div className="bg-white/15 backdrop-blur-sm rounded-xl px-5 py-3">
                                    <p className="text-2xl font-bold">{user?.streak || 0}</p>
                                    <p className="text-xs text-white/70">Day Streak</p>
                                </div>
                                <div className="bg-white/15 backdrop-blur-sm rounded-xl px-5 py-3">
                                    <p className="text-2xl font-bold">{rooms.length}</p>
                                    <p className="text-xs text-white/70">Study Rooms</p>
                                </div>
                                <div className="bg-white/15 backdrop-blur-sm rounded-xl px-5 py-3">
                                    <p className="text-2xl font-bold">{user?.badges?.length || 0}</p>
                                    <p className="text-xs text-white/70">Badges Earned</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions & Discover */}
                    <div className="px-6 pb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
                                Discover Rooms
                            </h3>
                            <button onClick={handleDiscover} className="btn-ghost text-sm">
                                Browse All
                            </button>
                        </div>

                        {showDiscover && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 animate-fade-in">
                                {discoverRooms.length === 0 ? (
                                    <p className="text-slate-400 dark:text-slate-500 text-sm col-span-3 text-center py-8">
                                        No rooms available yet. Create the first one!
                                    </p>
                                ) : (
                                    discoverRooms.map(room => (
                                        <div key={room._id} className="card p-4 hover:border-brand-300 dark:hover:border-brand-700 transition-colors cursor-pointer"
                                            onClick={() => handleJoinDiscovered(room)}>
                                            <p className="font-medium text-sm text-slate-900 dark:text-white">{room.name}</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="badge-brand text-[10px]">{room.subject}</span>
                                                <span className="text-[10px] text-slate-400">{room.participants?.length || 0} members</span>
                                            </div>
                                            {room.tags?.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                    {room.tags.map((tag, i) => (
                                                        <span key={i} className="badge-accent text-[10px]">{tag}</span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* Your Rooms Grid */}
                        {rooms.length > 0 && (
                            <>
                                <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-4">
                                    Your Rooms
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {rooms.map(room => (
                                        <div
                                            key={room._id}
                                            onClick={() => handleSelectRoom(room)}
                                            className="card p-5 cursor-pointer hover:border-brand-300 dark:hover:border-brand-700 transition-all hover:shadow-card-hover group"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <p className="font-display font-semibold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                                                        {room.name}
                                                    </p>
                                                    <span className="badge-brand text-[10px] mt-1">{room.subject}</span>
                                                </div>
                                                <span className="text-xs text-slate-400 dark:text-slate-500">
                                                    {room.participants?.length || 0} members
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-3 font-mono">
                                                Code: {room.code}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Right Panel */}
                <div className="hidden xl:block w-80 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-y-auto p-4 space-y-4">
                    <PomodoroTimer />
                    <FocusStats />
                    <Leaderboard />
                </div>
            </div>
        </div>
    );
}
