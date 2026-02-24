import { useState } from 'react';
import api from '../utils/api';

export default function Sidebar({ rooms, activeRoom, onSelectRoom, onRoomCreated }) {
    const [showCreate, setShowCreate] = useState(false);
    const [showJoin, setShowJoin] = useState(false);
    const [createForm, setCreateForm] = useState({ name: '', subject: '', tags: '' });
    const [joinCode, setJoinCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleCreate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await api.post('/rooms', {
                name: createForm.name,
                subject: createForm.subject,
                tags: createForm.tags.split(',').map(t => t.trim()).filter(Boolean)
            });
            onRoomCreated(res.data);
            setShowCreate(false);
            setCreateForm({ name: '', subject: '', tags: '' });
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create room');
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await api.post('/rooms/join', { code: joinCode });
            onRoomCreated(res.data);
            setShowJoin(false);
            setJoinCode('');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to join room');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-72 bg-white dark:bg-dark-900 border-r border-dark-100 dark:border-dark-800 flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-dark-100 dark:border-dark-800">
                <h2 className="text-lg font-display font-bold text-dark-900 dark:text-white flex items-center gap-2">
                    📚 Study Rooms
                </h2>
                <div className="flex gap-2 mt-3">
                    <button onClick={() => { setShowCreate(true); setShowJoin(false); }} className="btn-primary text-xs flex-1 py-2">
                        + Create
                    </button>
                    <button onClick={() => { setShowJoin(true); setShowCreate(false); }} className="btn-secondary text-xs flex-1 py-2">
                        🔗 Join
                    </button>
                </div>
            </div>

            {/* Create Modal */}
            {showCreate && (
                <div className="p-4 border-b border-dark-100 dark:border-dark-800 bg-honey-50/50 dark:bg-honey-900/10 animate-slide-up">
                    <form onSubmit={handleCreate} className="space-y-3">
                        <input
                            type="text"
                            placeholder="Room name"
                            value={createForm.name}
                            onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                            className="input-field text-sm py-2"
                            required
                        />
                        <input
                            type="text"
                            placeholder="Subject (e.g., Physics)"
                            value={createForm.subject}
                            onChange={(e) => setCreateForm({ ...createForm, subject: e.target.value })}
                            className="input-field text-sm py-2"
                            required
                        />
                        <input
                            type="text"
                            placeholder="Tags (comma separated)"
                            value={createForm.tags}
                            onChange={(e) => setCreateForm({ ...createForm, tags: e.target.value })}
                            className="input-field text-sm py-2"
                        />
                        {error && <p className="text-red-500 text-xs">{error}</p>}
                        <div className="flex gap-2">
                            <button type="submit" disabled={loading} className="btn-primary text-xs flex-1 py-2">
                                {loading ? '...' : 'Create'}
                            </button>
                            <button type="button" onClick={() => setShowCreate(false)} className="btn-ghost text-xs">
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Join Modal */}
            {showJoin && (
                <div className="p-4 border-b border-dark-100 dark:border-dark-800 bg-hive-50/50 dark:bg-hive-900/10 animate-slide-up">
                    <form onSubmit={handleJoin} className="space-y-3">
                        <input
                            type="text"
                            placeholder="Enter room code"
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                            className="input-field text-sm py-2 font-mono tracking-wider text-center"
                            required
                            maxLength={8}
                        />
                        {error && <p className="text-red-500 text-xs">{error}</p>}
                        <div className="flex gap-2">
                            <button type="submit" disabled={loading} className="btn-primary text-xs flex-1 py-2">
                                {loading ? '...' : 'Join Room'}
                            </button>
                            <button type="button" onClick={() => setShowJoin(false)} className="btn-ghost text-xs">
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Room List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
                {rooms.length === 0 ? (
                    <div className="text-center py-10 text-dark-400 dark:text-dark-500">
                        <div className="text-4xl mb-3">🏠</div>
                        <p className="text-sm">No rooms yet</p>
                        <p className="text-xs mt-1">Create or join a room to start studying</p>
                    </div>
                ) : (
                    rooms.map(room => (
                        <button
                            key={room._id}
                            onClick={() => onSelectRoom(room)}
                            className={`w-full text-left ${activeRoom?._id === room._id ? 'sidebar-item-active' : 'sidebar-item'}`}
                        >
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{room.name}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="badge-honey text-[10px]">{room.subject}</span>
                                    <span className="text-[10px] text-dark-400 dark:text-dark-500">
                                        {room.participants?.length || 0} members
                                    </span>
                                </div>
                            </div>
                        </button>
                    ))
                )}
            </div>
        </div>
    );
}
