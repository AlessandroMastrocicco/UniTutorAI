import React, { useState, useEffect, useMemo } from 'react';
import type { SubjectDetails, CalendarEvent, CalendarEventType } from '../types';

interface CalendarioViewProps {
    subjects: string[];
    allSubjectsData: Record<string, SubjectDetails>;
    onAddEvent: (subject: string, event: CalendarEvent) => void;
}

const timeToMinutes = (time: string): number => {
    if (!time || !time.includes(':')) return 0;
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
};

const getStartOfWeek = (date: Date): Date => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    return new Date(d.setDate(diff));
};

const formatDateRange = (startDate: Date): string => {
    const start = new Date(startDate);
    const end = new Date(startDate);
    end.setDate(start.getDate() + 6);

    const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric' };
    
    const startStr = start.toLocaleDateString('it-IT', options);
    const endStr = end.toLocaleDateString('it-IT', options);

    if (start.getFullYear() !== end.getFullYear()) {
         return `${start.toLocaleDateString('it-IT', {...options, year: 'numeric'})} - ${end.toLocaleDateString('it-IT', {...options, year: 'numeric'})}`;
    }
    
    const year = start.getFullYear();
    return `${startStr} - ${endStr}, ${year}`;
};


const START_HOUR = 8;
const END_HOUR = 20;
const daysOfWeek = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
const eventTypes: CalendarEventType[] = ['Studio', 'Altro', 'Ricevimento'];
const timeSlots = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => `${String(i + START_HOUR).padStart(2, '0')}:00`);

const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" /></svg>;
const ChevronLeftIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>;
const ChevronRightIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>;


const subjectColors = [
  '#4f46e5', // indigo-600
  '#db2777', // pink-600
  '#16a34a', // green-600
  '#ca8a04', // yellow-600
  '#dc2626', // red-600
  '#0891b2', // cyan-600
  '#ea580c', // orange-600
  '#6d28d9', // violet-700
];

const getSubjectColor = (subjectName: string, subjects: string[]) => {
    const index = subjects.indexOf(subjectName);
    if (index === -1) return '#6b7280'; // gray-500
    return subjectColors[index % subjectColors.length];
};

const NewEventModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (subject: string, event: Omit<CalendarEvent, 'id'>) => void;
    subjects: string[];
}> = ({ isOpen, onClose, onSave, subjects }) => {
    const getTodayDateString = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const [event, setEvent] = useState({
        subject: subjects[0] || '',
        type: 'Studio' as CalendarEventType,
        title: '',
        date: getTodayDateString(),
        startTime: '09:00',
        endTime: '10:00'
    });
    const [repeatWeekly, setRepeatWeekly] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (isOpen) {
            setEvent({
                subject: subjects[0] || '',
                type: 'Studio' as CalendarEventType,
                title: '',
                date: getTodayDateString(),
                startTime: '09:00',
                endTime: '10:00'
            });
            setRepeatWeekly(false);
            setErrors({});
        }
    }, [isOpen, subjects]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setEvent(prev => ({ ...prev, [name]: value }));
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!event.title.trim()) newErrors.title = "La descrizione è obbligatoria.";
        if (!event.date) newErrors.date = "La data è obbligatoria.";
        if (timeToMinutes(event.startTime) >= timeToMinutes(event.endTime)) {
            newErrors.endTime = "L'orario di fine deve essere dopo l'orario di inizio.";
        }
        if (!event.subject) newErrors.subject = "È necessario selezionare una materia.";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    const handleSave = () => {
        if (validate()) {
            const localDate = new Date(event.date + 'T00:00:00');
            const dayIndex = localDate.getDay(); // Sunday - 0, Monday - 1, ...
            const dayName = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'][dayIndex];

            const eventToSave: Omit<CalendarEvent, 'id'> = {
                type: event.type,
                title: event.title,
                day: dayName,
                startTime: event.startTime,
                endTime: event.endTime,
            };

            if (!repeatWeekly) {
                eventToSave.date = event.date; // The full YYYY-MM-DD date
            }

            onSave(event.subject, eventToSave);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-gray-700">
                    <h3 className="text-xl font-bold text-white">Crea Nuovo Evento</h3>
                </div>
                <div className="p-6 space-y-4">
                     <div>
                        <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-1">Materia</label>
                        <select name="subject" id="subject" value={event.subject} onChange={handleInputChange} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5">
                            {subjects.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                        </select>
                        {errors.subject && <p className="text-red-400 text-xs mt-1">{errors.subject}</p>}
                    </div>
                    <div>
                        <label htmlFor="type" className="block text-sm font-medium text-gray-300 mb-1">Tipo Evento</label>
                        <select name="type" id="type" value={event.type} onChange={handleInputChange} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5">
                            {eventTypes.map(type => <option key={type} value={type}>{type}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">Descrizione</label>
                        <input type="text" name="title" id="title" value={event.title} onChange={handleInputChange} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5" />
                        {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title}</p>}
                    </div>
                    <div>
                        <label htmlFor="date" className="block text-sm font-medium text-gray-300 mb-1">Giorno</label>
                        <input type="date" name="date" id="date" value={event.date} onChange={handleInputChange} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5" />
                        {errors.date && <p className="text-red-400 text-xs mt-1">{errors.date}</p>}
                    </div>
                    <div className="flex items-center">
                        <input type="checkbox" id="repeatWeekly" checked={repeatWeekly} onChange={e => setRepeatWeekly(e.target.checked)} className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-indigo-600 focus:ring-indigo-500" />
                        <label htmlFor="repeatWeekly" className="ml-2 block text-sm text-gray-300">Ripeti ogni settimana</label>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="startTime" className="block text-sm font-medium text-gray-300 mb-1">Inizio</label>
                            <input type="time" name="startTime" id="startTime" value={event.startTime} onChange={handleInputChange} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5" />
                        </div>
                         <div>
                            <label htmlFor="endTime" className="block text-sm font-medium text-gray-300 mb-1">Fine</label>
                            <input type="time" name="endTime" id="endTime" value={event.endTime} onChange={handleInputChange} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5" />
                            {errors.endTime && <p className="text-red-400 text-xs mt-1">{errors.endTime}</p>}
                        </div>
                    </div>
                </div>
                <div className="bg-gray-900/50 px-6 py-4 flex justify-end gap-4 rounded-b-2xl">
                    <button onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">Annulla</button>
                    <button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg">Salva Evento</button>
                </div>
            </div>
        </div>
    );
};

const getNowInRome = () => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('it-IT', {
        timeZone: 'Europe/Rome',
        year: 'numeric', month: 'numeric', day: 'numeric',
        hour: 'numeric', minute: 'numeric', weekday: 'long', hour12: false
    });
    const parts = formatter.formatToParts(now);
    const p = (type: Intl.DateTimeFormatPartTypes) => parts.find(pt => pt.type === type)?.value || '';
    return {
        year: parseInt(p('year')),
        month: parseInt(p('month')),
        day: parseInt(p('day')),
        hour: parseInt(p('hour')),
        minute: parseInt(p('minute')),
        weekday: p('weekday').charAt(0).toUpperCase() + p('weekday').slice(1),
    };
};

export const CalendarioView: React.FC<CalendarioViewProps> = ({ subjects, allSubjectsData, onAddEvent }) => {
    const [nowInRome, setNowInRome] = useState(getNowInRome);
    const [currentDate, setCurrentDate] = useState(() => new Date(nowInRome.year, nowInRome.month - 1, nowInRome.day));
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [filteredSubjects, setFilteredSubjects] = useState<Set<string>>(new Set(subjects));

    useEffect(() => {
        const timer = setInterval(() => setNowInRome(getNowInRome()), 60000); // Update every minute
        return () => clearInterval(timer);
    }, []);

    const weekStart = useMemo(() => getStartOfWeek(currentDate), [currentDate]);

    const weekDates = useMemo(() => {
        return Array.from({ length: 7 }, (_, i) => {
            const date = new Date(weekStart);
            date.setDate(weekStart.getDate() + i);
            return date;
        });
    }, [weekStart]);

    const isCurrentWeek = useMemo(() => {
        const todayDate = new Date(nowInRome.year, nowInRome.month - 1, nowInRome.day);
        const todayStartOfWeek = getStartOfWeek(todayDate);
        return weekStart.getTime() === todayStartOfWeek.getTime();
    }, [weekStart, nowInRome]);

    const currentTimePosition = useMemo(() => {
        if (!isCurrentWeek) return null;

        const { hour: currentHour, minute: currentMinute, weekday: currentDayName } = nowInRome;
        const dayIndex = daysOfWeek.indexOf(currentDayName);
        
        const minutesFromStart = (currentHour * 60 + currentMinute) - (START_HOUR * 60);
        const totalMinutesInView = (END_HOUR - START_HOUR) * 60;
        
        if (dayIndex > -1 && minutesFromStart >= 0 && minutesFromStart <= totalMinutesInView) {
            return {
                top: (minutesFromStart / totalMinutesInView) * 100,
                dayIndex: dayIndex,
            };
        }
        
        return null;
    }, [isCurrentWeek, nowInRome]);

    useEffect(() => {
        setFilteredSubjects(new Set(subjects));
    }, [subjects]);

    const handleFilterToggle = (subject: string) => {
        setFilteredSubjects(prev => {
            const newSet = new Set(prev);
            if (newSet.has(subject)) {
                newSet.delete(subject);
            } else {
                newSet.add(subject);
            }
            return newSet;
        });
    };

    const allEvents = useMemo(() => {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        
        const eventsList: Array<{
            id: string;
            title: string;
            type: CalendarEventType;
            day: string;
            startTime: string;
            endTime: string;
            subjectName: string;
            description?: string;
        }> = [];

        for (const subjectName of filteredSubjects) {
            const details = allSubjectsData[subjectName];
            if (!details) continue;

            // Recurring lessons
            (details.schedule.lessons || []).forEach(l => {
                eventsList.push({
                    id: `${subjectName}-lesson-${l.id}`,
                    title: subjectName,
                    type: 'Lezione',
                    day: l.day,
                    startTime: l.startTime,
                    endTime: l.endTime,
                    subjectName: subjectName,
                    description: l.classroom,
                });
            });
            // Custom calendar events
            (details.calendarEvents || []).forEach(e => {
                if (e.date) { // one-time event
                    const eventDate = new Date(e.date + "T00:00:00");
                    if (eventDate >= weekStart && eventDate <= weekEnd) {
                        eventsList.push({ ...e, id: `${subjectName}-event-${e.id}`, subjectName });
                    }
                } else { // recurring event
                    eventsList.push({ ...e, id: `${subjectName}-event-${e.id}`, subjectName });
                }
            });
            // Exams
            (details.examDates || []).forEach(exam => {
                const [d, m, y] = exam.date.split('/');
                const examDate = new Date(`${y}-${m}-${d}T00:00:00`);

                if (examDate >= weekStart && examDate <= weekEnd) {
                    const dayIndex = examDate.getDay();
                    const dayName = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'][dayIndex];
                    
                    eventsList.push({
                        id: `${subjectName}-exam-${exam.id}`,
                        title: `Esame di ${subjectName}`,
                        type: 'Esame',
                        day: dayName,
                        startTime: exam.time || '09:00',
                        endTime: exam.time ? `${String(parseInt(exam.time.split(':')[0]) + 2).padStart(2, '0')}:${exam.time.split(':')[1]}` : '11:00', // Assume 2hr duration
                        subjectName: subjectName,
                        description: exam.classroom,
                    });
                }
            });
        }
        return eventsList;
    }, [allSubjectsData, filteredSubjects, weekStart]);

    const getGridPosition = (day: string, startTime: string, endTime: string) => {
        const dayIndex = daysOfWeek.indexOf(day);
        if (dayIndex === -1) return {};

        const totalMinutes = (END_HOUR - START_HOUR) * 60;
        const startMinutes = timeToMinutes(startTime) - (START_HOUR * 60);
        const endMinutes = timeToMinutes(endTime) - (START_HOUR * 60);

        const top = (startMinutes / totalMinutes) * 100;
        const height = ((endMinutes - startMinutes) / totalMinutes) * 100;
        
        return {
            gridColumnStart: dayIndex + 2,
            top: `${top}%`,
            height: `${height}%`,
        };
    };

    const handleSaveEvent = (subject: string, event: Omit<CalendarEvent, 'id'>) => {
        const newEvent: CalendarEvent = {
            ...event,
            id: crypto.randomUUID(),
        };
        onAddEvent(subject, newEvent);
    }

    const goToPreviousWeek = () => setCurrentDate(prev => new Date(prev.setDate(prev.getDate() - 7)));
    const goToNextWeek = () => setCurrentDate(prev => new Date(prev.setDate(prev.getDate() + 7)));
    const goToToday = () => setCurrentDate(new Date(nowInRome.year, nowInRome.month - 1, nowInRome.day));

    return (
        <div className="w-full max-w-7xl mx-auto flex flex-col h-[calc(100vh-100px)]">
            <header className="w-full mb-4 flex-shrink-0 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Calendario Settimanale</h1>
                    <p className="text-gray-400 mt-2 text-md">Visione d'insieme di tutti i tuoi impegni universitari.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={goToPreviousWeek} className="p-2 rounded-md hover:bg-gray-700"><ChevronLeftIcon /></button>
                    <button onClick={goToToday} className="font-semibold py-2 px-4 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm">Oggi</button>
                    <button onClick={goToNextWeek} className="p-2 rounded-md hover:bg-gray-700"><ChevronRightIcon /></button>
                </div>
                 <button 
                    onClick={() => setIsEventModalOpen(true)}
                    className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-gray-600"
                    disabled={subjects.length === 0}
                >
                    <PlusIcon />
                    Crea Evento
                </button>
            </header>

            <div className="flex items-center justify-between mb-4 p-4 bg-gray-900/50 rounded-lg">
                <h2 className="text-lg font-semibold">{formatDateRange(weekStart)}</h2>
                {subjects.length > 0 && (
                    <div className="flex flex-wrap gap-2 items-center">
                        <h3 className="text-sm font-semibold text-gray-400">Filtri:</h3>
                        {subjects.map(subject => (
                            <button
                                key={subject}
                                onClick={() => handleFilterToggle(subject)}
                                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors flex items-center gap-2 ${
                                    filteredSubjects.has(subject) ? 'opacity-100' : 'opacity-50 hover:opacity-75'
                                }`}
                                style={{ backgroundColor: getSubjectColor(subject, subjects) }}
                            >
                                {subject}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex-grow bg-gray-800 rounded-2xl shadow-2xl p-4 overflow-hidden flex flex-col">
                <div className="grid grid-cols-[auto_repeat(7,1fr)] flex-shrink-0">
                     {/* Empty corner */}
                    <div className="w-14"></div>
                    {weekDates.map((date, index) => {
                        const dayName = daysOfWeek[index];
                        const dayOfMonth = date.getDate();
                        const isToday = date.getFullYear() === nowInRome.year && date.getMonth() === nowInRome.month - 1 && date.getDate() === nowInRome.day;

                        return (
                            <div key={dayName} className="text-center pb-2">
                                <p className="text-sm text-gray-400 font-medium">{dayName}</p>
                                <div className={`mt-1 flex items-center justify-center`}>
                                    <span className={`text-2xl font-bold w-10 h-10 flex items-center justify-center rounded-full ${isToday ? 'bg-indigo-600 text-white' : 'text-white'}`}>
                                        {dayOfMonth}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="flex-grow overflow-auto relative">
                    <div className="grid grid-cols-[auto_repeat(7,1fr)] h-full min-h-[1200px]">
                        {/* Time Column */}
                        <div className="relative">
                            {timeSlots.map((time) => (
                                <div key={time} className="h-24 flex justify-end">
                                    <span className="text-xs text-gray-400 -translate-y-1/2 pr-2">{time}</span>
                                </div>
                            ))}
                        </div>

                        {/* Grid and Events */}
                        {daysOfWeek.map((day, dayIndex) => (
                             <div key={day} className="relative border-l border-gray-700">
                                {timeSlots.slice(0,-1).map((_, hourIndex) => (
                                    <div key={hourIndex} className="h-24 border-t border-gray-700"></div>
                                ))}

                                {allEvents.filter(e => e.day === day).map(event => (
                                    <div key={event.id} style={{ ...getGridPosition(event.day, event.startTime, event.endTime), borderColor: getSubjectColor(event.subjectName, subjects) }} className="absolute w-full px-1 z-10">
                                        <div className={`bg-gray-900/80 hover:bg-gray-900 border-l-4 rounded-lg p-2 text-white flex flex-col justify-center overflow-hidden h-full`}>
                                            <p className="font-bold text-sm truncate">{event.title}</p>
                                            {event.type !== 'Lezione' && <p className="text-xs font-semibold text-gray-300 truncate" style={{color: getSubjectColor(event.subjectName, subjects)}}>{event.subjectName}</p>}
                                            <p className="text-xs truncate">{event.startTime} - {event.endTime}</p>
                                            <p className="text-xs text-gray-200/80 truncate">{event.description}</p>
                                        </div>
                                    </div>
                                ))}

                                {isCurrentWeek && currentTimePosition?.dayIndex === dayIndex && (
                                     <div className="absolute w-full border-t-2 border-red-500 z-20 pointer-events-none" style={{ top: `${currentTimePosition.top}%` }}>
                                        <div className="absolute -left-1.5 -top-1.5 h-3 w-3 bg-red-500 rounded-full"></div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <NewEventModal
                isOpen={isEventModalOpen}
                onClose={() => setIsEventModalOpen(false)}
                onSave={handleSaveEvent}
                subjects={subjects}
            />
        </div>
    );
};