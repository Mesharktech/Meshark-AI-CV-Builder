import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Loader2, Download, FileText, BarChart } from 'lucide-react';

export default function UserDashboard({ user }) {
    const [cvs, setCvs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCVs();
    }, []);

    const fetchCVs = async () => {
        try {
            const token = await user.getIdToken();
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/cvs`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCvs(res.data);
        } catch (error) {
            toast.error("Failed to load CVs");
        } finally {
            setLoading(false);
        }
    };

    const generatePdf = async (cv) => {
        const toastId = toast.loading('Generating PDF...');
        try {
            const token = await user.getIdToken();
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/generate_pdf`, {
                cv_data: cv.cv_data,
                template_id: cv.template_name,
                color_hex: "0056b3",
                color_var: "blue"
            }, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${cv.title || 'Meshark_CV'}.pdf`);
            document.body.appendChild(link);
            link.click();
            toast.success('Downloaded!', { id: toastId });
        } catch (error) {
            toast.error("Failed to download PDF", { id: toastId });
        }
    };

    const getAtsScore = async (cvId) => {
        const toastId = toast.loading('Calculating ATS Score...');
        try {
            const token = await user.getIdToken();
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/cvs/${cvId}/score`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(`ATS Score: ${res.data.score}/100. Check console for feedback.`, { id: toastId, duration: 6000 });
            console.log("ATS Feedback", res.data);
        } catch (error) {
            toast.error("Failed to calculate ATS score", { id: toastId });
        }
    };

    if (loading) return <div className="flex justify-center mt-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;

    return (
        <div className="max-w-4xl mx-auto w-full">
            <h2 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Your Dashboard</h2>
            {cvs.length === 0 ? (
                <div className="text-center p-12 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-medium dark:text-gray-200">No CVs yet</h3>
                    <p className="text-gray-500 mt-2">Start a new CV interview to create your first professional resume.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {cvs.map(cv => (
                        <div key={cv.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div>
                                <h3 className="text-xl font-bold dark:text-white">{cv.title || 'My Professional CV'}</h3>
                                <p className="text-sm text-gray-500">Template: <span className="capitalize">{cv.template_name}</span> | Created: {new Date(cv.created_at).toLocaleDateString()}</p>
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto">
                                <button onClick={() => getAtsScore(cv.id)} aria-label="ATS Score" className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded font-medium transition">
                                    <BarChart className="w-4 h-4" /> ATS Score
                                </button>
                                <button onClick={() => generatePdf(cv)} aria-label="Download CV" className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded font-medium transition">
                                    <Download className="w-4 h-4" /> Download
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
