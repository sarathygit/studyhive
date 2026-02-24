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
    { id: 'chat', label: 'Chat' },
    { id: 'whiteboard', label: 'Whiteboard' },
    { id: 'notes', label: 'Notes' },
    { id: 'quiz', label: 'Quiz' },
    { id: 'summary', label: 'Summarizer' },
    { id: 'schedule', label: 'Schedule' },
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
            <div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <div className="w-10 h-10 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
            <Navbar />

            <div className="flex-1 flex overflow-hidden">
                {/* Room Info Sidebar */}
                <div className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col hidden lg:flex">
                    {/* Room Header */}
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                        <button onClick={() => navigate('/dashboard')} className="btn-ghost text-xs mb-3 w-full">
                            Back to Dashboard
                        </button>
                        <h2 className="font-display font-bold text-slate-900 dark:text-white text-lg">{room?.name}</h2>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="badge-brand text-[10px]">{room?.subject}</span>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                            <span className="text-xs text-slate-400 dark:text-slate-500 font-mono bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded">
                                {room?.code}
                            </span>
                            <button
                                onClick={() => navigator.clipboard.writeText(room?.code || '')}
                                className="text-xs text-brand-500 hover:text-brand-600"
                            >
                                Copy
                            </button>
                        </div>
                    </div>

                    {/* Online Users */}
                    <div className="p-4 flex-1 overflow-y-auto">
                        <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                            Online ({onlineUsers.length})
                        </h4>
                        <div className="space-y-2">
                            {onlineUsers.map((u, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <div className="relative">
                                        <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white font-semibold text-xs">
                                            {u.username?.[0]?.toUpperCase()}
                                        </div>
                                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-900" />
                                    </div>
                                    <span className="text-sm text-slate-700 dark:text-slate-300">{u.username}</span>
                                </div>
                            ))}
                            {onlineUsers.length === 0 && (
                                <p className="text-xs text-slate-400 dark:text-slate-500">No one else online</p>
                            )}
                        </div>

                        {/* All Participants */}
                        <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-6 mb-3">
                            All Members ({room?.participants?.length || 0})
                        </h4>
                        <div className="space-y-2">
                            {room?.participants?.map((p, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-semibold text-xs">
                                        {p.username?.[0]?.toUpperCase()}
                                    </div>
                                    <div>
                                        <span className="text-xs text-slate-600 dark:text-slate-400">{p.username}</span>
                                        {p._id === room?.creator?._id && (
                                            <span className="ml-1 text-[10px] text-brand-500 font-medium">Owner</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Tags */}
                    {room?.tags?.length > 0 && (
                        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                            <div className="flex flex-wrap gap-1">
                                {room.tags.map((tag, i) => (
                                    <span key={i} className="badge-accent text-[10px]">{tag}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Center Workspace */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Mobile Room Header */}
                    <div className="lg:hidden p-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <button onClick={() => navigate('/dashboard')} className="text-sm text-brand-500">Back</button>
                        <h2 className="font-display font-bold text-sm text-slate-900 dark:text-white">{room?.name}</h2>
                        <span className="text-xs text-slate-400">{onlineUsers.length} online</span>
                    </div>

                    {/* Tabs */}
                    <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                        <div className="flex overflow-x-auto scrollbar-none">
                            {TABS.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.id
                                        ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                                        : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="flex-1 overflow-hidden bg-white dark:bg-slate-900">
                        {activeTab === 'chat' && <Chat roomId={roomId} />}
                        {activeTab === 'whiteboard' && <Whiteboard roomId={roomId} />}
                        {activeTab === 'notes' && <NotesPanel roomId={roomId} />}
                        {activeTab === 'quiz' && <QuizGenerator roomId={roomId} />}
                        {activeTab === 'summary' && <DocSummarizer roomId={roomId} />}
                        {activeTab === 'schedule' && <Scheduler roomId={roomId} />}
                    </div>
                </div>

                {/* Right Panel */}
                <div className={`w-80 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-y-auto p-4 space-y-4 hidden xl:block`}>
                    <VoiceCall roomId={roomId} />
                    <PomodoroTimer roomId={roomId} />
                    <FocusStats />
                    <Leaderboard />
                </div>
            </div>
        </div>
    );
}
