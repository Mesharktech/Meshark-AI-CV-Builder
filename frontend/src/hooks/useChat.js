import { useState, useRef, useEffect } from 'react';
import { auth } from '../firebase';

const formatTime = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export function useChat(user, setCvData, setShowTemplateSelection) {
    const [messages, setMessages] = useState(() => {
        const saved = localStorage.getItem('meshark_chat_messages');
        if (saved) {
            try { return JSON.parse(saved); } catch (e) { }
        }
        return [
            {
                role: 'assistant',
                content: 'Hi there! 👋 I\'m Meshark AI, your personal CV building assistant.\n\nI\'ll ask you a few questions to get to know your professional background, then craft a beautiful, modern CV tailored just for you.\n\nOptionally, paste a job description and I\'ll tailor your CV to it.\n\nLet\'s start: What is your full name and the best phone number and email to reach you?',
                timestamp: formatTime()
            }
        ];
    });

    const [input, setInput] = useState(() => localStorage.getItem('meshark_chat_input') || '');
    const [isLoading, setIsLoading] = useState(false);

    const [isListening, setIsListening] = useState(false);
    const [isVoiceMode, setIsVoiceMode] = useState(false);

    const [isChatComplete, setIsChatComplete] = useState(() => {
        return localStorage.getItem('meshark_chat_complete') === 'true';
    });

    // Sync state to localStorage
    useEffect(() => {
        localStorage.setItem('meshark_chat_messages', JSON.stringify(messages));
    }, [messages]);

    useEffect(() => {
        localStorage.setItem('meshark_chat_input', input);
    }, [input]);

    useEffect(() => {
        localStorage.setItem('meshark_chat_complete', isChatComplete.toString());
    }, [isChatComplete]);

    const recognitionRef = useRef(null);
    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);

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
                setShowTemplateSelection(true);
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

    const loadPreviousCvChat = (oldCvData) => {
        setCvData(oldCvData);
        setIsChatComplete(true);
        setMessages(prev => [...prev, {
            role: 'assistant',
            content: `I've loaded your previous CV for ${oldCvData?.first_name || 'you'}. What would you like to update?`,
            timestamp: formatTime()
        }]);
    };

    return {
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
    };
}
