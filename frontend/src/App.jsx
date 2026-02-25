import React, { useState, useRef, useEffect } from 'react';
import { Send, FileText, Download, Loader2, Sparkles, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

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
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(true);

  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);

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

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');

    const newHistory = [...messages, { role: 'user', content: userMsg }];
    setMessages(newHistory);
    setIsLoading(true);

    try {
      // Send to our backend
      const response = await fetch('http://localhost:8080/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          history: messages
        })
      });

      if (!response.ok) throw new Error('API Error');
      const data = await response.json();

      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      speakText(data.reply);

      // Trigger PDF generation if ready
      if (data.is_complete && data.extracted_data) {
        generatePdf(data.extracted_data);
      }

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error connecting to the server. Please ensure the backend is running.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const generatePdf = async (cvData) => {
    setIsGeneratingPdf(true);
    try {
      // Pick template
      const templates = ['colorful', 'moderncv'];
      const randomTemplate = templates[Math.floor(Math.random() * templates.length)];

      // Random brand color for the template
      const colors = ['#319795', '#e53e3e', '#3182ce', '#805ad5', '#d69e2e'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];

      const response = await fetch('http://localhost:8080/api/generate_pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cv_data: cvData,
          template_name: randomTemplate,
          color: randomTemplate === 'moderncv' ? 'blue' : randomColor
        })
      });

      if (!response.ok) throw new Error('PDF Generation failed');

      const blob = await response.blob();
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
    if (!pdfBlob) return;
    const url = window.URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Meshark_AI_CV.pdf';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans relative">
      {/* Chat Section */}
      <div className="flex flex-col w-full max-w-4xl mx-auto h-screen transition-all duration-500 ease-in-out">

        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-brand/10 p-2 rounded-lg">
              <Sparkles className="text-brand" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand to-brand-light">
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
        <div className="p-3 sm:p-4 bg-white border-t border-gray-200 shadow-sm shrink-0">
          <form onSubmit={handleSend} className="max-w-4xl mx-auto relative flex items-end">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your response here..."
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl pl-4 pr-14 py-3 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-all resize-none shadow-inner text-sm sm:text-base"
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
                src={`${window.URL.createObjectURL(pdfBlob)}#toolbar=0&view=FitH`}
                className="absolute inset-0 w-full h-full border-0"
                title="CV Preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
