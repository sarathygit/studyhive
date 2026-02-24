import { useState } from 'react';
import api from '../utils/api';

export default function ChatSummary({ roomId, messages }) {
    const [summary, setSummary] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSummarize = async () => {
        if (!messages || messages.length === 0) {
            setError('No messages to summarize');
            return;
        }
        setError('');
        setLoading(true);

        try {
            const formatted = messages.map(m => ({
                sender: m.sender?.username || 'Unknown',
                content: m.content
            }));
            const res = await api.post('/ai/summary', { messages: formatted });
            setSummary(res.data.summary);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to generate summary');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 space-y-4 overflow-y-auto h-full">
            <h3 className="text-lg font-display font-bold text-dark-900 dark:text-white flex items-center gap-2">
                📋 Chat Summary
            </h3>

            <p className="text-sm text-dark-500 dark:text-dark-400">
                Generate a summary of the room discussion in bullet points.
            </p>

            <button
                onClick={handleSummarize}
                disabled={loading}
                className="btn-primary flex items-center gap-2"
            >
                {loading ? (
                    <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Summarizing...
                    </>
                ) : '✨ Summarize Chat'}
            </button>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            {summary && (
                <div className="card p-4 animate-slide-up">
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                        <div className="whitespace-pre-wrap text-sm text-dark-700 dark:text-dark-200 leading-relaxed">
                            {summary}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
