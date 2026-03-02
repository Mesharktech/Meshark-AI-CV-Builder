import React from 'react';
import { FileText, Download, Loader2, Send, X } from 'lucide-react';

const CVPreviewModal = ({
    pdfUrl,
    pdfBlob,
    cvData,
    isGeneratingCoverLetter,
    isSendingEmail,
    isFetchingAts,
    atsScore,
    onClose,
    onDownload,
    onGenerateCoverLetter,
    onSendEmail
}) => {
    if (!pdfBlob) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/70 backdrop-blur-sm p-4 sm:p-8">
            <div className="w-full h-full max-w-5xl bg-white shadow-2xl rounded-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
                <div className="bg-gray-900 text-white py-3 px-6 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <FileText size={18} className="text-teal-400" />
                        <span className="font-semibold text-sm">Your Professional CV is Ready 🎉</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {cvData && (
                            <button
                                onClick={onGenerateCoverLetter}
                                disabled={isGeneratingCoverLetter}
                                className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-full text-xs font-medium transition-all disabled:opacity-50"
                            >
                                {isGeneratingCoverLetter ? (
                                    <><Loader2 size={13} className="animate-spin" /><span className="hidden sm:inline">Generating…</span></>
                                ) : (
                                    <><FileText size={13} /><span className="hidden sm:inline">Cover Letter</span></>
                                )}
                            </button>
                        )}
                        {cvData && (
                            <button
                                onClick={onSendEmail}
                                disabled={isSendingEmail}
                                className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-full text-xs font-medium transition-all disabled:opacity-50"
                            >
                                {isSendingEmail ? (
                                    <><Loader2 size={13} className="animate-spin" /><span className="hidden sm:inline">Sending…</span></>
                                ) : (
                                    <><Send size={13} /><span className="hidden sm:inline">Email CV</span></>
                                )}
                            </button>
                        )}
                        <button
                            onClick={onDownload}
                            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-1.5 rounded-full text-sm font-medium transition-all shadow"
                        >
                            <Download size={15} />
                            <span className="hidden sm:inline">Download PDF</span>
                        </button>
                        <button
                            onClick={onClose}
                            className="p-1.5 text-gray-400 hover:text-white transition-colors ml-1"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>
                <div className="flex-1 w-full bg-gray-100 relative">
                    <iframe src={pdfUrl} className="absolute inset-0 w-full h-full border-0" title="CV Preview" />
                </div>
                {/* ATS Score */}
                <div className="shrink-0 border-t border-gray-100 bg-gray-50 px-6 py-3 flex items-center gap-4">
                    {isFetchingAts ? (
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                            <Loader2 size={13} className="animate-spin" />Calculating ATS score…
                        </div>
                    ) : atsScore ? (
                        <>
                            <div className={`text-xl font-extrabold ${atsScore.score >= 80 ? 'text-green-600' : atsScore.score >= 60 ? 'text-amber-500' : 'text-red-500'}`}>
                                {atsScore.score}/100
                            </div>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-600">
                                {atsScore.grade}
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                                {(atsScore.feedback || []).slice(0, 3).map((tip, i) => (
                                    <span key={i} className="text-[11px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full truncate max-w-[200px]">
                                        💡 {tip}
                                    </span>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="text-xs text-gray-300">ATS score will appear here</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CVPreviewModal;
