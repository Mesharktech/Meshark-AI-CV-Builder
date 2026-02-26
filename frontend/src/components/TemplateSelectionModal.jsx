import React, { useState } from 'react';
import { X, Check } from 'lucide-react';

const templates = [
    {
        id: 'moderncv',
        name: 'Modern (Free)',
        description: 'A clean, professional two-column layout perfect for traditional roles.',
        isPremium: false
    },
    {
        id: 'colorful',
        name: 'Creative Colors (Premium)',
        description: 'Stand out from the crowd with vibrant header sections. Ideal for modern digital roles.',
        isPremium: true
    }
];

const colors = [
    { label: 'Teal', value: '#319795' },
    { label: 'Red', value: '#e53e3e' },
    { label: 'Blue', value: '#3182ce' },
    { label: 'Purple', value: '#805ad5' },
    { label: 'Gold', value: '#d69e2e' }
];

export default function TemplateSelectionModal({ onClose, onConfirm }) {
    const [selectedTemplate, setSelectedTemplate] = useState('moderncv');
    const [selectedColor, setSelectedColor] = useState('#3182ce');

    const handleConfirm = () => {
        const template = templates.find(t => t.id === selectedTemplate);
        // Map colors for moderncv which uses string names instead of hex
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

        onConfirm({
            templateId: selectedTemplate,
            isPremium: template.isPremium,
            color: finalColor
        });
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        {templates.map(tmpl => (
                            <div
                                key={tmpl.id}
                                onClick={() => setSelectedTemplate(tmpl.id)}
                                className={`relative border-2 rounded-2xl p-6 cursor-pointer transition-all duration-300 ${selectedTemplate === tmpl.id ? 'border-brand bg-brand/5 shadow-md transform -translate-y-1' : 'border-gray-200 hover:border-brand/40 hover:bg-gray-50'}`}
                            >
                                {tmpl.isPremium && (
                                    <span className="absolute top-4 right-4 bg-gradient-to-r from-amber-200 to-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider h-fit shadow-sm border border-amber-200">
                                        Premium
                                    </span>
                                )}
                                {selectedTemplate === tmpl.id && (
                                    <div className="absolute top-4 right-4 text-brand bg-white rounded-full p-0.5 shadow-sm">
                                        <Check size={20} />
                                    </div>
                                )}

                                <h3 className="text-xl font-bold text-gray-800 mb-2 mr-16 font-serif">{tmpl.name}</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">{tmpl.description}</p>

                                {/* Visual Placeholder for the template */}
                                <div className={`mt-6 h-36 rounded-xl overflow-hidden flex flex-col shadow-inner transition-opacity ${selectedTemplate === tmpl.id ? 'opacity-100' : 'opacity-60 grayscale-[0.2]'}`}>
                                    {tmpl.id === 'moderncv' ? (
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
                                    ) : (
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
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Color Selection */}
                    <div className="p-6 bg-gray-50/50 rounded-2xl border border-gray-100">
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Choose Accent Color</h3>
                        <div className="flex flex-wrap gap-4">
                            {colors.map(c => (
                                <button
                                    key={c.value}
                                    onClick={() => setSelectedColor(c.value)}
                                    className={`w-12 h-12 rounded-full cursor-pointer transition-all duration-300 flex items-center justify-center shadow-sm ${selectedColor === c.value ? 'ring-4 ring-offset-4 ring-brand scale-110' : 'hover:scale-105 hover:shadow'}`}
                                    style={{ backgroundColor: c.value }}
                                    title={c.label}
                                >
                                    {selectedColor === c.value && <Check size={20} className="text-white drop-shadow-md" />}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 md:px-8 py-5 border-t border-gray-100 bg-white rounded-b-2xl flex justify-between items-center sticky bottom-0">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                        Go Back
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="px-8 py-3 rounded-xl font-bold text-white bg-brand hover:bg-brand-dark transition-colors shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
                    >
                        {templates.find(t => t.id === selectedTemplate)?.isPremium ? 'Continue to Payment' : 'Generate Free CV'}
                    </button>
                </div>
            </div>
        </div>
    );
}
