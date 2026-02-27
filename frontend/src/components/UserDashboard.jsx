import React, { useState, useEffect } from 'react';
import { FileText, Download, Loader2, Sparkles, LogOut, Clock, ArrowLeft, RefreshCw, Edit2 } from 'lucide-react';
import { auth, logout } from '../firebase';

export default function UserDashboard({ user, onBack, onEdit }) {
    const [cvs, setCvs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [downloadingId, setDownloadingId] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (user) fetchCvs();
    }, [user]);

    const fetchCvs = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
            const token = await auth.currentUser.getIdToken();
            const res = await fetch(`${apiUrl}/api/cvs`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch CVs');
            const data = await res.json();
            setCvs(data);
        } catch (err) {
            setError('Could not load your documents. Please try again.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = async (cvId, name) => {
        setDownloadingId(cvId);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
            const token = await auth.currentUser.getIdToken();
            const res = await fetch(`${apiUrl}/api/cvs/${cvId}/download`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Download failed');
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${name || 'CV'}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            console.error(err);
        } finally {
            setDownloadingId(null);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'Unknown date';
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    const getInitials = (cvData) => {
        const name = cvData?.name || cvData?.full_name || '';
        return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() || 'CV';
    };

    return (
        <div className="min-h-[100dvh] bg-gray-50 font-sans flex flex-col">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onBack}
                        className="p-2 text-gray-400 hover:text-brand hover:bg-brand/5 rounded-lg transition-colors"
                        title="Back to Chat"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="bg-brand/10 p-2 rounded-lg">
                        <Sparkles className="text-brand" size={20} />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-gray-900">My Documents</h1>
                        <p className="text-xs text-gray-500 hidden sm:block">Your generated CVs</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchCvs}
                        className="p-2 text-gray-400 hover:text-brand hover:bg-brand/5 rounded-lg transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw size={18} />
                    </button>
                    {user && (
                        <div className="flex items-center gap-2">
                            <img
                                src={user.photoURL}
                                alt={user.displayName}
                                className="w-8 h-8 rounded-full border border-gray-200 hidden sm:block"
                            />
                            <button
                                onClick={logout}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Sign Out"
                            >
                                <LogOut size={18} />
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 max-w-5xl mx-auto w-full p-4 sm:p-6 md:p-8">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-64">
                        <Loader2 className="animate-spin text-brand mb-3" size={36} />
                        <p className="text-gray-500 text-sm">Loading your documents...</p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl border border-dashed border-red-200 p-8">
                        <p className="text-red-500 font-medium mb-4">{error}</p>
                        <button
                            onClick={fetchCvs}
                            className="flex items-center gap-2 text-sm text-brand hover:underline font-medium"
                        >
                            <RefreshCw size={14} /> Try again
                        </button>
                    </div>
                ) : cvs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center">
                        <FileText className="text-gray-300 mb-4" size={48} />
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">No CVs yet</h3>
                        <p className="text-gray-400 text-sm mb-6">Go back and chat with Meshark AI to generate your first professional CV!</p>
                        <button
                            onClick={onBack}
                            className="flex items-center gap-2 bg-brand text-white px-5 py-2.5 rounded-xl font-medium hover:bg-brand-dark transition-colors text-sm"
                        >
                            <Sparkles size={16} /> Build a CV
                        </button>
                    </div>
                ) : (
                    <>
                        <p className="text-sm text-gray-500 mb-5 font-medium">
                            {cvs.length} document{cvs.length !== 1 ? 's' : ''} found
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                            {cvs.map(cv => (
                                <div
                                    key={cv.id}
                                    className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden group hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                                >
                                    {/* Card Preview */}
                                    <div className="h-28 bg-gradient-to-br from-brand/80 to-brand-dark flex items-center justify-center relative overflow-hidden">
                                        <div className="text-white/20 absolute -right-4 -bottom-4 text-[80px] font-black select-none leading-none">CV</div>
                                        <span className="text-3xl font-extrabold text-white drop-shadow z-10">
                                            {getInitials(cv.cv_data)}
                                        </span>
                                        <span className="absolute top-3 right-3 bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                            {cv.template_name || 'moderncv'}
                                        </span>
                                    </div>

                                    {/* Card Info */}
                                    <div className="p-4 flex flex-col gap-3">
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-sm truncate">
                                                {cv.cv_data?.name || cv.cv_data?.full_name || cv.title || 'Unnamed CV'}
                                            </h3>
                                            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                                <Clock size={11} />
                                                {formatDate(cv.created_at)}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleDownload(cv.id, cv.cv_data?.name || cv.title)}
                                                disabled={downloadingId === cv.id}
                                                className="flex-1 flex items-center justify-center gap-2 bg-brand/10 text-brand hover:bg-brand hover:text-white py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                                            >
                                                {downloadingId === cv.id
                                                    ? <><Loader2 size={14} className="animate-spin" /> Generating...</>
                                                    : <><Download size={14} /> Download</>
                                                }
                                            </button>
                                            {onEdit && (
                                                <button
                                                    onClick={() => onEdit(cv.cv_data)}
                                                    className="p-2 bg-gray-100 text-gray-500 hover:bg-brand/10 hover:text-brand rounded-xl transition-colors flex items-center justify-center"
                                                    title="Edit this CV"
                                                >
                                                    <Edit2 size={15} />
                                                </button>
                                            )}
                                        </div>                                 </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
