import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../utils/api';

// See Login.jsx — free-tier cold starts can take ~50s.
const SLOW_REQUEST_HINT_MS = 5000;

const SUBJECT_OPTIONS = [
    'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science',
    'English', 'History', 'Economics', 'Psychology', 'Art', 'Music', 'Engineering'
];

export default function Signup() {
    const { signup } = useAuth();
    const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
    const [subjects, setSubjects] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [slow, setSlow] = useState(false);
    const slowTimer = useRef(null);

    useEffect(() => () => clearTimeout(slowTimer.current), []);

    const toggleSubject = (subject) => {
        setSubjects(prev =>
            prev.includes(subject) ? prev.filter(s => s !== subject) : [...prev, subject]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (form.password !== form.confirmPassword) {
            return setError('Passwords do not match');
        }
        if (form.password.length < 6) {
            return setError('Password must be at least 6 characters');
        }

        setLoading(true);
        setSlow(false);
        slowTimer.current = setTimeout(() => setSlow(true), SLOW_REQUEST_HINT_MS);
        try {
            await signup(form.username, form.email, form.password, subjects);
        } catch (err) {
            setError(getErrorMessage(err, 'Signup failed'));
        } finally {
            clearTimeout(slowTimer.current);
            setSlow(false);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Panel */}
            <div className="hidden lg:flex lg:w-1/2 gradient-bg relative overflow-hidden items-center justify-center">
                <div className="absolute inset-0 bg-black/5" />
                <div className="relative z-10 text-center px-12">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <span className="text-white text-2xl font-bold">SH</span>
                    </div>
                    <h1 className="text-5xl font-display font-bold text-white mb-4">Join StudyHive</h1>
                    <p className="text-xl text-white/80 max-w-md mx-auto leading-relaxed">
                        Create your account and start studying smarter with collaborative tools and AI-powered learning.
                    </p>
                </div>
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/5 rounded-3xl rotate-45" />
                <div className="absolute -bottom-20 -left-10 w-48 h-48 bg-white/5 rounded-3xl rotate-12" />
            </div>

            {/* Right Panel */}
            <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto bg-white dark:bg-slate-900">
                <div className="w-full max-w-md animate-fade-in">
                    <div className="lg:hidden text-center mb-8">
                        <div className="w-12 h-12 bg-brand-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                            <span className="text-white text-lg font-bold">SH</span>
                        </div>
                        <h1 className="text-3xl font-display font-bold gradient-text">StudyHive</h1>
                    </div>

                    <h2 className="text-3xl font-display font-bold text-slate-900 dark:text-white mb-2">
                        Create your account
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-8">
                        Join thousands of students studying together
                    </p>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm animate-slide-up">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Username</label>
                            <input
                                type="text"
                                value={form.username}
                                onChange={(e) => setForm({ ...form, username: e.target.value })}
                                className="input-field"
                                placeholder="studybee42"
                                required
                                minLength={3}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email</label>
                            <input
                                type="email"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                className="input-field"
                                placeholder="your@email.com"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Password</label>
                                <input
                                    type="password"
                                    value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                    className="input-field"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Confirm</label>
                                <input
                                    type="password"
                                    value={form.confirmPassword}
                                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                                    className="input-field"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                                Subjects of Interest
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {SUBJECT_OPTIONS.map(subject => (
                                    <button
                                        key={subject}
                                        type="button"
                                        onClick={() => toggleSubject(subject)}
                                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${subjects.includes(subject)
                                            ? 'bg-brand-600 text-white shadow-sm'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                            }`}
                                    >
                                        {subject}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full flex items-center justify-center gap-2 py-3"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Creating account...
                                </>
                            ) : 'Create Account'}
                        </button>

                        {slow && (
                            <p className="text-center text-sm text-slate-500 dark:text-slate-400 animate-fade-in">
                                Waking up the server — this can take up to a minute on the first try.
                            </p>
                        )}
                    </form>

                    <p className="mt-6 text-center text-slate-500 dark:text-slate-400">
                        Already have an account?{' '}
                        <Link to="/login" className="text-brand-600 dark:text-brand-400 font-medium hover:underline">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
