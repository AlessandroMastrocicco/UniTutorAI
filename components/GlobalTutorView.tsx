

import React, { useState, useEffect, useRef } from 'react';
import type { ChatMessage, GlobalTutorState, PendingTutorAction, TutorTask } from '../types';

// Icons
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
const SendIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>;
const SparkleIcon = ({ className = "h-6 w-6" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>;
const FullscreenIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4h4m12 4V4h-4M4 16v4h4m12-4v4h-4" /></svg>;
const ExitFullscreenIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 4h5v5M4 9V4h5M15 20h5v-5M4 15v5h5" /></svg>;


interface GlobalTutorViewProps {
    isOpen: boolean;
    onClose: () => void;
    state: GlobalTutorState | null; // For tasks, remains subject-specific
    userName: string;
    activeSubject: string;
    allSubjects: string[];
    chatHistory: ChatMessage[];
    onSendMessage: (message: string) => Promise<void>;
    onCompleteTask: (taskId: string) => void;
    isProcessing: boolean;
    t: (key: string) => string;
    sidebarOpen: boolean;
    pendingAction: PendingTutorAction | null;
    onCancelAction: () => void;
}

export const GlobalTutorView: React.FC<GlobalTutorViewProps> = ({ isOpen, onClose, state, userName, activeSubject, allSubjects, chatHistory, onSendMessage, onCompleteTask, isProcessing, t, sidebarOpen, pendingAction, onCancelAction }) => {
    const [layout, setLayout] = useState<'half' | 'full'>('half');
    const [chatInput, setChatInput] = useState('');
    const [activeTab, setActiveTab] = useState<'tasks' | 'chat'>('tasks');
    const chatMessagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory, isProcessing]);
    
    useEffect(() => {
        if (isOpen && activeSubject) {
            setActiveTab('tasks');
        } else if (isOpen) {
            setActiveTab('chat');
        }
    }, [isOpen, activeSubject]);

    if (!isOpen) return null;

    const handleSend = () => {
        if (chatInput.trim() && !isProcessing) {
            onSendMessage(chatInput.trim());
            setChatInput('');
        }
    };

    const firstUncompletedIndex = state?.tasks.findIndex(t => !t.isCompleted) ?? -1;

    const baseClasses = "bg-gray-800 shadow-2xl rounded-2xl flex flex-col border border-gray-700 transition-all duration-300 ease-in-out";
    const layoutClasses = layout === 'full'
        ? `fixed inset-0 z-40 ${sidebarOpen ? 'ml-64' : 'ml-20'}`
        : "fixed bottom-24 right-6 z-40 w-[450px] h-[70vh] max-h-[700px]";

    return (
        <div className={`${baseClasses} ${layoutClasses}`} onClick={e => e.stopPropagation()}>
            <header className="flex-shrink-0 p-3 flex justify-between items-center border-b border-gray-700 bg-gray-900/50 rounded-t-2xl">
                <div className="flex items-center gap-3">
                    <SparkleIcon className="h-6 w-6 text-indigo-400" />
                    <div>
                        <h2 className="text-lg font-bold text-white">Tutor Globale</h2>
                        {activeSubject && <p className="text-xs text-indigo-300">Focus attuale: {activeSubject}</p>}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setLayout(l => l === 'half' ? 'full' : 'half')} className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-700" title={layout === 'half' ? 'Schermo intero' : 'Riduci'}>
                        {layout === 'half' ? <FullscreenIcon className="h-5 w-5" /> : <ExitFullscreenIcon className="h-5 w-5" />}
                    </button>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-700" title="Chiudi">
                        <CloseIcon className="h-5 w-5" />
                    </button>
                </div>
            </header>

            <nav className="flex-shrink-0 px-3 pt-2 border-b border-gray-700">
                <div className="flex space-x-1">
                    <button disabled={!activeSubject} onClick={() => setActiveTab('tasks')} className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${activeTab === 'tasks' ? 'bg-gray-700/80 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700/40'} disabled:opacity-50 disabled:cursor-not-allowed`}>
                        {t('tutor.tasksTab')}
                    </button>
                    <button onClick={() => setActiveTab('chat')} className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${activeTab === 'chat' ? 'bg-gray-700/80 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700/40'}`}>
                        {t('tutor.chatTab')}
                    </button>
                </div>
            </nav>

            <main className="flex-grow flex flex-col overflow-hidden min-h-0">
                {activeTab === 'tasks' && (
                    <div className="flex-grow overflow-y-auto p-4 space-y-4">
                        {activeSubject ? (
                            <>
                                <h3 className="text-md font-semibold text-white">{t('tutor.planForToday')} {activeSubject}:</h3>
                                {state?.summary && <div className="bg-gray-700/50 p-3 rounded-lg"><p className="text-sm text-gray-300">{state.summary}</p></div>}
                                
                                {state?.tasks && state.tasks.length > 0 ? (
                                    <ul className="space-y-3">
                                        {state.tasks.map((task, index) => {
                                            const isCompleted = task.isCompleted;
                                            const isActive = firstUncompletedIndex === index;
                                            const isLocked = firstUncompletedIndex !== -1 && index > firstUncompletedIndex;

                                            return (
                                                <li key={task.id} className={`flex items-start gap-3 p-3 rounded-lg transition-all ${isLocked ? 'bg-gray-900/50' : 'bg-gray-700/50'}`}>
                                                    <div className="pt-1 flex-shrink-0">
                                                        {isCompleted ? (
                                                            <div className="h-6 w-6 flex items-center justify-center rounded-full bg-green-500 text-white" title="Completato">
                                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                                            </div>
                                                        ) : isActive ? (
                                                            <button onClick={() => onCompleteTask(task.id)} className="h-6 w-6 rounded-full border-2 border-indigo-400 bg-gray-800 hover:bg-indigo-500 transition-colors" title="Segna come completato"></button>
                                                        ) : (
                                                            <div className="h-6 w-6 rounded-full border-2 border-gray-600 bg-gray-800" title="Bloccato"></div>
                                                        )}
                                                    </div>
                                                    <p className={`text-sm ${isCompleted ? 'line-through text-gray-500' : isLocked ? 'text-gray-600' : 'text-gray-300'}`}>
                                                        {task.text}
                                                    </p>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                                        {isProcessing ? t('tutor.syncInProgress') : t('tutor.noTasks')}
                                    </div>
                                )}
                                {firstUncompletedIndex === -1 && state && state.tasks.length > 0 && (
                                    <div className="text-center p-4 bg-green-900/50 rounded-lg">
                                        <p className="font-bold text-green-300">{t('tutor.allTasksCompleted')}</p>
                                    </div>
                                )}
                            </>
                        ) : (
                             <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                                {t('tutor.noSubjectForTasks')}
                            </div>
                        )}
                    </div>
                )}
                {activeTab === 'chat' && (
                    <div className="flex-grow flex flex-col bg-gray-800/50">
                        <div className="flex-1 p-4 overflow-y-auto">
                            {chatHistory.map(msg => (
                                <div key={msg.id} className={`flex items-start gap-3 my-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                    {msg.role === 'model' && <div className="bg-indigo-600 rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0 text-lg" role="img">🤖</div>}
                                    <div className={`rounded-lg p-3 max-w-lg ${msg.role === 'user' ? 'bg-indigo-700' : 'bg-gray-700'}`}><div className="text-sm text-gray-200 whitespace-pre-wrap">{msg.text}</div></div>
                                </div>
                            ))}
                            {isProcessing && <div className="flex items-start gap-3 my-4"><div className="bg-indigo-600 rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0 text-lg" role="img">🤖</div><div className="bg-gray-700 rounded-lg p-3 max-w-md flex items-center"><div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-gray-200 mr-3"></div><span className="text-sm text-gray-300">Sto pensando...</span></div></div>}
                            <div ref={chatMessagesEndRef} />
                        </div>
                        {pendingAction?.type === 'AWAITING_SOLUTION' && (
                            <div className="p-3 border-t border-gray-700 bg-indigo-900/50">
                                <p className="text-sm font-semibold text-indigo-300">In attesa della tua soluzione per:</p>
                                <p className="text-sm text-white mt-1">{pendingAction.question}</p>
                                <button onClick={onCancelAction} className="text-xs text-red-400 hover:underline mt-2">Annulla</button>
                            </div>
                        )}
                        <div className="p-3 border-t border-gray-700">
                            <div className="flex items-center bg-gray-700 rounded-lg">
                                <input type="text" placeholder={pendingAction ? "Scrivi la tua soluzione..." : "Chiedi qualcosa al tutor..."} value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSend()} className="flex-1 bg-transparent p-2 text-white placeholder-gray-400 focus:outline-none" disabled={isProcessing} />
                                <button onClick={handleSend} className="p-2 text-white transition-colors disabled:text-gray-500" disabled={isProcessing || !chatInput.trim()}><SendIcon /></button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};
