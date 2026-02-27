import React, { useState, useRef, useEffect } from 'react';
import { Send, FileText, Download, Loader2, Sparkles, Mic, MicOff, Volume2, VolumeX, LogOut } from 'lucide-react';
import { auth, signInWithGoogle, logout } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import TemplateSelectionModal from './components/TemplateSelectionModal';
import AdminDashboard from './components/AdminDashboard';

const ChatMessage = ({ message, isBot }) => (
  <div className={`flex w-full ${isBot ? 'justify-start' : 'justify-end'} mb-4`}>
    <div className={`max-w-[80%] rounded-2xl p-4 ${isBot ? 'bg-white shadow-sm border border-gray-100' : 'bg-brand text-white shadow-md'}`}>
      <div className="flex items-center gap-2 mb-1">
        {isBot && <Sparkles size={16} className="text-brand" />}
        <span className={`text-xs font-medium ${isBot ? 'text-gray-500' : 'text-brand-light'}`}>
          {isBot ? 'Meshark AI' : 'You'}
        </span>
      </div>
      <p className="text-sm leading-relaxed whitespace-pre-wrap">{message}</p>
    </div>
  </div>
);

function App() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi there! I am Meshark AI, your personal CV building assistant. I will ask you a few questions to get to know your professional background, and then I will generate a beautiful, modern CV for you. Let\'s start with the basics: What is your full name and the best phone number and email to reach you?' }
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

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showTemplateSelection, setShowTemplateSelection] = useState(false);
  const [selectedTemplateConfig, setSelectedTemplateConfig] = useState(null);
  const [currentRoute, setCurrentRoute] = useState(window.location.pathname + window.location.hash);

  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);

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
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
    }
  };

  const speakText = (text) => {
    if (isVoiceMode && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    setIsVoiceMode(false);
    const userMsg = input.trim();
    setInput('');
    // Ensure we keep the full history when sending a new message
    const newMessages = [...messages, { role: 'user', content: userMsg }];
    setMessages(newMessages);

    // Add an empty assistant message to append streaming chunks to
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
    setIsLoading(true);

    try {
      let token = null;
      if (user) {
        token = await user.getIdToken();
      }
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';

      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`${apiUrl}/api/chat`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          message: userMsg,
          history: newMessages.slice(0, -1) // Exclude the message we just added
        })
      });

      if (!response.ok) throw new Error('Network response was not ok');

      const data = await response.json();

      setMessages(prev => {
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        updated[lastIdx] = { ...updated[lastIdx], content: data.reply };
        return updated;
      });

      speakText(data.reply);

      if (data.is_complete && data.extracted_data) {
        setIsChatComplete(true);
        setCvData(data.extracted_data);
      }

    } catch (error) {
      console.error("Error communicating with AI:", error);
      setMessages(prev => {
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        updated[lastIdx] = { role: 'assistant', content: "Sorry, I encountered an error connecting to the server. Please try again." };
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isChatComplete && cvData) {
      setShowTemplateSelection(true);
      setIsChatComplete(false); // Consume the complete event here
    }
  }, [isChatComplete, cvData]);

  const handleTemplateConfirm = (config) => {
    setShowTemplateSelection(false);
    setSelectedTemplateConfig(config);
    if (!user) {
      setShowLoginPrompt(true);
    } else {
      generatePdf(cvData, config);
    }
  };

  const handlePostLoginGenerate = async () => {
    try {
      const resultUser = await signInWithGoogle();
      if (resultUser && cvData && selectedTemplateConfig) {
        setShowLoginPrompt(false);
        generatePdf(cvData, selectedTemplateConfig);
      }
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const generatePdf = async (data, templateConfig) => {
    setIsGeneratingPdf(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      const token = await auth.currentUser.getIdToken();

      const response = await fetch(`${apiUrl}/api/generate_pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          cv_data: data,
          template_name: templateConfig.templateId,
          color: templateConfig.color
        })
      });

      if (!response.ok) throw new Error('PDF Generation failed');

      const blob = await response.blob();
      // Revoke any previously allocated object URL
      setPdfUrl(prev => {
        if (prev) window.URL.revokeObjectURL(prev);
        return window.URL.createObjectURL(blob);
      });
      setPdfBlob(blob);
      setShowPdfModal(true);

    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Oops, I failed to generate the PDF.' }]);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownload = () => {
    if (!pdfUrl) return;
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = 'Meshark_AI_CV.pdf';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-brand" size={48} />
      </div>
    );
  }

  // Handle Admin Route exclusively
  if (currentRoute.includes('/admin') || currentRoute.includes('#admin')) {
    return <AdminDashboard user={user} />;
  }

  return (
    <div className="min-h-[100dvh] bg-gray-50 flex font-sans relative">
      {/* Chat Section */}
      <div className="flex flex-col w-full max-w-4xl mx-auto h-[100dvh] transition-all duration-500 ease-in-out">

        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-brand/10 p-2 rounded-lg">
              <Sparkles className="text-brand" size={24} />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand to-brand-light">
                Meshark AI Builder
              </h1>
              <p className="text-xs text-gray-500 font-medium">Smart CV Assistant</p>
            </div>
          </div>

          {/* Action Area */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setIsVoiceMode(!isVoiceMode);
                if (isVoiceMode && 'speechSynthesis' in window) window.speechSynthesis.cancel();
              }}
              className={`p-2 rounded-full transition-colors ${isVoiceMode ? 'bg-brand/10 text-brand' : 'bg-gray-100 text-gray-400'}`}
              title="Toggle AI Voice Response"
            >
              {isVoiceMode ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
            {user && (
              <button
                onClick={logout}
                className="p-2 rounded-full transition-colors bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500"
                title="Sign Out"
              >
                <LogOut size={18} />
              </button>
            )}
            {pdfBlob && (
              <button
                onClick={() => setShowPdfModal(true)}
                className="flex items-center gap-2 bg-brand/10 text-brand px-4 py-2 rounded-full font-medium hover:bg-brand hover:text-white transition-colors text-sm shadow-sm"
              >
                <FileText size={16} />
                <span className="hidden sm:inline">View CV</span>
              </button>
            )}
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2 bg-[#fafafa]">
          {messages.map((msg, i) => (
            <ChatMessage key={i} message={msg.content} isBot={msg.role === 'assistant'} />
          ))}
          {isLoading && (
            <div className="flex w-full justify-start mb-4">
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-2">
                <Loader2 size={16} className="text-brand animate-spin" />
                <span className="text-sm text-gray-500">Meshark AI is thinking...</span>
              </div>
            </div>
          )}
          {isGeneratingPdf && (
            <div className="flex w-full justify-start mb-4">
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-brand/30 flex flex-col gap-2 items-start bg-brand/5">
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-brand animate-pulse" />
                  <span className="text-sm font-semibold text-brand">Crafting your professional PDF...</span>
                </div>
                <p className="text-xs text-gray-500">Expanding points, applying dynamic styles, and compiling LaTeX.</p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-3 sm:p-4 bg-white border-t border-gray-200 shadow-sm shrink-0 pb-[max(env(safe-area-inset-bottom),0.75rem)] sm:pb-4">
          <form onSubmit={handleSend} className="max-w-4xl mx-auto relative flex items-end">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your response here..."
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl pl-4 pr-24 py-3 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-all resize-none shadow-inner text-sm sm:text-base"
              rows="1"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
            />
            <div className="absolute right-2 bottom-2 flex items-center gap-2">
              <button
                type="button"
                onClick={toggleListen}
                className={`p-2 rounded-lg transition-colors shadow-sm ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                title="Dictate with voice"
              >
                {isListening ? <Mic size={18} /> : <MicOff size={18} />}
              </button>
              <button
                type="submit"
                disabled={isLoading || (!input.trim() && !isListening)}
                className="p-2 bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                <Send size={18} />
              </button>
            </div>
          </form>
          <p className="text-center text-[10px] text-gray-400 mt-2 font-medium hidden sm:block">Press ENTER to send, SHIFT+ENTER for new line</p>
        </div>
      </div>

      {/* Full Screen PDF Modal Window */}
      {showPdfModal && pdfBlob && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 sm:p-8">
          <div className="w-full h-full max-w-5xl bg-white shadow-2xl rounded-2xl overflow-hidden border border-gray-200 flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gray-800 text-white py-3 px-6 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <FileText size={18} className="text-brand-light" />
                <span className="font-semibold text-sm tracking-wide">Your Professional CV is Ready</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 bg-brand hover:bg-brand-dark text-white px-4 py-1.5 rounded-full shadow transition-colors text-sm font-medium"
                >
                  <Download size={16} />
                  <span className="hidden sm:inline">Download PDF</span>
                </button>
                <button
                  onClick={() => setShowPdfModal(false)}
                  className="text-gray-400 hover:text-white p-1 ml-2 transition-colors"
                  aria-label="Close modal"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
            </div>

            {/* Modal Content - PDF iFrame */}
            <div className="flex-1 w-full bg-gray-100 relative">
              <iframe
                src={pdfUrl}
                className="absolute inset-0 w-full h-full border-0"
                title="CV Preview"
              />
            </div>
          </div>
        </div>
      )}

      {/* Template Selection Modal */}
      {showTemplateSelection && (
        <TemplateSelectionModal
          onClose={() => setShowTemplateSelection(false)}
          onConfirm={handleTemplateConfirm}
        />
      )}

      {/* Login Prompt Modal for PDF Generation */}
      {showLoginPrompt && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full text-center flex flex-col items-center border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-brand/10 p-4 rounded-2xl mb-6">
              <FileText className="text-brand" size={48} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Almost Done!
            </h2>
            <p className="text-gray-500 mb-8 text-sm">Sign in to generate, save, and download your finalized CV.</p>
            <button
              onClick={handlePostLoginGenerate}
              className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3 rounded-xl shadow-sm transition-all font-medium"
            >
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
