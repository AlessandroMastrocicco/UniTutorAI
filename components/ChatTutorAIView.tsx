import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { SavedDispensa, LessonStep, ChatMessage, Thumbnail, PDFDocumentProxy, PDFPageProxy } from '../types';
// FIX: import db to access appState
import { db, type DbThumbnail } from '../db';

// --- Icons ---
const PlayIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>;
const PauseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>;
const StopIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 8a2 2 0 00-2 2v4a2 2 0 002 2h4a2 2 0 002-2v-4a2 2 0 00-2-2H8z" clipRule="evenodd" /></svg>;
const NewLessonIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>;
const AskQuestionIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ScriptIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
const SendIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>;

// --- Sub-components ---

const LessonPageViewer: React.FC<{
    pdfDoc: PDFDocumentProxy;
    pageNumber: number;
}> = ({ pdfDoc, pageNumber }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!pdfDoc || !pageNumber) return;

        let renderTask: ReturnType<PDFPageProxy['render']> | null = null;
        let isCancelled = false;
        let animationFrameId: number;

        const renderPage = async () => {
            try {
                if (isCancelled) return;

                const page = await pdfDoc.getPage(pageNumber);
                if (isCancelled) return;
                
                const canvas = canvasRef.current;
                const container = containerRef.current;
                if (!canvas || !container) return;
                
                if (container.clientWidth === 0) {
                    return;
                }

                const context = canvas.getContext('2d');
                if (!context) return;
                
                const viewport = page.getViewport({ scale: 1 });
                const scale = container.clientWidth / viewport.width;
                const scaledViewport = page.getViewport({ scale: scale });

                canvas.height = scaledViewport.height;
                canvas.width = scaledViewport.width;

                const renderContext = {
                    canvasContext: context,
                    viewport: scaledViewport,
                };

                renderTask = page.render(renderContext);
                await renderTask.promise;
            } catch (error) {
                if ((error as Error).name !== 'RenderingCancelledException') {
                    console.error("Error rendering page:", error);
                }
            }
        };

        const resizeObserver = new ResizeObserver(() => {
            if (animationFrameId) {
                window.cancelAnimationFrame(animationFrameId);
            }
            // By wrapping the re-render in requestAnimationFrame, we avoid the
            // "ResizeObserver loop completed with undelivered notifications" error
            // and prevent race conditions during unmounting.
            animationFrameId = window.requestAnimationFrame(() => {
                if (isCancelled) return;
                if (renderTask) {
                    (renderTask as any).cancel();
                }
                renderPage();
            });
        });

        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        renderPage();

        return () => {
            isCancelled = true;
            if (animationFrameId) {
                window.cancelAnimationFrame(animationFrameId);
            }
            if (renderTask) {
                (renderTask as any).cancel();
            }
            if (containerRef.current) {
                resizeObserver.unobserve(containerRef.current);
            }
        };
    }, [pdfDoc, pageNumber]);

    return (
        <div ref={containerRef} className="w-full h-full flex justify-center overflow-y-auto">
            <canvas ref={canvasRef} className="shadow-2xl max-w-full" />
        </div>
    );
};

