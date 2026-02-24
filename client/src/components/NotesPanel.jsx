import { useState, useEffect } from 'react';
import api from '../utils/api';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function NotesPanel({ roomId }) {
    const [notes, setNotes] = useState([]);
    const [showUpload, setShowUpload] = useState(false);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchNotes();
    }, [roomId]);

    const fetchNotes = async () => {
        try {
            const res = await api.get(`/notes/${roomId}`);
            setNotes(res.data);
        } catch (err) {
            console.error('Failed to fetch notes');
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('content', content);
            formData.append('roomId', roomId);
            if (file) formData.append('file', file);

            const res = await api.post('/notes', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setNotes(prev => [res.data, ...prev]);
            setShowUpload(false);
            setTitle('');
            setContent('');
            setFile(null);
        } catch (err) {
            console.error('Failed to upload note');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/notes/${id}`);
            setNotes(prev => prev.filter(n => n._id !== id));
        } catch (err) {
            console.error('Failed to delete note');
        }
    };

    const getFileIcon = (type) => {
        if (type?.includes('pdf')) return '📄';
        if (type?.includes('image')) return '🖼️';
        if (type?.includes('word') || type?.includes('document')) return '📝';
        return '📎';
    };

    // Build the full file download URL pointing to the backend server
    const getFileUrl = (fileUrl) => {
        if (!fileUrl) return '#';
        // If already a full URL, return as-is
        if (fileUrl.startsWith('http')) return fileUrl;
        // Prepend the backend base URL
        return `${API_BASE}${fileUrl}`;
    };

    return (
        <div className="p-4 space-y-4 overflow-y-auto h-full">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-display font-bold text-dark-900 dark:text-white flex items-center gap-2">
                    📒 Notes & Files
                </h3>
                <button onClick={() => setShowUpload(!showUpload)} className="btn-primary text-xs">
                    + Add Note
                </button>
            </div>

            {/* Upload Form */}
            {showUpload && (
                <form onSubmit={handleUpload} className="card p-4 space-y-3 animate-slide-up">
                    <input
                        type="text"
                        placeholder="Note title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="input-field text-sm"
                        required
                    />
                    <textarea
                        placeholder="Write your notes here (optional)..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="input-field text-sm min-h-[80px] resize-y"
                    />
                    <div>
                        <label className="block text-xs font-medium text-dark-500 dark:text-dark-400 mb-1">
                            Attach file (optional)
                        </label>
                        <input
                            type="file"
                            onChange={(e) => setFile(e.target.files[0])}
                            className="text-sm text-dark-500 dark:text-dark-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-honey-50 dark:file:bg-honey-900/20 file:text-honey-600 dark:file:text-honey-400 hover:file:bg-honey-100"
                            accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button type="submit" disabled={uploading} className="btn-primary text-sm">
                            {uploading ? 'Uploading...' : '📤 Upload'}
                        </button>
                        <button type="button" onClick={() => setShowUpload(false)} className="btn-ghost text-sm">
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            {/* Notes List */}
            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="animate-pulse card p-4">
                            <div className="h-4 bg-dark-200 dark:bg-dark-700 rounded w-3/4 mb-2" />
                            <div className="h-3 bg-dark-200 dark:bg-dark-700 rounded w-1/2" />
                        </div>
                    ))}
                </div>
            ) : notes.length === 0 ? (
                <div className="text-center py-8 text-dark-400 dark:text-dark-500">
                    <span className="text-4xl">📒</span>
                    <p className="text-sm mt-2">No notes shared yet</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {notes.map(note => (
                        <div key={note._id} className="card p-4 animate-fade-in">
                            <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm text-dark-900 dark:text-white">{note.title}</p>
                                    <p className="text-xs text-dark-500 dark:text-dark-400 mt-1">
                                        by {note.user?.username} · {new Date(note.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleDelete(note._id)}
                                    className="text-dark-400 hover:text-red-500 text-xs ml-2"
                                >
                                    🗑
                                </button>
                            </div>
                            {note.content && (
                                <p className="text-sm text-dark-600 dark:text-dark-300 mt-2 line-clamp-3">{note.content}</p>
                            )}
                            {note.fileUrl && (
                                <a
                                    href={getFileUrl(note.fileUrl)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 bg-hive-50 dark:bg-hive-900/20 rounded-lg text-xs font-medium text-hive-600 dark:text-hive-400 hover:bg-hive-100 dark:hover:bg-hive-900/30 transition-colors"
                                >
                                    {getFileIcon(note.fileType)} {note.fileName || 'Download File'}
                                </a>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
