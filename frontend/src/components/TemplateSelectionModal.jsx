import React, { useState } from 'react';
import { Loader2, Download, CreditCard, CheckCircle, FileText } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

const TEMPLATES = [
    { id: 'moderncv', name: 'Modern', isPremium: false, price: 0 },
    { id: 'academic', name: 'Academic', isPremium: false, price: 0 },
    { id: 'colorful', name: 'Creative Colors', isPremium: true, price: 500 },
    { id: 'executive', name: 'Executive', isPremium: true, price: 500 }
];

export default function TemplateSelectionModal({ cvData, user, onRestart }) {
    const [selectedTemplate, setSelectedTemplate] = useState('moderncv');
    const [isGenerating, setIsGenerating] = useState(false);
    const [pdfBlob, setPdfBlob] = useState(null);
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [hasPaid, setHasPaid] = useState(false);

    const initPaystack = async (templateId) => {
        try {
            const token = await user.getIdToken();
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/initiate_payment`, {
                email: user.email || 'guest@example.com',
                amount: 50000,
                metadata: { template_id: templateId, user_id: user.uid }
            }, { headers: { Authorization: `Bearer ${token}` } });

            const { authorization_url, reference } = res.data.data;

            const paystack = new window.PaystackPop();
            paystack.newTransaction({
                key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
                email: user.email || 'guest@example.com',
                amount: 50000,
                reference: reference,
                currency: 'KES',
                onSuccess: async (transaction) => {
                    const toastId = toast.loading('Verifying payment...');
                    try {
                        await axios.get(`${import.meta.env.VITE_API_URL}/api/verify_payment/${transaction.reference}`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        toast.success('Payment verified!', { id: toastId });
                        setHasPaid(true);
                        generatePDF(templateId);
                    } catch (err) {
                        toast.error('Payment verification failed', { id: toastId });
                        setIsGenerating(false);
                    }
                },
                onCancel: () => {
                    toast.error('Payment cancelled');
                    setIsGenerating(false);
                }
            });

        } catch (err) {
            toast.error('Failed to initialize payment');
            setIsGenerating(false);
        }
    };

    const generatePDF = async (templateId) => {
        setIsGenerating(true);
        setPdfBlob(null);
        const toastId = toast.loading('Generating PDF...');
        try {
            const token = await user.getIdToken();
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/generate_pdf`, {
                cv_data: cvData,
                template_id: templateId,
                color_hex: "0056b3",
                color_var: "blue"
            }, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });

            const blobUrl = URL.createObjectURL(res.data);
            setPdfBlob(blobUrl);
            toast.success('PDF Generated successfully!', { id: toastId });
        } catch (err) {
            if (err.response?.status === 403) {
                toast.error('Payment required for this template', { id: toastId });
                setHasPaid(false);
            } else {
                toast.error('Failed to generate PDF. Please try again.', { id: toastId });
            }
        } finally {
            setIsGenerating(false);
        }
    };

    const handleGenerate = () => {
        const tpl = TEMPLATES.find(t => t.id === selectedTemplate);
        if (tpl.isPremium && !hasPaid) {
            setIsGenerating(true);
            initPaystack(tpl.id);
        } else {
            generatePDF(tpl.id);
        }
    };

    const onDocumentLoadSuccess = ({ numPages }) => {
        setNumPages(numPages);
    };

    if (pdfBlob) {
        return (
            <div className="w-full max-w-4xl bg-white dark:bg-gray-900 rounded-lg shadow-xl p-6 flex flex-col items-center">
                <div className="flex justify-between w-full mb-4">
                    <h3 className="text-xl font-bold dark:text-white">Your CV Document</h3>
                    <div className="flex gap-2">
                        <button onClick={() => setPdfBlob(null)} className="px-4 py-2 bg-gray-200 dark:bg-gray-800 rounded dark:text-white hover:bg-gray-300 dark:hover:bg-gray-700 transition">Back to Templates</button>
                        <a href={pdfBlob} download="Meshark_AI_CV.pdf" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center gap-2 transition">
                            <Download className="w-4 h-4" /> Download PDF
                        </a>
                    </div>
                </div>
                <div className="border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-auto h-[600px] w-full flex justify-center items-start">
                    <Document file={pdfBlob} onLoadSuccess={onDocumentLoadSuccess}>
                        <Page pageNumber={pageNumber} scale={1.2} renderTextLayer={false} renderAnnotationLayer={false} />
                    </Document>
                </div>
                {numPages > 1 && (
                    <div className="flex gap-4 mt-4 items-center">
                        <button disabled={pageNumber <= 1} onClick={() => setPageNumber(p => p - 1)} className="px-4 py-1.5 bg-gray-200 dark:bg-gray-800 dark:text-white rounded disabled:opacity-50 transition">Prev</button>
                        <span className="font-medium dark:text-gray-300">Page {pageNumber} of {numPages}</span>
                        <button disabled={pageNumber >= numPages} onClick={() => setPageNumber(p => p + 1)} className="px-4 py-1.5 bg-gray-200 dark:bg-gray-800 dark:text-white rounded disabled:opacity-50 transition">Next</button>
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-lg shadow-xl p-6 border dark:border-gray-800 mt-10">
            <h3 className="text-2xl font-bold mb-6 text-center dark:text-white">Choose Your Template</h3>
            <div className="grid grid-cols-2 gap-4 mb-8">
                {TEMPLATES.map(t => (
                    <div
                        key={t.id}
                        onClick={() => setSelectedTemplate(t.id)}
                        className={`cursor-pointer border-2 rounded-lg p-4 flex justify-between items-center transition-all ${selectedTemplate === t.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'}`}
                    >
                        <div>
                            <p className="font-semibold dark:text-white">{t.name}</p>
                            <p className="text-sm text-gray-500">{t.isPremium ? `Ksh ${t.price} (Premium)` : 'Free'}</p>
                        </div>
                        {selectedTemplate === t.id && <CheckCircle className="text-blue-500 w-6 h-6" />}
                    </div>
                ))}
            </div>
            <div className="flex justify-between items-center">
                <button onClick={onRestart} className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium transition">Start Over</button>
                <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg disabled:opacity-50 font-semibold flex items-center gap-2 transition shadow-md"
                >
                    {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                    {TEMPLATES.find(t => t.id === selectedTemplate)?.isPremium && !hasPaid ? <CreditCard className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                    {TEMPLATES.find(t => t.id === selectedTemplate)?.isPremium && !hasPaid ? 'Pay & Generate PDF' : 'Generate PDF'}
                </button>
            </div>
        </div>
    );
}
