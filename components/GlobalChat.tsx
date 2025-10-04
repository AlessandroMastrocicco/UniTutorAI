

import React, { useState, useEffect, useRef } from 'react';
import type { ChatMessage } from '../types';
import { db } from '../db';

// Icons
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
const SendIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>;
const SparkleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>;

const KatexDisplay: React.FC<{ text: string }> = ({ text }) => {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (ref.current && window.renderMathInElement) {
            window.renderMathInElement(ref.current, {
                delimiters: [
                    {left: '$$', right: '$$', display: true},
                    {left: '$', right: '$', display: false}
                ],
                throwOnError: false
            });
        }
    }, [text]);
    return <div ref={ref} className="text-sm text-gray-200 whitespace-pre-wrap">{text}</div>;
};

interface GlobalChatProps {
    isOpen: boolean;
    onClose: () => void;
    subjectName: string;
    onSendMessage: (message: string) => Promise<void>;
    isProcessing: boolean;
    dataVersion: number;
}

export const GlobalChat: React.FC<GlobalChatProps> = ({ isOpen, onClose, subjectName, onSendMessage, isProcessing, dataVersion }) => {
    const [input, setInput] = useState('');
    const [history, setHistory] = useState<ChatMessage[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            setInput('');
        }
    }, [isOpen]);

    useEffect(() => {
        const loadHistory = async () => {
            if (subjectName) {
                const historyState = await db.appState.get('allChatHistories');
                setHistory(historyState?.value?.[subjectName] || []);
            } else {
                setHistory([]);
            }
        };
        loadHistory();
    }, [subjectName, dataVersion, isOpen]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history]);

    const handleSend = async () => {
        if (!input.trim() || isProcessing) return;
        const message = input.trim();
        setInput('');
        await onSendMessage(message);
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex-shrink-0 p-4 bg-gray-900/50 flex justify-between items-center border-b border-gray-700">
                    <div className="flex items-center gap-3">
                        <SparkleIcon />
                        <h2 className="text-xl font-bold text-white">Tutor AI: {subjectName}</h2>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-full"><CloseIcon /></button>
                </header>
                <div className="flex-1 p-4 overflow-y-auto">
                    {history.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
                            <SparkleIcon />
                            <p className="mt-2">Sono il tuo tutor per {subjectName}.</p>
                            <p className="text-sm">Fammi una domanda per iniziare.</p>
                        </div>
                    )}
                    {history.map(msg => (
                         <div key={msg.id} className={`flex items-start gap-3 my-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            {msg.role === 'model' && <div className="bg-indigo-600 rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0 text-lg" role="img">🤖</div>}
                            <div className={`rounded-lg p-3 max-w-lg ${msg.role === 'user' ? 'bg-indigo-700' : 'bg-gray-700'}`}>
                                <KatexDisplay text={msg.text} />
                            </div>
                        </div>
                    ))}
                     {isProcessing && !history.some(m => m.role === 'model' && m.text.startsWith('Sto pensando')) && (
                        <div className="flex items-start gap-3 my-4">
                            <div className="bg-indigo-600 rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0 text-lg" role="img">🤖</div>
                            <div className="bg-gray-700 rounded-lg p-3 max-w-md flex items-center">
                                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-gray-200 mr-3"></div>
                                <span className="text-sm text-gray-300">Sto pensando...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                <div className="p-4 bg-gray-900/50 border-t border-gray-700">
                    <div className="flex items-center bg-gray-700 rounded-lg">
                        <input 
                            type="text" 
                            placeholder="Chiedi qualsiasi cosa sulla materia..." 
                            value={input} 
                            onChange={e => setInput(e.target.value)} 
                            onKeyPress={e => e.key === 'Enter' && handleSend()} 
                            className="flex-1 bg-transparent p-3 text-white placeholder-gray-400 focus:outline-none" 
                            disabled={isProcessing} 
                        />
                        <button 
                            onClick={handleSend} 
                            className="p-3 text-white transition-colors disabled:text-gray-500" 
                            disabled={isProcessing || !input.trim()}
                        >
                            <SendIcon />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};