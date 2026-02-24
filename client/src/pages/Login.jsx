import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Panel - Branding */}
            <div className="hidden lg:flex lg:w-1/2 gradient-bg relative overflow-hidden items-center justify-center">
                <div className="absolute inset-0 bg-black/10" />
                <div className="relative z-10 text-center px-12">
                    <div className="text-8xl mb-6">🐝</div>
                    <h1 className="text-5xl font-display font-bold text-white mb-4">StudyHive</h1>
                    <p className="text-xl text-white/80 max-w-md mx-auto leading-relaxed">
                        Study together, learn smarter. Join collaborative study rooms and boost your productivity.
                    </p>
                    <div className="mt-10 flex items-center justify-center gap-8 text-white/70">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-white">🎯</div>
                            <p className="text-sm mt-1">Focus Timer</p>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-white">💬</div>
                            <p className="text-sm mt-1">Group Chat</p>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-white">🎨</div>
                            <p className="text-sm mt-1">Whiteboard</p>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-white">🧠</div>
                            <p className="text-sm mt-1">AI Quizzes</p>
                        </div>
                    </div>
                </div>
                {/* Decorative hexagons */}
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/5 rounded-3xl rotate-45" />
                <div className="absolute -bottom-20 -left-10 w-48 h-48 bg-white/5 rounded-3xl rotate-12" />
            </div>

            {/* Right Panel - Form */}
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-md animate-fade-in">
                    <div className="lg:hidden text-center mb-8">
                        <span className="text-5xl">🐝</span>
                        <h1 className="text-3xl font-display font-bold gradient-text mt-2">StudyHive</h1>
                    </div>

                    <h2 className="text-3xl font-display font-bold text-dark-900 dark:text-white mb-2">
                        Welcome back!
                    </h2>
                    <p className="text-dark-500 dark:text-dark-400 mb-8">
                        Sign in to continue your study sessions
                    </p>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm animate-slide-up">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">Email</label>
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
                            <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">Password</label>
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
                    </form>

                    <p className="mt-6 text-center text-dark-500 dark:text-dark-400">
                        Don't have an account?{' '}
                        <Link to="/signup" className="text-honey-600 dark:text-honey-400 font-medium hover:underline">
                            Sign up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
