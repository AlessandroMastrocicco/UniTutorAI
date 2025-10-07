import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { EsercizioTopic, EsercizioInstance, MacroTopic, ChatMessage } from '../types';
import { SolutionEditor } from './SolutionEditor';

// --- Icons ---
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>;
const CreateIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
const BackIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>;
const CheckCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>;
const TutorIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" /></svg>;
const SendIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>;
const SubmitIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const UploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" /></svg>;
const MinusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>;
const ShieldCheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z" clipRule="evenodd" /></svg>;


// --- Helper & Sub-components ---

const AiTutorModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onAsk: (userQuestion: string) => Promise<string>;
    t: (key: string) => string;
}> = ({ isOpen, onClose, onAsk, t }) => {
    const [history, setHistory] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isAsking, setIsAsking] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) setHistory([]);
    }, [isOpen]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history]);

    const handleSend = async () => {
        if (!input.trim() || isAsking) return;
        const userQuestion = input.trim();
        setInput('');
        setHistory(prev => [...prev, { id: Date.now().toString(), role: 'user', text: userQuestion }]);
        setIsAsking(true);
        try {
            const answer = await onAsk(userQuestion);
            setHistory(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'model', text: answer }]);
        } catch (e) {
            // The error object `e` is of type `unknown`. It must be safely converted to a string before being used in the message.
            // Fix: The caught error object `e` of type `unknown` is not assignable to a string.
            // It is safely handled by checking if it's an Error instance or converting it to a string.
// FIX: The caught error object `e` is of type `unknown`. It must be safely converted to a string before being used in the message.
            const errorMessage = e instanceof Error ? e.message : String(e);
            setHistory(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'model', text: `${t('exercises.errorOccurred')} ${errorMessage}` }]);
        } finally {
            setIsAsking(false);
        }
    };

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex-shrink-0 p-4 flex justify-between items-center border-b border-gray-700">
                    <h2 className="text-xl font-bold text-white">{t('exercises.tutorHelpTitle')}</h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-full"><CloseIcon /></button>
                </header>
                <div className="flex-1 p-4 overflow-y-auto">
                    {history.map(msg => (
                         <div key={msg.id} className={`flex items-start gap-3 my-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            {msg.role === 'model' && <div className="bg-indigo-600 rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0 text-lg" role="img">🤖</div>}
                            <div className={`rounded-lg p-3 max-w-md ${msg.role === 'user' ? 'bg-indigo-700' : 'bg-gray-700'}`}><p className="text-sm text-gray-200 whitespace-pre-wrap">{msg.text}</p></div>
                        </div>
                    ))}
                    {isAsking && <div className="flex items-center"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-200"></div><p className="ml-2 text-sm text-gray-400">{t('exercises.tutorThinking')}</p></div>}
                    <div ref={messagesEndRef} />
                </div>
                <div className="p-4 bg-gray-900/50 border-t border-gray-700">
                    <div className="flex items-center bg-gray-700 rounded-lg">
                        <input type="text" placeholder={t('exercises.askSpecificQuestion')} value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSend()} className="flex-1 bg-transparent p-3 text-white placeholder-gray-400 focus:outline-none" disabled={isAsking} />
                        <button onClick={handleSend} className="p-3 text-white transition-colors disabled:text-gray-500" disabled={isAsking || !input.trim()}><SendIcon /></button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Main View Component & Sub-Views ---
interface EsercitazioniViewProps {
    selectedSubject: string;
    macroTopics: MacroTopic[];
    esercizioTopics: EsercizioTopic[];
    esercizioInstances: EsercizioInstance[];
    pointerVisibility: 'all' | 'tackled';
    onCreateEsercizio: (topic: EsercizioTopic, options?: { difficulty?: 'simpler' | 'harder', originalQuestion?: string, userFeedback?: string }) => Promise<EsercizioInstance | null>;
    onUpdateEsercizio: (instance: EsercizioInstance) => void;
    onCorrectEsercizio: (instance: EsercizioInstance) => Promise<void>;
    onDeleteTopic: (topicId: string) => void;
    onAskForHelp: (question: string, userAttempt: string) => Promise<string>;
    onAnalyzeExternalExercise: (file: File) => Promise<{ suggested_topic_id: string; reasoning: string; extracted_question: string; extracted_solution: string } | null>;
    onSaveExternalExercise: (topicId: string, question: string, solution: string, fileName: string) => Promise<void>;
    isProcessingAI: boolean;
    error: string | null;
    clearError: () => void;
    t: (key: string) => string;
}

export const EsercitazioniView: React.FC<EsercitazioniViewProps> = (props) => {
    const { selectedSubject, macroTopics, esercizioTopics, esercizioInstances, pointerVisibility, onCreateEsercizio, onUpdateEsercizio, onCorrectEsercizio, onDeleteTopic, onAskForHelp, onAnalyzeExternalExercise, onSaveExternalExercise, isProcessingAI, error, clearError, t } = props;
    
    const [activeInstance, setActiveInstance] = useState<EsercizioInstance | null>(null);
    const [selectedTopic, setSelectedTopic] = useState<EsercizioTopic | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);


    useEffect(() => {
        const currentInstanceId = activeInstance?.id;
        if (currentInstanceId) {
            const updatedInstance = esercizioInstances.find(i => i.id === currentInstanceId);
            if (updatedInstance) {
                setActiveInstance(updatedInstance);
            }
        }
    }, [esercizioInstances, activeInstance?.id]);


    useEffect(() => {
        setActiveInstance(null);
        setSelectedTopic(null);
        clearError();
    }, [selectedSubject, clearError]);

    const handleStartNewExercise = async (topic: EsercizioTopic) => {
        setIsLoading(true);
        clearError();
        const newInstance = await onCreateEsercizio(topic);
        if (newInstance) {
            setActiveInstance(newInstance);
        }
        setIsLoading(false);
    };

    const handleCreateSimplerExercise = async (feedback: string) => {
        if (!activeInstance) return;
        const topic = esercizioTopics.find(t => t.id === activeInstance.topicId);
        if (!topic) return;

        setIsLoading(true);
        clearError();
        const newInstance = await onCreateEsercizio(topic, {
            difficulty: 'simpler',
            originalQuestion: activeInstance.question,
            userFeedback: feedback
        });
        if (newInstance) {
            setActiveInstance(newInstance);
        }
        setIsLoading(false);
    };

    const handleCreateHarderExercise = async () => {
        if (!activeInstance) return;
        const topic = esercizioTopics.find(t => t.id === activeInstance.topicId);
        if (!topic) return;
        
        setIsLoading(true);
        clearError();
        const newInstance = await onCreateEsercizio(topic, {
            difficulty: 'harder',
            originalQuestion: activeInstance.question
        });
        if (newInstance) {
            setActiveInstance(newInstance);
        }
        setIsLoading(false);
    };
    
    const practicalTopics = useMemo(() => {
        // Filter for topics that can have practical exercises.
        return esercizioTopics.filter(t => t.questionTypes?.includes('exercise'));
    }, [esercizioTopics]);

    const filteredExerciseTopics = useMemo(() => {
        // Then, apply the visibility filter (all vs tackled)
        if (pointerVisibility === 'tackled') {
            return practicalTopics.filter(t => t.affrontato);
        }
        return practicalTopics;
    }, [practicalTopics, pointerVisibility]);

    const groupedTopics = useMemo(() => {
        const macroMap = new Map(macroTopics.map(m => [m.id, m.title]));
        const groups: Record<string, { title: string; pointers: EsercizioTopic[] }> = {};

        filteredExerciseTopics.forEach(topic => {
            const macroId = topic.macroTopicId || 'uncategorized';
            if (!groups[macroId]) {
                groups[macroId] = {
                    title: macroMap.get(macroId) || 'Senza Categoria',
                    pointers: []
                };
            }
            groups[macroId].pointers.push(topic);
        });

        return Object.entries(groups).map(([id, data]) => ({ id, ...data })).filter(g => g.pointers.length > 0);
    }, [macroTopics, filteredExerciseTopics]);

    if (activeInstance) {
        return (
            <div className="fixed inset-0 bg-gray-900 z-50 p-4 sm:p-8 overflow-y-auto">
                <ExerciseSolverView
                    instance={activeInstance}
                    onBack={() => setActiveInstance(null)}
                    onSave={onUpdateEsercizio}
                    onCorrect={onCorrectEsercizio}
                    onAskForHelp={onAskForHelp}
                    isProcessingCorrection={isProcessingAI}
                    onCreateSimplerExercise={handleCreateSimplerExercise}
                    onCreateHarderExercise={handleCreateHarderExercise}
                    t={t}
                />
            </div>
        );
    }
    
    if (selectedTopic) {
        return <TopicDetailView
            topic={selectedTopic}
            instances={esercizioInstances.filter(i => i.topicId === selectedTopic.id)}
            onBack={() => setSelectedTopic(null)}
            onStartNewExercise={() => handleStartNewExercise(selectedTopic)}
            onReviewInstance={setActiveInstance}
            t={t}
        />
    }

    return (
        <div className="w-full max-w-5xl mx-auto">
            {isLoading && (
                 <div className="fixed inset-0 bg-gray-900/90 backdrop-blur-sm z-[60] flex flex-col items-center justify-center text-center p-4">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500 mb-8"></div>
                    <h2 className="text-3xl font-bold text-white mb-4">{t('exercises.creatingExercise')}</h2>
                    <p className="text-lg text-gray-300">{t('exercises.pleaseWait')}</p>
                </div>
            )}
            
            <header className="mb-8 text-center">
                <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">{t('sidebar.esercitazioni')}</h1>
                <p className="text-gray-400 mt-2 text-md">{t('exercises.description')}</p>
            </header>
            
            <div className="flex justify-end mb-4">
                <button 
                    onClick={() => setIsUploadModalOpen(true)}
                    disabled={esercizioTopics.length === 0}
                    className="inline-flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <UploadIcon />
                    Carica Esercizio da File
                </button>
            </div>

            {error && <p className="text-red-400 text-sm text-center mb-4">{error}</p>}

            {esercizioTopics.length === 0 ? (
                <div className="bg-gray-800 rounded-2xl p-8 text-center"><p className="text-gray-400">{t('exercises.noTopics')}</p></div>
            ) : practicalTopics.length === 0 ? (
                <div className="bg-gray-800 rounded-2xl p-8 text-center"><p className="text-indigo-300">{t('exercises.noPracticalTopics')}</p></div>
            ) : filteredExerciseTopics.length === 0 ? (
                <div className="bg-gray-800 rounded-2xl p-8 text-center"><p className="text-indigo-300">{t('exercises.noTopicsForFilter')}</p></div>
            ) : (
                 <div className="space-y-6">
                    {groupedTopics.map(group => (
                        <div key={group.id} className="bg-gray-800 rounded-xl shadow-lg p-5">
                            <h3 className="text-xl font-bold text-indigo-400 mb-4">{group.title}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {group.pointers.map(topic => (
                                    <div key={topic.id} className="group bg-gray-900/50 rounded-lg flex flex-col transition-shadow hover:shadow-indigo-500/20 hover:shadow-lg">
                                        <div className="p-4 flex flex-col flex-grow rounded-lg">
                                            <div className="flex justify-between items-start">
                                                <h4 className="text-md font-bold text-white" title={topic.title}>{topic.title}</h4>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); if (window.confirm(t('exercises.deleteConfirm').replace('{title}', topic.title))) { onDeleteTopic(topic.id); } }} 
                                                    className="p-1 text-red-500/70 hover:text-red-400 rounded-full hover:bg-gray-700 opacity-0 group-hover:opacity-100 flex-shrink-0 ml-2"
                                                    title={t('common.delete')}
                                                >
                                                    <TrashIcon />
                                                </button>
                                            </div>
                                            <div className="flex-grow min-h-[1rem]"></div> 
                                            <button 
                                                onClick={() => setSelectedTopic(topic)} 
                                                className="w-full mt-4 inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg text-sm"
                                            >
                                                <CreateIcon />
                                                Vai all'Argomento
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <UploadExerciseModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onAnalyze={onAnalyzeExternalExercise}
                onSave={onSaveExternalExercise}
                topics={esercizioTopics}
                t={t}
            />
        </div>
    );
};

// --- Topic Detail View ---
const TopicDetailView: React.FC<{
    topic: EsercizioTopic;
    instances: EsercizioInstance[];
    onBack: () => void;
    onStartNewExercise: () => void;
    onReviewInstance: (instance: EsercizioInstance) => void;
    t: (key: string) => string;
}> = ({ topic, instances, onBack, onStartNewExercise, onReviewInstance, t }) => {
    
    const pastExercises = instances.filter(i => i.status === 'corrected' && !i.sourceFileName).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const uploadedExercises = instances.filter(i => !!i.sourceFileName).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const difficultyLabels: Record<string, string> = { easy: t('exercises.difficulty.easy'), medium: t('exercises.difficulty.medium'), hard: t('exercises.difficulty.hard') };
    const correctnessColors = { correct: 'text-green-400', 'partially-correct': 'text-yellow-400', incorrect: 'text-red-400' };

    return (
        <div className="bg-gray-800 rounded-2xl p-6">
            <button onClick={onBack} className="flex items-center text-indigo-400 hover:text-indigo-300 font-semibold mb-4">
                <BackIcon /> {t('exercises.backToTopics')}
            </button>
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white">{topic.title}</h2>
                <p className="text-sm text-gray-400 mt-1">{topic.sourceDescription}</p>
            </div>
            
            <button onClick={onStartNewExercise} className="w-full max-w-md mx-auto inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition-colors">
                <CreateIcon /> {t('exercises.createButton')}
            </button>

            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Esercizi Svolti</h3>
                    {pastExercises.length > 0 ? (
                        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                            {pastExercises.map(ex => (
                                <button key={ex.id} onClick={() => onReviewInstance(ex)} className="w-full text-left bg-gray-900/50 p-3 rounded-lg hover:bg-gray-700">
                                    <p className="font-semibold text-gray-300 truncate">{ex.question}</p>
                                    <div className="flex items-center gap-2 text-xs mt-2">
                                        <span className={`font-bold ${correctnessColors[ex.aiCorrectness || 'incorrect']}`}>{ex.aiCorrectness === 'correct' ? 'Corretto' : ex.aiCorrectness === 'partially-correct' ? 'Parziale' : 'Sbagliato'}</span>
                                        <span>•</span>
                                        <span>{difficultyLabels[ex.difficulty || 'medium']}</span>
                                        {ex.isExamLevel && (
                                            <>
                                                <span>•</span>
                                                <span className="flex items-center text-yellow-400 font-semibold"><ShieldCheckIcon />Esame</span>
                                            </>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : <p className="text-gray-400 text-sm">Nessun esercizio svolto per questo argomento.</p>}
                </div>
                <div>
                     <h3 className="text-lg font-semibold text-white mb-3">Esercizi Caricati</h3>
                     {uploadedExercises.length > 0 ? (
                         <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                            {uploadedExercises.map(ex => (
                                <button key={ex.id} onClick={() => onReviewInstance(ex)} className="w-full text-left bg-gray-900/50 p-3 rounded-lg hover:bg-gray-700">
                                    <p className="font-semibold text-gray-300 truncate">{ex.sourceFileName}</p>
                                     <div className="flex items-center gap-2 text-xs mt-2">
                                        <span className={`font-bold ${ex.status === 'corrected' ? correctnessColors[ex.aiCorrectness || 'incorrect'] : 'text-gray-400'}`}>
                                            {ex.status === 'corrected' ? (ex.aiCorrectness === 'correct' ? 'Corretto' : ex.aiCorrectness === 'partially-correct' ? 'Parziale' : 'Sbagliato') : 'Da Svolgere'}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                     ) : <p className="text-gray-400 text-sm">Nessun esercizio caricato per questo argomento.</p>}
                </div>
            </div>
        </div>
    );
};


// --- Solver View ---
interface ExerciseSolverViewProps {
    instance: EsercizioInstance;
    onBack: () => void;
    onSave: (updatedInstance: EsercizioInstance) => void;
    onCorrect: (instance: EsercizioInstance) => Promise<void>;
    onAskForHelp: (question: string, userAttempt: string) => Promise<string>;
    isProcessingCorrection: boolean;
    onCreateSimplerExercise: (feedback: string) => void;
    onCreateHarderExercise: () => void;
    t: (key: string) => string;
}

const ExerciseSolverView: React.FC<ExerciseSolverViewProps> = ({ instance, onBack, onSave, onCorrect, onAskForHelp, isProcessingCorrection, onCreateSimplerExercise, onCreateHarderExercise, t }) => {
    const [solutionContent, setSolutionContent] = useState(instance.userSolutionContent || '');
    const [isTutorOpen, setIsTutorOpen] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');
    const [isEditorExpanded, setIsEditorExpanded] = useState(false);
    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
    const [feedback, setFeedback] = useState('');

    const difficultyLabels: Record<string, string> = { easy: t('exercises.difficulty.easy'), medium: t('exercises.difficulty.medium'), hard: t('exercises.difficulty.hard') };
    const difficultyColors: Record<string, string> = { easy: 'bg-green-900 text-green-300', medium: 'bg-yellow-900 text-yellow-300', hard: 'bg-red-900 text-red-300' };
    const typeLabels: Record<string, string> = { theory: t('exercises.type.theory'), exercise: t('exercises.type.exercise') };

    const handleSaveProgress = () => {
        onSave({ ...instance, userSolutionContent: solutionContent });
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
    };

    const handleSubmit = async () => {
        await onCorrect({ ...instance, userSolutionContent: solutionContent });
    };

    const handleAskTutor = async (userQuestion: string): Promise<string> => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = solutionContent;
        const fullTextAttempt = tempDiv.textContent || tempDiv.innerText || '';
        return onAskForHelp(userQuestion, fullTextAttempt);
    };
    
    const isCorrected = instance.status === 'corrected';
    const isSubmitting = instance.status === 'submitted' || isProcessingCorrection;

    const handleRequestSimpler = () => {
        if (feedback.trim()) {
            onCreateSimplerExercise(feedback);
            setIsFeedbackModalOpen(false);
            setFeedback('');
        }
    };

    return (
        <div className="w-full max-w-7xl mx-auto h-full flex flex-col">
            <header className="mb-4 flex-shrink-0">
                <button onClick={onBack} className="flex items-center text-indigo-400 hover:text-indigo-300 font-semibold mb-2"><BackIcon /> {t('exercises.backToTopics')}</button>
            </header>
            <div className={`flex-grow grid grid-cols-1 ${isEditorExpanded ? '' : (isCorrected ? 'lg:grid-cols-2' : 'lg:grid-cols-2')} gap-6 overflow-y-auto`}>
                {/* Colonna Sinistra: Traccia e Risultati */}
                <div className="bg-gray-800 rounded-2xl p-6 space-y-4 flex flex-col">
                    <h2 className="text-xl font-bold text-white flex-shrink-0">{t('exercises.exercisePrompt')}</h2>
                    <div className="flex items-center gap-2 flex-wrap">
                        {instance.sourceFileName && <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-gray-600 text-gray-300" title={instance.sourceFileName}>Importato</span>}
                        {instance.generatedType && <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-900 text-blue-300">{typeLabels[instance.generatedType]}</span>}
                        {instance.difficulty && <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${difficultyColors[instance.difficulty]}`}>{difficultyLabels[instance.difficulty]}</span>}
                        {instance.isExamLevel && <span className="flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full bg-yellow-900 text-yellow-300"><ShieldCheckIcon /> Livello Esame</span>}
                    </div>
                    <p className="text-gray-300 whitespace-pre-wrap bg-gray-900/50 p-4 rounded-lg flex-grow overflow-y-auto">{instance.question}</p>
                    
                    {!isCorrected && (
                         <div className="flex-shrink-0 flex flex-wrap gap-2">
                            <button onClick={() => setIsTutorOpen(true)} disabled={isSubmitting} className="inline-flex items-center bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"><TutorIcon />{t('exercises.askTutor')}</button>
                            <button onClick={() => setIsFeedbackModalOpen(true)} disabled={isSubmitting} className="inline-flex items-center bg-green-800 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"><MinusIcon />Crea più semplice</button>
                            <button onClick={onCreateHarderExercise} disabled={isSubmitting} className="inline-flex items-center bg-red-800 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"><PlusIcon />Crea più difficile</button>
                        </div>
                    )}

                    {isCorrected && (
                        <div className="pt-4 border-t border-gray-700 space-y-4">
                            <div>
                                <h3 className="text-lg font-semibold text-green-300 mb-2">{t('exercises.officialSolution')}</h3>
                                <div className="text-gray-200 whitespace-pre-wrap bg-gray-900/50 p-4 rounded-lg border-l-4 border-green-500 max-h-60 overflow-y-auto">{instance.solution}</div>
                            </div>
                             <div>
                                <h3 className="text-lg font-semibold text-purple-300 mb-2">{t('exercises.aiCorrection')}</h3>
                                <div className="text-gray-200 whitespace-pre-wrap bg-gray-900/50 p-4 rounded-lg border-l-4 border-purple-500 max-h-60 overflow-y-auto" dangerouslySetInnerHTML={{ __html: instance.aiFeedback || '' }}></div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Colonna Destra: Editor o Risultati */}
                <div className="bg-gray-800 rounded-2xl p-4 flex flex-col">
                    <h2 className="text-xl font-bold text-white mb-4 px-2">{t('exercises.yourSolution')}</h2>
                    <SolutionEditor
                        key={instance.id}
                        initialContent={solutionContent}
                        onSave={setSolutionContent}
                        isExpanded={isEditorExpanded}
                        onToggleExpand={() => setIsEditorExpanded(p => !p)}
                    />
                     <div className="mt-auto pt-4 border-t border-gray-700 flex flex-col sm:flex-row justify-end items-center gap-3">
                        {isCorrected ? (
                            <button onClick={onBack} className="w-full sm:w-auto font-bold py-2 px-6 rounded-lg bg-indigo-600 hover:bg-indigo-700">{t('exercises.great')}</button>
                        ) : (
                            <>
                                <button onClick={handleSaveProgress} disabled={isSubmitting} className={`w-full sm:w-auto font-bold py-2 px-4 rounded-lg transition-colors ${saveStatus === 'saved' ? 'bg-green-600' : 'bg-gray-600 hover:bg-gray-500'} disabled:opacity-50`}>
                                    {saveStatus === 'saved' ? t('exercises.saved') : t('exercises.saveProgress')}
                                </button>
                                <button onClick={handleSubmit} disabled={isSubmitting} className="w-full sm:w-auto font-bold py-2 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center disabled:bg-gray-500 disabled:cursor-wait">
                                    {isSubmitting ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div> : <SubmitIcon />}
                                    {isSubmitting ? t('exercises.correcting') : t('exercises.submitForCorrection')}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
             <AiTutorModal isOpen={isTutorOpen} onClose={() => setIsTutorOpen(false)} onAsk={handleAskTutor} t={t} />
             {isFeedbackModalOpen && (
                 <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4" onClick={() => setIsFeedbackModalOpen(false)}>
                    <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-white">Crea Esercizio più Semplice</h3>
                            <p className="text-gray-300 my-4">Quale parte dell'esercizio trovi più difficile? Sii specifico per aiutare l'AI a creare un esercizio mirato.</p>
                             <textarea
                                value={feedback}
                                onChange={e => setFeedback(e.target.value)}
                                placeholder="Es: 'Non ho capito come impostare l'integrale iniziale'..."
                                rows={4}
                                autoFocus
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5"
                            />
                        </div>
                        <div className="bg-gray-900/50 px-6 py-4 flex justify-end gap-4 rounded-b-2xl">
                            <button onClick={() => setIsFeedbackModalOpen(false)} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">Annulla</button>
                            <button onClick={handleRequestSimpler} disabled={!feedback.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50">Genera Esercizio</button>
                        </div>
                    </div>
                 </div>
             )}
        </div>
    )
}

const UploadExerciseModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onAnalyze: (file: File) => Promise<{ suggested_topic_id: string; reasoning: string; extracted_question: string; extracted_solution: string } | null>;
    onSave: (topicId: string, question: string, solution: string, fileName: string) => Promise<void>;
    topics: EsercizioTopic[];
    t: (key: string) => string;
}> = ({ isOpen, onClose, onAnalyze, onSave, topics, t }) => {
    type Status = 'idle' | 'processing' | 'suggestion';
    const [status, setStatus] = useState<Status>('idle');
    const [file, setFile] = useState<File | null>(null);
    const [analysisResult, setAnalysisResult] = useState<{ reasoning: string } | null>(null);
    const [editedData, setEditedData] = useState<{ topicId: string, question: string, solution: string } | null>(null);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleClose = () => {
        setStatus('idle');
        setFile(null);
        setAnalysisResult(null);
        setEditedData(null);
        setError('');
        onClose();
    };

    const handleFileSelect = async (selectedFile: File | null) => {
        if (!selectedFile) return;
        if (selectedFile.type !== 'application/pdf' && !selectedFile.type.startsWith('image/')) {
            setError('Formato file non supportato. Seleziona un PDF o un\'immagine.');
            return;
        }
        
        setError('');
        setFile(selectedFile);
        setStatus('processing');

        const result = await onAnalyze(selectedFile);
        if (result) {
            setAnalysisResult({ reasoning: result.reasoning });
            setEditedData({
                topicId: result.suggested_topic_id,
                question: result.extracted_question,
                solution: result.extracted_solution
            });
            setStatus('suggestion');
        } else {
            setError('Analisi AI fallita. Controlla la console per dettagli o prova con un altro file.');
            setStatus('idle');
        }
    };

    const handleSave = () => {
        if (editedData && file) {
            onSave(editedData.topicId, editedData.question, editedData.solution, file.name);
            handleClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-[51] p-4" onClick={handleClose}>
            <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col h-[90vh]" onClick={e => e.stopPropagation()}>
                <header className="flex-shrink-0 p-4 flex justify-between items-center border-b border-gray-700">
                    <h2 className="text-xl font-bold text-white">Importa Esercizio da File</h2>
                    <button onClick={handleClose} className="p-2 text-gray-400 hover:text-white rounded-full"><CloseIcon /></button>
                </header>
                <div className="flex-1 p-6 overflow-y-auto">
                    {status === 'idle' && (
                        <div className="flex flex-col items-center justify-center h-full">
                            <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center w-full max-w-lg h-64 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 border-gray-600 bg-gray-900/50 hover:border-gray-500 hover:bg-gray-800/80">
                                <UploadIcon />
                                <p className="text-lg text-gray-300"><span className="font-semibold">Clicca per selezionare un file</span></p>
                                <p className="text-sm text-gray-500">File PDF o Immagine (JPG, PNG)</p>
                            </button>
                            <input type="file" ref={fileInputRef} onChange={(e) => handleFileSelect(e.target.files?.[0] || null)} accept="application/pdf,image/*" className="hidden" />
                            {error && <p className="text-red-400 text-center mt-4">{error}</p>}
                        </div>
                    )}
                    {status === 'processing' && (
                        <div className="flex flex-col items-center justify-center h-full">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                            <p className="mt-4 text-gray-300">Analisi del file in corso...</p>
                        </div>
                    )}
                    {status === 'suggestion' && editedData && (
                        <div className="space-y-4">
                            <div className="bg-indigo-900/50 p-4 rounded-lg">
                                <h3 className="font-bold text-indigo-300">Suggerimento del Tutor AI</h3>
                                <p className="text-sm text-gray-300 mt-1">{analysisResult?.reasoning}</p>
                            </div>
                            <div>
                                <label htmlFor="topicId" className="block text-sm font-medium text-gray-300 mb-1">Inserisci in Argomento (Pointer)</label>
                                <select id="topicId" value={editedData.topicId} onChange={e => setEditedData(d => d ? {...d, topicId: e.target.value} : null)} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5">
                                    {topics.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="question" className="block text-sm font-medium text-gray-300 mb-1">Testo della Domanda</label>
                                <textarea id="question" rows={6} value={editedData.question} onChange={e => setEditedData(d => d ? {...d, question: e.target.value} : null)} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5" />
                            </div>
                             <div>
                                <label htmlFor="solution" className="block text-sm font-medium text-gray-300 mb-1">Testo della Soluzione (opzionale)</label>
                                <textarea id="solution" rows={6} value={editedData.solution} onChange={e => setEditedData(d => d ? {...d, solution: e.target.value} : null)} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5" />
                            </div>
                        </div>
                    )}
                </div>
                <footer className="bg-gray-900/50 px-6 py-4 flex justify-end gap-4 rounded-b-2xl border-t border-gray-700">
                    <button onClick={handleClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">Annulla</button>
                    {status === 'suggestion' && (
                        <button onClick={handleSave} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg">Salva Esercizio</button>
                    )}
                </footer>
            </div>
        </div>
    );
};