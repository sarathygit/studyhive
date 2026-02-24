import { useState } from 'react';
import api from '../utils/api';

export default function QuizGenerator({ roomId }) {
    const [notes, setNotes] = useState('');
    const [quiz, setQuiz] = useState([]);
    const [answers, setAnswers] = useState({});
    const [showResults, setShowResults] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

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

    return (
        <div className="p-4 space-y-4 overflow-y-auto h-full">
            <h3 className="text-lg font-display font-bold text-dark-900 dark:text-white flex items-center gap-2">
                🧠 AI Quiz Generator
            </h3>

            {quiz.length === 0 ? (
                <>
                    <p className="text-sm text-dark-500 dark:text-dark-400">
                        Paste your notes below and AI will generate 5 multiple choice questions.
                    </p>
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
                                onClick={() => { setQuiz([]); setAnswers({}); setShowResults(false); setNotes(''); }}
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
