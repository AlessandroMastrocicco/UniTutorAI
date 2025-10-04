import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { PDFDocumentProxy, SavedDispensa, Thumbnail, ChatMessage, PDFPageProxy } from '../types';
import { db, type DbThumbnail, type DbDispensa } from '../db';

// --- Icons ---
const UploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>;
const CheckCircleIcon = ({ className = "h-6 w-6 text-white" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>;
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" /></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>;
const ChevronLeftIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>;
const ChevronRightIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>;
const BackIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" /></svg>;
const TimerIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.415L11 9.586V6z" clipRule="evenodd" /></svg>;
const SparkleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>;
const SendIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>;
const SortIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path d="M5 12a1 1 0 102 0V6.414l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L5 6.414V12zM15 8a1 1 0 10-2 0v5.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3 3a1 1 0 00-1.414-1.414L15 13.586V8z" /></svg>;
const PencilIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>;


interface DispenseViewProps {
    onSave: (data: { name: string; topic: string; file: File; totalPages: number; thumbnails: Thumbnail[]; textData: { pageNumber: number, content: string }[] }) => Promise<void>;
    onDelete: (dispensaId: string) => void;
    onUpdateStudiedPages: (dispensaId: string, studiedPages: string) => Promise<void>;
    isProcessing: boolean;
    subjectName: string;
    dataVersion: number;
    onAskTutorQuestion: (question: string, context: string) => Promise<string>;
    t: (key: string) => string;
}

const DispensaPageViewer: React.FC<{
    pdfDoc: PDFDocumentProxy;
    pageNumber: number;
    scale: number;
}> = ({ pdfDoc, pageNumber, scale }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isRendering, setIsRendering] = useState(false);

    useEffect(() => {
        if (!pdfDoc || !pageNumber) return;

        let isCancelled = false;
        let renderTask: ReturnType<PDFPageProxy['render']> | null = null;

        const renderPage = async () => {
            setIsRendering(true);
            try {
                const page = await pdfDoc.getPage(pageNumber);
                if (isCancelled) return;

                const canvas = canvasRef.current;
                if (!canvas) return;

                const context = canvas.getContext('2d');
                if (!context) return;
                
                const viewport = page.getViewport({ scale });
                
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                const renderContext = {
                    canvasContext: context,
                    viewport: viewport
                };

                renderTask = page.render(renderContext);
                await renderTask.promise;
            } catch (error) {
                if ((error as Error).name !== 'RenderingCancelledException') {
                    console.error("Error rendering page:", error);
                }
            } finally {
                if (!isCancelled) {
                    setIsRendering(false);
                }
            }
        };

        renderPage();

        return () => {
            isCancelled = true;
            if (renderTask) {
                (renderTask as any).cancel();
            }
        }
    }, [pdfDoc, pageNumber, scale]);

    return (
        <div className="relative w-full h-full flex items-center justify-center">
            {isRendering && (
                <div className="absolute inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-10 rounded-lg">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
            )}
            <canvas ref={canvasRef} className="rounded-md shadow-lg" style={{maxWidth: '100%', maxHeight: '100%', objectFit: 'contain'}}></canvas>
        </div>
    );
};


const groupByKey = <T extends Record<string, any>>(array: T[], key: keyof T): Record<string, T[]> => {
    return array.reduce((acc, item) => {
        const group = item[key];
        (acc[group] = acc[group] || []).push(item);
        return acc;
    }, {} as Record<string, T[]>);
};

const parsePageRanges = (rangeStr: string, totalPages: number): Set<number> => {
    const newSelection = new Set<number>();
    if (!rangeStr) return newSelection;

    const parts = rangeStr.split(',');
    for (const part of parts) {
        const trimmedPart = part.trim();
        if (trimmedPart.includes('-')) {
            const [start, end] = trimmedPart.split('-').map(s => parseInt(s.trim(), 10));
            if (!isNaN(start) && !isNaN(end) && start <= end) {
                for (let i = start; i <= end; i++) {
                    if (i > 0 && i <= totalPages) newSelection.add(i);
                }
            }
        } else {
            const pageNum = parseInt(trimmedPart, 10);
            if (!isNaN(pageNum) && pageNum > 0 && pageNum <= totalPages) {
                newSelection.add(pageNum);
            }
        }
    }
    return newSelection;
};

function compressPageNumbers(pages: number[]): string {
    if (pages.length === 0) return '';
    const sorted = [...new Set(pages)].sort((a, b) => a - b);
    
    const ranges = sorted.reduce((acc, current) => {
        if (acc.length === 0) {
            acc.push([current]);
            return acc;
        }
        const lastRange = acc[acc.length - 1];
        const lastElement = lastRange[lastRange.length - 1];
        if (current === lastElement + 1) {
            lastRange.push(current);
        } else {
            acc.push([current]);
        }
        return acc;
    }, [] as number[][]);

    return ranges.map(range => {
        if (range.length > 2) {
            return `${range[0]}-${range[range.length - 1]}`;
        }
        return range.join(', ');
    }).join(', ');
}


const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const POMODORO_DURATIONS = {
    work: 25 * 60,
    short_break: 5 * 60,
    long_break: 15 * 60
};

const StudyTimer: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [mode, setMode] = useState<'pomodoro' | 'custom'>('pomodoro');
    const [customMinutes, setCustomMinutes] = useState(25);
    const [timeLeft, setTimeLeft] = useState(POMODORO_DURATIONS.work);
    const [isRunning, setIsRunning] = useState(false);
    const [pomodoroState, setPomodoroState] = useState<'work' | 'short_break' | 'long_break'>('work');
    const [pomodoroCycles, setPomodoroCycles] = useState(0);
    const audioRef = useRef<HTMLAudioElement>(null);

    const handleTimerEnd = () => {
        audioRef.current?.play();
        setIsRunning(false);

        if (mode === 'pomodoro') {
            if (pomodoroState === 'work') {
                const newCycles = pomodoroCycles + 1;
                setPomodoroCycles(newCycles);
                if (newCycles % 4 === 0) {
                    setPomodoroState('long_break');
                    setTimeLeft(POMODORO_DURATIONS.long_break);
                } else {
                    setPomodoroState('short_break');
                    setTimeLeft(POMODORO_DURATIONS.short_break);
                }
            } else {
                setPomodoroState('work');
                setTimeLeft(POMODORO_DURATIONS.work);
            }
        }
    };

    useEffect(() => {
        if (!isRunning) return;

        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    handleTimerEnd();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isRunning, mode, pomodoroState, pomodoroCycles]);
    
    const resetTimer = () => {
        setIsRunning(false);
        if (mode === 'pomodoro') {
            setPomodoroState('work');
            setTimeLeft(POMODORO_DURATIONS.work);
            setPomodoroCycles(0);
        } else {
            setTimeLeft(customMinutes * 60);
        }
    };

    useEffect(resetTimer, [mode, customMinutes]);
    
    const getStateText = () => {
        if (mode === 'custom') return 'Personalizzato';
        if (pomodoroState === 'work') return `Studio (${pomodoroCycles % 4 + 1}/4)`;
        if (pomodoroState === 'short_break') return 'Pausa Breve';
        return 'Pausa Lunga';
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsVisible(v => !v)}
                className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                title="Timer di Studio"
            >
                <TimerIcon />
            </button>
            <audio ref={audioRef} src="https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg" preload="auto" />

            {isVisible && (
                <div className="absolute bottom-full right-0 mb-2 bg-gray-900/80 backdrop-blur-md border border-gray-700 text-white rounded-xl shadow-2xl w-64 p-4 z-40">
                    <div className="flex justify-between items-center mb-3">
                        <h4 className="font-bold">Timer di Studio</h4>
                        <button onClick={() => setIsVisible(false)} className="text-gray-400 hover:text-white">&times;</button>
                    </div>
                    
                    <div className="text-center bg-gray-800 p-4 rounded-lg mb-3">
                        <p className="text-sm text-indigo-300">{getStateText()}</p>
                        <p className="text-5xl font-mono font-bold tracking-widest">{formatTime(timeLeft)}</p>
                    </div>

                    <div className="flex justify-center gap-2 mb-4">
                        <button onClick={() => setIsRunning(!isRunning)} className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-md text-sm font-semibold w-20">{isRunning ? 'Pausa' : 'Avvia'}</button>
                        <button onClick={resetTimer} className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded-md text-sm font-semibold">Reset</button>
                    </div>

                    <div className="flex text-xs border border-gray-700 rounded-md p-0.5 mb-3">
                        <button onClick={() => setMode('pomodoro')} className={`flex-1 py-1 rounded ${mode === 'pomodoro' ? 'bg-indigo-600' : ''}`}>Pomodoro</button>
                        <button onClick={() => setMode('custom')} className={`flex-1 py-1 rounded ${mode === 'custom' ? 'bg-indigo-600' : ''}`}>Personalizzato</button>
                    </div>
                    
                    {mode === 'custom' && (
                        <div className="flex items-center gap-2 text-sm">
                            <label htmlFor="custom-minutes">Minuti:</label>
                            <input
                                id="custom-minutes"
                                type="number"
                                value={customMinutes}
                                onChange={e => setCustomMinutes(Math.max(1, parseInt(e.target.value, 10) || 1))}
                                className="w-full bg-gray-700 border border-gray-600 rounded p-1"
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const StarRating: React.FC<{ score: number | null | undefined }> = ({ score }) => {
    if (score == null) {
        return <div className="text-xs text-gray-500 italic">Dati non disponibili</div>;
    }
    const starCount = Math.round(score * 5);
    return (
        <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
                <svg key={i} className={`h-5 w-5 ${i < starCount ? 'text-yellow-400' : 'text-gray-600'}`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            ))}
        </div>
    );
};

const StudyProgressModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    dispensa: SavedDispensa & { pages: Thumbnail[] };
    onSave: (studiedPages: string) => void;
    currentPageInViewer: number;
}> = ({ isOpen, onClose, dispensa, onSave, currentPageInViewer }) => {
    const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
    const [rangeInput, setRangeInput] = useState('');

    useEffect(() => {
        if (isOpen) {
            setSelectedPages(parsePageRanges(dispensa.studiedPages || '', dispensa.totalPages));
            setRangeInput('');
        }
    }, [isOpen, dispensa]);

    if (!isOpen) return null;

    const togglePageSelection = (pageNumber: number) => {
        const newSelection = new Set(selectedPages);
        if (newSelection.has(pageNumber)) {
            newSelection.delete(pageNumber);
        } else {
            newSelection.add(pageNumber);
        }
        setSelectedPages(newSelection);
    };

    const handleSelectAll = () => {
        const allPages = new Set(dispensa.pages.map(p => p.pageNumber));
        setSelectedPages(allPages);
    };

    const handleDeselectAll = () => {
        setSelectedPages(new Set());
    };
    
    const handleSelectUpToCurrent = () => {
        const currentViewerPageNumber = dispensa.pages[currentPageInViewer -1]?.pageNumber;
        if (!currentViewerPageNumber) return;

        const upToPages = new Set<number>();
        for (const page of dispensa.pages) {
            upToPages.add(page.pageNumber);
            if (page.pageNumber === currentViewerPageNumber) break;
        }
        setSelectedPages(upToPages);
    }

    const handleApplyRange = () => {
        const newSelection = parsePageRanges(rangeInput, dispensa.totalPages);
        setSelectedPages(newSelection);
    };

    const handleSave = () => {
        const newStudiedPagesString = compressPageNumbers(Array.from(selectedPages));
        onSave(newStudiedPagesString);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-[51] p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-6xl flex flex-col h-[90vh]" onClick={e => e.stopPropagation()}>
                <header className="flex-shrink-0 p-4 flex justify-between items-center border-b border-gray-700">
                    <div>
                        <h2 className="text-xl font-bold text-white">Modifica Pagine Studiate</h2>
                        <p className="text-sm text-gray-400">Seleziona le pagine che hai completato per "{dispensa.name}"</p>
                    </div>
                    <p className="text-sm font-semibold bg-gray-700 px-3 py-1 rounded-full">{selectedPages.size} / {dispensa.pages.length} selezionate</p>
                </header>
                
                <div className="flex-shrink-0 p-4 border-b border-gray-700 bg-gray-900/50 space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="text-sm font-semibold">Selezione Rapida:</span>
                        <button onClick={handleSelectAll} className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-1.5 px-3 rounded-lg text-sm">Seleziona Tutto</button>
                        <button onClick={handleDeselectAll} className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-1.5 px-3 rounded-lg text-sm">Deseleziona Tutto</button>
                        <button onClick={handleSelectUpToCurrent} className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-1.5 px-3 rounded-lg text-sm">Seleziona fino a pag. {dispensa.pages[currentPageInViewer - 1]?.pageNumber}</button>
                    </div>
                     <div>
                        <label htmlFor="range-input-modal" className="text-sm font-semibold mr-2">Seleziona Intervallo:</label>
                        <div className="flex gap-2">
                           <input id="range-input-modal" type="text" value={rangeInput} onChange={(e) => setRangeInput(e.target.value)} placeholder="es. 1-5, 8, 12-15" className="flex-1 bg-gray-700 border border-gray-600 rounded-lg p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500" />
                           <button onClick={handleApplyRange} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg text-sm">Applica</button>
                        </div>
                    </div>
                </div>

                <div className="flex-grow overflow-y-auto p-4">
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-4">
                        {dispensa.pages.map(page => {
                            const isSelected = selectedPages.has(page.pageNumber);
                            return (
                                <div key={page.pageNumber} onClick={() => togglePageSelection(page.pageNumber)} className="relative cursor-pointer group aspect-[2/3]">
                                    <img src={page.dataUrl} alt={`Pagina ${page.pageNumber}`} className={`w-full h-full object-contain rounded-md transition-all ${isSelected ? 'ring-4 ring-indigo-500' : 'group-hover:opacity-80'}`} />
                                    {isSelected && <div className="absolute top-1 right-1 bg-indigo-600 rounded-full p-1 shadow-lg"><CheckCircleIcon className="h-5 w-5 text-white" /></div>}
                                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs text-center py-0.5 rounded-b-md">{page.pageNumber}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                
                <footer className="flex-shrink-0 p-4 border-t border-gray-700 bg-gray-900/50 flex justify-end gap-4 rounded-b-2xl">
                    <button onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">Annulla</button>
                    <button onClick={handleSave} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg">Salva e Chiudi</button>
                </footer>
            </div>
        </div>
    );
};

export const DispenseView: React.FC<DispenseViewProps> = ({ subjectName, dataVersion, onSave, onDelete, onUpdateStudiedPages, isProcessing, onAskTutorQuestion, t }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
    const [thumbnails, setThumbnails] = useState<Thumbnail[]>([]);
    const [textData, setTextData] = useState<{ pageNumber: number, content: string }[]>([]);
    const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [rangeInput, setRangeInput] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [dispensaName, setDispensaName] = useState('');
    const [dispensaTopic, setDispensaTopic] = useState('');
    const [creationZoomLevel, setCreationZoomLevel] = useState(1);
    const [ocrProgress, setOcrProgress] = useState<{ page: number; total: number; progress: number; status: string } | null>(null);


    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set());
    const [sortOrder, setSortOrder] = useState('caricamento-desc');
    const [viewingDispensa, setViewingDispensa] = useState<(SavedDispensa & { pages: Thumbnail[] }) | null>(null);
    const [viewerZoomLevel, setViewerZoomLevel] = useState(1.5);
    const [currentViewerPage, setCurrentViewerPage] = useState(0);
    const [dispensaToDelete, setDispensaToDelete] = useState<SavedDispensa | null>(null);
    const [isStudyProgressModalOpen, setIsStudyProgressModalOpen] = useState(false);
    
    // Contextual chat state
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatInput, setChatInput] = useState('');
    const [viewerChatHistory, setViewerChatHistory] = useState<ChatMessage[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    // Local state for dispense and thumbnails
    const [dispense, setDispense] = useState<DbDispensa[]>([]);
    const [allThumbnails, setAllThumbnails] = useState<Record<string, DbThumbnail[]>>({});

    const [viewerPdfDoc, setViewerPdfDoc] = useState<PDFDocumentProxy | null>(null);
    const [isViewerLoading, setIsViewerLoading] = useState(false);
    
    useEffect(() => {
        if (!viewingDispensa) {
            viewerPdfDoc?.destroy();
            setViewerPdfDoc(null);
            return;
        }

        let isMounted = true;
        const loadPdf = async () => {
            setIsViewerLoading(true);
            try {
                const pdfFile = await db.pdfFiles.get(viewingDispensa.id);
                if (!pdfFile) throw new Error("File PDF non trovato nel database.");

                const pdfjsLib = (window as any).pdfjsLib;
                if (!pdfjsLib) throw new Error("Libreria PDF.js non caricata.");
                pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

                const arrayBuffer = await pdfFile.file.arrayBuffer();
                const typedArray = new Uint8Array(arrayBuffer);
                const loadingTask = pdfjsLib.getDocument(typedArray);
                const pdf = await loadingTask.promise;
                if (isMounted) {
                    setViewerPdfDoc(pdf);
                } else {
                    pdf.destroy();
                }
            } catch (e) {
                console.error("Failed to load PDF for viewer", e);
                if (isMounted) {
                    setViewerPdfDoc(null);
                }
            } finally {
                if (isMounted) {
                    setIsViewerLoading(false);
                }
            }
        };

        loadPdf();

        return () => {
            isMounted = false;
            viewerPdfDoc?.destroy();
        }
    }, [viewingDispensa]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [viewerChatHistory]);

    // Fetch data for the component
    useEffect(() => {
        const loadViewData = async () => {
            if (!subjectName) {
                setDispense([]);
                setAllThumbnails({});
                return;
            }
            const dispenseFromDb = await db.dispense.where('subjectName').equals(subjectName).toArray();
            
            setDispense(dispenseFromDb);

            if (dispenseFromDb.length > 0) {
                const dispensaIds = dispenseFromDb.map(d => d.id);
                const thumbnailsFromDb = await db.thumbnails.where('dispensaId').anyOf(dispensaIds).toArray();
                setAllThumbnails(groupByKey(thumbnailsFromDb, 'dispensaId'));
            } else {
                setAllThumbnails({});
            }
        };

        loadViewData();
    }, [subjectName, dataVersion]);

    const handleSendViewerChatMessage = async () => {
        if (!chatInput.trim() || isProcessing || !viewingDispensa) return;

        const message = chatInput.trim();
        const userMessage: ChatMessage = { id: Date.now().toString(), role: 'user', text: message };
        setViewerChatHistory(prev => [...prev, userMessage]);
        setChatInput('');

        const currentPageData = viewingDispensa.pages[currentViewerPage - 1];
        if (!currentPageData) {
            const errorMessage: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text: 'Errore: non riesco a determinare la pagina corrente.' };
            setViewerChatHistory(prev => [...prev, errorMessage]);
            return;
        }
        const currentPageNumber = currentPageData.pageNumber;

        const pageVectors = viewingDispensa.contentVectors?.filter(v => v.pageNumber === currentPageNumber) || [];
        
        const content = pageVectors.map(v => v.content).join('\n\n');
        
        let contextForAI = '';
        if (!content.trim()) {
            contextForAI = `Nessun contenuto testuale trovato per la pagina ${currentPageNumber}. Rispondi in modo generico, ma informa l'utente che non hai contesto specifico dalla pagina.`;
        } else {
            contextForAI = `Contesto (Pagina ${currentPageNumber}):\n${content}`;
        }
        
        const responseText = await onAskTutorQuestion(message, `Materia: "${subjectName}". ${contextForAI}`);
        const modelMessage: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text: responseText };
        setViewerChatHistory(prev => [...prev, modelMessage]);
    };


    const topics = [...new Set(dispense.map(d => d.topic).filter(topic => topic))];

    const handleTopicToggle = (topic: string) => {
        setSelectedTopics(prev => {
            const newTopics = new Set(prev);
            if (newTopics.has(topic)) {
                newTopics.delete(topic);
            } else {
                newTopics.add(topic);
            }
            return newTopics;
        });
    };

    const filteredDispense = useMemo(() => dispense.filter(d => {
        const matchesTopic = selectedTopics.size === 0 ? true : (d.topic ? selectedTopics.has(d.topic) : false);
        const lowerCaseSearch = searchTerm.toLowerCase();
        const matchesSearch = searchTerm 
            ? d.name.toLowerCase().includes(lowerCaseSearch) || 
              (d.topic && d.topic.toLowerCase().includes(lowerCaseSearch))
            : true;
        return matchesTopic && matchesSearch;
    }), [dispense, searchTerm, selectedTopics]);

    const calculateCompletion = useCallback((d: SavedDispensa): number => {
        const dispensaPages = allThumbnails[d.id] || [];
        if (dispensaPages.length === 0) return 0;
        const studiedPagesCount = parsePageRanges(d.studiedPages || '', d.totalPages).size;
        return (studiedPagesCount / dispensaPages.length) * 100;
    }, [allThumbnails]);

    const sortedAndFilteredDispense = useMemo(() => {
        const sorted = [...filteredDispense]; 

        switch (sortOrder) {
            case 'caricamento-asc':
                break;
            case 'caricamento-desc':
                sorted.reverse();
                break;
            case 'alfabetico-asc':
                sorted.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'alfabetico-desc':
                sorted.sort((a, b) => b.name.localeCompare(a.name));
                break;
            case 'completamento-desc':
                sorted.sort((a, b) => calculateCompletion(b) - calculateCompletion(a));
                break;
            case 'completamento-asc':
                sorted.sort((a, b) => calculateCompletion(a) - calculateCompletion(b));
                break;
            case 'comprensione-desc':
                sorted.sort((a, b) => (b.comprehensionScore ?? -1) - (a.comprehensionScore ?? -1));
                break;
            case 'comprensione-asc':
                sorted.sort((a, b) => (a.comprehensionScore ?? -1) - (b.comprehensionScore ?? -1));
                break;
            default:
                sorted.reverse();
                break;
        }

        return sorted;
    }, [filteredDispense, sortOrder, calculateCompletion]);


    useEffect(() => {
        if (!file) return;

        const loadPdfAndGenerateThumbnails = async () => {
            setIsLoading(true);
            setError(null);
            setThumbnails([]);
            setTextData([]);
            setSelectedPages(new Set());
            setRangeInput('');
            setOcrProgress(null);
            
            try {
                const pdfjsLib = (window as any).pdfjsLib;
                const Tesseract = (window as any).Tesseract;
                if (!pdfjsLib) throw new Error("PDF.js library is not loaded.");
                if (!Tesseract) throw new Error("Tesseract.js library is not loaded. OCR will not function.");
                
                pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
                
                const arrayBuffer = await file.arrayBuffer();
                const typedArray = new Uint8Array(arrayBuffer);
                const loadingTask = pdfjsLib.getDocument(typedArray);
                const pdf = await loadingTask.promise;
                setPdfDoc(pdf);

                const generatedThumbnails: Thumbnail[] = [];
                const allTextData: { pageNumber: number, content: string }[] = [];

                const worker = await Tesseract.createWorker('ita', 1, {
                    logger: (m: { status: string, progress: number }) => {
                        if (m.status === 'recognizing text' && ocrProgress) {
                            setOcrProgress(prev => (prev ? {...prev, progress: Math.floor(m.progress * 100), status: 'Riconoscimento testo...'} : null));
                        }
                    }
                });
                
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const viewport = page.getViewport({ scale: 1.0 });
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;
                    if(context){
                       await page.render({ canvasContext: context, viewport: viewport }).promise;
                       generatedThumbnails.push({ pageNumber: i, dataUrl: canvas.toDataURL() });
                    }
                    
                    const textContent = await page.getTextContent();
                    let pageText = textContent.items.map((item: any) => item.str).join(' ');

                    // Heuristic: If text is very short, assume it's a scanned page and run OCR
                    if (pageText.trim().length < 100) { 
                        setOcrProgress({ page: i, total: pdf.numPages, progress: 0, status: 'Pagina scansionata, avvio OCR...' });
                        
                        const ocrViewport = page.getViewport({ scale: 2.0 }); // Higher scale for better OCR accuracy
                        const ocrCanvas = document.createElement('canvas');
                        const ocrContext = ocrCanvas.getContext('2d');
                        ocrCanvas.height = ocrViewport.height;
                        ocrCanvas.width = ocrViewport.width;

                        if (ocrContext) {
                            await page.render({ canvasContext: ocrContext, viewport: ocrViewport }).promise;
                            const { data: { text } } = await worker.recognize(ocrCanvas);
                            pageText = text;
                        }
                    }
                    
                    allTextData.push({ pageNumber: i, content: pageText });
                }
                
                await worker.terminate();
                setThumbnails(generatedThumbnails);
                setTextData(allTextData);
                handleSelectAll(pdf.numPages);
            } catch (err) {
                if (err instanceof Error) {
                    setError(`Errore nel caricamento del PDF: ${err.message}`);
                } else {
                    // FIX: The caught error `err` is of type 'unknown'. Explicitly convert it to a string before using it in a template literal.
                    setError(`Errore sconosciuto nel caricamento del PDF: ${String(err)}`);
                }
            } finally {
                setIsLoading(false);
                setOcrProgress(null);
            }
        };

        loadPdfAndGenerateThumbnails();
    }, [file]);
    
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setFile(null);
        setPdfDoc(null);
        setThumbnails([]);
        setTextData([]);
        setSelectedPages(new Set());
        setError(null);
        setIsLoading(false);
        setRangeInput('');
        setDispensaName('');
        setDispensaTopic('');
        setCreationZoomLevel(1);
    };
    
    const handleSaveDispensa = () => {
        if (!file || !dispensaName || !pdfDoc) return;
    
        if (selectedPages.size === 0) {
            setError("È necessario selezionare almeno una pagina da salvare.");
            return;
        }
    
        const finalThumbnails = thumbnails.filter(t => selectedPages.has(t.pageNumber));
        const finalTextData = textData.filter(t => selectedPages.has(t.pageNumber));
    
        onSave({
            name: dispensaName,
            topic: dispensaTopic,
            file: file,
            totalPages: pdfDoc.numPages,
            thumbnails: finalThumbnails,
            textData: finalTextData,
        });
    
        handleCloseModal();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile && selectedFile.type === "application/pdf") {
            setFile(selectedFile);
        } else if (selectedFile) {
            setError("Per favore, seleziona un file PDF valido.");
            setFile(null);
        }
    };

    const togglePageSelection = (pageNumber: number) => {
        const newSelection = new Set(selectedPages);
        if (newSelection.has(pageNumber)) newSelection.delete(pageNumber);
        else newSelection.add(pageNumber);
        setSelectedPages(newSelection);
    };

    const handleSelectAll = (numPages: number) => {
        const allPages = new Set(Array.from({ length: numPages }, (_, i) => i + 1));
        setSelectedPages(allPages);
    };

    const handleDeselectAll = () => {
        setSelectedPages(new Set());
    };

    const handleApplyRange = () => {
        if (pdfDoc) {
            const newSelection = parsePageRanges(rangeInput, pdfDoc.numPages);
            setSelectedPages(newSelection);
        }
    };
    
    const openViewer = (dispensaToView: SavedDispensa) => {
        const pagesForViewer = allThumbnails[dispensaToView.id] || [];
        // find the actual dispensa object from state to get the most up-to-date studiedPages
        const currentDispensaState = dispense.find(d => d.id === dispensaToView.id) || dispensaToView;
        
        const studiedPageNumbers = Array.from(parsePageRanges(currentDispensaState.studiedPages || '', currentDispensaState.totalPages));
        let pageIndex = 0;

        if (studiedPageNumbers.length > 0) {
            const lastStudiedPage = Math.max(...studiedPageNumbers);
            const foundIndex = pagesForViewer.findIndex(p => p.pageNumber === lastStudiedPage);
            if (foundIndex !== -1) {
                pageIndex = Math.min(foundIndex + 1, pagesForViewer.length - 1);
            }
        }

        setViewerZoomLevel(1.5);
        setCurrentViewerPage(pageIndex >= 0 ? pageIndex + 1 : 1);
        setViewingDispensa({ ...currentDispensaState, pages: pagesForViewer });
        setIsChatOpen(false);
        setViewerChatHistory([]);
    };

    const handleSaveStudyProgress = async (newStudiedPagesString: string) => {
        if (viewingDispensa) {
            await onUpdateStudiedPages(viewingDispensa.id, newStudiedPagesString);
            setViewingDispensa(prev => prev ? { ...prev, studiedPages: newStudiedPagesString } : null);
            setIsStudyProgressModalOpen(false);
        }
    };


    return (
        <div className="w-full">
            <header className="w-full max-w-5xl mx-auto mb-6">
                <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">{t('sidebar.dispense')}</h1>
                <p className="text-gray-400 mt-2 text-md">{t('dispense.description')}</p>
            </header>
            
            <div className="w-full max-w-5xl mx-auto text-center mb-8">
                 <button 
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200"
                >
                    <PlusIcon />
                    {t('dispense.uploadButton')}
                </button>
            </div>
            
            <div className="w-full max-w-5xl mx-auto">
                <h2 className="text-2xl font-bold text-white mb-4">{t('dispense.savedTitle')}</h2>
                
                {dispense.length > 0 && (
                    <div className="mb-6 bg-gray-800/50 p-4 rounded-xl space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="relative">
                                <label htmlFor="search-dispense" className="sr-only">{t('dispense.searchPlaceholder')}</label>
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                    <SearchIcon />
                                </span>
                                <input
                                    id="search-dispense"
                                    type="text"
                                    placeholder={t('dispense.searchPlaceholder')}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 pl-10 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                             <div className="relative">
                                <label htmlFor="sort-dispense" className="sr-only">{t('dispense.sortLabel')}</label>
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                    <SortIcon />
                                </span>
                                <select
                                    id="sort-dispense"
                                    value={sortOrder}
                                    onChange={(e) => setSortOrder(e.target.value)}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 pl-10 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
                                >
                                    <option value="caricamento-desc">{t('dispense.sort.recent')}</option>
                                    <option value="caricamento-asc">{t('dispense.sort.oldest')}</option>
                                    <option value="alfabetico-asc">{t('dispense.sort.name_asc')}</option>
                                    <option value="alfabetico-desc">{t('dispense.sort.name_desc')}</option>
                                    <option value="completamento-desc">{t('dispense.sort.completion_desc')}</option>
                                    <option value="completamento-asc">{t('dispense.sort.completion_asc')}</option>
                                    <option value="comprensione-desc">{t('dispense.sort.comprehension_desc')}</option>
                                    <option value="comprensione-asc">{t('dispense.sort.comprehension_asc')}</option>
                                </select>
                            </div>
                        </div>
                        
                        {topics.length > 0 && (
                            <div className="border-t border-gray-700 pt-4">
                                <h3 className="text-sm font-semibold text-gray-400 mb-2">{t('dispense.filterByTopic')}:</h3>
                                <div className="flex flex-wrap gap-2">
                                    {topics.map(topic => (
                                        <button
                                            key={topic}
                                            onClick={() => handleTopicToggle(topic)}
                                            className={`px-3 py-1 text-sm font-medium rounded-full transition-colors ${
                                                selectedTopics.has(topic)
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-gray-600 hover:bg-gray-500 text-gray-200'
                                            }`}
                                        >
                                            {topic}
                                        </button>
                                    ))}
                                    {selectedTopics.size > 0 && (
                                        <button onClick={() => setSelectedTopics(new Set())} className="text-sm text-indigo-400 hover:underline px-3 py-1">
                                            {t('dispense.removeFilters')}
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
                
                {sortedAndFilteredDispense.length === 0 ? (
                    <div className="bg-gray-800 rounded-2xl p-6 text-center">
                        <p className="text-gray-400">
                             {dispense.length === 0
                                ? t('dispense.noDispense')
                                : t('dispense.noMatch')
                            }
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sortedAndFilteredDispense.map(d => {
                            const dispensaPages = allThumbnails[d.id] || [];
                            const studiedPagesCount = parsePageRanges(d.studiedPages || '', d.totalPages).size;
                            const progressPercentage = dispensaPages.length > 0 ? Math.round((studiedPagesCount / dispensaPages.length) * 100) : 0;
                            const firstThumbnailUrl = dispensaPages[0]?.dataUrl;

                            return (
                                <div 
                                    key={d.id} 
                                    onClick={() => openViewer(d)}
                                    className="group relative bg-gray-800 rounded-lg shadow-lg overflow-hidden flex flex-col transition-transform duration-200 hover:scale-105 cursor-pointer"
                                >
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setDispensaToDelete(d); }}
                                        className="absolute top-2 right-2 z-10 p-1.5 bg-red-600/80 hover:bg-red-500 rounded-full text-white transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                                        aria-label={`Elimina dispensa ${d.name}`}
                                        title={`Elimina dispensa`}
                                    >
                                        <TrashIcon />
                                    </button>
                                    <img src={firstThumbnailUrl} alt={`Anteprima di ${d.name}`} className="w-full h-40 object-cover object-top bg-gray-700" />
                                    <div className="p-4 flex flex-col flex-grow">
                                        <h3 className="font-bold text-lg text-white truncate" title={d.name}>{d.name}</h3>
                                        {d.topic && <p className="text-sm text-gray-400 mb-2 truncate" title={d.topic}>{d.topic}</p>}
                                        
                                        <div className="mt-2 space-y-3">
                                            <div>
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-xs font-medium text-indigo-300">Progresso Studio</span>
                                                    <span className="text-xs font-medium text-gray-400">{studiedPagesCount} / {dispensaPages.length}</span>
                                                </div>
                                                <div className="w-full bg-gray-700 rounded-full h-1.5">
                                                    <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
                                                </div>
                                            </div>
                                             <div>
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-xs font-medium text-yellow-300">Comprensione</span>
                                                </div>
                                                <StarRating score={d.comprehensionScore} />
                                            </div>
                                        </div>

                                        <div className="mt-auto pt-3">
                                            <p className="text-xs text-gray-500">{dispensaPages.length} pagin{dispensaPages.length === 1 ? 'a' : 'e'} da {d.fileName}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {dispensaToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4" onClick={() => setDispensaToDelete(null)}>
                    <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-white">Conferma Eliminazione</h3>
                            <p className="text-gray-300 my-4">
                                Sei sicuro di voler eliminare la dispensa <span className="font-bold text-white">"{dispensaToDelete.name}"</span>?
                            </p>
                            <div className="text-yellow-400 bg-yellow-900/50 p-3 rounded-lg text-sm">
                                <p><strong>Attenzione:</strong> Questa azione eliminerà anche tutti gli esercizi, le lezioni e le simulazioni associate. L'operazione è irreversibile.</p>
                            </div>
                        </div>
                        <div className="bg-gray-900/50 px-6 py-4 flex justify-end gap-4 rounded-b-2xl">
                            <button 
                                onClick={() => setDispensaToDelete(null)} 
                                className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                            >
                                Annulla
                            </button>
                            <button 
                                onClick={() => {
                                    onDelete(dispensaToDelete.id);
                                    setDispensaToDelete(null);
                                }} 
                                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                            >
                                Elimina
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {viewingDispensa && (
                <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
                    <header className="flex-shrink-0 w-full bg-gray-800 p-3 flex justify-between items-center shadow-md">
                        <button onClick={() => setViewingDispensa(null)} className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                            <BackIcon />
                            <span className="hidden sm:inline">Indietro</span>
                        </button>
                        <div className="flex-1 min-w-0 text-center">
                            <h2 className="text-lg font-bold text-white truncate px-4" title={viewingDispensa.name}>{viewingDispensa.name}</h2>
                            <p className="text-sm text-gray-400">Pagina {viewingDispensa.pages[currentViewerPage-1]?.pageNumber || currentViewerPage} di {viewingDispensa.totalPages}</p>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-4">
                            <button 
                                onClick={() => setIsChatOpen(o => !o)}
                                className={`flex items-center gap-2 font-semibold py-2 px-4 rounded-lg transition-colors ${isChatOpen ? 'bg-indigo-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'}`}
                                title="Apri/Chiudi Tutor AI"
                            >
                                <SparkleIcon />
                                <span className="hidden lg:block">Tutor AI</span>
                            </button>
                            <div className="items-center gap-2 hidden sm:flex">
                                <label htmlFor="viewer-zoom" className="text-sm text-gray-400 flex-shrink-0 hidden lg:block">Zoom</label>
                                <input id="viewer-zoom" type="range" min="0.5" max="3" step="0.1" value={viewerZoomLevel} onChange={(e) => setViewerZoomLevel(parseFloat(e.target.value))} className="w-24 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
                                <span className="text-sm font-semibold text-white w-12 text-center">{(viewerZoomLevel * 100).toFixed(0)}%</span>
                            </div>
                        </div>
                    </header>

                    <main className="flex-grow flex flex-col lg:flex-row overflow-hidden">
                        {isChatOpen && (
                            <div className="w-full lg:w-1/3 lg:min-w-[350px] lg:max-w-[450px] bg-gray-800/50 flex flex-col border-b lg:border-b-0 lg:border-r border-gray-700 h-1/2 lg:h-full">
                                <header className="flex-shrink-0 p-4 bg-gray-900/50 flex items-center gap-3 border-b border-gray-700">
                                    <SparkleIcon />
                                    <h2 className="text-lg font-bold text-white">Tutor AI: {subjectName}</h2>
                                </header>
                                <div className="flex-1 p-4 overflow-y-auto">
                                    {viewerChatHistory.length === 0 && (
                                        <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
                                            <SparkleIcon />
                                            <p className="mt-2">Sono il tuo tutor per {subjectName}.</p>
                                            <p className="text-sm">Fammi una domanda su questa pagina.</p>
                                        </div>
                                    )}
                                    {viewerChatHistory.map(msg => (
                                        <div key={msg.id} className={`flex items-start gap-3 my-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                            {msg.role === 'model' && <div className="bg-indigo-600 rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0 text-lg" role="img">🤖</div>}
                                            <div className={`rounded-lg p-3 max-w-lg ${msg.role === 'user' ? 'bg-indigo-700' : 'bg-gray-700'}`}>
                                                <p className="text-sm text-gray-200 whitespace-pre-wrap">{msg.text}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {isProcessing && (
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
                                        <input type="text" placeholder="Chiedi qualcosa su questa pagina..." value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSendViewerChatMessage()} className="flex-1 bg-transparent p-3 text-white placeholder-gray-400 focus:outline-none" disabled={isProcessing} />
                                        <button onClick={handleSendViewerChatMessage} className="p-3 text-white transition-colors disabled:text-gray-500" disabled={isProcessing || !chatInput.trim()}><SendIcon /></button>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        <div className="flex-grow relative flex items-center justify-center overflow-auto p-4 h-1/2 lg:h-full">
                            <button
                                onClick={() => setCurrentViewerPage(p => Math.max(1, p - 1))}
                                disabled={currentViewerPage === 1}
                                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 p-2 bg-gray-700/60 hover:bg-gray-600 rounded-full text-white transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
                                aria-label="Pagina precedente"
                            >
                                <ChevronLeftIcon />
                            </button>
                            
                            <div className="w-full h-full flex items-center justify-center overflow-auto p-2">
                                {isViewerLoading ? (
                                    <div className="flex flex-col items-center justify-center">
                                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                                        <p className="mt-4 text-gray-400">Caricamento documento...</p>
                                    </div>
                                ) : viewerPdfDoc && viewingDispensa.pages[currentViewerPage - 1] ? (
                                    <DispensaPageViewer
                                        pdfDoc={viewerPdfDoc}
                                        pageNumber={viewingDispensa.pages[currentViewerPage - 1].pageNumber}
                                        scale={viewerZoomLevel}
                                    />
                                ) : (
                                    <div className="text-center text-red-400">
                                        <p className="font-bold text-lg">Errore</p>
                                        <p>Impossibile caricare il documento PDF per la visualizzazione.</p>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => setCurrentViewerPage(p => Math.min(viewingDispensa.pages.length, p + 1))}
                                disabled={currentViewerPage >= viewingDispensa.pages.length}
                                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 p-2 bg-gray-700/60 hover:bg-gray-600 rounded-full text-white transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
                                aria-label="Pagina successiva"
                            >
                                <ChevronRightIcon />
                            </button>
                            
                            <div className="absolute bottom-4 right-4 z-30">
                                <StudyTimer />
                            </div>
                        </div>
                    </main>

                    <footer className="flex-shrink-0 w-full bg-gray-800 p-3 shadow-inner">
                        <div className="max-w-xl mx-auto flex items-center gap-3">
                            <label className="flex-shrink-0 text-sm font-medium text-gray-300">
                                Pagine Studiate:
                            </label>
                            <div className="flex-1 bg-gray-700 border border-gray-600 rounded-lg p-2 text-gray-200 truncate" title={viewingDispensa.studiedPages || 'Nessuna pagina studiata'}>
                                {viewingDispensa.studiedPages || 'Nessuna pagina studiata'}
                            </div>
                            <button 
                                onClick={() => setIsStudyProgressModalOpen(true)}
                                disabled={isProcessing}
                                className="font-bold py-2 px-4 rounded-lg transition-colors w-48 text-center bg-gray-600 hover:bg-gray-500 flex items-center justify-center disabled:bg-gray-600 disabled:cursor-not-allowed"
                            >
                                <PencilIcon/>
                                Modifica
                            </button>
                        </div>
                    </footer>
                </div>
            )}
            
            {viewingDispensa && (
                <StudyProgressModal
                    isOpen={isStudyProgressModalOpen}
                    onClose={() => setIsStudyProgressModalOpen(false)}
                    dispensa={viewingDispensa}
                    onSave={handleSaveStudyProgress}
                    currentPageInViewer={currentViewerPage}
                />
            )}

            {isModalOpen && (
                 <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4" onClick={handleCloseModal}>
                    <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-4 border-b border-gray-700 flex-shrink-0">
                            <h2 className="text-xl font-bold text-white">Carica e Seleziona Pagine</h2>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-white"><CloseIcon /></button>
                        </div>
                        
                        <div className="flex-grow p-4 overflow-hidden">
                            {error && (
                                <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg m-4" role="alert">
                                    <strong className="font-bold">Errore: </strong><span>{error}</span>
                                </div>
                            )}

                             {!file ? (
                                <div className="h-full flex items-center justify-center">
                                    <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center w-full max-w-md h-64 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 border-gray-600 bg-gray-900/50 hover:border-gray-500 hover:bg-gray-800/80">
                                        <UploadIcon />
                                        <p className="text-lg text-gray-300"><span className="font-semibold">Clicca per selezionare un file</span></p>
                                        <p className="text-sm text-gray-500">Solo file PDF</p>
                                    </button>
                                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="application/pdf" className="hidden" />
                                </div>
                            ) : isLoading ? (
                                <div className="h-full flex flex-col items-center justify-center">
                                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
                                    <p className="mt-4 text-gray-400">Generazione anteprime ed estrazione testo...</p>
                                    {ocrProgress && (
                                        <div className="mt-4 w-full max-w-md text-left">
                                            <p className="text-sm font-semibold text-white">OCR in corso (Pagina {ocrProgress.page}/{ocrProgress.total})</p>
                                            <p className="text-xs text-gray-400 mb-1">{ocrProgress.status}</p>
                                            <div className="w-full bg-gray-700 rounded-full h-2.5">
                                                <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${ocrProgress.progress}%` }}></div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex h-full gap-4">
                                    <div className="w-2/3 lg:w-3/4 bg-gray-900/50 rounded-lg p-2 flex flex-col">
                                        <div className="flex-shrink-0 flex items-center gap-4 mb-2 p-2 bg-gray-900 rounded-lg">
                                            <label htmlFor="zoom" className="font-medium text-sm text-gray-300">Zoom:</label>
                                            <input id="zoom" type="range" min="0.5" max="2.5" step="0.1" value={creationZoomLevel} onChange={(e) => setCreationZoomLevel(parseFloat(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
                                            <span className="text-sm font-semibold text-white w-16 text-center">{(creationZoomLevel * 100).toFixed(0)}%</span>
                                        </div>
                                        <div className="flex-grow overflow-y-auto p-2">
                                            <div className="flex flex-col items-center gap-4">
                                                {thumbnails.map(thumb => {
                                                    const isSelected = selectedPages.has(thumb.pageNumber);
                                                    return (
                                                        <div key={thumb.pageNumber} onClick={() => togglePageSelection(thumb.pageNumber)} className="relative cursor-pointer group" style={{ width: `${300 * creationZoomLevel}px`}}>
                                                            <div className={`absolute inset-0 rounded-lg transition-all duration-200 border-4 ${isSelected ? 'border-indigo-500' : 'border-transparent group-hover:border-gray-500'}`}></div>
                                                            {isSelected && <div className="absolute top-2 right-2 bg-indigo-600 rounded-full p-1 z-10 shadow-lg"><CheckCircleIcon /></div>}
                                                            <img src={thumb.dataUrl} alt={`Pagina ${thumb.pageNumber}`} className="rounded-md w-full h-auto shadow-lg" />
                                                            <p className="text-center mt-2 text-sm font-medium text-gray-300">Pagina {thumb.pageNumber}</p>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="w-1/3 lg:w-1/4 p-4 bg-gray-900/50 rounded-lg flex flex-col overflow-y-auto">
                                        <h3 className="text-lg font-bold text-white mb-4">Dettagli e Selezione</h3>
                                        <div className="space-y-4 mb-4">
                                            <div>
                                                <label htmlFor="dispensa-name" className="font-semibold mb-2 block text-sm">Nome Dispensa <span className="text-red-500">*</span></label>
                                                <input id="dispensa-name" type="text" value={dispensaName} onChange={(e) => setDispensaName(e.target.value)} placeholder="es. Integrali Definiti" className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 focus:ring-indigo-500 focus:border-indigo-500" />
                                            </div>
                                            <div>
                                                <label htmlFor="dispensa-topic" className="font-semibold mb-2 block text-sm">Argomento</label>
                                                <input id="dispensa-topic" type="text" value={dispensaTopic} onChange={(e) => setDispensaTopic(e.target.value)} placeholder="es. Capitolo 5" className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 focus:ring-indigo-500 focus:border-indigo-500" />
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <h4 className="font-semibold mb-2">Selezione Rapida</h4>
                                                <div className="flex space-x-2">
                                                    <button onClick={() => handleSelectAll(thumbnails.length)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-3 rounded-lg text-sm transition-colors">Seleziona Tutto</button>
                                                    <button onClick={handleDeselectAll} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-3 rounded-lg text-sm transition-colors">Deseleziona Tutto</button>
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="font-semibold mb-2">Selezione per Intervallo</h4>
                                                <input type="text" value={rangeInput} onChange={(e) => setRangeInput(e.target.value)} placeholder="es. 1-5, 8, 12-15" className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 mb-2 focus:ring-indigo-500 focus:border-indigo-500" />
                                                <button onClick={handleApplyRange} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg">Applica</button>
                                            </div>
                                        </div>
                                        <div className="mt-auto pt-4 border-t border-gray-700">
                                            <p className="text-lg font-bold text-white">Riepilogo</p>
                                             <p className="text-gray-300">
                                                {selectedPages.size > 0 
                                                    ? `Verranno salvate ${selectedPages.size} pagin${selectedPages.size === 1 ? 'a' : 'e'} su ${thumbnails.length} totali.`
                                                    : "Seleziona le pagine che vuoi includere nella dispensa."}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end items-center p-4 border-t border-gray-700 flex-shrink-0 bg-gray-900/50 rounded-b-2xl">
                             <button onClick={handleCloseModal} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-colors">Annulla</button>
                             <button 
                                onClick={handleSaveDispensa} 
                                disabled={!file || !dispensaName || selectedPages.size === 0} 
                                className="ml-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg transition-colors duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed">
                                    Salva {selectedPages.size > 0 ? `${selectedPages.size} Pagin${selectedPages.size === 1 ? 'a' : 'e'}` : 'Dispensa'}
                            </button>
                        </div>
                    </div>
                 </div>
            )}
        </div>
    );
};