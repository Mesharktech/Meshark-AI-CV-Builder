import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import ChatInterface from './components/ChatInterface';
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './components/AdminDashboard';
import { FileText, LogOut, LayoutDashboard, Shield } from 'lucide-react';

function Navigation() {
    const { user, loginWithGoogle, logoutUser } = useAuth();

    return (
        <header className="bg-white border-b shadow-sm sticky top-0 z-50">
            <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                        <FileText className="text-white w-5 h-5" />
                    </div>
                    <span className="text-xl font-bold text-gray-900 hidden sm:block">Meshark AI</span>
                </Link>
                <div>
                    {user ? (
                        <div className="flex items-center gap-4">
                            <Link to="/" className="text-sm font-medium text-gray-600 hover:text-blue-600">New CV</Link>
                            <Link to="/dashboard" className="text-sm font-medium text-gray-600 hover:text-blue-600 flex items-center gap-1"><LayoutDashboard className="w-4 h-4" /> Dashboard</Link>
                            {user.email === 'mesharkmuindi69@gmail.com' && (
                                <Link to="/admin" className="text-sm font-medium text-purple-600 hover:text-purple-800 flex items-center gap-1"><Shield className="w-4 h-4" /> Admin</Link>
                            )}
                            <div className="h-6 w-px bg-gray-200 mx-1"></div>
                            <span className="text-sm font-medium text-gray-700 hidden md:block">{user.displayName || user.email}</span>
                            <button onClick={logoutUser} aria-label="Logout" className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition"><LogOut className="w-5 h-5" /></button>
                        </div>
                    ) : (
                        <button onClick={loginWithGoogle} className="text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg transition shadow-sm">
                            Sign In
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
}

function ProtectedRoute({ children, adminOnly = false }) {
    const { user, loading } = useAuth();
    if (loading) return <div className="p-10 text-center text-gray-500">Loading...</div>;
    if (!user) return <div className="p-10 text-center"><h2 className="text-2xl font-bold mb-4">Please sign in to access this page</h2></div>;
    if (adminOnly && user.email !== 'mesharkmuindi69@gmail.com') return <div className="p-10 text-center text-red-600">Access Denied</div>;
    return children;
}

function LandingOrChat() {
    const { user, loading, loginWithGoogle } = useAuth();
    if (loading) return <div className="p-10 text-center text-gray-500">Loading...</div>;
    if (user) return <ChatInterface user={user} />;

    return (
        <div className="text-center max-w-2xl mx-auto py-20 px-4 mt-8">
            <h1 className="text-5xl font-extrabold text-gray-900 mb-6 tracking-tight leading-tight">Create your standout CV in minutes with AI.</h1>
            <p className="text-xl text-gray-600 mb-10">Meshark AI interviews you step-by-step and instantly formats a professional, ATS-optimized resume.</p>
            <button onClick={loginWithGoogle} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold text-lg shadow-md transition transform hover:scale-105">
                Start Building for Free
            </button>
            <div className="flex justify-center flex-wrap gap-12 mt-20 opacity-70">
                <div className="flex flex-col items-center"><div className="text-4xl font-black text-blue-600 mb-2">1</div><p className="font-medium">Chat with AI</p></div>
                <div className="flex flex-col items-center"><div className="text-4xl font-black text-blue-600 mb-2">2</div><p className="font-medium">Pick a Template</p></div>
                <div className="flex flex-col items-center"><div className="text-4xl font-black text-blue-600 mb-2">3</div><p className="font-medium">Download PDF</p></div>
            </div>
        </div>
    );
}

function AppContent() {
    const { user } = useAuth();
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <Navigation />
            <main className="flex-1 w-full p-4 lg:p-8 flex justify-center items-start">
                <Routes>
                    <Route path="/" element={<LandingOrChat />} />
                    <Route path="/dashboard" element={<ProtectedRoute><UserDashboard user={user} /></ProtectedRoute>} />
                    <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard user={user} /></ProtectedRoute>} />
                    <Route path="/privacy" element={<div className="p-10 max-w-3xl mx-auto w-full bg-white rounded-lg shadow border dark:border-gray-800 text-gray-600"><h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1><p className="leading-relaxed">Your privacy is incredibly important to us at Meshark AI. The information you provide during the CV generation interview is used strictly for the purpose of constructing your resume document. We process your data through standard AI language models to improve your CV phrasing and structure. We do not sell, rent, or distribute your personal documents or answers to third-party marketers. Authentication is securely managed by Google Firebase.</p></div>} />
                    <Route path="/terms" element={<div className="p-10 max-w-3xl mx-auto w-full bg-white rounded-lg shadow border dark:border-gray-800 text-gray-600"><h1 className="text-3xl font-bold text-gray-900 mb-6">Terms of Service</h1><p className="leading-relaxed">By logging in and using the Meshark AI CV Builder, you agree to these Terms of Service. The resulting PDF documents are generated automatically based on your input. While we strive for high-quality formatting, we are not responsible for formatting errors caused by excessive or irregularly structured inputs. Premium templates are processed via Paystack. Purchases of premium CV downloads are final and non-refundable once the target PDF is successfully generated and delivered to you.</p></div>} />
                </Routes>
            </main>

            <footer className="bg-white border-t mt-auto py-6">
                <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center text-sm text-gray-500">
                    <p>&copy; {new Date().getFullYear()} Meshark AI CV Builder. All rights reserved.</p>
                    <div className="flex gap-4 mt-4 sm:mt-0">
                        <Link to="/privacy" className="hover:text-blue-600">Privacy Policy</Link>
                        <Link to="/terms" className="hover:text-blue-600">Terms of Service</Link>
                    </div>
                </div>
            </footer>

            <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        </div>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </BrowserRouter>
    );
}
