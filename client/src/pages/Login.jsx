import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../utils/api';

// The backend sleeps on the free tier, so the first request after a quiet spell
// can take ~50s. Tell the user that rather than leaving them with a dead spinner.
const SLOW_REQUEST_HINT_MS = 5000;

export default function Login() {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [slow, setSlow] = useState(false);
    const slowTimer = useRef(null);

    useEffect(() => () => clearTimeout(slowTimer.current), []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        setSlow(false);
        slowTimer.current = setTimeout(() => setSlow(true), SLOW_REQUEST_HINT_MS);
        try {
            await login(email, password);
        } catch (err) {
            setError(getErrorMessage(err, 'Login failed'));
        } finally {
            clearTimeout(slowTimer.current);
            setSlow(false);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Panel - Branding */}
            <div className="hidden lg:flex lg:w-1/2 gradient-bg relative overflow-hidden items-center justify-center">
                <div className="absolute inset-0 bg-black/5" />
                <div className="relative z-10 text-center px-12">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <span className="text-white text-2xl font-bold">SH</span>
                    </div>
                    <h1 className="text-5xl font-display font-bold text-white mb-4">StudyHive</h1>
                    <p className="text-xl text-white/80 max-w-md mx-auto leading-relaxed">
                        Study together, learn smarter. Join collaborative study rooms and boost your productivity.
                    </p>
                    <div className="mt-10 flex items-center justify-center gap-8 text-white/70">
                        <div className="text-center">
                            <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center mx-auto mb-2">
                                <span className="text-white text-sm font-semibold">T</span>
                            </div>
                            <p className="text-sm">Focus Timer</p>
                        </div>
                        <div className="text-center">
                            <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center mx-auto mb-2">
                                <span className="text-white text-sm font-semibold">C</span>
                            </div>
                            <p className="text-sm">Group Chat</p>
                        </div>
                        <div className="text-center">
                            <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center mx-auto mb-2">
                                <span className="text-white text-sm font-semibold">W</span>
                            </div>
                            <p className="text-sm">Whiteboard</p>
                        </div>
                        <div className="text-center">
                            <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center mx-auto mb-2">
                                <span className="text-white text-sm font-semibold">Q</span>
                            </div>
                            <p className="text-sm">AI Quizzes</p>
                        </div>
                    </div>
                </div>
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/5 rounded-3xl rotate-45" />
                <div className="absolute -bottom-20 -left-10 w-48 h-48 bg-white/5 rounded-3xl rotate-12" />
            </div>

            {/* Right Panel - Form */}
            <div className="flex-1 flex items-center justify-center p-8 bg-white dark:bg-slate-900">
                <div className="w-full max-w-md animate-fade-in">
                    <div className="lg:hidden text-center mb-8">
                        <div className="w-12 h-12 bg-brand-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                            <span className="text-white text-lg font-bold">SH</span>
                        </div>
                        <h1 className="text-3xl font-display font-bold gradient-text">StudyHive</h1>
                    </div>

                    <h2 className="text-3xl font-display font-bold text-slate-900 dark:text-white mb-2">
                        Welcome back
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-8">
                        Sign in to continue your study sessions
                    </p>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm animate-slide-up">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input-field"
                                placeholder="your@email.com"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input-field"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full flex items-center justify-center gap-2 py-3"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Signing in...
                                </>
                            ) : 'Sign In'}
                        </button>

                        {slow && (
                            <p className="text-center text-sm text-slate-500 dark:text-slate-400 animate-fade-in">
                                Waking up the server — this can take up to a minute on the first try.
                            </p>
                        )}
                    </form>

                    <p className="mt-6 text-center text-slate-500 dark:text-slate-400">
                        Don't have an account?{' '}
                        <Link to="/signup" className="text-brand-600 dark:text-brand-400 font-medium hover:underline">
                            Sign up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
