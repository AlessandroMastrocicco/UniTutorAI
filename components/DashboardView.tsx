import React, { useState, useEffect } from 'react';
import type { DashboardData, DashboardEvent, GlobalTutorState } from '../types';
import { db } from '../db';

// --- Icons ---
const ClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.415L11 9.586V6z" clipRule="evenodd" /></svg>;
const LocationIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>;
const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const BookIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V4z" /></svg>;
const ManageIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0 3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const PencilIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>;
const CheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>;
const XIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
const TargetIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l5-2 2 8z" /><path strokeLinecap="round" strokeLinejoin="round" d="M9.354 14.646a5 5 0 010-7.07m7.07 0a5 5 0 010 7.07" /></svg>;
const ChevronDownIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>;

interface DashboardViewProps {
    data: DashboardData;
    subjects: string[];
    onSubjectAdd: (subjectName: string) => void;
    onSubjectDelete: (subjectName: string) => void;
    onSubjectRename: (oldName: string, newName: string) => void;
    onNavigate: (subject: string, view: string) => void;
    onCompleteTask: (taskId: string, subjectName: string) => void;
    isTutorSyncing: boolean;
    dataVersion: number;
}

const useCountdown = (targetDate: Date) => {
    const [timeLeft, setTimeLeft] = React.useState('');

    React.useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            const difference = targetDate.getTime() - now.getTime();
            
            if (difference > 0) {
                const days = Math.floor(difference / (1000 * 60 * 60 * 24));
                const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
                setTimeLeft(`${days}g ${hours}h`);
            } else {
                setTimeLeft('Oggi');
            }
        }, 1000 * 60); // Update every minute is enough

        // initial call
        const now = new Date();
        const difference = targetDate.getTime() - now.getTime();
        if (difference > 0) {
            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
            setTimeLeft(`${days}g ${hours}h`);
        } else {
            setTimeLeft('Oggi');
        }

        return () => clearInterval(interval);
    }, [targetDate]);

    return timeLeft;
};

const ExamCountdown: React.FC<{ exam: DashboardEvent }> = ({ exam }) => {
    const countdown = useCountdown(exam.date);
    return <span className="font-semibold text-white">{countdown}</span>;
};

const ManageSubjectsModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    subjects: string[];
    onSubjectAdd: (subjectName: string) => void;
    onSubjectDelete: (subjectName: string) => void;
    onSubjectRename: (oldName: string, newName: string) => void;
}> = ({ isOpen, onClose, subjects, onSubjectAdd, onSubjectDelete, onSubjectRename }) => {
    const [newSubjectName, setNewSubjectName] = useState('');
    const [editingSubject, setEditingSubject] = useState<string | null>(null);
    const [editingValue, setEditingValue] = useState('');
    const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);

    const handleAddSubject = () => {
        if (newSubjectName.trim()) {
            onSubjectAdd(newSubjectName.trim());
            setNewSubjectName('');
        }
    };
    
    const startEditing = (subject: string) => {
        setEditingSubject(subject);
        setEditingValue(subject);
        setConfirmingDelete(null);
    };

    const handleSaveRename = () => {
        if (editingSubject && editingValue.trim()) {
            onSubjectRename(editingSubject, editingValue.trim());
        }
        setEditingSubject(null);
        setEditingValue('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
                <header className="flex-shrink-0 p-4 flex justify-between items-center border-b border-gray-700">
                    <h2 className="text-xl font-bold text-white">Gestione Materie</h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-full"><CloseIcon /></button>
                </header>
                <div className="flex-1 p-6 overflow-y-auto">
                    <div className="flex gap-2 mb-4 pb-4 border-b border-gray-700">
                        <input
                            type="text"
                            value={newSubjectName}
                            onChange={(e) => setNewSubjectName(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddSubject()}
                            placeholder="Nome nuova materia"
                            className="flex-1 bg-gray-700 border border-gray-600 rounded-lg p-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <button onClick={handleAddSubject} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg">Aggiungi</button>
                    </div>
                     {subjects.length > 0 ? (
                        <ul className="space-y-2">
                            {subjects.map(subject => (
                                <li key={subject} className="group bg-gray-900/50 p-3 rounded-lg flex items-center justify-between">
                                    {editingSubject === subject ? (
                                        <div className="flex-1 flex gap-2 items-center">
                                            <input 
                                                type="text" 
                                                value={editingValue} 
                                                onChange={e => setEditingValue(e.target.value)}
                                                onKeyPress={e => e.key === 'Enter' && handleSaveRename()}
                                                onKeyDown={e => e.key === 'Escape' && setEditingSubject(null)}
                                                autoFocus
                                                className="flex-1 bg-gray-600 border border-indigo-500 rounded-lg p-1"
                                            />
                                            <button onClick={handleSaveRename} className="p-1.5 text-green-400 hover:bg-gray-700 rounded-full"><CheckIcon /></button>
                                            <button onClick={() => setEditingSubject(null)} className="p-1.5 text-red-400 hover:bg-gray-700 rounded-full"><XIcon /></button>
                                        </div>
                                    ) : confirmingDelete === subject ? (
                                        <div className="flex-1 flex justify-between items-center bg-red-900/50 p-2 rounded-md">
                                            <span className="text-white font-semibold">Sei sicuro di voler eliminare "{subject}"?</span>
                                            <div className="flex gap-2">
                                                <button onClick={() => { onSubjectDelete(subject); setConfirmingDelete(null); }} className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded-lg text-sm">Sì</button>
                                                <button onClick={() => setConfirmingDelete(null)} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-1 px-3 rounded-lg text-sm">No</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <span className="font-semibold text-white">{subject}</span>
                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => startEditing(subject)} className="p-1.5 text-gray-300 hover:text-white hover:bg-gray-700 rounded-full" title="Rinomina"><PencilIcon/></button>
                                                <button onClick={() => { setConfirmingDelete(subject); setEditingSubject(null); }} className="p-1.5 text-red-500 hover:text-red-400 hover:bg-gray-700 rounded-full" title="Elimina"><TrashIcon/></button>
                                            </div>
                                        </>
                                    )}
                                </li>
                            ))}
                        </ul>
                    ) : (
                         <p className="text-gray-400 text-center py-8">Nessuna materia creata. Aggiungine una per iniziare!</p>
                    )}
                </div>
                <footer className="bg-gray-900/50 px-6 py-3 flex justify-end rounded-b-2xl border-t border-gray-700">
                    <button onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">Chiudi</button>
                </footer>
            </div>
        </div>
    );
};

