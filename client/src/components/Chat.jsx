import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function Chat({ roomId }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(true);
    const { socket } = useSocket();
    const { user } = useAuth();
    const bottomRef = useRef(null);
    const chatRef = useRef(null);

    useEffect(() => {
        fetchMessages();
    }, [roomId]);

    useEffect(() => {
        if (!socket) return;

        socket.on('newMessage', (message) => {
            setMessages(prev => [...prev, message]);
        });

        return () => {
            socket.off('newMessage');
        };
    }, [socket]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchMessages = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/messages/${roomId}`);
            setMessages(res.data.messages);
        } catch (err) {
            console.error('Failed to fetch messages');
        } finally {
            setLoading(false);
        }
    };

    const scrollToBottom = () => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSend = (e) => {
        e.preventDefault();
        if (!input.trim() || !socket) return;

        socket.emit('sendMessage', {
            roomId,
            content: input.trim(),
            sender: user
        });
        setInput('');
    };

    const formatTime = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const isOwnMessage = (msg) => msg.sender?._id === user?._id;

    const shouldShowSender = (messages, index) => {
        if (index === 0) return true;
        const prev = messages[index - 1];
        const curr = messages[index];
        if (prev.sender?._id !== curr.sender?._id) return true;
        const timeDiff = new Date(curr.timestamp) - new Date(prev.timestamp);
        return timeDiff > 300000;
    };

    return (
        <div className="flex flex-col h-full">
            {/* Messages */}
            <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-1">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="w-8 h-8 border-3 border-brand-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500">
                        <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-3">
                            <span className="text-slate-400 text-sm">Chat</span>
                        </div>
                        <p className="text-sm">No messages yet</p>
                        <p className="text-xs mt-1">Start the conversation!</p>
                    </div>
                ) : (
                    messages.map((msg, i) => (
                        <div key={msg._id || i} className={`animate-fade-in ${isOwnMessage(msg) ? 'flex justify-end' : ''}`}>
                            {shouldShowSender(messages, i) && !isOwnMessage(msg) && (
                                <div className="flex items-center gap-2 mb-1 mt-3">
                                    <div className="w-6 h-6 rounded-full bg-brand-600 flex items-center justify-center text-white text-[10px] font-semibold">
                                        {msg.sender?.username?.[0]?.toUpperCase()}
                                    </div>
                                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                        {msg.sender?.username}
                                    </span>
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                        {formatTime(msg.timestamp)}
                                    </span>
                                </div>
                            )}
                            <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${isOwnMessage(msg)
                                ? 'bg-brand-600 text-white rounded-br-md'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-md ml-8'
                                }`}>
                                {msg.content}
                                {isOwnMessage(msg) && (
                                    <span className="text-[10px] opacity-70 ml-2">{formatTime(msg.timestamp)}</span>
                                )}
                            </div>
                        </div>
                    ))
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type a message..."
                        className="input-field flex-1 py-2.5"
                    />
                    <button type="submit" className="btn-primary px-6" disabled={!input.trim()}>
                        Send
                    </button>
                </div>
            </form>
        </div>
    );
}
