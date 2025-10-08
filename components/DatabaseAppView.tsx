import React, { useState, useMemo, useEffect } from 'react';
import type { SubjectDetails, SavedDispensa, MacroTopic, EsercizioTopic } from '../types';
import { db } from '../db';

// Icons
const DataIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>;
const BookIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V4z" /></svg>;
const PageIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>;
const ChevronDownIcon = ({ isExpanded }: { isExpanded: boolean }) => <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 flex-shrink-0 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>;
const DocumentTextIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;


// Helper function to format page numbers into ranges
function compressPageNumbers(pages: number[]): string {
    if (pages.length === 0) return 'N/A';
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

// Modal for displaying pointer details
const PointerDetailModal: React.FC<{
    pointer: EsercizioTopic;
    content: string;
    onClose: () => void;
}> = ({ pointer, content, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col h-[80vh]" onClick={e => e.stopPropagation()}>
                <header className="flex-shrink-0 p-4 flex justify-between items-center border-b border-gray-700">
                    <div className="flex items-center gap-3 min-w-0">
                        <DocumentTextIcon />
                        <h2 className="text-xl font-bold text-white truncate">{pointer.title}</h2>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-full flex-shrink-0"><CloseIcon /></button>
                </header>
                <div className="flex-shrink-0 p-4 bg-gray-900/50 border-b border-gray-700">
                    <div className="text-sm text-gray-300 space-y-1">
                       <p className="flex items-center gap-2"><BookIcon/> <strong>Fonte:</strong> {pointer.sourceDescription}</p>
                    </div>
                </div>
                <div className="flex-1 p-6 overflow-y-auto">
                    <p className="text-gray-200 whitespace-pre-wrap">{content}</p>
                </div>
                <footer className="bg-gray-900/50 px-6 py-3 flex justify-end rounded-b-2xl border-t border-gray-700">
                    <button onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">Chiudi</button>
                </footer>
            </div>
        </div>
    );
};


interface DatabaseAppViewProps {
    selectedSubject: string;
    dataVersion: number;
    t: (key: string) => string;
}

export const DatabaseAppView: React.FC<DatabaseAppViewProps> = ({ selectedSubject, dataVersion, t }) => {
    const [allDispense, setAllDispense] = useState<SavedDispensa[]>([]);
    const [allMacroTopics, setAllMacroTopics] = useState<MacroTopic[]>([]);
    const [allEsercizioTopics, setAllEsercizioTopics] = useState<EsercizioTopic[]>([]);

    const [expandedMacros, setExpandedMacros] = useState<Set<string>>(new Set());
    const [selectedPointer, setSelectedPointer] = useState<EsercizioTopic | null>(null);

    useEffect(() => {
        const loadViewData = async () => {
            if (!selectedSubject) {
                setAllDispense([]);
                setAllMacroTopics([]);
                setAllEsercizioTopics([]);
                return;
            }

            const [dispense, macrosState, topicsState] = await Promise.all([
                db.dispense.where({ subjectName: selectedSubject }).toArray(),
                db.appState.get('allMacroTopics'),
                db.appState.get('allEsercizioTopics')
            ]);
            
            setAllDispense(dispense);
            setAllMacroTopics(macrosState?.value?.[selectedSubject] || []);
            setAllEsercizioTopics(topicsState?.value?.[selectedSubject] || []);
        };
        loadViewData();
        setExpandedMacros(new Set());
        setSelectedPointer(null);
    }, [selectedSubject, dataVersion]);

    const macroData = useMemo(() => {
        const macroMap = new Map<string, MacroTopic>(allMacroTopics.map(m => [m.id, m]));
        const groupedPointers = new Map<string, { title: string; pointers: EsercizioTopic[] }>();

        allEsercizioTopics.forEach(p => {
            const macroId = p.macroTopicId || 'uncategorized';
            if (!groupedPointers.has(macroId)) {
                groupedPointers.set(macroId, {
                    title: macroMap.get(macroId)?.title || 'Senza Categoria',
                    pointers: []
                });
            }
            groupedPointers.get(macroId)!.pointers.push(p);
        });
        
        // Sort pointers within each group
        for (const group of groupedPointers.values()) {
            group.pointers.sort((a, b) => {
                const masteryA = a.masteryScore ?? 101; // Unscored items go last
                const masteryB = b.masteryScore ?? 101;

                if (masteryA !== masteryB) {
                    return masteryA - masteryB; // Sort by mastery ascending (lowest first)
                }

                const dateA = a.lastPracticed ? new Date(a.lastPracticed).getTime() : Infinity; // Not practiced goes last
                const dateB = b.lastPracticed ? new Date(b.lastPracticed).getTime() : Infinity;
                
                return dateA - dateB; // Sort by last practiced ascending (oldest first)
            });
        }
        
        return Array.from(groupedPointers.entries()).map(([id, data]) => ({
            id,
            title: data.title,
            pointers: data.pointers
        })).filter(g => g.pointers.length > 0);

    }, [allMacroTopics, allEsercizioTopics]);

    const pointerContent = useMemo(() => {
        if (!selectedPointer) return '';
        return selectedPointer.sourceContent || 'Contenuto non disponibile.';
    }, [selectedPointer]);

     const toggleMacro = (macroId: string) => {
        setExpandedMacros(prev => {
            const newSet = new Set(prev);
            if (newSet.has(macroId)) {
                newSet.delete(macroId);
            } else {
                newSet.add(macroId);
            }
            return newSet;
        });
    };

    return (
        <div className="w-full max-w-5xl mx-auto flex flex-col h-[calc(100vh-100px)]">
            <header className="w-full mb-6 text-center flex-shrink-0">
                <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">{t('sidebar.databaseApp')}</h1>
                <p className="text-gray-400 mt-2 text-md">Esplora i micro-argomenti estratti dall'AI per {selectedSubject ? `"${selectedSubject}"` : 'la materia selezionata'}.</p>
            </header>
            
            <div className="flex-grow bg-gray-800 rounded-2xl p-4 overflow-y-auto">
                 {!selectedSubject ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                        <DataIcon />
                        <h3 className="text-lg font-semibold text-gray-300 mt-4">Nessuna Materia Selezionata</h3>
                        <p className="max-w-md mt-1">
                           Seleziona una materia dalla barra laterale per visualizzare i suoi pointers.
                        </p>
                    </div>
                ) : macroData.length > 0 ? (
                    <div className="space-y-3">
                        {macroData.map(macro => {
                             const isExpanded = expandedMacros.has(macro.id);
                             return (
                                <div key={macro.id} className="bg-gray-900/50 rounded-lg">
                                    <button onClick={() => toggleMacro(macro.id)} className="w-full flex justify-between items-center p-4 text-left">
                                        <h3 className="font-bold text-lg text-indigo-300">{macro.title}</h3>
                                        <ChevronDownIcon isExpanded={isExpanded} />
                                    </button>
                                    {isExpanded && (
                                        <div className="px-4 pb-4 border-t border-gray-700 mt-2 pt-3">
                                            <div className="space-y-3">
                                                {macro.pointers.map(p => {
                                                    const mastery = p.masteryScore;
                                                    const exerciseStats = p.exerciseStats || { appearances: 0, completed: 0 };
                                                    const simulationStats = p.simulationStats || { appearances: 0, correct: 0 };
                                                    
                                                    return (
                                                        <button
                                                            key={p.id}
                                                            onClick={() => setSelectedPointer(p)}
                                                            className="w-full text-left bg-gray-700/50 p-4 rounded-lg shadow-sm hover:bg-gray-700 transition-colors duration-200"
                                                        >
                                                            <div className="flex justify-between items-start gap-2">
                                                                <h4 className="font-semibold text-white flex-1">{p.title}</h4>
                                                            </div>

                                                            <div className="text-sm text-gray-300 mt-2 space-y-1">
                                                                <p className="flex items-center gap-2"><BookIcon/> <strong>Fonte:</strong> {p.sourceDescription}</p>
                                                            </div>
                                                            <div className="mt-3 pt-3 border-t border-gray-600/50">
                                                                <div className="flex justify-between items-center mb-1">
                                                                    <span className="text-xs font-medium text-indigo-300">Livello di Padronanza</span>
                                                                    <span className="text-xs font-medium text-white">{mastery !== undefined ? `${mastery}%` : 'N/A'}</span>
                                                                </div>
                                                                <div className="w-full bg-gray-600 rounded-full h-1.5">
                                                                    <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${mastery ?? 0}%` }}></div>
                                                                </div>
                                                                <div className="flex justify-between text-xs text-gray-400 mt-2">
                                                                    <span>Sim: {simulationStats.correct.toLocaleString('it-IT', {maximumFractionDigits: 1})}/{simulationStats.appearances}</span>
                                                                    <span>Eser: {exerciseStats.completed}/{exerciseStats.appearances}</span>
                                                                </div>
                                                                 <div className="flex justify-between text-xs text-gray-400 mt-1">
                                                                    <span>Studiato: {p.lastStudied ? new Date(p.lastStudied).toLocaleDateString('it-IT') : 'Mai'}</span>
                                                                    <span>Praticato: {p.lastPracticed ? new Date(p.lastPracticed).toLocaleDateString('it-IT') : 'Mai'}</span>
                                                                </div>
                                                            </div>
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                             );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                        <DataIcon />
                        <h3 className="text-lg font-semibold text-gray-300 mt-4">Nessun Pointer Trovato</h3>
                        <p className="max-w-md mt-1">
                           Per generare i pointers, vai alla sezione "Dispense Materia", carica un PDF e l'analisi AI estrarrà automaticamente gli argomenti per te.
                        </p>
                    </div>
                )}
            </div>

            {selectedPointer && (
                <PointerDetailModal
                    pointer={selectedPointer}
                    content={pointerContent}
                    onClose={() => setSelectedPointer(null)}
                />
            )}
        </div>
    );
};