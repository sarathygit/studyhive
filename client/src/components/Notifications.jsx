import { useSocket } from '../context/SocketContext';

export default function Notifications({ notifications }) {
    const { removeNotification } = useSocket();

    if (notifications.length === 0) return null;

    return (
        <div className="fixed top-20 right-4 z-[100] flex flex-col gap-2 min-w-[280px] max-w-sm">
            {notifications.map((notif) => (
                <div
                    key={notif.id}
                    className={`card-glass p-4 animate-slide-in-right flex items-start gap-3 ${notif.type === 'error' ? 'border-red-400/50' :
                            notif.type === 'success' ? 'border-green-400/50' :
                                'border-honey-400/50'
                        }`}
                >
                    <span className="text-lg flex-shrink-0">
                        {notif.type === 'error' ? '❌' : notif.type === 'success' ? '✅' : 'ℹ️'}
                    </span>
                    <p className="text-sm text-dark-700 dark:text-dark-200 flex-1">{notif.message}</p>
                    <button
                        onClick={() => removeNotification(notif.id)}
                        className="text-dark-400 hover:text-dark-600 dark:hover:text-dark-200 flex-shrink-0"
                    >
                        ✕
                    </button>
                </div>
            ))}
        </div>
    );
}
