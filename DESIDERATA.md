# 🧭 Desiderata di Progetto: VDS-VL Quiz Master 🛩️

Questo documento rappresenta la **bussola strategica e funzionale** del progetto. Qualsiasi agente AI o sviluppatore che approccia questa codebase deve leggere questo file per comprendere all'istante l'identità del software, i requisiti non negoziabili, lo stato attuale dei lavori e i prossimi obiettivi.

---

## 1. Visione del Prodotto

**VDS-VL Quiz Master** è una Progressive Web App (PWA) moderna, ad alte prestazioni, 100% offline-first e con interfaccia ergonomica minimale (zero distrazioni).  
È progettata per gli allievi piloti di **Volo Libero (Parapendio e Deltaplano)** che preparano l'esame teorico per il conseguimento dell'attestato VDS/VL (Volo da Diporto o Sportivo) secondo le norme vigenti dell'Aero Club d'Italia (AeCI) e del D.P.R. 133/2010.

### Principi Filosofici
1. **Zero Distrazioni & Ergonomia di Studio**: L'interfaccia è studiata per massimizzare la concentrazione e l'apprendimento veloce: contrasto elevato, leggibilità perfetta su qualsiasi schermo e condizione di luce, microcopy secco ed essenziale, zero fronzoli grafici non funzionali. L'utente sta studiando la teoria del volo per superare l'esame: ogni elemento a schermo deve servire l'apprendimento senza attrito cognitivo.
2. **Offline-First Assoluto & Zero Backend**: L'applicazione non dispone di alcun server o database remoto proprietario. Funziona al 100% offline tramite Service Worker. I dati utente risiedono esclusivamente nel browser (IndexedDB via Dexie.js).
3. **Privacy & Sovranità dei Dati**: Nessun tracciamento o profilazione. Il salvataggio cloud è opzionale, gestito direttamente dall'utente verso la propria cartella privata Google Drive (`appDataFolder`) o tramite file JSON esportabili.
4. **Apprendimento Deterministico & Anti-Frustrazione**: Risoluzione del problema statistico del "collezionista di figurine" tramite il *Fair Coverage Randomizer*, e consolidamento degli errori tramite ripetizione spaziata (Leitner).

---

## 2. Requisiti Funzionali Core (Il Desiderata)

### A. Database Ufficiale dei Quiz (504 quesiti AeCI)
- Catalogo completo e immutabile dei 504 quiz AeCI (edizione 2017) suddivisi nelle 9 materie canoniche.
- Ogni domanda ha esattamente 3 opzioni di risposta (1, 2, 3) con una sola risposta esatta verificata sulle tabelle ufficiali.
- Spiegazioni didattiche essenziali focalizzate solo su:
  - **Regola**: Principio fisico, aerodinamico o norma di legge.
  - **Tranello**: Il bias cognitivo o la trappola lessicale tipica della domanda.

### B. Modalità di Utilizzo

1. **Simulazione Esame (Didattica Tutor & Esame Ufficiale AeCI)**:
   - **Simulazione Didattica (Tutor)**:
     * 30 quesiti estratti con quote AeCI dal *Fair Coverage Randomizer*.
     * **Senza limiti di tempo**: studio rilassato senza countdown, con cronometro discreto del tempo trascorso.
     * **Feedback Didattico Immediato**: validazione cromatico-sonora ad ogni risposta, con soluzione corretta e spiegazione contestuale (**Regola** e **Tranello**).
     * **Griglia 30 Bolle Reattiva**: colorazione in tempo reale (verde smeraldo per esatte, rosso per errate) per rapida individuazione dei punti deboli.
     * **Avanzamento a 1 Tocco**: pulsante dedicato "Prossima Domanda" per una fluidità ottimale su smartphone.
     * **Registrazione Istantanea**: telemetria salvata subito in Dexie per alimentare in tempo reale il Quaderno Errori.
   - **Simulazione Esame Ufficiale (Conforme AeCI)**:
     * 30 quesiti estratti rispettando fedelmente le quote per materia:
       - *Aerodinamica*: 9 quiz
       - *Meteorologia*: 8 quiz
       - *Tecnica di Pilotaggio*: 5 quiz
       - *Normativa e Legislazione*: 2 quiz
       - *Sicurezza del Volo*: 2 quiz
       - *Primo Soccorso*: 1 quiz
       - *Fisiopatologia del Volo*: 1 quiz
       - *Strumenti di Volo*: 1 quiz
       - *Materiali e Manutenzione*: 1 quiz
     * Timer countdown di 45 minuti con avvisi visivi.
     * Idoneità: **Massimo 3 errori** ammessi (minimo 27/30). 4 o più errori = **NON IDONEO**.
     * Griglia di navigazione interattiva a 30 slot per visualizzare quesiti risposti, da rispondere e contrassegnati con bandierina (`⚑ Rivedi`).
     * Schermata finale di Debriefing con esito secco (`IDONEO` / `NON IDONEO`), tempo impiegato e analisi errori.

