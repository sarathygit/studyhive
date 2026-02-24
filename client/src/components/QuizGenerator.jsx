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
    const [inputMode, setInputMode] = useState('text'); // 'text' or 'file'
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
            // Upload file to the summarize-doc endpoint to extract text
            const formData = new FormData();
            formData.append('document', file);

            const res = await api.post('/ai/summarize-doc', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // Use the summary as notes for quiz generation
            if (res.data.summary) {
                setNotes(res.data.summary);
                setInputMode('text'); // Switch to text view so user can see extracted text
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
            <h3 className="text-lg font-display font-bold text-dark-900 dark:text-white flex items-center gap-2">
                🧠 AI Quiz Generator
            </h3>

            {quiz.length === 0 ? (
                <>
                    <p className="text-sm text-dark-500 dark:text-dark-400">
                        Paste notes or upload a file — AI will generate 5 multiple choice questions.
                    </p>

                    {/* Input Mode Toggle */}
                    <div className="flex rounded-xl bg-dark-100 dark:bg-dark-800 p-1 gap-1">
                        <button
                            onClick={() => setInputMode('text')}
                            className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${inputMode === 'text'
                                    ? 'bg-white dark:bg-dark-700 text-dark-900 dark:text-white shadow-sm'
                                    : 'text-dark-500 dark:text-dark-400 hover:text-dark-700 dark:hover:text-dark-200'
                                }`}
                        >
                            ✏️ Paste Text
                        </button>
                        <button
                            onClick={() => setInputMode('file')}
                            className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${inputMode === 'file'
                                    ? 'bg-white dark:bg-dark-700 text-dark-900 dark:text-white shadow-sm'
                                    : 'text-dark-500 dark:text-dark-400 hover:text-dark-700 dark:hover:text-dark-200'
                                }`}
                        >
                            📄 Upload File
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
                                ) : '✨ Generate Quiz'}
                            </button>
                        </>
                    ) : (
                        <>
                            {/* File Upload Zone */}
                            <div
                                onClick={() => !extracting && fileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-300 ${file
                                        ? 'border-green-400 bg-green-50 dark:bg-green-900/10'
                                        : 'border-dark-200 dark:border-dark-700 hover:border-honey-400 hover:bg-honey-50/50 dark:hover:bg-dark-800/50'
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
                                        <div className="text-3xl mb-2">📤</div>
                                        <p className="text-sm font-medium text-dark-700 dark:text-dark-200">
                                            Click to upload a file
                                        </p>
                                        <p className="text-xs text-dark-400 mt-1">
                                            PDF, Word, PPT, Text, or Image
                                        </p>
                                    </>
                                ) : (
                                    <div className="flex items-center gap-3 justify-center" onClick={e => e.stopPropagation()}>
                                        <span className="text-2xl">📄</span>
                                        <div className="text-left">
                                            <p className="text-sm font-medium text-dark-800 dark:text-dark-100 truncate max-w-[200px]">
                                                {file.name}
                                            </p>
                                            <p className="text-xs text-dark-400">
                                                {(file.size / 1024).toFixed(1)} KB
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                                            className="text-dark-400 hover:text-red-500"
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
                                    ) : '📖 Extract & Generate Quiz'}
                                </button>
                            )}
                        </>
                    )}
                </>
            ) : (
                <>
                    {/* Results banner */}
                    {showResults && (
                        <div className={`p-4 rounded-xl text-center animate-slide-up ${getScore() >= 4 ? 'bg-green-50 dark:bg-green-900/20' :
                            getScore() >= 3 ? 'bg-honey-50 dark:bg-honey-900/20' :
                                'bg-red-50 dark:bg-red-900/20'
                            }`}>
                            <p className="text-2xl font-bold">
                                {getScore() >= 4 ? '🎉' : getScore() >= 3 ? '👍' : '📚'}
                            </p>
                            <p className="font-display font-bold text-lg mt-1">
                                {getScore()} / {quiz.length} Correct
                            </p>
                            <p className="text-sm text-dark-500 dark:text-dark-400 mt-1">
                                {getScore() >= 4 ? 'Excellent work!' : getScore() >= 3 ? 'Good job! Keep studying.' : 'Keep practicing!'}
                            </p>
                        </div>
                    )}

                    {/* Questions */}
                    <div className="space-y-4">
                        {quiz.map((q, qi) => (
                            <div key={qi} className="card p-4 animate-fade-in">
                                <p className="font-medium text-sm text-dark-900 dark:text-white mb-3">
                                    <span className="text-honey-500 font-bold mr-2">Q{qi + 1}.</span>
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
                                                        : 'bg-dark-50 dark:bg-dark-800 text-dark-600 dark:text-dark-400'
                                                : answers[qi] === oi
                                                    ? 'bg-honey-100 dark:bg-honey-900/30 text-honey-700 dark:text-honey-400 border border-honey-300 dark:border-honey-700'
                                                    : 'bg-dark-50 dark:bg-dark-800 text-dark-600 dark:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-700'
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

                    {/* Actions */}
                    <div className="flex gap-2">
                        {!showResults ? (
                            <button
                                onClick={handleSubmit}
                                disabled={Object.keys(answers).length !== quiz.length}
                                className="btn-primary"
                            >
                                ✅ Submit Answers
                            </button>
                        ) : (
                            <button
                                onClick={resetQuiz}
                                className="btn-primary"
                            >
                                🔄 New Quiz
                            </button>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
