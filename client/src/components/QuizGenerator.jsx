import { useState, useRef } from 'react';
import api from '../utils/api';

const ACCEPT_TYPES = '.pdf,.docx,.pptx,.txt,.jpg,.jpeg,.png';

export default function QuizGenerator({ roomId }) {
    const [notes, setNotes] = useState('');
    const [quiz, setQuiz] = useState([]);
    const [answers, setAnswers] = useState({});
    const [showResults, setShowResults] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [inputMode, setInputMode] = useState('text');
    const [file, setFile] = useState(null);
    const [extracting, setExtracting] = useState(false);
    const fileInputRef = useRef(null);

    const handleGenerate = async () => {
        if (notes.trim().length < 20) {
            setError('Please provide at least 20 characters of notes');
            return;
        }
        setError('');
        setLoading(true);
        setQuiz([]);
        setAnswers({});
        setShowResults(false);

        try {
            const res = await api.post('/ai/quiz', { notes });
            setQuiz(res.data.quiz);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to generate quiz');
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async () => {
        if (!file) return;
        setError('');
        setExtracting(true);

        try {
            const formData = new FormData();
            formData.append('document', file);
            const res = await api.post('/ai/summarize-doc', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (res.data.summary) {
                setNotes(res.data.summary);
                setInputMode('text');
            } else {
                setError('Could not extract text from the file');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to extract text from file');
        } finally {
            setExtracting(false);
        }
    };

    const handleAnswer = (qIndex, aIndex) => {
        if (showResults) return;
        setAnswers(prev => ({ ...prev, [qIndex]: aIndex }));
    };

    const handleSubmit = () => {
        setShowResults(true);
    };

    const getScore = () => {
        let correct = 0;
        quiz.forEach((q, i) => {
            if (answers[i] === q.correctAnswer) correct++;
        });
        return correct;
    };

    const resetQuiz = () => {
        setQuiz([]);
        setAnswers({});
        setShowResults(false);
        setNotes('');
        setFile(null);
        setInputMode('text');
    };

    return (
        <div className="p-4 space-y-4 overflow-y-auto h-full">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
                AI Quiz Generator
            </h3>

            {quiz.length === 0 ? (
                <>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Paste notes or upload a file — AI will generate 5 multiple choice questions.
                    </p>

                    {/* Input Mode Toggle */}
                    <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 gap-1">
                        <button
                            onClick={() => setInputMode('text')}
                            className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${inputMode === 'text'
                                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                }`}
                        >
                            Paste Text
                        </button>
                        <button
                            onClick={() => setInputMode('file')}
                            className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${inputMode === 'file'
                                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                }`}
                        >
                            Upload File
                        </button>
                    </div>

                    {inputMode === 'text' ? (
                        <>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Paste your study notes here..."
                                className="input-field min-h-[150px] resize-y"
                            />
                            {error && <p className="text-red-500 text-sm">{error}</p>}
                            <button
                                onClick={handleGenerate}
                                disabled={loading}
                                className="btn-primary flex items-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Generating...
                                    </>
                                ) : 'Generate Quiz'}
                            </button>
                        </>
                    ) : (
                        <>
                            <div
                                onClick={() => !extracting && fileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 ${file
                                        ? 'border-green-400 bg-green-50 dark:bg-green-900/10'
                                        : 'border-slate-200 dark:border-slate-700 hover:border-brand-400 hover:bg-brand-50/50 dark:hover:bg-slate-800/50'
                                    }`}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept={ACCEPT_TYPES}
                                    onChange={(e) => setFile(e.target.files[0])}
                                    className="hidden"
                                />
                                {!file ? (
                                    <>
                                        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center mx-auto mb-2">
                                            <span className="text-slate-400 text-sm">+</span>
                                        </div>
                                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                            Click to upload a file
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1">
                                            PDF, Word, PPT, Text, or Image
                                        </p>
                                    </>
                                ) : (
                                    <div className="flex items-center gap-3 justify-center" onClick={e => e.stopPropagation()}>
                                        <span className="font-mono text-xs bg-brand-100 dark:bg-brand-800/30 px-2 py-1 rounded text-brand-600 dark:text-brand-400">FILE</span>
                                        <div className="text-left">
                                            <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate max-w-[200px]">
                                                {file.name}
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                {(file.size / 1024).toFixed(1)} KB
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                                            className="text-slate-400 hover:text-red-500"
                                        >✕</button>
                                    </div>
                                )}
                            </div>

                            {error && <p className="text-red-500 text-sm">{error}</p>}

                            {file && (
                                <button
                                    onClick={handleFileUpload}
                                    disabled={extracting}
                                    className="btn-primary w-full flex items-center justify-center gap-2"
                                >
                                    {extracting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Extracting text...
                                        </>
                                    ) : 'Extract & Generate Quiz'}
                                </button>
                            )}
                        </>
                    )}
                </>
            ) : (
                <>
                    {showResults && (
                        <div className={`p-4 rounded-xl text-center animate-slide-up ${getScore() >= 4 ? 'bg-green-50 dark:bg-green-900/20' :
                            getScore() >= 3 ? 'bg-brand-50 dark:bg-brand-900/20' :
                                'bg-red-50 dark:bg-red-900/20'
                            }`}>
                            <p className="font-display font-bold text-2xl mt-1">
                                {getScore()} / {quiz.length}
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                {getScore() >= 4 ? 'Excellent work!' : getScore() >= 3 ? 'Good job! Keep studying.' : 'Keep practicing!'}
                            </p>
                        </div>
                    )}

                    <div className="space-y-4">
                        {quiz.map((q, qi) => (
                            <div key={qi} className="card p-4 animate-fade-in">
                                <p className="font-medium text-sm text-slate-900 dark:text-white mb-3">
                                    <span className="text-brand-500 font-bold mr-2">Q{qi + 1}.</span>
                                    {q.question}
                                </p>
                                <div className="space-y-2">
                                    {q.options.map((opt, oi) => (
                                        <button
                                            key={oi}
                                            onClick={() => handleAnswer(qi, oi)}
                                            disabled={showResults}
                                            className={`w-full text-left p-3 rounded-xl text-sm transition-all ${showResults
                                                ? oi === q.correctAnswer
                                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700'
                                                    : answers[qi] === oi
                                                        ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-700'
                                                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                                : answers[qi] === oi
                                                    ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 border border-brand-300 dark:border-brand-700'
                                                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                                                }`}
                                        >
                                            <span className="font-medium mr-2">
                                                {String.fromCharCode(65 + oi)}.
                                            </span>
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-2">
                        {!showResults ? (
                            <button
                                onClick={handleSubmit}
                                disabled={Object.keys(answers).length !== quiz.length}
                                className="btn-primary"
                            >
                                Submit Answers
                            </button>
                        ) : (
                            <button
                                onClick={resetQuiz}
                                className="btn-primary"
                            >
                                New Quiz
                            </button>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