2. **Studio per Materie**:
   - Filtro immediato per ciascuna delle 9 materie.
   - Feedback didattico istantaneo (`Esatta` / `Errata` + spiegazione Regola/Tranello).

3. **Quaderno Errori (Spaced Repetition)**:
   - Raccolta automatica di qualsiasi domanda errata durante esami o sessioni di studio.
   - Logica Leitner rigida: una domanda esce dal quaderno solo dopo **2 risposte corrette consecutive** (`consecutiveCorrect >= 2`).

4. **Archivio & Ricerca**:
   - Esplorazione dell'intero database con ricerca full-text istantanea.
   - Possibilità di aggiungere domande ai **Preferiti** e inserire **Note personali** persistenti.

5. **Statistiche & Analytics**:
   - Indice di preparazione complessivo per l'esame.
   - Radar di rendimento sulle 9 materie (individuazione immediata dei punti deboli).
   - Storico temporale delle sessioni d'esame e grafico di tendenza.
   - Elenco dei quiz più sbagliati (Top 10 ostacoli).

6. **Audio & Feedback Sonoro Didattico**:
   - Suoni di conferma/allerta opzionali.
   - Sintesi vocale neurale italiana (voci Giuseppe/Elsa) con fonetica aeronautica ICAO ed estrema concisione (pronuncia del solo testo della domanda, omettendo numero e materia per azzerare i preamboli verbali).
   - **Controlli Parlato Interattivi**: Riproduzione flessibile con Play, Pausa (con preservazione della posizione esatta senza ricominciare da capo), Riprendi, e Riavvio istantaneo dall'inizio ("Da capo" / tasto `R` o `Shift+V`) anche mentre l'audio sta parlando.
   - Quick Speech Menu sempre accessibile nell'header: controllo istantaneo a 1 clic per voce istruttore (Giuseppe/Elsa), velocità di riproduzione, lettura automatica e muting senza interruzioni o modali pesanti.
   - **Invalidazione & Aggiornamento Differenziale Audio Offline (Opzione A + Opzione 1)**: meccanismo intelligente per mantenere allineati i file audio MP3 salvati in `CacheStorage`. Manifest leggero con hash MD5 a 8 caratteri (`public/audio/manifest.json`), strategia Workbox `NetworkFirst`, download selettivo dei soli frammenti modificati senza riscaricare l'intero archivio da 150 MB, sincronizzazione automatica silenziosa all'avvio dell'app se connessi a Internet e soppressione del prompt di download in Modalità Guida se le voci sono già state salvate localmente.

