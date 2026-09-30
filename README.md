# 🛩️ VDS-VL Quiz Master (Cockpit V2)

**VDS-VL Quiz Master** è una Progressive Web App (PWA) moderna, ad alte prestazioni e 100% offline-first, progettata con interfaccia ergonomica in stile avionico (*cockpit*).  
È realizzata su misura per gli allievi piloti di **Parapendio (Volo Libero VDS/VL)** per la preparazione e la simulazione dell'esame teorico per il conseguimento dell'attestato VDS/VL, in piena conformità ai programmi ufficiali dell'**Aero Club d'Italia (AeCI)** e al **D.P.R. 133/2010**.

---

## 📑 Indice dei Contenuti

- [Panoramica delle Funzionalità](#-panoramica-delle-funzionalità)
  - [1. Database Ufficiale dei Quiz (474 quesiti Parapendio & Teoria Comune)](#1-database-ufficiale-dei-quiz-474-quesiti-parapendio--teoria-comune)
  - [2. Architettura Home Hub & Back Navigation Cockpit V2](#2-architettura-home-hub--back-navigation-cockpit-v2)
  - [3. Simulatore d'Esame Ufficiale AeCI & Tutor Didattico](#3-simulatore-desame-ufficiale-aeci--tutor-didattico)
  - [4. Studio Guidato per Materie](#4-studio-guidato-per-materie)
  - [5. Quaderno Errori con Ripetizione Spaziata (Box Leitner)](#5-quaderno-errori-con-ripetizione-spaziata-box-leitner)
  - [6. Archivio con Ricerca Rapida Senza Tastiera (#ID Pad & Thematic Chips)](#6-archivio-con-ricerca-rapida-senza-tastiera-id-pad--thematic-chips)
  - [7. Statistiche Avanzate & Indice di Preparazione](#7-statistiche-avanzate--indice-di-preparazione)
  - [8. Modalità Mani Libere (Hands-Free Outdoor & Macro-Target Bici/Corsa)](#8-modalità-mani-libere-hands-free-outdoor--macro-target-bicicorsa)
  - [9. Motore Vocale Neurale (TTS Multi-Voce Offline) & Audio Cockpit](#9-motore-vocale-neurale-tts-multi-voce-offline--audio-cockpit)
  - [10. Ergonomia Cockpit, Layout Zero-Scroll & Dimensione Font](#10-ergonomia-cockpit-layout-zero-scroll--dimensione-font)
  - [11. Fair Coverage Randomizer](#11-fair-coverage-randomizer)
  - [12. Privacy, Offline-First & Sincronizzazione Dati](#12-privacy-offline-first--sincronizzazione-dati)
- [Stack Tecnologico](#-stack-tecnologico)
- [Guida all'Avvio Rapido](#-guida-allavvio-rapido)
- [Testing & Quality Assurance](#-testing--quality-assurance)
- [Documentazione di Progetto & Sviluppo](#-documentazione-di-progetto--sviluppo)

---

## 🌟 Panoramica delle Funzionalità

### 1. Database Ufficiale dei Quiz (474 quesiti Parapendio & Teoria Comune)
- Catalogo stabile e certificato di **474 quiz ufficiali AeCI**: 428 quesiti di teoria comune a tutti gli allievi piloti VDS/VL + 46 quesiti specifici per il parapendio (fascio funicolare, elevatori, centine, chiusure asimmetriche e manovre specifiche).
- **Potatura Radicale del Deltaplano (Focus 100% Parapendio)**: eliminati alla radice i 30 quesiti esclusivi dell'ala pendolare (barra di controllo, trapezio, trave di chiglia) e tutti i selettori/badge superflui, garantendo un'applicazione essenziale e priva di distrazioni.
- Suddivisione canonica nelle 9 materie d'esame ufficiali AeCI.
- Ciascuna domanda include 3 opzioni di risposta con un'unica soluzione corretta verificata sulle tabelle ministeriali.
- **Spiegazioni Didattiche Essenziali (100% Bespoke su 474 Quiz)**: ogni quesito è corredato da una spiegazione tecnica specifica, univoca e scientificamente rigorosa articolata in:
  - **Regola**: il principio fisico, aerodinamico o la norma di legge (D.P.R. 133/2010) alla base della risposta corretta.
  - **Tranello**: il bias cognitivo, la misconcezione o l'ambiguità tipica del quesito ministeriale.
- Ecosistema audio neurale offline (voci Giuseppe ed Elsa) sincronizzato con file MP3 dedicati per domanda, opzioni e spiegazione didattica.

### 2. Architettura Home Hub & Back Navigation Cockpit V2
- **Cruscotto Iniziale ad Alto Contrasto (Home Hub)**:
  - 6 macro-pulsanti tattili dedicati ai flussi principali: `TUTOR` (apprendimento guidato), `MATERIE` (studio 01-09), `ESAME` (prova ufficiale AeCI), `ERRORI` (quaderno Leitner), `CERCA` (archivio completo) e `STATS` (telemetria e radar).
  - Indicatori sintetici in tempo reale (quiz visti, accuratezza, errori attivi, indice di prontezza esame).
  - **Banner Ripresa Rapida**: rilevamento automatico di qualsiasi sessione di studio o esame interrotta, con ripresa istantanea a 1 tocco (`Riprendi Sessione`).
- **Mini-Header Compatto nei Quiz (~48px)**:
  - Nelle schermate interne di simulazione ed esercitazione, la barra secondaria a schede viene completamente rimossa per recuperare oltre 50px di spazio verticale utile.
  - Sostituita da una mini-header minimalista con pulsante `[← Home]`, indicatore del contesto e pulsante rapido `AUDIO` per lo switch hands-free.
  - **Salvaguardia Abbandono Esame**: modale di conferma per prevenire perdite involontarie di progresso se l'allievo preme `[← Home]` durante una prova d'esame in corso.
- **Sincronizzazione Tasto Indietro Smartphone (Hardware & Gestures Back Coordinator)**:
  - Il tasto fisico o le gesture di swipe indietro di Android e iOS eseguono sempre l'esatta azione del pulsante grafico visibile a schermo (chiusura del tastierino rapido nell'Archivio, chiusura dei fogli comandi, annullamento della modale di guardia esame, chiusura della Modalità Mani Libere o Impostazioni e ritorno al cruscotto Home).
  - All'interno dei quiz di studio materie, il comando indietro riporta direttamente al cruscotto Home garantendo linearità d'uso e azzerando le chiusure accidentali della PWA.

### 3. Simulatore d'Esame & Simulazione Didattica (Tutor)
- **Due Modalità di Simulazione Dedicate**:
  - 🎯 **Simulazione Didattica (Tutor - Consigliata per imparare)**:
    - 30 quesiti estratti con le quote ministeriali AeCI tramite il *Fair Coverage Randomizer*.
    - **Nessun limite di tempo**: studio rilassato senza countdown, con cronometro discreto del tempo trascorso.
    - **Verifica e Feedback Immediato**: alla selezione di una risposta, l'opzione viene validata all'istante (verde/rosso), con visualizzazione esplicita della soluzione esatta e della spiegazione contestuale didattica (**Regola** e **Tranello**).
    - **Mappa Interattiva a 30 Bolle**: la griglia dei quesiti colora ciascuno slot in tempo reale (verde smeraldo per le risposte esatte, rosso per gli errori) consentendo un'analisi immediata del proprio rendimento.
    - **Avanzamento Fluido a 1 Tocco & Auto-Advance su Risposta Esatta**:
      * In caso di risposta corretta, l'applicazione attende un intervallo percettivo di 900ms con conferma visiva verde smeraldo e avanza automaticamente alla domanda successiva, velocizzando le sessioni di studio sia in **Tutor**, sia in **Studio per Materie**, sia nel **Quaderno Errori**.
      * In caso di risposta errata, l'avanzamento automatico si arresta tassativamente per permettere all'allievo di consultare con calma la scheda didattica (**Regola** e **Tranello**).
      * Disattivabile in qualsiasi momento nelle Impostazioni (*Feedback di Studio* ➔ *Avanzamento automatico su risposta esatta*).
      * Pulsante dedicato *"Prossima Domanda"* sempre disponibile per avanzamento manuale.
    - **Registrazione Istantanea**: statistiche e telemetria salvate in tempo reale in IndexedDB, alimentando subito il Quaderno Errori senza attendere la fine della scheda.
  - ⏱️ **Simulazione Esame Ufficiale AeCI (Prova Formale)**:
    - 30 quesiti AeCI, timer countdown di 45 minuti con indicatori di stato visivi e allarmi negli ultimi minuti.
    - Esito, conteggio errori e debriefing completo svelati esclusivamente alla consegna finale.
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
- **Valutazione Ufficiale AeCI**:
  - **IDONEO**: massimo **3 errori** ammessi (minimo 27/30).
  - **NON IDONEO**: 4 o più errori.
- **Navigatore Quesiti Comprimibile a Singola Riga**:
  - Modalità **Espansa**: griglia ergonomica a 3 righe da 10 bolle (28px) con feedback cromatico di stato e indicatore flag `⚑`.
  - Modalità **Compressa a Singola Riga**: tutti i 30 quiz sono disposti orizzontalmente su **una sola riga** senza bisogno di scroll (tacche avioniche colorate a tutta larghezza con indicatore domanda attiva su smartphone, e numeri visibili su desktop).
  - Recupera oltre 70px verticali per favorire il layout *Zero-Scroll* con visualizzazione contemporanea di domanda, opzioni e spiegazione Regola/Tranello su smartphone compatti (390x844).
  - Persistenza automatica della preferenza compresso/espanso dell'allievo in memoria locale (`localStorage`).
- **Debriefing Finale**: esito immediato, tempo di esecuzione, riepilogo grafico ed elenco analitico delle risposte errate con accesso diretto alle spiegazioni.
- **Navigation Guard (Protezione Sessione)**: avviso di sicurezza e blocco in caso di tentata navigazione verso altre schede o ricaricamento pagina (`beforeunload`), evitando la perdita accidentale della simulazione in corso.

### 4. Studio Guidato per Materie
- Filtro rapido e dedicato per ciascuna delle 9 materie d'esame.
- Feedback visivo e sonoro istantaneo alla selezione di una risposta (`Esatta` / `Errata`).
- Visualizzazione immediata della spiegazione (*Regola* e *Tranello*) per massimizzare l'apprendimento sul campo.

### 5. Quaderno Errori con Ripetizione Spaziata
- Raccolta automatica di qualsiasi domanda errata durante le simulazioni o le sessioni di studio.
- Algoritmo di **Spaced Repetition (Box Leitner)**: un quesito esce dal quaderno degli errori solo dopo **2 risposte corrette consecutive** (`consecutiveCorrect >= 2`).
- Monitoraggio delle domande ancora da consolidare e avanzamento progressivo verso l'azzeramento degli errori.

### 6. Archivio con Ricerca Rapida Senza Tastiera (#ID Pad & Thematic Chips)
- Consultazione istantanea dei 474 quiz del catalogo con numerazione ufficiale AeCI.
- **Barra Rapida Materie (01..09 + TUTTE)**: selettore rapido a scorrimento orizzontale a singolo tocco, senza dropdown o menu di sistema, per isolare istantaneamente una materia.
- **Filtri di Stato a Tocco Singolo**: segmented pills con badge dei conteggi in tempo reale per `Tutte`, `Non viste`, `Errate`, `Preferiti` e `Note`.
- **7 Thematic Quick Chips**: filtri a tocco immediato per concetti frequenti del volo libero (*Vento*, *Stallo*, *Efficienza*, *Precedenze*, *Spazio Aereo*, *Termica*, *Nubi*) con abbinamento semantico automatico sulle radici delle parole.
- **Pad Numerico Rapido #ID**: tastierino 4x3 a scomparsa (tasti 0-9, Backspace `⌫`, `VAI ⏎`) con feedback aptico per digitare direttamente l'identificativo ministeriale (#1001-#9045) e saltare al quiz desiderato con auto-espansione e smooth scroll, senza mai attivare la tastiera virtuale dello smartphone.
- **Note Personali & Preferiti**: memorizzazione locale in Dexie IndexedDB con gestione note (aggiunta, modifica, eliminazione) e badge visivo.

### 7. Statistiche Avanzate & Ispezione Interattiva (Drilldown Liste)
- **Indice di Preparazione Esame**: percentuale calcolata sull'accuratezza globale e sulla copertura delle materie.
- **Ispezione Interattiva Materie (`SubjectDetailModal`)**: toccando qualsiasi materia nell'elenco si apre un cruscotto dedicato con percentuale di accuratezza, barra di copertura, pulsante rapido *"Allenati su questa materia"* (con salto istantaneo allo Studio Materie), filtri a 1 tocco (*Tutte*, *Errori*, *Non viste*, *Corrette*) ed elenco scorrevole dei singoli quesiti.
- **Scheda Integrale Quesito (`QuestionDetailModal`)**: toccando un quesito (dalla scheda materia o direttamente dalla Top 10 degli errori) si accede alla scheda completa ad alta leggibilità: testo integrale della domanda AeCI, 3 opzioni con risposta esatta evidenziata in verde smeraldo, spiegazione didattica (*Regola* e *Tranello*), riproduzione vocale neurale, note personali, preferiti e telemetria dettagliata (volte vista, errori, risposte corrette consecutive).
- **Top 10 Domande Più Ostiche**: graduatoria interattiva dei quesiti che hanno registrato il maggior numero di risposte errate, con apertura a singolo tocco della scheda del quesito.
- **Registro Storico Sessioni**: cronologia delle simulazioni svolte con esito (`IDONEO` / `NON IDONEO`), punteggio e tempo impiegato.

### 8. Modalità Mani Libere (Hands-Free Outdoor & Macro-Target Bici/Corsa)
- Pensata per lo studio in movimento a mani libere (in auto, furgone navetta, sui rulli in bici o durante la corsa all'aperto) con smartphone a braccio o su manubrio.
- **Riconcettualizzazione Visiva & Switch Universale**: iconografia a cuffie (`Headphones`) e pulsante rapido `Mani Libere` accessibile in qualunque quiz (Navbar e mini-header di Tutor, Materie, Esame, Errori) per passare all'ascolto senza perdere l'indice della domanda o le risposte date.
- **Macro-Target Tattili Outdoor per Bici & Corsa**:
  - 3 macro-fasce a tutta larghezza con altezza minima garantita `min-h-[78px] sm:min-h-[85px]`.
  - Badge numerici giganti (44-56px) con contrasto estremo e caratteri maggiorati (`text-base sm:text-xl`).
  - Spaziatura protetta e zero elementi affiancati per eliminare il rischio di miss-clicks dovuti alle vibrazioni del manubrio o al movimento.
- **Feedback Aptico di Bordo (`navigator.vibrate`)**: pattern di vibrazione tattile differenziati per tap, esito corretto, errore, cambio domanda e contrassegno bandierina.
- **Layout Ergonomico a Schermo Intero**: viewport bloccato a `100dvh` con **zero scrolling**.
- **Avanzamento Automatico ("Radio Quiz")**: modalità hands-free a tempo. L'app legge in sequenza la domanda e le opzioni, attende un intervallo configurabile (3-8s) e svela automaticamente la risposta esatta e la regola, passando da sola al quiz successivo.
- **Tutor Didattico Hands-Free (Regola & Tranello a Voce)**:
  - Accesso diretto con pulsante rapido **"Tutor Didattico (30 Quiz)"** nel Launcher o commutazione istantanea dalla schermata Tutor tramite il tasto `Mani Libere`.
  - Spiegazione didattica vocale neutrale (*"La risposta esatta è la... Regola: ... Tranello: ..."*) riprodotta **esclusivamente in caso di risposta errata** o mancata risposta prima dell'avanzamento, preservando la rapidità dello studio sulle risposte corrette. Sincronizzazione anti-troncamento dell'avanzamento automatico (attesa fine del file audio + pausa di assimilazione di 2.5s prima di avanzare). Sulle risposte esatte, la scheda didattica rimane consultabile a schermo con pulsante "Ascolta" per approfondimento opzionale.
  - Cronometro didattico incrementale (count-up senza limiti di tempo) e card didattica ad alto contrasto.
- **Ripetizione Selettiva Domanda e Opzioni (Touch, Voce & Tastiera)**: possibilità di isolare l'ascolto senza dover risentire l'intera sequenza di 20-30 secondi. Toccando l'area della domanda o il pulsante `[Solo Domanda]` viene ripetuta esclusivamente la domanda. Toccando il pulsante altoparlante `[🔊]` presente sul lato destro di ciascuna delle 3 macro-fasce (senza selezionare o rischiare sottomissioni involontarie) viene riletta unicamente quella specifica opzione. Pieno supporto a voce con comandi naturali (*"Ripeti domanda"*, *"Ripeti uno"*, *"Rileggi la due"*, *"Solo tre"*) e da tastiera (`Q` per domanda, `Alt+1` / `Alt+2` / `Alt+3` per opzioni).
- **Comandi Vocali Hands-Free in Italiano**: interazione completa a voce tramite Web Speech Recognition con comandi dedicati (`"Uno"`, `"Due"`, `"Tre"`, `"Avanti"`, `"Indietro"`, `"Ripeti"`, `"Ripeti Domanda"`, `"Ripeti Uno/Due/Tre"`, `"Bandiera"`, `"Pausa"`, `"Spiega"`, `"Tutor"`).
- **Gestione Microfono Anti-Eco (Selettore Altoparlante / Cuffie)**:
  - 🔊 **Modalità Altoparlante (Default - Senza cuffie)**: il microfono è temporaneamente disattivato mentre l'altoparlante legge la domanda, le opzioni o le spiegazioni, e si attiva automaticamente **solo a fine parlato** (durante il countdown di risposta) o **mentre l'audio è in pausa**. Grazie a un buffer acustico di 250ms, elimina alla radice qualsiasi interferenza o falso comando innescato dalla voce dello smartphone.
  - 🎧 **Modalità Cuffie (Con microfono)**: microfono sempre attivo in continuo per consentire il "barge-in" (interruzione del parlato a voce in qualsiasi istante).
  - Selettore rapido a 1 tocco nel Launcher, nell'HUD attivo della Modalità Mani Libere e nelle Impostazioni (*Mani Libere -> Dispositivo di Ascolto*).
- **Supporto Bivalente del Tema Colore (Cockpit Dark & Hangar Light)**: ottimizzato per zero riverberi notturni sul parabrezza e massima leggibilità sotto la luce diretta del sole.
- **Menu Rapido Impostazioni Voce Integrato (Quick Speech Menu)**: accesso a 1 tocco alle impostazioni vocali (Giuseppe / Elsa, velocità 0.9x-1.25x, lettura automatica ed effetti sonori).
- **Briefing Vocale Cockpit di Benvenuto**: spiegazione parlata chiara e sintetica all'apertura con salvataggio run-once in IndexedDB (`driveModeIntroPlayed: true`).

### 9. Motore Vocale Neurale (TTS Multi-Voce Offline) & Audio Cockpit
- **Oltre 5.000 Segmenti Audio Neurale Pre-Generati**: catalogo audio completo memorizzato localmente e funzionante al 100% offline.
- **Due Voci Selezionabili**:
  - 👨‍✈️ **Giuseppe**: timbro baritonale calmo, impostato come un istruttore di volo in cockpit (`rate -5%`, `pitch -5Hz`).
  - 👩‍✈️ **Elsa**: dizione cristallina, brillante ed energica.
- **Gestione Offline del Parlato & Download in Background (`audioDownloadManager`)**:
  - Download non bloccante via CacheStorage con pool concorrente a 8 connessioni.
  - Banner di avanzamento compatto in basso (`AudioDownloadBanner`).
  - Gestione granulare nelle Impostazioni (🎙️ Voce) con verifica aggiornamenti differenziali basati su hash MD5 (`manifest.json`).
  - Fallback intelligente offline se la voce attiva non è presente nella cache locale.
- **Normalizzazione Fonetica Aeronautica ICAO & Accenti Tonici (`aviationPhonetics.ts`)**:
  - Risoluzione omografi e disambiguazione verbo/sostantivo (es. *decade* $\rightarrow$ *decàde*, *subito* $\rightarrow$ *sùbito*, *circuito* $\rightarrow$ *circùito*).
  - Fissaggio dell'accento tonico piano su assi e dinamica del volo (*verticale/i* $\rightarrow$ *verticàle/i*, *orizzontale/i* $\rightarrow$ *orizzontàle/i*, *rollio* $\rightarrow$ *rollìo*).
  - Accento tonico sdrucciolo su meteorologia e strumenti (*isobare* $\rightarrow$ *isòbare*, *variometro* $\rightarrow$ *variòmetro*, *anemometro* $\rightarrow$ *anemòmetro*, *altimetro* $\rightarrow$ *altìmetro*).
  - Spaziatura fonetica lettera per lettera per acronimi tecnici (*UV*, *VNE*, *GPS*, *IAS*, *TAS*, *ATC*, *SIV*, *PIO*, *MSL*).
  - Pronuncia fedele delle sigle istituzionali, normative e unità di misura (*D.P.R. 133/2010*, *AeCI*, *VDS/VL*, *hPa*, *km/h*, *m/s*, *kt*).
- **Controlli Parlato Interattivi Universali (Play, Pausa, Riprendi, Da Capo)**: controlli dedicati su ogni frammento (domanda, singole opzioni 1, 2, 3 e spiegazione didattica).

### 10. Ergonomia Cockpit, Layout Zero-Scroll & Dimensione Font
- **Layout Zero-Scroll a Margini Compatti**:
  - Quote dimensionali calibrate (mini-header ~48px, bottom bar ~48px, card padding `p-2.5 sm:p-4`, pulsanti risposta `min-h-[44px] sm:min-h-[48px]`, line height `leading-snug`).
  - Garantisce che testo della domanda, 3 opzioni di risposta e scheda didattica Regola/Tranello coesistano su una singola schermata senza scorrimento verticale sui display mobile standard (390x844).
- **Dimensione Font (Font Scaling a 3 Livelli)**:
  - 3 scale carattere ergonomiche selezionabili in *Impostazioni -> Aspetto & Tema*:
    * **Compatto (14px)**: per massimizzare la compattezza sui display piccoli e azzerare ogni scroll.
    * **Normale (16px)**: dimensione standard per una lettura rilassata e bilanciata.
    * **Grande / Outdoor (18px)**: corpo maggiorato per l'uso all'aperto, a braccio teso o con smartphone su manubrio.
  - Persistenza in Dexie IndexedDB (`fontSizePreference: 'compact' | 'normal' | 'large'`).
  - Applicazione fluida e reattiva tramite unità `rem` alla radice (`html[data-font-size]`), preservando l'armonia delle spaziature e prevenendo ogni distorsione grafica.
- **Barra Navigazione Quiz Ancorata in Basso (`QuizBottomBar`)**:
  - Comandi `Precedente`, `⚑ Segna`, `Prossima Domanda` e `Consegna` costantemente visibili in basso a portata di pollice con supporto safe-area.
- **Schermata Impostazioni Fullscreen ad Accordion Compresso Singolo**:
  - 6 argomenti verticali ad apertura esclusiva (Aspetto, Voce, Mani Libere, Backup, Dati, About) con badge live riassuntivi.
- **Temi Cockpit Dark & Hangar Light, Palette ad Alto Contrasto e Scorciatoie da Tastiera**:
  - Zero dominante blu (tonalità neutre `zinc` + accento ambra avionico), icone Aero Shield, e scorciatoie fisiche complete (`1`, `2`, `3`, `F`, `Spazio`, `Q`, `Esc`).
  - Rimozione della bottom bar fissa per liberare fino a 60px di altezza utile su smartphone per il testo dei quiz, le risposte e il feedback didattico immediato.
  - **Badge di Versione Dinamico**: esposizione in tempo reale della versione dell'app (`v1.0.0`) e dell'ID di build con commit hash nella Navbar e nell'header delle Impostazioni.
- **Barra di Navigazione Quiz Ancorata in Basso (Sticky / Fixed Bottom Action Bar)**:
  - Durante l'esecuzione dei quiz (**Simulazione Didattica Tutor** ed **Esame Ufficiale AeCI** in `ExamScreen`, **Studio per Materie** in `TopicsScreen` e ripasso **Quaderno Errori** in `MistakesScreen`), i comandi di navigazione (`Precedente`, `Successiva`, flag rapido `⚑ Segna/Rivedi`, pulsante prioritario `Prossima Domanda` in modalità tutor e `Consegna/Concludi`) sono **costantemente visibili e ancorati sul fondo del viewport** (`fixed bottom-0 z-30`).
  - Sfondo avionico sfumato con `backdrop-blur-md`, pieno supporto per le safe area inferiori degli smartphone (`pb-[max(0.75rem,env(safe-area-inset-bottom))]`) e calibrazione del padding di clearance (`pb-28 sm:pb-32`) per garantire la consultazione fluida e l'avanzamento con il pollice a una mano senza dover scorrere la pagina verso il basso.
- **Schermata Impostazioni Fullscreen ad Accordion Compresso Singolo (Single-Open Accordion)**:
  - Esperienza nativa a tutto schermo che sostituisce le vecchie barre orizzontali a pillole/tabs con un **layout verticale compatto ad accordion a mutua esclusione**: l'apertura di un pannello espande la sezione desiderata e chiude automaticamente qualsiasi altra sezione precedentemente aperta (`openSection: SettingsTab | null`), azzerando lo scorrimento e la dispersione visiva su smartphone e desktop.
  - Suddivisione modulare in 6 argomenti dedicati con icone tematiche e **live preview badge dinamici**:
    * **🎨 Aspetto**: tema attivo (`Auto` / `Cockpit Dark` / `Hangar Light`) e feedback didattico immediato ON/OFF. Include toggle per massimizzazione a Schermo Intero (Browser Fullscreen).
    * **🎙️ Voce**: istruttore attivo (Giuseppe / Elsa), velocità di lettura, motore TTS (Web / Cache offline) ed effetti sonori cockpit.
    * **🚗 Mani Libere**: stato dell'avanzamento automatico continuo, countdown di risposta (3-8s) e riattivazione del briefing vocale iniziale.
    * **☁️ Backup**: stato della sincronizzazione Google Drive GIS (`Auto-Sync` / `Manuale`), ultimo backup e gestione token.
    * **⚙️ Dati**: catalogo 504 quiz Dexie IndexedDB (SSOT), ripristino/esportazione JSON locale e reset totale.
    * **ℹ️ About**: versione attiva dell'applicazione (`v1.0.0 • AeCI`), riferimenti normativi ufficiali (D.P.R. 9 luglio 2010, n. 133 e regolamenti esame AeCI 30 quiz, 45 min, max 3 errori) e architettura di bordo.
  - Toolbar rapida di controllo con contatore sezioni e pulsante contestuale per **comprimere tutto** a vista d'occhio o **espandere la prima sezione**.
  - Eliminazione totale dello scrolling della pagina sottostante (body scroll lock) per una navigazione pulita e focalizzata.
- **Palette Cockpit Bimodale**:
  - **Carbon Cockpit (Dark Mode Zero-Blue)**: Sfondo grafite profondo e carbonio neutro (`#09090b` / `zinc-950`, superfici `zinc-900`, bordi `zinc-800`, testo `zinc-100`), **con dominante blu categoricamente rimossa (0% cool hue)**. Accento avionico caldo **Aviation Amber** (`amber-500` / `amber-600`) per indicatori, selezioni e bagliore cockpit, ottimizzato per riposo visivo e cockpit notturni.
  - **Hangar Light (Outdoor High-Contrast)**: Sfondo diurno ad altissimo contrasto per perfetta leggibilità sul campo di volo o sotto la luce solare diretta in decollo.
- **Scorciatoie da Tastiera Desktop**:
  - `1`, `2`, `3`: selezione immediata delle opzioni A, B o C.
  - `F`: aggiunta o rimozione bandierina (`⚑ Rivedi`).
  - `Spazio` o `Freccia Destra`: domanda successiva.
  - `Freccia Sinistra`: domanda precedente.
  - `V`: Play / Pausa riproduzione vocale sequenziale.
  - `R` o `Shift + V`: Ricomincia da capo la sequenza completa del quesito.
  - `Q`: toggle Play / Pausa della domanda (`Shift + Q` per riavviare da capo).
  - `Alt + 1 / 2 / 3`: toggle Play / Pausa della rispettiva opzione (`Alt + Shift + 1 / 2 / 3` per riavviare da capo).
  - `E`: toggle Play / Pausa della spiegazione didattica (`Shift + E` per riavviare da capo).
  - `Esc`: stop e chiusura controlli audio in corso.

### 11. Fair Coverage Randomizer
- Algoritmo a bucket ponderati sviluppato per superare il noto problema statistico del *collezionista di figurine* (*Coupon Collector's Problem*).
- Priorità assoluta ai quesiti mai estratti (`times_seen == 0`), garantendo la copertura equa di tutti i 474 quiz prima di riproporre domande già incontrate.

### 12. Privacy, Offline-First, Auto-Sync & Smart Merge
- **100% Client-Side & Zero Profilazione**: nessun database proprietario centrale, nessun cookie pubblicitario o tracciamento.
- **Persistenza Locale Dexie.js (IndexedDB)**: storage asincrono, strutturato e robusto sul browser dell'utente (Single Source of Truth).
- **Service Worker PWA**: installazione come applicazione standalone su iOS, Android, macOS e Windows con funzionamento completo anche in assenza di segnale.
- **Sincronizzazione Automatica Continua (Auto-Sync)**: salvataggio automatico in background con debounce (15-20s) e push immediato al completamento delle simulazioni d'esame.
- **Smart Merge Deterministico**: motore di fusione intelligente per sincronizzare più dispositivi (es. PC a casa e smartphone sul campo) senza sovrascritture cieche: tutti gli esami sostenuti vengono preservati (unione cronologica) e per ciascun quesito viene adottato lo stato di apprendimento più recente.
- **Ripresa Rapida della Sessione (Cross-Device Resume)**: persistenza continua della sessione attiva (esame, materia o quaderno errori) con cursore esatto, risposte parziali e timer; all'apertura su un nuovo dispositivo, un banner avionico consente di riprendere con un tocco esattamente da dove ci si era fermati.
- **Resilienza Offline con Invio Differito**: studio fluido anche in decollo o in viaggio senza connettività; al rientro della rete (`online`), l'engine sincronizza silenziosamente le modifiche con Google Drive.
- **Indicatore Offline Avionico (Cockpit Offline HUD & Briefing)**:
  - Rilevamento in tempo reale della connettività tramite `NetworkStatus` e `useOnlineStatus`.
  - Pillola avionica ambra `[⚡ OFFLINE]` sempre visibile nell'header e nell'HUD della Modalità Mani Libere quando si è senza connessione.
  - Banner informativo dismissibile con rassicurazione didattica: tutti i 474 quiz, risposte, esami e note sono 100% disponibili in locale su IndexedDB.
  - Modale di briefing a 1 tocco che spiega nel dettaglio la persistenza autonoma e la sincronizzazione in coda.
  - Transizione e badge di riconnessione verde `[ONLINE]` (3.5s) al ripristino della copertura.
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

# Collaudo visivo navigazione esame, debriefing e zero-warning console
npm run test:visual:review

# Collaudo interattivo Modalità Mani Libere (Launcher, radio quiz, risposta e chiusura)
npm run test:visual:drive:flow

# Collaudo specifico della Modalità Mani Libere (CDP Mobile 390x844)
npm run test:visual:drive

# Collaudo visivo del navigatore compresso a singola riga (CDP Mobile & Desktop)
npm run test:visual:nav

# Consolidamento frammenti di diario multi-agente (.agents/worklog.d/ -> WORKLOG.md)
npm run worklog:consolidate
```

---

## 📖 Documentazione di Progetto & Sviluppo

Questo progetto adotta un sistema di **governance della conoscenza inter-agente** strutturato per garantire continuità, integrità architetturale e trasparenza:

- 🧭 **[DESIDERATA.md](file:///c:/github/Quiz_VDS-VL/DESIDERATA.md)**: La visione di prodotto, i requisiti core e la matrice di stato di tutte le funzionalità.
- 🧠 **[MEMORY.md](file:///c:/github/Quiz_VDS-VL/MEMORY.md)**: La memoria tecnica permanente contenente vincoli tecnici stabili, regole d'esame AeCI e lezioni apprese.
- 📓 **[WORKLOG.md](file:///c:/github/Quiz_VDS-VL/WORKLOG.md)**: Il registro cronologico di tutte le lavorazioni svolte e delle decisioni architetturali (ADR).
- 📁 **[.agents/worklog.d/](file:///c:/github/Quiz_VDS-VL/.agents/worklog.d/)**: Frammenti di diario isolati generati da sessioni concorrenti in Git Worktree per azzerare i conflitti di merge.
- 📜 **[AGENTS.md](file:///c:/github/Quiz_VDS-VL/.agents/AGENTS.md)**: Le direttive operative e i workflow obbligatori per gli agenti AI.

> ⚠️ **Regola Operativa per le Modifiche Future**:  
> In accordo con le direttive di progetto, **questo `README.md` deve essere mantenuto puntualmente aggiornato** a fronte di ogni introduzione di nuove funzionalità, estensione di moduli o modifica del comportamento dell'applicazione.
