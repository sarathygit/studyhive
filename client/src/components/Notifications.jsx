import { useSocket } from '../context/SocketContext';

export default function Notifications({ notifications }) {
    const { removeNotification } = useSocket();

    if (notifications.length === 0) return null;

    return (
        <div className="fixed top-16 right-4 z-[100] flex flex-col gap-2 min-w-[280px] max-w-sm">
            {notifications.map((notif) => (
                <div
                    key={notif.id}
                    className={`card-glass p-4 animate-slide-in-right flex items-start gap-3 ${notif.type === 'error' ? 'border-red-400/50' :
                        notif.type === 'success' ? 'border-green-400/50' :
                            'border-brand-400/50'
                        }`}
                >
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${notif.type === 'error' ? 'bg-red-500' : notif.type === 'success' ? 'bg-green-500' : 'bg-brand-500'}`} />
                    <p className="text-sm text-slate-700 dark:text-slate-200 flex-1">{notif.message}</p>
                    <button
                        onClick={() => removeNotification(notif.id)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex-shrink-0 text-xs"
                    >
                        ✕
                    </button>
                </div>
            ))}
        </div>
    );
}