7. **Modalità Mani Libere (Hands-Free Mode)**:
   - Vista a tutto schermo con viewport bloccato (`100dvh`) e zero-scroll.
   - Tre macro-fasce tattili ad altissima leggibilità e contrasto elevato (Fitts's Law estrema).
   - Screen Wake Lock API integrato per prevenire lo spegnimento dello schermo su supporto o a mani libere.
   - Pilota Automatico ("Radio Quiz") continuo per studio e ripasso a mani libere senza tocco fisico.
   - Comandi vocali in lingua italiana tramite Web Speech Recognition ("Uno", "Due", "Tre", "Avanti", "Ripeti", "Pausa", "Aiuto").
   - **Menu Rapido Impostazioni Voce Integrato (Quick Speech Menu)**: Controllo vocale istantaneo a 1 tocco integrato in tutti gli stati (Launcher, HUD superiore durante il quiz attivo e Debriefing), con styling nativo Dark (Zero-Blue) antiriflesso.
   - **Guida Contestuale & Feedback Vocale Reattivo**: icona microfono pulsante con onda radar durante la ricezione comandi, trascrizione in tempo reale nel banner HUD, conferme comando, diagnostica trasparente su frasi non riconosciute e Cheat Sheet rapido con pulsante '?'.
   - **Spiegazione Vocale di Benvenuto (Audio Briefing Run-Once)**: All'avvio della modalità a mani libere, un audio neurale conciso illustra il funzionamento (Wake Lock, lettura automatica quesiti, risposte touch e comandi vocali "Uno", "Due", "Tre", "Ripeti", "Aiuto"). Eseguito una sola volta in automatico (`driveModeIntroPlayed: true`), con possibilità di riascolto on-demand (Launcher, Cheat Sheet) o riattivazione all'avvio dalle Impostazioni.
   - **Modalità Tutor Didattica a Mani Libere**: Funzionalità hands-free avanzata per lo studio approfondito a mani libere. In caso di errore (o timeout senza risposta), il motore vocale neurale pronuncia l'intera spiegazione didattica (risposta esatta, **Regola** e **Tranello**), mentre in caso di risposta corretta il flusso prosegue veloce senza rallentare l'allievo. L'HUD visualizza la card didattica ad alto contrasto con pulsante di ascolto volontario ("Ascolta" / "Riascolta"), rispettando il layout zero-scroll a `100dvh`. Il Pilota Automatico sincronizza la prosecuzione attendendo la fine della voce, e sono disponibili comandi vocali dedicati (*"Spiega"*, *"Regola"*, *"Tutor"*).
   - **Gestione Microfono Anti-Eco & Selettore Altoparlante / Cuffie**: In modalità altoparlante (default), il microfono si attiva solo a fine lettura o mentre l'audio è in pausa per eliminare totalmente l'eco dello speaker. Buffer di sicurezza acustico da 250ms e selettore rapido Altoparlante/Cuffie (ascolto continuo) integrato in Launcher, HUD e Impostazioni.
   - **Ripetizione Selettiva Domanda e Singole Opzioni**: Possibilità di riascoltare selettivamente solo il testo della domanda o una specifica opzione di risposta (1, 2 o 3) senza risentire l'intera sequenza audio di 20-30s. Azionabile via tocco (tappando sul testo della domanda, sul pulsante `[Solo Domanda]`, o sul pulsante altoparlante `[🔊]` a destra di ciascuna opzione isolato con stopPropagation per prevenire risposte accidentali), via voce (*"Ripeti domanda"*, *"Ripeti uno"*, *"Rileggi la due"*, *"Solo tre"*) e via scorciatoie da tastiera (`Q` per domanda, `Alt+1` / `Alt+2` / `Alt+3` per opzioni). Il countdown del pilota automatico viene temporaneamente sospeso durante la rilettura e riattivato alla conclusione del frammento sonoro.

8. **Impostazioni Modulari per Argomenti (Accordion Compresso a Sezione Singola)**:
   - Schermata impostazioni fullscreen nativa articolata su 6 aree tematiche (Aspetto, Voce, Mani Libere, Cloud/Backup, Dati & Reset, About con riferimenti normativi AeCI e D.P.R. 133/2010).
   - Layout ad **accordion verticale compresso a mutua esclusione**: apertura di una sola sezione alla volta (`openSection: SettingsTab | null`), chiusura automatica delle altre, anteprime dinamiche dello stato attivo nei badge di testata, pulsante di collasso totale per una panoramica compatta a 1 schermata e zero layout shift.

9. **Identità Visiva, Iconografia & Sistema Temi (Zero-Blue)**:
   - **Icona Ufficiale Aero Shield**: Logo PWA geometrico che unisce l'arco a cassoni del parapendio con l'ala triangolare a freccia 'V' del deltaplano (trave di chiglia e barra di controllo A-frame). Vettore SVG di precisione e icone PNG 192x192 e 512x512.
   - **Tema Scuro Minimale (Zero-Blue)**: Eliminazione totale di qualsiasi dominante fredda o blu dal dark mode. Superfici grafite (`zinc-950`, `zinc-900`, `zinc-800`) e caldi accenti ambra (`amber-500` / `amber-600`) per il massimo comfort visivo nello studio prolungato.

10. **Ergonomia di Navigazione & Filtro Disciplina (Deltaplano / Parapendio)**:
   - **Barra di Navigazione Bloccata al Top**: Fissaggio permanente del menu di navigazione in alto (top sticky/fixed bar) per liberare la parte inferiore del viewport da barre fisse, ottimizzando l'area utile di lettura dei quiz e delle opzioni di risposta.
   - **Filtro Quiz Deltaplano con Salvaguardia Condivisi**: Possibilità di filtrare i quesiti specifici per il Deltaplano (barra di controllo/trapezio/A-frame, spostamento del baricentro, trave di chiglia, cavi e tubi strutturali) o per il Parapendio (freni, fascio funicolare, cassoni, centine). **Vincolo tassativo di progetto**: massima cautela nell'audit semantico per NON escludere mai dai piani di studio le nozioni trasversali condivise da entrambi i mezzi (aerodinamica generale, meteo, normativa D.P.R. 133/2010, primo soccorso, fisiopatologia, sicurezza comune e strumentazione).
   - **Visualizzazione Globale del Numero di Versione**: Integrazione chiara e discreta del badge di versione (es. `v1.0.0` dinamico tramite `__APP_VERSION__` da `vite.config.ts`) nella Navbar, nell'header delle Impostazioni o nel footer, rendendolo immediatamente individuabile dall'allievo per verifiche di aggiornamento PWA e reportistica.
   - **Barra di Navigazione Quiz Ancorata in Basso**: Durante l'esecuzione del quiz (Esame Ufficiale, Tutor Didattico, Materie, Quaderno Errori), i comandi di avanzamento (*Precedente*, *Successiva*, *Concludi*) rimangono permanentemente ancorati sul fondo del viewport (`sticky` o `fixed bottom-0` con safe-area e backdrop blur). In questo modo l'allievo pilota può navigare e rispondere fluidamente con il pollice a una sola mano senza dover scorrere la pagina verso il basso in caso di domande lunghe o spiegazioni didattiche estese.

---

## 3. Vincoli Architetturali e Tecnologici

| Aspetto | Scelta Obbligatoria | Motivazione |
| :--- | :--- | :--- |
| **Piattaforma** | PWA (Progressive Web App) | Installabile su iOS, Android, macOS e Windows senza store di terze parti. |
| **Build Tool & Framework** | Vite + React 19 + TypeScript | Velocità estrema di build, HMR istantaneo, type safety rigorosa (`strict: true`). |
| **Styling** | Tailwind CSS | Palette minimale personalizzata ad alto contrasto, zero runtime CSS overhead. |
| **Persistenza (SSOT)** | Dexie.js (IndexedDB) | Storage asincrono, strutturato, indicizzato e reattivo; nessun limite dei 5MB di LocalStorage. |
| **Randomizzazione** | Fair Coverage Algorithm | Assegnazione a bucket (`times_seen == 0` prima di tutto) per evitare il coupon collector problem. |
| **Testing** | Vitest + fake-indexeddb | Suite veloce (<500ms), SRP puro per funzioni di calcolo, BVA, zero dipendenza da browser reale. |

---

## 4. Matrice di Stato del Progetto

| Modulo / Requisito | Stato | Note per il Prossimo Agente |
| :--- | :---: | :--- |
| Dataset 504 Quiz AeCI | 🟢 Completato | Single Source of Truth (SSOT) in `src/data/questions.json` isolato nel chunk rollup `quiz-dataset.js`. Duplicato `public/data/questions.json` rimosso per ottimizzazione precache. |
| Fair Coverage Randomizer | 🟢 Completato | Logica in `src/services/randomizer.ts` e `src/utils/fairRandomizer.ts`. |
| Database Dexie (IndexedDB) | 🟢 Completato | Schema in `src/db/index.ts`, tipi in `src/types/database.ts`. |
| Simulatore Esame Ufficiale & Didattico | 🟢 Completato | 30 quiz, modalità Tutor (senza tempo, feedback immediato Regola+Tranello) ed Esame Ufficiale (45 min), griglia 30 slot reattiva, evaluator in `src/services/examEvaluator.ts`. |
| Modalità Materie | 🟢 Completato | Filtro 9 materie con spiegazioni Regola + Tranello. |
| Quaderno Errori Leitner | 🟢 Completato | Uscita vincolata a 2 risposte esatte consecutive. |
| Archivio & Ricerca Full-Text | 🟢 Completato | Ricerca istantanea, preferiti e note personali salvate in Dexie. |
| Dashboard Statistiche | 🟢 Completato | Radar materie, preparazione esame e storico sessioni. |
| Temi Scuro & Chiaro, Icona Aero Shield | 🟢 Completato | Zero dominante blu (`zinc` + `amber`), bordi pannelli elevati ad alto contrasto (`zinc-700` dark, `slate-300` light) con conformità WCAG 2.1 AA/AAA su tutti i testi e card, icona Aero Shield vettoriale e PNG 192/512. |
| Suite Vitest (Unit & BVA) | 🟢 Completato | 255 test attivi su 34 suite (100% passanti, 0 fallimenti), copertura linee 76.8%, test completi per custom hooks mobile (WakeLock, Voice, SpeechRecognition) e contratti ergonomici componenti. |
| Supporto Audio | 🟢 Completato | Sintesi vocale neurale con controlli Play/Pausa e Da Capo universali su domanda, singole opzioni e spiegazione; feedback Web Audio API e fonetica ICAO. |
| Gestione Offline Audio & Fallback | 🟢 Completato | Download in background non bloccante via CacheStorage, prompt non invasivo al primo avvio Guida, gestione granulare Impostazioni, fallback automatico offline su voce scaricata e Range Requests Safari. |
| Google Drive Cloud Sync | 🟢 Completato | Integrazione GIS con `appDataFolder` privata e fallback JSON export/import. |
| Modalità Mani Libere | 🟢 Completato | Layout zero-scroll, Screen Wake Lock, Pilota Auto Radio Quiz, Speech Recognition, Quick Speech Menu integrato in tutti gli stati (Launcher, HUD quiz attivo, Debriefing) e pieno supporto Scuro / Chiaro. |
| Quick Speech Menu (1-Click) | 🟢 Completato | Flyout compatto in Navbar e integrato a tutto schermo in Modalità Mani Libere per controllo vocale rapido a 1 tocco. |
| Schermata Impostazioni Fullscreen & About | 🟢 Completato | Esperienza nativa a tutto schermo (mobile & desktop), segmented tabs per 6 argomenti con scheda About (normativa AeCI e D.P.R. 133/2010) e supporto Schermo Intero. |
| Guida Contestuale Comandi Vocali | 🟢 Completato | HUD live rotativo, Cheat Sheet modale a 1 tocco, trigger 'Aiuto' e box in Impostazioni. |
| Indicatore Stato Offline & HUD Rete | 🟢 Completato | Pillola ambra in Navbar e HUD Mani Libere, banner informativo e modale di briefing via createPortal con feedback di riconnessione ONLINE. |
| Spiegazione Vocale Modalità Mani Libere | 🟢 Completato | Audio briefing iniziale run-once con Edge-TTS (Giuseppe/Elsa), tasto Salta, persistenza Dexie, riascolto 1-click e riattivazione in Impostazioni. |
| Filtro Quiz Esclusivi Deltaplano / Parapendio | 🟢 Completato | Parapendio impostato come default immediato (474 quiz: 428 comuni + 46 parapendio). Rimosso popup di onboarding iniziale e rimossi i selettori inline da Esame, Materie e Archivio per un'interfaccia essenziale e zero distrazioni. Selezione disciplina gestibile esclusivamente nelle Impostazioni. |
| Blocco Menu di Navigazione al Top | 🟢 Completato | Barra di navigazione permanently fixed al top (`fixed top-0 left-0 right-0 z-40`), eliminata la bottom nav fissa e rimosso il preamble fuffa dalla schermata esame. |
| Impostazioni ad Accordion Compresso Singolo | 🟢 Completato | Sostituzione pills menu con accordion verticale mutuo-esclusivo (1 sola sezione aperta alla volta, anteprime badge live, pulsante comprimi tutto ed espansione selettiva). |
| Visualizzazione Globale Versione App | 🟢 Completato | Badge di versione dinamico (`__APP_VERSION__` e `__APP_BUILD_ID__`) visibile in Navbar e header Impostazioni. |
| Barra Navigazione Quiz Ancorata in Basso | 🟢 Completato | Componente `QuizBottomBar` ancorato in basso al viewport (`fixed bottom-0 z-30`) con Precedente, Successiva, flag rapido, Prossima Domanda Tutor e Consegna su `ExamScreen`, `TopicsScreen` e `MistakesScreen`. |
| Modalità Tutor nella Modalità Guida | 🟢 Completato | Spiegazione vocale Regola+Tranello mirata su errore/timeout, flusso veloce su risposta esatta, Scheda Didattica HUD zero-scroll 100dvh con pulsante Ascolta/Riascolta, toggle in Launcher/HUD/Settings/QuickMenu e comandi vocali. |
| Risoluzione Interruzione Spiegazione Vocale | 🟢 Completato | Eliminato timeout prematuro 3.5s, sincronizzazione event-driven con audio ended + pausa di assimilazione (2.5s) e safety guard 4.5s. |
| Perfezionamento Spiegazioni Didattiche (Regola & Tranello) | 🟢 Completato (504/504 Quiz - 100%) | Revisione semantica e didattica completata per tutti i 504 quiz AeCI (9 materie su 9). Ogni domanda dispone di Regola e Tranello specifici, univoci al 100% e certificati dal test DATA-09. Refusi OCR storici del PDF cartaceo eliminati da tutte le materie. Database audio neurale Giuseppe ed Elsa completamente allineato con manifest.json. |
| Riorganizzazione Home Hub & Back Navigation | 🟢 Completato | Pattern a cruscotto Home con 6 macro-pulsanti tattili (`TUTOR`, `MATERIE`, `ESAME`, `ERRORI`, `CERCA`, `STATS`), banner sessione attiva e mini-header con `[← Home]` nei quiz per liberare oltre 50px verticali. |
| Potatura Radicale Quiz Deltaplano | 🟢 Completato | Focus 100% su Parapendio (474 quiz), rimozione definitiva dei 30 quiz deltaplano e pulizia di tutti i selettori, modali e badge correlati. |
| Layout Zero-Scroll a Margini Compatti | 🟢 Completato | Viewport ottimizzato con padding compatti (`p-2.5 sm:p-4`), card ridotta (`p-3 sm:p-4`), bottoni risposta `min-h-[44px] sm:min-h-[48px]`, leading stretto (`leading-snug`) e clearance safe-area per visualizzare sempre domanda, opzioni e spiegazione senza scroll su smartphone 390x844. |
| Modalità Audio (Audiolibro Hands-Free) & Switch Universale | 🟢 Completato | Riconcettualizzazione da "Modalità Guida" a "Modalità Audio" con pulsante `AUDIO` accessibile in qualunque quiz (Navbar e header di Tutor, Materie, Esame, Errori) per passare al volo all'ascolto senza perdere lo stato. |
| Ricerca Rapida No-Keyboard nell'Archivio | 🟢 Completato | Tastierino materie `01`-`09` + `TUTTE`, filtri stato a 1 tocco (`Tutte`, `Non viste`, `Errate`, `Preferiti`, `Note`) con conteggi live, 7 quick chips tematiche e pad numerico rapido `#ID` per salto istantaneo senza invocare la tastiera dello smartphone. |
| Macro-Target Tattili per Bici/Corsa (Modalità Audio) | 🟢 Completato | 3 macro-fasce a tutta larghezza con altezza minima 78-85px, badge numerici 44-56px, feedback aptico `navigator.vibrate` e zero elementi affiancati per uso con vibrazioni da manubrio o corsa. |
| Impostazione Dimensione Font (Font Scaling) | 🟢 Completato | 3 scale carattere ergonomiche (`Compatto` 14px per smartphone compatti e zero-scroll, `Normale` 16px bilanciato, `Grande/Outdoor` 18px per manubrio a braccio teso o guanti), persistenza in Dexie (`fontSizePreference: 'compact' | 'normal' | 'large'`) e applicazione fluida via CSS rem root senza distorsioni di layout. |
| Sincronizzazione Tasto Indietro Hardware (Back Coordinator) | 🟢 Completato | Gestione unificata `popstate` e gestures Android/iOS: il tasto indietro del telefono esegue sempre l'azione del tasto grafico visibile (chiusura submodali, annullamento guardia esame, chiusura Audio/Impostazioni, ritorno a Home). |
| Navigatore Quiz Comprimibile a Singola Riga | 🟢 Completato | Componente modulare `QuestionNavigator` con vista espansa a 3 righe (30 bolle) e modalità compressa a singola riga (30 tacche avioniche colorate a tutta larghezza su mobile, con numeri su desktop), persistenza preferenza in `localStorage` e risparmio di oltre 70px verticali per layout zero-scroll. |
| Gestione Microfono Anti-Eco & Selettore Altoparlante / Cuffie | 🟢 Completato | Sospensione immediata del microfono (`rec.abort()`) durante la riproduzione audio in modalità altoparlante per azzerare l'eco dello speaker. Riattivazione a fine parlato o mentre l'audio è in pausa con cooldown acustico di 250ms, e selettore rapido Altoparlante vs Cuffie (ascolto continuo) nel Launcher, HUD e Impostazioni. |
| Ripetizione Selettiva Domanda e Opzioni (Mani Libere) | 🟢 Completato | Riascolto granulare di solo domanda o singola opzione via touch (area domanda e icona altoparlante isolata su ciascuna card), comandi vocali prioritari (*"Ripeti domanda"*, *"Ripeti uno/due/tre"*, *"Rileggi la due"*, *"Solo tre"*) e tastiera (`Q`, `Alt+1/2/3`). Sospensione e ripristino coordinato del countdown pilota automatico. |
| Avanzamento Automatico su Risposta Esatta (Auto-Advance) | 🟢 Completato | Avanzamento visivo automatico su risposta esatta dopo 900ms di conferma visiva emerald nei quiz di studio (Tutor, Materie, Quaderno Errori). Arresto immediato su risposta errata per permettere lo studio di Regola e Tranello. Toggle configurabile nelle Impostazioni (`autoAdvanceOnCorrect`, default attivo). |
| Interattività Liste Statistiche (Dettaglio Materie & Domande) | 🟢 Completato | Liste materie e Top 10 errori interattive in StatsScreen. Implementati SubjectDetailModal (cruscotto materia, accuratezza, filtri 1-touch Tutte/Errori/Non viste/Corrette, lista quesiti scorrevole e scorciatoia allenamento verso TopicsScreen) e QuestionDetailModal (scheda integrale quesito, risposta esatta in verde con check, spiegazione Regola+Tranello, telemetria, note e audio). Sincronizzazione con Back Navigation Coordinator. |
| Armonizzazione UI/UX & Disambiguazione Stati Top Bar | 🟢 Completato | Completato con TODO-08. Disambiguazione pulsante Modalità Audio (Headphones neutro su Home e mini-header), VoiceQuickMenu neutro coordinato alla testata senza pillola ambra ingannevole, ChevronLeft neutra su ritorno Home e badge 2017 zinc-800. |

---

## 5. Roadmap di Riorganizzazione Ergonomica V2 (TODO)

Questa roadmap sintetizza il piano di riorganizzazione per massimizzare l'usabilità con il minimo numero di clic, zero scritte inutili e zero fronzoli commerciali:

1. **TODO-01: Potatura Radicale del Deltaplano (Focus 100% Parapendio)** `[COMPLETATO]`:
   - Esclusione dei 30 quesiti specifici per il deltaplano, fissando il pool stabile a **474 quiz**.
   - Eliminazione definitiva del componente `DisciplineSelector` dalle schermate e impostazioni.
   - Rimozione dei badge grafici "Deltaplano / Parapendio" su tutte le card dei quiz.
2. **TODO-02: Architettura "Home Hub + Back Navigation"** `[COMPLETATO]`:
   - Creazione del componente `HomeScreen.tsx` con 6 macro-pulsanti ad alto contrasto.
   - Eliminazione della top bar permanente a 6 voci nelle schermate interne.
   - Adozione di una mini-header (~48px) con pulsante `[← Home]`, titolo essenziale e toggle `AUDIO`.
3. **TODO-03: Modalità Audio (Stile Audiolibro Hands-Free) & Macro-Target Bici/Corsa** `[COMPLETATO]`:
   - Rinominare "Modalità Guida" in "Modalità Audio" con iconografia monocromatica a cuffie (`Headphones`).
   - 3 macro-fasce risposta a tutta larghezza con altezza minima 78-85px, spaziatura protetta e feedback aptico (`navigator.vibrate`) per prevenire miss-clicks su manubrio o durante la corsa.
   - Inserimento del tasto `AUDIO` nell'header di Tutor, Materie, Esame ed Errori e nella Navbar per switch al volo bidirezionale senza perdere lo stato.
4. **TODO-04: Layout Zero-Scroll e Ottimizzazione Spaziale** `[COMPLETATO]`:
   - Riduzione dei margini (`p-2.5 sm:p-4`, `leading-snug`, min-height 44px-48px per i pulsanti risposta).
   - Card compressa (`p-3 sm:p-4`, font `text-sm sm:text-base font-semibold leading-snug`, badge opzioni `w-5 h-5 sm:w-6 sm:h-6`).
   - Scheda didattica Regola/Tranello snellita (`space-y-1 text-xs leading-snug`) e QuizBottomBar compressa a min-h 40px con padding ridotti per azzerare lo scroll verticale sui dispositivi mobile standard 390x844.
5. **TODO-05: Archivio con Ricerca Rapida Senza Tastiera** `[COMPLETATO]`:
   - Barra rapida materie `01`..`09` + `TUTTE` con switch immediato a singolo tocco.
   - Filtri di stato a tocco singolo (`Tutte`, `Non viste`, `Errate`, `Preferiti`, `Note`) con badge dei conteggi in tempo reale.
   - Quick chips per concetti frequenti (*Vento*, *Stallo*, *Efficienza*, *Precedenze*, *Spazio Aereo*, *Termica*, *Nubi*).
   - Pad numerico rapido `#ID` per salto diretto ed espansione automatica del quiz senza aprire la tastiera virtuale dello smartphone.
6. **TODO-06: Impostazione Dimensione Font (Font Scaling / Outdoor Comfort)** `[COMPLETATO]`:
   - 3 livelli di scala carattere selezionabili (`Compatto` 14px, `Normale` 16px, `Grande/Outdoor` 18px).
   - Persistenza in Dexie (`fontSizePreference: 'compact' | 'normal' | 'large'`).
   - Adattamento fluido dei layout zero-scroll via CSS `rem` proporzionale per preservare la visibilità completa dei testi anche a font maggiorato.
7. **TODO-07: Interattività e Ispezione Liste nelle Statistiche (Dettaglio Materie & Domande)** `[COMPLETATO]`:
   - Rendere interattive e cliccabili le liste della schermata `StatsScreen` ("Risposte Esatte per Materia" e "Top 10 Domande con Più Errori").
   - Scheda/Modale Dettaglio Materia (`SubjectDetailModal`): cruscotto materia con accuratezza e copertura, tasto azione rapida "Allenati su questa materia" verso `TopicsScreen`, filtri veloci (Tutte, Errori, Non viste, Corrette) ed elenco compatto e scorrevole dei singoli quesiti.
   - Scheda/Modale Dettaglio Domanda (`QuestionDetailModal`): testo completo ad alta leggibilità, 3 opzioni con risposta esatta evidenziata in verde smeraldo, spiegazione didattica (Regola + Tranello), telemetria allievo (volte vista/sbagliata, consecutive corrette), note personali, preferiti e audio neurale on-demand.
   - Apertura fluida a cascata: tocco su materia ➔ elenco quesiti ➔ tocco su quesito ➔ scheda domanda (o tocco diretto da Top 10 errori).
   - Sincronizzazione totale con il tasto hardware Indietro e gesture Android/iOS via `backNavigation.registerSubModal`.
8. **TODO-08: Armonizzazione UI/UX & Disambiguazione Stati Top Bar (Zero-Confusion Audio & Controls)** `[COMPLETATO]`:
   - Rimossi il background e bordo ambra permanente (`bg-amber-500/10 border-amber-500/30 text-amber-400`) dai pulsanti di salto alla Modalità Audio (`#btn-drive-mode` e `#btn-mini-audio`), trasformandoli in pulsanti d'azione neutri e sobri (`border-zinc-800 bg-zinc-900/60`).
   - Rimosso lo stile a pillola ambra permanente di `VoiceQuickMenu` legato al default `ttsEnabled: true`, allineandolo allo stile neutro dei controlli top bar e lasciando la differenziazione unicamente all'icona interna (`Volume2` vs `VolumeX` e label `${rate}x` vs `Muto`).
   - Normalizzata la freccia di ritorno Home (`ChevronLeft` text-zinc-400) e il badge statico 2017 a colori neutri `zinc-800/80` per riservare l'ambra unicamente a veri stati attivi (`⚑ Rivedi`, audio in riproduzione effettiva, spiegazioni didattiche Tranello).


---

## 6. Quick-Start Guide per un Nuovo Agente AI 🤖

Quando entri in questo repository per una nuova lavorazione:
1. **Leggi questo file ([DESIDERATA.md](file:///c:/github/Quiz_VDS-VL/DESIDERATA.md))**: Per comprendere lo scopo dell'app, i requisiti intoccabili e dove si colloca il task richiesto.
2. **Leggi [MEMORY.md](file:///c:/github/Quiz_VDS-VL/MEMORY.md)**: Per acquisire i vincoli tecnici fissi, le regole normative AeCI e le soglie BVA.
3. **Consulta [WORKLOG.md](file:///c:/github/Quiz_VDS-VL/WORKLOG.md)**: Per visualizzare le ultime scelte architetturali prese e non ripetere tentativi già scartati.
4. **Esegui i test unitari**: `npm run test:unit` per assicurarti che lo stato di partenza sia 100% verde prima di modificare codice.
5. **Al termine del task**: Registra tassativamente in [WORKLOG.md](file:///c:/github/Quiz_VDS-VL/WORKLOG.md) cosa hai fatto, le scelte prese e aggiorna la matrice di questo file se hai completato nuovi requisiti.
