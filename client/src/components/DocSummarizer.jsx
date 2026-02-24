import { useState, useRef, useCallback } from 'react';
import api from '../utils/api';

const SUPPORTED_TYPES = {
    'application/pdf': 'PDF',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PowerPoint',
    'text/plain': 'Text',
    'image/jpeg': 'Image',
    'image/png': 'Image'
};

const ACCEPT = '.pdf,.docx,.pptx,.txt,.jpg,.jpeg,.png';

export default function DocSummarizer({ roomId }) {
    const [file, setFile] = useState(null);
    const [dragOver, setDragOver] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [summary, setSummary] = useState('');
    const [filename, setFilename] = useState('');
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);
    const [shorterLoading, setShorterLoading] = useState(false);
    const fileInputRef = useRef(null);
    const [extractedText, setExtractedText] = useState('');

    const validateFile = (f) => {
        if (!SUPPORTED_TYPES[f.type]) {
            setError(`Unsupported file type. Supported: PDF, Word, PowerPoint, Text, Images (JPG/PNG)`);
            return false;
        }
        if (f.size > 10 * 1024 * 1024) {
            setError('File too large. Maximum size is 10MB.');
            return false;
        }
        return true;
    };

    const handleFile = (f) => {
        setError('');
        setSummary('');
        setExtractedText('');
        if (validateFile(f)) {
            setFile(f);
        }
    };

    const onDrop = useCallback((e) => {
        e.preventDefault();
        setDragOver(false);
        const f = e.dataTransfer.files[0];
        if (f) handleFile(f);
    }, []);

    const onDragOver = useCallback((e) => {
        e.preventDefault();
        setDragOver(true);
    }, []);

    const onDragLeave = useCallback(() => setDragOver(false), []);

    const onFileSelect = (e) => {
        const f = e.target.files[0];
        if (f) handleFile(f);
    };

    const handleSummarize = async () => {
        if (!file) return;
        setError('');
        setUploading(true);
        setProgress(0);

        const formData = new FormData();
        formData.append('document', file);

        try {
            const res = await api.post('/ai/summarize-doc', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (e) => {
                    const pct = Math.round((e.loaded * 100) / e.total);
                    setProgress(Math.min(pct, 90));
                }
            });

            setProgress(100);
            setSummary(res.data.summary);
            setFilename(res.data.filename);
            setExtractedText(res.data.summary);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to process document');
        } finally {
            setUploading(false);
        }
    };

    const handleShorter = async () => {
        if (!extractedText) return;
        setShorterLoading(true);
        try {
            const res = await api.post('/ai/summarize-shorter', { text: extractedText });
            setSummary(res.data.summary);
        } catch (err) {
            setError('Failed to generate shorter summary');
        } finally {
            setShorterLoading(false);
        }
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(summary);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            const ta = document.createElement('textarea');
            ta.value = summary;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleDownload = () => {
        const blob = new Blob([summary], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `summary-${filename || 'document'}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const removeFile = () => {
        setFile(null);
        setSummary('');
        setError('');
        setExtractedText('');
        setProgress(0);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const getFileLabel = (type) => {
        if (type?.includes('pdf')) return 'PDF';
        if (type?.includes('word')) return 'DOC';
        if (type?.includes('presentation')) return 'PPT';
        if (type?.includes('image')) return 'IMG';
        return 'FILE';
    };

    const formatSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
        <div className="p-4 space-y-4 overflow-y-auto h-full">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
                    Document Summarizer
                </h3>
                {summary && (
                    <button onClick={removeFile} className="text-xs text-slate-400 hover:text-red-500 transition-colors">
                        Clear
                    </button>
                )}
            </div>

            <p className="text-sm text-slate-500 dark:text-slate-400">
                Upload your study materials and get a clear, structured summary.
            </p>

            {/* Upload Zone */}
            {!summary && (
                <div
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onClick={() => !uploading && fileInputRef.current?.click()}
                    className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${dragOver
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/10 scale-[1.01]'
                        : file
                            ? 'border-green-400 bg-green-50 dark:bg-green-900/10'
                            : 'border-slate-200 dark:border-slate-700 hover:border-brand-400 hover:bg-brand-50/50 dark:hover:bg-slate-800/50'
                        }`}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept={ACCEPT}
                        onChange={onFileSelect}
                        className="hidden"
                    />

                    {!file ? (
                        <>
                            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                                </svg>
                            </div>
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                Drag & drop your file here
                            </p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                                or click to browse
                            </p>
                            <div className="flex flex-wrap justify-center gap-1.5 mt-4">
                                {['PDF', 'Word', 'PPT', 'TXT', 'JPG', 'PNG'].map(t => (
                                    <span key={t} className="px-2 py-0.5 text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full">
                                        {t}
                                    </span>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center gap-3 text-left" onClick={(e) => e.stopPropagation()}>
                            <span className="font-mono text-xs bg-brand-100 dark:bg-brand-800/30 px-2.5 py-1.5 rounded-lg text-brand-600 dark:text-brand-400 font-semibold">{getFileLabel(file.type)}</span>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                                    {file.name}
                                </p>
                                <p className="text-xs text-slate-400">
                                    {SUPPORTED_TYPES[file.type]} · {formatSize(file.size)}
                                </p>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); removeFile(); }}
                                className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Upload Progress */}
            {uploading && (
                <div className="space-y-2 animate-slide-up">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-2">
                            <div className="w-3.5 h-3.5 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
                            {progress < 90 ? 'Uploading...' : 'Analyzing & summarizing...'}
                        </span>
                        <span>{progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-brand-500 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Summarize Button */}
            {file && !summary && !uploading && (
                <button
                    onClick={handleSummarize}
                    className="btn-primary w-full flex items-center justify-center gap-2 py-3"
                >
                    Summarize Document
                </button>
            )}

            {/* Error */}
            {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm animate-slide-up">
                    {error}
                </div>
            )}

            {/* Summary Output */}
            {summary && (
                <div className="space-y-3 animate-slide-up">
                    {/* File info badge */}
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-xs bg-brand-100 dark:bg-brand-800/30 px-2 py-1 rounded text-brand-600 dark:text-brand-400 font-semibold">{getFileLabel(file?.type)}</span>
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-300 truncate">
                            {filename}
                        </span>
                        <span className="px-2 py-0.5 text-[10px] bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full font-medium">
                            Summarized
                        </span>
                    </div>

                    {/* Summary Card */}
                    <div className="card p-5 border border-slate-200 dark:border-slate-700">
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                            <div className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200 leading-relaxed space-y-1">
                                {summary.split('\n').map((line, i) => {
                                    if (line.startsWith('**') && line.endsWith('**')) {
                                        return <h4 key={i} className="text-sm font-bold text-slate-900 dark:text-white mt-3 mb-1">{line.replace(/\*\*/g, '')}</h4>;
                                    }
                                    if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) {
                                        const formatted = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
                                        return (
                                            <div key={i} className="flex gap-2 pl-1">
                                                <span className="text-brand-500 mt-0.5 flex-shrink-0">·</span>
                                                <span dangerouslySetInnerHTML={{ __html: formatted.replace(/^[•\-*]\s*/, '') }} />
                                            </div>
                                        );
                                    }
                                    if (line.trim() === '') return <div key={i} className="h-2" />;
                                    return <p key={i}>{line}</p>;
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={handleCopy}
                            className="flex-1 min-w-[100px] px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-1.5"
                        >
                            {copied ? 'Copied!' : 'Copy'}
                        </button>
                        <button
                            onClick={handleDownload}
                            className="flex-1 min-w-[100px] px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-1.5"
                        >
                            Download
                        </button>
                        <button
                            onClick={handleShorter}
                            disabled={shorterLoading}
                            className="flex-1 min-w-[100px] px-3 py-2 text-xs font-medium rounded-xl bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-900/30 transition-all flex items-center justify-center gap-1.5"
                        >
                            {shorterLoading ? (
                                <>
                                    <div className="w-3 h-3 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
                                    Working...
                                </>
                            ) : 'Shorter'}
                        </button>
                    </div>

                    {/* New Document */}
                    <button
                        onClick={removeFile}
                        className="w-full text-xs text-slate-400 hover:text-brand-500 transition-colors py-2"
                    >
                        + Upload another document
                    </button>
                </div>
            )}
        </div>
    );
}