const TodaysScheduleCard: React.FC<{ todaysEvents: DashboardEvent[] }> = ({ todaysEvents }) => (
    <div id="dashboard-todays-schedule" className="bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center">
            <CalendarIcon />
            <span className="ml-2">La Tua Giornata</span>
        </h2>

        {todaysEvents.length > 0 ? (
            <ul className="space-y-4">
                {todaysEvents.map(event => (
                    <li key={event.id} className="bg-gray-900/50 p-4 rounded-lg flex items-center space-x-4">
                        <div className="w-16 text-center flex-shrink-0">
                            <p className="font-bold text-white text-md">{event.startTime}</p>
                            {event.endTime && <p className="text-xs text-gray-400">{event.endTime}</p>}
                        </div>
                        <div className="border-l-4 border-indigo-500 pl-4 flex-grow">
                            <p className="font-semibold text-white">{event.title}</p>
                            <div className="text-sm text-gray-300 mt-1 space-y-1">
                                <div className="flex items-center"><BookIcon /> <span>{event.subjectName} ({event.type})</span></div>
                                {event.location && <div className="flex items-center"><LocationIcon /> <span>{event.location}</span></div>}
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        ) : (
            <p className="text-gray-400 text-center py-8">Nessun evento in programma per oggi. Goditi la giornata!</p>
        )}
    </div>
);

const DailyTasksCard: React.FC<{
    subjects: string[];
    onCompleteTask: (taskId: string, subjectName: string) => void;
    isTutorSyncing: boolean;
    dataVersion: number;
}> = ({ subjects, onCompleteTask, isTutorSyncing, dataVersion }) => {
    const [allTasksBySubject, setAllTasksBySubject] = useState<Record<string, GlobalTutorState['tasks']>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());

    useEffect(() => {
        const fetchTasks = async () => {
            setIsLoading(true);
            if (subjects.length === 0) {
                setAllTasksBySubject({});
                setIsLoading(false);
                return;
            }
            const keys = subjects.map(s => `globalTutorState_${s}`);
            const states = await db.appState.bulkGet(keys);
            
            const tasksBySubject: Record<string, GlobalTutorState['tasks']> = {};
            const initialExpanded = new Set<string>();
            states.forEach((state, index) => {
                const subjectName = subjects[index];
                if (state?.value?.tasks?.length > 0) {
                    tasksBySubject[subjectName] = state.value.tasks;
                    initialExpanded.add(subjectName);
                }
            });

            setAllTasksBySubject(tasksBySubject);
            setExpandedSubjects(initialExpanded);
            setIsLoading(false);
        };
        fetchTasks();
    }, [subjects, dataVersion]);

    const toggleSubject = (subjectName: string) => {
        setExpandedSubjects(prev => {
            const newSet = new Set(prev);
            if (newSet.has(subjectName)) newSet.delete(subjectName);
            else newSet.add(subjectName);
            return newSet;
        });
    };

    const subjectsWithTasks = Object.keys(allTasksBySubject);

    return (
        <div id="dashboard-daily-tasks" className="bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                <TargetIcon />
                <span className="ml-2">Task Giornalieri</span>
            </h2>
            {isLoading || isTutorSyncing ? (
                 <p className="text-gray-400 text-center py-8">
                    {isTutorSyncing ? "Sincronizzazione degli obiettivi in corso..." : "Caricamento task..."}
                </p>
            ) : subjectsWithTasks.length > 0 ? (
                <div className="space-y-4">
                    {subjectsWithTasks.map(subjectName => {
                        const tasks = allTasksBySubject[subjectName];
                        const firstUncompletedIndex = tasks.findIndex(t => !t.isCompleted) ?? -1;
                        const isExpanded = expandedSubjects.has(subjectName);
                        return (
                            <div key={subjectName} className="bg-gray-900/50 rounded-lg">
                                <button onClick={() => toggleSubject(subjectName)} className="w-full flex justify-between items-center p-4 text-left">
                                    <h3 className="font-bold text-lg text-white">{subjectName}</h3>
                                    <ChevronDownIcon />
                                </button>
                                {isExpanded && (
                                <div className="px-4 pb-4 border-t border-gray-700 mt-2 pt-3">
                                <ul className="space-y-3">
                                    {tasks.map((task, index) => {
                                        const isCompleted = task.isCompleted;
                                        const isActive = firstUncompletedIndex === index;
                                        const isLocked = firstUncompletedIndex !== -1 && index > firstUncompletedIndex;

                                        return (
                                            <li key={task.id} className={`flex items-start gap-3 p-3 rounded-lg transition-all bg-gray-700/50`}>
                                                <div className="pt-1 flex-shrink-0">
                                                    {isCompleted ? (
                                                        <div className="h-6 w-6 flex items-center justify-center rounded-full bg-green-500 text-white" title="Completato"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></div>
                                                    ) : isActive ? (
                                                        <button onClick={() => onCompleteTask(task.id, subjectName)} className="h-6 w-6 rounded-full border-2 border-indigo-400 bg-gray-800 hover:bg-indigo-500 transition-colors" title="Segna come completato"></button>
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
                                </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <p className="text-gray-400 text-center py-8">Nessun obiettivo per oggi. Sincronizza il tutor per generarne di nuovi.</p>
            )}
        </div>
    );
};

const UpcomingExamsCard: React.FC<{ upcomingExams: DashboardEvent[] }> = ({ upcomingExams }) => (
    <div id="dashboard-upcoming-exams" className="bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center">
            <CalendarIcon />
            <span className="ml-2">Prossimi Esami</span>
        </h2>
        {upcomingExams.length > 0 ? (
            <ul className="space-y-3">
                {upcomingExams.map(exam => (
                    <li key={exam.id} className="bg-gray-900/50 p-3 rounded-lg flex justify-between items-center">
                        <div>
                            <p className="font-semibold text-white">{exam.subjectName}</p>
                            <p className="text-sm text-gray-400">{exam.date.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })} {exam.startTime && `- ${exam.startTime}`}</p>
                        </div>
                        <div className="bg-red-900/50 text-red-300 text-sm font-semibold px-3 py-1 rounded-full">
                            <ExamCountdown exam={exam} />
                        </div>
                    </li>
                ))}
            </ul>
        ) : (
            <p className="text-gray-400 text-center py-8">Nessun esame imminente nei prossimi 14 giorni.</p>
        )}
    </div>
);

const StudySubjectsCard: React.FC<{
    subjects: string[];
    onNavigate: (subject: string, view: string) => void;
    onManageClick: () => void;
}> = ({ subjects, onNavigate, onManageClick }) => (
    <div id="dashboard-study-subjects" className="bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white flex items-center">
                <ManageIcon />
                <span className="ml-2">Materie di Studio</span>
            </h2>
            <button onClick={onManageClick} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg">
                Gestisci
            </button>
        </div>
        {subjects.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {subjects.map(subject => (
                    <button
                        key={subject}
                        onClick={() => onNavigate(subject, 'details')}
                        className="bg-gray-900/50 p-4 rounded-lg text-left hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <p className="font-semibold text-white truncate">{subject}</p>
                    </button>
                ))}
            </div>
        ) : (
            <p className="text-gray-400 text-center py-8">Nessuna materia creata. Aggiungine una per iniziare!</p>
        )}
    </div>
);

export const DashboardView: React.FC<DashboardViewProps> = ({ data, subjects, onSubjectAdd, onSubjectDelete, onSubjectRename, onNavigate, onCompleteTask, isTutorSyncing, dataVersion }) => {
    const { todaysEvents, upcomingExams } = data;
    const [isManageModalOpen, setIsManageModalOpen] = useState(false);

    const todayDateFormatted = new Date().toLocaleDateString('it-IT', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <div className="w-full max-w-5xl mx-auto">
            <header className="mb-8 text-center">
                <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Dashboard Generale</h1>
                <p className="text-gray-400 mt-2 text-md">{todayDateFormatted}</p>
            </header>
            
            <div className="space-y-6">
                <TodaysScheduleCard todaysEvents={todaysEvents} />

                <DailyTasksCard 
                    subjects={subjects}
                    onCompleteTask={onCompleteTask}
                    isTutorSyncing={isTutorSyncing}
                    dataVersion={dataVersion}
                />
                
                <UpcomingExamsCard upcomingExams={upcomingExams} />

                <StudySubjectsCard
                    subjects={subjects}
                    onNavigate={onNavigate}
                    onManageClick={() => setIsManageModalOpen(true)}
                />
            </div>
            
            <ManageSubjectsModal
                isOpen={isManageModalOpen}
                onClose={() => setIsManageModalOpen(false)}
                subjects={subjects}
                onSubjectAdd={onSubjectAdd}
                onSubjectDelete={onSubjectDelete}
                onSubjectRename={onSubjectRename}
            />
        </div>
    );
};