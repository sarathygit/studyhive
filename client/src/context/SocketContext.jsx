import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            const serverUrl = import.meta.env.VITE_API_URL || window.location.origin;
            const newSocket = io(serverUrl, {
                transports: ['websocket', 'polling']
            });

            newSocket.on('connect', () => {
                console.log('Socket connected:', newSocket.id);
            });

            newSocket.on('roomUsers', (users) => {
                setOnlineUsers(users);
            });

            newSocket.on('userJoined', ({ username, message }) => {
                addNotification({ type: 'info', message, id: Date.now() });
            });

            newSocket.on('userLeft', ({ username, message }) => {
                addNotification({ type: 'info', message, id: Date.now() });
            });

            setSocket(newSocket);

            return () => {
                newSocket.disconnect();
            };
        }
    }, [user]);

    const addNotification = (notification) => {
        const id = notification.id || Date.now();
        setNotifications(prev => [...prev, { ...notification, id }]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 5000);
    };

    const removeNotification = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const joinRoom = (roomId) => {
        if (socket && user) {
            socket.emit('joinRoom', { roomId, user });
        }
    };

    const leaveRoom = (roomId) => {
        if (socket) {
            socket.emit('leaveRoom', { roomId });
            setOnlineUsers([]);
        }
    };

    return (
        <SocketContext.Provider value={{
            socket, onlineUsers, notifications,
            joinRoom, leaveRoom, addNotification, removeNotification
        }}>
            {children}
        </SocketContext.Provider>
    );
}

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) throw new Error('useSocket must be used within SocketProvider');
    return context;
};
