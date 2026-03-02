import React from 'react';
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';
import { Sparkles, FileText } from 'lucide-react';

const MessageList = ({ messages, isLoading, isGeneratingPdf, messagesEndRef }) => {
    return (
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
    );
};

export default MessageList;
