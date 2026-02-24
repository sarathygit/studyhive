import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import Chat from '../components/Chat';
import Whiteboard from '../components/Whiteboard';
import PomodoroTimer from '../components/PomodoroTimer';
import FocusStats from '../components/FocusStats';
import Leaderboard from '../components/Leaderboard';
import QuizGenerator from '../components/QuizGenerator';
import DocSummarizer from '../components/DocSummarizer';
import NotesPanel from '../components/NotesPanel';
import Scheduler from '../components/Scheduler';
import VoiceCall from '../components/VoiceCall';

const TABS = [
    { id: 'chat', label: '💬 Chat', icon: '💬' },
    { id: 'whiteboard', label: '🎨 Whiteboard', icon: '🎨' },
    { id: 'notes', label: '📒 Notes', icon: '📒' },
    { id: 'quiz', label: '🧠 Quiz', icon: '🧠' },
    { id: 'summary', label: '📄 Summarizer', icon: '📄' },
    { id: 'schedule', label: '📅 Schedule', icon: '📅' },
];

export default function Room() {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const { socket, joinRoom, leaveRoom, onlineUsers } = useSocket();
    const { user } = useAuth();
    const [room, setRoom] = useState(null);
    const [activeTab, setActiveTab] = useState('chat');
    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState([]);
    const [showRightPanel, setShowRightPanel] = useState(true);

    useEffect(() => {
        fetchRoom();
        return () => {
            if (roomId) leaveRoom(roomId);
        };
    }, [roomId]);

    useEffect(() => {
        if (room && socket) {
            joinRoom(roomId);
        }
    }, [room, socket]);

    useEffect(() => {
        if (!socket) return;
        const handleMsg = (message) => {
            setMessages(prev => [...prev, message]);
        };
        socket.on('newMessage', handleMsg);
        return () => socket.off('newMessage', handleMsg);
    }, [socket]);

    useEffect(() => {
        fetchMessages();
    }, [roomId]);

    const fetchRoom = async () => {
        try {
            const res = await api.get(`/rooms/${roomId}`);
            setRoom(res.data);
        } catch (err) {
            navigate('/dashboard');
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async () => {
        try {
            const res = await api.get(`/messages/${roomId}`);
            setMessages(res.data.messages);
        } catch (err) {
            console.error('Failed to fetch messages');
        }
    };

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-950">
                <div className="w-12 h-12 border-4 border-honey-400 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-gray-50 dark:bg-dark-950">
            <Navbar />

            <div className="flex-1 flex overflow-hidden">
                {/* Room Info Sidebar */}
                <div className="w-64 bg-white dark:bg-dark-900 border-r border-dark-100 dark:border-dark-800 flex flex-col hidden lg:flex">
                    {/* Room Header */}
                    <div className="p-4 border-b border-dark-100 dark:border-dark-800">
                        <button onClick={() => navigate('/dashboard')} className="btn-ghost text-xs mb-3 w-full">
                            ← Back to Dashboard
                        </button>
                        <h2 className="font-display font-bold text-dark-900 dark:text-white text-lg">{room?.name}</h2>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="badge-honey text-[10px]">{room?.subject}</span>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                            <span className="text-xs text-dark-400 dark:text-dark-500 font-mono bg-dark-50 dark:bg-dark-800 px-2 py-1 rounded">
                                {room?.code}
                            </span>
                            <button
                                onClick={() => navigator.clipboard.writeText(room?.code || '')}
                                className="text-xs text-hive-500 hover:text-hive-600"
                            >
                                📋 Copy
                            </button>
                        </div>
                    </div>

                    {/* Online Users */}
                    <div className="p-4 flex-1 overflow-y-auto">
                        <h4 className="text-xs font-bold text-dark-500 dark:text-dark-400 uppercase tracking-wider mb-3">
                            Online ({onlineUsers.length})
                        </h4>
                        <div className="space-y-2">
                            {onlineUsers.map((u, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <div className="relative">
                                        <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center text-white font-bold text-xs">
                                            {u.username?.[0]?.toUpperCase()}
                                        </div>
                                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-dark-900" />
                                    </div>
                                    <span className="text-sm text-dark-700 dark:text-dark-300">{u.username}</span>
                                </div>
                            ))}
                            {onlineUsers.length === 0 && (
                                <p className="text-xs text-dark-400 dark:text-dark-500">No one else online</p>
                            )}
                        </div>

                        {/* All Participants */}
                        <h4 className="text-xs font-bold text-dark-500 dark:text-dark-400 uppercase tracking-wider mt-6 mb-3">
                            All Members ({room?.participants?.length || 0})
                        </h4>
                        <div className="space-y-2">
                            {room?.participants?.map((p, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full bg-dark-200 dark:bg-dark-700 flex items-center justify-center text-dark-600 dark:text-dark-300 font-bold text-xs">
                                        {p.username?.[0]?.toUpperCase()}
                                    </div>
                                    <div>
                                        <span className="text-xs text-dark-600 dark:text-dark-400">{p.username}</span>
                                        {p._id === room?.creator?._id && (
                                            <span className="ml-1 text-[10px] text-honey-500">👑</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Tags */}
                    {room?.tags?.length > 0 && (
                        <div className="p-4 border-t border-dark-100 dark:border-dark-800">
                            <div className="flex flex-wrap gap-1">
                                {room.tags.map((tag, i) => (
                                    <span key={i} className="badge-hive text-[10px]">{tag}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Center Workspace */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Mobile Room Header */}
                    <div className="lg:hidden p-3 bg-white dark:bg-dark-900 border-b border-dark-100 dark:border-dark-800 flex items-center justify-between">
                        <button onClick={() => navigate('/dashboard')} className="text-sm text-hive-500">← Back</button>
                        <h2 className="font-display font-bold text-sm text-dark-900 dark:text-white">{room?.name}</h2>
                        <span className="text-xs text-dark-400">{onlineUsers.length} online</span>
                    </div>

                    {/* Tabs */}
                    <div className="border-b border-dark-100 dark:border-dark-800 bg-white dark:bg-dark-900">
                        <div className="flex overflow-x-auto scrollbar-none">
                            {TABS.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.id
                                        ? 'border-honey-500 text-honey-600 dark:text-honey-400'
                                        : 'border-transparent text-dark-500 dark:text-dark-400 hover:text-dark-700 dark:hover:text-dark-200'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="flex-1 overflow-hidden bg-white dark:bg-dark-900">
                        {activeTab === 'chat' && <Chat roomId={roomId} />}
                        {activeTab === 'whiteboard' && <Whiteboard roomId={roomId} />}
                        {activeTab === 'notes' && <NotesPanel roomId={roomId} />}
                        {activeTab === 'quiz' && <QuizGenerator roomId={roomId} />}
                        {activeTab === 'summary' && <DocSummarizer roomId={roomId} />}
                        {activeTab === 'schedule' && <Scheduler roomId={roomId} />}
                    </div>
                </div>

                {/* Right Panel */}
                <div className={`w-80 border-l border-dark-100 dark:border-dark-800 bg-white dark:bg-dark-900 overflow-y-auto p-4 space-y-4 hidden xl:block`}>
                    <VoiceCall roomId={roomId} />
                    <PomodoroTimer roomId={roomId} />
                    <FocusStats />
                    <Leaderboard />
                </div>
            </div>
        </div>
    );
}
