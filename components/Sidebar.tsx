import React from 'react';
import { Logo } from './Logo';

// Icons defined as stateless functional components for clarity and reusability
const IconDashboard = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
);

const IconDatabase = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
    </svg>
);

const IconDetails = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const IconNotes = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
);

const IconAppunti = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

const IconExercises = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);

const IconChat = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
);

const IconDiary = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 2v4l-4-2-4 2V2" />
    </svg>
);

const IconTest = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
);

const IconCalendar = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

const IconSettings = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const IconChevronLeft = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
);

const IconChevronRight = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
);

interface SidebarProps {
    isOpen: boolean;
    onToggle: () => void;
    subjects: string[];
    selectedSubject: string;
    onSubjectChange: (subject: string) => void;
    activeView: string;
    onViewChange: (view: string) => void;
    t: (key: string) => string;
}

const menuItems = [
    { id: 'dashboard', icon: <IconDashboard />, key: 'sidebar.dashboard', subjectIndependent: true },
    { id: 'calendario', icon: <IconCalendar />, key: 'sidebar.calendario', subjectIndependent: true },
    { id: 'details', icon: <IconDetails />, key: 'sidebar.details' },
    { id: 'dispense', icon: <IconNotes />, key: 'sidebar.dispense' },
    { id: 'appunti', icon: <IconAppunti />, key: 'sidebar.appunti' },
    { id: 'esercitazioni', icon: <IconExercises />, key: 'sidebar.esercitazioni' },
    { id: 'chat', icon: <IconChat />, key: 'sidebar.chat' },
    { id: 'lessonDiary', icon: <IconDiary />, key: 'sidebar.lessonDiary' },
    { id: 'simulations', icon: <IconTest />, key: 'sidebar.simulations' },
    { id: 'impostazioni', icon: <IconSettings />, key: 'sidebar.impostazioni', subjectIndependent: true },
    { id: 'databaseApp', icon: <IconDatabase />, key: 'sidebar.databaseApp', subjectIndependent: true },
];


export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle, subjects, selectedSubject, onSubjectChange, activeView, onViewChange, t }) => {
    return (
        <aside className={`fixed top-0 left-0 h-screen bg-gray-800 shadow-xl text-gray-300 flex flex-col transition-all duration-300 ease-in-out z-30 ${isOpen ? 'w-64' : 'w-20'}`}>
            <div className="flex items-center justify-between p-2 border-b border-gray-700" style={{height: '65px'}}>
                {isOpen && (
                    <div className="flex items-center gap-2 pl-2">
                        <Logo className="h-8 w-8 text-indigo-400"/>
                        <span className="text-xl font-bold text-white whitespace-nowrap">UniTutorAI</span>
                    </div>
                )}
                 <button 
                    onClick={onToggle} 
                    className="p-2 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500"
                    aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
                >
                    {isOpen ? <IconChevronLeft /> : <IconChevronRight />}
                 </button>
            </div>
            
            <nav className="flex-1 mt-4 overflow-y-auto">
                 <div className="px-2">
                     {isOpen && (
                        <div className="mb-6 px-2">
                            <label htmlFor="subject-select" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                {t('sidebar.selectedSubject')}
                            </label>
                            <select
                                id="subject-select"
                                value={selectedSubject}
                                onChange={(e) => onSubjectChange(e.target.value)}
                                className="w-full bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 disabled:bg-gray-800 disabled:cursor-not-allowed"
                                disabled={subjects.length === 0}
                            >
                                {subjects.map(subject => (
                                    <option key={subject} value={subject}>{subject}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <ul>
                        {menuItems.map((item) => {
                            const text = t(item.key);
                            return (
                            <li key={item.id}>
                                <button
                                    onClick={() => onViewChange(item.id)}
                                    disabled={!item.subjectIndependent && subjects.length === 0}
                                    className={`w-full flex items-center p-3 my-1 rounded-lg transition-colors duration-200 ${!isOpen ? 'justify-center' : ''} ${
                                        activeView === item.id 
                                        ? 'bg-indigo-600 text-white' 
                                        : 'hover:bg-gray-700 hover:text-white'
                                    } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent`} 
                                    title={isOpen ? undefined : text}
                                >
                                    {item.icon}
                                    {isOpen && <span className="ml-4 font-medium whitespace-nowrap">{text}</span>}
                                </button>
                            </li>
                        )})}
                    </ul>
                 </div>
            </nav>
        </aside>
    );
};
