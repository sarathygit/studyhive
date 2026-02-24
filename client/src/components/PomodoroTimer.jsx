import { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function PomodoroTimer({ roomId }) {
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isRunning, setIsRunning] = useState(false);
    const [mode, setMode] = useState('focus'); // focus, break
    const [sessions, setSessions] = useState(0);
    const intervalRef = useRef(null);
    const { socket, addNotification } = useSocket();
    const { user, updateUser } = useAuth();

    const FOCUS_TIME = 25 * 60;
    const BREAK_TIME = 5 * 60;

    useEffect(() => {
        if (!socket) return;

        socket.on('timerSync', (timerState) => {
            setTimeLeft(timerState.timeLeft);
            setIsRunning(timerState.isRunning);
            setMode(timerState.mode);
        });

        return () => socket.off('timerSync');
    }, [socket]);

    useEffect(() => {
        if (isRunning) {
            intervalRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        handleTimerComplete();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            clearInterval(intervalRef.current);
        }

        return () => clearInterval(intervalRef.current);
    }, [isRunning, mode]);

    const handleTimerComplete = useCallback(async () => {
        setIsRunning(false);
        clearInterval(intervalRef.current);

        if (mode === 'focus') {
            setSessions(prev => prev + 1);
            addNotification({ type: 'success', message: '🎉 Focus session complete! Take a break.' });

            // Record focus session
            try {
                const res = await api.post('/focus', { duration: 25, roomId, completed: true });
                if (res.data.user) updateUser(res.data.user);
            } catch (err) {
                console.error('Failed to save focus session');
            }

            setMode('break');
            setTimeLeft(BREAK_TIME);
        } else {
            addNotification({ type: 'info', message: '⏰ Break is over! Ready to focus?' });
            setMode('focus');
            setTimeLeft(FOCUS_TIME);
        }
    }, [mode, roomId]);

    const handleStart = () => {
        setIsRunning(true);
        if (socket) {
            socket.emit('timerStart', { roomId, timerState: { timeLeft, isRunning: true, mode } });
        }
    };

    const handlePause = () => {
        setIsRunning(false);
        if (socket) {
            socket.emit('timerPause', { roomId, timerState: { timeLeft, isRunning: false, mode } });
        }
    };

    const handleReset = () => {
        setIsRunning(false);
        clearInterval(intervalRef.current);
        const newTime = mode === 'focus' ? FOCUS_TIME : BREAK_TIME;
        setTimeLeft(newTime);
        if (socket) {
            socket.emit('timerReset', { roomId, timerState: { timeLeft: newTime, isRunning: false, mode } });
        }
    };

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const progress = mode === 'focus'
        ? ((FOCUS_TIME - timeLeft) / FOCUS_TIME) * 100
        : ((BREAK_TIME - timeLeft) / BREAK_TIME) * 100;

    return (
        <div className="card p-5">
            <h3 className="text-sm font-display font-bold text-dark-700 dark:text-dark-300 mb-4 flex items-center gap-2">
                ⏱️ Pomodoro Timer
                <span className={`badge text-[10px] ${mode === 'focus' ? 'badge-honey' : 'badge-hive'}`}>
                    {mode === 'focus' ? '🎯 Focus' : '☕ Break'}
                </span>
            </h3>

            {/* Timer Display */}
            <div className="relative w-40 h-40 mx-auto mb-5">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="4"
                        className="text-dark-100 dark:text-dark-800" />
                    <circle cx="50" cy="50" r="45" fill="none" strokeWidth="4" strokeLinecap="round"
                        strokeDasharray={`${progress * 2.827} ${283 - progress * 2.827}`}
                        className={mode === 'focus' ? 'text-honey-500' : 'text-hive-500'}
                        style={{ transition: 'stroke-dasharray 0.5s ease' }} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-display font-bold text-dark-900 dark:text-white">
                        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                    </span>
                    <span className="text-xs text-dark-500 dark:text-dark-400 mt-1">
                        Session #{sessions + 1}
                    </span>
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-2">
                {!isRunning ? (
                    <button onClick={handleStart} className="btn-primary text-sm px-6">
                        ▶ Start
                    </button>
                ) : (
                    <button onClick={handlePause} className="btn-secondary text-sm px-6">
                        ⏸ Pause
                    </button>
                )}
                <button onClick={handleReset} className="btn-ghost text-sm">
                    ↻ Reset
                </button>
            </div>

            {sessions > 0 && (
                <p className="text-center text-xs text-dark-500 dark:text-dark-400 mt-3">
                    ✅ {sessions} session{sessions > 1 ? 's' : ''} completed today
                </p>
            )}
        </div>
    );
}
