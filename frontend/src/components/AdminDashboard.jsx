import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Loader2, Users, CreditCard, FileText, Database } from 'lucide-react';

export default function AdminDashboard({ user }) {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const token = await user.getIdToken();
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/stats`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(res.data);
        } catch (error) {
            toast.error("Failed to load admin stats");
        } finally {
            setLoading(false);
        }
    };

    const seedTemplates = async () => {
        const toastId = toast.loading('Seeding templates...');
        try {
            const token = await user.getIdToken();
            await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/seed_templates`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Templates seeded successfully!', { id: toastId });
        } catch (error) {
            toast.error("Failed to seed templates", { id: toastId });
        }
    };

    if (user?.email !== 'mesharkmuindi69@gmail.com') {
        return <div className="text-center mt-20 text-red-600 p-8 border border-red-200 bg-red-50 rounded-lg max-w-lg mx-auto">Access Denied: Admin privileges required.</div>;
    }

    if (loading) return <div className="flex justify-center mt-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;

    return (
        <div className="max-w-4xl mx-auto w-full p-4">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h2>
                <button onClick={seedTemplates} aria-label="Seed Templates" className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium transition shadow-sm">
                    <Database className="w-4 h-4" /> Seed Templates
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-full"><FileText className="w-8 h-8" /></div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">Total CVs</p>
                        <p className="text-3xl font-bold dark:text-white">{stats?.total_cvs_generated || 0}</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-green-100 text-green-600 rounded-full"><CreditCard className="w-8 h-8" /></div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">Total Revenue (KES)</p>
                        <p className="text-3xl font-bold dark:text-white">{stats?.total_revenue_kes || 0}</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-purple-100 text-purple-600 rounded-full"><Users className="w-8 h-8" /></div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">Purchases</p>
                        <p className="text-3xl font-bold dark:text-white">{stats?.total_purchases || 0}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
