import Dexie, { type Table } from 'dexie';
import type { SubjectDetails, SavedDispensa, Appunto, LessonDiary, SavedSimulation, MacroTopic, EsercizioTopic, EsercizioInstance, ChatMessage, Thumbnail, LearnedExam, ExamTraceAnalysis, ExamStructure } from './types';

// Interfaccia per archiviare oggetti di stato di grandi dimensioni in modo chiave-valore
export interface AppState {
    key: string;
    value: any;
}

// Tipi specifici per l'archiviazione strutturata delle dispense nel DB
export interface DbDispensa extends SavedDispensa {
    subjectName: string;
}

export interface DbPdfFile {
    dispensaId: string;
    file: Blob;
}

export interface DbThumbnail extends Thumbnail {
    dispensaId: string;
}

export interface DbPastExam {
    id: string; // Corresponds to LearnedExam.id
    subjectName: string;
    fileName: string;
    file: Blob;
    structure: ExamStructure;
    analysis?: ExamTraceAnalysis[];
}

// FIX: Switched from subclassing Dexie to a direct instance with casting.
// This resolves TypeScript errors where methods like 'version' and 'transaction' were not found on the db instance type.
const db = new Dexie('UniTutorAIDatabase') as Dexie & {
    appState: Table<AppState, string>;
    dispense: Table<DbDispensa, string>;
    pdfFiles: Table<DbPdfFile, string>;
    thumbnails: Table<DbThumbnail, number>;
    pastExams: Table<DbPastExam, string>;
};

db.version(1).stores({
    // 'key' è l'indice primario. Usato per archiviare oggetti di stato completi.
    appState: 'key',
    // '&id' indica un indice primario unico, 'subjectName' è un indice per query veloci.
    dispense: '&id, subjectName',
    // Chiave primaria che corrisponde all'ID della dispensa
    pdfFiles: '&dispensaId',
    // '++id' è una chiave primaria auto-incrementante, 'dispensaId' per le ricerche.
    thumbnails: '++id, dispensaId',
});

db.version(2).stores({
    pastExams: '&id, subjectName',
});

export { db };