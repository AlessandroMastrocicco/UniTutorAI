import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Appunto, SavedDispensa, Thumbnail } from '../types';
import { db, type DbThumbnail } from '../db';
import { SolutionEditor } from './SolutionEditor';

// --- Types ---
interface TreeNote extends Appunto {
    children: TreeNote[];
}

// --- Icons ---
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>;
const TutorIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" /></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const CheckCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>;
const BookOpenIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>;
const AddSubNoteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" /></svg>;
const ChevronRightIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>;
const ChevronLeftIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>;
const NavChevronRightIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>;


// --- NoteItem Component for recursive rendering ---
const NoteItem: React.FC<{
    note: TreeNote;
    level: number;
    activeNoteId: string | null;
    onSelect: (noteId: string) => void;
    onAddSubNote: (parentId: string) => void;
    onDelete: (note: Appunto) => void;
    isSearching: boolean;
    setDraggedNoteId: (id: string | null) => void;
    onDropOnNote: (draggedId: string, targetId: string) => void;
}> = ({ note, level, activeNoteId, onSelect, onAddSubNote, onDelete, isSearching, setDraggedNoteId, onDropOnNote }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [isDragOver, setIsDragOver] = useState(false);

    useEffect(() => {
        if (isSearching) {
            setIsExpanded(true);
        }
    }, [isSearching]);

    const hasChildren = note.children.length > 0;
    const isSelected = activeNoteId === note.id;

    const handleDragStart = (e: React.DragEvent) => {
        e.stopPropagation();
        setDraggedNoteId(note.id);
        e.dataTransfer.setData('text/plain', note.id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragEnd = (e: React.DragEvent) => {
        e.stopPropagation();
        setDraggedNoteId(null);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        const draggedId = e.dataTransfer.getData('text/plain');
        if (draggedId) {
            onDropOnNote(draggedId, note.id);
        }
    };

    return (
        <div>
            <div
                draggable
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => onSelect(note.id)}
                className={`group flex items-center w-full text-left rounded-md px-2 py-1.5 transition-all duration-150 cursor-pointer 
                    ${isSelected ? 'bg-indigo-900/50' : 'hover:bg-gray-700/50'}
                    ${isDragOver ? 'border-2 border-dashed border-indigo-400 py-1' : 'border-2 border-transparent py-1.5'}
                `}
                style={{ paddingLeft: `${8 + level * 20}px` }}
            >
                {hasChildren ? (
                    <button onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }} className="mr-1 p-1 text-gray-400 hover:text-white rounded-full flex-shrink-0">
                        <ChevronRightIcon className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                    </button>
                ) : (
                    <span className="w-6 mr-1 flex-shrink-0"></span>
                )}
                <span className="font-semibold text-sm truncate pr-2 flex-grow">{note.title || 'Nuovo Argomento'}</span>
                
                <div className="flex-shrink-0 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                     <button
                        onClick={(e) => { e.stopPropagation(); onAddSubNote(note.id); }}
                        className="p-1 text-indigo-400/80 hover:text-indigo-300 rounded-full"
                        title="Aggiungi sotto-argomento"
                    >
                        <AddSubNoteIcon />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(note); }}
                        className="p-1 text-red-500/70 hover:text-red-400 rounded-full"
                        title="Elimina appunto"
                    >
                        <TrashIcon />
                    </button>
                </div>
            </div>
            {isExpanded && hasChildren && (
                <div className="mt-1 space-y-1">
                    {note.children.map(child => (
                        <NoteItem
                            key={child.id}
                            note={child}
                            level={level + 1}
                            activeNoteId={activeNoteId}
                            onSelect={onSelect}
                            onAddSubNote={onAddSubNote}
                            onDelete={onDelete}
                            isSearching={isSearching}
                            setDraggedNoteId={setDraggedNoteId}
                            onDropOnNote={onDropOnNote}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

interface AppuntiViewProps {
    subjectName: string;
    onSave: (note: Appunto) => void;
    onDelete: (noteId: string) => void;
    onGetAiReview: (note: Appunto, contextPages?: DbThumbnail[]) => Promise<string>;
    isProcessingAI: boolean;
    dataVersion: number;
    t: (key: string) => string;
    isEmbedded?: boolean;
}

// --- Helper function to render Markdown to HTML ---
const renderMarkdownToHTML = (markdown: string): string => {
    if (!markdown) return '';

    return markdown
        .split('\n\n')
        .map(paragraph => {
            const trimmed = paragraph.trim();
            if (trimmed.startsWith('## ')) {
                return `<h2 class="text-xl font-bold text-indigo-300 mt-4 mb-2">${trimmed.substring(3)}</h2>`;
            }
            if (trimmed.match(/^\s*[-*] /)) {
                const listItems = trimmed.split('\n').map(item =>
                    `<li class="text-gray-300">${item.replace(/^\s*[-*] /, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</li>`
                ).join('');
                return `<ul class="list-disc list-inside space-y-2 my-3">${listItems}</ul>`;
            }
            if (trimmed) {
                return `<p class="text-gray-300 mb-4 leading-relaxed">${trimmed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br />')}</p>`;
            }
            return '';
        })
        .join('');
};

export const AppuntiView: React.FC<AppuntiViewProps> = ({ subjectName, dataVersion, onSave, onDelete, onGetAiReview, isProcessingAI, t, isEmbedded = false }) => {
    const [notes, setNotes] = useState<Appunto[]>([]);
    const [dispense, setDispense] = useState<SavedDispensa[]>([]);
    const [allThumbnails, setAllThumbnails] = useState<Record<string, DbThumbnail[]>>({});
    
    const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [noteToDelete, setNoteToDelete] = useState<Appunto | null>(null);
    const [isEditorExpanded, setIsEditorExpanded] = useState(false);

    const [noteForReview, setNoteForReview] = useState<Appunto | null>(null);
    const [isDispensaSelectOpen, setIsDispensaSelectOpen] = useState(false);
    const [selectedDispensaForReview, setSelectedDispensaForReview] = useState<SavedDispensa | null>(null);
    const [isPageSelectOpen, setIsPageSelectOpen] = useState(false);
    const [reviewResult, setReviewResult] = useState<string | null>(null);
    const [isReviewResultOpen, setIsReviewResultOpen] = useState(false);
    const [isGettingReview, setIsGettingReview] = useState(false);

    const [isNoteListOpen, setIsNoteListOpen] = useState(true);
    const [draggedNoteId, setDraggedNoteId] = useState<string | null>(null);
    
    useEffect(() => {
        const loadViewData = async () => {
            if (!subjectName) {
                setNotes([]);
                setDispense([]);
                setAllThumbnails({});
                return;
            }

            const notesState = await db.appState.get('allNotes');
            // Explicitly type `subjectNotes` as `Appunto[]` to prevent type inference issues where `notes` could be treated as `unknown[]` or `any[]`, causing errors when accessing properties like `parentId`.
            const subjectNotes: Appunto[] = notesState?.value?.[subjectName] || [];
            setNotes(subjectNotes);

            const subjectDispense = await db.dispense.where({ subjectName }).toArray();
            setDispense(subjectDispense);

            if (subjectDispense.length > 0) {
                const dispensaIds = subjectDispense.map(d => d.id);
                const thumbnails = await db.thumbnails.where('dispensaId').anyOf(dispensaIds).toArray();
                const groupedThumbnails = thumbnails.reduce((acc, thumb) => {
                    (acc[thumb.dispensaId] = acc[thumb.dispensaId] || []).push(thumb);
                    return acc;
                }, {} as Record<string, DbThumbnail[]>);
                setAllThumbnails(groupedThumbnails);
            } else {
                setAllThumbnails({});
            }
        };

        loadViewData();
    }, [subjectName, dataVersion]);

    useEffect(() => {
        const activeNoteExists = notes.some(n => n.id === activeNoteId);

        if ((!activeNoteId || !activeNoteExists) && notes.length > 0) {
            const topLevelNotes = notes.filter(n => !n.parentId);
            const candidates = topLevelNotes.length > 0 ? topLevelNotes : notes;
            const noteToSelect = candidates.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
            if (noteToSelect) {
                setActiveNoteId(noteToSelect.id);
            }
        } else if (notes.length === 0 && activeNoteId !== null) {
            setActiveNoteId(null);
        }
    }, [notes, activeNoteId]);

    const buildNoteTree = useCallback((notesToTree: Appunto[]): TreeNote[] => {
        const noteMap: Record<string, TreeNote> = {};
        const tree: TreeNote[] = [];

        for (const note of notesToTree) {
            noteMap[note.id] = { ...note, children: [] };
        }
        for (const noteId in noteMap) {
            // Fix: When iterating over an object with a for...in loop, the indexed value can be inferred as `unknown`.
            // Asserting the type to `TreeNote` ensures that properties like `parentId` can be accessed without a type error.
// FIX: The type of `note` was being inferred as `unknown` due to strict type checking on indexed access. Casting it to `TreeNote` ensures its properties can be safely accessed.
            const note = noteMap[noteId] as TreeNote;
            if (note.parentId && noteMap[note.parentId]) {
                noteMap[note.parentId].children.push(note);
            } else {
                tree.push(note);
            }
        }
        return tree.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, []);

    const filteredNotes = useMemo(() => {
        const sorted = [...notes];
        if (!searchTerm.trim()) return sorted;
        
        const lowercasedTerm = searchTerm.toLowerCase();
        const noteMap = new Map(notes.map(n => [n.id, n]));
        const resultIds = new Set<string>();

        for (const note of sorted) {
            if (note.title.toLowerCase().includes(lowercasedTerm) || note.content.toLowerCase().includes(lowercasedTerm)) {
                resultIds.add(note.id);
                let current = note;
                while (current.parentId && noteMap.has(current.parentId)) {
                    resultIds.add(current.parentId);
                    current = noteMap.get(current.parentId)!;
                }
            }
        }
        return sorted.filter(note => resultIds.has(note.id));
    }, [notes, searchTerm]);

    const noteTree = useMemo(() => buildNoteTree(filteredNotes), [filteredNotes, buildNoteTree]);

    const activeNote = useMemo(() => notes.find(n => n.id === activeNoteId), [activeNoteId, notes]);

    const handleAddNote = (parentId?: string) => {
        const newNote: Appunto = { id: crypto.randomUUID(), title: 'Nuovo Argomento', content: '', date: new Date().toISOString(), parentId };
        onSave(newNote);
        setActiveNoteId(newNote.id);
    };

    const confirmDeleteNote = () => {
        if (noteToDelete) {
            onDelete(noteToDelete.id);
            if (activeNoteId === noteToDelete.id) {
                setActiveNoteId(null);
            }
            setNoteToDelete(null);
        }
    };
    
    const handleStartReview = (note: Appunto) => {
        setNoteForReview(note);
        setIsDispensaSelectOpen(true);
    };
    
    const handleReviewWithoutContext = async () => {
        if (!noteForReview) return;
        setIsDispensaSelectOpen(false);
        setIsGettingReview(true);
        setReviewResult(null);
        setIsReviewResultOpen(true);
        const result = await onGetAiReview(noteForReview);
        setReviewResult(result);
        setIsGettingReview(false);
        setNoteForReview(null);
    };
    
    const handleDispensaSelectedForReview = (dispensa: SavedDispensa) => {
        setSelectedDispensaForReview(dispensa);
        setIsDispensaSelectOpen(false);
        setIsPageSelectOpen(true);
    };
    
    const handlePagesSelectedForReview = async (pages: DbThumbnail[]) => {
        if (!noteForReview) return;
        setIsPageSelectOpen(false);
        setIsGettingReview(true);
        setReviewResult(null);
        setIsReviewResultOpen(true);
        const result = await onGetAiReview(noteForReview, pages);
        setReviewResult(result);
        setIsGettingReview(false);
        setNoteForReview(null);
        setSelectedDispensaForReview(null);
    };

    const handleDropOnNote = (draggedId: string, targetId: string) => {
        if (!draggedId || draggedId === targetId) return;

        let currentParentId: string | undefined = targetId;
        const noteMap = new Map(notes.map(n => [n.id, n]));
        while (currentParentId) {
            if (currentParentId === draggedId) {
                console.warn("Cannot drop a note onto its own descendant.");
                return;
            }
            currentParentId = noteMap.get(currentParentId)?.parentId;
        }

        const draggedNote = notes.find(n => n.id === draggedId);
        if (draggedNote) {
            onSave({ ...draggedNote, parentId: targetId, date: new Date().toISOString() });
        }
    };

    const handleDropOnRoot = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const draggedId = e.dataTransfer.getData('text/plain');
        if (!draggedId) return;

        const draggedNote = notes.find(n => n.id === draggedId);
        if (draggedNote && draggedNote.parentId) {
            onSave({ ...draggedNote, parentId: undefined, date: new Date().toISOString() });
        }
    };


    return (
        <div className={`w-full flex flex-col ${isEmbedded ? 'h-full' : 'max-w-7xl mx-auto h-[calc(100vh-100px)]'}`}>
             {!isEmbedded && (
                <header className="w-full mb-6 text-center flex-shrink-0">
                    <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">{t('sidebar.appunti')}</h1>
                    <p className="text-gray-400 mt-2 text-md">{t('appunti.description')}</p>
                </header>
             )}
            
            <div className="flex-grow flex gap-6 overflow-hidden">
                {/* Left Column: Note List */}
                {!isEditorExpanded && (
                    <div className={`bg-gray-800 rounded-xl flex flex-col transition-all duration-300 ${isNoteListOpen ? 'w-2/5 p-4' : 'w-20 p-2 items-center'}`}>
                        <div className={`flex-shrink-0 mb-4 w-full ${isNoteListOpen ? '' : 'flex flex-col items-center'}`}>
                            <div className="flex items-center justify-between">
                                {isNoteListOpen && <h2 className="text-lg font-bold text-white">Argomenti</h2>}
                                <button onClick={() => setIsNoteListOpen(!isNoteListOpen)} className="p-2 rounded-lg hover:bg-gray-700">
                                    {isNoteListOpen ? <ChevronLeftIcon /> : <NavChevronRightIcon />}
                                </button>
                            </div>
                            {isNoteListOpen && (
                                <>
                                    <div className="mt-4 space-y-4">
                                        <button onClick={() => handleAddNote()} className="w-full inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg">
                                            <PlusIcon /> {t('appunti.newTopic')}
                                        </button>
                                        <div className="relative">
                                            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                                <SearchIcon />
                                            </span>
                                            <input
                                                type="text"
                                                placeholder={t('appunti.searchPlaceholder')}
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 pl-10 focus:ring-indigo-500 focus:border-indigo-500"
                                            />
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {isNoteListOpen ? (
                             notes.length === 0 ? (
                                <div className="flex-grow flex items-center justify-center text-center text-gray-500">{t('appunti.createFirstNote')}</div>
                            ) : filteredNotes.length === 0 ? (
                                <div className="flex-grow flex items-center justify-center text-center text-gray-500">{t('appunti.noResults')}</div>
                            ) : (
                                <div onDragOver={(e) => e.preventDefault()} onDrop={handleDropOnRoot} className="flex-grow overflow-y-auto pr-2 space-y-1">
                                    {noteTree.map(note => (
                                        <NoteItem
                                            key={note.id}
                                            note={note}
                                            level={0}
                                            activeNoteId={activeNoteId}
                                            onSelect={setActiveNoteId}
                                            onAddSubNote={handleAddNote}
                                            onDelete={setNoteToDelete}
                                            isSearching={!!searchTerm.trim()}
                                            setDraggedNoteId={setDraggedNoteId}
                                            onDropOnNote={handleDropOnNote}
                                        />
                                    ))}
                                </div>
                            )
                        ) : (
                            <div className="flex-grow overflow-y-auto space-y-2 flex flex-col items-center w-full pt-4">
                                <button onClick={() => handleAddNote()} className="p-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white" title={t('appunti.newTopic')}><PlusIcon /></button>
                                <div className="border-b border-gray-700 w-full my-2"></div>
                                {noteTree.map(note => (
                                    <button
                                        key={note.id}
                                        onClick={() => setActiveNoteId(note.id)}
                                        className={`w-full p-3 rounded-lg flex justify-center ${activeNoteId === note.id ? 'bg-indigo-900/50' : 'hover:bg-gray-700/50'}`}
                                        title={note.title}
                                    >
                                        <BookOpenIcon className="h-6 w-6 text-gray-400"/>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}


                {/* Right Column: Editor */}
                <div className={`${isEditorExpanded ? 'w-full' : 'flex-grow'} bg-gray-800 rounded-xl p-4 flex flex-col transition-all duration-300`}>
                    {!activeNote ? (
                        <div className="flex-grow flex flex-col items-center justify-center text-center text-gray-500">
                            <BookOpenIcon/>
                            <h3 className="text-lg font-semibold text-gray-300 mt-4">{t('appunti.selectNote')}</h3>
                            <p className="text-sm">{t('appunti.selectNotePrompt')}</p>
                        </div>
                    ) : (
                       <div className="flex-grow flex flex-col min-h-0">
                           <input
                               type="text"
                               value={activeNote.title}
                               onChange={e => onSave({ ...activeNote, title: e.target.value, date: new Date().toISOString() })}
                               className="flex-shrink-0 w-full bg-transparent text-white text-2xl font-bold focus:outline-none p-3 border-b-2 border-gray-700"
                           />
                           <SolutionEditor
                               key={activeNote.id}
                               initialContent={activeNote.content}
                               onSave={(content) => onSave({ ...activeNote, content, date: new Date().toISOString() })}
                               isExpanded={isEditorExpanded}
                               onToggleExpand={() => setIsEditorExpanded(prev => !prev)}
                           />
                           <div className="flex-shrink-0 pt-4 mt-auto">
                               <button onClick={() => handleStartReview(activeNote)} disabled={!activeNote.content.trim() || isProcessingAI || isGettingReview} className="inline-flex items-center bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-3 rounded-lg text-sm disabled:bg-gray-600 disabled:cursor-not-allowed">
                                   <TutorIcon /> {t('appunti.aiReview')}
                               </button>
                           </div>
                       </div>
                    )}
                </div>
            </div>

            {noteToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4" onClick={() => setNoteToDelete(null)}>
                    <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-white">{t('appunti.deleteConfirmTitle')}</h3>
                            <p className="text-gray-300 my-4">
                                {t('appunti.deleteConfirmMessage').replace('{title}', noteToDelete.title)}
                            </p>
                            <div className="text-yellow-400 bg-yellow-900/50 p-3 rounded-lg text-sm">
                                <p><strong>{t('appunti.warning')}:</strong> {t('appunti.deleteWarning')}</p>
                            </div>
                        </div>
                        <div className="bg-gray-900/50 px-6 py-4 flex justify-end gap-4 rounded-b-2xl">
                            <button 
                                onClick={() => setNoteToDelete(null)} 
                                className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                            >
                                {t('common.cancel')}
                            </button>
                            <button 
                                onClick={confirmDeleteNote}
                                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                            >
                                {t('common.delete')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            <DispensaSelectModal 
                isOpen={isDispensaSelectOpen}
                dispense={dispense}
                allThumbnails={allThumbnails}
                onClose={() => { setIsDispensaSelectOpen(false); setNoteForReview(null); }}
                onSelect={handleDispensaSelectedForReview}
                onReviewWithoutContext={handleReviewWithoutContext}
                t={t}
            />

            {selectedDispensaForReview && (
                 <PageSelectModal
                    isOpen={isPageSelectOpen}
                    dispensa={selectedDispensaForReview}
                    allThumbnails={allThumbnails}
                    onClose={() => { setIsPageSelectOpen(false); setSelectedDispensaForReview(null); setNoteForReview(null); }}
                    onConfirm={handlePagesSelectedForReview}
                    t={t}
                />
            )}

            <ReviewResultModal
                isOpen={isReviewResultOpen}
                isProcessing={isGettingReview}
                result={reviewResult}
                onClose={() => { setIsReviewResultOpen(false); setReviewResult(null); }}
                t={t}
            />

        </div>
    );
};

const DispensaSelectModal: React.FC<{ 
    isOpen: boolean;
    dispense: SavedDispensa[]; 
    allThumbnails: Record<string, DbThumbnail[]>; 
    onClose: () => void; 
    onSelect: (dispensa: SavedDispensa) => void;
    onReviewWithoutContext: () => void; 
    t: (key: string) => string;
}> = ({ isOpen, dispense, allThumbnails, onClose, onSelect, onReviewWithoutContext, t }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-[51] p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col h-[80vh]" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-gray-700 flex-shrink-0 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white">{t('appunti.selectReference')}</h2>
                    <button onClick={onReviewWithoutContext} className="text-sm bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-3 rounded-lg transition-colors">{t('appunti.reviewWithoutContext')}</button>
                </header>
                <div className="flex-grow overflow-y-auto p-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                {dispense.length > 0 ? dispense.map(d => {
                    const firstThumbnailUrl = (allThumbnails[d.id] || [])[0]?.dataUrl;
                    return (
                        <div key={d.id} onClick={() => onSelect(d)} className="group bg-gray-700 rounded-lg overflow-hidden cursor-pointer hover:ring-2 ring-indigo-500">
                            <img src={firstThumbnailUrl} alt={`Anteprima ${d.name}`} className="w-full h-24 object-cover object-top bg-gray-600" />
                            <div className="p-3">
                                <h3 className="font-bold truncate">{d.name}</h3>
                                <p className="text-xs text-gray-400">{t('appunti.pages').replace('{count}', String(d.totalPages))}</p>
                            </div>
                        </div>
                    );
                }) : (
                    <div className="col-span-full flex items-center justify-center text-center text-gray-500">{t('appunti.noDispenseFound')}</div>
                )}
                </div>
                <footer className="p-4 border-t border-gray-700 flex-shrink-0 flex justify-end"><button onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">{t('common.cancel')}</button></footer>
            </div>
        </div>
    );
};

const PageSelectModal: React.FC<{ 
    isOpen: boolean;
    dispensa: SavedDispensa; 
    allThumbnails: Record<string, DbThumbnail[]>; 
    onClose: () => void; 
    onConfirm: (pages: DbThumbnail[]) => void;
    t: (key: string) => string; 
}> = ({ isOpen, dispensa, allThumbnails, onClose, onConfirm, t }) => {
    const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
    const pagesForDispensa = allThumbnails[dispensa.id] || [];
    const togglePage = (pageNumber: number) => setSelectedPages(p => { const n = new Set(p); if (n.has(pageNumber)) n.delete(pageNumber); else n.add(pageNumber); return n; });
    const handleConfirm = () => onConfirm(pagesForDispensa.filter(p => selectedPages.has(p.pageNumber)));

    if(!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-[52] p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col h-[80vh]" onClick={e => e.stopPropagation()}>
                 <header className="p-4 border-b border-gray-700 flex-shrink-0 flex justify-between items-center"><h2 className="text-xl font-bold text-white">{t('appunti.selectPagesFrom').replace('{name}', dispensa.name)}</h2><p className="text-sm font-semibold bg-gray-700 px-3 py-1 rounded-full">{t('appunti.selectedCount').replace('{count}', String(selectedPages.size))}</p></header>
                 <div className="flex-grow overflow-y-auto p-4 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">{pagesForDispensa.map(p => (<div key={p.pageNumber} onClick={() => togglePage(p.pageNumber)} className="relative cursor-pointer group"><img src={p.dataUrl} alt={`${t('appunti.page')} ${p.pageNumber}`} className={`w-full rounded-md transition-all ${selectedPages.has(p.pageNumber) ? 'ring-4 ring-indigo-500' : 'group-hover:opacity-80'}`} />{selectedPages.has(p.pageNumber) && <div className="absolute top-2 right-2 bg-indigo-600 rounded-full p-1 shadow-lg"><CheckCircleIcon /></div>}<div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs text-center py-0.5 rounded-b-md">{p.pageNumber}</div></div>))}</div>
                 <footer className="p-4 border-t border-gray-700 flex-shrink-0 flex justify-end gap-4"><button onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">{t('common.cancel')}</button><button onClick={handleConfirm} disabled={selectedPages.size === 0} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-500">{t('appunti.confirmSelection')}</button></footer>
            </div>
        </div>
    );
};

const ReviewResultModal: React.FC<{
    isOpen: boolean;
    isProcessing: boolean;
    result: string | null;
    onClose: () => void;
    t: (key: string) => string;
}> = ({ isOpen, isProcessing, result, onClose, t }) => {
    if(!isOpen) return null;

    return (
         <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-[53] p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col h-[80vh]" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-gray-700 flex-shrink-0 flex items-center gap-3">
                    <TutorIcon />
                    <h2 className="text-xl font-bold text-white">{t('appunti.aiReview')}</h2>
                </header>
                <div className="flex-grow p-6 overflow-y-auto">
                    {isProcessing ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                            <p className="mt-4 text-gray-300">{t('appunti.aiAnalyzing')}</p>
                        </div>
                    ) : (
                        <div
                            className="max-w-none text-gray-200"
                            dangerouslySetInnerHTML={{ __html: renderMarkdownToHTML(result || '') }}
                        >
                        </div>
                    )}
                </div>
                <footer className="p-4 border-t border-gray-700 flex-shrink-0 flex justify-end">
                    <button onClick={onClose} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg">{t('appunti.close')}</button>
                </footer>
            </div>
        </div>
    );
};