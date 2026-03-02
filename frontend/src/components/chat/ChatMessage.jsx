import React from 'react';
import { Sparkles } from 'lucide-react';

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

export default ChatMessage;
