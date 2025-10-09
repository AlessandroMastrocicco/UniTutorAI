import React, { useState, useMemo } from 'react';
import type { LessonDiary } from '../types';
import { db } from '../db';

// Icons
const ChevronDownIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>;

interface DiarioLezioniViewProps {
    selectedSubject: string;
    diaries: LessonDiary[];
    t: (key: string) => string;
}

export const DiarioLezioniView: React.FC<DiarioLezioniViewProps> = ({ selectedSubject, diaries, t }) => {
    const [expandedDiaryId, setExpandedDiaryId] = useState<string | null>(null);

    const sortedDiaries = useMemo(() => {
        return [...diaries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [diaries]);

    const toggleDiary = (id: string) => {
        setExpandedDiaryId(prevId => (prevId === id ? null : id));
    };

    return (
        <div className="w-full max-w-5xl mx-auto">
            <header className="mb-6 text-center">
                <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">{t('sidebar.lessonDiary')}</h1>
                <p className="text-gray-400 mt-2 text-md">Rivedi le trascrizioni delle lezioni che hai completato.</p>
            </header>
            
            <div className="bg-gray-800 rounded-2xl p-6">
                 {sortedDiaries.length > 0 ? (
                    <div className="space-y-3">
                        {sortedDiaries.map(diary => (
                            <div key={diary.id} className="bg-gray-900/50 rounded-lg">
                                <button onClick={() => toggleDiary(diary.id)} className="w-full flex justify-between items-center p-4 text-left">
                                    <div>
                                        <h3 className="font-bold text-lg text-white">{diary.topicTitle}</h3>
                                        <p className="text-sm text-gray-400">{new Date(diary.date).toLocaleString('it-IT')}</p>
                                    </div>
                                    <ChevronDownIcon className={`${expandedDiaryId === diary.id ? 'rotate-180' : ''}`} />
                                </button>
                                {expandedDiaryId === diary.id && (
                                    <div className="px-4 pb-4 border-t border-gray-700 mt-2 pt-2">
                                         <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                                            {diary.transcript.map((step, index) => (
                                                <div key={index} className="p-3 bg-gray-700/50 rounded-lg">
                                                    <p className="text-xs font-bold text-indigo-400 mb-1">Slide Pag. {step.pageNumber}</p>
                                                    <p className="text-gray-200 whitespace-pre-wrap">{step.text}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-gray-400 py-12">
                        <p className="text-lg">Nessuna lezione completata.</p>
                        <p>Completa una lezione con il tutor per vederla apparire qui.</p>
                    </div>
                )}
            </div>
        </div>
    );
};