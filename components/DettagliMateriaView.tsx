import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { SubjectDetails, ExamDate, LessonSlot, ProfessorDetails } from '../types';
import { Logo } from './Logo';

// --- Icons ---
const IconBook = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>;
const IconClock = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const IconCalendar = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const IconChart = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
const IconStar = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.539 1.118l-3.975-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.539-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>;
const IconPencil = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>;
const IconBuilding = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2 0h2v2h-2V9zm2-4h-2v2h2V5z" clipRule="evenodd" /></svg>;
const IconClipboard = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>;
const IconProfessor = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;

// --- Helper Functions and Hooks ---

const ddmmyyyyToISO = (dateString: string): string => {
  if (!dateString || !/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) return '';
  const [day, month, year] = dateString.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

const isoToDDMMYYYY = (isoString: string): string => {
  if (!isoString || !/^\d{4}-\d{2}-\d{2}$/.test(isoString)) return '';
  const [year, month, day] = isoString.split('-');
  return `${day}/${month}/${year}`;
};

const parseDateTime = (dateStr: string, timeStr?: string): Date | null => {
    const dateParts = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!dateParts) return null;

    const day = parseInt(dateParts[1], 10);
    const month = parseInt(dateParts[2], 10) - 1; // Month is 0-indexed
    const year = parseInt(dateParts[3], 10);

    let hour = 0;
    let minute = 0;

    if (timeStr && timeStr.trim() !== '') {
        const timeParts = timeStr.match(/^(?:2[0-3]|[01]?[0-9]):[0-5][0-9]$/);
        if (timeParts) {
            const [h, m] = timeStr.split(':');
            hour = parseInt(h, 10);
            minute = parseInt(m, 10);
        } else {
            return null; // Time is present but format is wrong
        }
    }
    
    const date = new Date(year, month, day, hour, minute);
    
    if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
        return null;
    }
    
    return date;
};

// Custom hook for the countdown
const useCountdown = (targetDate: Date | null) => {
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    useEffect(() => {
        if (!targetDate) {
            setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
            return;
        };

        const updateCountdown = () => {
            const now = new Date();
            const difference = targetDate.getTime() - now.getTime();

            if (difference > 0) {
                setTimeLeft({
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60),
                });
            } else {
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
            }
        }

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);

        return () => clearInterval(interval);
    }, [targetDate]);

    return timeLeft;
};

// --- Main Component ---
interface DettagliMateriaViewProps {
    selectedSubject: string;
    details: SubjectDetails;
    onSave: (subject: string, details: SubjectDetails) => void;
    t: (key: string) => string;
}

const weekDays = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
const examTypes = ['Scritto', 'Orale', 'Scritto + Orale', 'Progetto', 'Laboratorio'];


