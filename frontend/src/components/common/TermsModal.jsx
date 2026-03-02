import React from 'react';
import { Shield, CheckCircle2 } from 'lucide-react';

const TermsModal = ({ onAccept }) => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/80 backdrop-blur-md p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="bg-gradient-to-r from-teal-600 to-teal-500 px-6 pt-8 pb-6 text-center">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Shield size={28} className="text-white" />
                </div>
                <h2 className="text-xl font-bold text-white">Before You Start</h2>
                <p className="text-teal-100 text-sm mt-1">Please read and accept our Terms of Service</p>
            </div>

            {/* Terms Content */}
            <div className="px-6 py-5 max-h-64 overflow-y-auto border-b border-gray-100">
                <div className="space-y-4 text-sm text-gray-600">
                    <section>
                        <h3 className="font-semibold text-gray-800 mb-1">1. Data Collection</h3>
                        <p>By using Meshark AI CV Builder, you agree that we collect the personal information you provide (name, contact details, work history) solely for the purpose of generating your CV. Your data is not sold or shared with third parties.</p>
                    </section>
                    <section>
                        <h3 className="font-semibold text-gray-800 mb-1">2. AI-Generated Content</h3>
                        <p>Meshark AI uses artificial intelligence to help build your CV. While we strive for accuracy, you are responsible for reviewing and verifying all generated content before using it professionally.</p>
                    </section>
                    <section>
                        <h3 className="font-semibold text-gray-800 mb-1">3. Account & Authentication</h3>
                        <p>You must sign in with a valid Google account to save and download your CV. You agree to provide accurate information and are responsible for activity under your account.</p>
                    </section>
                    <section>
                        <h3 className="font-semibold text-gray-800 mb-1">4. Usage Policy</h3>
                        <p>This service is for personal, legitimate career purposes only. Misuse, including creating fraudulent CVs or attempting to abuse the platform, will result in account termination.</p>
                    </section>
                    <section>
                        <h3 className="font-semibold text-gray-800 mb-1">5. Premium Features</h3>
                        <p>Certain templates require a one-time payment via Paystack. All purchases are final. By completing payment, you agree to our refund policy.</p>
                    </section>
                </div>
            </div>

            {/* Accept Button */}
            <div className="px-6 py-5 bg-gray-50">
                <p className="text-xs text-gray-400 text-center mb-4">By clicking Accept, you agree to our Terms of Service and Privacy Policy.</p>
                <button
                    onClick={onAccept}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-600 to-teal-500 text-white font-semibold py-3.5 rounded-xl hover:from-teal-700 hover:to-teal-600 transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
                >
                    <CheckCircle2 size={18} />
                    I Accept — Start Building My CV
                </button>
            </div>
        </div>
    </div>
);

export default TermsModal;
