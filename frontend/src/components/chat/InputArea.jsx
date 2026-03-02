import React, { useEffect } from 'react';
import { Send, Mic, MicOff } from 'lucide-react';

const InputArea = ({
    input,
    setInput,
    handleSend,
    isLoading,
    isListening,
    toggleListen,
    textareaRef
}) => {

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
        }
    }, [input, textareaRef]);

    return (
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
    );
};

export default InputArea;
