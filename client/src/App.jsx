import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SocketProvider } from './context/SocketContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Room from './pages/Room';

function PrivateRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-950">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-honey-400 border-t-transparent rounded-full animate-spin" />
                    <p className="text-dark-500 dark:text-dark-400 font-medium">Loading StudyHive...</p>
                </div>
            </div>
        );
    }
    return user ? children : <Navigate to="/login" />;
}

function PublicRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading) return null;
    return user ? <Navigate to="/dashboard" /> : children;
}

function AppRoutes() {
    return (
        <Routes>
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/room/:roomId" element={<PrivateRoute><Room /></PrivateRoute>} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
    );
}

export default function App() {
    return (
        <Router>
            <ThemeProvider>
                <AuthProvider>
                    <SocketProvider>
                        <AppRoutes />
                    </SocketProvider>
                </AuthProvider>
            </ThemeProvider>
        </Router>
    );
}
