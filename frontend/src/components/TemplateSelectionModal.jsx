import React, { useState } from 'react';
import { X, Check, Loader2, Lock } from 'lucide-react';
import { auth } from '../firebase';

const templates = [
    {
        id: 'moderncv',
        name: 'Modern',
        description: 'A clean, professional two-column layout perfect for traditional roles.',
        isPremium: false,
        price: 0,
    },
    {
        id: 'colorful',
        name: 'Creative Colors',
        description: 'Stand out with vibrant header sections. Ideal for modern digital roles.',
        isPremium: true,
        price: 500,
    },
    {
        id: 'executive',
        name: 'Executive',
        description: 'A refined single-column corporate layout with navy rule dividers. Perfect for senior roles.',
        isPremium: true,
        price: 500,
    },
    {
        id: 'academic',
        name: 'Academic',
        description: 'A research-focused CV with compact sections and a minimal header. Ideal for academia.',
        isPremium: false,
        price: 0,
    },
];

const colors = [
    { label: 'Teal', value: '#319795' },
    { label: 'Red', value: '#e53e3e' },
    { label: 'Blue', value: '#3182ce' },
    { label: 'Purple', value: '#805ad5' },
    { label: 'Gold', value: '#d69e2e' }
];

const TEMPLATE_PREVIEWS = {
    moderncv: (selectedColor) => (
        <div className="flex h-full bg-white border border-gray-200">
            <div className="w-1/3 h-full border-r border-gray-200 flex flex-col items-end pt-4 pr-3 gap-1" style={{ backgroundColor: '#f8fafc' }}>
                <div className="h-1 bg-gray-300 rounded w-1/2 mb-2"></div>
                <div className="h-1 bg-gray-300 rounded w-3/4"></div>
                <div className="h-1 bg-gray-300 rounded w-2/3"></div>
            </div>
            <div className="w-2/3 bg-white h-full p-4 flex flex-col gap-2.5">
                <div className="flex items-center gap-2 mb-1">
                    <div className="h-4 w-4 rounded-full" style={{ backgroundColor: selectedColor }}></div>
                    <div className="h-2 bg-gray-800 rounded w-1/2"></div>
                </div>
                <div className="h-1 bg-gray-300 rounded w-full"></div>
                <div className="h-1 bg-gray-200 rounded w-5/6"></div>
                <div className="h-1.5 bg-gray-200 rounded w-1/3 mt-2"></div>
                <div className="h-1 bg-gray-200 rounded w-4/5"></div>
            </div>
        </div>
    ),
    colorful: (selectedColor) => (
        <div className="flex flex-col h-full bg-white border border-gray-200">
            <div className="h-10 shrink-0 relative" style={{ backgroundColor: selectedColor }}>
                <div className="absolute left-4 bottom-2 h-2 bg-white/80 rounded w-1/3"></div>
                <div className="absolute left-4 bottom-5 h-1.5 bg-white/60 rounded w-1/4"></div>
            </div>
            <div className="p-4 flex flex-col gap-2">
                <div className="h-1.5 bg-gray-300 rounded w-1/4 mb-1"></div>
                <div className="h-1 bg-gray-200 rounded w-full"></div>
                <div className="h-1 bg-gray-200 rounded w-5/6"></div>
                <div className="h-1.5 bg-gray-300 rounded w-1/4 mt-2 mb-1"></div>
                <div className="h-1 bg-gray-200 rounded w-3/4"></div>
            </div>
        </div>
    ),
    executive: (selectedColor) => (
        <div className="flex flex-col h-full bg-white border border-gray-200 p-3">
            <div className="text-center mb-2">
                <div className="h-3 rounded w-2/3 mx-auto mb-1" style={{ backgroundColor: selectedColor }}></div>
                <div className="h-1.5 bg-gray-300 rounded w-1/2 mx-auto"></div>
            </div>
            <div className="h-px w-full mb-2" style={{ backgroundColor: selectedColor }}></div>
            <div className="h-1.5 bg-gray-300 rounded w-1/4 mb-1"></div>
            <div className="h-1 bg-gray-200 rounded w-full mb-0.5"></div>
            <div className="h-1 bg-gray-200 rounded w-5/6 mb-2"></div>
            <div className="h-px bg-gray-200 w-full mb-2"></div>
            <div className="h-1.5 bg-gray-300 rounded w-1/4 mb-1"></div>
            <div className="h-1 bg-gray-200 rounded w-4/5"></div>
        </div>
    ),
    academic: (selectedColor) => (
        <div className="flex flex-col h-full bg-white border border-gray-200 p-3">
            <div className="mb-2">
                <div className="h-3 bg-gray-800 rounded w-1/2 mb-1"></div>
                <div className="h-1.5 bg-gray-400 rounded w-1/3 mb-1"></div>
                <div className="h-px w-full" style={{ backgroundColor: selectedColor }}></div>
            </div>
            <div className="h-1.5 bg-gray-300 rounded w-1/4 mb-1 uppercase" style={{ fontSize: '7px', color: '#555' }}></div>
            <div className="h-1 bg-gray-200 rounded w-full mb-0.5"></div>
            <div className="h-1 bg-gray-200 rounded w-4/5 mb-2"></div>
            <div className="h-px bg-gray-200 w-full mb-1"></div>
            <div className="h-1 bg-gray-200 rounded w-3/4"></div>
        </div>
    ),
};