export const DettagliMateriaView: React.FC<DettagliMateriaViewProps> = ({ selectedSubject, details, onSave, t }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDetails, setEditingDetails] = useState<SubjectDetails | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const nextExamDate = useMemo(() => {
        if (!details.examDates || details.examDates.length === 0) return null;
        const now = new Date();
        const upcomingExams = details.examDates
            .map(exam => ({ ...exam, dateObj: parseDateTime(exam.date, exam.time) }))
            .filter(exam => exam.dateObj && exam.dateObj.getTime() > now.getTime())
            .sort((a, b) => a.dateObj!.getTime() - b.dateObj!.getTime());
        return upcomingExams.length > 0 ? upcomingExams[0].dateObj : null;
    }, [details.examDates]);
    
    const countdown = useCountdown(nextExamDate);

    const validate = useCallback(() => {
        if (!editingDetails) return false;
        const newErrors: Record<string, string> = {};
        
        // CFU
        if (editingDetails.cfu < 0) newErrors.cfu = "I CFU non possono essere negativi.";

        // Exam Dates
        editingDetails.examDates.forEach((exam) => {
             if (!exam.date) {
                newErrors[`examDate_${exam.id}`] = "La data è obbligatoria.";
            }
            // No validation for exam.time needed, as input type="time" handles format.
        });

        // Lesson Times
        editingDetails.schedule.lessons.forEach(lesson => {
            // No validation for time format needed.
            if (lesson.startTime && lesson.endTime && lesson.startTime >= lesson.endTime) {
                 newErrors[`lessonEnd_${lesson.id}`] = "L'orario di fine deve essere dopo l'inizio.";
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [editingDetails]);
    
    useEffect(() => {
        if (isModalOpen) {
            validate();
        }
    }, [editingDetails, isModalOpen, validate]);

    const handleOpenModal = () => {
        setEditingDetails(details ? JSON.parse(JSON.stringify(details)) : null); // Deep copy
        setErrors({});
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingDetails(null);
    };

    const handleSave = () => {
        if (validate() && editingDetails) {
            onSave(selectedSubject, editingDetails);
            handleCloseModal();
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (editingDetails) {
            if (name === "cfu") {
                setEditingDetails({ ...editingDetails, cfu: parseInt(value, 10) || 0 });
            } else if (name === "schedule.period") {
                setEditingDetails({ ...editingDetails, schedule: { ...editingDetails.schedule, period: value }});
            } else {
                 setEditingDetails({ ...editingDetails, [name]: value });
            }
        }
    };
    
    const handleProfessorChange = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (editingDetails) {
            const field = name as keyof Omit<ProfessorDetails, 'id'>;
            const updatedProfessors = editingDetails.professors?.map(p => 
                p.id === id ? { ...p, [field]: value } : p
            ) || [];
            setEditingDetails({ ...editingDetails, professors: updatedProfessors });
        }
    };

    const addProfessor = () => {
        if (!editingDetails) return;
        const newProfessor: ProfessorDetails = { id: crypto.randomUUID(), name: '', email: '', officeHours: '' };
        const newProfessors = [...(editingDetails.professors || []), newProfessor];
        setEditingDetails({ ...editingDetails, professors: newProfessors });
    };

    const removeProfessor = (idToRemove: string) => {
        if (!editingDetails) return;
        const newProfessors = (editingDetails.professors || []).filter(p => p.id !== idToRemove);
        const newLessons = editingDetails.schedule.lessons.map(lesson => {
            if (lesson.professorId === idToRemove) {
                return { ...lesson, professorId: undefined };
            }
            return lesson;
        });
        setEditingDetails({ 
            ...editingDetails, 
            professors: newProfessors,
            schedule: { ...editingDetails.schedule, lessons: newLessons }
        });
    };

    const handleLessonChange = (id: string, field: keyof Omit<LessonSlot, 'id'>, value: string) => {
        if (!editingDetails) return;
        const newLessons = editingDetails.schedule.lessons.map(lesson => 
            lesson.id === id ? { ...lesson, [field]: value } : lesson
        );
        setEditingDetails({ ...editingDetails, schedule: { ...editingDetails.schedule, lessons: newLessons } });
    };

    const addLesson = () => {
        if (!editingDetails) return;
        const newLesson: LessonSlot = { id: crypto.randomUUID(), day: 'Lunedì', startTime: '', endTime: '', classroom: '' };
        const newLessons = [...editingDetails.schedule.lessons, newLesson];
        setEditingDetails({ ...editingDetails, schedule: { ...editingDetails.schedule, lessons: newLessons }});
    };

    const removeLesson = (id: string) => {
        if (!editingDetails) return;
        const newLessons = editingDetails.schedule.lessons.filter(l => l.id !== id);
        setEditingDetails({ ...editingDetails, schedule: { ...editingDetails.schedule, lessons: newLessons } });
    };

    const handleExamDateChange = (id: string, field: keyof Omit<ExamDate, 'id'>, value: string) => {
        if (editingDetails) {
            const updatedExamDates = editingDetails.examDates.map(exam => 
                exam.id === id ? { ...exam, [field]: value } : exam
            );
            setEditingDetails({ ...editingDetails, examDates: updatedExamDates });
        }
    };
    
    const addExamDate = () => {
        if (editingDetails) {
            const newExamDates = [...editingDetails.examDates, { id: crypto.randomUUID(), date: '', time: '', classroom: '', type: 'Scritto' }];
            setEditingDetails({ ...editingDetails, examDates: newExamDates });
        }
    };

    const removeExamDate = (id: string) => {
        if (editingDetails) {
            const newExamDates = editingDetails.examDates.filter(exam => exam.id !== id);
            setEditingDetails({ ...editingDetails, examDates: newExamDates });
        }
    };
    
    if (!details) {
        return (
            <div className="w-full text-center">
                <h1 className="text-2xl font-bold text-white">{t('details.loading')}</h1>
                <p className="text-gray-400">{t('details.notFound')}</p>
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col items-center">
            <header className="w-full max-w-5xl mx-auto mb-8 text-center">
                <div className="flex justify-center items-center gap-4 mb-2">
                    <Logo className="h-12 w-12 text-indigo-400"/>
                    <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                        {t('details.welcome')}
                    </h1>
                </div>
                <p className="text-gray-400 mt-2 text-lg">
                    {t('details.studying')} <span className="font-bold text-indigo-400">{selectedSubject}</span>.
                </p>
            </header>
            
            <div className="w-full max-w-5xl mx-auto">
                 <div className="flex justify-between items-center mb-4 px-2">
                    <h2 className="text-2xl font-bold text-white">{t('details.summary')}</h2>
                    <button 
                        onClick={handleOpenModal}
                        className="flex items-center bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 text-sm"
                        aria-label="Modifica dati materia"
                    >
                        <IconPencil />
                        <span className="ml-2">{t('details.edit')}</span>
                    </button>
                 </div>
                 
                 {/* Main Content Sections */}
                 <div className="space-y-6">
                    {/* General & Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-gray-800 rounded-xl p-5 flex items-center space-x-4"><div className="bg-gray-900 p-3 rounded-full"><IconBook /></div><div><p className="text-sm font-medium text-gray-400">{t('details.cfu')}</p><p className="text-xl font-bold text-white">{details.cfu}</p></div></div>
                        <div className="bg-gray-800 rounded-xl p-5 flex items-center space-x-4"><div className="bg-gray-900 p-3 rounded-full"><IconChart /></div><div><p className="text-sm font-medium text-gray-400">{t('details.simulations')}</p><p className="text-xl font-bold text-white">{details.simulations}</p></div></div>
                        <div className="bg-gray-800 rounded-xl p-5 flex items-center space-x-4"><div className="bg-gray-900 p-3 rounded-full"><IconStar /></div><div><p className="text-sm font-medium text-gray-400">{t('details.avgGrade')}</p><p className="text-xl font-bold text-white">{details.averageGrade}</p></div></div>
                    </div>

                    {/* Professor Info */}
                    <div className="bg-gray-800 rounded-xl p-5">
                        <h3 className="text-lg font-bold text-white mb-3 flex items-center"><IconProfessor /> <span className="ml-2">{t('details.professors')}</span></h3>
                        {details.professors && details.professors.length > 0 ? (
                            <div className="space-y-4">
                                {details.professors.map((prof, index) => (
                                    <div key={prof.id} className={`space-y-2 text-gray-300 ${index > 0 ? 'border-t border-gray-700 pt-4 mt-4' : ''}`}>
                                        {prof.name && <p><span className="font-semibold text-gray-400">{t('details.profName')}:</span> {prof.name}</p>}
                                        {prof.email && <p><span className="font-semibold text-gray-400">{t('details.profEmail')}:</span> <a href={`mailto:${prof.email}`} className="text-indigo-400 hover:underline">{prof.email}</a></p>}
                                        {prof.officeHours && <p><span className="font-semibold text-gray-400">{t('details.profOffice')}:</span> {prof.officeHours}</p>}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-400">{t('details.noProfessor')}</p>
                        )}
                    </div>

                    {/* Schedule */}
                    <div className="bg-gray-800 rounded-xl p-5">
                         <h3 className="text-lg font-bold text-white mb-3 flex items-center"><IconClock /> <span className="ml-2">{t('details.schedule')}</span></h3>
                         <div className="space-y-3 text-gray-300">
                            <p><span className="font-semibold text-gray-400">{t('details.period')}:</span> {details.schedule.period || t('details.notSet')}</p>
                            {details.schedule.lessons.length > 0 ? (
                                details.schedule.lessons.map(lesson => {
                                    const professor = details.professors?.find(p => p.id === lesson.professorId);
                                    return (
                                        <div key={lesson.id} className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 items-center bg-gray-900/40 p-3 rounded-md">
                                            <div>
                                                <p><span className="font-semibold text-gray-400">{lesson.day}:</span> {lesson.startTime} - {lesson.endTime}</p>
                                                <p><span className="font-semibold text-gray-400">{t('details.classroom')}:</span> {lesson.classroom}</p>
                                            </div>
                                            {professor && (
                                                <p className="text-sm text-gray-300 mt-1 sm:mt-0 sm:text-right">
                                                    <span className="font-semibold text-gray-400">{t('details.prof')}:</span> {professor.name}
                                                </p>
                                            )}
                                        </div>
                                    )
                                })
                            ) : (<p className="text-gray-400">{t('details.noSchedule')}</p>)}
                         </div>
                    </div>

                     {/* Exam Dates */}
                     <div className="bg-gray-800 rounded-xl p-5">
                         <h3 className="text-lg font-bold text-white mb-3 flex items-center"><IconCalendar /> <span className="ml-2">{t('details.examDates')}</span></h3>
                         {nextExamDate && (
                            <div className="bg-indigo-900/50 border border-indigo-700 rounded-lg p-4 mb-4 text-center">
                                <p className="text-sm font-semibold text-indigo-300">{t('details.nextExamIn')}</p>
                                <div className="text-2xl font-bold text-white tracking-wide">
                                    {countdown.days}g {countdown.hours}h {countdown.minutes}m {countdown.seconds}s
                                </div>
                            </div>
                         )}
                         {details.examDates.length > 0 ? (
                             <ul className="divide-y divide-gray-700">
                                 {details.examDates.map((exam) => (
                                     <li key={exam.id} className="py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                                         <p className="font-bold text-white text-md mb-2 sm:mb-0">
                                            {exam.date}
                                            {exam.time && <span className="text-gray-400 font-normal ml-2">alle {exam.time}</span>}
                                         </p>
                                         <div className="flex items-center text-sm text-gray-300"><IconBuilding /> {exam.classroom}</div>
                                         <div className="flex items-center text-sm text-gray-300"><IconClipboard className="h-5 w-5 mr-2 text-gray-400" /> {exam.type}</div>
                                     </li>
                                 ))}
                             </ul>
                         ) : (
                             <p className="text-gray-400">{t('details.noExamDates')}</p>
                         )}
                     </div>

                    {/* Syllabus */}
                    <div className="bg-gray-800 rounded-xl p-5">
                        <h3 className="text-lg font-bold text-white mb-3 flex items-center"><IconClipboard /> <span className="ml-2">Programma del Corso</span></h3>
                        {details.syllabus && details.syllabus.trim() ? (
                            <div className="text-gray-300 whitespace-pre-wrap bg-gray-900/40 p-3 rounded-md max-h-48 overflow-y-auto">
                               {details.syllabus}
                            </div>
                        ) : (
                            <p className="text-gray-400">Nessun programma del corso inserito.</p>
                        )}
                    </div>
                 </div>
            </div>

            {/* Modal for Editing */}
            {isModalOpen && editingDetails && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4" onClick={handleCloseModal}>
                    <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="p-6 flex-shrink-0">
                            <h2 className="text-2xl font-bold text-white mb-4">Modifica Dettagli: {selectedSubject}</h2>
                        </div>
                        <div className="px-6 pb-6 overflow-y-auto">
                            <div className="space-y-4 text-gray-300">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">CFU</label>
                                    <input type="number" name="cfu" value={editingDetails.cfu} min="0" onChange={handleInputChange} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 focus:ring-indigo-500 focus:border-indigo-500" />
                                    {errors.cfu && <p className="text-red-400 text-xs mt-1">{errors.cfu}</p>}
                                </div>

                                <h3 className="text-lg font-semibold text-white border-t border-gray-700 pt-4 mt-4">Programma del Corso</h3>
                                <div>
                                    <label htmlFor="syllabus-input" className="block text-sm font-medium text-gray-400 mb-1">
                                        Programma (approssimativo)
                                    </label>
                                    <p className="text-xs text-gray-500 mb-2">
                                        Incolla qui il programma del corso. Sarà utile al Tutor AI per generare piani di studio più accurati.
                                    </p>
                                    <textarea
                                        id="syllabus-input"
                                        name="syllabus"
                                        rows={6}
                                        value={editingDetails.syllabus || ''}
                                        onChange={handleInputChange}
                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>

                                <h3 className="text-lg font-semibold text-white border-t border-gray-700 pt-4 mt-4">Dati Docenti</h3>
                                {(editingDetails.professors || []).map((prof, index) => (
                                    <div key={prof.id} className="bg-gray-900/50 p-3 rounded-lg space-y-3">
                                        <div className="flex justify-between items-center">
                                            <h4 className="font-semibold text-gray-300">Docente #{index + 1}</h4>
                                            <button onClick={() => removeProfessor(prof.id)} className="text-red-400 hover:text-red-300 text-sm font-semibold">Rimuovi</button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-400 mb-1">Nome Docente</label>
                                                <input type="text" name="name" value={prof.name} onChange={(e) => handleProfessorChange(prof.id, e)} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 focus:ring-indigo-500 focus:border-indigo-500" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-400 mb-1">Email Docente</label>
                                                <input type="email" name="email" value={prof.email} onChange={(e) => handleProfessorChange(prof.id, e)} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 focus:ring-indigo-500 focus:border-indigo-500" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-400 mb-1">Orario Ricevimento</label>
                                            <input type="text" name="officeHours" placeholder="Es. Lunedì 10:00 - 12:00" value={prof.officeHours} onChange={(e) => handleProfessorChange(prof.id, e)} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 focus:ring-indigo-500 focus:border-indigo-500" />
                                        </div>
                                    </div>
                                ))}
                                <button onClick={addProfessor} className="w-full bg-indigo-600/80 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg text-sm">+ Aggiungi Docente</button>

                                <h3 className="text-lg font-semibold text-white border-t border-gray-700 pt-4 mt-4">Orario Lezioni</h3>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Periodo Lezioni</label>
                                    <input type="text" name="schedule.period" value={editingDetails.schedule.period} onChange={handleInputChange} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2" />
                                </div>
                                {editingDetails.schedule.lessons.map((lesson) => (
                                    <div key={lesson.id} className="grid grid-cols-1 md:grid-cols-6 gap-2 items-start bg-gray-900/50 p-3 rounded-lg">
                                        <div className="md:col-span-1">
                                            <label className="text-xs text-gray-400">Giorno</label>
                                            <select value={lesson.day} onChange={(e) => handleLessonChange(lesson.id, 'day', e.target.value)} className="w-full bg-gray-700 border-gray-600 rounded p-2 text-sm">
                                                {weekDays.map(day => <option key={day} value={day}>{day}</option>)}
                                            </select>
                                        </div>
                                         <div className="md:col-span-1">
                                            <label className="text-xs text-gray-400">Inizio</label>
                                            <input type="time" value={lesson.startTime} onChange={(e) => handleLessonChange(lesson.id, 'startTime', e.target.value)} className="w-full bg-gray-700 border-gray-600 rounded p-2 text-sm" />
                                            {errors[`lessonStart_${lesson.id}`] && <p className="text-red-400 text-xs mt-1">{errors[`lessonStart_${lesson.id}`]}</p>}
                                        </div>
                                         <div className="md:col-span-1">
                                            <label className="text-xs text-gray-400">Fine</label>
                                            <input type="time" value={lesson.endTime} onChange={(e) => handleLessonChange(lesson.id, 'endTime', e.target.value)} className="w-full bg-gray-700 border-gray-600 rounded p-2 text-sm" />
                                            {errors[`lessonEnd_${lesson.id}`] && <p className="text-red-400 text-xs mt-1">{errors[`lessonEnd_${lesson.id}`]}</p>}
                                        </div>
                                         <div className="md:col-span-1">
                                            <label className="text-xs text-gray-400">Aula</label>
                                            <input type="text" placeholder="Aula" value={lesson.classroom} onChange={(e) => handleLessonChange(lesson.id, 'classroom', e.target.value)} className="w-full bg-gray-700 border-gray-600 rounded p-2 text-sm" />
                                        </div>
                                        <div className="md:col-span-1">
                                            <label className="text-xs text-gray-400">Docente</label>
                                            <select value={lesson.professorId || ''} onChange={(e) => handleLessonChange(lesson.id, 'professorId', e.target.value)} className="w-full bg-gray-700 border-gray-600 rounded p-2 text-sm">
                                                <option value="">Nessuno</option>
                                                {(editingDetails.professors || []).map(p => <option key={p.id} value={p.id}>{p.name || `Docente #${p.id.substring(0,4)}`}</option>)}
                                            </select>
                                        </div>
                                        <div className="md:col-span-1 flex items-end h-full">
                                            <button onClick={() => removeLesson(lesson.id)} className="w-full bg-red-600/80 hover:bg-red-700 text-white font-bold py-2 px-3 rounded-lg text-sm">Rimuovi</button>
                                        </div>
                                    </div>
                                ))}
                                 <button onClick={addLesson} className="w-full bg-indigo-600/80 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg text-sm">+ Aggiungi Orario Lezione</button>


                                <h3 className="text-lg font-semibold text-white border-t border-gray-700 pt-4 mt-4">Date Esami</h3>
                                {editingDetails.examDates.map((exam) => (
                                    <div key={exam.id} className="grid grid-cols-1 md:grid-cols-5 gap-2 items-start bg-gray-900/50 p-3 rounded-lg">
                                        <div className="md:col-span-1">
                                            <label className="text-xs text-gray-400">Data</label>
                                            <input 
                                                type="date" 
                                                value={ddmmyyyyToISO(exam.date)} 
                                                onChange={(e) => handleExamDateChange(exam.id, 'date', isoToDDMMYYYY(e.target.value))}
                                                className="w-full bg-gray-700 border-gray-600 rounded p-2 text-sm" />
                                            {errors[`examDate_${exam.id}`] && <p className="text-red-400 text-xs mt-1">{errors[`examDate_${exam.id}`]}</p>}
                                        </div>
                                        <div className="md:col-span-1">
                                            <label className="text-xs text-gray-400">Orario (opz.)</label>
                                            <input type="time" value={exam.time || ''} onChange={(e) => handleExamDateChange(exam.id, 'time', e.target.value)} className="w-full bg-gray-700 border-gray-600 rounded p-2 text-sm" />
                                            {errors[`examTime_${exam.id}`] && <p className="text-red-400 text-xs mt-1">{errors[`examTime_${exam.id}`]}</p>}
                                        </div>
                                        <div className="md:col-span-1">
                                            <label className="text-xs text-gray-400">Aula</label>
                                            <input type="text" placeholder="Aula" value={exam.classroom} onChange={(e) => handleExamDateChange(exam.id, 'classroom', e.target.value)} className="w-full bg-gray-700 border-gray-600 rounded p-2 text-sm" />
                                        </div>
                                        <div className="md:col-span-1">
                                             <label className="text-xs text-gray-400">Tipo</label>
                                            <select value={exam.type} onChange={(e) => handleExamDateChange(exam.id, 'type', e.target.value)} className="w-full bg-gray-700 border-gray-600 rounded p-2 text-sm">
                                                {examTypes.map(type => <option key={type} value={type}>{type}</option>)}
                                            </select>
                                        </div>
                                        <div className="md:col-span-1 flex items-end h-full">
                                            <button onClick={() => removeExamDate(exam.id)} className="w-full bg-red-600/80 hover:bg-red-700 text-white font-bold py-2 px-3 rounded-lg text-sm">Rimuovi</button>
                                        </div>
                                    </div>
                                ))}
                                <button onClick={addExamDate} className="w-full bg-indigo-600/80 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg text-sm">+ Aggiungi Data Esame</button>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="bg-gray-900/50 px-6 py-4 flex justify-end space-x-3 rounded-b-2xl flex-shrink-0">
                            <button onClick={handleCloseModal} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">Annulla</button>
                            <button onClick={handleSave} disabled={Object.keys(errors).length > 0} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-500 disabled:cursor-not-allowed">Salva Modifiche</button>
                        </div>
                    </div>
                </div>
            )}


            <footer className="w-full max-w-5xl mt-8 text-center text-gray-500 text-sm">
                <p>{t('details.footer')}</p>
            </footer>
        </div>
    );
};