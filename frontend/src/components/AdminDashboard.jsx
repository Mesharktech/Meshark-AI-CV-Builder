import React, { useState, useEffect } from 'react';
import { Settings, Plus, LayoutTemplate, Trash2, Edit2, Loader2, Check } from 'lucide-react';

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

    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md w-full border border-red-100">
                    <div className="bg-red-50 text-red-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Settings size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
                    <p className="text-gray-500">You do not have permission to view the Admin Dashboard.</p>
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
