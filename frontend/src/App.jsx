import React, { useState, useRef, useEffect } from 'react';
import { Send, FileText, Download, Loader2, Sparkles, Mic, MicOff, Volume2, VolumeX, LogOut, X } from 'lucide-react';
import TypingIndicator from './components/chat/TypingIndicator';
import ChatMessage from './components/chat/ChatMessage';
import TermsModal from './components/common/TermsModal';
import MessageList from './components/chat/MessageList';
import InputArea from './components/chat/InputArea';
import CVPreviewModal from './components/cv/CVPreviewModal';
import { useChat } from './hooks/useChat';
import { useCV } from './hooks/useCV';
import { auth, signInWithGoogle, logout } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import TemplateSelectionModal from './components/TemplateSelectionModal';
import AdminDashboard from './components/AdminDashboard';
import UserDashboard from './components/UserDashboard';


function App() {
  const [cvData, setCvData] = useState(() => {
    const saved = localStorage.getItem('meshark_cv_data');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { }
    }
    return null;
  });
  const [jobDescription, setJobDescription] = useState(() => localStorage.getItem('meshark_job_desc') || '');

  useEffect(() => {
    if (cvData) {
      localStorage.setItem('meshark_cv_data', JSON.stringify(cvData));
    } else {
      localStorage.removeItem('meshark_cv_data');
    }
  }, [cvData]);

  useEffect(() => {
    localStorage.setItem('meshark_job_desc', jobDescription);
  }, [jobDescription]);

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showTemplateSelection, setShowTemplateSelection] = useState(false);
  const [selectedTemplateConfig, setSelectedTemplateConfig] = useState(null);
  const [showDashboard, setShowDashboard] = useState(false);
  const [currentRoute, setCurrentRoute] = useState(window.location.pathname + window.location.hash);

  const {
    messages, setMessages,
    input, setInput,
    isLoading,
    isListening,
    isVoiceMode, setIsVoiceMode,
    isChatComplete, setIsChatComplete,
    messagesEndRef, textareaRef,
    handleSend,
    toggleListen,
    loadPreviousCvChat,
    formatTime
  } = useChat(user, setCvData, setShowTemplateSelection);

  const {
    pdfBlob,
    pdfUrl,
    isGeneratingPdf,
    showPdfModal, setShowPdfModal,
    isGeneratingCoverLetter,
    atsScore,
    isFetchingAts,
    isSendingEmail,
    generatePdf,
    handleDownload,
    generateCoverLetter,
    sendCvEmail
  } = useCV(user);

  /* ── Loading screen ── */
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-lg">
            <Sparkles className="text-white" size={28} />
          </div>
          <Loader2 className="animate-spin text-teal-500" size={24} />
        </div>
      </div>
    );
  }

  /* ── Admin route ── */
  if (currentRoute.includes('/admin') || currentRoute.includes('#admin')) {
    return <AdminDashboard user={user} />;
  }

  /* ── User Dashboard ── */
  if (showDashboard) {
    return (
      <UserDashboard
        user={user}
        onBack={() => setShowDashboard(false)}
        onEdit={(oldCvData) => {
          setShowDashboard(false);
          loadPreviousCvChat(oldCvData);
        }}
      />
    );
  }

  /* ── Terms of Service screen ── */
  if (!hasAcceptedTerms) {
    return <TermsModal onAccept={handleAcceptTerms} />;
  }

  /* ── Main Chat Interface ── */
  return (
    <div className="min-h-[100dvh] flex flex-col font-sans" style={{ background: 'linear-gradient(135deg, #f0fdfa 0%, #f8fafc 60%, #f0f9ff 100%)' }}>

      {/* ── Header ── */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/70 px-4 sm:px-6 py-3 flex items-center justify-between shadow-sm z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-md">
              <Sparkles className="text-white" size={20} />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white rounded-full" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">Meshark AI</h1>
            <p className="text-[11px] text-green-500 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block" />
              Online · CV Builder
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {user && (
            <button
              onClick={() => setShowDashboard(true)}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-teal-600 bg-gray-100 hover:bg-teal-50 px-3 py-1.5 rounded-full transition-all"
            >
              <FileText size={14} />
              <span className="hidden sm:inline">My CVs</span>
            </button>
          )}
          <button
            onClick={() => { setIsVoiceMode(!isVoiceMode); if (isVoiceMode && 'speechSynthesis' in window) window.speechSynthesis.cancel(); }}
            className={`p-2 rounded-full transition-all ${isVoiceMode ? 'bg-teal-100 text-teal-600' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
            title="Toggle AI Voice"
          >
            {isVoiceMode ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
          {user && (
            <button onClick={logout} className="p-2 rounded-full bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all" title="Sign Out">
              <LogOut size={16} />
            </button>
          )}
          {pdfBlob && (
            <button
              onClick={() => setShowPdfModal(true)}
              className="flex items-center gap-1.5 bg-teal-600 text-white px-3 py-1.5 rounded-full text-xs font-medium hover:bg-teal-700 transition-all shadow-sm"
            >
              <FileText size={14} />
              <span>View CV</span>
            </button>
          )}
        </div>
      </header>

      {/* ── Chat Area ── */}
      <MessageList
        messages={messages}
        isLoading={isLoading}
        isGeneratingPdf={isGeneratingPdf}
        messagesEndRef={messagesEndRef}
      />

      {/* ── Input Area ── */}
      <InputArea
        input={input}
        setInput={setInput}
        handleSend={handleSend}
        isLoading={isLoading}
        isListening={isListening}
        toggleListen={toggleListen}
        textareaRef={textareaRef}
      />

      {/* ── PDF Modal ── */}
      <CVPreviewModal
        pdfUrl={pdfUrl}
        pdfBlob={pdfBlob}
        cvData={cvData}
        isGeneratingCoverLetter={isGeneratingCoverLetter}
        isSendingEmail={isSendingEmail}
        isFetchingAts={isFetchingAts}
        atsScore={atsScore}
        onClose={() => setShowPdfModal(false)}
        onDownload={handleDownload}
        onGenerateCoverLetter={() => generateCoverLetter(cvData, jobDescription)}
        onSendEmail={() => sendCvEmail(cvData, selectedTemplateConfig)}
      />

      {/* ── Template Selection ── */}
      {showTemplateSelection && (
        <TemplateSelectionModal onClose={() => setShowTemplateSelection(false)} onConfirm={handleTemplateConfirm} />
      )}

      {/* ── Login Prompt ── */}
      {showLoginPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/70 backdrop-blur-sm p-4">
          <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center flex flex-col items-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mb-5">
              <FileText className="text-teal-600" size={32} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Almost Done!</h2>
            <p className="text-gray-500 mb-7 text-sm">Sign in to generate, save, and download your finalized CV.</p>
            <button onClick={handlePostLoginGenerate}
              className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-6 py-3 rounded-xl shadow-sm transition-all font-medium">
              <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg"><g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)"><path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z" /><path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z" /><path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z" /><path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z" /></g></svg>
              Continue with Google
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