const LessonGenerator: React.FC<{
    dispense: SavedDispensa[];
    isGenerating: boolean;
    error: string | null;
    onGenerateCustomLesson: (dispensaId: string, pageRange: string, lessonTitle: string) => Promise<void>;
    t: (key: string) => string;
}> = ({ dispense, isGenerating, error, onGenerateCustomLesson, t }) => {
    const [selectedDispensaId, setSelectedDispensaId] = useState<string>('');
    const [lessonTitle, setLessonTitle] = useState('');
    const [pageRange, setPageRange] = useState('');

    useEffect(() => {
        if (dispense.length > 0) setSelectedDispensaId(dispense[0].id);
        else setSelectedDispensaId('');
        setLessonTitle('');
        setPageRange('');
    }, [dispense]);

    const handleGenerate = () => {
        if (!selectedDispensaId || !lessonTitle.trim() || !pageRange.trim()) return;
        onGenerateCustomLesson(selectedDispensaId, pageRange, lessonTitle);
    };

    const isGenerateDisabled = !selectedDispensaId || !lessonTitle.trim() || !pageRange.trim() || isGenerating;
    
    if (dispense.length === 0) return <div className="p-8 text-center h-full flex items-center justify-center"><p className="text-yellow-400"><strong>Attenzione:</strong> Nessuna dispensa trovata. Caricane una per poter generare una lezione.</p></div>
    if (isGenerating) return <div className="flex flex-col items-center justify-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div><p className="text-lg text-gray-300">Generazione della lezione in corso...</p><p className="text-sm text-gray-500">L'operazione potrebbe richiedere qualche istante.</p></div>;
    if (error) return <div className="p-8 text-center text-red-400"><strong>Errore:</strong> {error.replace('Errore Lezione AI:', '').trim()}</div>

    return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Crea una lezione personalizzata</h2>
            <p className="text-gray-400 mb-6 max-w-lg">Scegli una dispensa, dai un titolo alla lezione e specifica le pagine da includere.</p>
            <div className="w-full max-w-md space-y-4">
                <div>
                    <label htmlFor="dispensa-select" className="block text-sm font-medium text-gray-300 text-left mb-1">Dispensa</label>
                    <select id="dispensa-select" value={selectedDispensaId} onChange={e => setSelectedDispensaId(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 focus:ring-indigo-500 focus:border-indigo-500">
                        {dispense.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                </div>
                 <div>
                    <label htmlFor="lesson-title" className="block text-sm font-medium text-gray-300 text-left mb-1">Titolo Lezione</label>
                    <input id="lesson-title" type="text" value={lessonTitle} onChange={e => setLessonTitle(e.target.value)} placeholder="es. Introduzione agli Integrali" className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
                 <div>
                    <label htmlFor="page-range" className="block text-sm font-medium text-gray-300 text-left mb-1">Pagine da Includere</label>
                    <input id="page-range" type="text" value={pageRange} onChange={e => setPageRange(e.target.value)} placeholder="es. 1-5, 8, 12-15" className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
                <button onClick={handleGenerate} disabled={isGenerateDisabled} className="w-full inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed">
                    <NewLessonIcon />
                    Crea Lezione con AI
                </button>
            </div>
        </div>
    );
};


// --- Main Component ---

interface LessonPlayerViewProps {
    selectedSubject: string;
    dispense: SavedDispensa[];
    allThumbnails: Record<string, DbThumbnail[]>;
    lesson: LessonStep[] | null;
    currentTopicTitle: string;
    onGenerateCustomLesson: (dispensaId: string, pageRange: string, lessonTitle: string) => Promise<void>;
    onLessonFinish: (topic: { id: string; title: string; moduleId: string; }, transcript: LessonStep[]) => void;
    onAskTutorQuestion: (question: string, context: string) => Promise<string>;
    isGenerating: boolean;
    error: string | null;
    onClearLesson: () => void;
    t: (key: string) => string;
}

export const ChatTutorAIView: React.FC<LessonPlayerViewProps> = ({ selectedSubject, dispense, allThumbnails, lesson, currentTopicTitle, onGenerateCustomLesson, onLessonFinish, onAskTutorQuestion, isGenerating, error, onClearLesson, t }) => {
    const [lessonState, setLessonState] = useState<'idle' | 'playing' | 'paused' | 'finished'>('idle');
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [currentText, setCurrentText] = useState('');
    const [isScriptOpen, setIsScriptOpen] = useState(false);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [liveTranscript, setLiveTranscript] = useState<LessonStep[]>([]);
    const [lessonPdfDoc, setLessonPdfDoc] = useState<PDFDocumentProxy | null>(null);
    
    // State for asking questions
    const [isAskingQuestion, setIsAskingQuestion] = useState(false);
    const [userQuestion, setUserQuestion] = useState('');
    const [isProcessingQuestion, setIsProcessingQuestion] = useState(false);

    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const activeStepRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        activeStepRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, [currentStepIndex]);

    // Load available voices for speech synthesis
    useEffect(() => {
        const loadVoices = () => {
            setVoices(window.speechSynthesis.getVoices());
        };
        window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
        loadVoices();
        return () => window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    }, []);

    const resetPlayerState = useCallback(() => {
        window.speechSynthesis.cancel();
        setLessonState('idle');
        setCurrentStepIndex(0);
        setCurrentText('');
        utteranceRef.current = null;
    }, []);

    useEffect(() => {
        resetPlayerState();
        setIsScriptOpen(false);
        let pdfDocForCleanup: PDFDocumentProxy | null = null;
        
        const loadLesson = async () => {
            if (lesson && lesson.length > 0) {
                setLiveTranscript(lesson);
                setCurrentText('Lezione pronta. Premi Play per iniziare.');
                const firstStep = lesson[0];

                try {
                    const pdfFile = await db.pdfFiles.get(firstStep.dispensaId);
                    if (!pdfFile) throw new Error("File PDF della lezione non trovato.");

                    const pdfjsLib = (window as any).pdfjsLib;
                    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

                    const arrayBuffer = await pdfFile.file.arrayBuffer();
                    const typedArray = new Uint8Array(arrayBuffer);
                    const loadingTask = pdfjsLib.getDocument(typedArray);
                    const pdf = await loadingTask.promise;
                    
                    pdfDocForCleanup = pdf;
                    setLessonPdfDoc(pdf);
                } catch(e) {
                    console.error("Errore nel caricamento del PDF per la lezione:", e);
                    setLessonPdfDoc(null);
                }
            } else {
                setLiveTranscript([]);
                setLessonPdfDoc(null);
            }
        };

        loadLesson();

        return () => {
            if (pdfDocForCleanup) {
                pdfDocForCleanup.destroy();
            }
            setLessonPdfDoc(null);
        }
    }, [lesson, resetPlayerState]);


    useEffect(() => () => window.speechSynthesis.cancel(), []);

    const playStep = useCallback(async (index: number) => {
        if (!liveTranscript || index >= liveTranscript.length) {
            setLessonState('finished');
            setCurrentText(`Lezione terminata: "${currentTopicTitle || 'argomento corrente'}". Il diario è stato salvato.`);
            const lessonState = await db.appState.get('currentLesson');
            const topicInfo = lessonState?.value?.topic;
            if(topicInfo) {
               onLessonFinish(topicInfo, liveTranscript);
            }
            return;
        }

        const step = liveTranscript[index];
        setCurrentStepIndex(index);
        setCurrentText(step.text);

        // If it's a user question, don't speak it. Just display and move to the answer.
        if (step.role === 'user-question') {
            setTimeout(() => playStep(index + 1), 1500); // Wait a bit so user can read their question
            return;
        }

        const utterance = new SpeechSynthesisUtterance(step.text);
        utterance.lang = 'it-IT';
        
        const italianVoices = voices.filter(voice => voice.lang === 'it-IT');
        let selectedVoice = italianVoices.find(voice => /google/i.test(voice.name)) || italianVoices.find(voice => /natural|naturale/i.test(voice.name)) || italianVoices[0];
        if (selectedVoice) utterance.voice = selectedVoice;
        utterance.pitch = 1.1;
        utterance.rate = 1.05;

        utterance.onend = () => playStep(index + 1);
        utterance.onerror = (event) => {
            console.error('SpeechSynthesisUtterance.onerror', event);
            setCurrentText(`Errore durante la riproduzione: ${event.error}`);
            setLessonState('idle');
        };

        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
    }, [liveTranscript, onLessonFinish, currentTopicTitle, voices]);
    
    const handleNewQaPair = useCallback((question: string, answer: string) => {
        if (!liveTranscript || currentStepIndex >= liveTranscript.length) return;
        
        const currentOriginalStep = liveTranscript[currentStepIndex];
        const questionStep: LessonStep = { text: `Domanda: ${question}`, dispensaId: currentOriginalStep.dispensaId, pageNumber: currentOriginalStep.pageNumber, role: 'user-question' };
        const answerStep: LessonStep = { text: `Risposta: ${answer}`, dispensaId: currentOriginalStep.dispensaId, pageNumber: currentOriginalStep.pageNumber, role: 'tutor-answer' };

        setLiveTranscript(prev => {
            const newTranscript = [...prev];
            newTranscript.splice(currentStepIndex + 1, 0, questionStep, answerStep);
            return newTranscript;
        });

    }, [liveTranscript, currentStepIndex]);

    const handlePlay = () => {
        if (lessonState === 'paused') {
            window.speechSynthesis.resume();
            setLessonState('playing');
        } else if (liveTranscript && liveTranscript.length > 0 && lessonState !== 'playing') {
            setLessonState('playing');
            playStep(currentStepIndex);
        }
    };

    const handlePause = () => {
        if (lessonState === 'playing') {
            window.speechSynthesis.pause();
            setLessonState('paused');
        }
    };
    
    const handleStop = () => {
        window.speechSynthesis.cancel();
        setLessonState('idle');
        setCurrentStepIndex(0);
        setCurrentText('Lezione interrotta. Premi Play per ricominciare dall\'inizio.');
    }
    
    const handleNewLesson = () => {
        onClearLesson();
    }

    const handleAskQuestionClick = () => {
        handlePause();
        setIsAskingQuestion(true);
    };

    const handleSendQuestion = async () => {
        if (!userQuestion.trim()) return;

        setIsAskingQuestion(false);
        setIsProcessingQuestion(true);
        setCurrentText('Il tutor sta pensando...');

        const context = liveTranscript[currentStepIndex]?.text || currentText;
        const answer = await onAskTutorQuestion(userQuestion, context);
        
        handleNewQaPair(userQuestion, answer); 
        
        setIsProcessingQuestion(false);
        setUserQuestion('');
        setCurrentText('Domanda inserita nel copione. Premi Play per continuare.');
    };
    
    const renderLessonPlayer = () => {
        const currentStep = liveTranscript?.[currentStepIndex];
        return (
            <div className="h-full w-full bg-black flex flex-col">
                {/* Page Viewer with Text Overlay */}
                <div className="flex-grow p-4 overflow-hidden relative">
                    {lessonPdfDoc && currentStep ? (
                        <LessonPageViewer pdfDoc={lessonPdfDoc} pageNumber={currentStep.pageNumber} />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-500 mb-4"></div>
                            <p>Caricamento documento...</p>
                        </div>
                    )}
                    
                    {/* Dynamic Overlay for Text/Input */}
                    <div className="absolute bottom-4 left-4 right-4 bg-black/70 backdrop-blur-sm p-3 rounded-lg z-20 pointer-events-auto">
                        {isAskingQuestion ? (
                            <div className="flex items-center gap-2">
                                <input 
                                    type="text"
                                    value={userQuestion}
                                    onChange={e => setUserQuestion(e.target.value)}
                                    onKeyPress={e => e.key === 'Enter' && handleSendQuestion()}
                                    placeholder="Scrivi qui la tua domanda..."
                                    autoFocus
                                    className="flex-1 bg-gray-700/50 border border-gray-600 rounded-lg p-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                <button onClick={handleSendQuestion} className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-full disabled:bg-gray-500" disabled={!userQuestion.trim() || isProcessingQuestion}>
                                    <SendIcon />
                                </button>
                                <button onClick={() => { setIsAskingQuestion(false); setUserQuestion(''); }} className="bg-gray-600 hover:bg-gray-500 text-white p-2 rounded-full">
                                    <CloseIcon />
                                </button>
                            </div>
                        ) : isProcessingQuestion ? (
                            <div className="flex items-center justify-center text-lg text-white font-semibold">
                                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-3"></div>
                                Il tutor sta pensando...
                            </div>
                        ) : (
                            <div className="text-center pointer-events-none">
                                <p className="text-lg text-white font-semibold">{currentText}</p>
                            </div>
                        )}
                    </div>

                    {/* Script Panel */}
                    <div className={`absolute top-0 right-0 h-full w-full max-w-md bg-gray-900/80 backdrop-blur-sm shadow-2xl z-30 flex flex-col transition-transform duration-300 ease-in-out ${isScriptOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                        <div className="flex justify-between items-center p-4 border-b border-gray-700 flex-shrink-0">
                            <h3 className="text-xl font-bold text-white">Copione Lezione</h3>
                            <button onClick={() => setIsScriptOpen(false)} className="p-1 text-gray-400 hover:text-white"><CloseIcon /></button>
                        </div>
                        <div className="flex-grow overflow-y-auto p-4">
                            {lessonState === 'finished' ? (
                                <div className="bg-green-900/50 p-4 rounded-lg h-full">
                                    <h4 className="font-bold text-green-300">Lezione Completata!</h4>
                                    <p className="text-green-200 mt-2">{currentText}</p>
                                </div>
                            ) : (
                                <div className="space-y-3 pr-2">
                                    {liveTranscript.map((step, index) => {
                                        const isPlayingThisStep = index === currentStepIndex && lessonState === 'playing';
                                        const isUserQuestion = step.role === 'user-question';
                                        const isTutorAnswer = step.role === 'tutor-answer';

                                        let stepClasses = 'p-3 rounded-lg transition-all duration-300 ';
                                        if (isPlayingThisStep) {
                                            stepClasses += 'bg-indigo-900/80 ring-2 ring-indigo-500';
                                        } else if (isUserQuestion) {
                                            stepClasses += 'bg-gray-700/80 border-l-4 border-gray-500';
                                        } else if (isTutorAnswer) {
                                            stepClasses += 'bg-gray-700/80 border-l-4 border-indigo-500';
                                        } else {
                                            stepClasses += 'bg-gray-700/50';
                                        }
                                        
                                        return (
                                            <div ref={isPlayingThisStep ? activeStepRef : null} key={`${step.text.slice(0, 10)}-${index}`} className={stepClasses}>
                                                <p className="text-gray-200 whitespace-pre-wrap">{step.text}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                
                {/* Controls */}
                <div className="flex-shrink-0 p-3 bg-gray-900/50 flex justify-center items-center gap-4 border-t border-gray-700">
                    <button onClick={handleNewLesson} className="p-3 bg-gray-700 rounded-full text-gray-300 hover:text-white hover:bg-gray-600 transition-colors" title="Prepara Nuova Lezione"><NewLessonIcon className="h-6 w-6" /></button>
                    <button onClick={lessonState === 'playing' ? handlePause : handlePlay} disabled={lessonState === 'finished'} className="p-3 bg-indigo-600 rounded-full text-white disabled:bg-gray-600 transition-colors" title={lessonState === 'playing' ? "Pausa" : "Play"}>{lessonState === 'playing' ? <PauseIcon /> : <PlayIcon />}</button>
                    <button onClick={handleStop} disabled={lessonState === 'idle' || lessonState === 'finished'} className="p-3 bg-gray-700 rounded-full text-gray-300 hover:text-white disabled:text-gray-600 transition-colors" title="Stop"><StopIcon /></button>
                    <button onClick={handleAskQuestionClick} disabled={lessonState === 'idle' || lessonState === 'finished' || isAskingQuestion || isProcessingQuestion} className="p-3 bg-gray-700 rounded-full text-gray-300 hover:text-white disabled:text-gray-600 transition-colors" title="Fai una domanda"><AskQuestionIcon /></button>
                    <button onClick={() => setIsScriptOpen(v => !v)} className="p-3 bg-gray-700 rounded-full text-gray-300 hover:text-white transition-colors" title="Mostra/Nascondi Copione"><ScriptIcon /></button>
                </div>
            </div>
        );
    }
    
    const renderDiaryView = () => (
        <div className="flex flex-col h-full w-full gap-4 p-4">
            <div className="bg-gray-900/50 rounded-lg p-4">
                <h3 className="text-2xl font-bold text-white">Diario della Lezione: {currentTopicTitle}</h3>
                <p className="text-green-400 mt-1">Lezione completata e salvata nel tuo diario.</p>
            </div>
            <div className="flex-grow bg-gray-900/50 rounded-lg p-4 overflow-y-auto">
                {liveTranscript.map((step, index) => (
                    <div key={index} className="mb-4 p-3 bg-gray-700/50 rounded-lg">
                        <p className="text-xs font-bold text-indigo-400 mb-1">Slide Pag. {step.pageNumber}</p>
                        <p className="text-gray-200 whitespace-pre-wrap">{step.text}</p>
                    </div>
                ))}
            </div>
            <div className="flex-shrink-0">
                 <button onClick={handleNewLesson} className="w-full max-w-md mx-auto inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"><NewLessonIcon />Prepara Nuova Lezione</button>
            </div>
        </div>
    );

    return (
         <div className="w-full max-w-7xl mx-auto flex flex-col flex-grow h-full">
             {(!lesson || lesson.length === 0) &&
                <header className="w-full mb-6 text-center">
                    <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Lezione con Tutor AI</h1>
                    <p className="text-gray-400 mt-2 text-md">Ascolta una spiegazione personalizzata su <span className="font-bold text-indigo-400">{selectedSubject}</span>.</p>
                </header>
             }
            
            <div className="flex-grow flex flex-col bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
                {(!lesson || lesson.length === 0) ? <LessonGenerator dispense={dispense} isGenerating={isGenerating} error={error} onGenerateCustomLesson={onGenerateCustomLesson} t={t} /> : (lessonState === 'finished' ? renderDiaryView() : renderLessonPlayer())}
            </div>
        </div>
    );
};