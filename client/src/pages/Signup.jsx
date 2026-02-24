import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
        try {
            await signup(form.username, form.email, form.password, subjects);
        } catch (err) {
            setError(err.response?.data?.message || 'Signup failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Panel */}
            <div className="hidden lg:flex lg:w-1/2 gradient-bg relative overflow-hidden items-center justify-center">
                <div className="absolute inset-0 bg-black/10" />
                <div className="relative z-10 text-center px-12">
                    <div className="text-8xl mb-6">🐝</div>
                    <h1 className="text-5xl font-display font-bold text-white mb-4">Join the Hive</h1>
                    <p className="text-xl text-white/80 max-w-md mx-auto leading-relaxed">
                        Create your account and start studying smarter with collaborative tools and AI-powered learning.
                    </p>
                </div>
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/5 rounded-3xl rotate-45" />
                <div className="absolute -bottom-20 -left-10 w-48 h-48 bg-white/5 rounded-3xl rotate-12" />
            </div>

            {/* Right Panel */}
            <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
                <div className="w-full max-w-md animate-fade-in">
                    <div className="lg:hidden text-center mb-8">
                        <span className="text-5xl">🐝</span>
                        <h1 className="text-3xl font-display font-bold gradient-text mt-2">StudyHive</h1>
                    </div>

                    <h2 className="text-3xl font-display font-bold text-dark-900 dark:text-white mb-2">
                        Create your account
                    </h2>
                    <p className="text-dark-500 dark:text-dark-400 mb-8">
                        Join thousands of students studying together
                    </p>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm animate-slide-up">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">Username</label>
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
                            <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">Email</label>
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
                                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">Password</label>
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
                                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">Confirm</label>
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
                            <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-3">
                                Subjects of Interest
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {SUBJECT_OPTIONS.map(subject => (
                                    <button
                                        key={subject}
                                        type="button"
                                        onClick={() => toggleSubject(subject)}
                                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${subjects.includes(subject)
                                                ? 'bg-honey-500 text-white shadow-md shadow-honey-500/25'
                                                : 'bg-dark-100 dark:bg-dark-800 text-dark-600 dark:text-dark-300 hover:bg-dark-200 dark:hover:bg-dark-700'
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
                    </form>

                    <p className="mt-6 text-center text-dark-500 dark:text-dark-400">
                        Already have an account?{' '}
                        <Link to="/login" className="text-honey-600 dark:text-honey-400 font-medium hover:underline">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
