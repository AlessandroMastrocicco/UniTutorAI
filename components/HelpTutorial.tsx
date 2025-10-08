import React, { useState } from 'react';

// Icons
const HelpIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);
const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

interface TutorialContent {
    title: string;
    content: React.ReactNode;
}

const TutorialText: React.FC<{ children: React.ReactNode }> = ({ children }) => <p className="text-gray-300 mb-4 leading-relaxed">{children}</p>;
const TutorialHeading: React.FC<{ children: React.ReactNode }> = ({ children }) => <h3 className="text-xl font-bold text-indigo-300 mt-5 mb-2">{children}</h3>;
const TutorialList: React.FC<{ children: React.ReactNode }> = ({ children }) => <ul className="list-disc list-inside space-y-2 my-3 text-gray-300">{children}</ul>;

const getTutorialContent = (activeView: string, t: (key: string) => string): TutorialContent | null => {
    switch (activeView) {
        case 'dashboard':
            return {
                title: 'Guida: Dashboard',
                content: (
                    <>
                        <TutorialText>La Dashboard è la tua centrale di comando. Qui hai una visione d'insieme di tutto ciò che riguarda la tua carriera universitaria.</TutorialText>
                        <TutorialHeading>Agenda del Giorno</TutorialHeading>
                        <TutorialText>Questo riquadro mostra tutti i tuoi impegni per oggi: lezioni, esami programmati e eventi di studio personali che hai aggiunto nel calendario.</TutorialText>
                        <TutorialHeading>Prossimi Esami</TutorialHeading>
                        <TutorialText>Tieni sotto controllo le scadenze importanti. Qui vedrai un elenco degli esami programmati nei prossimi 14 giorni, con un comodo conto alla rovescia.</TutorialText>
                        <TutorialHeading>Focus Studio</TutorialHeading>
                        <TutorialText>Per aiutarti a rimanere in pari, l'app ti suggerisce le 3 dispense che hai studiato di meno, calcolando la percentuale di pagine completate.</TutorialText>
                        <TutorialHeading>Gestione Materie</TutorialHeading>
                        <TutorialText>Usa il pulsante <strong>"Gestisci Materie"</strong> per aggiungere nuovi corsi al tuo piano di studi, rinominare quelli esistenti o eliminarli. <strong>Attenzione:</strong> l'eliminazione di una materia è irreversibile e cancellerà tutti i dati associati (dispense, appunti, simulazioni, ecc.).</TutorialText>
                    </>
                )
            };
        case 'details':
            return {
                title: 'Guida: Dettagli Materia',
                content: (
                    <>
                        <TutorialText>Questa sezione contiene tutte le informazioni amministrative e logistiche relative alla materia selezionata.</TutorialText>
                        <TutorialHeading>Riepilogo Materia</TutorialHeading>
                        <TutorialText>Qui puoi visualizzare rapidamente i CFU, le statistiche sulle simulazioni d'esame che hai svolto e il voto medio ottenuto.</TutorialText>
                        <TutorialHeading>Informazioni Utili</TutorialHeading>
                        <TutorialText>Consulta facilmente i dettagli sui docenti, gli orari delle lezioni con le relative aule e le date ufficiali degli appelli d'esame.</TutorialText>
                        <TutorialHeading>Modifica Dati</TutorialHeading>
                        <TutorialText>Clicca sul pulsante <strong>"Modifica Dati"</strong> per aprire un pannello completo. Da lì potrai aggiornare tutte le informazioni, aggiungere nuovi orari, date d'esame o contatti dei professori per tenere tutto perfettamente organizzato.</TutorialText>
                    </>
                )
            };
        case 'dispense':
            return {
                title: 'Guida: Dispense Materia',
                content: (
                    <>
                        <TutorialText>Questa è la sezione fondamentale dove carichi e gestisci il tuo materiale di studio. Le dispense caricate qui sono la base per tutte le funzionalità AI dell'app.</TutorialText>
                        <TutorialHeading>Caricamento e Analisi AI</TutorialHeading>
                        <TutorialList>
                            <li>Clicca su <strong>"Carica Nuova Dispensa"</strong> per importare un file PDF.</li>
                            <li>Nella schermata successiva, potrai selezionare solo le pagine che ti interessano, escludendo copertine o parti non necessarie.</li>
                            <li>Dopo il salvataggio, l'AI analizza il documento in background per estrarre gli argomenti principali (Macro-argomenti) e i concetti specifici (Pointers). Questo processo è cruciale per alimentare le esercitazioni, le lezioni e le simulazioni.</li>
                        </TutorialList>
                        <TutorialHeading>Visualizzazione e Studio</TutorialHeading>
                        <TutorialText>Clicca su una dispensa per aprirla in un visualizzatore a schermo intero. All'interno, puoi usare il pulsante <strong>"Modifica"</strong> in basso per aprire un pannello e segnare le pagine che hai già studiato. Questo aggiornerà la barra di progresso e il livello di comprensione.</TutorialText>
                        <TutorialHeading>Tutor AI Contestuale e Appunti</TutorialHeading>
                        <TutorialText>Mentre visualizzi una dispensa, apri la chat <strong>"Tutor AI"</strong> (icona a forma di scintilla) per fare domande specifiche. L'AI risponderà basandosi esclusivamente sul contenuto della pagina che stai leggendo. Puoi anche aprire il pannello <strong>"Appunti"</strong> per scrivere note direttamente a fianco del PDF, mantenendo tutto il contesto in un unico posto.</TutorialText>
                    </>
                )
            };
         case 'appunti':
            return {
                title: 'Guida: Appunti',
                content: (
                    <>
                        <TutorialText>Questa sezione è il tuo quaderno digitale, potenziato dall'intelligenza artificiale.</TutorialText>
                        <TutorialHeading>Organizzazione Gerarchica</TutorialHeading>
                        <TutorialText>Crea una struttura di appunti ordinata. Puoi aggiungere "Nuovo Argomento" a livello principale o creare sotto-argomenti annidati per organizzare le informazioni in modo logico. Usa i pulsanti che appaiono al passaggio del mouse su un argomento per aggiungere un sotto-appunto o per eliminarlo.</TutorialText>
                        <TutorialHeading>Editor Avanzato</TutorialHeading>
                        <TutorialText>L'editor ti permette non solo di formattare il testo, ma anche di passare alla modalità <strong>"Disegna"</strong>. Questa funzione trasforma l'area di testo in una tela dove puoi aggiungere schemi, grafici e formule a mano libera. Quando torni alla modalità testo, il tuo disegno viene inserito direttamente nell'appunto come un'immagine.</TutorialText>
                        <TutorialHeading>Recensione AI</TutorialHeading>
                        <TutorialText>Dopo aver scritto i tuoi appunti, clicca su <strong>"Recensione AI"</strong>. Puoi scegliere di fornire una delle tue dispense come contesto: l'AI confronterà i tuoi appunti con il materiale originale per darti suggerimenti pertinenti e identificare nuovi concetti corretti che hai aggiunto, trasformandoli in nuovi "pointers" per le esercitazioni.</TutorialText>
                    </>
                )
            };
        case 'esercitazioni':
            return {
                title: 'Guida: Esercitazioni',
                content: (
                    <>
                        <TutorialText>Metti alla prova la tua comprensione con esercizi mirati, generati dall'AI sugli argomenti specifici delle tue dispense.</TutorialText>
                        <TutorialHeading>Macro-argomenti e Pointers</TutorialHeading>
                        <TutorialText>La sezione è organizzata per "Macro-argomenti" e "Pointers" (micro-argomenti specifici), estratti automaticamente dall'AI quando carichi una dispensa.</TutorialText>
                        <TutorialHeading>Genera, Risolvi e Carica</TutorialHeading>
                        <TutorialList>
                            <li>Clicca su un pointer, poi su <strong>"Crea Nuovo Esercizio"</strong>. L'AI genererà un esercizio su misura basandosi sul contenuto e sulle tue performance passate.</li>
                            <li>Risolvi l'esercizio scrivendo, disegnando o caricando una foto/PDF della tua soluzione.</li>
                            <li>Usa il pulsante <strong>"Carica Esercizio da File"</strong> per importare esercizi esterni. L'AI li analizzerà, li associerà al pointer corretto e li aggiungerà alla tua lista di pratica.</li>
                        </TutorialList>
                        <TutorialHeading>Aiuto dal Tutor e Feedback</TutorialHeading>
                        <TutorialText>Se sei bloccato, clicca su <strong>"Chiedi al Tutor AI"</strong> per un suggerimento. Se un esercizio è troppo difficile o troppo facile, usa i pulsanti "Crea più semplice" o "Crea più difficile" per ricevere una nuova versione più adatta al tuo livello.</TutorialText>
                    </>
                )
            };
        case 'chat':
            return {
                title: 'Guida: Lezione con Tutor',
                content: (
                     <>
                        <TutorialText>Trasforma le tue dispense in lezioni audio interattive, spiegate da un tutor AI.</TutorialText>
                        <TutorialHeading>Crea una Lezione Personalizzata</TutorialHeading>
                        <TutorialText>Seleziona una delle tue dispense, specifica l'intervallo di pagine che vuoi approfondire e dai un titolo alla lezione. L'AI analizzerà il contenuto e preparerà una spiegazione audio strutturata, passo dopo passo.</TutorialText>
                        <TutorialHeading>Player Interattivo</TutorialHeading>
                        <TutorialText>Una volta generata la lezione, si aprirà un player. Usa i controlli per avviare, mettere in pausa o fermare la spiegazione. L'audio del tutor sarà sincronizzato con la visualizzazione delle slide, estratte direttamente dalle pagine della tua dispensa.</TutorialText>
                        <TutorialHeading>Fai Domande Durante la Lezione</TutorialHeading>
                        <TutorialText>In qualsiasi momento, puoi mettere in pausa la lezione e cliccare sull'icona con il punto di domanda. Si aprirà una chat dove potrai chiedere chiarimenti sull'argomento che il tutor sta spiegando. La domanda e la risposta verranno inserite direttamente nel copione della lezione.</TutorialText>
                         <TutorialHeading>Salvataggio nel Diario</TutorialHeading>
                        <TutorialText>Al termine della lezione, la trascrizione completa verrà salvata automaticamente nella sezione <strong>"Diario Lezioni"</strong>, così potrai rileggerla quando vuoi.</TutorialText>
                    </>
                )
            };
        case 'lessonDiary':
            return {
                title: 'Guida: Diario Lezioni',
                content: (
                    <>
                        <TutorialText>Questa sezione è il tuo archivio personale di tutte le lezioni che hai completato con il Tutor AI.</TutorialText>
                        <TutorialHeading>Rivedi le Tue Lezioni</TutorialHeading>
                        <TutorialText>Ogni volta che termini una "Lezione con Tutor", la sua trascrizione completa viene salvata qui. Puoi rileggere le spiegazioni, rivedere gli argomenti trattati e consolidare la tua conoscenza in qualsiasi momento.</TutorialText>
                        <TutorialHeading>Organizzazione Cronologica</TutorialHeading>
                        <TutorialText>Le lezioni sono organizzate dalla più recente alla più vecchia, permettendoti di trovare facilmente le ultime sessioni di studio.</TutorialText>
                    </>
                )
            };
        case 'simulations':
            return {
                title: 'Guida: Simulazioni Esami',
                content: (
                    <>
                        <TutorialText>Metti alla prova la tua preparazione con simulazioni d'esame realistiche e personalizzate, generate dall'intelligenza artificiale.</TutorialText>
                        <TutorialHeading>Tre Percorsi per la Pratica</TutorialHeading>
                        <TutorialText>La sezione Simulazioni offre tre modi principali per prepararti:</TutorialText>
                        <TutorialList>
                            <li><strong>Crea Nuova Simulazione:</strong> Scegli tra la modalità `Personalizzata` (dove decidi tu ogni dettaglio: dispense, struttura, durata) o `Guidata` (dove l'AI crea un esame ottimale basato sui tuoi progressi e sulle tracce passate).</li>
                            <li><strong>Tracce Vecchi Scritti:</strong> Carica i PDF di vecchi esami. L'AI li analizza per estrarne la struttura e gli argomenti, permettendoti di usarli come modello o di visualizzare un'analisi dettagliata della tua preparazione per quella specifica traccia.</li>
                            <li><strong>Visualizza Esami Completati:</strong> Rivedi tutte le tue simulazioni passate, i punteggi, le correzioni e i feedback dell'AI per imparare dai tuoi errori.</li>
                        </TutorialList>
                        <TutorialHeading>Generazione Adattiva e Feedback Dettagliato</TutorialHeading>
                        <TutorialText>L'AI non crea domande a caso. Analizza le tue performance passate e dà priorità agli argomenti su cui hai maggiori difficoltà. Al termine, per le risposte aperte, l'AI fornisce una valutazione dettagliata, aggiornando il tuo livello di padronanza sull'argomento.</TutorialText>
                    </>
                )
            };
        case 'databaseApp':
             return {
                title: 'Guida: Database Materia',
                content: (
                     <>
                        <TutorialText>Questa è la tua centrale analitica. Qui puoi visualizzare in modo strutturato tutti i "pointers" (micro-argomenti) che l'AI ha estratto dalle tue dispense e dai tuoi appunti per la materia selezionata.</TutorialText>
                        <TutorialHeading>Livello di Padronanza</TutorialHeading>
                        <TutorialText>Per ogni pointer, l'app calcola un <strong>"Livello di Padronanza"</strong> in percentuale. Questo valore si basa sulle tue performance aggregate nelle sezioni "Esercitazioni" e "Simulazioni Esami", dandoti un'indicazione chiara e immediata dei tuoi punti di forza e delle tue debolezze.</TutorialText>
                        <TutorialHeading>Identifica le Lacune</TutorialHeading>
                        <TutorialText>Usa questa vista per identificare rapidamente gli argomenti con un livello di padronanza basso. Questo ti permette di focalizzare il ripasso e le esercitazioni future esattamente dove ne hai più bisogno, ottimizzando il tuo tempo di studio.</TutorialText>
                        <TutorialHeading>Esplora i Contenuti</TutorialHeading>
                        <TutorialText>Cliccando su un pointer, puoi visualizzare il contenuto testuale originale da cui è stato estratto, per un ripasso veloce e contestualizzato.</TutorialText>
                    </>
                )
            };
        case 'calendario':
            return {
                title: 'Guida: Calendario',
                content: (
                    <>
                        <TutorialText>Organizza la tua settimana e non perdere mai un impegno con il calendario integrato.</TutorialText>
                        <TutorialHeading>Vista Settimanale</TutorialHeading>
                        <TutorialText>Il calendario ti offre una visione chiara di tutti i tuoi impegni accademici: lezioni, esami e sessioni di studio personali. Gli eventi sono colorati in base alla materia per una facile identificazione.</TutorialText>
                        <TutorialHeading>Navigazione e Filtri</TutorialHeading>
                        <TutorialText>Usa le frecce per spostarti tra le settimane e clicca su <strong>"Oggi"</strong> per tornare rapidamente alla settimana corrente. Puoi anche usare i filtri in alto per mostrare o nascondere gli eventi di specifiche materie.</TutorialText>
                        <TutorialHeading>Crea Eventi Personalizzati</TutorialHeading>
                        <TutorialText>Clicca su <strong>"Crea Evento"</strong> per aggiungere impegni come sessioni di studio, ricevimenti dei professori o altri appuntamenti. Puoi scegliere se creare un evento singolo o uno che si ripete ogni settimana allo stesso orario.</TutorialText>
                    </>
                )
            };
        case 'impostazioni':
            return {
                title: 'Guida: Impostazioni',
                content: (
                    <>
                        <TutorialText>Personalizza l'applicazione secondo le tue preferenze.</TutorialText>
                        <TutorialHeading>Aspetto</TutorialHeading>
                        <TutorialList>
                            <li><strong>Tema Chiaro:</strong> Attiva un'interfaccia con sfondo chiaro.</li>
                            <li><strong>Lingua:</strong> Seleziona la lingua per l'interfaccia e per le risposte del Tutor AI.</li>
                        </TutorialList>
                        <TutorialHeading>Logica dell'App</TutorialHeading>
                        <TutorialList>
                            <li><strong>Visibilità Pointers:</strong> Scegli se visualizzare tutti i micro-argomenti (pointers) o solo quelli che hai "affrontato" (studiando le relative pagine della dispensa). Questa impostazione influenzerà quali argomenti saranno disponibili per le esercitazioni e le simulazioni in modalità guidata.</li>
                        </TutorialList>
                    </>
                )
            };
        default:
            return null;
    }
};

export const HelpTutorial: React.FC<{ activeView: string, t: (key: string) => string }> = ({ activeView, t }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const tutorial = getTutorialContent(activeView, t);

    if (!tutorial) {
        return null;
    }

    const buttonPosition = activeView === 'calendario' ? 'right-48' : 'right-6';

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className={`absolute top-6 ${buttonPosition} z-40 p-3 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-transform hover:scale-110`}
                title="Apri tutorial della sezione"
                aria-label="Apri tutorial della sezione"
            >
                <HelpIcon />
            </button>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-[100] p-4" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col h-[85vh]" onClick={e => e.stopPropagation()}>
                        <header className="flex-shrink-0 p-4 flex justify-between items-center border-b border-gray-700">
                            <h2 className="text-xl font-bold text-white">{tutorial.title}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-white rounded-full">
                                <CloseIcon />
                            </button>
                        </header>
                        <div className="flex-1 p-6 overflow-y-auto">
                            {tutorial.content}
                        </div>
                        <footer className="bg-gray-900/50 px-6 py-3 flex justify-end rounded-b-2xl border-t border-gray-700">
                            <button onClick={() => setIsModalOpen(false)} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">Chiudi</button>
                        </footer>
                    </div>
                </div>
            )}
        </>
    );
};