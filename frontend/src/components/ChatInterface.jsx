import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, RotateCcw } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import TemplateSelectionModal from './TemplateSelectionModal';

export default function ChatInterface({ user }) {
    const STORAGE_KEY = `chat_messages_${user?.uid}`;
    const [messages, setMessages] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    });
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [cvData, setCvData] = useState(null);
    const [isExtracting, setIsExtracting] = useState(false);
    const messagesEndRef = useRef(null);

    const getProgress = () => {
        const text = messages.map(m => m.content).join(' ').toLowerCase();
        let count = 0;
        if (text.includes('name') || text.includes('email')) count++;
        if (text.includes('dob') || text.includes('nationality')) count++;
        if (text.includes('summary') || text.includes('profile')) count++;
        if (text.includes('degree') || text.includes('university')) count++;
        if (text.includes('role') || text.includes('experience')) count++;
        if (text.includes('skill') || text.includes('proficient')) count++;
        if (text.includes('language') || text.includes('speak')) count++;
        if (text.includes('hobb') || text.includes('interest')) count++;
        if (text.includes('refere') || text.includes('contact')) count++;
        return Math.min(Math.max(1, count), 9);
    };

    useEffect(() => {
        if (user) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
        }
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, user, STORAGE_KEY]);

    const extractData = async (chatHistory) => {
        setIsExtracting(true);
        const toastId = toast.loading('Extracting your CV data...');
        try {
            const token = await user.getIdToken();
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/chat/extract`, { messages: chatHistory }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCvData(res.data.cv_data);
            toast.success('CV Data extracted successfully!', { id: toastId });
        } catch (err) {
            toast.error('Failed to extract data. Please try again.', { id: toastId });
            setMessages([...chatHistory, { role: 'assistant', content: 'There was an error compiling the CV. Type anything to try again or click Start New CV.' }]);
        } finally {
            setIsExtracting(false);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        // Check extraction retry state essentially
        if (messages.length > 0 && messages[messages.length - 1].content.includes('error compiling')) {
            extractData(messages.filter(m => !m.content.includes('error compiling')));
            setInput('');
            return;
        }

        const newMsg = { role: 'user', content: input };
        const chatHistory = [...messages, newMsg];
        setMessages(chatHistory);
        setInput('');
        setIsLoading(true);

        try {
            const token = await user.getIdToken();
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/chat`, { messages: chatHistory }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            let replyContent = res.data.reply;
            const isComplete = replyContent.includes('[ALL_DATA_COLLECTED]');
            if (isComplete) {
                replyContent = replyContent.replace('[ALL_DATA_COLLECTED]', '').trim();
            }

            const updatedHistory = [...chatHistory, { role: 'assistant', content: replyContent }];
            setMessages(updatedHistory);

            if (isComplete) {
                await extractData(updatedHistory);
            }
        } catch (err) {
            toast.error('Failed to send message');
            setMessages(messages);
        } finally {
            setIsLoading(false);
        }
    };

    const startNewCV = () => {
        setMessages([]);
        setCvData(null);
        localStorage.removeItem(STORAGE_KEY);
    };

    if (cvData) {
        return (
            <div className="w-full flex flex-col items-center">
                <TemplateSelectionModal cvData={cvData} user={user} onRestart={startNewCV} />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[600px] w-full max-w-4xl mx-auto bg-white dark:bg-gray-900 shadow-xl rounded-lg overflow-hidden border dark:border-gray-800">
            <div className="flex justify-between items-center p-4 border-b dark:border-gray-800">
                <div>
                    <h2 className="text-xl font-bold dark:text-white">CV Interview</h2>
                    <p className="text-sm text-gray-500">Section {getProgress()} of 9</p>
                </div>
                <button onClick={startNewCV} aria-label="Start New CV" className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 rounded text-sm font-medium dark:text-white transition-colors">
                    <RotateCcw className="w-4 h-4" /> Start New CV
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                    <div className="text-center text-gray-500 mt-10">
                        <p>Welcome to Meshark AI! Say "Hi" to start building your CV.</p>
                    </div>
                )}
                {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] rounded-lg p-3 whitespace-pre-wrap ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 dark:text-gray-200'}`}>
                            {m.content}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg flex items-center gap-2 dark:text-gray-300">
                            <Loader2 className="w-4 h-4 animate-spin" /> Thinking...
                        </div>
                    </div>
                )}
                {isExtracting && (
                    <div className="flex justify-center my-4">
                        <div className="bg-yellow-100 text-yellow-800 p-3 rounded-lg flex items-center gap-2 font-medium">
                            <Loader2 className="w-5 h-5 animate-spin" /> Compiling your answers into a professional CV structure...
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="p-4 border-t dark:border-gray-800 bg-white dark:bg-gray-900">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={isLoading || isExtracting}
                        className="flex-1 border dark:border-gray-700 bg-transparent dark:text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        placeholder="Type your response..."
                    />
                    <button
                        type="submit"
                        disabled={isLoading || isExtracting || !input.trim()}
                        aria-label="Send Message"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 flex items-center gap-2 transition-colors"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </form>
        </div>
    );
}
