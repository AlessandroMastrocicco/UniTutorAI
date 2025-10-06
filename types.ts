// Dichiarazione globale per la funzione di rendering di KaTeX
declare global {
  interface Window {
    renderMathInElement: (element: HTMLElement, options?: any) => void;
    electronAPI?: {
        getApiKey: () => Promise<string | undefined>;
        getAppVersion: () => Promise<string>;
    };
  }
}

export interface AppNotification {
    id: string;
    message: string;
    type: 'loading' | 'success' | 'error';
    duration?: number; // in ms
}


export interface PDFPageProxy {
    pageNumber: number;
    getViewport: (options: { scale: number }) => { width: number; height: number; };
    render: (options: { canvasContext: CanvasRenderingContext2D; viewport: any; }) => { promise: Promise<void> };
}

export interface PDFDocumentProxy {
    numPages: number;
    getPage: (pageNumber: number) => Promise<PDFPageProxy>;
    destroy: () => Promise<void>;
}

export interface ExamDate {
    id: string;
    date: string;
    time?: string;
    classroom: string;
    type: string;
}

export interface LessonSlot {
    id: string;
    day: string;
    startTime: string;
    endTime: string;
    classroom: string;
    professorId?: string;
}

export type CalendarEventType = 'Lezione' | 'Esame' | 'Studio' | 'Altro' | 'Ricevimento';

export interface CalendarEvent {
    id: string;
    title: string;
    type: CalendarEventType;
    day: string;
    startTime: string;
    endTime: string;
    date?: string; // YYYY-MM-DD for one-time events
}

export interface ProfessorDetails {
    id: string;
    name: string;
    email: string;
    officeHours: string;
}

export interface ExamStructure {
    mcTheory: number;
    openTheory: number;
    mcExercise: number;
    openExercise: number;
    timer: number; // Duration in minutes
}

export interface LearnedExam {
  id: string;
  fileName: string;
  structure: ExamStructure;
}

export interface SubjectDetails {
    cfu: number;
    schedule: {
        period: string;
        lessons: LessonSlot[];
    };
    examDates: ExamDate[];
    calendarEvents?: CalendarEvent[];
    professors?: ProfessorDetails[];
    simulations: number; // Not editable
    averageGrade: string; // Not editable
    learnedExams?: LearnedExam[];
}

export interface Thumbnail {
    pageNumber: number;
    dataUrl: string;
}

export interface ContentVector {
    id: string;
    pageNumber: number;
    content: string;
    status: 'studiato' | 'non studiato';
}

export interface SavedDispensa {
    id: string;
    name: string;
    topic: string;
    fileName: string;
    totalPages: number;
    studiedPages?: string;
    contentVectors?: ContentVector[];
    comprehensionScore?: number | null;
}

export interface ChatMessage {
    id:string;
    role: 'user' | 'model';
    text: string;
}

export interface LessonStep {
  text: string;
  dispensaId: string;
  pageNumber: number;
  role?: 'tutor' | 'user-question' | 'tutor-answer';
}

export interface LessonDiary {
    id: string;
    topicId: string; // dispensaId
    topicTitle: string;
    date: string; // ISO string
    transcript: LessonStep[];
}

export type QuestionType = 'multiple-choice-theory' | 'open-ended-theory' | 'multiple-choice-exercise' | 'open-ended-exercise';

export interface SimulationQuestion {
    id: string;
    questionText: string;
    type: QuestionType;
    points: number;
    options?: string[];
    correctAnswerIndex?: number;
    userAnswerIndex: number | null;
    explanation: string;
    sourceTopic?: string;
    sourcePageNumber?: number;
    // For Open-Ended questions
    modelAnswer?: string;
    userAnswerContent?: string | null;
    aiFeedback?: string;
    aiCorrectness?: 'correct' | 'partially-correct' | 'incorrect' | 'not-evaluated';
}

export interface SavedSimulation {
    id: string;
    dispensaIds: string[];
    dispensaNames: string[];
    date: string; // ISO string
    questions: SimulationQuestion[];
    score: number; // Points scored
    totalPoints: number;
    grade: number; // Grade out of 30
    duration: number; // Duration in minutes
}


export interface SyllabusTopic {
    id: string;
    title: string;
    description: string;
    discussedWithTutor: boolean;
}

export interface SyllabusModule {
    id: string;
    title: string;
    topics: SyllabusTopic[];
}

export interface MacroTopic {
    id: string;
    title: string;
}

export type EsercizioQuestionType = 'theory' | 'exercise';

export interface EsercizioTopic {
    id: string;
    title: string;
    macroTopicId?: string;
    sourceDispensaId?: string;
    sourcePageNumbers?: number[];
    sourceNoteId?: string;
    sourceDescription: string;
    sourceContent: string;
    questionTypes?: EsercizioQuestionType[];
    simulationStats?: { appearances: number; correct: number };
    exerciseStats?: { appearances: number; completed: number };
    lastPracticed?: string; // ISO date string
    affrontato?: boolean;
}

export interface EsercizioInstance {
    id: string;
    topicId: string;
    question: string;
    solution: string; // The official solution from the AI
    createdAt: string; // ISO date string
    status: 'in-progress' | 'submitted' | 'corrected';
    userSolutionContent: string | null;
    aiFeedback?: string;
    aiCorrectness?: 'correct' | 'partially-correct' | 'incorrect' | 'not-evaluated';
    generatedType?: 'theory' | 'exercise';
    difficulty?: 'easy' | 'medium' | 'hard';
    sourceFileName?: string;
    isExamLevel?: boolean;
}


export interface GeneratedExercise {
    question: string;
    solution: string;
}

export interface Appunto {
    id: string;
    title: string;
    content: string;
    date: string; // ISO string
    parentId?: string;
}

export interface ExamTraceAnalysis {
    questionTitle: string;
    requiredTopics: string[];
}


// Tipi per la nuova Dashboard
export interface DashboardEvent {
    id: string;
    subjectName: string;
    title: string;
    type: CalendarEventType;
    startTime?: string;
    endTime?: string;
    date: Date;
    location?: string;
}

export interface FocusDispensa {
    id: string;
    name: string;
    subjectName: string;
    completion: number;
}

export interface DashboardData {
    todaysEvents: DashboardEvent[];
    upcomingExams: DashboardEvent[];
    studyFocus: FocusDispensa[];
}

export interface VersionInfo {
    currentVersion: string;
    latestVersion: string;
    url: string;
}
