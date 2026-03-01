import React, { useState, useRef, useEffect } from 'react';
import { Send, FileText, Download, Loader2, Sparkles, Mic, MicOff, Volume2, VolumeX, LogOut, CheckCircle2, Shield, X } from 'lucide-react';
import { auth, signInWithGoogle, logout } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import TemplateSelectionModal from './components/TemplateSelectionModal';
import AdminDashboard from './components/AdminDashboard';
import UserDashboard from './components/UserDashboard';

/* ─── Typing Indicator ─────────────────────────────────────── */
const TypingIndicator = () => (
  <div className="flex items-end gap-3 mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-md shrink-0">
      <Sparkles size={14} className="text-white" />
    </div>
    <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
      <div className="flex items-center gap-1.5 h-4">
        <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  </div>
);

/* ─── Chat Message ──────────────────────────────────────────── */
const ChatMessage = ({ message, isBot, timestamp }) => (
  <div className={`flex items-end gap-3 mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300 ${isBot ? '' : 'flex-row-reverse'}`}>
    {/* Avatar */}
    {isBot ? (
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-md shrink-0 self-start mt-1">
        <Sparkles size={14} className="text-white" />
      </div>
    ) : (
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center shadow-md shrink-0 self-start mt-1">
        <span className="text-white text-xs font-bold">U</span>
      </div>
    )}

    {/* Bubble */}
    <div className={`flex flex-col gap-1 max-w-[75%] ${isBot ? 'items-start' : 'items-end'}`}>
      <div className={`rounded-2xl px-4 py-3 shadow-sm text-sm leading-relaxed whitespace-pre-wrap ${isBot
          ? 'bg-white border border-gray-100 rounded-bl-sm text-gray-800'
          : 'bg-gradient-to-br from-teal-500 to-teal-700 rounded-br-sm text-white'
        }`}>
        {message}
      </div>
      {timestamp && (
        <span className="text-[10px] text-gray-400 px-1">{timestamp}</span>
      )}
    </div>
  </div>
);

/* ─── Terms of Service Modal ────────────────────────────────── */
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

