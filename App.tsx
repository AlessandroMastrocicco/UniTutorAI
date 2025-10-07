import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { PDFDocumentProxy, PDFPageProxy, SubjectDetails, SavedDispensa, ChatMessage, Thumbnail, LessonStep, LessonDiary, SavedSimulation, SimulationQuestion, QuestionType, EsercizioTopic, GeneratedExercise, EsercizioInstance, Appunto, AppNotification, MacroTopic, EsercizioQuestionType, ContentVector, CalendarEvent, DashboardData, DashboardEvent, FocusDispensa, ExamStructure, LearnedExam, VersionInfo, ExamTraceAnalysis } from './types';
import { Sidebar } from './components/Sidebar';
import { DispenseView } from './components/DispenseView';
import { DettagliMateriaView } from './components/DettagliMateriaView';
import { Pagination } from './components/Pagination';
import { PdfViewer } from './components/PdfViewer';
import { ChatTutorAIView } from './components/ChatTutorAIView';
import { GlobalChat } from './components/GlobalChat';
import { DiarioLezioniView } from './components/DiarioLezioniView';
import { SimulazioniEsamiView } from './components/SimulazioniEsamiView';
import { EsercitazioniView } from './components/EsercitazioniView';
import { AppuntiView } from './components/AppuntiView';
import { Notifications } from './components/Notifications';
import { CalendarioView } from './components/CalendarioView';
import { DashboardView } from './components/DashboardView';
import { DatabaseAppView } from './components/DatabaseAppView';
import { ImpostazioniView } from './components/ImpostazioniView';
import { HelpTutorial } from './components/HelpTutorial';
// FIX: Corrected import of GoogleGenAI and related types.
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { db, type DbDispensa, type DbPdfFile, type DbThumbnail } from './db';
import { Logo } from './components/Logo';
import { translations } from './translations';

// TODO: Inserisci qui il tuo nome utente e il nome del repository GitHub
const GITHUB_REPO_PATH = 'AlessandroMastrocicco/UniTutorAI'; // Esempio: 'facebook/react'

const initialSubjectData: Record<string, SubjectDetails> = {};

const defaultNewSubjectDetails: SubjectDetails = {
    cfu: 0,
    schedule: { period: '', lessons: [] },
    examDates: [],
    calendarEvents: [],
    professors: [],
    simulations: 0,
    averageGrade: 'N/A',
    learnedExams: []
};

const parsePageRanges = (rangeStr: string, totalPages: number): number[] => {
    const pageNumbers = new Set<number>();
    if (!rangeStr) return [];

    const parts = rangeStr.split(',');
    for (const part of parts) {
        const trimmedPart = part.trim();
        if (trimmedPart.includes('-')) {
            const [start, end] = trimmedPart.split('-').map(s => parseInt(s.trim(), 10));
            if (!isNaN(start) && !isNaN(end) && start <= end) {
                for (let i = start; i <= end; i++) {
                    if (i > 0 && i <= totalPages) pageNumbers.add(i);
                }
            }
        } else {
            const pageNum = parseInt(trimmedPart, 10);
            if (!isNaN(pageNum) && pageNum > 0 && pageNum <= totalPages) {
                pageNumbers.add(pageNum);
            }
        }
    }
    return Array.from(pageNumbers).sort((a, b) => a - b);
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

// Text search utility for RAG
const findRelevantVectors = (query: string, allVectors: ContentVector[], topK: number = 3): ContentVector[] => {
    if (!query || allVectors.length === 0) {
        return [];
    }
    
    const italianStopWords = new Set(['a', 'ad', 'al', 'allo', 'ai', 'agli', 'alla', 'alle', 'con', 'col', 'coi', 'da', 'dal', 'dallo', 'dai', 'dagli', 'dalla', 'dalle', 'di', 'del', 'dello', 'dei', 'degli', 'della', 'delle', 'in', 'nel', 'nello', 'nei', 'negli', 'nella', 'nelle', 'su', 'sul', 'sullo', 'sui', 'sugli', 'sulla', 'sulle', 'per', 'tra', 'fra', 'e', 'o', 'ma', 'se', 'che', 'il', 'lo', 'i', 'gli', 'la', 'le', 'un', 'uno', 'una', 'ed', 'si', 'non', 'di', 'cosa', 'chi', 'dove', 'quando', 'perché', 'come']);
    const queryWords = query.toLowerCase().split(/\s+/).filter(word => !italianStopWords.has(word) && word.length > 2);

    const scoredVectors = allVectors.map(vector => {
        const vectorWords = new Set(vector.content.toLowerCase().split(/\s+/));
        let score = 0;
        for (const word of queryWords) {
            if (vectorWords.has(word)) {
                score++;
            }
        }
        return { vector, score };
    });

    scoredVectors.sort((a, b) => b.score - a.score);

    return scoredVectors.slice(0, topK).filter(item => item.score > 0).map(item => item.vector);
};

const WelcomeModal: React.FC<{ isOpen: boolean; onClose: () => void; t: (key: string) => string; }> = ({ isOpen, onClose, t }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-[101] p-4">
            <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>
                <div className="p-8 text-center">
                    <Logo className="h-16 w-16 text-indigo-400 mx-auto mb-4"/>
                    <h2 className="text-3xl font-bold text-white mb-4">{t('welcome.title')}</h2>
                    <p className="text-gray-300 my-4 leading-relaxed">
                        {t('welcome.description')}
                    </p>
                    <div className="bg-indigo-900/50 p-4 rounded-lg text-left text-indigo-200">
                        <h3 className="font-bold mb-2">{t('welcome.howToStart')}</h3>
                        <ol className="list-decimal list-inside space-y-2">
                            <li>{t('welcome.step1')}</li>
                            <li>{t('welcome.step2')}</li>
                            <li>{t('welcome.step3')}</li>
                        </ol>
                    </div>
                </div>
                <div className="bg-gray-900/50 px-6 py-4 flex justify-end gap-4 rounded-b-2xl">
                    <button 
                        onClick={onClose} 
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                    >
                        {t('welcome.startButton')}
                    </button>
                </div>
            </div>
        </div>
    );
};

const VersionOneWelcomeModal: React.FC<{ isOpen: boolean; onClose: () => void; t: (key: string) => string; }> = ({ isOpen, onClose, t }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-[102] p-4">
            <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>
                <div className="p-8 text-center">
                    <Logo className="h-16 w-16 text-indigo-400 mx-auto mb-4"/>
                    <h2 className="text-3xl font-bold text-white mb-2">{t('versionOneWelcome.title')}</h2>
                    <p className="text-gray-400 mb-6">{t('versionOneWelcome.intro')}</p>
                    
                    <div className="bg-gray-900/50 p-4 rounded-lg text-left">
                        <h3 className="font-bold text-lg text-indigo-300 mb-3">{t('versionOneWelcome.improvementsTitle')}</h3>
                        <ul className="list-disc list-inside space-y-2 text-gray-300">
                            <li>{t('versionOneWelcome.bugFixes')}</li>
                        </ul>
                    </div>
                </div>
                <div className="bg-gray-900/50 px-6 py-4 flex justify-end gap-4 rounded-b-2xl">
                    <button 
                        onClick={onClose} 
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                    >
                        {t('versionOneWelcome.button')}
                    </button>
                </div>
            </div>
        </div>
    );
};

const UpdateAvailableModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    versionInfo: VersionInfo;
}> = ({ isOpen, onClose, versionInfo }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-[103] p-4">
            <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="p-8 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <h2 className="text-2xl font-bold text-white mb-2">Nuova Versione Disponibile!</h2>
                    <p className="text-gray-300 mb-4">
                        È disponibile la versione <strong>{versionInfo.latestVersion}</strong>. Tu stai usando la versione <strong>{versionInfo.currentVersion}</strong>.
                    </p>
                </div>
                <div className="bg-gray-900/50 px-6 py-4 flex justify-between items-center rounded-b-2xl">
                    <button 
                        onClick={onClose} 
                        className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                    >
                        Chiudi
                    </button>
                    <a 
                        href={versionInfo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                    >
                        Scarica Ora
                    </a>
                </div>
            </div>
        </div>
    );
};


