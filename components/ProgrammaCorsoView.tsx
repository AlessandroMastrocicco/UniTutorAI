import React, { useState, useEffect } from 'react';
import type { SavedDispensa, SyllabusModule } from '../types';

// Icons
const EditSequenceIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>;
const GenerateIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" /></svg>;
const ArrowUpIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" /></svg>;
const ArrowDownIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1.707-7.293a1 1 0 00-1.414 0L9 12.586V9a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 000-1.414z" clipRule="evenodd" /></svg>;
const SaveIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>;
const ChevronDownIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>;

interface ProgrammaCorsoViewProps {
    selectedSubject: string;
    dispense: SavedDispensa[];
    syllabus: SyllabusModule[];
    onUpdateDispenseOrder: (newOrder: SavedDispensa[]) => void;
    onToggleTopicStatus: (moduleId: string, topicId: string) => void;
    onGenerateSyllabus: () => Promise<string>;
    isGenerating: boolean;
}

export const ProgrammaCorsoView: React.FC<ProgrammaCorsoViewProps> = ({ selectedSubject, dispense, syllabus, onUpdateDispenseOrder, onToggleTopicStatus, onGenerateSyllabus, isGenerating }) => {
    const [isEditingSequence, setIsEditingSequence] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

     useEffect(() => {
        setIsEditingSequence(false);
        // Expand the first module by default when syllabus loads
        if (syllabus.length > 0) {
            setExpandedModules(new Set([syllabus[0].id]));
        } else {
            setExpandedModules(new Set());
        }
    }, [selectedSubject, syllabus]);

    const handleMoveDispensa = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === dispense.length - 1) return;

        const newOrder = [...dispense];
        const item = newOrder.splice(index, 1)[0];
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        newOrder.splice(newIndex, 0, item);
        onUpdateDispenseOrder(newOrder);
    };

    const handleGenerateClick = async () => {
        setError('');
        const errorMessage = await onGenerateSyllabus();
        if (errorMessage) {
            setError(errorMessage);
        }
    };
    
    const handleSaveSequence = () => {
        setIsEditingSequence(false);
        setSuccessMessage('Sequenza dispense salvata!');
        setTimeout(() => setSuccessMessage(''), 3000);
    }

    const toggleModule = (moduleId: string) => {
        setExpandedModules(prev => {
            const newSet = new Set(prev);
            if (newSet.has(moduleId)) {
                newSet.delete(moduleId);
            } else {
                newSet.add(moduleId);
            }
            return newSet;
        });
    };

    return (
        <div className="w-full">
            <header className="w-full max-w-5xl mx-auto mb-6">
                <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Programma del Corso</h1>
                <p className="text-gray-400 mt-2 text-md">Organizza le dispense e genera un programma di studio per "{selectedSubject}".</p>
            </header>
            
            {successMessage && (
                <div className="w-full max-w-5xl mx-auto bg-green-900 border border-green-700 text-green-200 px-4 py-2 rounded-lg mb-4 text-sm" role="alert">
                   {successMessage}
                </div>
            )}

            <div className="w-full max-w-5xl mx-auto flex flex-col lg:flex-row gap-8">
                {/* Left side - Dispense Sequence */}
                <div className="lg:w-1/3 w-full bg-gray-800 rounded-2xl p-6 flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-white">Sequenza Dispense</h2>
                        {!isEditingSequence ? (
                             <button 
                                onClick={() => setIsEditingSequence(true)}
                                className="flex items-center text-sm bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-3 rounded-lg transition-colors"
                            >
                                <EditSequenceIcon />
                                Modifica
                            </button>
                        ) : (
                             <button 
                                onClick={handleSaveSequence}
                                className="flex items-center text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-3 rounded-lg transition-colors"
                            >
                                <SaveIcon />
                                Salva
                            </button>
                        )}
                    </div>
                    {dispense.length > 0 ? (
                        <ul className="space-y-3 overflow-y-auto">
                            {dispense.map((d, index) => (
                                <li key={d.id} className="bg-gray-700 p-3 rounded-lg flex items-center justify-between">
                                    <div className="flex items-center overflow-hidden">
                                        <span className="font-bold text-gray-400 mr-3">{index + 1}.</span>
                                        <p className="font-semibold text-white truncate" title={d.name}>{d.name}</p>
                                    </div>
                                    {isEditingSequence && (
                                        <div className="flex gap-1 flex-shrink-0 ml-2">
                                            <button 
                                                onClick={() => handleMoveDispensa(index, 'up')} 
                                                disabled={index === 0}
                                                className="p-1 rounded-full text-gray-300 hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                                title="Sposta su"
                                            >
                                                <ArrowUpIcon />
                                            </button>
                                            <button 
                                                onClick={() => handleMoveDispensa(index, 'down')} 
                                                disabled={index === dispense.length - 1}
                                                className="p-1 rounded-full text-gray-300 hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                                title="Sposta giù"
                                            >
                                                <ArrowDownIcon />
                                            </button>
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    ) : (
                         <div className="flex-grow flex items-center justify-center">
                            <p className="text-gray-400 text-center">Nessuna dispensa salvata per questa materia.</p>
                         </div>
                    )}
                </div>

                {/* Right side - Syllabus */}
                <div className="lg:w-2/3 w-full bg-gray-800 rounded-2xl p-6">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-4">
                        <h2 className="text-xl font-bold text-white">Programma di Studio</h2>
                         <button
                            onClick={handleGenerateClick}
                            disabled={isGenerating || dispense.length === 0}
                            className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                        >
                            {isGenerating ? (
                                <><div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div> In generazione...</>
                            ) : (
                                <><GenerateIcon />{syllabus.length > 0 ? 'Aggiorna con AI' : 'Genera con AI'}</>
                            )}
                        </button>
                    </div>
                     {error && (
                        <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-2 rounded-lg mb-4 text-sm" role="alert">
                            <strong>Errore: </strong>{error}
                        </div>
                    )}
                    <div className="space-y-2 h-96 overflow-y-auto pr-2">
                        {syllabus.length > 0 ? (
                            syllabus.map(module => (
                                <div key={module.id} className="bg-gray-900/50 rounded-lg">
                                    <button onClick={() => toggleModule(module.id)} className="w-full flex justify-between items-center p-4 text-left">
                                        <h3 className="font-bold text-lg text-white">{module.title}</h3>
                                        <ChevronDownIcon className={`${expandedModules.has(module.id) ? 'rotate-180' : ''}`} />
                                    </button>
                                    {expandedModules.has(module.id) && (
                                        <div className="px-4 pb-4">
                                            <ul className="space-y-3">
                                                {module.topics.map(topic => (
                                                    <li key={topic.id} className="bg-gray-700 p-3 rounded-md">
                                                        <h4 className="font-semibold text-white">{topic.title}</h4>
                                                        <p className="text-sm text-gray-300 mt-1 mb-3">{topic.description}</p>
                                                        <label className="flex items-center cursor-pointer w-fit bg-gray-600 hover:bg-gray-500 px-3 py-1 rounded-full text-sm">
                                                            <input
                                                                type="checkbox"
                                                                checked={topic.discussedWithTutor}
                                                                onChange={() => onToggleTopicStatus(module.id, topic.id)}
                                                                className="h-4 w-4 rounded bg-gray-800 border-gray-500 text-indigo-500 focus:ring-indigo-600"
                                                            />
                                                            <span className="ml-2 font-medium">Affrontato</span>
                                                        </label>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                             <div className="flex h-full items-center justify-center text-center text-gray-400 p-4">
                                <p>Clicca 'Genera con AI' per creare un programma basato sulle tue dispense.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};