import React, { useState, useEffect, useCallback } from 'react';
import type { SavedDispensa, SavedSimulation, SimulationQuestion, MacroTopic, EsercizioTopic, SubjectDetails, ExamStructure } from '../types';
import { db } from '../db';
import { SolutionEditor } from './SolutionEditor';

// --- Icons ---
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" /></svg>;
const CheckCircleIcon = ({ className = "h-5 w-5 text-green-400" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>;
const XCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>;
const ChevronLeftIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>;
const ChevronRightIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
const TimerIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>;

interface SimulazioniEsamiViewProps {
    dispense: SavedDispensa[];
    macroTopics: MacroTopic[];
    esercizioTopics: EsercizioTopic[];
    simulations: SavedSimulation[];
    subjectDetails: SubjectDetails;
    onGenerate: (dispensaIds: string[], structure: ExamStructure) => Promise<SavedSimulation | null>;
    onSave: (simulation: SavedSimulation) => Promise<void>;
    isGenerating: boolean;
    error: string | null;
    clearError: () => void;
}

const formatTime = (seconds: number): string => {
    if (seconds < 0) seconds = 0;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export const SimulazioniEsamiView: React.FC<SimulazioniEsamiViewProps> = ({ dispense, simulations, subjectDetails, onGenerate, onSave, isGenerating, error, clearError }) => {
    const [view, setView] = useState<'list' | 'taking' | 'results'>('list');
    const [activeSimulation, setActiveSimulation] = useState<SavedSimulation | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<Record<string, number | string | null>>({});
    const [reviewingSimulation, setReviewingSimulation] = useState<SavedSimulation | null>(null);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [generating, setGenerating] = useState(false); // Local loading state
    
    const [selectedDispenseIds, setSelectedDispenseIds] = useState<string[]>([]);
    const [examStructure, setExamStructure] = useState<ExamStructure>({
        mcTheory: 2,
        openTheory: 1,
        mcExercise: 1,
        openExercise: 0,
        timer: 30,
    });

    const showLoading = generating;

    useEffect(() => {
        let intervalId: number | undefined;
        if (showLoading) {
            const messages = [
                "Avvio del generatore AI...",
                "Analisi dei puntatori di studio...",
                "Selezione degli argomenti chiave dalle dispense...",
                "Creazione delle domande teoriche...",
                "Elaborazione degli esercizi basati sui tuoi progressi...",
                "Composizione della struttura dell'esame...",
                "Verifica finale della coerenza...",
                "Quasi pronto!"
            ];
            let messageIndex = 0;
            setLoadingMessage(messages[messageIndex]);

            intervalId = window.setInterval(() => {
                messageIndex++;
                if (messageIndex < messages.length) {
                    setLoadingMessage(messages[messageIndex]);
                }
            }, 1500);
        }

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [showLoading]);

    const handleFinishSimulation = useCallback(async () => {
        if (!activeSimulation) return;

        const answeredQuestions = activeSimulation.questions.map(q => {
            const userAnswer = userAnswers[q.id];
            const newQ: SimulationQuestion = { ...q, userAnswerIndex: null, userAnswerContent: null };
    
            if (q.type.includes('multiple-choice')) {
                newQ.userAnswerIndex = typeof userAnswer === 'number' ? userAnswer : null;
            } else if (q.type.includes('open-ended')) {
                newQ.userAnswerContent = typeof userAnswer === 'string' ? userAnswer : '';
            }
            return newQ;
        });
    
        const simulationToSave: SavedSimulation = {
            ...activeSimulation,
            questions: answeredQuestions,
            score: 0, // Will be calculated in onSave
            totalPoints: activeSimulation.totalPoints,
            grade: 0, // Will be calculated in onSave
        };
        
        await onSave(simulationToSave);
        setActiveSimulation(simulationToSave);
        setView('results');
    }, [activeSimulation, onSave, userAnswers]);

    // Timer effect
    useEffect(() => {
        if (view === 'taking' && activeSimulation?.duration) {
            setTimeLeft(activeSimulation.duration * 60);
        } else {
            setTimeLeft(null);
        }
    }, [view, activeSimulation]);

    useEffect(() => {
        if (view !== 'taking' || timeLeft === null) {
            return;
        }

        if (timeLeft <= 0) {
            handleFinishSimulation();
            return;
        }

        const intervalId = setInterval(() => {
            setTimeLeft(prevTime => (prevTime ? prevTime - 1 : 0));
        }, 1000);

        return () => clearInterval(intervalId);
    }, [view, timeLeft, handleFinishSimulation]);

    useEffect(() => {
        const simIdToWatch = activeSimulation?.id || reviewingSimulation?.id;
        if (simIdToWatch) {
            const updatedSimFromProps = simulations.find(s => s.id === simIdToWatch);
            if (updatedSimFromProps) {
                if(activeSimulation && JSON.stringify(updatedSimFromProps) !== JSON.stringify(activeSimulation)) {
                    setActiveSimulation(updatedSimFromProps);
                }
                if(reviewingSimulation && JSON.stringify(updatedSimFromProps) !== JSON.stringify(reviewingSimulation)) {
                    setReviewingSimulation(updatedSimFromProps);
                }
            }
        }
    }, [simulations, activeSimulation, reviewingSimulation]);
    
    // Ensure selectedDispenseIds are valid when dispense list changes
    useEffect(() => {
        const validIds = dispense.map(d => d.id);
        const newSelectedIds = selectedDispenseIds.filter(id => validIds.includes(id));
        if(newSelectedIds.length !== selectedDispenseIds.length) {
            setSelectedDispenseIds(newSelectedIds);
        }
    }, [dispense, selectedDispenseIds]);

    const handleStartNewSimulation = (dispensaIds: string[], structure: ExamStructure) => {
        setGenerating(true);
        clearError();
        
        onGenerate(dispensaIds, structure)
            .then(newSimulation => {
                if (newSimulation) {
                    setActiveSimulation(newSimulation);
                    setUserAnswers(Object.fromEntries(newSimulation.questions.map(q => [q.id, null])));
                    setCurrentQuestionIndex(0);
                    setView('taking');
                }
            })
            .finally(() => {
                setGenerating(false);
            });
    };
    
    const handleAnswerSelect = (questionId: string, answer: number | string) => {
        setUserAnswers(prev => ({...prev, [questionId]: answer}));
    };
    
    const handleCancelSimulation = useCallback(() => {
        if (window.confirm("Sei sicuro di voler annullare la simulazione? Tutti i progressi andranno persi.")) {
            setView('list');
            setActiveSimulation(null);
            setUserAnswers({});
            setCurrentQuestionIndex(0);
        }
    }, []);

    const handleStructureChange = (field: keyof ExamStructure, value: string) => {
        const max = field === 'timer' ? 180 : 50;
        const min = field === 'timer' ? 1 : 0;
        const numValue = Math.max(min, Math.min(max, parseInt(value, 10) || 0));
        setExamStructure(prev => ({ ...prev, [field]: numValue }));
    };

    const handleDispensaSelection = (dispensaId: string) => {
        setSelectedDispenseIds(prev => {
            if (prev.includes(dispensaId)) {
                return prev.filter(id => id !== dispensaId);
            } else {
                return [...prev, dispensaId];
            }
        });
    };

    const renderTakingView = () => {
        if (!activeSimulation) return null;
        const question = activeSimulation.questions[currentQuestionIndex];
        const userAnswer = userAnswers[question.id];

        return (
             <div className="bg-gray-800 rounded-xl p-6 flex flex-col w-full h-full">
                <div className="flex-shrink-0 mb-4 flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
                    <div>
                        <h2 className="text-xl font-bold text-white">Simulazione in corso...</h2>
                        <p className="text-gray-400">Domanda {currentQuestionIndex + 1} di {activeSimulation.questions.length} (Punti: {question.points})</p>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                        {timeLeft !== null && (
                            <div className={`flex items-center text-white font-bold text-xl px-4 py-2 rounded-lg transition-colors ${timeLeft < 60 ? 'bg-red-500/80' : 'bg-gray-900/50'}`}>
                                <TimerIcon />
                                <span className="ml-2">{formatTime(timeLeft)}</span>
                            </div>
                        )}
                        <button onClick={handleCancelSimulation} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg">
                            Annulla
                        </button>
                    </div>
                </div>
                <div className="flex-grow my-4 overflow-y-auto pr-2">
                    <p className="text-lg text-gray-200 mb-6">{question.questionText}</p>
                    {question.type.includes('multiple-choice') && question.options ? (
                        <div className="space-y-3">
                            {question.options.map((opt, index) => (
                                <button key={index} onClick={() => handleAnswerSelect(question.id, index)} className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${userAnswer === index ? 'bg-indigo-900 border-indigo-500' : 'bg-gray-700 border-gray-600 hover:border-gray-500'}`}>
                                    {opt}
                                </button>
                            ))}
                        </div>
                    ) : (
                         <div className="flex flex-col h-full">
                            <label className="block text-sm font-medium text-gray-300 mb-2">La tua risposta:</label>
                            <SolutionEditor 
                                key={question.id}
                                initialContent={typeof userAnswer === 'string' ? userAnswer : ''}
                                onSave={(content) => handleAnswerSelect(question.id, content)}
                                isExpanded={false}
                                onToggleExpand={() => {}}
                            />
                        </div>
                    )}
                </div>
                <div className="flex-shrink-0 flex justify-between items-center mt-auto pt-4 border-t border-gray-700">
                     <button onClick={() => setCurrentQuestionIndex(p => p - 1)} disabled={currentQuestionIndex === 0} className="flex items-center bg-gray-600 hover:bg-gray-500 font-semibold py-2 px-4 rounded-lg disabled:opacity-50"><ChevronLeftIcon /> Prec</button>
                     {currentQuestionIndex === activeSimulation.questions.length - 1 ? (
                        <button onClick={handleFinishSimulation} className="bg-green-600 hover:bg-green-700 font-bold py-2 px-6 rounded-lg">Termina</button>
                     ): (
                        <button onClick={() => setCurrentQuestionIndex(p => p + 1)} disabled={currentQuestionIndex >= activeSimulation.questions.length - 1} className="flex items-center bg-indigo-600 hover:bg-indigo-700 font-semibold py-2 px-4 rounded-lg disabled:opacity-50">Succ <ChevronRightIcon /></button>
                     )}
                </div>
            </div>
        );
    };

    const renderResultsView = () => {
        const simToReview = reviewingSimulation || activeSimulation;
        if (!simToReview) return null;

        const correctnessText: Record<NonNullable<SimulationQuestion['aiCorrectness']>, string> = {
            correct: 'Corretto',
            'partially-correct': 'Parzialmente Corretto',
            incorrect: 'Sbagliato',
            'not-evaluated': 'Non Valutato',
        };
        const correctnessColors: Record<NonNullable<SimulationQuestion['aiCorrectness']>, string> = {
            correct: 'text-green-400',
            'partially-correct': 'text-yellow-400',
            incorrect: 'text-red-400',
            'not-evaluated': 'text-gray-400',
        };
        
        return (
             <div className="bg-gray-800 rounded-xl p-6">
                <div className="flex justify-between items-start mb-4 pb-4 border-b border-gray-700">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Risultati Simulazione</h2>
                        <p className="text-gray-400 truncate max-w-md">Rivedi le tue risposte per la simulazione su "{simToReview.dispensaNames.join(', ')}".</p>
                        <p className="text-sm text-gray-400">Durata: {simToReview.duration} minut{simToReview.duration === 1 ? 'o' : 'i'}. Svolta il {new Date(simToReview.date).toLocaleString('it-IT')}</p>

                        <div className="flex items-baseline gap-4 mt-2">
                            <p className="text-xl font-bold text-gray-300">Punteggio: {simToReview.score.toLocaleString('it-IT', {maximumFractionDigits: 1})} / {simToReview.totalPoints}</p>
                            <p className="text-2xl font-bold text-indigo-400">Voto: {simToReview.grade.toFixed(1)} / 30</p>
                        </div>
                    </div>
                    <button onClick={() => { setView('list'); setReviewingSimulation(null); setActiveSimulation(null); }} className="bg-gray-600 hover:bg-gray-500 font-semibold py-2 px-4 rounded-lg flex items-center"><CloseIcon className="h-5 w-5 mr-2" /> Chiudi</button>
                </div>
                <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-4">
                    {simToReview.questions.map((q, index) => (
                         <div key={q.id} className="bg-gray-900/50 p-4 rounded-lg">
                            <p className="font-semibold text-gray-300 mb-3">Domanda {index + 1} ({q.points} punt{q.points === 1 ? 'o' : 'i'}): {q.questionText}</p>
                            {q.type.includes('multiple-choice') ? (
                                <>
                                    <div className="space-y-2">
                                        {q.options?.map((opt, optIndex) => {
                                            let classes = 'border-gray-700 bg-gray-700';
                                            if (optIndex === q.correctAnswerIndex) classes = 'border-green-500 bg-green-900/50';
                                            else if (optIndex === q.userAnswerIndex) classes = 'border-red-500 bg-red-900/50';
                                            return (
                                                <div key={optIndex} className={`flex items-center p-3 rounded-md border-2 ${classes}`}>
                                                    {optIndex === q.correctAnswerIndex && <CheckCircleIcon />}
                                                    {optIndex !== q.correctAnswerIndex && optIndex === q.userAnswerIndex && <XCircleIcon />}
                                                    <span className="ml-3">{opt}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {q.explanation && (
                                        <div className={`mt-3 p-3 rounded-md text-sm ${q.userAnswerIndex === q.correctAnswerIndex ? 'bg-green-900/50' : 'bg-gray-700'}`}>
                                            <p className={`font-bold ${q.userAnswerIndex === q.correctAnswerIndex ? 'text-green-300' : 'text-yellow-300'}`}>Spiegazione:</p>
                                            <p className={`${q.userAnswerIndex === q.correctAnswerIndex ? 'text-green-200' : 'text-yellow-200'}`}>{q.explanation}</p>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="space-y-3 text-sm">
                                    <div className="bg-gray-700 p-3 rounded-md">
                                        <p className="font-bold text-gray-300 mb-1">La tua risposta:</p>
                                        <div className="text-gray-200 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: q.userAnswerContent || 'Nessuna risposta fornita.' }}></div>
                                    </div>
                                    <div className="bg-indigo-900/50 p-3 rounded-md">
                                        <p className="font-bold text-indigo-300 mb-1">Risposta modello:</p>
                                        <p className="text-indigo-200 whitespace-pre-wrap">{q.modelAnswer}</p>
                                    </div>
                                     <div className="bg-gray-700/50 p-3 rounded-md border-l-4 border-purple-500">
                                        <p className="font-bold text-purple-300 mb-2">Valutazione AI</p>
                                        {q.aiFeedback ? (
                                            <>
                                                <p className={`font-semibold mb-2 ${correctnessColors[q.aiCorrectness || 'not-evaluated']}`}>
                                                    {correctnessText[q.aiCorrectness || 'not-evaluated']}
                                                </p>
                                                <p className="text-gray-300 whitespace-pre-wrap">{q.aiFeedback}</p>
                                            </>
                                        ) : q.userAnswerContent ? (
                                            <div className="flex items-center text-gray-400">
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-300 mr-2"></div>
                                                <span>Valutazione in corso...</span>
                                            </div>
                                        ) : (
                                            <p className="text-gray-400">Nessuna risposta da valutare.</p>
                                        )}
                                    </div>
                                     <div className="bg-gray-700 p-3 rounded-md">
                                        <p className="font-bold text-yellow-300">Spiegazione/Procedimento:</p>
                                        <p className="text-yellow-200 whitespace-pre-wrap">{q.explanation}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const totalQuestions = examStructure.mcTheory + examStructure.openTheory + examStructure.mcExercise + examStructure.openExercise;
    const selectedDispenseObjects = dispense.filter(d => selectedDispenseIds.includes(d.id));
    const pagesUsedSummary = selectedDispenseObjects.length > 0
        ? selectedDispenseObjects.map(d => `${d.name}: ${d.studiedPages && d.studiedPages.trim() ? d.studiedPages : 'Tutte'}`).join('; ')
        : 'Nessuna dispensa selezionata.';

    if (showLoading) {
        return (
            <div className="fixed inset-0 bg-gray-900/95 backdrop-blur-sm z-[60] flex flex-col items-center justify-center text-center p-4">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500 mb-8"></div>
                <h2 className="text-3xl font-bold text-white mb-4">Creazione della tua simulazione...</h2>
                <p className="text-lg text-gray-300 transition-opacity duration-500 ease-in-out">{loadingMessage}</p>
            </div>
        );
    }

    if (view === 'taking') {
        return (
            <div className="fixed inset-0 bg-gray-900 z-[60] p-4 sm:p-8 flex flex-col">
                {renderTakingView()}
            </div>
        );
    }
    
    return (
        <div className="w-full max-w-5xl mx-auto flex flex-col flex-grow">
            <header className="w-full mb-6 text-center">
                <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Simulazioni Esami</h1>
                <p className="text-gray-400 mt-2 text-md">Metti alla prova la tua preparazione con quiz generati dall'AI.</p>
            </header>
            
            <div className="flex-grow">
                {view === 'list' && (
                     <>
                        <div className="bg-gray-800 rounded-xl p-6 mb-8">
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-3">
                                <h2 className="text-xl font-bold text-white">Crea Nuova Simulazione</h2>
                            </div>

                            {dispense.length === 0 ? (
                                <div className="text-center text-yellow-300 border border-yellow-700 rounded-lg p-4">
                                    <p>Per creare una simulazione, devi prima caricare almeno una dispensa nella sezione "Dispense Materia".</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Seleziona Dispense (una o più)</label>
                                        <div className="max-h-32 overflow-y-auto bg-gray-700 border border-gray-600 rounded-lg p-2 space-y-1">
                                            {dispense.map(d => (
                                                <label key={d.id} className="flex items-center space-x-3 cursor-pointer p-1.5 hover:bg-gray-600 rounded-md">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedDispenseIds.includes(d.id)}
                                                        onChange={() => handleDispensaSelection(d.id)}
                                                        className="h-4 w-4 rounded bg-gray-900 border-gray-600 text-indigo-500 focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-700 focus:ring-indigo-500"
                                                    />
                                                    <span className="text-white text-sm">{d.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="text-xs text-gray-400 bg-gray-900/50 p-3 rounded-lg">
                                        <p className="font-semibold text-gray-300">Pagine usate per la simulazione:</p>
                                        <p className="font-bold text-indigo-300 mt-1">{pagesUsedSummary}</p>
                                    </div>

                                    {subjectDetails.learnedExams && subjectDetails.learnedExams.length > 0 && (
                                        <div className="border border-gray-700 rounded-lg p-4">
                                            <h3 className="text-md font-semibold text-white mb-3">Tracce d'Esame Precedenti</h3>
                                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                            {subjectDetails.learnedExams.slice().reverse().map((exam) => (
                                                <div key={exam.id} className="bg-gray-900/50 p-3 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                    <div>
                                                        <p className="font-semibold text-gray-300 truncate max-w-xs" title={exam.fileName}>{exam.fileName}</p>
                                                        <p className="text-xs text-gray-400">
                                                        {exam.structure.mcTheory}MC-T, {exam.structure.openTheory}O-T, {exam.structure.mcExercise}MC-E, {exam.structure.openExercise}O-E, {exam.structure.timer}min
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                                                        <button onClick={() => setExamStructure(exam.structure)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-1 px-3 rounded-lg text-sm">Applica Struttura</button>
                                                    </div>
                                                </div>
                                            ))}
                                            </div>
                                        </div>
                                    )}
                                    
                                    <fieldset className="border border-gray-700 rounded-lg p-4">
                                        <legend className="text-md font-semibold text-white px-2">Struttura Esame</legend>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                                            <div>
                                                <label htmlFor="mc-theory" className="block text-sm font-medium text-gray-300 mb-1">Risp. Multipla (Teoria)</label>
                                                <input id="mc-theory" type="number" value={examStructure.mcTheory} onChange={e => handleStructureChange('mcTheory', e.target.value)} min="0" className="w-full bg-gray-700 border-gray-600 rounded-lg p-2.5"/>
                                            </div>
                                            <div>
                                                <label htmlFor="open-theory" className="block text-sm font-medium text-gray-300 mb-1">Risp. Aperta (Teoria)</label>
                                                <input id="open-theory" type="number" value={examStructure.openTheory} onChange={e => handleStructureChange('openTheory', e.target.value)} min="0" className="w-full bg-gray-700 border-gray-600 rounded-lg p-2.5"/>
                                            </div>
                                            <div>
                                                <label htmlFor="mc-exercise" className="block text-sm font-medium text-gray-300 mb-1">Risp. Multipla (Esercizi)</label>
                                                <input id="mc-exercise" type="number" value={examStructure.mcExercise} onChange={e => handleStructureChange('mcExercise', e.target.value)} min="0" className="w-full bg-gray-700 border-gray-600 rounded-lg p-2.5"/>
                                            </div>
                                            <div>
                                                <label htmlFor="open-exercise" className="block text-sm font-medium text-gray-300 mb-1">Risp. Aperta (Esercizi)</label>
                                                <input id="open-exercise" type="number" value={examStructure.openExercise} onChange={e => handleStructureChange('openExercise', e.target.value)} min="0" className="w-full bg-gray-700 border-gray-600 rounded-lg p-2.5"/>
                                            </div>
                                            <div className="lg:col-span-1">
                                                <label htmlFor="timer-duration" className="block text-sm font-medium text-gray-300 mb-1">Durata (minuti)</label>
                                                <input id="timer-duration" type="number" value={examStructure.timer} onChange={e => handleStructureChange('timer', e.target.value)} min="1" max="180" className="w-full bg-gray-700 border-gray-600 rounded-lg p-2.5"/>
                                            </div>
                                            <div className="sm:col-span-2 lg:col-span-3 pt-3 mt-2 border-t border-gray-700/50 text-xs text-gray-400 bg-gray-900/50 p-3 rounded-lg border-l-2 border-indigo-500">
                                                <p><span className="font-bold text-gray-300">Nota:</span> Le domande pratiche (esercizi) saranno generate basandosi sugli argomenti degli esercizi che hai già completato nella sezione 'Esercitazioni', creando una sfida progressiva e su misura per te.</p>
                                            </div>
                                        </div>
                                    </fieldset>

                                    <button
                                        onClick={() => handleStartNewSimulation(selectedDispenseIds, examStructure)}
                                        disabled={showLoading || selectedDispenseIds.length === 0 || totalQuestions === 0}
                                        className="w-full inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed"
                                    >
                                        <PlusIcon />Inizia Simulazione ({totalQuestions})
                                    </button>
                                    {error && <p className="text-red-400 text-sm mt-2 text-center">{error}</p>}
                                </div>
                            )}
                        </div>

                        <div className="bg-gray-800 rounded-xl p-6">
                            <h2 className="text-xl font-bold text-white mb-4">Simulazioni Passate</h2>
                            {simulations.length > 0 ? (
                                <ul className="space-y-3">
                                    {simulations.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(sim => (
                                        <li key={sim.id} className="bg-gray-700 p-4 rounded-lg flex justify-between items-center">
                                            <div>
                                                <p className="font-semibold text-white truncate max-w-xs">Basata su: {sim.dispensaNames.join(', ')}</p>
                                                <p className="text-sm text-gray-400">{new Date(sim.date).toLocaleString('it-IT')}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-lg text-white">
                                                    {sim.totalPoints > 0 ? `Voto: ${sim.grade.toFixed(1)}/30` : `Completata`}
                                                </p>
                                                <button onClick={() => { setReviewingSimulation(sim); setView('results'); }} className="text-indigo-400 hover:underline text-sm font-semibold">Rivedi</button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-gray-400 text-center py-4">Nessuna simulazione completata per questa materia.</p>
                            )}
                        </div>
                    </>
                )}
                {view === 'results' && renderResultsView()}
            </div>
        </div>
    );
};