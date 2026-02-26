import React, { useState, useEffect } from 'react';
import { Settings, Plus, LayoutTemplate, Trash2, Edit2, Loader2, Check, LogIn } from 'lucide-react';
import { signInWithGoogle } from '../firebase';

export default function AdminDashboard({ user }) {
    const [templates, setTemplates] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('templates'); // 'templates', 'add'

    // Only allow admin via Google Auth email check
    const isAdmin = user && user.email === 'mesharkmuindi69@gmail.com';

    useEffect(() => {
        if (isAdmin) fetchTemplates();
    }, [isAdmin]);

    const fetchTemplates = async () => {
        setIsLoading(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
            const response = await fetch(`${apiUrl}/api/templates`);
            if (response.ok) {
                const data = await response.json();
                setTemplates(data);
            }
        } catch (err) {
            console.error("Failed to fetch templates as admin", err);
        } finally {
            setIsLoading(false);
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md w-full border border-gray-200">
                    <div className="bg-gray-900 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                        <Settings size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Login</h2>
                    <p className="text-gray-500 mb-8 text-sm">Please sign in with your authorized administrator account to continue.</p>
                    <button
                        onClick={async () => {
                            try {
                                await signInWithGoogle();
                            } catch (error) {
                                console.error("Admin login failed", error);
                            }
                        }}
                        className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3 rounded-xl shadow-sm transition-all font-medium"
                    >
                        <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg"><g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)"><path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z" /><path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z" /><path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z" /><path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z" /></g></svg>
                        Sign in with Google
                    </button>
                </div>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md w-full border border-red-100">
                    <div className="bg-red-50 text-red-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Settings size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
                    <p className="text-gray-500 mb-6">Signed in as <b>{user.email}</b>. You do not have permission to view the Admin Dashboard.</p>
                    <button
                        onClick={async () => {
                            try {
                                await signInWithGoogle();
                            } catch (error) {
                                console.error("Admin login swap failed", error);
                            }
                        }}
                        className="text-brand hover:underline text-sm font-medium"
                    >
                        Switch Account
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="bg-gray-900 p-2 rounded-lg">
                        <Settings className="text-white" size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Admin Console</h1>
                        <p className="text-xs text-gray-500 font-medium">Manage Templates & Pricing</p>
                    </div>
                </div>
                <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
                    <button
                        onClick={() => setActiveTab('templates')}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'templates' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        All Templates
                    </button>
                    <button
                        onClick={() => setActiveTab('add')}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'add' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Plus size={16} /> New Template
                    </button>
                </div>
            </header>

            <main className="max-w-6xl mx-auto p-6 md:p-8">
                {activeTab === 'templates' && (
                    <div className="space-y-6 animate-fade-in-up">
                        <h2 className="text-2xl font-serif font-bold text-gray-800">Active Templates</h2>

                        {isLoading ? (
                            <div className="flex justify-center p-12"><Loader2 className="animate-spin text-gray-400" size={32} /></div>
                        ) : templates.length === 0 ? (
                            <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-300">
                                <LayoutTemplate className="mx-auto text-gray-300 mb-4" size={48} />
                                <p className="text-gray-500 font-medium">No templates found in the database.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {templates.map(tmpl => (
                                    <div key={tmpl.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col group">
                                        <div className="h-40 bg-gray-100 relative overflow-hidden">
                                            <img
                                                src={tmpl.thumbnail_url || 'https://images.unsplash.com/photo-1616628188467-8af29c4138ed?q=80&w=400&auto=format&fit=crop'}
                                                alt={tmpl.name}
                                                className="w-full h-full object-cover object-top opacity-90 group-hover:opacity-100 transition-opacity"
                                            />
                                            {tmpl.is_premium ? (
                                                <span className="absolute top-3 right-3 bg-white text-gray-900 text-xs font-bold px-2 py-1 rounded shadow-sm">
                                                    Premium (KES {tmpl.price})
                                                </span>
                                            ) : (
                                                <span className="absolute top-3 right-3 bg-gray-900 text-white text-xs font-bold px-2 py-1 rounded shadow-sm">
                                                    Free
                                                </span>
                                            )}
                                        </div>
                                        <div className="p-5 flex-1 flex flex-col">
                                            <h3 className="text-lg font-bold text-gray-900 mb-1">{tmpl.name}</h3>
                                            <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">{tmpl.description}</p>
                                            <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                                                <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit Template">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Deactivate/Delete">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'add' && (
                    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8 animate-fade-in-up">
                        <h2 className="text-2xl font-serif font-bold text-gray-800 mb-6">Upload New Template</h2>

                        <form className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Template ID (Unique Handle)</label>
                                <input type="text" placeholder="e.g., standard_corporate" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-brand/50 focus:border-brand outline-none" />
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                                    <input type="text" placeholder="e.g., Executive Profile" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Pricing Configuration</label>
                                    <select className="w-full border border-gray-300 rounded-xl px-4 py-2.5 outline-none bg-white">
                                        <option value="free">Free Forever</option>
                                        <option value="premium_500">Premium (500 KES)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea rows="3" placeholder="Describe the layout..." className="w-full border border-gray-300 rounded-xl px-4 py-2.5 outline-none resize-none"></textarea>
                            </div>

                            <div className="pt-4 border-t border-gray-100">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Upload LaTeX (.tex) File</label>
                                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer group">
                                    <LayoutTemplate className="mx-auto text-gray-400 group-hover:text-brand mb-2" size={32} />
                                    <p className="text-sm font-medium text-gray-600">Click to select or drag and drop</p>
                                    <p className="text-xs text-gray-400 mt-1">.tex files only</p>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end">
                                <button type="button" className="bg-gray-900 text-white font-semibold flex items-center gap-2 px-6 py-3 rounded-xl hover:bg-black transition-colors">
                                    <Check size={18} /> Save to Database
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </main>
        </div>
    );
}