const App: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(0);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    
    const [subjects, setSubjects] = useState<string[]>([]);
    const [subjectsData, setSubjectsData] = useState<Record<string, SubjectDetails>>({});
    const [selectedSubject, setSelectedSubject] = useState<string>('');
    const [activeView, setActiveView] = useState('dashboard'); 
    
    const [dataVersion, setDataVersion] = useState(0);
    const refreshData = useCallback(() => setDataVersion(v => v + 1), []);
    
    const [isGlobalChatOpen, setIsGlobalChatOpen] = useState(false);
    const [isProcessingAI, setIsProcessingAI] = useState(false);

    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [dashboardData, setDashboardData] = useState<DashboardData>({ todaysEvents: [], upcomingExams: [], studyFocus: [] });

    const [dispense, setDispense] = useState<DbDispensa[]>([]);
    const [allThumbnails, setAllThumbnails] = useState<Record<string, DbThumbnail[]>>({});
    const [allMacroTopics, setAllMacroTopics] = useState<Record<string, MacroTopic[]>>({});
    const [allEsercizioTopics, setAllEsercizioTopics] = useState<Record<string, EsercizioTopic[]>>({});
    const [allEsercizioInstances, setAllEsercizioInstances] = useState<Record<string, EsercizioInstance[]>>({});
    const [allSimulations, setAllSimulations] = useState<Record<string, SavedSimulation[]>>({});
    const [allDiaries, setAllDiaries] = useState<Record<string, LessonDiary[]>>({});
    const [currentLesson, setCurrentLesson] = useState<{ topic: { id: string, title: string, moduleId: string }, steps: LessonStep[] } | null>(null);

    const [ai, setAi] = useState<GoogleGenAI | null>(null);
    const [availableModels, setAvailableModels] = useState<string[]>(['gemini-2.5-flash']);
    const [currentModelIndex, setCurrentModelIndex] = useState(0);
    const [isFirstLaunch, setIsFirstLaunch] = useState<boolean>(false);
    const [showVersionOneWelcome, setShowVersionOneWelcome] = useState<boolean>(false);
    
    const [isUpdateModalOpen, setUpdateModalOpen] = useState(false);
    const [latestVersionInfo, setLatestVersionInfo] = useState<VersionInfo | null>(null);

    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('uniTutorAITheme') || 'dark';
    });

    const [language, setLanguage] = useState<'it' | 'en'>(() => (localStorage.getItem('uniTutorAILanguage') as 'it' | 'en') || 'it');

    useEffect(() => {
        // This effect runs after every render to ensure that any new content
        // dynamically added to the DOM (e.g., AI responses, new views)
        // gets its LaTeX rendered by KaTeX. The auto-render extension is
        // idempotent and will skip elements it has already processed.
        if (window.renderMathInElement) {
            window.renderMathInElement(document.body, {
                delimiters: [
                    {left: '$$', right: '$$', display: true},
                    {left: '$', right: '$', display: false}
                ],
                throwOnError: false
            });
        }
    }); // No dependency array, runs on every re-render.

    const [pointerVisibility, setPointerVisibility] = useState<'all' | 'tackled'>(() => {
        return (localStorage.getItem('uniTutorAIPointerVisibility') as 'all' | 'tackled') || 'tackled';
    });

    useEffect(() => {
        localStorage.setItem('uniTutorAIPointerVisibility', pointerVisibility);
    }, [pointerVisibility]);

    const handlePointerVisibilityChange = (visibility: 'all' | 'tackled') => {
        setPointerVisibility(visibility);
    };

    useEffect(() => {
        localStorage.setItem('uniTutorAILanguage', language);
    }, [language]);

    const handleLanguageChange = (lang: 'it' | 'en') => {
        setLanguage(lang);
    };

    const t = useCallback((key: string): string => {
        const keys = key.split('.');
        let result: any = translations[language];
        for (const k of keys) {
            result = result?.[k];
            if (result === undefined) break;
        }

        if (result !== undefined) {
            return result;
        }

        if (language !== 'it') {
            let fallbackResult: any = translations.it;
            for (const k of keys) {
                fallbackResult = fallbackResult?.[k];
                if (fallbackResult === undefined) break;
            }
            if (fallbackResult !== undefined) {
                return fallbackResult;
            }
        }
        
        console.warn(`Translation key not found for "${key}" in any language.`);
        return key;
    }, [language]);
    
    const isLessonActive = activeView === 'chat' && currentLesson !== null;

    useEffect(() => {
        localStorage.setItem('uniTutorAITheme', theme);
        if (theme === 'light') {
            document.body.classList.add('light');
        } else {
            document.body.classList.remove('light');
        }
    }, [theme]);

    const handleThemeChange = (newTheme: string) => {
        setTheme(newTheme);
    };

    const addNotification = useCallback((notification: Omit<AppNotification, 'id'>) => {
        const id = Date.now().toString();
        setNotifications(prev => [...prev, { ...notification, id }]);
        return id;
    }, []);

    // Initialize the Gemini AI client
    useEffect(() => {
        const initializeAi = async () => {
            // In an Electron app, the API key is securely retrieved from the main process
            // via the preload script. We check if the `electronAPI` is available.
            let apiKey: string | undefined;
            if (window.electronAPI) {
                apiKey = await window.electronAPI.getApiKey();
            }

            if (apiKey) {
                try {
                    setAi(new GoogleGenAI({ apiKey }));
                } catch (e) {
                     const msg = t('errors.aiInit');
                     console.error(msg, e);
                     addNotification({ message: msg, type: 'error' });
                }
            } else {
                const msg = t('errors.apiKeyNotFound');
                console.error(msg);
                addNotification({ message: msg, type: 'error', duration: 10000 });
            }
        };

        initializeAi();
    }, [addNotification, t]);


    const updateNotification = useCallback((id: string, updates: Partial<Omit<AppNotification, 'id'>>) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
    }, []);

    const removeNotification = useCallback((id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    useEffect(() => {
        const compareVersions = (v1: string, v2: string) => {
            const parts1 = v1.replace('v', '').split('.').map(Number);
            const parts2 = v2.replace('v', '').split('.').map(Number);
            const len = Math.max(parts1.length, parts2.length);
            for (let i = 0; i < len; i++) {
                const p1 = parts1[i] || 0;
                const p2 = parts2[i] || 0;
                if (p1 > p2) return 1;
                if (p1 < p2) return -1;
            }
            return 0;
        };

        const checkForUpdates = async () => {
            try {
                const currentVersion = await (window as any).electronAPI?.getAppVersion();
                if (!currentVersion) return;

                const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO_PATH}/releases/latest`);
                if (!response.ok) throw new Error(`GitHub API responded with status ${response.status}`);
                
                const latestRelease = await response.json();
                const latestVersion = latestRelease.tag_name;

                if (compareVersions(latestVersion, currentVersion) > 0) {
                    setLatestVersionInfo({
                        currentVersion,
                        latestVersion,
                        url: latestRelease.html_url
                    });
                    setUpdateModalOpen(true);
                }
            } catch (error) {
                console.error("Impossibile verificare gli aggiornamenti:", error);
            }
        };

        checkForUpdates();
    }, []);

    // Load only essential data on initial render
    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoading(true);
            try {
                if (localStorage.getItem('uniTutorAISubjectsData')) {
                    addNotification({ 
                        message: "Aggiornamento del sistema di archiviazione dati in corso...", 
                        type: 'success', 
                        duration: 8000 
                    });
                    localStorage.clear();
                }

                let subjectsDataValue: Record<string, SubjectDetails>;
                const subjectsDataState = await db.appState.get('subjectsData');
                if (subjectsDataState) {
                    subjectsDataValue = subjectsDataState.value;
                } else {
                    subjectsDataValue = initialSubjectData;
                    await db.appState.put({ key: 'subjectsData', value: initialSubjectData });
                }
                setSubjectsData(subjectsDataValue);
                const subjectKeys = Object.keys(subjectsDataValue);
                setSubjects(subjectKeys);
                setSelectedSubject(subjectKeys[0] || '');

                const launchFlag = await db.appState.get('hasLaunchedBefore');
                if (!launchFlag) {
                    setIsFirstLaunch(true);
                    await db.appState.put({ key: 'hasLaunchedBefore', value: true });
                    await db.appState.put({ key: 'uniTutorAIVersion1WelcomeSeen', value: true });
                } else {
                    const versionOneFlag = await db.appState.get('uniTutorAIVersion1WelcomeSeen');
                    if (!versionOneFlag) {
                        setShowVersionOneWelcome(true);
                        await db.appState.put({ key: 'uniTutorAIVersion1WelcomeSeen', value: true });
                    }
                }

            } catch (e) {
                console.error("Failed to load data from IndexedDB", e);
                setError("Impossibile caricare i dati dell'applicazione. Prova a ricaricare la pagina.");
            } finally {
                setIsLoading(false);
            }
        };
        loadInitialData();
    }, [addNotification]);
    
    // Aggregate data for Dashboard on demand
    useEffect(() => {
        const calculateDashboardData = async () => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayDayName = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'][today.getDay()];
            const upcomingLimit = new Date();
            upcomingLimit.setDate(today.getDate() + 14);

            let allTodaysEvents: DashboardEvent[] = [];
            let allUpcomingExams: DashboardEvent[] = [];
            
            Object.entries(subjectsData).forEach(([subjectName, details]: [string, SubjectDetails]) => {
                (details.schedule.lessons || []).forEach(lesson => {
                    if (lesson.day === todayDayName) {
                        allTodaysEvents.push({ id: `${subjectName}-${lesson.id}`, subjectName, title: subjectName, type: 'Lezione', startTime: lesson.startTime, endTime: lesson.endTime, date: today, location: lesson.classroom });
                    }
                });
                (details.calendarEvents || []).forEach(event => {
                    if ((event.date && new Date(event.date + "T00:00:00").getTime() === today.getTime()) || (!event.date && event.day === todayDayName)) {
                        allTodaysEvents.push({ id: `${subjectName}-${event.id}`, subjectName, title: event.title, type: event.type, startTime: event.startTime, endTime: event.endTime, date: today });
                    }
                });
                (details.examDates || []).forEach(exam => {
                    const [day, month, year] = exam.date.split('/').map(Number);
                    const examDate = new Date(year, month - 1, day);
                    if (examDate.getTime() === today.getTime()) {
                        allTodaysEvents.push({ id: `${subjectName}-${exam.id}`, subjectName, title: `Esame di ${subjectName}`, type: 'Esame', startTime: exam.time, date: examDate, location: exam.classroom });
                    }
                    if (examDate > today && examDate <= upcomingLimit) {
                        allUpcomingExams.push({ id: `${subjectName}-${exam.id}`, subjectName, title: `Esame di ${subjectName}`, type: 'Esame', startTime: exam.time, date: examDate, location: exam.classroom });
                    }
                });
            });
            
            allTodaysEvents.sort((a, b) => (a.startTime || '00:00').localeCompare(b.startTime || '00:00'));
            allUpcomingExams.sort((a, b) => a.date.getTime() - b.date.getTime());
            
            const allDispenseFlat = await db.dispense.toArray();
            const studyFocusItems: FocusDispensa[] = allDispenseFlat
                .map((d) => {
                    const studiedCount = parsePageRanges(d.studiedPages || '', d.totalPages).length;
                    const completion = d.totalPages > 0 ? (studiedCount / d.totalPages) * 100 : 0;
                    return { id: d.id, name: d.name, subjectName: d.subjectName, completion };
                })
                .sort((a, b) => a.completion - b.completion)
                .slice(0, 3);


            setDashboardData({ todaysEvents: allTodaysEvents, upcomingExams: allUpcomingExams, studyFocus: studyFocusItems });
        };

        if (!isLoading) {
            calculateDashboardData();
        }

    }, [subjectsData, isLoading, dataVersion]);
    
    useEffect(() => {
        const loadSubjectData = async () => {
            if (!selectedSubject) {
                setDispense([]);
                setAllThumbnails({});
                return;
            }

            try {
                const [
                    dispenseFromDb,
                    macrosState,
                    topicsState,
                    instancesState,
                    simsState,
                    lessonState,
                    diariesState,
                ] = await Promise.all([
                    db.dispense.where('subjectName').equals(selectedSubject).toArray(),
                    db.appState.get('allMacroTopics'),
                    db.appState.get('allEsercizioTopics'),
                    db.appState.get('allEsercizioInstances'),
                    db.appState.get('allSimulations'),
                    db.appState.get('currentLesson'),
                    db.appState.get('allDiaries'),
                ]);

                setDispense(dispenseFromDb);

                if (dispenseFromDb.length > 0) {
                    const dispensaIds = dispenseFromDb.map(d => d.id);
                    const thumbnailsFromDb = await db.thumbnails.where('dispensaId').anyOf(dispensaIds).toArray();
                    const groupedThumbs = thumbnailsFromDb.reduce((acc, thumb) => {
                        (acc[thumb.dispensaId] = acc[thumb.dispensaId] || []).push(thumb);
                        return acc;
                    }, {} as Record<string, DbThumbnail[]>);
                    setAllThumbnails(groupedThumbs);
                } else {
                    setAllThumbnails({});
                }

                setAllMacroTopics(macrosState?.value || {});
                setAllEsercizioTopics(topicsState?.value || {});
                setAllEsercizioInstances(instancesState?.value || {});
                setAllSimulations(simsState?.value || {});
                setAllDiaries(diariesState?.value || {});
                setCurrentLesson(lessonState?.value || null);

            } catch (e) {
                console.error("Failed to load subject-specific data", e);
                setError("Impossibile caricare i dati per la materia selezionata.");
            }
        };
        loadSubjectData();
    }, [selectedSubject, dataVersion]);

    const generateContentWithModelSwitching = useCallback(async (params: { model?: string, contents: any, config?: any }): Promise<GenerateContentResponse> => {
        if (!ai) {
            addNotification({ message: 'L\'API di Gemini non è inizializzata. Controlla la chiave API.', type: 'error' });
            throw new Error("Gemini AI API not initialized.");
        }
        
        let attempts = 0;
        let lastError: any = null;
        const modelsToTry = availableModels.length;
        
        while (attempts < modelsToTry) {
            const modelIndex = (currentModelIndex + attempts) % modelsToTry;
            const model = availableModels[modelIndex];
            
            try {
                const response = await ai.models.generateContent({ ...params, model: params.model || model });
                setCurrentModelIndex(modelIndex);
                if (attempts > 0) addNotification({ message: `Operazione riuscita con il modello di fallback: ${model}`, type: 'success', duration: 4000 });
                return response;
            } catch (e) {
                console.error(`Error with model ${model}:`, e);
                lastError = e;
                attempts++;
                if (modelsToTry > 1 && attempts < modelsToTry) {
                    const nextModel = availableModels[(currentModelIndex + attempts) % modelsToTry];
                    addNotification({ message: `Modello ${model} non disponibile. Tento con ${nextModel}...`, type: 'error', duration: 4000 });
                }
            }
        }
        addNotification({ message: 'Tutti i modelli AI hanno fallito. Riprova più tardi.', type: 'error', duration: 6000 });
        throw lastError || new Error("All AI models failed to generate content.");
    }, [ai, availableModels, currentModelIndex, addNotification]);

    // Background calculation: subject statistics
    useEffect(() => {
        const calculateStats = async () => {
            if (Object.keys(subjectsData).length === 0) return;
            const allSimsState = await db.appState.get('allSimulations');
            const allSimulations: Record<string, SavedSimulation[]> = allSimsState?.value || {};
    
            let hasChanged = false;
            const newSubjectsData = JSON.parse(JSON.stringify(subjectsData));
    
            Object.keys(newSubjectsData).forEach(subjectKey => {
                const subjectSimulations = allSimulations[subjectKey] || [];
                const numSimulations = subjectSimulations.length;
    
                let avgGradeStr = 'N/A';
                if (numSimulations > 0) {
                    const gradedSimulations = subjectSimulations.filter(sim => sim.grade != null);
                    if (gradedSimulations.length > 0) {
                        const totalGradePoints = gradedSimulations.reduce((acc, sim) => acc + (sim.finalGrade ?? sim.grade), 0);
                        avgGradeStr = `${(totalGradePoints / gradedSimulations.length).toFixed(1)} / 30`;
                    }
                }
                
                if (newSubjectsData[subjectKey].simulations !== numSimulations || newSubjectsData[subjectKey].averageGrade !== avgGradeStr) {
                    hasChanged = true;
                    newSubjectsData[subjectKey].simulations = numSimulations;
                    newSubjectsData[subjectKey].averageGrade = avgGradeStr;
                }
            });
            
            if (hasChanged) {
                setSubjectsData(newSubjectsData);
                await db.appState.put({ key: 'subjectsData', value: newSubjectsData });
            }
        };

        calculateStats();

    }, [dataVersion, subjectsData]); // Depends on dataVersion

    // Background calculation: comprehension scores
    useEffect(() => {
        const calculateScores = async () => {
            const allDispense = await db.dispense.toArray();
            if (allDispense.length === 0) return;
            
            const [simsState, instancesState, topicsState] = await db.appState.bulkGet(['allSimulations', 'allEsercizioInstances', 'allEsercizioTopics']);
            const allSimulations: Record<string, SavedSimulation[]> = simsState?.value || {};
            const allEsercizioInstances: Record<string, EsercizioInstance[]> = instancesState?.value || {};
            const allEsercizioTopics: Record<string, EsercizioTopic[]> = topicsState?.value || {};

            let hasChanged = false;
            const updatedDispenseForDB: DbDispensa[] = [];

            for (const dispensa of allDispense) {
                const subjectKey = dispensa.subjectName;
                const relatedTopics = (allEsercizioTopics[subjectKey] || []).filter(t => t.sourceDispensaId === dispensa.id);
                const relatedTopicIds = new Set(relatedTopics.map(t => t.id));
                const relatedInstances = (allEsercizioInstances[subjectKey] || []).filter(i => relatedTopicIds.has(i.topicId));
                
                let exerciseScore = 0;
                if (relatedInstances.length > 0) {
                    const completedInstances = relatedInstances.filter(i => i.status === 'corrected' && (i.aiCorrectness === 'correct' || i.aiCorrectness === 'partially-correct'));
                    exerciseScore = completedInstances.length / relatedInstances.length;
                }

                const relatedSimulations = (allSimulations[subjectKey] || []).filter(s => s.dispensaIds.includes(dispensa.id));
                let simulationScore = 0;
                if (relatedSimulations.length > 0) {
                    const simScores = relatedSimulations.map(sim => {
                        return sim.totalPoints > 0 ? sim.score / sim.totalPoints : 0;
                    });
                    simulationScore = simScores.reduce((acc, score) => acc + score, 0) / simScores.length;
                }
                
                let finalScore: number | null = null;
                if (relatedInstances.length > 0 && relatedSimulations.length > 0) finalScore = (exerciseScore * 0.4) + (simulationScore * 0.6);
                else if (relatedInstances.length > 0) finalScore = exerciseScore;
                else if (relatedSimulations.length > 0) finalScore = simulationScore;

                if ((dispensa.comprehensionScore ?? null) !== finalScore) {
                    const updatedDispensa = { ...dispensa, comprehensionScore: finalScore };
                    updatedDispenseForDB.push(updatedDispensa);
                    hasChanged = true;
                }
            }
            
            if (hasChanged) {
                await db.dispense.bulkPut(updatedDispenseForDB);
                refreshData(); // Trigger UI update for the new scores
            }
        };

        calculateScores();

    }, [dataVersion, refreshData]); // Depends on dataVersion


    useEffect(() => {
        if (!file) return;

        const loadPdf = async () => {
            setIsLoading(true);
            setError(null);
            setPdfDoc(null);
            setTotalPages(0);
            setCurrentPage(1);

            try {
                const pdfjsLib = (window as any).pdfjsLib;
                if (!pdfjsLib) throw new Error("PDF.js library is not loaded.");
                pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
                
                const arrayBuffer = await file.arrayBuffer();
                const typedArray = new Uint8Array(arrayBuffer);
                const loadingTask = pdfjsLib.getDocument(typedArray);
                const pdf = await loadingTask.promise;
                setPdfDoc(pdf);
                setTotalPages(pdf.numPages);
                setActiveView('pdfReader');
            } catch (e) {
                 if (e instanceof Error) setError(`Errore nel caricamento del PDF: ${e.message}`);
                 else setError('Errore sconosciuto nel caricamento del PDF.');
            } finally {
                setIsLoading(false);
            }
        };

        loadPdf();
    }, [file]);
    
    const resetApp = useCallback(() => {
        setFile(null);
        setPdfDoc(null);
        setTotalPages(0);
        setCurrentPage(1);
        setError(null);
        setActiveView('details'); 
    }, []);

    const handlePageChange = useCallback((page: number) => {
      if (page > 0 && page <= totalPages) {
        setCurrentPage(page);
      }
    }, [totalPages]);

    const handleAddSubject = useCallback(async (subjectName: string) => {
        const trimmedName = subjectName.trim();
        if (trimmedName && !subjects.includes(trimmedName)) {
            const newSubjectsData = { ...subjectsData, [trimmedName]: defaultNewSubjectDetails };
            
            await db.appState.put({ key: 'subjectsData', value: newSubjectsData });
            
            setSubjects(prev => [...prev, trimmedName]);
            setSubjectsData(newSubjectsData);
            setSelectedSubject(trimmedName);
            setActiveView('details');
            refreshData();
        }
    }, [subjects, subjectsData, refreshData]);

    const handleDeleteSubject = useCallback(async (subjectToDelete: string) => {
        const dispensaIdsToDelete = await db.dispense.where('subjectName').equals(subjectToDelete).primaryKeys();

        await db.transaction('rw', db.appState, db.dispense, db.pdfFiles, db.thumbnails, db.pastExams, async () => {
            const newSubjectsData = { ...subjectsData };
            delete newSubjectsData[subjectToDelete];
            await db.appState.put({ key: 'subjectsData', value: newSubjectsData });
            
            await db.dispense.where('subjectName').equals(subjectToDelete).delete();
            if (dispensaIdsToDelete.length > 0) {
                await db.pdfFiles.bulkDelete(dispensaIdsToDelete as string[]);
                await db.thumbnails.where('dispensaId').anyOf(dispensaIdsToDelete).delete();
            }
            
            await db.pastExams.where({ subjectName: subjectToDelete }).delete();

            const stateKeys = ['allNotes', 'allDiaries', 'allSimulations', 'allMacroTopics', 'allEsercizioTopics', 'allEsercizioInstances', 'allChatHistories'];
            for (const key of stateKeys) {
                const stateData = await db.appState.get(key);
                if (stateData && stateData.value[subjectToDelete]) {
                    delete stateData.value[subjectToDelete];
                    await db.appState.put(stateData);
                }
            }
        });
        
        const newSubjects = subjects.filter(s => s !== subjectToDelete);
        setSubjects(newSubjects);

        const newSubjectsData = { ...subjectsData };
        delete newSubjectsData[subjectToDelete];
        setSubjectsData(newSubjectsData);

        if (selectedSubject === subjectToDelete) {
            const newSelectedSubject = newSubjects[0] || '';
            setSelectedSubject(newSelectedSubject);
            setActiveView(newSelectedSubject ? 'details' : 'dashboard');
        }
        refreshData();
    }, [selectedSubject, subjects, subjectsData, refreshData]);

    const handleRenameSubject = useCallback(async (oldName: string, newName: string) => {
        const trimmedNewName = newName.trim();
        if (!trimmedNewName || subjects.includes(trimmedNewName) || oldName === trimmedNewName) {
            if (subjects.includes(trimmedNewName)) addNotification({ message: 'Nome materia già esistente.', type: 'error', duration: 4000 });
            return;
        }

        const newSubjectsData = { ...subjectsData };
        if (newSubjectsData[oldName]) {
            newSubjectsData[trimmedNewName] = newSubjectsData[oldName];
            delete newSubjectsData[oldName];
        }
        
        try {
            await db.transaction('rw', db.appState, db.dispense, db.pastExams, async () => {
                await db.appState.put({ key: 'subjectsData', value: newSubjectsData });

                const stateKeys: string[] = ['allNotes', 'allDiaries', 'allSimulations', 'allMacroTopics', 'allEsercizioTopics', 'allEsercizioInstances', 'allChatHistories'];
                for (const key of stateKeys) {
                    const stateItem = await db.appState.get(key);
                    if (stateItem && stateItem.value[oldName]) {
                        stateItem.value[trimmedNewName] = stateItem.value[oldName];
                        delete stateItem.value[oldName];
                        await db.appState.put(stateItem);
                    }
                }

                const dispenseToUpdate = await db.dispense.where({ subjectName: oldName }).toArray();
                if (dispenseToUpdate.length > 0) {
                    await db.dispense.bulkPut(dispenseToUpdate.map(d => ({ ...d, subjectName: trimmedNewName })));
                }

                const pastExamsToUpdate = await db.pastExams.where({ subjectName: oldName }).toArray();
                if (pastExamsToUpdate.length > 0) {
                    await db.pastExams.bulkPut(pastExamsToUpdate.map(e => ({ ...e, subjectName: trimmedNewName })));
                }
            });
        } catch (e) {
            console.error("Failed to rename subject in DB", e);
            addNotification({ message: 'Errore durante la rinomina della materia nel database.', type: 'error' });
            return;
        }

        setSubjects(prev => prev.map(s => s === oldName ? trimmedNewName : s));
        setSubjectsData(newSubjectsData);
        
        if (selectedSubject === oldName) {
            setSelectedSubject(trimmedNewName);
        }
        refreshData();
        addNotification({ message: `Materia "${oldName}" rinominata in "${trimmedNewName}".`, type: 'success' });
    }, [subjects, subjectsData, selectedSubject, addNotification, refreshData]);


    const handleUpdateSubjectDetails = useCallback(async (subject: string, details: SubjectDetails) => {
        const newSubjectsData = { ...subjectsData, [subject]: details };
        setSubjectsData(newSubjectsData);
        await db.appState.put({ key: 'subjectsData', value: newSubjectsData });
        refreshData();
    }, [subjectsData, refreshData]);
    
    const handleAddCalendarEvent = useCallback(async (subject: string, event: CalendarEvent) => {
        const newSubjectsData = JSON.parse(JSON.stringify(subjectsData));
        const subjectDetails = newSubjectsData[subject];
        if (subjectDetails) {
            const currentEvents = subjectDetails.calendarEvents || [];
            subjectDetails.calendarEvents = [...currentEvents, event];
            setSubjectsData(newSubjectsData);
            await db.appState.put({ key: 'subjectsData', value: newSubjectsData });
            refreshData();
        }
    }, [subjectsData, refreshData]);

    const runFullDispensaAnalysis = useCallback(async (
        dispensa: DbDispensa,
        pdfFile: DbPdfFile,
        thumbnails: DbThumbnail[],
        textData: { pageNumber: number, content: string }[]
    ) => {
        const notificationId = addNotification({ message: `Analisi AI di "${dispensa.name}" in corso...`, type: 'loading' });
        setIsProcessingAI(true);
        let analysisCompleted = false;
        const langInstruction = language === 'it' ? 'italiano' : 'inglese';
        const langSystemInstruction = language === 'it' ? 'in formato JSON, in italiano.' : 'in JSON format, in English.';
        try {
            updateNotification(notificationId, { message: 'Fase 1/4: Indicizzazione del testo...' });
            
            const newContentVectors: ContentVector[] = textData.flatMap(page => {
                const chunks = page.content.split(/\n\s*\n/).filter(chunk => chunk.trim().length > 10); // Split by empty lines
                return chunks.map((chunk, index) => ({ id: `${dispensa.id}-vec-${page.pageNumber}-${index}`, pageNumber: page.pageNumber, content: chunk.trim(), status: 'non studiato' }));
            });
            const dispensaWithVectors: DbDispensa = { ...dispensa, contentVectors: newContentVectors };

            const fullTextForAI = textData.map(p => `--- PAGINA ${p.pageNumber} ---\n${p.content}`).join('\n\n');

            updateNotification(notificationId, { message: 'Fase 2/4: Analisi macro-argomenti...' });
            const macroPrompt = `Sei un professore universitario per la materia "${selectedSubject}". Analizza il seguente testo estratto da una dispensa sull'argomento "${dispensa.topic || dispensa.name}".
Il tuo compito è dividere il contenuto in 1-5 macro-argomenti principali. Usa la sintassi LaTeX (delimitata da $...$ per inline e $$...$$ per blocco) per tutte le formule matematiche.
La tua risposta DEVE essere un array JSON di oggetti, ognuno con la chiave "macro_topic" (stringa). La risposta deve essere in ${langInstruction}.
Esempio: [{"macro_topic": "Calcolo Integrale"}, {"macro_topic": "Serie Numeriche"}].
Rispondi solo con il JSON.

--- TESTO DOCUMENTO ---
${fullTextForAI}`;

            const macroResponse = await generateContentWithModelSwitching({
                contents: macroPrompt,
                config: { systemInstruction: `Sei un AI che estrae macro-argomenti da materiale didattico, ${langSystemInstruction}`, responseMimeType: "application/json", responseSchema: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { macro_topic: { type: Type.STRING } }, required: ["macro_topic"] } } },
            });
            const macroTopicsRaw: { macro_topic: string }[] = JSON.parse(macroResponse.text.trim());
            
            // --- LOGIC CORRECTION START ---
            // 1. Get existing macro topics and create final versions of new ones immediately.
            const existingMacroTopics = allMacroTopics[selectedSubject] || [];
            const existingMacroTopicTitles = new Set(existingMacroTopics.map(m => m.title.toLowerCase()));
            
            const newMacroTopics: MacroTopic[] = macroTopicsRaw
                .filter(item => !existingMacroTopicTitles.has(item.macro_topic.toLowerCase()))
                .map((item, index) => ({ 
                    id: `macro-db-${Date.now()}-${index}`, 
                    title: item.macro_topic 
                }));

            const allSubjectMacroTopics = [...existingMacroTopics, ...newMacroTopics];
            // --- LOGIC CORRECTION END ---

            updateNotification(notificationId, { message: 'Fase 3/4: Analisi micro-argomenti...' });
            const allNewMicroTopics: EsercizioTopic[] = [];

            // 2. Loop through the NEW macro topics which now have their definitive IDs.
            for (const parentMacroTopic of newMacroTopics) {
                const microPrompt = `Dato il testo per la materia "${selectedSubject}" e il macro-argomento "${parentMacroTopic.title}", analizza il documento. I numeri di pagina sono indicati da "--- PAGINA X ---".
Identifica 2-4 micro-argomenti specifici (pointers) che appartengono ESCLUSIVAMENTE al macro-argomento "${parentMacroTopic.title}".
Per ogni micro-argomento:
1. Fornisci un titolo conciso ("micro_topic").
2. Indica i numeri di pagina esatti ("page_numbers") basandoti sui marcatori "--- PAGINA X ---".
3. Valuta se generare domande teoriche, esercizi pratici o entrambi ("question_types": ["theory", "exercise"]).
Usa la sintassi LaTeX (delimitata da $...$ per inline e $$...$$ per blocco) per tutte le formule matematiche.
La tua risposta DEVE essere un array JSON, in ${langInstruction}. Rispondi solo con il JSON.

--- TESTO DOCUMENTO ---
${fullTextForAI}`;
                
                const microResponse = await generateContentWithModelSwitching({
                    contents: microPrompt,
                    config: { systemInstruction: `Sei un AI che estrae micro-argomenti (pointers) e li classifica, ${langSystemInstruction}`, responseMimeType: "application/json", responseSchema: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { micro_topic: { type: Type.STRING }, page_numbers: { type: Type.ARRAY, items: { type: Type.INTEGER } }, question_types: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["micro_topic", "page_numbers", "question_types"] } } },
                });
                const microTopicsRaw: { micro_topic: string; page_numbers: number[]; question_types: EsercizioQuestionType[] }[] = JSON.parse(microResponse.text.trim());
                
                // 3. The parentMacroTopic is already defined from the loop.
                allNewMicroTopics.push(...microTopicsRaw.map((item, index): EsercizioTopic | null => {
                    const validPageNumbers = item.page_numbers.filter(p => p > 0 && p <= dispensa.totalPages);
                    if (validPageNumbers.length === 0) return null;

                    const topicContent = textData
                        .filter(page => validPageNumbers.includes(page.pageNumber))
                        .map(page => page.content)
                        .join('\n\n');

                    if (!topicContent.trim()) return null;

                    const sourceDescription = `Dispensa "${dispensa.name}", Pagine: ${compressPageNumbers(validPageNumbers)}`;
                    
                    return {
                        id: `${Date.now()}-${allNewMicroTopics.length + index}`,
                        title: item.micro_topic,
                        macroTopicId: parentMacroTopic.id, // Assign the correct, final ID.
                        sourceDispensaId: dispensa.id,
                        sourcePageNumbers: validPageNumbers,
                        sourceDescription: sourceDescription,
                        sourceContent: topicContent,
                        questionTypes: (item.question_types || []).filter(qt => qt === 'theory' || qt === 'exercise'),
                        simulationStats: { appearances: 0, correct: 0 },
                        exerciseStats: { appearances: 0, completed: 0 },
                        affrontato: false
                    };
                }).filter((item): item is EsercizioTopic => item !== null));
            }
            analysisCompleted = true;
            updateNotification(notificationId, { message: 'Fase 4/4: Salvataggio dati...' });

            await db.transaction('rw', db.appState, db.dispense, db.pdfFiles, db.thumbnails, async () => {
                const topicsState = await db.appState.get('allEsercizioTopics');
                const currentAllEsercizioTopics: Record<string, EsercizioTopic[]> = topicsState?.value || {};
                
                const existingMicroTopicTitles = new Set((currentAllEsercizioTopics[selectedSubject] || []).map(e => e.title.toLowerCase()));
                const newMicroTopicsForDb = allNewMicroTopics.filter(item => !existingMicroTopicTitles.has(item.title.toLowerCase()));

                if (newMicroTopicsForDb.length > 0 || newMacroTopics.length > 0) {
                    const newAllMacroTopicsState = { ...allMacroTopics, [selectedSubject]: allSubjectMacroTopics };
                    const newAllEsercizioTopicsState = { ...currentAllEsercizioTopics, [selectedSubject]: [...(currentAllEsercizioTopics[selectedSubject] || []), ...newMicroTopicsForDb] };

                    await db.appState.bulkPut([
                        { key: 'allMacroTopics', value: newAllMacroTopicsState },
                        { key: 'allEsercizioTopics', value: newAllEsercizioTopicsState }
                    ]);
                }
                
                await db.dispense.put(dispensaWithVectors);
                await db.pdfFiles.put(pdfFile);
                await db.thumbnails.bulkPut(thumbnails);
            });
            
            refreshData();
            updateNotification(notificationId, { message: `Analisi di "${dispensa.name}" completata!`, type: 'success', duration: 4000 });
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : String(e);
            updateNotification(notificationId, { message: `Errore analisi AI: ${errorMessage}`, type: 'error', duration: 6000 });
        } finally {
            if (!analysisCompleted) {
                // If the process was interrupted, ensure no partial data is left.
                // The onSave function calls this, and it doesn't save to DB beforehand anymore.
                // So no cleanup is needed here, just preventing the success state.
            }
            setIsProcessingAI(false);
        }
    }, [selectedSubject, addNotification, updateNotification, generateContentWithModelSwitching, refreshData, allMacroTopics, language]);

    const handleSaveDispensa = useCallback(async (data: { name: string, topic: string, file: File, totalPages: number, thumbnails: Thumbnail[], textData: { pageNumber: number, content: string }[] }) => {
        const newDispensaId = Date.now().toString();
        const dispensaForDb: DbDispensa = { id: newDispensaId, name: data.name, topic: data.topic, fileName: data.file.name, subjectName: selectedSubject, totalPages: data.totalPages };
        const pdfFileForDb: DbPdfFile = { dispensaId: newDispensaId, file: data.file };
        const thumbnailsForDb: DbThumbnail[] = data.thumbnails.map(t => ({ ...t, dispensaId: newDispensaId }));

        // Run analysis first, save only on success.
        await runFullDispensaAnalysis(dispensaForDb, pdfFileForDb, thumbnailsForDb, data.textData);
    }, [selectedSubject, runFullDispensaAnalysis]);

    const handleDeleteDispensa = useCallback(async (dispensaIdToDelete: string) => {
        await db.transaction('rw', db.appState, db.dispense, db.pdfFiles, db.thumbnails, async () => {
            const allTopicsState = await db.appState.get('allEsercizioTopics');
            const allEsercizioTopics: Record<string, EsercizioTopic[]> = allTopicsState?.value || {};
            const topicsToDelete = (allEsercizioTopics[selectedSubject] || []).filter(e => e.sourceDispensaId === dispensaIdToDelete);
            const topicIdsToDelete = new Set(topicsToDelete.map(t => t.id));

            if(allTopicsState) {
                allEsercizioTopics[selectedSubject] = (allEsercizioTopics[selectedSubject] || []).filter(e => e.sourceDispensaId !== dispensaIdToDelete);
                await db.appState.put({ key: 'allEsercizioTopics', value: allEsercizioTopics });
            }

            const stateKeysToUpdate = ['allEsercizioInstances', 'allSimulations', 'allDiaries'];
            for (const key of stateKeysToUpdate) {
                const state = await db.appState.get(key);
                if (state?.value[selectedSubject]) {
                    if (key === 'allEsercizioInstances') state.value[selectedSubject] = state.value[selectedSubject].filter((inst: EsercizioInstance) => !topicIdsToDelete.has(inst.topicId));
                    if (key === 'allSimulations') state.value[selectedSubject] = state.value[selectedSubject].filter((s: SavedSimulation) => !s.dispensaIds.includes(dispensaIdToDelete));
                    if (key === 'allDiaries') state.value[selectedSubject] = state.value[selectedSubject].filter((d: LessonDiary) => d.topicId !== dispensaIdToDelete);
                    await db.appState.put(state);
                }
            }
            
            await db.dispense.delete(dispensaIdToDelete);
            await db.pdfFiles.delete(dispensaIdToDelete);
            await db.thumbnails.where('dispensaId').equals(dispensaIdToDelete).delete();
        });

        refreshData();
    }, [selectedSubject, refreshData]);

    const handleUpdateStudyProgress = useCallback(async (dispensaId: string, studiedPages: string) => {
        const dispensaToUpdate = await db.dispense.get(dispensaId);
        if (!dispensaToUpdate) return;
        
        const studiedPagesSet = new Set(parsePageRanges(studiedPages, dispensaToUpdate.totalPages));
        const newContentVectors = (dispensaToUpdate.contentVectors || []).map(vector => ({ ...vector, status: studiedPagesSet.has(vector.pageNumber) ? 'studiato' : 'non studiato' }));
        const updatedDispensa = { ...dispensaToUpdate, studiedPages, contentVectors: newContentVectors };
        
        const topicsState = await db.appState.get('allEsercizioTopics');
        if (topicsState?.value?.[selectedSubject]) {
            let topicsChanged = false;
            const allTopics = topicsState.value;
            const subjectTopics = allTopics[selectedSubject] as EsercizioTopic[];

            const updatedTopics = subjectTopics.map(topic => {
                if (topic.sourceDispensaId === dispensaId && topic.sourcePageNumbers) {
                    const areAllPagesStudied = topic.sourcePageNumbers.every(p => studiedPagesSet.has(p));
                    if (areAllPagesStudied && !topic.affrontato) {
                        topicsChanged = true;
                        return { ...topic, affrontato: true };
                    }
                }
                return topic;
            });

            if (topicsChanged) {
                allTopics[selectedSubject] = updatedTopics;
                await db.appState.put({ key: 'allEsercizioTopics', value: allTopics });
            }
        }

        await db.dispense.put(updatedDispensa);
        refreshData();
        addNotification({ message: 'Progresso salvato!', type: 'success', duration: 2000 });
    }, [selectedSubject, refreshData, addNotification]);

    const handleCreateEsercizio = useCallback(async (topic: EsercizioTopic): Promise<EsercizioInstance | null> => {
        setIsProcessingAI(true);
        const langInstruction = language === 'it' ? 'italiano' : 'inglese';
        const langSystemInstruction = language === 'it' ? 'Sei un professore universitario che crea esercizi in formato JSON, in italiano.' : 'You are a university professor creating exercises in JSON format, in English.';
        try {
            // 1. Get current topic data to calculate performance
            const topicsState = await db.appState.get('allEsercizioTopics') || { key: 'allEsercizioTopics', value: {} };
            const allTopics = topicsState.value;
            const subjectTopics = allTopics[selectedSubject] || [];
            const currentTopic = subjectTopics.find((t: EsercizioTopic) => t.id === topic.id);
    
            let performanceDescription = 'Nessuna performance precedente. Inizia con una domanda di difficoltà facile.';
            if (currentTopic) {
                const exStats = currentTopic.exerciseStats || { appearances: 0, completed: 0 };
                const simStats = currentTopic.simulationStats || { appearances: 0, correct: 0 };
                const totalAttempts = exStats.appearances + simStats.appearances;
                if (totalAttempts > 0) {
                    const totalSuccess = exStats.completed + simStats.correct;
                    const performance = totalSuccess / totalAttempts;
                    if (performance < 0.4) performanceDescription = "Performance bassa. Lo studente ha difficoltà. Genera una domanda di difficoltà 'easy' per consolidare i fondamenti.";
                    else if (performance < 0.8) performanceDescription = "Performance media. Lo studente sta imparando. Genera una domanda di difficoltà 'medium' che consolidi la conoscenza ma introduca una piccola variante.";
                    else performanceDescription = "Performance alta. Lo studente padroneggia l'argomento. Genera una domanda di difficoltà 'hard' che sia una sfida interessante.";
                }
            }

            const textContent = topic.sourceContent;
            if (!textContent || !textContent.trim()) {
                throw new Error("Contenuto dell'argomento non trovato o vuoto.");
            }

            const prompt = `Sei un professore per "${selectedSubject}". Il tuo compito è creare un esercizio sull'argomento "${topic.title}" basandoti sul testo fornito e sulla performance passata dello studente.

**Performance Studente:** ${performanceDescription}
**Tipi di domande possibili per questo argomento:** ${topic.questionTypes?.join(', ') || 'theory, exercise'}

**Istruzioni:**
1. Scegli il tipo di domanda più appropriato ('theory' o 'exercise') per testare lo studente.
2. Determina un livello di difficoltà ('easy', 'medium', 'hard') in base alla sua performance.
3. Crea una domanda ("question") e la relativa soluzione dettagliata ("solution").
4. Usa la sintassi LaTeX (delimitata da $...$ per inline e $$...$$ per blocco) per tutte le formule matematiche.

**Contenuto di riferimento:**
---
${textContent}
---

Rispondi ESCLUSIVAMENTE con un oggetto JSON in lingua ${langInstruction} con questa struttura: { "question": string, "solution": string, "type": "theory" | "exercise", "difficulty": "easy" | "medium" | "hard" }`;

            const schema = {
                type: Type.OBJECT,
                properties: {
                    question: { type: Type.STRING },
                    solution: { type: Type.STRING },
                    type: { type: Type.STRING, enum: ['theory', 'exercise'] },
                    difficulty: { type: Type.STRING, enum: ['easy', 'medium', 'hard'] }
                },
                required: ["question", "solution", "type", "difficulty"]
            };

            const response = await generateContentWithModelSwitching({ 
                contents: prompt, 
                config: { 
                    systemInstruction: langSystemInstruction,
                    responseMimeType: "application/json", 
                    responseSchema: schema 
                } 
            });
            
            const newExerciseContent: { question: string; solution: string; type: 'theory' | 'exercise'; difficulty: 'easy' | 'medium' | 'hard' } = JSON.parse(response.text.trim());
            
            const newInstance: EsercizioInstance = { 
                id: Date.now().toString(), 
                topicId: topic.id, 
                question: newExerciseContent.question, 
                solution: newExerciseContent.solution, 
                createdAt: new Date().toISOString(), 
                status: 'in-progress', 
                userSolutionContent: null,
                generatedType: newExerciseContent.type,
                difficulty: newExerciseContent.difficulty
            };

            // 3. IF AI call succeeds, update DB state transactionally
            await db.transaction('rw', db.appState, async () => {
                // Update topic stats
                const latestTopicsState = await db.appState.get('allEsercizioTopics') || { key: 'allEsercizioTopics', value: {} };
                const latestAllTopics = latestTopicsState.value;
                const latestSubjectTopics = latestAllTopics[selectedSubject] || [];
                const topicToUpdate = latestSubjectTopics.find((t: EsercizioTopic) => t.id === topic.id);
                if (topicToUpdate) {
                    const exStats = topicToUpdate.exerciseStats || { appearances: 0, completed: 0 };
                    topicToUpdate.exerciseStats = { ...exStats, appearances: exStats.appearances + 1 };
                    topicToUpdate.lastPracticed = new Date().toISOString();
                    await db.appState.put(latestTopicsState);
                }

                // Add new instance
                const instancesState = await db.appState.get('allEsercizioInstances') || { key: 'allEsercizioInstances', value: {} };
                const allInstances = instancesState.value;
                allInstances[selectedSubject] = [...(allInstances[selectedSubject] || []), newInstance];
                await db.appState.put(instancesState);
            });

            // 4. Refresh UI and return
            refreshData();
            return newInstance;

        } catch (e) {
            setError(`Impossibile generare l'esercizio: ${e instanceof Error ? e.message : 'Errore sconosciuto.'}`);
            return null;
        } finally {
             setIsProcessingAI(false);
        }
    }, [selectedSubject, generateContentWithModelSwitching, refreshData, language]);
    
    const handleUpdateEsercizioInstance = useCallback(async (updatedInstance: EsercizioInstance) => {
        const instancesState = await db.appState.get('allEsercizioInstances') || { key: 'allEsercizioInstances', value: {} };
        const allInstances = instancesState.value;
        allInstances[selectedSubject] = (allInstances[selectedSubject] || []).map((i: EsercizioInstance) => i.id === updatedInstance.id ? updatedInstance : i);
        await db.appState.put(instancesState);
    
        refreshData();
    }, [selectedSubject, refreshData]);

    const handleCorrectEsercizio = useCallback(async (instanceToCorrect: EsercizioInstance) => {
        setIsProcessingAI(true);
        const notificationId = addNotification({ message: 'Il Tutor AI sta correggendo il tuo esercizio...', type: 'loading' });
        const langInstruction = language === 'it' ? 'italiano' : 'inglese';

        try {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = instanceToCorrect.userSolutionContent || '';
            const userSolutionText = tempDiv.textContent || tempDiv.innerText || 'Nessuna risposta fornita.';
    
            const prompt = `Sei un professore universitario per la materia "${selectedSubject}". Valuta la risposta dello studente per il seguente esercizio.
            DOMANDA: "${instanceToCorrect.question}"
            SOLUZIONE UFFICIALE: "${instanceToCorrect.solution}"
            RISPOSTA DELLO STUDENTE: "${userSolutionText}"
    
            Fornisci una valutazione della risposta dello studente. Usa la sintassi LaTeX (delimitata da $...$ per inline e $$...$$ per blocco) per tutte le formule matematiche nel tuo feedback. La tua risposta DEVE essere un oggetto JSON con due chiavi:
            1. "correctness": una stringa che può essere 'correct', 'partially-correct', o 'incorrect'.
            2. "feedback": una stringa in formato Markdown che spiega gli errori o i punti di forza della risposta dello studente in modo costruttivo. Sii incoraggiante.
    
            Rispondi ESCLUSIVAMENTE con l'oggetto JSON, in lingua ${langInstruction}.`;
    
            const schema = {
                type: Type.OBJECT,
                properties: {
                    correctness: { type: Type.STRING },
                    feedback: { type: Type.STRING }
                },
                required: ["correctness", "feedback"]
            };
    
            const response = await generateContentWithModelSwitching({
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: schema
                }
            });
    
            const result: { correctness: 'correct' | 'partially-correct' | 'incorrect', feedback: string } = JSON.parse(response.text.trim());
    
            const instancesState = await db.appState.get('allEsercizioInstances') || { key: 'allEsercizioInstances', value: {} };
            const allInstances = instancesState.value;
            const subjectInstances = (allInstances[selectedSubject] || []) as EsercizioInstance[];
            
            const updatedInstance: EsercizioInstance = {
                ...instanceToCorrect,
                status: 'corrected',
                aiCorrectness: result.correctness,
                aiFeedback: result.feedback,
            };
    
            allInstances[selectedSubject] = subjectInstances.map(i => i.id === updatedInstance.id ? updatedInstance : i);
            await db.appState.put(instancesState);
    
            const isSuccess = result.correctness === 'correct' || result.correctness === 'partially-correct';
            if (isSuccess) {
                const topicsState = await db.appState.get('allEsercizioTopics') || { key: 'allEsercizioTopics', value: {} };
                const allTopics = topicsState.value;
                const subjectTopics = (allTopics[selectedSubject] || []) as EsercizioTopic[];
                const topicToUpdate = subjectTopics.find(t => t.id === updatedInstance.topicId);
                const originalInstance = subjectInstances.find(i => i.id === instanceToCorrect.id);

                if (topicToUpdate && (originalInstance?.status !== 'corrected' || (originalInstance.aiCorrectness !== 'correct' && originalInstance.aiCorrectness !== 'partially-correct'))) {
                    const exStats = topicToUpdate.exerciseStats || { appearances: 0, completed: 0 };
                    topicToUpdate.exerciseStats = { ...exStats, completed: exStats.completed + (result.correctness === 'correct' ? 1 : 0.5) };
                    topicToUpdate.lastPracticed = new Date().toISOString();
                    await db.appState.put(topicsState);
                }
            }
    
            updateNotification(notificationId, { message: 'Correzione completata!', type: 'success', duration: 4000 });
            refreshData();
    
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : String(e);
            updateNotification(notificationId, { message: `Errore durante la correzione: ${errorMessage}`, type: 'error', duration: 6000 });
        } finally {
            setIsProcessingAI(false);
        }
    }, [selectedSubject, addNotification, updateNotification, generateContentWithModelSwitching, refreshData, language]);


    const handleDeleteEsercizioTopic = useCallback(async (topicId: string) => {
        await db.transaction('rw', db.appState, async () => {
            const [topicsState, instancesState, macrosState] = await db.appState.bulkGet(['allEsercizioTopics', 'allEsercizioInstances', 'allMacroTopics']);
            const allTopics = topicsState?.value || {};
            const allInstances = instancesState?.value || {};
            const allMacros = macrosState?.value || {};

            const topicToDelete = (allTopics[selectedSubject] || []).find((t: EsercizioTopic) => t.id === topicId);
            
            allTopics[selectedSubject] = (allTopics[selectedSubject] || []).filter((e: EsercizioTopic) => e.id !== topicId);
            allInstances[selectedSubject] = (allInstances[selectedSubject] || []).filter((i: EsercizioInstance) => i.topicId !== topicId);

            if (topicToDelete?.macroTopicId) {
                const otherTopicsInMacro = (allTopics[selectedSubject] || []).some((t: EsercizioTopic) => t.macroTopicId === topicToDelete.macroTopicId);
                if (!otherTopicsInMacro) {
                    allMacros[selectedSubject] = (allMacros[selectedSubject] || []).filter((m: MacroTopic) => m.id !== topicToDelete.macroTopicId);
                }
            }

            await db.appState.bulkPut([
                { key: 'allEsercizioTopics', value: allTopics },
                { key: 'allEsercizioInstances', value: allInstances },
                { key: 'allMacroTopics', value: allMacros }
            ]);
        });
        refreshData();
    }, [selectedSubject, refreshData]);
    
    const handleAskForExerciseHelp = useCallback(async (question: string, userAttempt: string): Promise<string> => {
        setIsProcessingAI(true);
        const langInstruction = language === 'it' ? 'italiano' : 'inglese';
        const langSystemInstruction = language === 'it' ? 'Sei un tutor AI che non dà soluzioni dirette.' : 'You are an AI tutor that does not give direct solutions.';
        try {
            const prompt = `Studente di "${selectedSubject}" chiede aiuto. Esercizio: "${question}". Suo tentativo (testo e trascrizione disegni): "${userAttempt || "Nessuno"}". Suo dubbio: "${question}". NON dare la soluzione. Offri un suggerimento o fai una domanda guida. Sii incoraggiante e conciso. Usa la sintassi LaTeX (delimitata da $...$ per inline e $$...$$ per blocco) per tutte le formule matematiche. Rispondi in ${langInstruction}.`;
            const response = await generateContentWithModelSwitching({ contents: prompt, config: { systemInstruction: langSystemInstruction } });
            return response.text;
        } catch (e) {
            return `Si è verificato un errore: ${e instanceof Error ? e.message : 'Errore sconosciuto.'}`;
        } finally {
            setIsProcessingAI(false);
        }
    }, [selectedSubject, generateContentWithModelSwitching, language]);
    
    const handleGenerateCustomLesson = useCallback(async (dispensaId: string, pageRange: string, lessonTitle: string) => {
        setIsProcessingAI(true);
        setError(null);
        await db.appState.delete('currentLesson');
        const langInstruction = language === 'it' ? 'italiano' : 'inglese';
        const langSystemInstruction = language === 'it' ? 'Sei un tutor AI che genera lezioni JSON in italiano.' : 'You are an AI tutor that generates JSON lessons in English.';

        try {
            const sourceDispensa = await db.dispense.get(dispensaId);
            if (!sourceDispensa || !sourceDispensa.contentVectors) throw new Error(`Vettori di contenuto non trovati.`);
            const pageNumbersToAnalyze = parsePageRanges(pageRange, sourceDispensa.totalPages);
            if (pageNumbersToAnalyze.length === 0) throw new Error(`Range di pagine non valido.`);
            const contentToAnalyze = sourceDispensa.contentVectors.filter(v => pageNumbersToAnalyze.includes(v.pageNumber));
            if (contentToAnalyze.length === 0) throw new Error(`Nessun contenuto trovato.`);
            
            const fullTextForAI = contentToAnalyze.map(p => `--- PAGINA ${p.pageNumber} ---\n${p.content}`).join('\n\n');
            
            const prompt = `Crea una lezione per "${selectedSubject}" su "${lessonTitle}" basata sul testo [pagine ${pageNumbersToAnalyze.join(', ')}]. Usa la sintassi LaTeX (delimitata da $...$ per inline e $$...$$ per blocco) per tutte le formule matematiche. Rispondi come array JSON di oggetti {text: string, pageNumber: int}. Sii chiaro e conciso. Rispondi in ${langInstruction}.

--- TESTO ---
${fullTextForAI}`;

            const response = await generateContentWithModelSwitching({ contents: prompt, config: { systemInstruction: langSystemInstruction, responseMimeType: "application/json", responseSchema: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { text: { type: Type.STRING }, pageNumber: { type: Type.INTEGER } }, required: ["text", "pageNumber"] } } } });

            const lessonPlanRaw: { text: string, pageNumber: number }[] = JSON.parse(response.text.trim());
            const validatedPlan: LessonStep[] = lessonPlanRaw.map(step => ({ ...step, dispensaId })).filter(step => pageNumbersToAnalyze.includes(step.pageNumber));
            if (validatedPlan.length === 0) throw new Error("L'AI non è riuscita a generare un piano di lezione valido.");

            await db.appState.put({ key: 'currentLesson', value: { topic: { id: dispensaId, title: lessonTitle, moduleId: pageRange }, steps: validatedPlan } });
            refreshData();
        } catch (e) {
            setError(`Errore Lezione AI: ${e instanceof Error ? e.message : 'Errore sconosciuto.'}`);
            await db.appState.delete('currentLesson');
            refreshData();
        } finally {
            setIsProcessingAI(false);
        }
    }, [generateContentWithModelSwitching, refreshData, selectedSubject, language]);

    const handleLessonFinish = useCallback(async (topic: { id: string; title: string; moduleId: string; }, transcript: LessonStep[]) => {
        const newDiaryEntry: LessonDiary = { id: Date.now().toString(), topicId: topic.id, topicTitle: topic.title, date: new Date().toISOString(), transcript };
        const diariesState = await db.appState.get('allDiaries') || { key: 'allDiaries', value: {} };
        const allDiaries = diariesState.value;
        allDiaries[selectedSubject] = [...(allDiaries[selectedSubject] || []), newDiaryEntry];
        await db.appState.put(diariesState);
        
        const topicsState = await db.appState.get('allEsercizioTopics');
        if (topicsState?.value?.[selectedSubject]) {
            let topicsChanged = false;
            const allTopics = topicsState.value;
            const subjectTopics = allTopics[selectedSubject] as EsercizioTopic[];
            
            const lessonDispensaId = topic.id;
            const lessonPageRanges = topic.moduleId;
            const lessonPagesSet = new Set(parsePageRanges(lessonPageRanges, 9999));

            const updatedTopics = subjectTopics.map(t => {
                if (t.sourceDispensaId === lessonDispensaId && t.sourcePageNumbers) {
                     const areAllPagesCovered = t.sourcePageNumbers.every(p => lessonPagesSet.has(p));
                     if (areAllPagesCovered && !t.affrontato) {
                         topicsChanged = true;
                         return { ...t, affrontato: true };
                     }
                }
                return t;
            });

            if (topicsChanged) {
                allTopics[selectedSubject] = updatedTopics;
                await db.appState.put({ key: 'allEsercizioTopics', value: allTopics });
            }
        }

        await db.appState.delete('currentLesson');
        refreshData();
    }, [selectedSubject, refreshData]);

    const handleAskTutorQuestion = useCallback(async (question: string, context: string): Promise<string> => {
        setIsProcessingAI(true);
        const langInstruction = language === 'it' ? 'italiano' : 'inglese';
        const langSystemInstruction = language === 'it' ? 'Sei un tutor universitario.' : 'You are a university tutor.';
        try {
            const prompt = `CONTESTO: "${context}"\n\nDOMANDA: "${question}"\n\nRispondi in ${langInstruction} basandoti sul contesto. Usa la sintassi LaTeX (delimitata da $...$ per inline e $$...$$ per blocco) per tutte le formule matematiche.`;
            const response = await generateContentWithModelSwitching({ contents: prompt, config: { systemInstruction: langSystemInstruction } });
            return response.text;
        } catch (e) {
            return `Errore: ${e instanceof Error ? e.message : 'Sconosciuto.'}`;
        } finally {
            setIsProcessingAI(false);
        }
    }, [generateContentWithModelSwitching, language]);

    const handleGenerateSimulation = useCallback(async (dispensaIds: string[], structure: ExamStructure): Promise<SavedSimulation | null> => {
        setIsProcessingAI(true);
        setError(null);
        const notificationId = addNotification({ message: 'Avvio generazione simulazione...', type: 'loading' });
        const langInstruction = language === 'it' ? 'italiano' : 'inglese';
        const langSystemInstruction = language === 'it' ? 'Genera esami in formato JSON, in italiano.' : 'Generate exams in JSON format, in English.';
    
        try {
            const effectiveStructure = { ...structure };
            const instancesState = await db.appState.get('allEsercizioInstances');
            const allInstances: Record<string, EsercizioInstance[]> = instancesState?.value || {};
            const completedInstances = (allInstances[selectedSubject] || []).filter((inst: EsercizioInstance) => inst.status === 'corrected' && (inst.aiCorrectness === 'correct' || inst.aiCorrectness === 'partially-correct'));
            
            const topicsState = await db.appState.get('allEsercizioTopics');
            const allTopics: Record<string, EsercizioTopic[]> = topicsState?.value || {};
            const sourceTopicsFromDispense = (allTopics[selectedSubject] || []).filter((t: EsercizioTopic) => t.sourceDispensaId && dispensaIds.includes(t.sourceDispensaId));
            
            const sourceTopics = pointerVisibility === 'tackled'
                ? sourceTopicsFromDispense.filter(t => t.affrontato)
                : sourceTopicsFromDispense;
        
            if (sourceTopics.length === 0) {
                throw new Error(t('simulations.errors.noTopicsForFilter'));
            }
            
            const completedTopicIds = new Set(completedInstances.map((i: EsercizioInstance) => i.topicId));
            const completedTopicsFromSource = sourceTopics.filter(t => completedTopicIds.has(t.id));

            if ((structure.mcExercise > 0 || structure.openExercise > 0) && completedTopicsFromSource.length === 0) {
                addNotification({ message: "Domande pratiche omesse: nessun esercizio completato per gli argomenti delle dispense selezionate.", type: 'success', duration: 8000 });
                effectiveStructure.mcExercise = 0;
                effectiveStructure.openExercise = 0;
            }

            updateNotification(notificationId, { message: 'Fase 1/2: Analisi performance e argomenti...' });
        
            const topicsWithPerformance = sourceTopics.map(topic => {
                const exStats = topic.exerciseStats || { appearances: 0, completed: 0 };
                const simStats = topic.simulationStats || { appearances: 0, correct: 0 };
                const totalAttempts = exStats.appearances + simStats.appearances;
                const totalSuccess = exStats.completed + simStats.correct;
                const mastery = totalAttempts > 0 ? totalSuccess / totalAttempts : 0;
                
                let lastPracticedText = 'Mai';
                if (topic.lastPracticed) {
                    const daysAgo = Math.floor((new Date().getTime() - new Date(topic.lastPracticed).getTime()) / (1000 * 3600 * 24));
                    if (daysAgo === 0) lastPracticedText = 'Oggi';
                    else if (daysAgo === 1) lastPracticedText = 'Ieri';
                    else lastPracticedText = `${daysAgo} giorni fa`;
                }
                return `- Argomento: "${topic.title}", Performance: ${mastery.toFixed(2)}/1.0, Ultima pratica: ${lastPracticedText}`;
            });
            
            updateNotification(notificationId, { message: 'Fase 2/2: Generazione delle domande...' });
        
            const completedTopicTitles = completedTopicsFromSource.map(t => t.title).join(', ');
        
            const topicPromptSection = (effectiveStructure.mcExercise > 0 || effectiveStructure.openExercise > 0) && completedTopicTitles 
                ? `Le domande pratiche (esercizi) DEVONO essere generate SOLO per gli argomenti di cui lo studente ha già completato almeno un esercizio. Questi argomenti sono: "${completedTopicTitles}". La difficoltà di queste domande dovrebbe rispecchiare la performance dello studente su quell'argomento (vedi lista), creando una sfida adeguata al suo livello attuale.`
                : '';
        
            const topicsContentForAI = sourceTopics
                .map(topic => `--- CONTENUTO ARGOMENTO: "${topic.title}" ---\n${topic.sourceContent}\n--- FINE CONTENUTO ---`)
                .join('\n\n');

            const generationPrompt = `Crea un esame per "${selectedSubject}" con ESATTAMENTE: 
- ${effectiveStructure.mcTheory} domande di teoria a risposta multipla (tipo: 'multiple-choice-theory')
- ${effectiveStructure.openTheory} domande di teoria a risposta aperta (tipo: 'open-ended-theory')
- ${effectiveStructure.mcExercise} esercizi a risposta multipla (tipo: 'multiple-choice-exercise')
- ${effectiveStructure.openExercise} esercizi a risposta aperta (tipo: 'open-ended-exercise')

${topicPromptSection}

ISTRUZIONI IMPORTANTI:
1. Basa le domande ESCLUSIVAMENTE sul contenuto degli argomenti fornito di seguito nel blocco "CONTENUTO ARGOMENTI". NON usare conoscenze esterne o informazioni non presenti in quel testo.
2. Per decidere quali argomenti usare e con quale difficoltà, fai riferimento alla lista di performance dello studente. Dai priorità agli argomenti con performance più basse o a quelli non praticati di recente.
3. Usa la sintassi LaTeX (delimitata da $...$ per inline e $$...$$ per blocco) per tutte le formule matematiche.
4. Per ogni domanda, fornisci 'questionText', 'type', 'explanation', 'sourceTopic', 'sourcePageNumber', e 'points' (un numero da 1 a 5 in base alla difficoltà). Per MC, aggiungi 'options' e 'correctAnswerIndex'. Per aperte, 'modelAnswer'. Rispondi solo con array JSON, in lingua ${langInstruction}.

--- ARGOMENTI E PERFORMANCE (per scelta e difficoltà) ---
${topicsWithPerformance.join('\n')}

--- CONTENUTO ARGOMENTI (per la creazione delle domande) ---
${topicsContentForAI}`;
            
            const response = await generateContentWithModelSwitching({
                contents: generationPrompt,
                config: { systemInstruction: langSystemInstruction, responseMimeType: "application/json", responseSchema: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { questionText: { type: Type.STRING }, type: { type: Type.STRING }, explanation: { type: Type.STRING }, sourceTopic: { type: Type.STRING }, sourcePageNumber: { type: Type.INTEGER }, points: { type: Type.INTEGER }, options: { type: Type.ARRAY, items: { type: Type.STRING } }, correctAnswerIndex: { type: Type.INTEGER }, modelAnswer: { type: Type.STRING } }, required: ["questionText", "type", "explanation", "sourceTopic", "sourcePageNumber", "points"] } } },
            });
            const generatedQuestions: any[] = JSON.parse(response.text.trim());

            if (!Array.isArray(generatedQuestions)) throw new Error("La risposta dell'AI non è un array di domande valido.");
    
            const counts = {
                mcTheory: 0,
                openTheory: 0,
                mcExercise: 0,
                openExercise: 0,
            };

            generatedQuestions.forEach(q => {
                switch(q.type) {
                    case 'multiple-choice-theory': counts.mcTheory++; break;
                    case 'open-ended-theory': counts.openTheory++; break;
                    case 'multiple-choice-exercise': counts.mcExercise++; break;
                    case 'open-ended-exercise': counts.openExercise++; break;
                }
            });

            const totalGenerated = generatedQuestions.length;
            const totalRequested = effectiveStructure.mcTheory + effectiveStructure.openTheory + effectiveStructure.mcExercise + effectiveStructure.openExercise;

            if (totalGenerated !== totalRequested ||
                counts.mcTheory !== effectiveStructure.mcTheory ||
                counts.openTheory !== effectiveStructure.openTheory ||
                counts.mcExercise !== effectiveStructure.mcExercise ||
                counts.openExercise !== effectiveStructure.openExercise) {

                const errorDetails = `Richiesto: ${effectiveStructure.mcTheory} MCT, ${effectiveStructure.openTheory} OT, ${effectiveStructure.mcExercise} MCE, ${effectiveStructure.openExercise} OE. Ricevuto: ${counts.mcTheory} MCT, ${counts.openTheory} OT, ${counts.mcExercise} MCE, ${counts.openExercise} OE.`;
                throw new Error(`L'AI non ha generato la struttura dell'esame corretta. ${errorDetails} Riprova.`);
            }
            
            const selectedDispense = dispense.filter(d => dispensaIds.includes(d.id));
            const totalPoints = generatedQuestions.reduce((sum, q) => sum + (q.points || 0), 0);
            
            const examType = structure.hasWritten && structure.hasOral ? 'written_oral' : (structure.hasWritten ? 'written' : 'oral');

            const newSimulation: SavedSimulation = {
                id: Date.now().toString(),
                dispensaIds,
                dispensaNames: selectedDispense.map(d => d.name),
                date: new Date().toISOString(),
                questions: generatedQuestions.map((q, index) => ({ ...q, id: `${Date.now()}-${index}`, userAnswerIndex: null, userAnswerContent: null })),
                score: 0,
                totalPoints: totalPoints,
                grade: 0,
                duration: structure.timer,
                examType: examType,
                status: 'taking',
            };
    
            updateNotification(notificationId, { message: 'Simulazione generata!', type: 'success', duration: 4000 });
            return newSimulation;
    
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'Errore sconosciuto.';
            setError(`Errore Generazione AI: ${errorMessage}`);
            updateNotification(notificationId, { message: `Errore Generazione AI: ${errorMessage}`, type: 'error', duration: 6000 });
            return null;
        } finally {
            setIsProcessingAI(false);
        }
    }, [selectedSubject, addNotification, updateNotification, generateContentWithModelSwitching, language, dispense, pointerVisibility, t]);

    const handleSaveSimulation = useCallback(async (simulation: SavedSimulation) => {
        const notificationId = addNotification({ message: 'Avvio valutazione AI...', type: 'loading' });
        const langInstruction = language === 'it' ? 'italiano' : 'inglese';
        const langSystemInstruction = language === 'it' ? 'Valuta risposte in JSON, in italiano.' : 'Evaluate answers in JSON format, in English.';
        try {
            const questionsToEvaluate = simulation.questions.filter(q => q.type.includes('open-ended') && q.userAnswerContent);
            if (questionsToEvaluate.length > 0) {
                updateNotification(notificationId, { message: `Valutazione di ${questionsToEvaluate.length} rispost${questionsToEvaluate.length === 1 ? 'a' : 'e'}...` });
                const sourceDispense = await db.dispense.bulkGet(simulation.dispensaIds);
                
                const evaluationPromises = questionsToEvaluate.map(async (question) => {
                    let contextText = '';
                    if (question.sourcePageNumber) {
                       for (const dispensa of sourceDispense) {
                           if (!dispensa) continue;
                           const vectorsForPage = (dispensa.contentVectors || []).filter(v => v.pageNumber === question.sourcePageNumber);
                           if (vectorsForPage.length > 0) {
                               contextText = vectorsForPage.map(v => v.content).join('\n\n');
                               break;
                           }
                       }
                    }
                    
                    const content = question.userAnswerContent || '';
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = content;
                    const studentResponse = tempDiv.textContent || tempDiv.innerText || '';

                    const prompt = `Valuta la risposta dello studente per "${selectedSubject}". DOMANDA: "${question.questionText}". CONTESTO (PAG. ${question.sourcePageNumber || 'N/A'}): "${contextText || "Nessuno"}". RISPOSTA STUDENTE (testo e trascrizione disegni): "${studentResponse}". Usa la sintassi LaTeX (delimitata da $...$ per inline e $$...$$ per blocco) per tutte le formule matematiche nel feedback. Fornisci 'correctness' ('correct', 'partially-correct', 'incorrect') e 'feedback' in JSON, in lingua ${langInstruction}.`;
                    const response = await generateContentWithModelSwitching({ contents: prompt, config: { systemInstruction: langSystemInstruction, responseMimeType: "application/json", responseSchema: { type: Type.OBJECT, properties: { correctness: { type: Type.STRING }, feedback: { type: Type.STRING } }, required: ["correctness", "feedback"] } } });
                    const result: { correctness: 'correct' | 'partially-correct' | 'incorrect', feedback: string } = JSON.parse(response.text.trim());
                    return { questionId: question.id, ...result };
                });
                const results = await Promise.all(evaluationPromises);
                const resultsMap = new Map(results.map(r => [r.questionId, r]));
                simulation.questions.forEach(q => {
                    if (resultsMap.has(q.id)) {
                        const evalResult = resultsMap.get(q.id)!;
                        q.aiFeedback = evalResult.feedback;
                        q.aiCorrectness = evalResult.correctness;
                    } else if (q.type.includes('open-ended')) q.aiCorrectness = 'not-evaluated';
                });
            }
            
            let scoredPoints = 0;
            const totalPoints = simulation.questions.reduce((sum, q) => sum + (q.points || 0), 0);

            simulation.questions.forEach(q => {
                const questionPoints = q.points || 0;
                if (q.type.includes('multiple-choice')) {
                    if (q.userAnswerIndex === q.correctAnswerIndex) {
                        scoredPoints += questionPoints;
                    }
                } else if (q.type.includes('open-ended')) {
                    if (q.aiCorrectness === 'correct') {
                        scoredPoints += questionPoints;
                    } else if (q.aiCorrectness === 'partially-correct') {
                        scoredPoints += questionPoints / 2;
                    }
                }
            });
            
            const grade = totalPoints > 0 ? (scoredPoints / totalPoints) * 30 : 0;
            simulation.score = scoredPoints;
            simulation.totalPoints = totalPoints;
            simulation.grade = grade;

            if (simulation.examType === 'written_oral') {
                simulation.status = 'oral_pending';
            } else {
                simulation.status = 'completed';
            }

            const topicsState = await db.appState.get('allEsercizioTopics') || { key: 'allEsercizioTopics', value: {} };
            const allTopics: Record<string, EsercizioTopic[]> = topicsState.value;
            const subjectTopics = allTopics[selectedSubject] || [];
            const topicsToUpdate = new Map<string, EsercizioTopic>();

            for (const question of simulation.questions) {
                if (question.sourcePageNumber && question.sourceTopic) {
                    const matchingTopics = subjectTopics.filter(t => t.title === question.sourceTopic && t.sourcePageNumbers?.includes(question.sourcePageNumber!));
                    for (const topic of matchingTopics) {
                        let topicToUpdate = topicsToUpdate.get(topic.id) || JSON.parse(JSON.stringify(topic));
            
                        const simStats = topicToUpdate.simulationStats || { appearances: 0, correct: 0 };
                        simStats.appearances += 1;
            
                        let isCorrect = false;
                        if (question.type.includes('multiple-choice')) {
                            if (question.userAnswerIndex === question.correctAnswerIndex) isCorrect = true;
                        } else {
                            if (question.aiCorrectness === 'correct') isCorrect = true;
                            if (question.aiCorrectness === 'partially-correct') simStats.correct += 0.5;
                        }
                        if (isCorrect) {
                            simStats.correct += 1;
                        }
                        topicToUpdate.simulationStats = simStats;
                        topicToUpdate.lastPracticed = new Date().toISOString();
                        topicsToUpdate.set(topic.id, topicToUpdate);
                    }
                }
            }

            if (topicsToUpdate.size > 0) {
                const finalTopics = subjectTopics.map(t => topicsToUpdate.get(t.id) || t);
                allTopics[selectedSubject] = finalTopics;
                await db.appState.put({ key: 'allEsercizioTopics', value: allTopics });
            }

            const simsState = await db.appState.get('allSimulations') || { key: 'allSimulations', value: {} };
            const allSimulations = simsState.value;
            const existingSims = allSimulations[selectedSubject] || [];
            const simIndex = existingSims.findIndex((s: SavedSimulation) => s.id === simulation.id);
            if (simIndex > -1) existingSims[simIndex] = simulation; else existingSims.push(simulation);
            allSimulations[selectedSubject] = existingSims;
            
            await db.appState.put({ key: 'allSimulations', value: allSimulations });
            refreshData();
            updateNotification(notificationId, { message: 'Valutazione completata e salvata!', type: 'success', duration: 4000 });
        } catch(e) {
            updateNotification(notificationId, { message: `Errore valutazione AI: ${e instanceof Error ? e.message : 'Errore sconosciuto.'}`, type: 'error', duration: 6000 });
            // Save anyway
            const simsState = await db.appState.get('allSimulations') || { key: 'allSimulations', value: {} };
            const allSimulations = simsState.value;
            allSimulations[selectedSubject] = [...(allSimulations[selectedSubject] || []).filter((s: SavedSimulation) => s.id !== simulation.id), simulation];
            await db.appState.put({ key: 'allSimulations', value: allSimulations });
            refreshData();
        }
    }, [selectedSubject, addNotification, updateNotification, generateContentWithModelSwitching, refreshData, language]);

    const handleLearnExamStructure = useCallback(async (file: File): Promise<boolean> => {
        const notificationId = addNotification({ message: t('simulations.upload.analysisLoading'), type: 'loading' });
        setIsProcessingAI(true);
        try {
            // 1. Text extraction
            const pdfjsLib = (window as any).pdfjsLib;
            if (!pdfjsLib) throw new Error("PDF.js non è caricato.");
            pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

            const arrayBuffer = await file.arrayBuffer();
            const typedArray = new Uint8Array(arrayBuffer);
            const pdf = await pdfjsLib.getDocument(typedArray).promise;

            let fullTextForAI = '';
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                fullTextForAI += textContent.items.map((item: any) => item.str).join(' ') + '\n\n';
            }
            
            const langInstruction = language === 'it' ? 'italiano' : 'inglese';

            // 2. AI call for structure
            updateNotification(notificationId, { message: 'Fase 1/3: Analisi struttura...' });
            const structurePrompt = `Sei un assistente AI progettato per analizzare esami universitari. Analizza il testo per la materia "${selectedSubject}". Il tuo compito è determinare la struttura dell'esame contando il numero di: domande di teoria a risposta multipla, domande di teoria a risposta aperta, esercizi a risposta multipla, ed esercizi a risposta aperta. Trova anche la durata in minuti. Rispondi SOLO con un oggetto JSON in ${langInstruction} con questa struttura: { "mcTheory": number, "openTheory": number, "mcExercise": number, "openExercise": number, "timer": number }. Se un valore non è specificato, usa 0 per le domande e 90 per il timer. Testo Esame:\n---\n${fullTextForAI}\n---`;
            const structureSchema = { type: Type.OBJECT, properties: { mcTheory: { type: Type.INTEGER }, openTheory: { type: Type.INTEGER }, mcExercise: { type: Type.INTEGER }, openExercise: { type: Type.INTEGER }, timer: { type: Type.INTEGER } }, required: ["mcTheory", "openTheory", "mcExercise", "openExercise", "timer"] };
            const structureResponse = await generateContentWithModelSwitching({ contents: structurePrompt, config: { responseMimeType: "application/json", responseSchema: structureSchema } });
            const structure: ExamStructure = JSON.parse(structureResponse.text.trim());

            // 3. AI call for topic analysis
            updateNotification(notificationId, { message: 'Fase 2/3: Analisi argomenti...' });
            const analysisPrompt = `Sei un professore universitario per la materia "${selectedSubject}". Analizza il testo della seguente traccia d'esame. Il tuo compito è identificare ogni domanda o esercizio e, per ciascuno, elencare i micro-argomenti (pointers) specifici e concisi necessari per risolverlo. Rispondi ESCLUSIVAMENTE con un array JSON, in lingua ${langInstruction}. Ogni oggetto nell'array deve avere la struttura: { "questionTitle": "Titolo breve della domanda/esercizio", "requiredTopics": ["Argomento 1", "Argomento 2", ...] }.

--- TESTO TRACCIA D'ESAME ---
${fullTextForAI}
---`;
            const analysisSchema = { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { questionTitle: { type: Type.STRING }, requiredTopics: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["questionTitle", "requiredTopics"] } };
            const analysisResponse = await generateContentWithModelSwitching({ contents: analysisPrompt, config: { responseMimeType: "application/json", responseSchema: analysisSchema } });
            const analysisResult: ExamTraceAnalysis[] = JSON.parse(analysisResponse.text.trim());

            // 4. Create new pointers if needed
            updateNotification(notificationId, { message: 'Fase 3/3: Aggiornamento database...' });
            await db.transaction('rw', db.appState, async () => {
                const [macrosState, topicsState] = await db.appState.bulkGet(['allMacroTopics', 'allEsercizioTopics']);
                const allMacros: Record<string, MacroTopic[]> = macrosState?.value || {};
                const allTopics: Record<string, EsercizioTopic[]> = topicsState?.value || {};

                const subjectMacros = allMacros[selectedSubject] || [];
                const subjectTopics = allTopics[selectedSubject] || [];
                
                let traceMacro = subjectMacros.find(m => m.title === "Da Tracce d'Esame");
                if (!traceMacro) {
                    traceMacro = { id: `macro-trace-${Date.now()}`, title: "Da Tracce d'Esame" };
                    subjectMacros.push(traceMacro);
                    allMacros[selectedSubject] = subjectMacros;
                    await db.appState.put({ key: 'allMacroTopics', value: allMacros });
                }

                const existingTopicTitles = new Set(subjectTopics.map(t => t.title.toLowerCase()));
                const newTopicsToCreate: EsercizioTopic[] = [];
                const allRequiredTopicsFromAI = new Set(analysisResult.flatMap(r => r.requiredTopics));

                for (const topicName of allRequiredTopicsFromAI) {
                    if (!existingTopicTitles.has(topicName.toLowerCase())) {
                        const newPointer: EsercizioTopic = {
                            id: crypto.randomUUID(),
                            title: topicName,
                            macroTopicId: traceMacro.id,
                            sourceDescription: `Identificato da traccia: ${file.name}`,
                            sourceContent: `Questo argomento è stato identificato dall'analisi della traccia d'esame "${file.name}". Il contenuto specifico va recuperato dalle dispense pertinenti.`,
                            affrontato: false,
                            exerciseStats: { appearances: 0, completed: 0 },
                            simulationStats: { appearances: 0, correct: 0 },
                            questionTypes: ['theory', 'exercise'],
                        };
                        newTopicsToCreate.push(newPointer);
                        existingTopicTitles.add(topicName.toLowerCase());
                    }
                }

                if (newTopicsToCreate.length > 0) {
                    allTopics[selectedSubject] = [...subjectTopics, ...newTopicsToCreate];
                    await db.appState.put({ key: 'allEsercizioTopics', value: allTopics });
                }
            });
            
            // 5. Save analysis to DB
            await db.pastExams.put({
                id: crypto.randomUUID(),
                subjectName: selectedSubject,
                fileName: file.name,
                file: file,
                structure: structure,
                analysis: analysisResult,
            });

            refreshData();
            updateNotification(notificationId, { message: 'Analisi traccia completata!', type: 'success', duration: 5000 });
            return true;
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : String(e);
            updateNotification(notificationId, { message: `Errore analisi: ${errorMessage}`, type: 'error', duration: 6000 });
            return false;
        } finally {
            setIsProcessingAI(false);
        }
    }, [selectedSubject, generateContentWithModelSwitching, addNotification, updateNotification, language, refreshData, t]);

    const handleSaveNote = useCallback(async (note: Appunto) => {
        const notesState = await db.appState.get('allNotes') || { key: 'allNotes', value: {} };
        const allNotes = notesState.value;
        const subjectNotes = allNotes[selectedSubject] || [];
        const noteIndex = subjectNotes.findIndex((n: Appunto) => n.id === note.id);
    
        if (noteIndex > -1) subjectNotes[noteIndex] = note;
        else subjectNotes.push(note);
        
        allNotes[selectedSubject] = subjectNotes;
        await db.appState.put({ key: 'allNotes', value: allNotes });
        refreshData();
    }, [selectedSubject, refreshData]);

    const handleDeleteNote = useCallback(async (noteId: string) => {
        const notesState = await db.appState.get('allNotes');
        if (!notesState) return;
        const allNotes = notesState.value;
        const subjectNotes = allNotes[selectedSubject] || [];
        
        const idsToDelete = new Set<string>([noteId]);
        const queue: string[] = [noteId];
        
        while(queue.length > 0) {
            const currentParentId = queue.shift();
            // FIX: This was the bug. The original code called queue.shift() inside the filter callback.
            const children = subjectNotes.filter((n: Appunto) => n.parentId === currentParentId);
            for(const child of children) {
                // Check prevents infinite loops in case of data corruption/cycles
                if (!idsToDelete.has(child.id)) {
                    idsToDelete.add(child.id);
                    queue.push(child.id);
                }
            }
        }
        
        allNotes[selectedSubject] = subjectNotes.filter((n: Appunto) => !idsToDelete.has(n.id));
        await db.appState.put({ key: 'allNotes', value: allNotes });
        refreshData();
    }, [selectedSubject, refreshData]);
    
    const handleGetAiReview = useCallback(async (note: Appunto, contextPages?: DbThumbnail[]): Promise<string> => {
        setIsProcessingAI(true);
        const notificationId = addNotification({ message: 'Analisi AI degli appunti in corso...', type: 'loading' });
        const langInstruction = language === 'it' ? 'italiano' : 'inglese';
        const langSystemInstruction = language === 'it' ? `Sei un professore universitario esperto in "${selectedSubject}" che recensisce appunti e identifica nuove informazioni corrette, rispondendo in formato JSON in italiano.` : `You are a university professor expert in "${selectedSubject}" who reviews notes and identifies new, correct information, responding in JSON format in English.`;

        try {
            let contextText = '';

            if (contextPages && contextPages.length > 0) {
                const dispensaId = contextPages[0].dispensaId;
                const pageNumbers = new Set(contextPages.map(p => p.pageNumber));
                const sourceDispensa = await db.dispense.get(dispensaId);
                const contextVectors = sourceDispensa?.contentVectors?.filter(v => pageNumbers.has(v.pageNumber)) || [];
                contextText = contextVectors.map(v => v.content).join('\n\n');
            }
            
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = note.content;
            const fullNoteContentForAI = tempDiv.textContent || tempDiv.innerText || '';

            const prompt = `Sei un professore universitario esperto in "${selectedSubject}". Hai due compiti:
1.  Fornire una recensione costruttiva in formato Markdown degli appunti forniti (testo digitato e trascrizione dei disegni).
2.  Identificare concetti NUOVI, CORRETTI e RILEVANTI presenti negli appunti che NON si trovano nel testo di riferimento della dispensa. Per ogni concetto nuovo, fornisci un titolo conciso e il testo esatto dell'informazione nuova.
Usa la sintassi LaTeX (delimitata da $...$ per inline e $$...$$ per blocco) per tutte le formule matematiche.
Rispondi ESCLUSIVAMENTE con un oggetto JSON in lingua ${langInstruction} con questa struttura:
{
  "review": "Il testo della tua recensione in Markdown...",
  "newTopics": [
    {
      "title": "Titolo del nuovo concetto 1",
      "content": "Testo specifico dell'informazione nuova e corretta trovata nell'appunto."
    }
  ]
}
Se non ci sono nuovi concetti, lascia l'array "newTopics" vuoto.

--- APPUNTI DELLO STUDENTE (TESTO E TRASCRIZIONE DISEGNI) ---
${fullNoteContentForAI}

--- TESTO DISPENSA DI RIFERIMENTO ---
${contextText || "Nessun testo di riferimento fornito. Basa la tua analisi sulla correttezza generale dell'argomento."}`;
            
            const schema = {
                type: Type.OBJECT,
                properties: {
                    review: { type: Type.STRING },
                    newTopics: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                title: { type: Type.STRING },
                                content: { type: Type.STRING }
                            },
                            required: ["title", "content"]
                        }
                    }
                },
                required: ["review", "newTopics"]
            };

            // FIX: Corrected variable name from 'systemInstruction' to 'langSystemInstruction' when calling the AI model.
            const response = await generateContentWithModelSwitching({ contents: prompt, config: { systemInstruction: langSystemInstruction, responseMimeType: "application/json", responseSchema: schema } });
            
            const result: { review: string; newTopics: { title: string; content: string }[] } = JSON.parse(response.text.trim());

            if (result.newTopics && result.newTopics.length > 0) {
                const [macrosState, topicsState] = await db.appState.bulkGet(['allMacroTopics', 'allEsercizioTopics']);
                const allMacroTopics: Record<string, MacroTopic[]> = macrosState?.value || {};
                const allEsercizioTopics: Record<string, EsercizioTopic[]> = topicsState?.value || {};
                
                let noteMacroTopic = (allMacroTopics[selectedSubject] || []).find(m => m.title === "Approfondimenti da Appunti" || m.title === "Insights from Notes");
                if (!noteMacroTopic) {
                    noteMacroTopic = { id: `macro-note-${Date.now()}`, title: language === 'it' ? "Approfondimenti da Appunti" : "Insights from Notes" };
                    allMacroTopics[selectedSubject] = [...(allMacroTopics[selectedSubject] || []), noteMacroTopic];
                    await db.appState.put({ key: 'allMacroTopics', value: allMacroTopics });
                }

                const newPointers: EsercizioTopic[] = result.newTopics.map(topic => ({
                    id: crypto.randomUUID(),
                    title: topic.title,
                    sourceNoteId: note.id,
                    sourceDescription: `Appunto "${note.title}"`,
                    sourceContent: topic.content,
                    macroTopicId: noteMacroTopic!.id,
                    questionTypes: ['theory', 'exercise'],
                    simulationStats: { appearances: 0, correct: 0 },
                    exerciseStats: { appearances: 0, completed: 0 },
                    affrontato: true
                }));

                allEsercizioTopics[selectedSubject] = [...(allEsercizioTopics[selectedSubject] || []), ...newPointers];
                await db.appState.put({ key: 'allEsercizioTopics', value: allEsercizioTopics });

                addNotification({ message: `Creati ${newPointers.length} nuovi argomenti per esercitazioni dai tuoi appunti!`, type: 'success', duration: 6000 });
            }
            updateNotification(notificationId, { message: 'Recensione completata!', type: 'success', duration: 3000 });

            return result.review;
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'Sconosciuto.';
            updateNotification(notificationId, { message: `Errore recensione: ${errorMessage}`, type: 'error', duration: 5000 });
            return `Errore: ${errorMessage}`;
        } finally {
            setTimeout(() => removeNotification(notificationId), 5000);
            setIsProcessingAI(false);
        }
    }, [selectedSubject, generateContentWithModelSwitching, addNotification, updateNotification, removeNotification, language]);

    const handleSendGlobalChatMessage = useCallback(async (message: string) => {
        if (!message.trim() || !selectedSubject) return;

        const userMessage: ChatMessage = { id: Date.now().toString(), role: 'user', text: message };
        
        const historyState = await db.appState.get('allChatHistories') || { key: 'allChatHistories', value: {} };
        const allChatHistories = historyState.value;
        const currentHistory = allChatHistories[selectedSubject] || [];
        const updatedHistory = [...currentHistory, userMessage];
        allChatHistories[selectedSubject] = updatedHistory;
        await db.appState.put({ key: 'allChatHistories', value: allChatHistories });
        refreshData();
        
        setIsProcessingAI(true);
        const langInstruction = language === 'it' ? 'italiano' : 'inglese';
        const langSystemInstruction = language === 'it' ? 'Rispondi solo con il contesto fornito.' : 'Answer only with the provided context.';
        try {
            const currentDispense = await db.dispense.where('subjectName').equals(selectedSubject).toArray();
            const allVectors = currentDispense.flatMap(d => d.contentVectors || []);
            let modelResponseText = '';

            if (allVectors.length === 0) {
                modelResponseText = "Nessuna dispensa caricata per questa materia. Le mie capacità sono limitate.";
            } else {
                const relevantVectors = findRelevantVectors(message, allVectors, 5);
                if (relevantVectors.length === 0) {
                    modelResponseText = "Non ho trovato informazioni pertinenti nelle tue dispense. Prova a formulare la domanda in modo diverso.";
                } else {
                    const contextForGeneration = relevantVectors.map(v => `- (Da pag. ${v.pageNumber}) ${v.content}`).join('\n');
                    const generationPrompt = `Sei UniTutorAI per "${selectedSubject}". Basandoti ESCLUSIVAMENTE su queste info, rispondi alla domanda in ${langInstruction}. Indica la pagina se possibile. Usa la sintassi LaTeX (delimitata da $...$ per inline e $$...$$ per blocco) per tutte le formule matematiche.\n\n--- INFO ---\n${contextForGeneration}\n\n--- DOMANDA ---\n${message}`;
                    const finalResponse = await generateContentWithModelSwitching({ contents: generationPrompt, config: { systemInstruction: langSystemInstruction } });
                    modelResponseText = finalResponse.text;
                }
            }
            const modelMessage: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text: modelResponseText };
            allChatHistories[selectedSubject] = [...updatedHistory, modelMessage];
            await db.appState.put({ key: 'allChatHistories', value: allChatHistories });
        } catch (e) {
            const errorText = e instanceof Error ? e.message : 'Sconosciuto.';
            const errorMessage: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text: `Mi dispiace, si è verificato un errore: ${errorText}` };
            allChatHistories[selectedSubject] = [...updatedHistory, errorMessage];
            await db.appState.put({ key: 'allChatHistories', value: allChatHistories });
        } finally {
            setIsProcessingAI(false);
            refreshData();
        }
    }, [selectedSubject, generateContentWithModelSwitching, refreshData, language]);
    
    const handleAnalyzeExternalExercise = useCallback(async (file: File): Promise<{ suggested_topic_id: string; reasoning: string; extracted_question: string; extracted_solution: string } | null> => {
        setIsProcessingAI(true);
        const notificationId = addNotification({ message: 'Analisi del file in corso...', type: 'loading' });
        try {
            let extractedText = '';
            if (file.type === 'application/pdf') {
                const pdfjsLib = (window as any).pdfjsLib;
                if (!pdfjsLib) throw new Error("Libreria PDF.js non caricata.");
                pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
                const arrayBuffer = await file.arrayBuffer();
                const typedArray = new Uint8Array(arrayBuffer);
                const pdf = await pdfjsLib.getDocument(typedArray).promise;
                const allPagesText = [];
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    allPagesText.push(textContent.items.map((item: any) => item.str).join(' '));
                }
                extractedText = allPagesText.join('\n\n');
            } else if (file.type.startsWith('image/')) {
                const Tesseract = (window as any).Tesseract;
                if (!Tesseract) throw new Error("Libreria Tesseract.js non caricata per OCR.");
                const worker = await Tesseract.createWorker('ita');
                const { data: { text } } = await worker.recognize(file);
                extractedText = text;
                await worker.terminate();
            } else {
                throw new Error('Formato file non supportato. Carica un PDF o un\'immagine.');
            }

            if (!extractedText.trim()) {
                throw new Error("Impossibile estrarre testo dal file. Potrebbe essere un PDF scansionato o un'immagine vuota.");
            }

            updateNotification(notificationId, { message: 'Il Tutor AI sta analizzando l\'esercizio...' });

            const topicsForAI = (allEsercizioTopics[selectedSubject] || []).map(t => ({ id: t.id, title: t.title }));
            if (topicsForAI.length === 0) {
                throw new Error('Nessun argomento (pointer) trovato in questa materia. Crea prima dei pointers analizzando una dispensa.');
            }
            
            const langInstruction = language === 'it' ? 'italiano' : 'inglese';

            const prompt = `Sei un professore universitario per la materia "${selectedSubject}". Analizza il testo del seguente esercizio.
1.  Identifica l'argomento (pointer) più pertinente a cui appartiene, scegliendo dalla lista fornita.
2.  Separa il testo in "domanda" e "soluzione". Se non riesci a distinguerli, metti tutto il testo nella domanda e lascia la soluzione vuota.
3.  Fornisci una breve motivazione per la tua scelta dell'argomento.
Usa la sintassi LaTeX (delimitata da $...$ per inline e $$...$$ per blocco) per tutte le formule matematiche.

--- TESTO ESERCIZIO ---
${extractedText}
---

--- LISTA ARGOMENTI (POINTERS) ---
${JSON.stringify(topicsForAI)}
---

Rispondi ESCLUSIVAMENTE con un oggetto JSON in lingua ${langInstruction} con questa struttura: { "suggested_topic_id": string, "reasoning": string, "extracted_question": string, "extracted_solution": string }`;
            
            const schema = {
                type: Type.OBJECT,
                properties: {
                    suggested_topic_id: { type: Type.STRING },
                    reasoning: { type: Type.STRING },
                    extracted_question: { type: Type.STRING },
                    extracted_solution: { type: Type.STRING }
                },
                required: ["suggested_topic_id", "reasoning", "extracted_question", "extracted_solution"]
            };

            const response = await generateContentWithModelSwitching({
                contents: prompt,
                config: { responseMimeType: "application/json", responseSchema: schema }
            });

            const result = JSON.parse(response.text.trim());
            updateNotification(notificationId, { message: 'Analisi completata!', type: 'success', duration: 4000 });
            return result;

        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : String(e);
            updateNotification(notificationId, { message: `Errore analisi: ${errorMessage}`, type: 'error', duration: 6000 });
            return null;
        } finally {
            setIsProcessingAI(false);
        }
    }, [selectedSubject, allEsercizioTopics, addNotification, updateNotification, generateContentWithModelSwitching, language]);
    
    const handleSaveExternalExercise = useCallback(async (topicId: string, question: string, solution: string, fileName: string) => {
        const newInstance: EsercizioInstance = { 
            id: Date.now().toString(), 
            topicId: topicId, 
            question: question, 
            solution: solution, 
            createdAt: new Date().toISOString(), 
            status: 'in-progress', 
            userSolutionContent: '',
            sourceFileName: fileName,
            generatedType: 'exercise'
        };

        await db.transaction('rw', db.appState, async () => {
            const topicsState = await db.appState.get('allEsercizioTopics') || { key: 'allEsercizioTopics', value: {} };
            const allTopics = topicsState.value;
            const subjectTopics = allTopics[selectedSubject] || [];
            const topicToUpdate = subjectTopics.find((t: EsercizioTopic) => t.id === topicId);
            if (topicToUpdate) {
                const exStats = topicToUpdate.exerciseStats || { appearances: 0, completed: 0 };
                topicToUpdate.exerciseStats = { ...exStats, appearances: exStats.appearances + 1 };
                topicToUpdate.lastPracticed = new Date().toISOString();
                await db.appState.put(topicsState);
            }

            const instancesState = await db.appState.get('allEsercizioInstances') || { key: 'allEsercizioInstances', value: {} };
            const allInstances = instancesState.value;
            allInstances[selectedSubject] = [...(allInstances[selectedSubject] || []), newInstance];
            await db.appState.put(instancesState);
        });

        refreshData();
        addNotification({ message: 'Esercizio importato con successo!', type: 'success' });
    }, [selectedSubject, addNotification, refreshData]);

    // Oral Exam Handlers
    const handleStartOralExam = useCallback(async (simulation: SavedSimulation): Promise<string> => {
        setIsProcessingAI(true);
        const langInstruction = language === 'it' ? 'italiano' : 'inglese';
        try {
            const prompt = `Sei un professore universitario per la materia "${selectedSubject}". Stai per iniziare un esame orale con uno studente. Il suo esame scritto ha ottenuto un punteggio di ${simulation.grade.toFixed(1)}/30. Inizia l'esame orale con una domanda di apertura in ${langInstruction} basandoti sugli argomenti delle dispense: ${simulation.dispensaNames.join(', ')}.`;
            const response = await generateContentWithModelSwitching({ contents: prompt });
            return response.text;
        } finally {
            setIsProcessingAI(false);
        }
    }, [selectedSubject, generateContentWithModelSwitching, language]);

    const handleContinueOralExam = useCallback(async (simulation: SavedSimulation, history: ChatMessage[]): Promise<string> => {
        setIsProcessingAI(true);
        const langInstruction = language === 'it' ? 'italiano' : 'inglese';
        const transcript = history.map(m => `${m.role === 'user' ? 'Studente' : 'Professore'}: ${m.text}`).join('\n');
        try {
            const prompt = `Sei un professore universitario per la materia "${selectedSubject}" e stai conducendo un esame orale. Continua la conversazione in ${langInstruction}. Sii professionale ma incoraggiante. Ecco la trascrizione finora:\n\n${transcript}\n\nQual è la tua prossima domanda o commento?`;
            const response = await generateContentWithModelSwitching({ contents: prompt });
            return response.text;
        } finally {
            setIsProcessingAI(false);
        }
    }, [selectedSubject, generateContentWithModelSwitching, language]);

    const handleFinishAndEvaluateOralExam = useCallback(async (simulation: SavedSimulation, history: ChatMessage[]): Promise<void> => {
        const notificationId = addNotification({ message: 'Valutazione finale dell\'esame orale in corso...', type: 'loading' });
        setIsProcessingAI(true);
        const langInstruction = language === 'it' ? 'italiano' : 'inglese';
        const transcript = history.map(m => `${m.role === 'user' ? 'Studente' : 'Professore'}: ${m.text}`).join('\n');

        try {
            const prompt = `Sei un professore universitario per la materia "${selectedSubject}". L'esame orale con uno studente è terminato.
- Voto dello scritto: ${simulation.grade.toFixed(1)}/30
- Trascrizione dell'orale:\n${transcript}\n
Basandoti su tutto, fornisci una valutazione finale e un voto complessivo da 1 a 30 in ${langInstruction}. La parte orale dovrebbe pesare circa il 30-40% del voto finale. Rispondi ESCLUSIVAMENTE con un oggetto JSON con questa struttura: { "evaluation": "...", "final_grade": ... }`;
            
            const schema = { type: Type.OBJECT, properties: { evaluation: { type: Type.STRING }, final_grade: { type: Type.NUMBER } }, required: ["evaluation", "final_grade"] };
            const response = await generateContentWithModelSwitching({ contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema } });
            const result: { evaluation: string; final_grade: number } = JSON.parse(response.text.trim());

            const updatedSim: SavedSimulation = {
                ...simulation,
                oralTranscript: history,
                oralEvaluation: result.evaluation,
                finalGrade: Math.min(30, Math.max(1, result.final_grade)),
                status: 'completed',
            };
            
            const simsState = await db.appState.get('allSimulations') || { key: 'allSimulations', value: {} };
            const allSimulations = simsState.value;
            const existingSims = allSimulations[selectedSubject] || [];
            const simIndex = existingSims.findIndex((s: SavedSimulation) => s.id === updatedSim.id);
            if (simIndex > -1) {
                existingSims[simIndex] = updatedSim;
            }
            allSimulations[selectedSubject] = existingSims;
            await db.appState.put({ key: 'allSimulations', value: allSimulations });

            updateNotification(notificationId, { message: 'Esame completato e valutato!', type: 'success', duration: 5000 });
            refreshData();
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : String(e);
            updateNotification(notificationId, { message: `Errore valutazione orale: ${errorMessage}`, type: 'error', duration: 6000 });
        } finally {
            setIsProcessingAI(false);
        }
    }, [selectedSubject, generateContentWithModelSwitching, addNotification, updateNotification, refreshData, language]);


    const clearError = useCallback(() => setError(null), []);
    const onClearLesson = useCallback(async () => { await db.appState.delete('currentLesson'); refreshData(); }, [refreshData]);

    const handleNavigate = (subject: string, view: string) => {
        setSelectedSubject(subject);
        setActiveView(view);
    };

    const renderMainContent = () => {
         if (isLoading) {
            return <div className="text-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div><p className="mt-4">Caricamento dati...</p></div>;
         }
        
        switch (activeView) {
            case 'dashboard': return <DashboardView data={dashboardData} subjects={subjects} onSubjectAdd={handleAddSubject} onSubjectDelete={handleDeleteSubject} onSubjectRename={handleRenameSubject} onNavigate={handleNavigate} t={t} />;
            case 'databaseApp': return <DatabaseAppView selectedSubject={selectedSubject} dataVersion={dataVersion} t={t} />;
            case 'details': 
                if (!selectedSubject) return <div className="text-center text-gray-400">Seleziona una materia per visualizzarne i dettagli, o creane una nuova dalla Dashboard.</div>;
                return <DettagliMateriaView selectedSubject={selectedSubject} details={subjectsData[selectedSubject]} onSave={handleUpdateSubjectDetails} t={t} />;
            case 'dispense': 
                if (!selectedSubject) return <div className="text-center text-gray-400">Seleziona una materia per gestire le dispense, o creane una nuova dalla Dashboard.</div>;
                return <DispenseView 
                    subjectName={selectedSubject} 
                    onSave={handleSaveDispensa} 
                    onDelete={handleDeleteDispensa} 
                    onUpdateStudiedPages={handleUpdateStudyProgress} 
                    onAskTutorQuestion={handleAskTutorQuestion} 
                    isProcessing={isProcessingAI} 
                    dataVersion={dataVersion} 
                    t={t}
                    onSaveNote={handleSaveNote}
                    onDeleteNote={handleDeleteNote}
                    onGetAiReviewForNote={handleGetAiReview}
                />;
            case 'appunti': 
                if (!selectedSubject) return <div className="text-center text-gray-400">Seleziona una materia per gestire gli appunti, o creane una nuova dalla Dashboard.</div>;
                return <AppuntiView subjectName={selectedSubject} onSave={handleSaveNote} onDelete={handleDeleteNote} onGetAiReview={handleGetAiReview} isProcessingAI={isProcessingAI} dataVersion={dataVersion} t={t} />;
            case 'esercitazioni': 
                if (!selectedSubject) return <div className="text-center text-gray-400">Seleziona una materia per fare esercitazioni, o creane una nuova dalla Dashboard.</div>;
                return <EsercitazioniView 
                    selectedSubject={selectedSubject}
                    macroTopics={allMacroTopics[selectedSubject] || []}
                    esercizioTopics={allEsercizioTopics[selectedSubject] || []}
                    esercizioInstances={allEsercizioInstances[selectedSubject] || []}
                    pointerVisibility={pointerVisibility}
                    onCreateEsercizio={handleCreateEsercizio} 
                    onUpdateEsercizio={handleUpdateEsercizioInstance}
                    onCorrectEsercizio={handleCorrectEsercizio} 
                    onDeleteTopic={handleDeleteEsercizioTopic} 
                    onAskForHelp={handleAskForExerciseHelp} 
                    onAnalyzeExternalExercise={handleAnalyzeExternalExercise}
                    onSaveExternalExercise={handleSaveExternalExercise}
                    isProcessingAI={isProcessingAI}
                    error={error}
                    clearError={clearError}
                    t={t}
                />;
            case 'chat': 
                if (!selectedSubject) return <div className="text-center text-gray-400">Seleziona una materia per avviare una lezione, o creane una nuova dalla Dashboard.</div>;
                return <ChatTutorAIView 
                    selectedSubject={selectedSubject} 
                    dispense={dispense}
                    allThumbnails={allThumbnails}
                    lesson={currentLesson ? currentLesson.steps : null}
                    currentTopicTitle={currentLesson ? currentLesson.topic.title : ''}
                    onGenerateCustomLesson={handleGenerateCustomLesson} 
                    onLessonFinish={handleLessonFinish} 
                    onAskTutorQuestion={handleAskTutorQuestion} 
                    onClearLesson={onClearLesson} 
                    isGenerating={isProcessingAI}
                    error={error}
                    t={t}
                />;
            case 'lessonDiary': 
                if (!selectedSubject) return <div className="text-center text-gray-400">Seleziona una materia per vedere il diario, o creane una nuova dalla Dashboard.</div>;
                return <DiarioLezioniView 
                    selectedSubject={selectedSubject} 
                    diaries={allDiaries[selectedSubject] || []}
                    t={t}
                />;
            case 'simulations': 
                if (!selectedSubject) return <div className="text-center text-gray-400">Seleziona una materia per fare simulazioni, o creane una nuova dalla Dashboard.</div>;
                return <SimulazioniEsamiView 
                    key={selectedSubject} 
                    selectedSubject={selectedSubject}
                    dispense={dispense}
                    simulations={allSimulations[selectedSubject] || []}
                    subjectDetails={subjectsData[selectedSubject]}
                    onGenerate={handleGenerateSimulation}
                    onLearnExamStructure={handleLearnExamStructure}
                    onSave={handleSaveSimulation} 
                    onStartOralExam={handleStartOralExam}
                    onContinueOralExam={handleContinueOralExam}
                    onFinishOralExam={handleFinishAndEvaluateOralExam}
                    isGenerating={isProcessingAI}
                    error={error}
                    clearError={clearError}
                    t={t}
                    dataVersion={dataVersion}
                />;
            case 'calendario': return <CalendarioView subjects={subjects} allSubjectsData={subjectsData} onAddEvent={handleAddCalendarEvent} t={t} />;
            case 'impostazioni': return <ImpostazioniView theme={theme} onThemeChange={handleThemeChange} language={language} onLanguageChange={handleLanguageChange} pointerVisibility={pointerVisibility} onPointerVisibilityChange={handlePointerVisibilityChange} t={t} />;
            case 'pdfReader': return <div className="w-full max-w-5xl flex-grow flex flex-col items-center"><header className="w-full max-w-5xl mb-6 text-center"><h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">Visualizzatore Documenti</h1><p className="text-gray-400 mt-2 text-lg">Analizza e studia il tuo documento caricato.</p></header>{error && <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg relative mb-6 w-full text-center" role="alert"><strong className="font-bold">Errore: </strong><span className="block sm:inline">{error}</span></div>}{pdfDoc && (<div className="bg-gray-800 rounded-2xl shadow-2xl p-4 sm:p-6 w-full flex flex-col items-center"><div className="w-full flex justify-between items-center mb-4"><p className="text-sm sm:text-base font-medium truncate pr-4" title={file?.name}><span className="font-bold">File:</span> {file?.name}</p><button onClick={resetApp} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 text-sm whitespace-nowrap">Carica un altro file</button></div>{isLoading ? (<div className="flex flex-col items-center justify-center h-96"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div><p className="mt-4 text-gray-400">Caricamento del documento...</p></div>) : (<><Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} /><PdfViewer pdfDoc={pdfDoc} pageNumber={currentPage} /><Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} /></>)}</div>)}<footer className="w-full max-w-5xl mt-8 text-center text-gray-500 text-sm"><p>Creato con React, TypeScript e Tailwind CSS. Powered by PDF.js.</p></footer></div>;
            default: return <DashboardView data={dashboardData} subjects={subjects} onSubjectAdd={handleAddSubject} onSubjectDelete={handleDeleteSubject} onSubjectRename={handleRenameSubject} onNavigate={handleNavigate} t={t} />;
        }
    }

    return (
        <div className="min-h-screen bg-gray-900 text-gray-200">
            <WelcomeModal isOpen={isFirstLaunch} onClose={() => setIsFirstLaunch(false)} t={t} />
            <VersionOneWelcomeModal isOpen={showVersionOneWelcome} onClose={() => setShowVersionOneWelcome(false)} t={t} />
            {isUpdateModalOpen && latestVersionInfo && <UpdateAvailableModal isOpen={isUpdateModalOpen} onClose={() => setUpdateModalOpen(false)} versionInfo={latestVersionInfo} />}
            <Notifications notifications={notifications} onDismiss={removeNotification} />
            <Sidebar isOpen={isSidebarOpen && !isLessonActive} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} subjects={subjects} selectedSubject={selectedSubject} onSubjectChange={setSelectedSubject} activeView={activeView} onViewChange={setActiveView} t={t} />
            <main className={`relative min-h-screen flex flex-col items-center p-4 sm:p-8 transition-all duration-300 ease-in-out ${isSidebarOpen && !isLessonActive ? 'ml-64' : 'ml-20'} ${isLessonActive ? 'ml-0 p-0' : ''}`}>
               {!isLessonActive && <HelpTutorial activeView={activeView} t={t} />}
               {renderMainContent()}
            </main>
            <GlobalChat isOpen={isGlobalChatOpen} onClose={() => setIsGlobalChatOpen(false)} subjectName={selectedSubject} onSendMessage={handleSendGlobalChatMessage} isProcessing={isProcessingAI} dataVersion={dataVersion} t={t} />
        </div>
    );
};

export default App;