/* ─── Helpers ───────────────────────────────────────────────── */
const formatTime = () => {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

/* ─── Main App ──────────────────────────────────────────────── */
function App() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hi there! 👋 I\'m Meshark AI, your personal CV building assistant.\n\nI\'ll ask you a few questions to get to know your professional background, then craft a beautiful, modern CV tailored just for you.\n\nOptionally, paste a job description and I\'ll tailor your CV to it.\n\nLet\'s start: What is your full name and the best phone number and email to reach you?',
      timestamp: formatTime()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pdfBlob, setPdfBlob] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isChatComplete, setIsChatComplete] = useState(false);
  const [cvData, setCvData] = useState(null);
  const [coverLetterUrl, setCoverLetterUrl] = useState(null);
  const [isGeneratingCoverLetter, setIsGeneratingCoverLetter] = useState(false);
  const [atsScore, setAtsScore] = useState(null);
  const [isFetchingAts, setIsFetchingAts] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showTemplateSelection, setShowTemplateSelection] = useState(false);
  const [selectedTemplateConfig, setSelectedTemplateConfig] = useState(null);
  const [showDashboard, setShowDashboard] = useState(false);
  const [currentRoute, setCurrentRoute] = useState(window.location.pathname + window.location.hash);
  const [jobDescription, setJobDescription] = useState('');

  // Terms of Service
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(
    () => localStorage.getItem('meshark_tos_accepted') === 'true'
  );

  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const handleAcceptTerms = () => {
    localStorage.setItem('meshark_tos_accepted', 'true');
    setHasAcceptedTerms(true);
  };

  useEffect(() => {
    const handleRouteChange = () => setCurrentRoute(window.location.pathname + window.location.hash);
    window.addEventListener('hashchange', handleRouteChange);
    window.addEventListener('popstate', handleRouteChange);
    return () => {
      window.removeEventListener('hashchange', handleRouteChange);
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev + (prev ? ' ' : '') + transcript);
      };
      recognition.onerror = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListen = () => {
    if (isListening) recognitionRef.current?.stop();
    else recognitionRef.current?.start();
  };

  const speakText = (text) => {
    if (isVoiceMode && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    setIsVoiceMode(false);
    const userMsg = input.trim();
    const ts = formatTime();
    setInput('');

    const newMessages = [...messages, { role: 'user', content: userMsg, timestamp: ts }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      let token = null;
      if (user) token = await user.getIdToken();
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${apiUrl}/api/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ message: userMsg, history: newMessages.slice(0, -1) })
      });

      if (!response.ok) {
        let errDetail = `Server error (${response.status})`;
        try { const b = await response.json(); errDetail = b.detail || errDetail; } catch (_) { }
        throw new Error(errDetail);
      }

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply, timestamp: formatTime() }]);
      speakText(data.reply);

      if (data.is_complete && data.extracted_data) {
        setIsChatComplete(true);
        setCvData(data.extracted_data);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMsg = error.message && !error.message.includes('fetch')
        ? `⚠️ ${error.message}`
        : "Sorry, I couldn't reach the server. Please check your connection and try again.";
      setMessages(prev => [...prev, { role: 'assistant', content: errorMsg, timestamp: formatTime() }]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isChatComplete && cvData) {
      setShowTemplateSelection(true);
      setIsChatComplete(false);
    }
  }, [isChatComplete, cvData]);

  const handleTemplateConfirm = (config) => {
    setShowTemplateSelection(false);
    setSelectedTemplateConfig(config);
    if (!user) setShowLoginPrompt(true);
    else generatePdf(cvData, config);
  };

  const handlePostLoginGenerate = async () => {
    try {
      const resultUser = await signInWithGoogle();
      if (resultUser && cvData && selectedTemplateConfig) {
        setShowLoginPrompt(false);
        generatePdf(cvData, selectedTemplateConfig);
      }
    } catch (error) { console.error('Login failed', error); }
  };

  const generatePdf = async (data, templateConfig) => {
    setIsGeneratingPdf(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      const token = await auth.currentUser.getIdToken();
      const response = await fetch(`${apiUrl}/api/generate_pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ cv_data: data, template_name: templateConfig.templateId, color: templateConfig.color })
      });
      if (!response.ok) throw new Error('PDF Generation failed');
      const blob = await response.blob();
      setPdfUrl(prev => { if (prev) window.URL.revokeObjectURL(prev); return window.URL.createObjectURL(blob); });
      setPdfBlob(blob);
      setShowPdfModal(true);
      fetchAtsScore(data, templateConfig);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Oops, I failed to generate the PDF. Please try again.', timestamp: formatTime() }]);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownload = () => {
    if (!pdfUrl) return;
    const a = document.createElement('a');
    a.href = pdfUrl; a.download = 'Meshark_AI_CV.pdf';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const generateCoverLetter = async () => {
    if (!cvData || !user) return;
    setIsGeneratingCoverLetter(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      const token = await auth.currentUser.getIdToken();
      const response = await fetch(`${apiUrl}/api/generate_cover_letter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ cv_data: cvData, job_description: jobDescription, company_name: '', hiring_manager: 'Hiring Manager' })
      });
      if (!response.ok) throw new Error('Cover letter generation failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setCoverLetterUrl(url);
      const a = document.createElement('a');
      a.href = url; a.download = 'Meshark_Cover_Letter.pdf';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I could not generate a cover letter right now.', timestamp: formatTime() }]);
    } finally { setIsGeneratingCoverLetter(false); }
  };

  const fetchAtsScore = async (data, templateConfig) => {
    if (!data || !user) return;
    setIsFetchingAts(true); setAtsScore(null);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`${apiUrl}/api/ats_score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ cv_data: data, template_name: templateConfig?.templateId || 'colorful', color: templateConfig?.color || '0056b3' })
      });
      if (!res.ok) throw new Error('ATS scoring failed');
      setAtsScore(await res.json());
    } catch (err) { console.error('ATS score error:', err); }
    finally { setIsFetchingAts(false); }
  };

  const sendCvEmail = async () => {
    if (!cvData || !user || !selectedTemplateConfig) return;
    setIsSendingEmail(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`${apiUrl}/api/send_cv_email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ cv_data: cvData, template_name: selectedTemplateConfig.templateId, color: selectedTemplateConfig.color })
      });
      if (!res.ok) throw new Error('Email failed');
      alert('CV sent to your email! 📧');
    } catch (err) { console.error(err); alert('Failed to send email. Please try again.'); }
    finally { setIsSendingEmail(false); }
  };

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
          setCvData(oldCvData);
          setIsChatComplete(true);
          setShowDashboard(false);
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `I've loaded your previous CV for ${oldCvData?.first_name || 'you'}. What would you like to update?`,
            timestamp: formatTime()
          }]);
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
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 max-w-3xl w-full mx-auto">
        {messages.map((msg, i) => (
          <ChatMessage
            key={i}
            message={msg.content}
            isBot={msg.role === 'assistant'}
            timestamp={msg.timestamp}
          />
        ))}

        {/* Typing indicator */}
        {isLoading && <TypingIndicator />}

        {/* PDF generating notice */}
        {isGeneratingPdf && (
          <div className="flex items-end gap-3 mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-md shrink-0">
              <Sparkles size={14} className="text-white" />
            </div>
            <div className="bg-white border border-teal-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2 text-sm text-teal-700 font-medium">
                <FileText size={15} className="animate-pulse" />
                Crafting your professional PDF…
              </div>
              <p className="text-xs text-gray-400 mt-0.5">Applying styles and compiling LaTeX</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Input Area ── */}
      <div className="bg-white/80 backdrop-blur-md border-t border-gray-200/70 px-4 sm:px-6 py-3 shrink-0 pb-[max(env(safe-area-inset-bottom),0.75rem)] sm:pb-3">
        <form onSubmit={handleSend} className="max-w-3xl mx-auto flex items-end gap-2">
          <div className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl flex items-end gap-2 px-4 py-2.5 focus-within:ring-2 focus-within:ring-teal-400/50 focus-within:border-teal-400 transition-all shadow-sm">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your response…"
              className="flex-1 bg-transparent text-gray-900 text-sm focus:outline-none resize-none leading-relaxed placeholder:text-gray-400 min-h-[24px] max-h-[120px]"
              rows="1"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); }
              }}
            />
            <button
              type="button"
              onClick={toggleListen}
              className={`p-1.5 rounded-xl transition-all shrink-0 ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-gray-400 hover:text-teal-600 hover:bg-teal-50'}`}
              title="Dictate with voice"
            >
              {isListening ? <Mic size={18} /> : <MicOff size={18} />}
            </button>
          </div>
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="w-11 h-11 flex items-center justify-center bg-gradient-to-br from-teal-500 to-teal-700 text-white rounded-2xl shadow-md hover:from-teal-600 hover:to-teal-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 shrink-0"
          >
            <Send size={18} />
          </button>
        </form>
        <p className="text-center text-[10px] text-gray-400 mt-2 hidden sm:block">
          Press <kbd className="bg-gray-100 px-1 rounded text-gray-500 font-mono text-[10px]">Enter</kbd> to send · <kbd className="bg-gray-100 px-1 rounded text-gray-500 font-mono text-[10px]">Shift+Enter</kbd> for new line
        </p>
      </div>

      {/* ── PDF Modal ── */}
      {showPdfModal && pdfBlob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/70 backdrop-blur-sm p-4 sm:p-8">
          <div className="w-full h-full max-w-5xl bg-white shadow-2xl rounded-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gray-900 text-white py-3 px-6 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <FileText size={18} className="text-teal-400" />
                <span className="font-semibold text-sm">Your Professional CV is Ready 🎉</span>
              </div>
              <div className="flex items-center gap-2">
                {cvData && (
                  <button onClick={generateCoverLetter} disabled={isGeneratingCoverLetter}
                    className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-full text-xs font-medium transition-all disabled:opacity-50">
                    {isGeneratingCoverLetter ? <><Loader2 size={13} className="animate-spin" /><span className="hidden sm:inline">Generating…</span></> : <><FileText size={13} /><span className="hidden sm:inline">Cover Letter</span></>}
                  </button>
                )}
                {cvData && (
                  <button onClick={sendCvEmail} disabled={isSendingEmail}
                    className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-full text-xs font-medium transition-all disabled:opacity-50">
                    {isSendingEmail ? <><Loader2 size={13} className="animate-spin" /><span className="hidden sm:inline">Sending…</span></> : <><Send size={13} /><span className="hidden sm:inline">Email CV</span></>}
                  </button>
                )}
                <button onClick={handleDownload}
                  className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-1.5 rounded-full text-sm font-medium transition-all shadow">
                  <Download size={15} />
                  <span className="hidden sm:inline">Download PDF</span>
                </button>
                <button onClick={() => setShowPdfModal(false)} className="p-1.5 text-gray-400 hover:text-white transition-colors ml-1">
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
                <div className="flex items-center gap-2 text-xs text-gray-400"><Loader2 size={13} className="animate-spin" />Calculating ATS score…</div>
              ) : atsScore ? (
                <>
                  <div className={`text-xl font-extrabold ${atsScore.score >= 80 ? 'text-green-600' : atsScore.score >= 60 ? 'text-amber-500' : 'text-red-500'}`}>
                    {atsScore.score}/100
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-600">{atsScore.grade}</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(atsScore.feedback || []).slice(0, 3).map((tip, i) => (
                      <span key={i} className="text-[11px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full truncate max-w-[200px]">💡 {tip}</span>
                    ))}
                  </div>
                </>
              ) : <div className="text-xs text-gray-300">ATS score will appear here</div>}
            </div>
          </div>
        </div>
      )}

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
