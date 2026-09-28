# 🛩️ VDS-VL Quiz Master

**VDS-VL Quiz Master** è una Progressive Web App (PWA) moderna, ad alte prestazioni e 100% offline-first, progettata con interfaccia ergonomica in stile avionico (*cockpit*).  
È realizzata per gli allievi piloti di **Volo Libero (Parapendio e Deltaplano)** per la preparazione e la simulazione dell'esame teorico per il conseguimento dell'attestato VDS/VL (Volo da Diporto o Sportivo), in piena conformità ai programmi e alle tabelle ufficiali dell'**Aero Club d'Italia (AeCI)** e al **D.P.R. 133/2010**.

---

## 📑 Indice dei Contenuti

- [Panoramica delle Funzionalità](#-panoramica-delle-funzionalità)
  - [1. Database Ufficiale dei Quiz (504 quesiti AeCI)](#1-database-ufficiale-dei-quiz-504-quesiti-aeci)
  - [2. Simulatore d'Esame Ufficiale AeCI](#2-simulatore-desame-ufficiale-aeci)
  - [3. Studio Guidato per Materie](#3-studio-guidato-per-materie)
  - [4. Quaderno Errori con Ripetizione Spaziata](#4-quaderno-errori-con-ripetizione-spaziata)
  - [5. Archivio Completo, Ricerca & Note Personali](#5-archivio-completo-ricerca--note-personali)
  - [6. Statistiche Avanzate & Indice di Prontezza](#6-statistiche-avanzate--indice-di-prontezza)
  - [7. Modalità Alla Guida (Truck & Cockpit Drive Mode)](#7-modalità-alla-guida-truck--cockpit-drive-mode)
  - [8. Motore Vocale Neurale (TTS Multi-Voce Offline) & Audio Cockpit](#8-motore-vocale-neurale-tts-multi-voce-offline--audio-cockpit)
  - [9. Ergonomia Cockpit, Temi & Scorciatoie da Tastiera](#9-ergonomia-cockpit-temi--scorciatoie-da-tastiera)
  - [10. Fair Coverage Randomizer](#10-fair-coverage-randomizer)
  - [11. Privacy, Offline-First & Sincronizzazione Dati](#11-privacy-offline-first--sincronizzazione-dati)
- [Stack Tecnologico](#-stack-tecnologico)
- [Guida all'Avvio Rapido](#-guida-allavvio-rapido)
- [Testing & Quality Assurance](#-testing--quality-assurance)
- [Documentazione di Progetto & Sviluppo](#-documentazione-di-progetto--sviluppo)

---

## 🌟 Panoramica delle Funzionalità

### 1. Database Ufficiale dei Quiz (504 quesiti AeCI)
- Catalogo integrale e fedele dei **504 quiz ministeriali ufficiali** (edizione AeCI 2017) per l'attestato VDS/VL.
- Suddivisione canonica nelle 9 materie d'esame.
- Ciascuna domanda include 3 opzioni di risposta con un'unica soluzione corretta verificata sulle tabelle ministeriali.
- **Spiegazioni Didattiche Essenziali**: ogni quesito è corredato da una spiegazione mirata articolata in:
  - **Regola**: il principio fisico, aerodinamico o la norma di legge alla base della risposta corretta.
  - **Tranello**: il bias cognitivo o l'ambiguità terminologica tipica della domanda.

### 2. Simulatore d'Esame Ufficiale AeCI
- **Ripartizione Ministeriale Esatta**: estrazione di 30 quesiti secondo le quote di legge:
  - *Aerodinamica*: 9 quiz
  - *Meteorologia*: 8 quiz
  - *Tecnica di Pilotaggio*: 5 quiz
  - *Normativa e Legislazione*: 2 quiz
  - *Sicurezza del Volo*: 2 quiz
  - *Primo Soccorso*: 1 quiz
  - *Fisiopatologia del Volo*: 1 quiz
  - *Strumenti di Volo*: 1 quiz
  - *Materiali e Manutenzione*: 1 quiz
- **Timer d'Esame Reale**: countdown di 45 minuti con indicatori di stato visivi e allarmi sonori negli ultimi minuti.
- **Valutazione Ufficiale AeCI**:
  - **IDONEO**: massimo **3 errori** ammessi (minimo 27/30).
  - **NON IDONEO**: 4 o più errori.
- **Griglia di Navigazione a 30 Slot**: panoramica a colpo d'occhio delle domande risposte, da completare e contrassegnate con bandierina (`⚑ Rivedi`).
- **Debriefing Finale**: esito immediato, cronometro di esecuzione, riepilogo grafico ed elenco analitico delle risposte errate con accesso diretto alle spiegazioni.
- **Navigation Guard (Protezione Sessione)**: avviso di sicurezza e blocco in caso di tentata navigazione verso altre schede o ricaricamento pagina (`beforeunload`), evitando la perdita accidentale della simulazione in corso.

### 3. Studio Guidato per Materie
- Filtro rapido e dedicato per ciascuna delle 9 materie d'esame.
- Feedback visivo e sonoro istantaneo alla selezione di una risposta (`Esatta` / `Errata`).
- Visualizzazione immediata della spiegazione (*Regola* e *Tranello*) per massimizzare l'apprendimento sul campo.

### 4. Quaderno Errori con Ripetizione Spaziata
- Raccolta automatica di qualsiasi domanda errata durante le simulazioni o le sessioni di studio.
- Algoritmo di **Spaced Repetition (Box Leitner)**: un quesito esce dal quaderno degli errori solo dopo **2 risposte corrette consecutive** (`consecutiveCorrect >= 2`).
- Monitoraggio delle domande ancora da consolidare e avanzamento progressivo verso l'azzeramento degli errori.

### 5. Archivio Completo, Ricerca & Note Personali
- Consultazione istantanea di tutti i 504 quiz con numerazione ufficiale.
- **Ricerca Full-Text**: filtro in tempo reale nel testo della domanda, nelle opzioni e nelle spiegazioni.
- **Preferiti (Segnalibri)**: memorizzazione delle domande più importanti o dubbie per un ripasso dedicato.
- **Note Personali (CRUD Completo)**: possibilità di aggiungere, consultare, modificare ed eliminare annotazioni personali su ciascun quesito, con pill di visualizzazione rapida sia nell'Archivio che nelle schede di quiz.

### 6. Statistiche Avanzate & Indice di Prontezza
- **Indice di Prontezza Esame**: percentuale calcolata sull'accuratezza globale e sulla copertura delle materie.
- **Radar Chart delle 9 Materie**: visualizzazione grafica poligonale per identificare all'istante le materie forti e i punti deboli su cui concentrare lo studio.
- **Registro Storico Sessioni**: cronologia delle simulazioni svolte con esito (`IDONEO` / `NON IDONEO`), punteggio e tempo impiegato.
- **Top 10 Domande Più Ostiche**: graduatoria dei quesiti che hanno registrato il maggior numero di risposte errate.

### 7. Modalità Alla Guida (Truck & Cockpit Drive Mode)
- Pensata per lo studio e il ripasso sicuro durante i viaggi su veicolo o camion, con smartphone o tablet agganciato al cruscotto.
- **Layout Ergonomico a Schermo Intero**: viewport bloccato a `100dvh` con **zero scrolling**.
- **Macro-Fasce Tattili Giganti**: tre pulsanti di risposta ad altissima area di tocco e contrasto estremo (Fitts's Law).
- **Screen Wake Lock**: schermo mantenuto costantemente acceso, prevenendo spegnimenti e standby accidentali.
- **Pilota Automatico ("Radio Quiz")**: modalità hands-free a tempo. L'app legge in sequenza la domanda e le opzioni, attende un intervallo configurabile (3-8s) e svela automaticamente la risposta esatta e la regola, passando da sola al quiz successivo.
- **Comandi Vocali Hands-Free in Italiano**: interazione completa a voce tramite Web Speech Recognition con comandi dedicati:
  - `"Uno"`, `"Due"`, `"Tre"` per selezionare la risposta.
  - `"Avanti"`, `"Indietro"` per navigare.
  - `"Ripeti"`, `"Ascolta"` per riascoltare domanda e opzioni.
  - `"Bandiera"` per contrassegnare il quesito da rivedere.
  - `"Pausa"`, `"Riprendi"` per controllare la sessione.
  - `"Aiuto"`, `"Guida"`, `"Comandi"` per aprire la guida a voce in qualsiasi istante.
- **Guida Contestuale Comandi Vocali (Cheat Sheet)**:
  - **HUD Live Rotativo**: indicatore visivo discreto durante l'ascolto che suggerisce i comandi disponibili ("Microfono ON: Dì 'Uno', 'Avanti' o 'Aiuto'").
  - **Cheat Sheet a 1 Tocco**: pulsante `?` sempre accessibile nella schermata di guida, nel Quick Speech Menu e nella scheda Impostazioni (🚗 Guida) con la tabella ordinata dei comandi e i consigli per l'uso in auto e casco/auricolare Bluetooth.

### 8. Motore Vocale Neurale (TTS Multi-Voce Offline) & Audio Cockpit
- **Oltre 5.000 Segmenti Audio Neurale Pre-Generati**: catalogo audio completo memorizzato localmente e funzionante al 100% offline.
- **Due Voci Selezionabili**:
  - 👨‍✈️ **Giuseppe**: timbro baritonale calmo, impostato come un istruttore di volo in cockpit (`rate -5%`, `pitch -5Hz`).
  - 👩‍✈️ **Elsa**: dizione cristallina, brillante ed energica.
- **Normalizzazione Fonetica Aeronautica (`aviationPhonetics.ts`)**: espansione e pronuncia accurata secondo lo standard aeronautico ICAO di sigle e acronimi (`D.P.R. 133/2010`, `VDS/VL`, `AeCI`, `hPa`, `QNH`, `QFE`, `FL`, `km/h`, `kt`, `m/s`).
- **Ascolto Modulare**: pulsanti per ascolto atomico della singola domanda (tasto `Q`), delle singole opzioni (`Alt+1`, `Alt+2`, `Alt+3`), o dell'intera sequenza con evidenziazione del testo sincronizzata.
- **Quick Speech Menu (1-Clic in Header)**: menu rapido sempre visibile nella barra di navigazione superiore per commutare istantaneamente con un singolo tocco la voce (👨‍✈️ Giuseppe / 👩‍✈️ Elsa), la velocità di riproduzione (0.9x - 1.25x), la lettura automatica e gli effetti sonori, senza aprire pesanti schermate o abbandonare la sessione di quiz.
- **MediaSession API**: controllo della riproduzione vocale dai pulsanti fisici o touch degli auricolari Bluetooth anche a schermo spento.
- **Feedback Sonori Cockpit (Web Audio API)**: click meccanici, segnali di conferma, buzzer di errore e alert timer generati via oscillatori nativi senza pesanti file esterni.

### 9. Ergonomia Cockpit, Temi & Impostazioni a Schede
- **Pannello Impostazioni a Schede Tematiche (Zero-Scroll)**:
  - Riorganizzazione modulare suddivisa in 5 argomenti dedicati: **🎨 Aspetto**, **🎙️ Voce**, **🚗 Guida**, **☁️ Backup**, **⚙️ Dati**.
  - Eliminazione totale dello scrolling verticale continuo: ogni scheda presenta controlli compatti e accessibili a colpo d'occhio sia su smartphone che su desktop.
- **Palette Cockpit Bimodale**:
  - **Cockpit Dark**: sfondo notturno a nero profondo (#020617 / Slate 950), ideale per stanze buie o cockpit.
  - **Hangar Light**: sfondo diurno ad alto contrasto per perfetta leggibilità sul campo o sotto la luce diretta del sole.
- **Scorciatoie da Tastiera Desktop**:
  - `1`, `2`, `3`: selezione immediata delle opzioni A, B o C.
  - `F`: aggiunta o rimozione bandierina (`⚑ Rivedi`).
  - `Spazio` o `Freccia Destra`: domanda successiva.
  - `Freccia Sinistra`: domanda precedente.
  - `Q`: ascolto audio della domanda.
  - `Alt + 1 / 2 / 3`: ascolto audio della rispettiva opzione.

### 10. Fair Coverage Randomizer
- Algoritmo a bucket ponderati sviluppato per superare il noto problema statistico del *collezionista di figurine* (*Coupon Collector's Problem*).
- Priorità assoluta ai quesiti mai estratti (`times_seen == 0`), garantendo la copertura equa di tutti i 504 quiz prima di riproporre domande già incontrate.

### 11. Privacy, Offline-First, Auto-Sync & Smart Merge
- **100% Client-Side & Zero Profilazione**: nessun database proprietario centrale, nessun cookie pubblicitario o tracciamento.
- **Persistenza Locale Dexie.js (IndexedDB)**: storage asincrono, strutturato e robusto sul browser dell'utente (Single Source of Truth).
- **Service Worker PWA**: installazione come applicazione standalone su iOS, Android, macOS e Windows con funzionamento completo anche in assenza di segnale.
- **Sincronizzazione Automatica Continua (Auto-Sync)**: salvataggio automatico in background con debounce (15-20s) e push immediato al completamento delle simulazioni d'esame.
- **Smart Merge Deterministico**: motore di fusione intelligente per sincronizzare più dispositivi (es. PC a casa e smartphone sul campo) senza sovrascritture cieche: tutti gli esami sostenuti vengono preservati (unione cronologica) e per ciascun quesito viene adottato lo stato di apprendimento più recente.
- **Ripresa Rapida della Sessione (Cross-Device Resume)**: persistenza continua della sessione attiva (esame, materia o quaderno errori) con cursore esatto, risposte parziali e timer; all'apertura su un nuovo dispositivo, un banner avionico consente di riprendere con un tocco esattamente da dove ci si era fermati.
- **Resilienza Offline con Invio Differito**: studio fluido anche in decollo o in viaggio senza connettività; al rientro della rete (`online`), l'engine sincronizza silenziosamente le modifiche con Google Drive.
- **Indicatore di Stato Cockpit in Header**: icona discreta nella barra superiore per visualizzare all'istante lo stato della sincronizzazione (verde = sincronizzato, animato = in corso, ambra = necessita accesso, grigio = offline).
- **Salva o Carica da File (.json)**: esportazione e importazione con Smart Merge deterministico per il backup offline indipendente dal cloud.

---

## 🛠️ Stack Tecnologico

- **Core & Runtime**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) (modalità `strict: true`)
- **Bundler & Dev Server**: [Vite 6](https://vitejs.dev/) + [vite-plugin-pwa](https://vite-pwa-org.netlify.app/)
- **Styling**: [Tailwind CSS 3](https://tailwindcss.com/) (configurazione bitema Cockpit Dark & Hangar Light)
- **Database & Storage**: [Dexie.js](https://dexie.org/) (IndexedDB wrapper reattivo con `dexie-react-hooks`)
- **Icone & UI**: [Lucide React](https://lucide.dev/) + [canvas-confetti](https://www.npmjs.com/package/canvas-confetti)
- **Test Suite**: [Vitest](https://vitest.dev/) con `@vitest/coverage-v8` e `fake-indexeddb`
- **Audio & Speech**: Web Audio API, Web Speech Recognition e dataset audio neurale MP3

---

## 🚀 Guida all'Avvio Rapido

### Prerequisiti
- **Node.js** (versione 18.0 o successiva consigliata)
- **npm** (incluso in Node.js)

### Installazione e Avvio
1. Clonare il repository:
   ```bash
   git clone https://github.com/alessandroame/Quiz_VDS-VL.git
   cd Quiz_VDS-VL
   ```
2. Installare le dipendenze:
   ```bash
   npm install
   ```
3. Avviare il server di sviluppo locale:
   ```bash
   npm run dev
   ```
   L'applicazione sarà disponibile su `http://localhost:5173`.

4. Compilazione del bundle di produzione PWA:
   ```bash
   npm run build
   ```

5. Anteprima del build di produzione:
   ```bash
   npm run preview
   ```

---

## 🧪 Testing & Quality Assurance

La codebase segue standard rigorosi di isolamento della logica di calcolo (Single Responsibility Principle) e analisi dei casi limite (Boundary Value Analysis).

```bash
# Esecuzione rapida di tutta la suite di unit test
npm run test:unit

# Esecuzione test in modalità watch per lo sviluppo
npm run test:watch

# Report completo di coverage con v8
npm run test:coverage

# Collaudo visivo headless CDP (Chrome DevTools Protocol)
npm run test:visual:all

# Collaudo specifico della Modalità Alla Guida (CDP Mobile 390x844)
npm run test:visual:drive
```

---

## 📖 Documentazione di Progetto & Sviluppo

Questo progetto adotta un sistema di **governance della conoscenza inter-agente** strutturato per garantire continuità, integrità architetturale e trasparenza:

- 🧭 **[DESIDERATA.md](file:///c:/github/Quiz_VDS-VL/DESIDERATA.md)**: La visione di prodotto, i requisiti core e la matrice di stato di tutte le funzionalità.
- 🧠 **[MEMORY.md](file:///c:/github/Quiz_VDS-VL/MEMORY.md)**: La memoria tecnica permanente contenente vincoli tecnici stabili, regole d'esame AeCI e lezioni apprese.
- 📓 **[WORKLOG.md](file:///c:/github/Quiz_VDS-VL/WORKLOG.md)**: Il registro cronologico di tutte le lavorazioni svolte e delle decisioni architetturali (ADR).
- 📜 **[AGENTS.md](file:///c:/github/Quiz_VDS-VL/.agents/AGENTS.md)**: Le direttive operative e i workflow obbligatori per gli agenti AI.

> ⚠️ **Regola Operativa per le Modifiche Future**:  
> In accordo con le direttive di progetto, **questo `README.md` deve essere mantenuto puntualmente aggiornato** a fronte di ogni introduzione di nuove funzionalità, estensione di moduli o modifica del comportamento dell'applicazione.