export default function TemplateSelectionModal({ onClose, onConfirm }) {
    const [selectedTemplate, setSelectedTemplate] = useState('moderncv');
    const [selectedColor, setSelectedColor] = useState('#3182ce');
    const [isInitiatingPayment, setIsInitiatingPayment] = useState(false);
    const [paymentError, setPaymentError] = useState('');

    const currentTemplate = templates.find(t => t.id === selectedTemplate);

    const handleConfirm = async () => {
        let finalColor = selectedColor;
        if (selectedTemplate === 'moderncv') {
            const colorMap = {
                '#319795': 'green',
                '#e53e3e': 'red',
                '#3182ce': 'blue',
                '#805ad5': 'purple',
                '#d69e2e': 'orange'
            };
            finalColor = colorMap[selectedColor] || 'blue';
        }

        const config = { templateId: selectedTemplate, isPremium: currentTemplate.isPremium, color: finalColor };

        if (!currentTemplate.isPremium) {
            onConfirm(config);
            return;
        }

        // Premium: initiate Paystack payment
        setIsInitiatingPayment(true);
        setPaymentError('');
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
            const token = await auth.currentUser?.getIdToken();
            if (!token) {
                setPaymentError('You must be signed in to purchase a premium template.');
                setIsInitiatingPayment(false);
                return;
            }
            const userEmail = auth.currentUser?.email;
            const res = await fetch(`${apiUrl}/api/initiate_payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    template_id: selectedTemplate,
                    amount: currentTemplate.price * 100, // kobo
                    email: userEmail
                })
            });
            if (!res.ok) throw new Error('Payment initiation failed');
            const { authorization_url, reference } = await res.json();

            // Open Paystack in a new tab and poll for completion
            const paymentWindow = window.open(authorization_url, '_blank');

            // Poll every 3s to check if payment is verified
            const pollInterval = setInterval(async () => {
                try {
                    const verifyRes = await fetch(`${apiUrl}/api/verify_payment/${reference}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (verifyRes.ok) {
                        const verifyData = await verifyRes.json();
                        if (verifyData.status === 'success') {
                            clearInterval(pollInterval);
                            paymentWindow?.close();
                            onConfirm(config);
                        }
                    }
                } catch (_) { /* keep polling */ }
            }, 3000);

            // Stop polling after 10 minutes
            setTimeout(() => clearInterval(pollInterval), 600000);
        } catch (err) {
            console.error(err);
            setPaymentError('Could not start payment. Please try again.');
        } finally {
            setIsInitiatingPayment(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900 bg-opacity-60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col relative animate-fade-in-up">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 sticky top-0 bg-white z-10">
                    <h2 className="text-2xl font-bold text-gray-800 font-serif tracking-tight">Select Your CV Layout</h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 md:p-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        {templates.map(tmpl => (
                            <div
                                key={tmpl.id}
                                onClick={() => setSelectedTemplate(tmpl.id)}
                                className={`relative border-2 rounded-2xl p-4 cursor-pointer transition-all duration-300 ${selectedTemplate === tmpl.id ? 'border-brand bg-brand/5 shadow-md -translate-y-1' : 'border-gray-200 hover:border-brand/40 hover:bg-gray-50'}`}
                            >
                                {tmpl.isPremium && (
                                    <span className="absolute top-3 right-3 bg-gradient-to-r from-amber-200 to-amber-100 text-amber-800 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm border border-amber-200 flex items-center gap-1">
                                        <Lock size={9} /> KES {tmpl.price}
                                    </span>
                                )}
                                {!tmpl.isPremium && (
                                    <span className="absolute top-3 right-3 bg-green-50 text-green-700 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-green-200">
                                        Free
                                    </span>
                                )}
                                {selectedTemplate === tmpl.id && (
                                    <div className="absolute top-3 left-3 text-brand bg-white rounded-full p-0.5 shadow-sm">
                                        <Check size={16} />
                                    </div>
                                )}
                                <h3 className="text-base font-bold text-gray-800 mt-4 mb-1 font-serif">{tmpl.name}</h3>
                                <p className="text-gray-500 text-xs leading-relaxed">{tmpl.description}</p>
                                {/* Visual Preview */}
                                <div className={`mt-4 h-32 rounded-xl overflow-hidden shadow-inner transition-opacity ${selectedTemplate === tmpl.id ? 'opacity-100' : 'opacity-60'}`}>
                                    {TEMPLATE_PREVIEWS[tmpl.id]?.(selectedColor)}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Color Selection */}
                    <div className="p-6 bg-gray-50/50 rounded-2xl border border-gray-100">
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Choose Accent Color</h3>
                        <div className="flex flex-wrap gap-4 mb-5">
                            {colors.map(c => (
                                <button
                                    key={c.value}
                                    onClick={() => setSelectedColor(c.value)}
                                    className={`w-10 h-10 rounded-full cursor-pointer transition-all duration-300 flex items-center justify-center shadow-sm ${selectedColor === c.value ? 'ring-4 ring-offset-4 ring-brand scale-110' : 'hover:scale-105 hover:shadow'}`}
                                    style={{ backgroundColor: c.value }}
                                    title={c.label}
                                >
                                    {selectedColor === c.value && <Check size={16} className="text-white drop-shadow-md" />}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg border border-gray-200 shadow-inner shrink-0 transition-colors" style={{ backgroundColor: selectedColor }} />
                            <div className="flex-1">
                                <label className="block text-xs text-gray-400 font-medium mb-1">Custom Hex Color</label>
                                <input
                                    type="text"
                                    value={selectedColor}
                                    onChange={e => {
                                        const v = e.target.value.startsWith('#') ? e.target.value : `#${e.target.value}`;
                                        setSelectedColor(v);
                                    }}
                                    placeholder="#3182ce"
                                    maxLength={7}
                                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand font-mono"
                                />
                            </div>
                            <input
                                type="color"
                                value={selectedColor}
                                onChange={e => setSelectedColor(e.target.value)}
                                className="w-10 h-9 border-0 rounded-lg cursor-pointer bg-transparent"
                                title="Open color wheel"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 md:px-8 py-5 border-t border-gray-100 bg-white rounded-b-2xl flex justify-between items-center sticky bottom-0">
                    <button onClick={onClose} className="px-5 py-2.5 font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors">
                        Go Back
                    </button>
                    <div className="flex flex-col items-end gap-1">
                        {paymentError && <p className="text-xs text-red-500">{paymentError}</p>}
                        <button
                            onClick={handleConfirm}
                            disabled={isInitiatingPayment}
                            className="px-8 py-3 rounded-xl font-bold text-white bg-brand hover:bg-brand-dark transition-colors shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {isInitiatingPayment ? (
                                <><Loader2 size={16} className="animate-spin" /> Processing Payment...</>
                            ) : currentTemplate?.isPremium ? (
                                <><Lock size={16} /> Pay KES {currentTemplate.price} & Generate</>
                            ) : (
                                'Generate Free CV'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
