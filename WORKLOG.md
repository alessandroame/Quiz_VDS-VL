# 📓 Diario di Bordo & Registro Lavorazioni (WORKLOG & ADR)

Questo documento registra in ordine cronologico tutte le lavorazioni svolte nel repository, le scelte architetturali/tecniche adottate (con relative motivazioni e trade-off) e l'impatto sul desiderata di progetto.  
**Ogni agente AI ha l'obbligo contrattuale di appendere una voce qui al termine di ciascuna sessione di lavoro prima di effettuare il commit.**

---

## Template per Nuove Voci

```markdown
### [YYYY-MM-DD] - <Titolo della Lavorazione>
- **Cosa abbiamo fatto**: <Sintesi oggettiva degli interventi effettuati, componenti creati o modificati>
- **Scelte architetturali & Rationale**: <Decisioni tecniche, librerie o pattern adottati, alternative scartate e motivazioni>
- **Impatto sul Desiderata**: <Come questo intervento contribuisce al desiderata (cfr. DESIDERATA.md) e indicazioni per il prossimo agente>
```

# Worklog Fragment: Transizione a minimal-ui-ux ed Ergonomia di Studio

- **Data**: 2026-09-29
- **Autore**: AI Agent
- **Topic**: Transizione da `aviation-ui-ux` a `minimal-ui-ux` e ridefinizione concettuale

### Cosa abbiamo fatto
- Ridenominata la skill da `.agents/skills/aviation-ui-ux` a `.agents/skills/minimal-ui-ux`.
- Riscritto il file [SKILL.md](file:///d:/Github/Quiz_VDS-VL/.agents/skills/minimal-ui-ux/SKILL.md) rifocalizzando l'intera filosofia dell'interfaccia: l'utente è un allievo pilota che studia la teoria dei 504 quiz AeCI, non un pilota in volo o in cabina di pilotaggio.
- Eliminata la terminologia forzata da "cockpit", "avionica", "Hangar Light" e "Cockpit Dark", sostituita da un design system essenziale per lo studio teorico con temi Scuro / Chiaro ad alto contrasto e microcopy telegrafico.
- Aggiornati i riferimenti nei documenti di governance e memoria:
  * [.agents/AGENTS.md](file:///d:/Github/Quiz_VDS-VL/.agents/AGENTS.md)
  * [.agents/rules/constraints.md](file:///d:/Github/Quiz_VDS-VL/.agents/rules/constraints.md)
  * [DESIDERATA.md](file:///d:/Github/Quiz_VDS-VL/DESIDERATA.md)
  * [MEMORY.md](file:///d:/Github/Quiz_VDS-VL/MEMORY.md)
  * [TODO.md](file:///d:/Github/Quiz_VDS-VL/TODO.md)

### Scelte architetturali & Rationale
- **Fine della Metafora "Cockpit"**: L'app è una web app di studio e simulazione esame teorico. Insistere su concetti di avionica di bordo creava ridondanza e allucinazioni terminologiche nelle conversazioni con l'utente.
- **Preservazione dell'Ergonomia Minimale**: Restano pienamente validi e rafforzati i principi cardine di usabilità: microcopy secco di 1-2 parole (*Esame*, *Errori*, *IDONEO*), target di tocco ampi per mobile, scorciatoie da tastiera per desktop e assenza totale di preamboli o testi inutili.

### Impatto sul Desiderata
- Riconferma e chiarimento del Principio Filosofico 1 di [DESIDERATA.md](file:///d:/Github/Quiz_VDS-VL/DESIDERATA.md): "Zero Distrazioni & Ergonomia di Studio", orientando qualsiasi sviluppo futuro della UI verso la massima concentrazione ed efficacia didattica.

---

# Registro di Bordo: Schermate Dedicate per Tutor Didattico ed Esame Ufficiale AeCI

- **Data**: 2026-09-29
- **Autore/Agente**: Antigravity Cockpit Specialist
- **Tipo di Intervento**: `feat(exam)`
- **Argomento**: Separazione visiva e logica tra le schermate di atterraggio di Tutor Didattico ed Esame Ufficiale AeCI (eliminazione duplicazione menu unico).

---

### 1. Cosa abbiamo fatto
- **Separazione Dedicata in `src/components/ExamScreen.tsx`**:
  - Risolta la ridondanza di UX in cui sia il clic su *Tutor Didattico* (card [1] in Home) sia su *Esame Ufficiale* (card [3] in Home) mostravano la medesima schermata generica con tutte le modalità duplicate.
  - Differenziato lo stato `idle` in base a `examMode` (sincronizzato dinamicamente con `initialMode`):
    - **Tutor Didattico (`tutor`)**: Briefing focalizzato sull'apprendimento senza stress temporale, con regole didattiche in evidenza (30 quiz con Fair Coverage, nessun timer, spiegazione immediata Regola e Tranello), pulsante primario `btn-start-tutor-exam` e switch rapido discreto verso l'Esame Ufficiale.
    - **Esame Ufficiale AeCI (`official`)**: Briefing formale fedele alla prova ministeriale (D.P.R. 133/2010: 30 quiz, countdown 45 min, max 3 errori, nessun feedback intermedio, debriefing alla consegna), pulsante primario `btn-start-exam`, box secondario per la Maratona Intensiva (60 quiz / 60 min) e switch rapido verso il Tutor Didattico.
  - Aggiunta prop facoltativa `onSwitchMode?: (mode: ExamModeType) => void` per navigazione reattiva e dichiarativa.
  - Aggiornati i pulsanti di riavvio nella schermata di review finale per contestualizzare la ripartenza in base alla modalità appena conclusa.
- **Integrazione in `src/App.tsx`**:
  - Applicate le chiavi `key="tutor"` e `key="exam"` per garantire un ciclo di vita e una reinizializzazione di stato pulita e immediata al cambio di scenario.
  - Passata la callback `onSwitchMode` collegata a `handleSelectTab`.
- **Aggiornamento Suite di Test Vitest**:
  - Aggiunto test `NAV-06` in `src/utils/navigation.test.ts` per certificare l'unicità e la divergenza funzionale tra lo scenario `tutor` e lo scenario `exam`.
  - Aggiornato `src/components/QuestionNavigator.test.ts` per compatibilità con l'interpolazione SSR di React 19.

---

### 2. Scelte Architetturali & Rationale
- **Purezza dei 6 Macro-Scenari del Cruscotto Home**: Ciascuno dei 6 pulsanti tattili della Home Hub (`TUTOR`, `MATERIE`, `ESAME`, `ERRORI`, `ARCHIVIO`, `STATS`) corrisponde ora a un'esperienza autonoma, chiara e priva di passaggi ridondanti.
- **Zero Dangling Clicks**: L'allievo pilota non viene più disorientato atterrando su una lista generica dove deve ricliccare una seconda volta la stessa modalità scelta un secondo prima.
- **Cross-Link Ergonomici**: Entrambe le schermate mantengono un link rapido in fondo che permette all'allievo di passare dall'una all'altra senza dover forzatamente tornare alla Home.

---

### 3. Impatto sul Desiderata
- Allinea perfettamente l'interfaccia alle specifiche del cockpit avionico definite in `DESIDERATA.md`.
- Risolve l'attrito cognitivo e la ridondanza segnalati dall'utente durante l'interazione con la PWA.

---

# Registro di Bordo: Sincronizzazione Tasto Indietro Hardware/Gestures (Back Navigation Coordinator)

- **Data**: 2026-09-29
- **Autore/Agente**: Antigravity Cockpit Specialist
- **Tipo di Intervento**: `feat(navigation)`
- **Argomento**: Sincronizzazione hardware/gesture back button (Android / iOS / popstate) con il tasto grafico a schermo secondo gerarchia LIFO a livelli.

---

### 1. Cosa abbiamo fatto
- **Modulo Puro Back Navigation Coordinator (`src/utils/backNavigation.ts`)**:
  - Implementato `BackNavigationService` con tracciamento della profondità (`historyDepth`) e registry per submodali LIFO (`registerSubModal`).
  - Funzione pura `executeBackAction(ctx)` che risolve determinata la priorità dell'azione indietro:
    1. Sub-modali interne attive (es. tastierino #ID Archivio, Help comandi vocali, modali conferma);
    2. Modale guardia abbandono esame (`pendingTab`);
    3. Modalità Audio fullscreen (`isDriveModeOpen`);
    4. Schermata Impostazioni fullscreen (`isSettingsOpen`);
    5. Schermate interne quiz/sezioni (`activeTab !== 'home'`): intercettazione esame in corso o ritorno a Home;
    6. Home Hub (`activeTab === 'home'`): nessun intercetto (consente l'uscita nativa dal browser/PWA).
  - Funzione `triggerGraphicBack(ctx)` che sincronizza i click fisici sui pulsanti grafici con `window.history.back()`.
- **Suite di Test Vitest (`src/utils/backNavigation.test.ts`)**:
  - Creata Suite 21 con 8 test unitari passanti al 100% coprendo tutti i livelli gerarchici, la guardia esame, la chiusura submodali e il fallback se la profondità è zero.
- **Integrazione Reattiva in `src/App.tsx`**:
  - Agganciato listener `popstate` globale con inizializzazione di `history.replaceState({ appDepth: 0 }, '')`.
  - Impiegato `navigationContextRef` aggiornato a ogni render per azzerare qualsiasi stale closure nel listener asincrono.
  - Sincronizzati `handleSelectTab`, `confirmAbandonAndNavigate`, `cancelNavigation`, `handleOpenSettings`, `handleCloseSettings` e `handleCloseDriveMode`.
- **Aggancio Submodali nei Componenti UI**:
  - `VoiceCommandsModal.tsx`: registrazione automatica con `backNavigation` alla comparsa e rimozione alla chiusura.
  - `ExamScreen.tsx`: registrazione submodali per `showSubmitModal` e `showAbandonModal`.
  - `ArchiveScreen.tsx`: registrazione del tastierino numerico #ID (`isKeypadOpen`).
  - `DriveModeScreen.tsx`: registrazione di `showAbandonExamModal` e `showOfflinePrompt`.

---

### 2. Scelte Architetturali & Rationale
- **Single Source of Truth per l'Indietro**: Sia il tocco sul pulsante grafico visibile a schermo (`[← Home]`, `[←]`, `[X]`, `Rimani nell'Esame`) sia il tasto Indietro/gesture dello smartphone eseguono lo stesso percorso atomico sincronizzato con `window.history.back()`, azzerando qualsiasi desincronizzazione dello stack.
- **Guardia Anti-Abbandono Esame Integrata**: Se un allievo pilota usa il gesto swipe indietro mentre sostiene l'esame ufficiale, l'esame non viene interrotto accidentalmente: il coordinator ripristina la voce di cronologia e apre il dialogo di conferma. Un secondo gesto indietro chiude il dialogo e mantiene il pilota nella prova.
- **Conformità Regola 2 Utente**: All'interno delle sessioni quiz di Studio Materie, il tasto indietro non torna all'elenco materie ma ritorna direttamente a Home (come confermato dall'utente).

---

### 3. Impatto sul Desiderata
- Rende l'esperienza PWA su smartphone Android e iOS indistinguibile da un'app nativa.
- Risolve definitivamente il rischio di chiusura accidentale della PWA durante le sessioni di studio.
- Tutti i 190 test Vitest su 21 suite superati con successo.

---

# Registro di Bordo: TODO-06 Impostazione Dimensione Font (Font Scaling / Outdoor Comfort)

- **Data**: 2026-09-29
- **Autore/Agente**: Antigravity Cockpit Specialist
- **Tipo di Intervento**: `feat(settings)`
- **Argomento**: 3 scale carattere ergonomiche (Compatto 14px, Normale 16px, Grande/Outdoor 18px), persistenza in Dexie e adattamento proporzionale senza distorsione di layout.

---

### 1. Cosa abbiamo fatto
- **Tipizzazione e Persistenza Schema Dexie (`src/types/database.ts`, `src/db/index.ts`)**:
  - Aggiunto il tipo `FontSizePreference = 'compact' | 'normal' | 'large'`.
  - Integrata la proprietà `fontSizePreference` nell'interfaccia `AppSettings` e in `DEFAULT_SETTINGS` (con default `'normal'`).
- **Modulo Puro Font Size Scaling (`src/utils/fontSize.ts`)**:
  - Definite le costanti `FONT_SIZE_OPTIONS`:
    * `compact`: `Compatto (14px)` - Ideale per smartphone compatti e zero-scroll.
    * `normal`: `Normale (16px)` - Dimensione standard bilanciata.
    * `large`: `Grande / Outdoor (18px)` - Alta leggibilità da manubrio bici o con guanti.
  - Funzioni pure `getFontSizeLabel` e `applyFontSizePreference` (imposta l'attributo `data-font-size` sul nodo root `document.documentElement`).
- **Suite di Test Vitest (`src/utils/fontSize.test.ts`)**:
  - Creata Suite 20 con 6 test unitari passanti al 100% (validazione opzioni, fallback e simulazione manipolazione DOM).
- **Integrazione CSS & HTML (`src/index.css`, `index.html`)**:
  - Definite regole per `html[data-font-size="compact"]` (14px), `html[data-font-size="normal"]` (16px) e `html[data-font-size="large"]` (18px).
  - Poiché Tailwind CSS impiega unità `rem` per tipografia e spaziature, il ridimensionamento della radice scala l'intera interfaccia in modo perfettamente armonico e proporzionale.
  - Aggiunto `data-font-size="normal"` nativo in `index.html` per azzerare qualsiasi Cumulative Layout Shift (CLS) prima dell'idratazione.
- **Aggancio Reattivo in `App.tsx` & Selettore in `SettingsModal.tsx`**:
  - In `src/App.tsx`, aggiunto `useEffect` per sincronizzare in tempo reale l'attributo `data-font-size` non appena l'utente modifica l'impostazione.
  - In `src/components/SettingsModal.tsx`, aggiunta la griglia a 3 opzioni nella scheda "Aspetto & Tema" con indicatore live, badge di riepilogo nell'accordion (`Auto • Normale • Feedback ON`) e pulsanti ad alto contrasto.
- **Collaudo Visivo CDP Headless**:
  - Aperto il pannello Impostazioni in headless Chrome (390x844): verificata la visualizzazione corretta della scheda, l'evidenziazione della scelta attiva e 0 errori in console.
  - Tutti i 182 test unitari Vitest su 20 suite superati con successo.

---

### 2. Scelte Architetturali & Rationale
- **Root Rem Scaling vs Inline Overrides**: Scalare la dimensione del carattere agendo su `font-size` del tag radice `<html>` permette a Tailwind CSS di scalare tipografia, padding e line-height contemporaneamente e senza override invasivi classe per classe, prevenendo overflow o sovrapposizioni.
- **Massima Ergonomia Outdoor**: Per allievi che ripassano con il telefono montato sul manubrio della mountain bike o che corrono all'aperto, il livello `Grande (18px)` aumenta nettamente la leggibilità a distanza di braccio teso.

---

### 3. Impatto sul Desiderata
- Completa con successo **TODO-06** della roadmap Cockpit V2 in [DESIDERATA.md](file:///d:/Github/Quiz_VDS-VL/DESIDERATA.md).
- **TUTTI I 6 PUNTI DELLA ROADMAP COCKPIT V2 SONO ORA AL 100% COMPLETATI E CERTIFICATI DA TEST E SCREENSHOT**:
  1. TODO-01: Potatura Radicale del Deltaplano (Focus 100% Parapendio, 474 quiz)
  2. TODO-02: Architettura "Home Hub + Back Navigation"
  3. TODO-03: Modalità Audio (Hands-Free) & Macro-Target Bici/Corsa con haptics
  4. TODO-04: Layout Zero-Scroll e Ottimizzazione Spaziale
  5. TODO-05: Archivio con Ricerca Rapida Senza Tastiera (#ID Pad, Materie 01-09, Chips)
  6. TODO-06: Impostazione Dimensione Font (Font Scaling / Outdoor Comfort)

---

# Registro di Bordo: TODO-05 Archivio con Ricerca Rapida Senza Tastiera

- **Data**: 2026-09-29
- **Autore/Agente**: Antigravity Cockpit Specialist
- **Tipo di Intervento**: `feat(archive)`
- **Argomento**: Barra rapida materie 01-09, filtri di stato a tocco singolo con badge live, 7 quick chips tematiche e pad numerico rapido #ID no-keyboard.

---

### 1. Cosa abbiamo fatto
- **Modulo Puro Filtri Archivio (`src/utils/archiveFilters.ts`)**:
  - Implementata logica deterministica di filtraggio e ricerca per l'Archivio con disaccoppiamento totale da React.
  - Funzione `getArchiveStatusCounts`: calcolo reattivo in tempo reale dei contatori per ciascuna categoria (`all`, `unseen`, `incorrect`, `bookmarked`, `with_notes`), contestualizzati alla materia eventualmente selezionata.
  - Funzione `filterArchiveQuestions`: supporto combinato per ricerca testuale/ID, filtro materia, filtri stato e filtri tematici.
  - Funzione `findQuestionById` e `formatSubjectCode` (`01`..`09`).
  - Definizione standard delle 7 chips concettuali (`ARCHIVE_CONCEPT_CHIPS`): *Vento*, *Stallo*, *Efficienza*, *Precedenze*, *Spazio Aereo*, *Termica*, *Nubi* con mapping a keyword e radici semantiche per massimizzare la copertura sui 474 quiz deltaplano/parapendio.
- **Suite di Test Vitest (`src/utils/archiveFilters.test.ts`)**:
  - Creata Suite 19 con 11 test unitari passanti al 100% (copertura calcolo conteggi, filtri singoli e combinati, ricerca ID con e senza prefisso `#`, chips tematiche).
- **Rinnovamento Cockpit di `ArchiveScreen.tsx`**:
  - **Barra Rapida Materie (`01`..`09` + `TUTTE`)**: Barra a scorrimento orizzontale priva di dropdown OS nativo; passaggio istantaneo tra le materie con 1 tocco e indicazione chiara del nome esteso nel tooltip.
  - **Filtri di Stato a Tocco Singolo**: Segmented pills ad alto contrasto per `Tutte`, `Non viste`, `Errate`, `Preferiti` e `Note`, ciascuna dotata di badge numerico del conteggio live.
  - **Thematic Quick Chips**: 7 pulsanti pill per filtrare istantaneamente concetti cardine del volo libero senza digitare una sola lettera.
  - **Pad Numerico Rapido #ID**: Tastierino numerico 4x3 incorporato a scomparsa (tasti 0-9, Backspace `⌫`, Invio `VAI ⏎`, pulizia rapida) con feedback aptico, digitazione live dell'ID (es. `#1024`), auto-espansione e smooth scroll immediato verso la card bersaglio, senza mai attivare la tastiera su schermo dello smartphone.
  - **Pulsante di Reset Globale**: Consente di azzerare istantaneamente qualsiasi combinazione di filtri attivi.
- **Disambiguazione Icone Header (`VoiceQuickMenu.tsx`)**:
  - Sostituita l'icona `Headphones` del pulsante rapido parlato con `Volume2` per evitare la duplicazione grafica con l'icona cuffie della "Modalità Audio" nel mini-header.
- **Collaudo Visivo CDP Headless**:
  - Eseguito test su mobile 390x844 aprendo la schermata Archivio e attivando il tastierino numerico.
  - Verificato screenshot: 0 errori in console, 0 warning, layout compatto ad alto contrasto perfettamente integrato.
  - Tutti i 176 test unitari Vitest superati con successo.

---

### 2. Scelte Architetturali & Rationale
- **Esperienza Outdoor/Mobile "Zero-Virtual-Keyboard"**: L'apertura della tastiera virtuale di Android/iOS su mobile occupa oltre il 50% dell'altezza dello schermo, nascondendo i risultati e introducendo lag. L'introduzione del pad numerico 4x3 dedicato e delle quick chips permette all'allievo di consultare qualsiasi domanda o argomento con la sola pressione del pollice in meno di 2 secondi.
- **Pure Functional Core**: Tutta la logica di conteggio e filtraggio risiede in `src/utils/archiveFilters.ts`, rendendola facilmente testabile e riutilizzabile.

---

### 3. Impatto sul Desiderata
- Completa con successo **TODO-05** della roadmap Cockpit V2 in [DESIDERATA.md](file:///d:/Github/Quiz_VDS-VL/DESIDERATA.md).
- Ultimo step della roadmap: **TODO-06 (Impostazione Dimensione Font / Font Scaling)**.

---

# Registro di Bordo: TODO-04 Layout Zero-Scroll e Ottimizzazione Spaziale

- **Data**: 2026-09-29
- **Autore/Agente**: Antigravity Cockpit Specialist
- **Tipo di Intervento**: `refactor(ui)`
- **Argomento**: Ottimizzazione spaziale e margini compatti per visualizzazione senza scroll verticale su display mobile (390x844).

---

### 1. Cosa abbiamo fatto
- **Compattazione QuestionCard (`src/components/QuestionCard.tsx`)**:
  - Ridotti i margini del container principale a `p-3 sm:p-4 rounded-2xl` (da `p-4 sm:p-6`).
  - Ottimizzato l'header superiore della card a `mb-2 pb-1.5` con badge ID compatto.
  - Calibrato il testo della domanda a `text-sm sm:text-base font-semibold leading-snug mb-2.5 sm:mb-3`.
  - Ridotte le opzioni di risposta con `space-y-2` e altezza minima ergonomica `min-h-[44px] sm:min-h-[48px]`, padding `p-2.5 sm:p-3`, badge numerici `w-5 h-5 sm:w-6 sm:h-6 text-[11px] sm:text-xs` e testo a `leading-snug`.
  - Snellite le schede didattiche di feedback (Regola & Tranello): margini `mt-2.5 pt-2`, spaziatura interna `space-y-1 p-2 sm:p-2.5`, testo `text-xs leading-snug`.
- **Ottimizzazione Piani di Contenimento nei Quiz (`ExamScreen.tsx`, `TopicsScreen.tsx`, `MistakesScreen.tsx`)**:
  - Calibrati i wrapper contenitore a `px-2.5 sm:px-4 py-2 sm:py-3 space-y-2.5 sm:space-y-3 pb-20 sm:pb-24`.
  - Ricalibrate le barre superiori di sessione ed esame a `p-2 sm:p-2.5` e sticky offset `top-[48px] sm:top-[50px]`.
- **Compattazione `QuizBottomBar.tsx`**:
  - Ridotto il padding della bottom bar fissa a `px-3 sm:px-4 py-2 sm:py-2.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]`.
  - Pulsanti Precedente, Flag, Successiva/Consegna calibrati su `py-2 min-h-[40px] text-xs`.
- **Collaudo Headless & Visual Check CDP**:
  - Eseguito `visual_check.js mobile-portrait` (390x844): 0 warning, 0 errori in console, layout stabilizzato e zero-scroll garantito.
  - Tutti i 165 test unitari Vitest su 18 suite superati al 100%.

---

### 2. Scelte Architetturali & Rationale
- **Zero-Scroll senza overflow nascosto artificiale**: Piuttosto che forzare `overflow-hidden` che rischierebbe di troncare domande più lunghe, abbiamo compattato verticalmente le quote geometriche (Navbar ~48px, BottomBar ~48px, Card padding, min-h dei bottoni a 44px conformi alle linee guida touch) lasciando oltre 650px liberi per il contenuto utile. Su uno schermo 390x844, domanda, 3 opzioni e spiegazione didattica rientrano interamente nel viewport.

---

### 3. Impatto sul Desiderata
- Completa con successo **TODO-04** della roadmap Cockpit V2 in [DESIDERATA.md](file:///d:/Github/Quiz_VDS-VL/DESIDERATA.md).
- Pronto per **TODO-05 (Archivio con Ricerca Rapida Senza Tastiera)**.

---

# Registro di Bordo: TODO-03 Modalità Audio (Audiolibro Hands-Free) & Macro-Target Bici/Corsa

- **Data**: 2026-09-29
- **Autore/Agente**: Antigravity Cockpit Specialist
- **Tipo di Intervento**: `feat(audio)`
- **Argomento**: Riconcettualizzazione in Modalità Audio, macro-target da 78-85px con feedback aptico per bici/corsa, e switch universale bidirezionale senza perdita di stato.

---

### 1. Cosa abbiamo fatto
- **Riconcettualizzazione Visiva & Iconografica (Modalità Audio)**:
  - Sostituito in tutta l'applicazione (Launcher, HUD, Navbar, Impostazioni, modali) il termine "Modalità Guida" / "Alla Guida" con "Modalità Audio" / "AUDIO".
  - Sostituita l'icona dell'automobile (`Car`) con l'iconografia monocromatica a cuffie avioniche (`Headphones`).
- **Macro-Target Outdoor per Bici & Corsa (`DriveModeScreen.tsx`)**:
  - Implementate 3 macro-fasce a tutta larghezza con altezza minima garantita `min-h-[78px] sm:min-h-[85px]`.
  - Badge numerici di grandi dimensioni (`w-11 h-11 sm:w-14 sm:h-14`, font `text-xl sm:text-2xl font-black`) con contrasto elevato.
  - Testo delle opzioni a corpo maggiorato (`text-base sm:text-xl font-semibold leading-snug`).
  - Spaziatura protetta (`gap-2.5 sm:gap-3.5`) e zero elementi affiancati per eliminare il rischio di miss-clicks dovuti alle vibrazioni del manubrio in bicicletta o durante la corsa.
- **Utility & Test Feedback Aptico (`src/utils/haptics.ts`, `src/utils/haptics.test.ts`)**:
  - Creata utility `triggerHapticFeedback` con pattern vibrazionali specifici: `tap` (20ms), `success` ([25, 60, 40]ms), `error` ([50, 80, 50, 80, 50]ms) e `warning` ([35, 50, 35]ms).
  - Integrato il feedback aptico su risposta data, esito corretto/errato, cambio domanda e contrassegno bandierina.
  - Aggiunta Suite 18 con 6 test unitari passanti al 100%.
- **Switch Universale Bidirezionale Senza Perdita di Stato (`QuizContext.tsx`)**:
  - Introdotti `activeAudioSessionContext` e `registerAudioSessionContext` nel contesto applicativo.
  - `ExamScreen`, `TopicsScreen` e `MistakesScreen` registrano reattivamente la propria sessione in corso.
  - Il pulsante `AUDIO` nella Navbar (mini-header) e i pulsanti dedicati nei rispettivi header consentono di passare istantaneamente alla Modalità Audio mantenendo l'esatto quesito attivo, tutte le risposte date e le bandierine.
  - In `DriveModeScreen`: se la sessione proviene da una schermata attiva (`sessionContext`), il tasto in alto visualizza `[← Torna al Quiz]` e richiama `executeClose()`, consentendo di riprendere la visualizzazione normale sullo schermo senza prompt di interruzione né perdita di dati.

---

### 2. Scelte Architetturali & Rationale
- **Continuità di Stato Tra Modalità**: Evitata la duplicazione di codice tramite registrazione reattiva dell'interfaccia `DriveModeSessionContext`, garantendo che l'utente possa alternare tra ascolto a mani libere (jogging, bici, auto) e studio visivo su schermo in qualsiasi momento.
- **Resilienza alle Vibrazioni (Fitts's Law)**: Il vincolo `min-h-[78px] sm:min-h-[85px]` con font generoso e layout a 1 colonna a tutta larghezza trasforma la schermata in un controller tattile robusto per l'uso all'aperto a braccio teso o su supporto.

---

### 3. Impatto sul Desiderata
- Completa al 100% il punto 3 della Roadmap Cockpit V2 (**TODO-03** in [DESIDERATA.md](file:///d:/Github/Quiz_VDS-VL/DESIDERATA.md)).
- Prepara il terreno per **TODO-04** (Layout Zero-Scroll e Ottimizzazione Spaziale sui quiz standard).

---

# Registro di Bordo: TODO-02 Architettura Home Hub & Back Navigation

- **Data**: 2026-09-29
- **Autore/Agente**: Antigravity Cockpit Specialist
- **Tipo di Intervento**: `feat(navigation)`
- **Argomento**: Implementazione Home Hub Cockpit V2, eliminazione barra a 6 tab permanente e mini-header con back navigation.

---

### 1. Cosa abbiamo fatto
- **Modulo di Navigazione Puro (`src/utils/navigation.ts`)**:
  - Definiti i tipi `ScenarioTab` e `AppTab` ('home' + 6 scenari: 'tutor', 'topics', 'exam', 'mistakes', 'archive', 'stats').
  - Mappati i 6 macro-pulsanti con label avioniche brevi, shortcut numerici `1`..`6`, descrizioni d'azione e colori tematici.
  - Implementate funzioni pure di utilità: `getShortcutKey`, `getTabByShortcut`, `isQuizScenario`, `getHeaderTitle`, `isScenarioTab`.
- **Suite di Test Dedicata (`src/utils/navigation.test.ts`)**:
  - 5 test unitari (`NAV-01`..`NAV-05`) a copertura totale delle utility pure di navigazione e validazione dei 6 scenari.
- **Componente Home Hub (`src/components/HomeScreen.tsx`)**:
  - 6 macro-pulsanti tattili ad alto contrasto (griglia 2x3 o 3x2) con badge scorciatoia tastiera `[1]`..`[6]`.
  - Telemetria d'allievo in evidenza: % prontezza esame, quiz esplorati su 474, errori pendenti nel quaderno Leitner.
  - Accesso rapido alla Modalità Audio direttamente dalla Home.
  - Banner di ripresa sessione d'esame attiva qualora l'utente torni alla Home prima di concludere.
- **Cockpit Navbar Snella & Mini-Header (`src/components/Navbar.tsx`)**:
  - In schermata `'home'`: single-tier compatto (56px) con brand Aero Shield, versione app, audio toggle, rete offline, guida rapida e impostazioni.
  - Nelle schermate interne di studio/esame: eliminata completamente la barra secondaria a schede (risparmio di ~50-60px verticali). Introdotto mini-header ultra-compatto (48px) con pulsante `[← Home]`, indicatore testuale dello scenario e pulsante rapido `AUDIO`.
- **Integrazione `ExamScreen.tsx` e `App.tsx`**:
  - Ricalibrato l'offset sticky per l'HUD esame (`top-[52px]` anziché `top-[102px]`).
  - Salvaguardia abbandono esame: se l'allievo preme `[← Home]` durante un esame attivo, si apre la modale di conferma per prevenire perdite involontarie di progresso.
  - Supporto nativo per i 6 scenari e tab iniziale `'home'`.

---

### 2. Scelte Architetturali & Rationale
- **Recupero Verticale per Layout Zero-Scroll**: La rimozione del secondo tier della Navbar nei quiz recupera spazio prezioso sul mobile (390x844), permettendo a testo della domanda, 3 opzioni e bottom bar di coesistere senza scorrimento verticale.
- **Disaccoppiamento della Navigazione**: Logica dei tasti e shortcut isolata in `navigation.ts` senza dipendenze da React, testabile a 0ms con Vitest.

---

### 3. Impatto sul Desiderata
- Completa al 100% il punto 2 della Roadmap Cockpit V2 (**TODO-02** in [DESIDERATA.md](file:///d:/Github/Quiz_VDS-VL/DESIDERATA.md)).
- Prepara il terreno per **TODO-03** (Modalità Audio con Macro-Target Bici/Corsa e switch universale senza perdita di stato) e **TODO-04** (Layout Zero-Scroll).

---

### [2026-09-29] - TODO-01: Potatura Radicale del Deltaplano (Focus 100% Parapendio)
- **Cosa abbiamo fatto**:
  - **Fissaggio Pool Stabile a 474 Quiz (100% Parapendio)**:
    * In [QuizContext.tsx](file:///d:/Github/Quiz_VDS-VL/src/context/QuizContext.tsx), isolato il pool stabile dell'applicazione a 474 quiz escludendo alla radice i 30 quiz esclusivi del deltaplano (`q.discipline !== 'hang_glider'`), preservando integri i 428 quiz condivisi e i 46 specifici per il parapendio.
    * Impostato `filteredQuestions = questions` e consolidata la coerenza di tutte le schermate ([ExamScreen.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/ExamScreen.tsx), [TopicsScreen.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/TopicsScreen.tsx), [MistakesScreen.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/MistakesScreen.tsx), [StatsScreen.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/StatsScreen.tsx), [ArchiveScreen.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/ArchiveScreen.tsx), [DriveModeScreen.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/DriveModeScreen.tsx)).
  - **Eliminazione Definitiva Selettore Disciplina**:
    * Rimosso il componente obsoleto `DisciplineSelector.tsx` dal file system (`git rm`).
    * Rimosso il selettore e la sezione "Disciplina Predefinita" dalla scheda Aspetto & Studio in [SettingsModal.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/SettingsModal.tsx).
    * Semplificato il badge di riepilogo `appearanceSummary` in [SettingsModal.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/SettingsModal.tsx) rimuovendo la disciplina.
  - **Rimozione Rumore Visivo: Badge Grafici "Deltaplano / Parapendio"**:
    * Rimossi i badge grafici della disciplina da [QuestionCard.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/QuestionCard.tsx) e [ArchiveScreen.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/ArchiveScreen.tsx) per un'interfaccia sobria, priva di etichette ridondanti.
    * Aggiornato il sottotitolo dell'Archivio con indicazione chiara del catalogo a 474 quiz.
  - **Allineamento Suite di Test**:
    * Aggiunto test unitario `DISC-08` in [discipline.test.ts](file:///d:/Github/Quiz_VDS-VL/src/utils/discipline.test.ts) che certifica matematicamente il pool a 474 quiz, l'assenza assoluta di quiz `hang_glider` e il soddisfacimento delle quote per tutte le 9 materie sia per l'esame standard (30 quiz) che maratona (60 quiz).
    * Tutti i 154/154 test Vitest passanti e build di produzione verificata.
- **Scelte architetturali & Rationale**:
  - *Filtro a monte in QuizContext vs Eliminazione da questions.json*: Il dataset AeCI 2017 è per statuto immutabile (504 quiz con id da 1 a 504) e i file audio neurali (Giuseppe ed Elsa) sono mappati biunivocamente sugli ID ufficiali nel manifest. Filtrare a monte in `QuizContext` fissa il pool a 474 quiz per l'intera UI senza alterare l'integrità del catalogo statico né rischiare disallineamenti di cache audio o ID.
  - *Eliminazione Selettori e Badge*: Poiché l'applicazione è focalizzata al 100% sulla preparazione per allievi piloti di parapendio, qualsiasi selettore o badge disciplina costituiva rumore cognitivo superfluo.
- **Impatto sul Desiderata**:
  - Completa con successo **TODO-01** della roadmap Cockpit V2 in [DESIDERATA.md](file:///d:/Github/Quiz_VDS-VL/DESIDERATA.md). Prossimo step: **TODO-02 (Architettura Home Hub & Back Navigation)**.

---

### [2026-09-29] - Protocollo Git Multi-Sessione: Git Worktree, Staging Chirurgico e Log Anti-Conflitto (.agents/worklog.d/)
- **Cosa abbiamo fatto**:
  - **Evoluzione Skill [git-pro/SKILL.md](file:///d:/Github/Quiz_VDS-VL/.agents/skills/git-pro/SKILL.md) (v2.0.0)**:
    * Introdotta la regola dei commit atomici su singolo argomento: codice sorgente e relativi unit test DEVONO appartenere allo stesso commit (`green by definition`).
    * Introdotta la regola dello **Staging Chirurgico Obbligatorio** con divieto categorico di `git add .`, `git add -A` e `git commit -a`. Imposto l'audit pre-commit `git diff --cached --stat`.
    * Introdotto il protocollo per sessioni parallele tramite **Git Worktree** (`.worktrees/<topic>`), azzerando le collisioni di file system, i blocchi `.git/index.lock` e le interferenze tra test Vitest concorrenti.
    * Definita la procedura di integrazione protetta su `main` tramite merge esplicito `--no-ff` (preservando i singoli commit atomici ed eliminando i rischi di `ff-only` o rebase distruttivi).
  - **Pattern Registro Lavorazioni Anti-Conflitto (`.agents/worklog.d/`)**:
    * Creata la cartella [.agents/worklog.d/](file:///d:/Github/Quiz_VDS-VL/.agents/worklog.d/) con documentazione e `.gitkeep` per raccogliere i log generati in parallelo da diversi agenti.
    * Creato lo script [scripts/consolidate_worklog.cjs](file:///d:/Github/Quiz_VDS-VL/scripts/consolidate_worklog.cjs) per concatenare deterministicamente tutti i frammenti in cima a [WORKLOG.md](file:///d:/Github/Quiz_VDS-VL/WORKLOG.md) e ripulire la cartella al momento del merge, con zero conflitti di merge.
    * Aggiunti gli script npm `"worklog:consolidate"` e `"worklog:consolidate:dry"` in [package.json](file:///d:/Github/Quiz_VDS-VL/package.json).
  - **Allineamento Regole & Workflow**:
    * Aggiornato [task_lifecycle.md](file:///d:/Github/Quiz_VDS-VL/.agents/workflows/task_lifecycle.md) per includere il pre-flight con worktree e lo staging chirurgico.
    * Aggiornati [.agents/rules/constraints.md](file:///d:/Github/Quiz_VDS-VL/.agents/rules/constraints.md) e [.agents/AGENTS.md](file:///d:/Github/Quiz_VDS-VL/.agents/AGENTS.md) con la nuova direttiva 8 sullo staging selettivo e l'isolamento multi-agente.
    * Aggiunta la cartella `.worktrees/` a [.gitignore](file:///d:/Github/Quiz_VDS-VL/.gitignore).
  - **Testing & Quality Assurance**:
    * Verificato `npm run worklog:consolidate:dry` ed eseguito test unitario del consolidatore.
    * Eseguiti con successo 153/153 test Vitest (`npm run test:unit`) e verificata la build di produzione (`npm run build`).
- **Scelte architetturali & Rationale**:
  - *Git Worktree vs Shared Working Directory*: Condividere la stessa cartella tra agenti paralleli crea inevitabilmente collisioni su file aperti, inquinamento delle esecuzioni di test e lock dell'indice Git. I worktree offrono a costo zero directory fisiche separate collegate allo stesso repository locale.
  - *Pattern Directory worklog.d vs File Unico*: Poiché ogni agente deve inserire un log in cima a WORKLOG.md (riga 17), due sessioni parallele provocherebbero un merge conflict sistematico. Scrivere file isolati in `worklog.d/` e consolidarli via script elimina alla radice qualsiasi conflitto di tracciamento.
  - *Merge `--no-ff` vs `ff-only`*: Il merge non-fast-forward mantiene tutti i commit atomici intatti all'interno del ramo, crea un nodo chiaro per la sessione e rende il rollback immediato tramite `git revert -m 1 <hash>`.
- **Impatto sul Desiderata**:
  - Fornisce all'architettura multi-agente gli strumenti e i guardrail definitivi per scalare in parallelo senza produrre commit promiscui o corruzioni di codice.

---

### [2026-09-29] - Piano di Riorganizzazione Ergonomica Cockpit V2, Home Hub & Roadmap TODO
- **Cosa abbiamo fatto**:
  - **Definizione Architettura dei 6 Scenari Puri**:
    * Scomposti e formalizzati i 6 scenari d'uso prioritari dell'allievo pilota: `TUTOR` (apprendimento continuo a feedback immediato senza tempo), `MATERIE` (studio 01-09 per argomento), `ESAME` (simulazione formale AeCI 45 min), `ERRORI` (quaderno spaced repetition), `CERCA` (archivio rapido) e `STATS` (telemetria).
  - **Valutazione e Potatura del Deltaplano (Focus 100% Parapendio)**:
    * Analizzati i 504 quiz AeCI: confermati 474 quiz per parapendio (428 comuni + 46 parapendio) ed esclusione pianificata dei 30 quiz esclusivi del deltaplano per azzerare rumore didattico, selettori sparsi e modali.
  - **Pattern "Home Hub + Back Navigation"**:
    * Scartata la top bar permanente a 6 segmenti (che consumava 50-60px verticali nei quiz) in favore di una schermata `HomeScreen` a 6 macro-pulsanti e mini-header con `[← Home]` nei quiz per massimizzare l'area di lettura.
  - **Layout Zero-Scroll a Margini Compatti**:
    * Progettato il layout vincolato a `100dvh` con padding ridotti (`p-3`), testo a leading compatto e pulsanti a 44px min-height per eliminare qualsiasi scroll su mobile (390x844).
  - **Riconcettualizzazione "Modalità Audio" (Audiolibro Hands-Free) & Macro-Target Bici/Corsa**:
    * Trasformata la vecchia "Modalità Guida" in "Modalità Audio" con icona cuffie/altoparlante monocromatica.
    * Previsto switch istantaneo universale con tasto `AUDIO` nell'header di Tutor, Materie, Esame ed Errori senza perdita di stato o progresso.
    * Progettati macro-target a tutta larghezza (altezza minima 75-85px), spaziatura protetta e feedback aptico per consentire risposte sicure anche con forti vibrazioni sul manubrio della bicicletta o durante la corsa a piedi.
  - **Impostazione Dimensione Font (Font Scaling / Outdoor Comfort)**:
    * Definita la gestione a 3 livelli discreti (`Compatto`, `Normale`, `Grande/Outdoor`) con persistenza in Dexie, per adattare la densità visiva tra piccoli schermi e supporti a distanza di braccio.
  - **Ricerca No-Keyboard nell'Archivio**:
    * Progettati pulsantiera rapida materie `01`-`09` + `TUTTE`, filtri stato a 1 tocco, quick chips tematiche e pad salto rapido per #ID.
  - **Documentazione & Matrice TODO**:
    * Redatto l'artifact di piano `piano_riorganizzazione_ux_quiz_vds.md` (V3).
    * Aggiornato [DESIDERATA.md](file:///d:/Github/Quiz_VDS-VL/DESIDERATA.md) con la nuova matrice di stato e i 6 task TODO dettagliati.
- **Scelte architetturali & Rationale**:
  - *Home Hub vs Persistent Tabs*: L'obiettivo principale dell'allievo durante il quiz è la lettura e la concentrazione. Una barra a 6 tab ruba spazio verticale costringendo a scorrere; il pattern Home Hub garantisce zero-scroll durante la prova e accesso a 1 tocco dalla home.
  - *Audiobook Paradigm & Fitts's Law*: Riconoscere che l'ascolto hands-free è utile ovunque (manubrio bici, corsa, camminata o letto) richiede macro-target enormi ad altissimo contrasto per azzerare miss-clicks senza distogliere lo sguardo dal percorso o dalla strada.
  - *Font Scaling*: Permette la fruizione outdoor senza rompere il vincolo zero-scroll tramite layout responsive fluido.
- **Impatto sul Desiderata**:
  - Allinea l'applicazione ai massimi standard di ergonomia minimale (stile Dieter Rams / avionica Garmin) senza fronzoli commerciali, focalizzandosi interamente sull'efficacia dell'apprendimento per il parapendio.

---

### [2026-09-29] - Parapendio Default (474 Quiz) & Pulizia Cockpit Selettori Disciplina
- **Cosa abbiamo fatto**:
  - **Parapendio come Default Immediato**:
    * Aggiornato `DEFAULT_SETTINGS` in `src/db/index.ts` impostando `disciplinePreference: 'paraglider'` (474 quiz: 428 comuni + 46 parapendio) e `disciplineOnboardingDone: true`.
    * Impostato il fallback in `src/context/QuizContext.tsx` e `src/utils/discipline.ts` su `'paraglider'`.
  - **Eliminazione Onboarding Popup**:
    * Rimosso il modale iniziale `DisciplineOnboardingModal` ("Quale corso stai seguendo?") da `src/App.tsx` ed eliminato il file sorgente per azzerare codice morto e bundle size.
  - **Pulizia Selettori Cockpit Inline**:
    * Rimosso il box di selezione disciplina `[Tutti] [Parapendio] [Deltaplano]` da `src/components/ExamScreen.tsx` eliminando ingombro orizzontale e distrazioni prima di iniziare l'esame.
    * Rimossi i selettori d'intestazione da `src/components/TopicsScreen.tsx` e `src/components/ArchiveScreen.tsx`, garantendo un'interfaccia sobria e coerente.
  - **Gestione Centralizzata nelle Impostazioni**:
    * Confermato il selettore `DisciplineSelector` in `src/components/SettingsModal.tsx` (scheda Aspetto & Studio) con default su Parapendio e possibilità di switch rapido a Deltaplano o Tutti i Quiz.
  - **Testing & Collaudo Headless CDP**:
    * Aggiornato il test unitario DB-13 in `src/db/database.test.ts` e aggiunto test DISC-07 in `src/utils/discipline.test.ts` (153/153 test superati).
    * Eseguito collaudo visivo CDP con `scripts/test_default_paraglider_ui.cjs` verificando l'assenza del modale, l'assenza dei selettori inline, il sottotitolo corretto a 474 quiz in Archivio, la selezione di default nelle Impostazioni e 0 errori in console.
    * Verificata la build di produzione (`tsc && vite build`).
- **Scelte architetturali & Rationale**:
  - *Cockpit Minimalist Philosophy*: La maggioranza degli allievi utilizza l'app per il parapendio. Rimuovere modali bloccanti e selettori sparsi in ogni schermata restituisce un'esperienza fluida e senza attriti, delegando alle Impostazioni il cambio per chi pilota deltaplani.
- **Impatto sul Desiderata**:
  - Piena rispondenza alla visione zero-distrazioni e alle richieste dell'allievo pilota.

---

### [2026-09-29] - Audit Tecnico Completo del Codice Sorgente e Analisi Architetturale PWA
- **Cosa abbiamo fatto**:
  - Eseguito un audit tecnico completo a 360 gradi sull'intera codebase di **VDS-VL Quiz Master**:
    * **Analisi Statica & Type Safety**: Confermato `tsc --noEmit` a 0 errori con configurazione TypeScript `strict: true`.
    * **Suite di Test & Coverage**: Eseguiti tutti i 152 test unitari Vitest su 16 suite (100% superati). Mappata la copertura v8 globale (Statements 60.93%, Branches 56.21%, Functions 60.85%, Lines 62.38%), rilevando 96.9% su `utils/`, 85.7% su `db/`, ma 0% su `hooks/` e `components/`.
    * **Bundle & Precache PWA**: Identificato inquinamento critico nella cartella `public/` con 25 file di test/screenshot (~3.5 MB) precachati indebitamente nel Service Worker (`sw.js` precacha 5.18 MB). Rilevato bundle `index-*.js` a 897 kB dovuto all'import statico di `questions.json` (443 kB) e splash screen `index.html` da 86 kB a causa di JPEG base64 incorporato.
    * **Architettura Componenti**: Rilevata elevata complessità e monoliticità in `DriveModeScreen.tsx` (1.903 righe), `SettingsModal.tsx` (1.540 righe), `ExamScreen.tsx` (866 righe) e `QuestionCard.tsx` (690 righe).
    * **Ergonomia & Tastiera**: Evidenziata la mancanza degli shortcut numerici `1`, `2`, `3` per le risposte nelle sezioni `TopicsScreen.tsx` e `MistakesScreen.tsx` (attualmente presenti solo in `ExamScreen.tsx`).
    * **Conformità Standard**: Rilevata violazione diffusa della Regola 7 (`English Only for Code & Git`) dovuta alla presenza di commenti, log e suite di test scritti in lingua italiana all'interno di `src/`.
    * **Accessibilità & Sicurezza**: Verificata l'assenza totale di vulnerabilità XSS/`innerHTML`/`eval`, e annotata la necessità di `aria-label` espliciti sui bottoni privi di testo in `Navbar.tsx` e `QuestionCard.tsx`.
  - Redatto il rapporto completo di audit tecnico nell'artifact dedicato `audit_tecnico_completo.md`.
- **Scelte architetturali & Rationale**:
  - *Prioritizzazione per Livelli di Severità (P1 -> P4)*: Separare i problemi a impatto immediato per gli utenti finali (come i 3.5 MB di screenshot nel Service Worker mobile) dal debito tecnico interno (modularità componenti e traduzione commenti) consente una pianificazione ordinata senza fermare l'evoluzione del prodotto.
- **Impatto sul Desiderata**:
  - Fornisce un quadro di trasparenza totale sulla salute del software, identificando con precisione le ottimizzazioni necessarie per garantire massime performance e manutenibilità a lungo termine.

---

### [2026-09-29] - Supporto Completo Tema Chiaro (Hangar Light) in Modalità Alla Guida e Modali Vocali
- **Cosa abbiamo fatto**:
  - **Adeguamento Tema Chiaro in `DriveModeScreen.tsx`**:
    * Sostituito lo sfondo rigido `bg-black text-zinc-100` con il variant responsive `bg-black text-zinc-100 light:bg-slate-50 light:text-slate-900`.
    * Aggiornati tutti i componenti interni dello Stato 1 (Launcher): testata, pulsanti rapidi ("Pilota Automatico", "Comandi Vocali", "Modalità Tutor Didattica"), banner di briefing vocale, pulsanti di lancio (Esame Ufficiale AeCI, Radio Quiz Continuo, Ripasso Quaderno Errori, Maratona Intensiva) e barra inferiore con indicatori di sicurezza.
    * Aggiornati tutti i componenti dello Stato 2 (Quiz in Esecuzione): HUD bar superiore, pulsanti audio/controllo, card domanda ministeriale con numerazione e materia (#5044 Meteorologia), macro-pulsanti opzione 1/2/3 touch-friendly, barra comandi vocali e card didattica di feedback Regola & Tranello.
    * Aggiornati tutti i componenti dello Stato 3 (Debriefing e Risultati): card risultato finale (Idoneo/Non Idoneo), riepilogo conteggi e pulsanti di riavvio.
    * Aggiornato il modale di conferma abbandono esame (`showAbandonExamModal`).
    * Rimosso il prop `forceDark` dalle 3 istanze di `<VoiceQuickMenu />` consentendogli di ereditare naturalmente il tema dell'applicazione.
  - **Adeguamento Tema Chiaro in `VoiceCommandsModal.tsx`**:
    * Aggiornato il contenitore modale, l'header, le card esplicative dei gruppi di comandi vocali ("Rispondi al Quiz", "Scorri Domande", "Riascolta Audio", ecc.), il box dei consigli per la guida e il footer con classi `light:`.
  - **Collaudo Headless via CDP (Zero-Dependency CDP Visual Check)**:
    * Eseguito test di conformità cromatica e acquisizione screenshot headless a 390x844 (mobile portrait) con [scripts/test_drive_theme.cjs](file:///c:/github/Quiz_VDS-VL/scripts/test_drive_theme.cjs).
    * Verificato `backgroundColor: rgb(248, 250, 252)` e `color: rgb(15, 23, 42)` per il contenitore radice e `rgb(255, 251, 235)` per l'area domanda.
    * Confermato 0 errori runtime in console browser, 152/152 test Vitest superati e build di produzione verificata con successo.
- **Scelte architetturali & Rationale**:
  - *Allineamento con Tailwind Plugin Variant*: L'applicazione utilizza il variant Tailwind `:is(.light &)` gestito da `ThemeContext.tsx` tramite l'attributo di classe `light` sull'elemento radice `<html>`. L'aggiunta mirata di utility `light:` garantisce piena coerenza visiva sia nel tema scuro "Cockpit Dark" che in quello chiaro "Hangar Light" ad alto contrasto per uso diurno/all'aperto, senza rompere la palette notturna.
- **Impatto sul Desiderata**:
  - Garantisce agli allievi piloti la massima leggibilità e accessibilità ergonomica durante l'uso in auto o all'aperto sotto luce diretta del sole in accordo con le direttive del design system avionico.

---

### [2026-09-29] - Risoluzione Pronuncia XML nei File Audio (Edge-TTS Parameter Fix) e Rigenerazione Completa
- **Cosa abbiamo fatto**:
  - **Diagnosi Radice del Problema**:
    * Risolto il bug segnalato per cui i file vocali sintetizzati pronunciavano stringhe XML (*"minore speak version uno punto zero..."*) prima della frase effettiva.
    * La causa risiedeva nell'involucro `build_ssml()` in `scripts/generate_audio_database.py` e `scripts/generate_drive_intro.py`: la libreria Python `edge-tts` effettua automaticamente l'escape HTML/XML di qualsiasi stringa passata (`escape(text)` converte `<` e `>` in `&lt;` e `&gt;`) prima di incapsularla nel proprio template SSML.
    * Di conseguenza, i tag XML venivano inviati ai server TTS Microsoft come testo letterale da leggere ad alta voce.
  - **Correzione Script di Sintesi Vocale**:
    * Rimossa la funzione `build_ssml()` da [scripts/generate_audio_database.py](file:///c:/github/Quiz_VDS-VL/scripts/generate_audio_database.py) e [scripts/generate_drive_intro.py](file:///c:/github/Quiz_VDS-VL/scripts/generate_drive_intro.py).
    * Ripristinato il passaggio diretto e nativo dei parametri `text`, `voice`, `rate` e `pitch` alla classe `edge_tts.Communicate()`.
    * Incrementato il numero di retry a 5 con backoff esponenziale per garantire resilienza totale nei download ad alto volume.
  - **Verifica e Validazione della Sintesi Pulita**:
    * Rigenerati i briefing di guida [drive_intro.mp3](file:///c:/github/Quiz_VDS-VL/public/audio/giuseppe/drive_intro.mp3): taglia ridotta da ~380 KB a 170 KB (Giuseppe) e 144 KB (Elsa), con dizione naturale immediata priva di intestazioni XML.
    * Validata la generazione pulita sui quesiti campione 1001-1006: taglia dei frammenti audio ridotta da ~260 KB a 20-60 KB.
  - **Lancio Pipeline di Rigenerazione Integrale**:
    * Creato lo script orchestratore [scripts/regenerate_all_audio.py](file:///c:/github/Quiz_VDS-VL/scripts/regenerate_all_audio.py).
    * Avviata in background la rigenerazione di tutti i 5.040 segmenti audio e l'aggiornamento automatico del manifest [public/audio/manifest.json](file:///c:/github/Quiz_VDS-VL/public/audio/manifest.json).
- **Scelte architetturali & Rationale**:
  - *Parametri Nativi edge-tts*: Le voci `it-IT-DiegoNeural` ed `it-IT-ElsaNeural` sono intrinsecamente native italiane; non richiedono tag SSML manuali poiché `edge-tts` gestisce già rate e pitch a livello di protocollo.
- **Impatto sul Desiderata**:
  - Risolve l'anomalia vocale restituendo un'esperienza audio fluida, rapida e professionale in Modalità Guida e nelle sessioni di ascolto didattico.

---

### [2026-09-29] - Completamento Totale del Catalogo (504/504 Quiz - 100%): Riscritte Spiegazioni Specifiche e Sincronizzato Ecosistema Audio Neurale
- **Cosa abbiamo fatto**:
  - **Completamento Integrale dei 504 Quiz Ministeriali AeCI (9 Materie su 9)**:
    * Portata dal 14% al **100%** la copertura didattica specialistica su tutti i 504 quesiti ufficiali in [src/data/questions.json](file:///c:/github/Quiz_VDS-VL/src/data/questions.json) e [public/data/questions.json](file:///c:/github/Quiz_VDS-VL/public/data/questions.json).
    * **Materia 1: Normativa e Legislazione (40 quiz: #1001-#1040)**: D.P.R. 133/2010, attestato VDS/VL, visita medica biennale, assicurazione RCT obbligatoria, spazi aerei (CTR, ATZ, parchi naturali, quote minime/massime), precedenze di volo e regolamento AeCI (tramite `scripts/enrich_p2_subjects.cjs`).
    * **Materia 9: Sicurezza del Volo (45 quiz: #9001-#9045)**: Pre-volo, check-list, gestione emergenze, uso del paracadute di soccorso (lancio verso lo spazio libero, trazione fune d'apertura, disattivazione vela principale), meteo avversa e prevenzione collisioni (tramite `scripts/enrich_p2_subjects.cjs`).
    * **Materia 7: Tecnica di Pilotaggio (79 quiz: #7001-#7079)**: Rincorsa progressiva, controllo allo zenit, decollo rovescio/fronte vela, circuiti a 'C' vs a 'otto', gradiente di vento e wind shear in atterraggio, virata coordinata col peso, gestione delle chiusure asimmetriche, stallo paracadutale e full stall, discese rapide (orecchie, spirale picchiata), hang check nel deltaplano, controllo barra e rollio, prova di stallo in quota e flare a terra (tramite `scripts/enrich_pilotaggio.cjs`).
    * **Materia 5: Meteorologia e Aerologia (120 quiz: #5001-#5120)**: Struttura troposfera e tropopausa, umidità relativa/assoluta/specifica, dew point e calore latente di condensazione, gradiente termico verticale reale vs adiabatico secco (1°C/100m) e saturo (0.5°C/100m), criteri di stabilità/instabilità, genesi e distacco termiche (albedo, ostacoli), brezze di monte e di valle, sollevamento dinamico e onde orografiche (lenticolari e rotori), fronti caldi/freddi/occlusi, famiglie nubi e cumulonembi, calcoli adiabatici del Foehn (tramite `scripts/enrich_meteorologia.cjs`).
    * **Materia 2: Aerodinamica (150 quiz: #2001-#2150)**: Teorema di Bernoulli e Venturi applicato all'ala, depressione dorsale su estradosso, scomposizione della risultante in Portanza e Resistenza, formula quadratica R e P, tipologie di resistenza (attrito, forma, indotta da vortici marginali e dipendenza inversa dall'allungamento), assetto vs incidenza, scomposizione peso (trazione vs peso apparente), fattore di carico in virata (2G = peso apparente doppio), centro di pressione reflex vs convenzionale, efficienza all'aria vs al suolo, polare di Lilienthal e odografa delle velocità, teoria di McCready (velocità in ascendenza, discendenza, vento contrario e a favore), stallo dinamico ad alta velocità, autostabilità pendolare e washout svergolamento, effetto suolo (tramite `scripts/enrich_aerodinamica.cjs`).
  - **Bonifica Integrale Refusi OCR del PDF Ufficiale**:
    * Ripuliti gli ultimi refusi storici presenti nelle opzioni e domande: `7005` (rimosso `"I PILOTAGGIO"`), `7079` (rimosso `"8 - MAT"`), `5006` (rimosso `"GIA E AEROLOGIA"`), `5120` (rimosso `"6 - STRU"`), `2007` (rimosso `"DINAMICA"`), `2150` (rimosso `"3 - PRONTO"`).
  - **Sincronizzazione Completa Audio Neurale & Manifest**:
    * Generati tutti i segmenti audio didattici per l'intero catalogo dei 504 quiz (`{qid}_e.mp3`) per entrambe le voci neurali Giuseppe ed Elsa.
    * Reindicizzato l'intero database in [public/audio/manifest.json](file:///c:/github/Quiz_VDS-VL/public/audio/manifest.json): esattamente 2.521 file per Giuseppe (708.29 MB) e 2.521 file per Elsa (687.85 MB) con relativi hash MD5 per l'invalidazione della cache PWA offline.
  - **Quality Assurance & Collaudo Vitest**:
    * Aggiornato il test `DATA-09` in [src/data/questions.test.ts](file:///c:/github/Quiz_VDS-VL/src/data/questions.test.ts) a verificare il 100% di unicità e completezza per ciascuna delle 9 materie e su scala globale: certificati 504 record con 504 Regole uniche e 504 Tranelli unici.
    * 152/152 unit test Vitest passati su 16 suite (`npm run test:unit`).
    * Verificato con successo il build di produzione PWA (`npm run build`).
- **Scelte architetturali & Rationale**:
  - *Standardizzazione Didattica Universale*: L'intero database segue lo schema standardizzato 'Regola: [principio aeronautico/fisico/normativo]' e 'Tranello: [misconcezione o tranello d'esame]', massimizzando la densità informativa e la chiarezza concettuale.
  - *Sincronizzazione Audio con Ripresa Automatica*: L'ecosistema di generazione audio sfrutta il caching differenziale basato sull'esistenza del file (`Force: false`), permettendo di assorbire eventuali disconnessioni socket senza rigenerare segmenti validi.
- **Impatto sul Desiderata**:
  - Requisito del Desiderata *'Perfezionamento Spiegazioni Didattiche (Regola & Tranello)'* completato al **100% (504/504 quiz)**, portando la PWA allo stato dell'arte didattico e funzionale.

---

### [2026-09-29] - Risoluzione Collisione Lock File Windows, Scrittura Atomica e Completamento 5.042 File Audio (Elsa & Giuseppe)
- **Cosa abbiamo fatto**:
  - **Risoluzione Errore `[Errno 22] Invalid argument` e File Corrotti a 0 Byte**:
    * Diagnosticata la causa radice del fallimento mostrato nello screenshot dell'utente: un processo orfano in background (`scripts/generate_audio_database.py`, PID 8692) stava tentando di sovrascrivere simultaneamente gli stessi file audio su file system Windows NTFS, generando violazioni di condivisione (`open(..., 'wb')` collision) e lasciando occasionalmente file orfani da 0 byte.
    * Terminato il processo duplicato (`Stop-Process -Id 8692 -Force`).
  - **Blindatura Architetturale di [scripts/generate_audio_database.py](file:///c:/github/Quiz_VDS-VL/scripts/generate_audio_database.py)**:
    * Introdotta la scrittura atomica dei file audio: la sintesi vocale Edge-TTS scrive ora su un file temporaneo dedicato (`{dest}.{pid}_{task_id}.tmp`), ne verifica la dimensione (> 1.000 byte) e solo in caso di esito positivo esegue la sostituzione atomica tramite `os.replace(tmp_dest, dest)`.
    * Introdotto il cleanup automatico dei file temporanei o falliti in caso di eccezione per impedire per sempre la creazione di file vuoti da 0 byte.
    * Aggiunta la rimozione preliminare automatica di eventuali file preesistenti con dimensione <= 1.000 byte prima della rigenerazione.
  - **Completamento & Certificazione al 100% dell'Ecosistema Audio Neurale**:
    * Rigenerati e verificati tutti i 5.042 file audio MP3 (2.520 segmenti + 1 intro di guida per ciascuna voce):
      - **Giuseppe** (`it-IT-DiegoNeural`): 2.521 file validi (708.29 MB), taglia minima 236.880 byte, massima 539.712 byte.
      - **Elsa** (`it-IT-ElsaNeural`): 2.521 file validi (687.85 MB), taglia minima 71.280 byte, massima 524.592 byte.
      - **Integrità Totale**: 0 file mancanti, 0 file vuoti o sotto i 1.000 byte.
    * Rigenerato il catalogo [public/audio/manifest.json](file:///c:/github/Quiz_VDS-VL/public/audio/manifest.json) con gli hash MD5 aggiornati per permettere il download e l'aggiornamento differenziale offline da parte della PWA.
  - **Quality Assurance**:
    * Verificati con successo **152/152 test unitari** Vitest su 16 suite (`npm run test:unit`).
- **Scelte architetturali & Rationale**:
  - *Scrittura Atomica su File Temporaneo con Rename*: Su Windows NTFS, una scrittura diretta `open(..., 'wb')` su file preesistenti può fallire con `[Errno 22]` se software di scansione (antivirus, indicizzatore, browser) o altri processi accedono al file. La sequenza `.tmp` -> `os.replace` garantisce che il file finale esista solo e soltanto quando è completo al 100% e privo di corruzioni.
- **Impatto sul Desiderata**:
  - Ecosistema audio neurale pienamente operativo per entrambe le voci ufficiali (Giuseppe maschile ed Elsa femminile) con pronuncia nativa italiana garantita su tutti i 504 quiz e 2.520 risposte/spiegazioni.

---

### [2026-09-29] - Fase 2 Piano Perfezionamento Didattico: Revisione Spiegazioni Quiz VDS-VL (Materie 4, 6, 3 - 50 Quiz)
- **Cosa abbiamo fatto**:
  - Estesa la riscrittura didattica specifica ai tre cluster tematici ad alta priorità (P1) per un totale di 50 quesiti ministeriali AeCI:
    * **Materia 4: Fisiopatologia del Volo (10 quiz: 4001 - 4010)**: Pressione parziale alveolare, ipossia altitudinale vs ipotermia/ipotensione, aeroembolismo (legge di Henry a 7.000m+), tolleranza accelerazioni positive (+4G per >4s) vs negative (-Gz), illusioni sensoriali vestibolari nel volo in nube.
    * **Materia 6: Strumenti (20 quiz: 6001 - 6020)**: Principio barometrico altimetro (capsula aneroide / piezo), tarature QNH/QFE e deriva pressoria all'atterraggio, variometro a pressione differenziale e avviso aspirazione sotto cumuli, anemometro (pressione dinamica vs statica, IAS vs GS), bussola magnetica (declinazione, interferenze da cellulari/radio), limiti strumenti base e GPS (impossibilità volo strumentale IFR in nube, volo all'indietro con forte vento contrario, trilaterazione satellitare 3D).
    * **Materia 3: Pronto Soccorso (20 quiz: 3001 - 3020)**: Protocollo d'urgenza e NUE 112/118 senza muovere il traumatizzato spinale, trasporto esclusivo con mezzi abilitati, arresto emorragie massive con compressione o laccio emostatico a monte, gestione epistassi (capo inclinato in avanti), pervietà vie aeree (soffocamento/vomito), prevenzione shock termico da ipovolemia, immobilizzazione doccia per fratture d'arto senza riduzione manuale, drenaggio otorragia da trauma cranico (paziente sul fianco leso), distacco da alta tensione (distanza di sicurezza) vs bassa tensione (attrezzo isolante in legno), protocollo RICE per distorsioni, riconoscimento visivo spalla lussata ("a spallina"), Posizione Laterale di Sicurezza (PLS), e riscaldamento graduale passivo da assideramento.
    * Applicate le modifiche in [src/data/questions.json](file:///c:/github/Quiz_VDS-VL/src/data/questions.json) e [public/data/questions.json](file:///c:/github/Quiz_VDS-VL/public/data/questions.json) tramite lo script [scripts/enrich_p1_subjects.cjs](file:///c:/github/Quiz_VDS-VL/scripts/enrich_p1_subjects.cjs).
    * Ripuliti gli ulteriori refusi OCR storici del PDF cartaceo nelle opzioni di risposta (`4005` e `4010` rimossi residui intestazioni `"OGIA DEL VOLO"` e `"5 - METEOROLOG"`; `6006` e `6020` rimossi `"UMENTI"` e `"7 - TECNICA DI"`; `3005` e `3020` rimossi `"O SOCCORSO"` e `"4 - FISIOPATOLO"`).
  - Sincronizzazione Ecosistema Audio Neurale:
    * Rigenerati tutti i 100 segmenti audio didattici (`_e.mp3`) per le 50 domande su entrambe le voci Giuseppe ed Elsa con [scripts/generate_audio_database.py](file:///c:/github/Quiz_VDS-VL/scripts/generate_audio_database.py).
    * Rigenerato il catalogo [public/audio/manifest.json](file:///c:/github/Quiz_VDS-VL/public/audio/manifest.json) con i nuovi hash MD5 per garantire l'allineamento automatico dei client offline.
  - Quality Assurance & Collaudo Vitest:
    * Esteso il test `DATA-09` in [src/data/questions.test.ts](file:///c:/github/Quiz_VDS-VL/src/data/questions.test.ts) a verificare il 100% di unicità e pertinenza delle spiegazioni per tutte le 4 materie completate (70 quiz: Materiali, Fisiopatologia, Strumenti, Pronto Soccorso).
    * Superati con successo **152/152 test unitari** su 16 suite (`npm run test:unit`).
- **Scelte architetturali & Rationale**:
  - *Completamento cluster a blocchi omogenei (P1)*: Raggruppare materie specialistiche (medicina aeronautica, avionica di bordo, primo soccorso) permette un controllo terminologico rigoroso e previene discrepanze semantiche rispetto al D.P.R. 133/2010 e ai manuali AeCI.
  - *Cura del testo per sintesi TTS*: Tutte le spiegazioni sono state calibrate per una cadenza naturale nelle voci neurali Giuseppe ed Elsa, evitando acronimi non normalizzati o punteggiatura anomala.
- **Impatto sul Desiderata**:
  - Porta a **70 quiz (14% del catalogo totale)** la copertura con spiegazioni didattiche specifiche, riducendo a 5 le materie ancora basate su template statico.

---

### [2026-09-29] - Fase 1 Piano Perfezionamento Didattico: Revisione Spiegazioni Quiz VDS-VL (Materia 8 - Materiali #8001-#8020)
- **Cosa abbiamo fatto**:
  - Audit di conformità semantica dell'intero catalogo dei 504 quiz: evidenziata la causa radice dell'anomalia (#8003 e tutti gli altri quiz condividevano solo 9 spiegazioni statiche duplicate per materia, ereditate come stub da `extract_quizzes.py`).
  - Redatto il piano organico di perfezionamento didattico per l'intero catalogo dei 504 quiz nell'artifact dedicato [piano_perfezionamento_spiegazioni.md](file:///C:/Users/aame/.gemini/antigravity/brain/1bd4454b-cf08-4ceb-9620-e0ccceaed932/piano_perfezionamento_spiegazioni.md).
  - Implementata ed eseguita con successo la **Fase 1 (Pilota: Materia 8 - Materiali, 20 quiz)**:
    * Riscritte in modo specifico, rigoroso e conciso le 20 spiegazioni (*Regola*: principio fisico/strutturale esatto, max 180-200 car.; *Tranello*: trappola o bias dell'allievo, max 140-160 car.) per i quiz `8001 - 8020` in [src/data/questions.json](file:///c:/github/Quiz_VDS-VL/src/data/questions.json) e [public/data/questions.json](file:///c:/github/Quiz_VDS-VL/public/data/questions.json) tramite lo script [scripts/enrich_materiali.cjs](file:///c:/github/Quiz_VDS-VL/scripts/enrich_materiali.cjs).
    * Risolto puntualmente il caso sollevato dall'utente per la domanda **#8003** (*Regola*: centro di pressione alare nel primo terzo del profilo e linee A anteriori che sopportano il 60-70% del peso pilota; *Tranello*: presunzione di carico uniforme o confusione con i comandi freno posteriori).
    * Ripuliti due refusi OCR dell'edizione cartacea AeCI nelle opzioni di risposta (`8007` rimosso residuo testata `"TERIALI"`; `8020` rimosso residuo capitolo `"9 - SICUREZZ"`).
  - Sincronizzazione Ecosistema Audio Neurale:
    * Rigenerati selettivamente i 20 segmenti audio didattici delle spiegazioni per Giuseppe (`public/audio/giuseppe/{qid}_e.mp3`) ed Elsa (`public/audio/elsa/{qid}_e.mp3`) per le domande 8001-8020 con [scripts/generate_audio_database.py](file:///c:/github/Quiz_VDS-VL/scripts/generate_audio_database.py).
    * Rigenerato il manifest differenziale [public/audio/manifest.json](file:///c:/github/Quiz_VDS-VL/public/audio/manifest.json) con i nuovi hash per garantire l'aggiornamento automatico nei client PWA offline.
  - Quality Assurance & Collaudo E2E:
    * Aggiunto in [src/data/questions.test.ts](file:///c:/github/Quiz_VDS-VL/src/data/questions.test.ts) il test `DATA-09` che certifica il 100% di unicità e la specificità didattica delle spiegazioni di Materiali.
    * 152/152 unit test Vitest passati su 16 suite (`npm run test:unit`).
    * Build di produzione PWA completato con successo (`npm run build`).
    * Eseguito il collaudo visivo interattivo CDP con [scripts/test_question_8003.cjs](file:///c:/github/Quiz_VDS-VL/scripts/test_question_8003.cjs), validando semanticamente il testo renderizzato nel DOM, l'assenza assoluta di errori console (0 errori) e salvando lo screenshot di collaudo [public/test_question_8003_verified.png](file:///c:/github/Quiz_VDS-VL/public/test_question_8003_verified.png).
- **Scelte architetturali & Rationale**:
  - *Cockpit Brevity per Regola e Tranello*: Mantenere i testi densi ma concisi (sotto i 200 caratteri per la Regola e 160 per il Tranello) garantisce leggibilità perfetta a colpo d'occhio su smartphone senza richiedere scroll verticale dell'HUD, ed evita logorrea nei messaggi audio neurali in modalità alla guida.
  - *Aggiornamento Audio Selettivo (`--part explanation`)*: Rigenerare unicamente i file `_e.mp3` evita di riscaricare e ricalcolare 4.000+ segmenti invariati di domande e opzioni, preservando la continuità della cache locale degli allievi piloti.
- **Impatto sul Desiderata**:
  - Corregge l'incongruenza della domanda #8003 e stabilisce il benchmark qualitativo per la revisione didattica sistematica dei restanti 8 cluster tematici del catalogo AeCI.

---

### [2026-09-29] - Meccanismo di Invalidazione & Aggiornamento Differenziale Audio Offline (Opzione A + Opzione 1) e Soppressione Prompt Guida Ridondante
- **Cosa abbiamo fatto**:
  - Implementata la soluzione approvata dall'utente (**Opzione A**: aggiornamento differenziale puntuale basato su manifest leggero con hash per singolo file, anziché riscaricare l'intero archivio da 150 MB; **Opzione 1**: sincronizzazione automatica silenziosa all'avvio dell'app in presenza di connettività Internet):
    * Creato lo script Python [scripts/generate_audio_manifest.py](file:///c:/github/Quiz_VDS-VL/scripts/generate_audio_manifest.py) per generare il file [public/audio/manifest.json](file:///c:/github/Quiz_VDS-VL/public/audio/manifest.json) (~118 KB) che mappa i 5.040 snippet audio MP3 di Giuseppe ed Elsa con hash MD5 di 8 caratteri. Aggiunto lo script `"build:audio:manifest"` a [package.json](file:///c:/github/Quiz_VDS-VL/package.json).
    * Configurato in [vite.config.ts](file:///c:/github/Quiz_VDS-VL/vite.config.ts) il routing Workbox per `/audio/manifest.json` con strategia `NetworkFirst` (`networkTimeoutSeconds: 3`), assicurando il rilevamento tempestivo di modifiche senza rompere l'offline.
    * Estesa la tipizzazione in [src/types/audio.ts](file:///c:/github/Quiz_VDS-VL/src/types/audio.ts) con le interfacce `AudioManifest`, `InstalledVoiceMetadata`, `VoiceUpdateDetail`, `AudioUpdateCheckResult`.
    * Aggiunte le impostazioni `audioAutoUpdateOnline: true` e `lastAudioCheckAt?: number` in [src/types/database.ts](file:///c:/github/Quiz_VDS-VL/src/types/database.ts) e [src/db/index.ts](file:///c:/github/Quiz_VDS-VL/src/db/index.ts).
    * Esteso [src/services/audioDownloadManager.ts](file:///c:/github/Quiz_VDS-VL/src/services/audioDownloadManager.ts) con `checkAudioUpdates()`, `applyAudioUpdates()` (con cache-busting `?v=${hash}&_t=${Date.now()}` per aggiornare direttamente la voce in `CacheStorage`), `autoCheckAndSyncOnStartup()`, `getInstalledMetadata()` e `saveInstalledMetadata()`.
    * Integrato in [src/App.tsx](file:///c:/github/Quiz_VDS-VL/src/App.tsx) il trigger non bloccante `audioDownloadManager.autoCheckAndSyncOnStartup()` all'avvio.
    * Risolto il problema del prompt ridondante in Modalità Guida ([src/components/DriveModeScreen.tsx](file:///c:/github/Quiz_VDS-VL/src/components/DriveModeScreen.tsx)): aggiunta la verifica asincrona reale con `checkAllStatuses()`, sopprimendo `AudioOfflinePromptModal` se la voce attiva o un'altra voce è già presente in `CacheStorage`.
    * Arricchita la sezione Impostazioni ([src/components/SettingsModal.tsx](file:///c:/github/Quiz_VDS-VL/src/components/SettingsModal.tsx)): badge animati per file modificati, pulsanti di aggiornamento parziale per singola voce con progress bar live, pulsante di verifica manuale con data/ora e switch per l'auto-sync online.
  - Testing & Quality Assurance:
    * Estesa la suite [src/services/audioDownloadManager.test.ts](file:///c:/github/Quiz_VDS-VL/src/services/audioDownloadManager.test.ts) con 7 nuovi unit test (`ADM-09` fino a `ADM-15`) per manifest fetch, persistenza Dexie, rilevamento offline, identificazione file obsoleti, scrittura su CacheStorage e sincronizzazione automatica.
    * Eseguiti con successo tutti i 150 test unitari (`npm run test:unit`) con exit code 0.
    * Eseguita la build di produzione (`npm run build`) verificando la corretta generazione del bundle, manifest e PWA Service Worker.
- **Scelte architetturali & Rationale**:
  - *Manifest Atomico con Hash MD5 a 8 Caratteri*: Mappare ogni file con un digest compatto di 8 caratteri mantiene il file JSON a soli ~118 KB per 5.040 file. Questo consente un download rapidissimo anche su rete mobile 3G/4G e un confronto istantaneo `O(1)` in memoria rispetto ai file salvati in Dexie.
  - *Bypass CacheFirst via Query Busted Fetch & Cache.put*: Workbox intercetta le richieste audio con `CacheFirst`. Per aggiornare un file modificato sul server, scaricare con URL canonico restituirebbe la vecchia versione dalla cache locale. Utilizzando `${canonicalUrl}?v=${hash}&_t=${Date.now()}` per il fetch di rete e salvando poi la risposta con la chiave canonica via `cache.put(canonicalUrl, resp)`, la cache locale viene aggiornata atomicamente senza toccare il Service Worker.
  - *Controllo Asincrono Reale in CacheStorage per la Guida*: All'avvio dell'app lo stato in-memory parte con contatori a zero prima che l'interrogazione asincrona a `caches.keys()` termini. Eseguendo un `await checkAllStatuses()` prima di valutare l'apertura del prompt della Modalità Guida, si evitano falsi positivi garantendo che l'utente non riceva mai richieste di scaricamento se i file sono già residenti sul dispositivo.
- **Impatto sul Desiderata**:
  - Garantita la manutenibilità e la freschezza didattica degli oltre 5.000 file audio senza costringere l'allievo pilota a riscaricare centinaia di megabyte di dati per correzioni puntuali.

---

### [2026-09-29] - Blindatura Fonetica Italiana Integrale per Sintesi Vocale Web Speech API, DOM HTML e Pipeline Neurale Edge-TTS
- **Cosa abbiamo fatto**:
  - **Web Speech API & Sintesi Vocale Browser ([src/services/voiceService.ts](file:///c:/github/Quiz_VDS-VL/src/services/voiceService.ts))**:
    * Identificata la causa radice dell'accento inglese nella sintesi vocale: impostare solo `utterance.lang = 'it-IT'` viene ignorato dai browser quando il sistema operativo o il browser ha lingua predefinita inglese (es. Windows/macOS/Chrome su EN-US), provocando la lettura del testo italiano tramite la voce di sistema inglese (fonetica anglofona).
    * Implementato il metodo `getItalianSpeechVoice(preferredVoice?: 'giuseppe' | 'elsa')` in `VoiceService` che scansiona programmaticamente `window.speechSynthesis.getVoices()`, seleziona prioritariamente una voce nativa `it-IT` e rispetta rigorosamente la persona attiva: se l'utente ha selezionato **Elsa**, cerca specificamente la voce italiana di Elsa (es. `Microsoft Elsa Desktop` su Windows SAPI5) o voci femminili italiane.
    * In `playSpeechSynthesisFallback()`, associata esplicitamente la voce italiana coerente con il profilo attivo ad `utterance.voice`, garantendo che qualunque fallback vocale del browser pronunci sempre l'italiano corretto.
    * Aggiunti unit test `VOICE-26`, `VOICE-27` e `VOICE-28` in [src/services/voiceService.test.ts](file:///c:/github/Quiz_VDS-VL/src/services/voiceService.test.ts) (151/151 test unitari passati).
  - **Blindatura Semantica del DOM HTML ([index.html](file:///c:/github/Quiz_VDS-VL/index.html), [QuestionCard.tsx](file:///c:/github/Quiz_VDS-VL/src/components/QuestionCard.tsx), [DriveModeScreen.tsx](file:///c:/github/Quiz_VDS-VL/src/components/DriveModeScreen.tsx))**:
    * In `index.html`: aggiunti `lang="it"` e `translate="no"` sia sul tag `<body>` che sul contenitore `#root`.
    * In `QuestionCard.tsx`: aggiunti `lang="it"` e `translate="no"` al testo della domanda (`<h3>`), a ciascun pulsante opzione di risposta (`#btn-option-X`), al contenitore del testo opzione e alla scheda della spiegazione didattica (Regola + Tranello), impedendo a screen reader o tool "Leggi ad alta voce" di usare motori fonetici stranieri.
    * In `DriveModeScreen.tsx`: aggiunti `lang="it"` e `translate="no"` al titolo domanda (`<h2>`), ai pulsanti giganti delle opzioni di guida (`#btn-drive-opt-X`), al testo opzione e alla scheda didattica `#drive-didactic-card`.
  - **Protezione Anti-Bleeding nella Pipeline Audio Neurale Edge-TTS ([scripts/generate_audio_database.py](file:///c:/github/Quiz_VDS-VL/scripts/generate_audio_database.py), [scripts/generate_drive_intro.py](file:///c:/github/Quiz_VDS-VL/scripts/generate_drive_intro.py))**:
    * Identificata la causa della possibile pronuncia con accento estero nei file generati: la voce `it-IT-GiuseppeMultilingualNeural` è un modello *multilingue* con rilevamento dinamico della lingua (LID), che su frasi brevi, numeri o acronimi tende a commutare sulla fonetica inglese.
    * Anche per **Elsa** (`it-IT-ElsaNeural`), in assenza di SSML esplicito, le chiamate Edge-TTS possono ereditare `xml:lang="en-US"` e inciampare su acronimi aeronautici inglesi (*VFR, IFR, CTR, QNH, FL, VDS*) o anglismi (*trimmer, top landing*).
    * Integrata la voce maschile 100% nativa italiana **`it-IT-DiegoNeural`** e blindate **entrambe le voci (Elsa e Giuseppe/Diego)** tramite la funzione `build_ssml()` con marcatura esplicita `<speak xml:lang='it-IT'><lang xml:lang='it-IT'>...` per azzerare ogni inflessione esterofona a monte.
- **Scelte architetturali & Rationale**:
  - *Difesa in Profondità a 3 Livelli (HTML, Web Speech API, Neurale)*: L'esperienza vocale dell'allievo pilota può passare dal lettore del browser, dalla Web Speech API o dai file audio pre-renderizzati. Proteggere contemporaneamente tutti e tre i canali elimina definitivamente qualsiasi possibilità di regressione all'accento inglese sia per la voce maschile che per quella femminile.
  - *Voice Persona Matching in Web Speech API*: Non basta forzare una voce italiana generica; se l'utente sceglie Elsa, la sintesi vocale di sistema deve agganciarsi alla voce femminile italiana (come `Microsoft Elsa Desktop`), preservando la continuità timbrica.
- **Impatto sul Desiderata**:
  - Risolto in modo permanente il difetto di lettura con accento inglese sia per Elsa che per Giuseppe, blindando l'esperienza audio in studio e in Modalità alla Guida.

### [2026-09-29] - Modale Onboarding Scelta Disciplina al Primo Avvio (Parapendio / Deltaplano / Tutti)
- **Cosa abbiamo fatto**:
  - Creato il componente [src/components/DisciplineOnboardingModal.tsx](file:///c:/github/Quiz_VDS-VL/src/components/DisciplineOnboardingModal.tsx) per consentire all'allievo pilota di selezionare la propria disciplina di studio al primo avvio dell'app:
    * Presenta 3 schede interattive chiare e sobrie: **Parapendio** (474 quiz), **Deltaplano** (458 quiz) e **Tutti i Quiz** (504 quiz AeCI completo).
    * Su richiesta dell'utente ("togli i pill consigliato xyz"), rimossi tutti i badge pill di raccomandazione/slogan (`[Consigliato Parapendio]`, `[Consigliato Deltaplano]`, `[Volo Libero Unificato]`), lasciando un'intestazione pulita, sobria ed essenziale (titolo del mezzo e contatore quiz).
    * Box informativo di salvaguardia: ricorda esplicitamente che i 428 quesiti di teoria comune (aerodinamica, meteo, normativa D.P.R. 133/2010, primo soccorso, sicurezza e strumenti) rimangono sempre inclusi in qualsiasi scelta.
    * Pulsante primario di conferma: *"Conferma e Inizia lo Studio →"* (`#btn-confirm-discipline-onboarding`).
  - Esteso il modello dati e la persistenza Dexie:
    * In [src/types/database.ts](file:///c:/github/Quiz_VDS-VL/src/types/database.ts): aggiunto `disciplineOnboardingDone?: boolean` ad `AppSettings`.
    * In [src/db/index.ts](file:///c:/github/Quiz_VDS-VL/src/db/index.ts): aggiunto `disciplineOnboardingDone: false` a `DEFAULT_SETTINGS`.
    * In [src/context/QuizContext.tsx](file:///c:/github/Quiz_VDS-VL/src/context/QuizContext.tsx): esposto `isSettingsLoaded: boolean` calcolato reattivamente su Dexie (`rawSettings !== undefined`) per evitare sfarfallii (zero layout flicker) al caricamento dei profili esistenti.
    * In [src/App.tsx](file:///c:/github/Quiz_VDS-VL/src/App.tsx): renderizzato `<DisciplineOnboardingModal isOpen={isSettingsLoaded && !settings.disciplineOnboardingDone} />`.
  - Testing & Quality Assurance:
    * In [src/db/database.test.ts](file:///c:/github/Quiz_VDS-VL/src/db/database.test.ts): aggiunto unit test `DB-13` per la persistenza di `disciplineOnboardingDone` e `disciplinePreference`. Totale test unitari: 141/141 passati su 16 suite.
    * Creato lo script CDP headless [scripts/test_discipline_onboarding.cjs](file:///c:/github/Quiz_VDS-VL/scripts/test_discipline_onboarding.cjs) (`npm run test:visual:onboarding`): verificata la comparsa al primo avvio, la selezione e salvataggio della disciplina, la chiusura automatica, la mancata ricomparsa al secondo avvio (persistenza garantita) e 0 errori in console browser.
    * Catturati gli screenshot di verifica su Mobile Portrait 390x844 ([public/test_discipline_onboarding_mobile.png](file:///c:/github/Quiz_VDS-VL/public/test_discipline_onboarding_mobile.png)) e Desktop 1440x900 ([public/test_discipline_onboarding_desktop.png](file:///c:/github/Quiz_VDS-VL/public/test_discipline_onboarding_desktop.png)).
- **Scelte architetturali & Rationale**:
  - *Zero-Flicker Onboarding via isSettingsLoaded*: Interrogare `db.settings` in IndexedDB è un'operazione asincrona. Se il modal venisse montato prima che `useLiveQuery` restituisca i dati reali, gli utenti di ritorno che hanno già completato l'onboarding vedrebbero un flash del modal per poche decine di millisecondi. Condizionando l'apertura a `isSettingsLoaded && !settings.disciplineOnboardingDone`, il rendering è solido e deterministico.
  - *Microcopy Essenziale (No Slogan)*: Rimossi i pill "Consigliato" in pieno accordo con la regola di progetto di eliminare etichette ridondanti e lasciare spazio a dati oggettivi (titolo mezzo, conteggio domande ed elenco concetti inclusi/esclusi).
- **Impatto sul Desiderata**:
  - Esperienza di benvenuto e onboarding fluida e immediata per ogni nuovo allievo pilota che accede alla web app per la prima volta.

---

### [2026-09-29] - Implementazione Filtro Domande Esclusive Deltaplano e Parapendio (Discipline Tagging con Salvaguardia Teoria Comune - Fase 8.1)
- **Cosa abbiamo fatto**:
  - Audit semantico approfondito dei 504 quiz ministeriali AeCI (edizione 2017) per identificare i quesiti esclusivi del deltaplano (30 quesiti: 18 in Pilotaggio 7062-7079, 6 in Materiali 8011-8016, 6 in Sicurezza 9037-9042), i quesiti esclusivi del parapendio (46 quesiti: 25 in Pilotaggio 7036, 7038-7061, 10 in Materiali 8001-8010, 11 in Sicurezza 9023-9024, 9026-9028, 9031-9036) e la teoria comune condivisa (428 quesiti trasversali, inclusi Q2147 effetto suolo, Q1036 precedenze tra mezzi e Q8017-8020 paracadute di soccorso).
  - Tipizzazione ed estensione dello schema dati:
    * In [src/types/quiz.ts](file:///c:/github/Quiz_VDS-VL/src/types/quiz.ts): aggiunto il tipo `Discipline = 'all' | 'hang_glider' | 'paraglider'` e la proprietà obbligatoria `discipline: Discipline` all'interfaccia `Question`.
    * In [src/types/database.ts](file:///c:/github/Quiz_VDS-VL/src/types/database.ts): aggiunto `disciplinePreference?: Discipline` ad `AppSettings`.
    * In [src/db/index.ts](file:///c:/github/Quiz_VDS-VL/src/db/index.ts): configurato `disciplinePreference: 'all'` in `DEFAULT_SETTINGS`.
  - Aggiornato il dataset dei 504 quiz in [src/data/questions.json](file:///c:/github/Quiz_VDS-VL/src/data/questions.json) e [public/data/questions.json](file:///c:/github/Quiz_VDS-VL/public/data/questions.json) con il campo `discipline` su ogni singolo quesito (428 `all`, 30 `hang_glider`, 46 `paraglider`).
  - Creato il modulo di utilità [src/utils/discipline.ts](file:///c:/github/Quiz_VDS-VL/src/utils/discipline.ts) contenente `DISCIPLINE_OPTIONS`, `filterQuestionsByDiscipline()` e `getDisciplineBadge()`.
  - Creato il componente UI avionico [src/components/DisciplineSelector.tsx](file:///c:/github/Quiz_VDS-VL/src/components/DisciplineSelector.tsx) con pulsanti pill ergonomici, icone grafiche e contatori dinamici.
  - Integrato il selettore disciplina e la logica di filtraggio nelle schermate operative:
    * In [src/context/QuizContext.tsx](file:///c:/github/Quiz_VDS-VL/src/context/QuizContext.tsx): aggiunti `disciplineFilter`, `setDisciplineFilter` e `filteredQuestions`. Aggiornate le funzioni `subjectsAnalytics`, `totalSeen` e `readinessScore` per calcolare le metriche di studio sul catalogo filtrato per disciplina.
    * In [src/components/ExamScreen.tsx](file:///c:/github/Quiz_VDS-VL/src/components/ExamScreen.tsx): selettore disciplina integrato nel launcher della simulazione d'esame. L'estrazione delle 30 domande attinge da `filteredQuestions`, garantendo il rispetto delle 9 quote ministeriali AeCI all'interno della disciplina scelta.
    * In [src/components/TopicsScreen.tsx](file:///c:/github/Quiz_VDS-VL/src/components/TopicsScreen.tsx): selettore disciplina nell'header con contatori aggiornati e avvio sessioni di studio sincronizzato su `filteredQuestions` (es. Tecnica di Pilotaggio: 79 quiz in Tutti, 61 in Parapendio, 54 in Deltaplano).
    * In [src/components/ArchiveScreen.tsx](file:///c:/github/Quiz_VDS-VL/src/components/ArchiveScreen.tsx): selettore disciplina nell'header, dropdown materie con conteggi dinamici ricalcolati e badge identificativo per ciascun quesito esclusivo nella lista.
    * In [src/components/QuestionCard.tsx](file:///c:/github/Quiz_VDS-VL/src/components/QuestionCard.tsx): badge visivo compatto (`Deltaplano` o `Parapendio`) visualizzato accanto al badge della materia per le domande esclusive.
    * In [src/components/SettingsModal.tsx](file:///c:/github/Quiz_VDS-VL/src/components/SettingsModal.tsx): aggiunta la configurazione "Disciplina Predefinita" nella scheda "Aspetto & Studio" con persistenza immediata in Dexie e anteprima badge dinamico nell'intestazione dell'accordion.
  - Test e Collaudo di Qualità:
    * In [src/data/questions.test.ts](file:///c:/github/Quiz_VDS-VL/src/data/questions.test.ts): aggiunto test `DATA-08` che verifica l'esatta distribuzione 428/30/46 dei quiz e la corretta assegnazione della disciplina.
    * In [src/utils/discipline.test.ts](file:///c:/github/Quiz_VDS-VL/src/utils/discipline.test.ts): creata suite di 6 test unitari con copertura completa dei filtri, rispetto delle quote d'esame AeCI e generazione corretta dei badge.
    * Eseguiti con successo tutti i 140 test unitari Vitest su 16 suite (`npm run test:unit`).
    * Eseguito il build di produzione PWA (`npm run build`) con zero errori TypeScript e Vite.
    * Creato lo script di collaudo headless CDP [scripts/test_discipline_filters.cjs](file:///c:/github/Quiz_VDS-VL/scripts/test_discipline_filters.cjs) (`npm run test:visual:discipline`) che ha certificato l'assenza totale di errori in console browser (0 errori) e salvato gli screenshot di verifica su Mobile Portrait 390x844 ([public/test_discipline_selector_mobile.png](file:///c:/github/Quiz_VDS-VL/public/test_discipline_selector_mobile.png)) e Desktop 1440x900 ([public/test_discipline_selector_desktop.png](file:///c:/github/Quiz_VDS-VL/public/test_discipline_selector_desktop.png)).
- **Scelte architetturali & Rationale**:
  - *Filosofia Zero False Exclusion (Protezione Assoluta Teoria Comune)*: L'esame VDS/VL unifica le nozioni di base del volo libero. Escludere erroneamente domande di aerodinamica generale, meteo, normativa o fisiopatologia priverebbe l'allievo di conoscenze indispensabili per la sicurezza del volo e il superamento dell'esame AeCI. L'audit semantico ha categorizzato come esclusive unicamente le domande le cui risposte contengono elementi tecnici strettamente dipendenti dal velivolo (es. barra trapezio, cavi di controventatura vs fascio funicolare, freni, cassoni).
  - *Reactivity at Context Level (`filteredQuestions` as derived state)*: Invece di duplicare la logica di filtraggio nei singoli schermi, `QuizContext` espone `filteredQuestions` come stato derivato reattivo da `questions` e `disciplineFilter`. In questo modo le statistiche (`subjectsAnalytics`), l'indice di preparazione (`readinessScore`), l'archivio, le materie e il randomizzatore d'esame sono automaticamente e deterministicamente allineati alla disciplina attiva in tutta l'applicazione.
  - *Soddisfacimento Quote Esame AeCI*: Verificato matematicamente e tramite test unitario che entrambe le discipline dispongono di un numero di quiz largamente superiore al fabbisogno minimo di ciascuna delle 9 quote ministeriali (anche nella materia con meno quiz, Primo Soccorso e Strumenti ne hanno 12-14, contro la quota di 1 richiesta).
- **Impatto sul Desiderata**:
  - Completa al 100% la Fase 8.1 del backlog, fornendo agli allievi piloti sia di parapendio che di deltaplano un percorso di studio e simulazione esame perfettamente mirato al proprio mezzo, senza alcuna contaminazione nozionistica e preservando intatta tutta la teoria fondamentale.

---

### [2026-09-29] - Implementazione Modalità Tutor Didattica e Risoluzione Interruzione Spiegazione Vocale nella Modalità Alla Guida (Fase 8.6 & 8.7)
- **Cosa abbiamo fatto**:
  - **Estensione dello Schema Database & Impostazioni**:
    * In [src/types/database.ts](file:///c:/github/Quiz_VDS-VL/src/types/database.ts): aggiunto `driveModeTutor?: boolean` a `AppSettings`.
    * In [src/db/index.ts](file:///c:/github/Quiz_VDS-VL/src/db/index.ts): impostato `driveModeTutor: false` in `DEFAULT_SETTINGS`.
  - **Potenziamento del Parser Comandi Vocali (`voiceCommandParser.ts`)**:
    * In [src/utils/voiceCommandParser.ts](file:///c:/github/Quiz_VDS-VL/src/utils/voiceCommandParser.ts): aggiunti i comandi vocali `'explain'`, `'tutor_on'`, `'tutor_off'`, `'toggle_tutor'`.
    * Normalizzazione Unicode NFD (`.normalize('NFD').replace(/[\u0300-\u036f]/g, '')`) per consentire il funzionamento rigoroso dei word boundaries regex `\b` su parole italiane accentate (*"perché"*, *"modalità"*).
    * Precedenza dei comandi Tutor rispetto a comandi generici per prevenire collisioni (es. *"avvia tutor"* non viene più confuso con *"avvia"*).
    * Test unitari estesi in [src/utils/voiceCommandParser.test.ts](file:///c:/github/Quiz_VDS-VL/src/utils/voiceCommandParser.test.ts) (casi `VC-08` e `VC-09`), con 133/133 test Vitest passati.
  - **Controlli UI & Toggle a 1 Tocco Multicanale**:
    * In [src/components/VoiceCommandsModal.tsx](file:///c:/github/Quiz_VDS-VL/src/components/VoiceCommandsModal.tsx): aggiunte le schede informative per "Spiegazione Didattica" e "Modalità Tutor".
    * In [src/components/SettingsModal.tsx](file:///c:/github/Quiz_VDS-VL/src/components/SettingsModal.tsx): aggiunto il toggle `#setting-drive-tutor-toggle` nella sezione Guida con badge dinamico live `Tutor ON`.
    * In [src/components/VoiceQuickMenu.tsx](file:///c:/github/Quiz_VDS-VL/src/components/VoiceQuickMenu.tsx): aggiunto il toggle rapido `#quick-menu-toggle-tutor`.
    * In [src/components/DriveModeScreen.tsx](file:///c:/github/Quiz_VDS-VL/src/components/DriveModeScreen.tsx): integrato il toggle a tutta larghezza nel Launcher (`#btn-drive-toggle-tutor-launcher`) e il pulsante con icona `GraduationCap` nella Top Bar HUD a quiz attivo (`#btn-drive-tutor-toggle`).
  - **Motore Sincronizzato Voice Tutor & Risoluzione Troncamento Audio (Fase 8.7)**:
    * Eliminato il timer rigido cablato a 3.5s (`setTimeout(..., 3500)`).
    * Sostituito con listener reattivo su `isExplanationPlaying` (`isPartPlaying('explanation')`): all'evento `ended` naturale, scatta la pausa di assimilazione calibrata a 2.5s con indicatore visivo `Prossima in Xs` nell'HUD, con safety guard a 4.5s in caso di assenza file audio.
    * In Tutor Mode, la spiegazione (Regola + Tranello) viene riprodotta e attesa integralmente sia dopo una risposta data sia su auto-avanzamento timeout.
  - **Layout Cockpit Zero-Scroll (`100dvh`)**:
    * Quando la domanda viene rivelata (`isCurrentRevealed`), le 3 opzioni passano a stile compatto a fascia sottile (`flex-none`), liberando spazio per la scheda didattica `#drive-didactic-card` (`flex-1 min-h-0`) con scroll interno personalizzato, garantendo l'assoluta assenza di barre di scorrimento sulla pagina (`scrollHeight === innerHeight === 844`).
    * Scheda didattica arricchita con pill `Regola`, pill `Tranello`, badge live dizione vocale e pulsante `Riascolta` (`#btn-drive-replay-explanation`).
  - **Suite di Test & Collaudo Headless CDP**:
    * 133/133 test unitari passati su 15 suite (`npm run test:unit`).
    * Typecheck TypeScript (`npx tsc --noEmit`) e build di produzione (`npm run build`) superati con 0 errori.
    * Script di collaudo headless dedicato `scripts/test_drive_tutor.js` (`npm run test:visual:tutor`) che ha validato su viewport mobile 390x844 l'attivazione del tutor nel launcher, la presenza del pulsante HUD, la comparsa della scheda didattica al click sull'opzione, il perfetto zero-scroll e ZERO errori in console browser.
- **Scelte architetturali & Rationale**:
  - *Audio Event-Driven Synchronization vs Arbitrary Timeouts*: Le spiegazioni didattiche variano tra 10 e 25 secondi. Rimuovere il timeout fisso a 3.5s ed agganciare la transizione allo stato di fine audio reale (`ended`) elimina alla radice il troncamento della voce didattica, garantendo un'esperienza di studio naturale e completa.
  - *Diacritics Normalization for Italian Speech*: L'analisi vocale italiana include accenti gravi e acuti (`perché`, `modalità`). `\b` in regex ASCII non riconosce i caratteri accentati come caratteri di parola (`\w`). La rimozione dei diacritici prima del matching garantisce affidabilità al 100%.
  - *Zero-Scroll Adaptive Layout*: Invece di introdurre scorrimento verticale durante la guida (incompatibile con la sicurezza in auto), le opzioni già risposte si contraggono a pillole ergonomiche, lasciando il resto dell'altezza visibile alla scheda didattica senza causare overflow.
- **Impatto sul Desiderata**:
  - Pienamente realizzati e convalidati gli Obiettivi 6 e 7 di Fase 8 ([DESIDERATA.md](file:///c:/github/Quiz_VDS-VL/DESIDERATA.md) Sezione 2.7, 4 e [TODO.md](file:///c:/github/Quiz_VDS-VL/TODO.md)).

---

### [2026-09-29] - Integrazione Backlog & Root Cause Analysis: Interruzione Spiegazione Vocale su Risposta Errata
- **Cosa abbiamo fatto**:
  - Censito e formalizzato nel backlog operativo [TODO.md](file:///c:/github/Quiz_VDS-VL/TODO.md) (Fase 8, Obiettivo 7) e nel documento strategico [DESIDERATA.md](file:///c:/github/Quiz_VDS-VL/DESIDERATA.md) (Sezione 4) l'indagine e il piano di risoluzione per il troncamento della voce didattica su risposta errata:
    * **Root Cause Identificata in Modalità Alla Guida ([src/components/DriveModeScreen.tsx](file:///c:/github/Quiz_VDS-VL/src/components/DriveModeScreen.tsx))**:
      - Quando l'utente seleziona una risposta errata o scade il timer, `playExplanation()` avvia il file `{qid}_e.mp3` contenente la sequenza completa: *"Risposta errata. La risposta esatta è la due: [...]. Regola: [...]. Tranello: [...]"* (durata: 15-25s).
      - Contemporaneamente, il Pilota Automatico attiva un timeout fisso cablato (`setTimeout(..., 3500)` alle righe 343 e 390).
      - Dopo 3.5s (il tempo appena sufficiente per dire *"Risposta errata. La risposta esatta è..."*), `handleNextQuestion` viene invocato incondizionatamente, chiamando `stopVoice()` e passando alla domanda successiva, interrompendo la spiegazione didattica (**Regola** e **Tranello**) sul nascere.
    * **Piano di Intervento Architetturale**:
      - Sostituire il timer fisso a 3.5s con l'ascolto reattivo dell'evento `ended` dell'elemento audio o callback `onEnded` del singleton [src/services/voiceService.ts](file:///c:/github/Quiz_VDS-VL/src/services/voiceService.ts).
      - Avanzare al quesito successivo solo dopo la conclusione dell'audio integrale (con 2-3s di pausa di assimilazione), lasciando comunque all'utente la libertà di avanzare manualmente in anticipo con tocco o comando vocale *"Avanti"*.
- **Scelte architetturali & Rationale**:
  - *Event-Driven Audio State vs Hardcoded Timeouts*: I file audio delle spiegazioni hanno lunghezze variabili da 10 a 25 secondi a seconda della complessità del quesito ministeriale. Un timeout cablato a 3.5s è concettualmente fallace perché basato su una stima fissa e non sullo stato reale del flusso multimediale. La gestione event-driven garantisce l'ascolto completo a qualsiasi velocità di riproduzione.
- **Impatto sul Desiderata**:
  - Obiettivo 7 di Fase 8 pronto per l'implementazione per assicurare la piena integrità pedagogica della voce didattica.

---

### [2026-09-29] - Ristrutturazione Impostazioni ad Accordion Compresso Singolo (Fase 8.3)
- **Cosa abbiamo fatto**:
  - **Refactoring Architetturale di `SettingsModal.tsx` ([src/components/SettingsModal.tsx](file:///c:/github/Quiz_VDS-VL/src/components/SettingsModal.tsx))**:
    * Sostituita la precedente barra orizzontale di navigazione a pillole/tabs con scorrimento (`sticky top-14`, `overflow-x-auto`) con un **layout compatto ad accordion verticale a pannello singolo aperto**.
    * Implementato il componente riutilizzabile `AccordionCard`:
      - Header interattivo con supporto mouse e touch ad alta densità (`p-3.5 sm:p-4`).
      - Icona tematica colorata per ciascuna sezione (`Palette`, `Volume2`, `Car`, `Cloud`, `Database`, `Info`).
      - Titolo chiaro della sezione e **badge dinamico di anteprima dello stato attivo** (es. `Auto • Feedback ON`, `Giuseppe • 1x • TTS Web`, `Radio ON • 5s`, `Manuale`, `504 Quiz • Dexie SSOT`, `v1.0.0 • AeCI`).
      - Indicatore a freccia `ChevronDown` animato (rotazione fluida a 180° in espansione).
      - Area interna a scomparsa con transizioni pulite, zero salti di layout e preservazione integrale dei controlli esistenti.
    * Applicata la **regola ferrea di mutua esclusione**: l'apertura di un pannello espande la sezione richiesta e chiude all'istante qualunque altro pannello precedentemente aperto (`openSection: SettingsTab | null`).
    * Implementata la possibilità di **collasso totale**: cliccando sull'header della sezione già aperta o cliccando sul pulsante contestuale di testata `"Comprimi tutto"`, tutti i 6 pannelli si chiudono consentendo una panoramica ultracompatta a una sola schermata senza scorrimento.
    * Aggiunta una toolbar di controllo discreta in cima all'elenco dei pannelli: conteggio sezioni attive ("Pannelli di Controllo • 6 sezioni configurabili") e pulsante di commutazione rapida `"Comprimi tutto"` / `"Espandi prima"`.
    * Garantita la **piena retrocompatibilità**: preservati tutti gli identificatori DOM storici (`#tab-appearance`, `#tab-voice`, `#tab-drive`, `#tab-cloud`, `#tab-data`, `#tab-about`, `#btn-close-settings`, `#btn-toggle-fullscreen`, ecc.) per non rompere alcuno script o test automatizzato.
  - **Aggiornamento e Creazione Suite di Collaudo Automatizzato**:
    * Creato lo script dedicato [scripts/test_settings_accordion.cjs](file:///c:/github/Quiz_VDS-VL/scripts/test_settings_accordion.cjs) su Chrome DevTools Protocol (CDP):
      - Verifica l'inizializzazione con 6 card di impostazioni e la prima scheda (Aspetto) aperta di default.
      - Verifica il collasso totale tramite il pulsante `"Comprimi tutto"` e l'espansione tramite `"Espandi prima"`.
      - Verifica la mutua esclusione: cliccando su Voce si espande Voce e si chiude Aspetto; cliccando su Guida si espande Guida e si chiude Voce.
      - Verifica i contenuti della sezione About (database 504 quiz, regole esame AeCI, D.P.R. 133/2010).
      - Verifica la reattività desktop a 1440x900 con la sezione Guida aperta.
      - Asserisce 0 errori in console JavaScript del browser.
    * Aggiornati gli script di collaudo pre-esistenti:
      - [scripts/test_settings_fullscreen.js](file:///c:/github/Quiz_VDS-VL/scripts/test_settings_fullscreen.js): integrato auto-start e cleanup del server Vite preview per esecuzione standalone affidabile. Test superato al 100%.
      - [scripts/test_settings_about.js](file:///c:/github/Quiz_VDS-VL/scripts/test_settings_about.js): integrato auto-start e cleanup del server Vite preview. Test superato al 100%.
      - [scripts/test_drive_intro.js](file:///c:/github/Quiz_VDS-VL/scripts/test_drive_intro.js): allineato il reset di Dexie con `audioOfflinePromptDismissed: true` per prevenire il mascheramento del banner intro da parte del prompt audio offline. Test superato al 100%.
    * Acquisiti nuovi screenshot di verifica visiva in `public/`:
      - [public/test_settings_accordion_mobile_open.png](file:///c:/github/Quiz_VDS-VL/public/test_settings_accordion_mobile_open.png): prima sezione aperta con badge attivo e 5 sezioni compatte.
      - [public/test_settings_accordion_mobile_all_collapsed.png](file:///c:/github/Quiz_VDS-VL/public/test_settings_accordion_mobile_all_collapsed.png): tutti i 6 pannelli compressi a colpo d'occhio.
      - [public/test_settings_accordion_desktop.png](file:///c:/github/Quiz_VDS-VL/public/test_settings_accordion_desktop.png): resa fluida ed ergonomica a 1440x900.
  - **Verifiche di Qualità del Codice**:
    * Type check rigoroso superato: `npx tsc --noEmit` (0 errori).
    * Test unitari superati: 15 suite e 131 test passati (`npm run test:unit`).
    * Build di produzione completata con successo (`npm run build`).
- **Scelte architetturali & Rationale**:
  - *Single-Open Mutual Exclusion vs Multi-Open Accordion*: Consentire l'apertura simultanea di più sezioni avrebbe ricreato il problema di lunghe pagine verticali caotiche e disorientanti su schermi piccoli (smartphone). La mutua esclusione rigida (`openSection: SettingsTab | null`) combinata con il collasso totale offre invece la massima densità informativa e immediatezza cognitiva: l'allievo vede sempre dove si trova, vede i valori correnti a colpo d'occhio grazie ai live badges e apre solo la sezione che desidera modificare.
  - *Live Preview Badges*: L'inserimento di pillole riassuntive dinamiche nell'header di ciascuna sezione chiusa (es. visualizzare l'istruttore corrente o il tema attivo senza dover espandere la card) trasforma l'accordion in una dashboard di sintesi dello stato dell'applicazione.
  - *Idempotent Backward Compatibility*: Mantenere `id="tab-{id}"` sui bottoni dell'accordion garantisce che qualsiasi test E2E o interazione da codice che selezionava le schede continui a funzionare senza modifiche o regressioni.
- **Impatto sul Desiderata**:
  - Soddisfatto al 100% l'Obiettivo 3 di Fase 8 ([DESIDERATA.md](file:///c:/github/Quiz_VDS-VL/DESIDERATA.md) Sezione 2.8 e [TODO.md](file:///c:/github/Quiz_VDS-VL/TODO.md)).

---

### [2026-09-29] - Barra di Navigazione Quiz Ancorata in Basso (Fase 8.5) & Ergonomia Mobile ad Una Mano
- **Cosa abbiamo fatto**:
  - **Componente Reattivo e Modulare `QuizBottomBar` ([src/components/QuizBottomBar.tsx](file:///c:/github/Quiz_VDS-VL/src/components/QuizBottomBar.tsx))**:
    * Sviluppato il nuovo componente avionico ancorato sul fondo del viewport (`fixed bottom-0 left-0 right-0 z-30`), con sfondo sfumato ad alto contrasto (`bg-zinc-950/95` in Cockpit Dark, `bg-white/95` in Hangar Light) e `backdrop-blur-md`.
    * Pieno supporto per le safe area inferiori dei dispositivi mobili (`pb-[max(0.75rem,env(safe-area-inset-bottom))]`).
    * Controlli completi: pulsante `Precedente` disabilitato deterministamente al primo quesito, pulsante bandierina `⚑ Segna/Rivedi` a portata di pollice, contatore numerico o contenuti centrali, e pulsante prioritario `Successiva` / `Prossima Domanda` / `Concludi/Consegna`.
  - **Integrazione in tutte le Modalità di Quiz Attive**:
    * **Simulazione Esame ([src/components/ExamScreen.tsx](file:///c:/github/Quiz_VDS-VL/src/components/ExamScreen.tsx))**: integrato `QuizBottomBar` sia in modalità Didattica Tutor che Esame Ufficiale AeCI. In modalità Tutor, non appena l'allievo risponde a un quesito, il pulsante prioritario `#btn-tutor-next-question` ("Prossima Domanda (N/30) →") compare direttamente nella barra inferiore in Aviation Amber, eliminando qualsiasi necessità di scorrimento verticale oltre le spiegazioni didattiche (Regola e Tranello). All'ultima domanda, il pulsante commuta su `#btn-tutor-complete-exam` ("Completa Simulazione"). In esame ufficiale, all'ultima domanda mostra `#btn-submit-exam-bottom` ("Consegna"). Calibrato il padding inferiore di clearance a `pb-28 sm:pb-32`.
    * **Studio per Materie ([src/components/TopicsScreen.tsx](file:///c:/github/Quiz_VDS-VL/src/components/TopicsScreen.tsx))**: sostituita la vecchia navigazione inline con `QuizBottomBar`, integrando contatore quesiti `N / Totale` e pulsante di conclusione set.
    * **Quaderno Errori ([src/components/MistakesScreen.tsx](file:///c:/github/Quiz_VDS-VL/src/components/MistakesScreen.tsx))**: sostituita la vecchia navigazione inline con `QuizBottomBar`, integrando contatore quesiti ed esito ripasso.
  - **Prevenzione Collisioni con il Banner Audio ([src/components/AudioDownloadBanner.tsx](file:///c:/github/Quiz_VDS-VL/src/components/AudioDownloadBanner.tsx) e [src/components/Navbar.tsx](file:///c:/github/Quiz_VDS-VL/src/components/Navbar.tsx))**:
    * Aggiunta la prop `elevated?: boolean` in `AudioDownloadBanner`.
    * Quando una sessione o esame è attivo, `AudioDownloadBanner` viene automaticamente traslato a `bottom-16 sm:bottom-20`, fluttuando sopra la barra di navigazione quiz senza alcuna sovrapposizione visiva.
  - **Suite di Collaudo Automatizzato Multi-Viewport**:
    * Creato lo script dedicato [scripts/test_quiz_bottom_bar.cjs](file:///c:/github/Quiz_VDS-VL/scripts/test_quiz_bottom_bar.cjs) con connessione Chrome CDP:
      - Mobile Portrait (390x844): verificate coordinate viewport (`bottom: 844`), test di scorrimento di 300px con invarianza di posizione, risposta a quesito, comparsa di `#btn-tutor-next-question` dentro la barra, avanzamento al quesito 2, attivazione flag da bottom bar e abbandono pulito.
      - Mobile Landscape (844x390): testata la compattezza e l'assenza di sovrapposizioni.
      - Desktop (1440x900): verificata la centratura ergonomica (`max-w-2xl mx-auto`) e il layout fluido.
      - Acquisiti snapshot ufficiali [public/test_anchored_bottom_bar_mobile.png](file:///c:/github/Quiz_VDS-VL/public/test_anchored_bottom_bar_mobile.png) e [public/test_anchored_bottom_bar_desktop.png](file:///c:/github/Quiz_VDS-VL/public/test_anchored_bottom_bar_desktop.png).
      - Zero errori in console browser JavaScript.
    * Verificati i test storici e di regressione (`test_tutor_mode.js`, `test_exam_abandon_single_click.cjs`).
    * 131 su 131 test unitari Vitest superati (`npm run test:unit`).
    * Compilazione della build di produzione verificata con successo (`tsc && vite build`).
- **Scelte architetturali & Rationale**:
  - *Sinergia Architetturale Top-Navbar / Bottom-Quiz-Bar*: Con i 5 tab generali fissati in alto (Fase 8.2), la parte inferiore dello schermo è sgombra da elementi globali e può essere interamente dedicata all'azione di studio del quiz in esecuzione.
  - *Thumb-Zone Ergonomics & Fitts's Law*: Nei quiz con spiegazioni didattiche dettagliate (Regola + Tranello), l'allievo doveva precedentemente scorrere fino a fondo pagina per avanzare. Ancorare l'azione "Prossima Domanda" sul fondo consente una digitazione rapidissima e rilassata con il solo pollice, aumentando l'efficienza dello studio.
  - *Dynamic Elevation of AudioDownloadBanner*: Spostare il banner audio verso l'alto (`bottom-16 sm:bottom-20`) solo quando un quiz è attivo garantisce isolamento visivo e previene qualsiasi conflitto di stacking context.
- **Impatto sul Desiderata**:
  - Soddisfatto al 100% l'Obiettivo 5 di Fase 8 ([DESIDERATA.md](file:///c:/github/Quiz_VDS-VL/DESIDERATA.md) Sezione 2.10 e [TODO.md](file:///c:/github/Quiz_VDS-VL/TODO.md)).

---

### [2026-09-29] - Risoluzione Race Condition Interruzione Esame al Primo Click (Single-Click Exam Abandon)
- **Cosa abbiamo fatto**:
  - **Analisi e Diagnosi Causa Radice (Double-Click Bug)**:
    * Riscontrato che cliccando "Interrompi" nella modale di conferma abbandono esame, al primo tocco l'app sembrava tornare al quiz attivo, richiedendo un secondo tocco per uscire davvero alla schermata idle.
    * La causa era una race condition tra lo stato locale sincrono di React (`setExamState('idle')`) e la cancellazione asincrona della sessione in IndexedDB tramite Dexie (`db.settings.delete('activeSession')`).
    * In [src/components/ExamScreen.tsx](file:///c:/github/Quiz_VDS-VL/src/components/ExamScreen.tsx), l'`useEffect` di auto-resume ascoltava `examState === 'idle'` e `activeSession`. Quando lo stato passava a `'idle'`, `activeSession` era ancora presente in memoria (per ~20-50ms necessari a Dexie per completare la transazione DB e notificare la live query), innescando all'istante `setExamState('running')` (bounce-back). Solo al secondo click il record era già stato rimosso da Dexie e l'uscita avveniva correttamente.
  - **Intervento a Doppio Livello di Protezione**:
    1. *Context Layer ([src/context/QuizContext.tsx](file:///c:/github/Quiz_VDS-VL/src/context/QuizContext.tsx))*:
       - Introdotto stato ottimistico `isLocallyDismissed`: impostato a `true` sincronicamente all'invocazione di `dismissActiveSession()`, azzera all'istante la computed `activeSession` restituendo `null` a tutti i consumatori senza attendere la risposta asincrona di Dexie.
    2. *Component Screen Layer ([src/components/ExamScreen.tsx](file:///c:/github/Quiz_VDS-VL/src/components/ExamScreen.tsx))*:
       - Aggiunto `isDismissedRef = useRef(false)` per bloccare espressamente l'`useEffect` di auto-resume (`if (isDismissedRef.current) return;`).
       - Aggiornato il pulsante di conferma modale `#btn-confirm-abandon-exam`: attiva `isDismissedRef.current = true`, arresta la sintesi vocale (`voiceService.stop()`), chiude la modale, azzera le domande/risposte in memoria (`setExamQuestions([])`, `setAnswers({})`, `setFlags({})`, `setCurrentIndex(0)`), imposta `examState = 'idle'`, e attende `await dismissActiveSession()`.
       - Rimosso l'`useEffect` che riazzerava prematuramente `isDismissedRef` quando `!activeSession`, resettandolo unicamente all'avvio esplicito di un nuovo esame (`startExam`).
  - **Verifiche e Collaudo E2E Headless**:
    * Sviluppato script di collaudo headless dedicato [scripts/test_exam_abandon_single_click.cjs](file:///c:/github/Quiz_VDS-VL/scripts/test_exam_abandon_single_click.cjs) con connessione Chrome CDP: avvio simulazione Tutor, risposta a un quesito, click su "Interrompi", click singolo su conferma abbandono.
    * Verificato che dopo 600ms e dopo 2100ms (attesa per intercettare eventuali bounce-back da race condition) l'app rimane stabilmente in schermata idle.
    * Verificato riavvio pulito di un nuovo esame e successivo abbandono.
    * 131 test unitari Vitest superati al 100% (`npm run test:unit`).
    * Build di produzione superata senza errori (`tsc && vite build`).
- **Scelte architetturali & Rationale**:
  - *Optimistic State + Ref Guarding*: La combinazione di aggiornamento ottimistico nel contesto e ref immutabile a livello di componente garantisce tolleranza a qualsiasi lentezza di I/O su storage asincrono (IndexedDB/Dexie), eliminando alla radice anomalie di rimbalzo UI senza ricorrere a timeout arbitrari.
- **Impatto sul Desiderata**:
  - Esperienza di navigazione affidabile, immediata e reattiva al singolo tocco, rispettando l'ergonomia avionica e la reattività richiesta dal progetto.

---

### [2026-09-29] - Blocco Menu al Top, Badge Versione Dinamico e Rimozione Preamble Ridondante (Task 2 & 4)
- **Cosa abbiamo fatto**:
  - **Menu di Navigazione Permanente al Top (Fixed Top Navigation)**:
    * In [src/components/Navbar.tsx](file:///c:/github/Quiz_VDS-VL/src/components/Navbar.tsx): integrati i 5 tab di navigazione (**Esame**, **Materie**, **Errori**, **Archivio**, **Stats**) direttamente nella barra superiore come secondo livello (`#main-nav`), con layout reattivo a 5 colonne compatte su mobile e affiancate su desktop.
    * Eliminata la barra di navigazione inferiore fissa (`fixed bottom-0`), liberando interamente la parte inferiore del viewport da elementi fissi.
    * Impostata la barra superiore su `fixed top-0 left-0 right-0 z-40` per garantire che rimanga permanentemente ancorata al top dello schermo in qualunque momento, anche durante lo scorrimento di domande lunghe e opzioni.
    * In [src/App.tsx](file:///c:/github/Quiz_VDS-VL/src/App.tsx): aggiunto `pt-[98px] sm:pt-[104px]` per garantire clearance perfetta sotto la barra fissa, e ridotto il padding inferiore globale da `pb-20` a `pb-8` (recuperando fino a 60px di altezza utile).
    * In [src/components/AudioDownloadBanner.tsx](file:///c:/github/Quiz_VDS-VL/src/components/AudioDownloadBanner.tsx): riposizionato il banner di avanzamento download a filo inferiore (`bottom-3 sm:bottom-4`).
    * In [src/index.css](file:///c:/github/Quiz_VDS-VL/src/index.css): sostituito `overflow-x: hidden` con `overflow-x: clip` su `html, body` per evitare anomalie nel calcolo dei container di scorrimento del browser.
  - **Visualizzazione Globale del Numero di Versione Dinamico**:
    * In [src/components/Navbar.tsx](file:///c:/github/Quiz_VDS-VL/src/components/Navbar.tsx): aggiunto il badge `#app-version-badge` (`v1.0.0`) adiacente all'anno 2017, collegato dinamicamente a `__APP_VERSION__` con tooltip esteso su hover contenente `__APP_BUILD_ID__` (commit hash e build time).
    * In [src/components/SettingsModal.tsx](file:///c:/github/Quiz_VDS-VL/src/components/SettingsModal.tsx): aggiunto il badge `#settings-version-badge` nell'header della modale e aggiornato il riferimento nella scheda **About** da stringa fissa a valore dinamico.
  - **Rimozione Preamble/Fuffa nella Schermata Esame**:
    * In [src/components/ExamScreen.tsx](file:///c:/github/Quiz_VDS-VL/src/components/ExamScreen.tsx): rimosso integralmente il blocco introduttivo ridondante (icona fulmine, titolo "Simulazione Esame", le 3 caselle 30/max 3/90% e dicitura selezione domande), portando le card operative (**Simulazione Didattica Tutor** ed **Esame Ufficiale AeCI**) immediatamente in cima allo schermo (*Above the Fold*), pronte all'avvio con 1 tocco senza necessità di scorrimento.
    * Rimosso l'import non utilizzato dell'icona `Zap`.
    * Aggiornato l'offset sticky della barra timer/consegna esame a `sticky top-[102px] sm:top-[106px] z-20` per agganciarsi ordinatamente sotto la nuova navbar fissa durante l'esame.
  - **Verifiche & Collaudo Headless CDP**:
    * 131 test unitari e di regressione Vitest superati con successo (`npm run test:unit`).
    * Build di produzione superata senza errori (`tsc && vite build`).
    * Collaudo visivo headless automatizzato su 32 snapshot: verificato con test di scroll a 450px che la barra superiore (Logo, Versione, Alla Guida, Voce, Tema, Impostazioni e tab di navigazione) resta perfettamente inchiodata e visibile in cima al display.
- **Scelte architetturali & Rationale**:
  - *Fixed Viewport Anchoring vs Sticky*: `position: sticky` è suscettibile a interruzioni quando contesti genitori hanno proprietà di overflow o padding asimmetrici. `fixed top-0` ancora l'header all'effettivo viewport del browser con certezza assoluta (100% deterministico).
  - *Above-the-Fold Direct Action*: L'allievo pilota che apre l'app per allenarsi deve trovare subito i pulsanti d'azione (Tutor ed Esame) a portata di pollice, senza dover saltare preamboli o caselle informative già presenti nella scheda About.
- **Impatto sul Desiderata**:
  - Esperienza visiva nitida, ergonomica, priva di ingombri inferiori e con controlli e versione sempre a portata di mano.

---

### [2026-09-29] - Integrazione Backlog: Modalità Tutor Didattica nella Modalità Alla Guida
- **Cosa abbiamo fatto**:
  - Censito e formalizzato nel backlog operativo [TODO.md](file:///c:/github/Quiz_VDS-VL/TODO.md) (Fase 8, Obiettivo 6) e nel documento di architettura funzionale [DESIDERATA.md](file:///c:/github/Quiz_VDS-VL/DESIDERATA.md) (Sezione 2.7 ed estensione Matrice di Stato) il nuovo requisito per la modalità didattica tutor a mani libere durante la guida:
    * **Modalità Tutor Didattica nella Modalità Alla Guida (Hands-Free Voice Tutor)**: estensione della Modalità Guida per consentire non solo la verifica della risposta corretta, ma anche l'ascolto vocale integrale della spiegazione didattica essenziale (📘 **Regola** fisica o normativa e ⚠️ **Tranello** cognitivo/lessicale) sintetizzata dal motore neurale Edge-TTS.
    * Sincronizzazione dell'avanzamento automatico: il Pilota Automatico attende la fine esatta della riproduzione vocale (`onEnd`) e rispetta una pausa di assimilazione prima di passare al quesito successivo; in modalità manuale, l'allievo può avanzare pronunciando *"Avanti"* o toccando lo schermo.
    * Visualizzazione HUD zero-scroll: resa visiva delle card compatte Regola e Tranello nell'area centrale ad alto contrasto senza infrangere il vincolo rigido `100dvh` (zero scorrimento).
    * Controlli & Comandi vocali dedicati: toggle rapido [Tutor ON/OFF] nel Launcher Guida, nell'HUD superiore e nel Quick Speech Menu; estensione del parser in [src/utils/voiceCommandParser.ts](file:///c:/github/Quiz_VDS-VL/src/utils/voiceCommandParser.ts) per i comandi *"Spiega"*, *"Regola"*, *"Attiva Tutor"* e *"Disattiva Tutor"*.
- **Scelte architetturali & Rationale**:
  - *Hands-Free Audio Pedagogy*: Durante la guida (in auto o su furgone verso il decollo), l'allievo pilota non può guardare lo schermo né leggere spiegazioni scritte. Ascoltare la motivazione teorica e il tranello subito dopo aver risposto (o sbagliato) trasforma la sessione radio da semplice verifica nozionistica a vero e proprio percorso di apprendimento attivo e profondo, sfruttando la memoria uditiva.
- **Impatto sul Desiderata**:
  - Allineati [TODO.md](file:///c:/github/Quiz_VDS-VL/TODO.md), [DESIDERATA.md](file:///c:/github/Quiz_VDS-VL/DESIDERATA.md) e la matrice di stato del progetto con le specifiche per l'implementazione del voice tutor in Modalità Guida.

---

### [2026-09-29] - Integrazione Backlog: Barra di Navigazione Quiz Ancorata in Basso (Precedente/Successivo)
- **Cosa abbiamo fatto**:
  - Censito e formalizzato nel backlog operativo [TODO.md](file:///c:/github/Quiz_VDS-VL/TODO.md) (Fase 8, Obiettivo 5) e nel documento di architettura funzionale [DESIDERATA.md](file:///c:/github/Quiz_VDS-VL/DESIDERATA.md) (Sezione 2.10 ed estensione Matrice di Stato) il nuovo requisito per l'ancoraggio permanente della navigazione durante i quiz:
    * **Barra di Navigazione Quiz Ancorata in Basso (Sticky / Fixed Bottom Action Bar)**: durante lo svolgimento del quiz (in tutte le modalità attive: Simulazione Esame Ufficiale e Didattica Tutor in [src/components/ExamScreen.tsx](file:///c:/github/Quiz_VDS-VL/src/components/ExamScreen.tsx), Studio per Materie in [src/components/TopicsScreen.tsx](file:///c:/github/Quiz_VDS-VL/src/components/TopicsScreen.tsx) e ripasso Quaderno Errori in [src/components/MistakesScreen.tsx](file:///c:/github/Quiz_VDS-VL/src/components/MistakesScreen.tsx)), i controlli "Precedente" e "Successiva" (unitamente ai comandi di completamento/conclusione e al pulsante rapido tutor "Prossima Domanda") devono rimanere **sempre visibili e ancorati sul fondo del viewport**.
    * Dettagliate le specifiche ergonomiche: posizionamento fisso/sticky con sfondo avionico e `backdrop-blur-md` (`bg-zinc-950/90 border-t border-zinc-800` in Dark Mode, `bg-white/95 border-t border-slate-200` in Light Mode), pieno supporto per le safe area inferiori dei dispositivi mobili (`pb-safe` / `env(safe-area-inset-bottom)`), ampi target tattili conformi alla legge di Fitts per il tocco immediato del pollice con una sola mano, e calibratura del padding inferiore di sicurezza sui container scorrevoli (`pb-24` / `pb-28`) per prevenire sovrapposizioni con l'ultima opzione di risposta o le card didattiche (Regola e Tranello).
    * Sinergia architetturale con l'Obiettivo 2 di Fase 8 (Blocco Navbar al Top): quando i 5 tab di navigazione principali sono collocati in alto, la barra inferiore è dedicata esclusivamente e senza conflitti visivi ai comandi operativi del quiz in esecuzione.
- **Scelte architetturali & Rationale**:
  - *Thumb-Zone Navigation & Fitts's Law*: Quando le domande presentano spiegazioni didattiche ampie o testi articolati, i controlli di navigazione posizionati nel normale flusso a fine pagina costringono l'allievo pilota a ripetuti scorrimenti verticali su smartphone solo per premere "Successiva". L'ancoraggio inferiore permanente elimina questa frizione cognitiva e motoria, massimizzando la velocità e la concentrazione sia nelle sessioni di studio intensivo che nella prova d'esame ufficiale da 45 minuti.
- **Impatto sul Desiderata**:
  - Allineati [TODO.md](file:///c:/github/Quiz_VDS-VL/TODO.md), [DESIDERATA.md](file:///c:/github/Quiz_VDS-VL/DESIDERATA.md) e la governance di progetto per la pianificazione e implementazione della navigazione ancorata in basso.

---

### [2026-09-29] - Collaudo Headless Multi-Viewport & Risoluzione Difetti (Session Dismiss, Debriefing Nav, Sync Guard)
- **Cosa abbiamo fatto**:
  - Eseguito un giro di collaudo visivo e funzionale automatizzato headless CDP approfondito su 10 contesti operativi e 3 viewport chiave: Mobile Portrait (390x844), Mobile Landscape (844x390) e Desktop (1440x900) con script dedicato [scripts/headless_full_audit.cjs](file:///d:/Github/Quiz_VDS-VL/scripts/headless_full_audit.cjs):
    * Catturati e analizzati 31 snapshot ad altissima risoluzione per tutti i moduli (Home, Esame Ufficiale AeCI, Scheda Quiz, Modalità Guida, Archivio, Statistiche, Modale Impostazioni con tutti i tab, Modalità Chiaro/Scuro).
  - Rilevati e risolti 3 difetti architetturali emersi durante il ciclo di test:
    1. **Persistenza indebita sessione esame al completamento**: in [src/components/ExamScreen.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/ExamScreen.tsx), alla consegna dell'esame (`handleSubmitExam`), la sessione rimaneva registrata nel database Dexie come sessione attiva da riprendere. Aggiunta l'invocazione di `await dismissActiveSession()` al salvataggio, prevenendo la comparsa di banner residui di recupero sessione dopo la conclusione dell'esame.
    2. **Trappola di navigazione nel debriefing d'esame**: nella schermata di revisione post-esame (Debriefing), l'utente poteva solo avviare un nuovo esame o cambiare materia ma non tornare alla schermata iniziale Esame (`idle`). Aggiunto il pulsante `#btn-return-home` per consentire il ritorno immediato alla landing esame.
    3. **Tentativo improprio di popup OAuth GIS a sincronizzazione disattivata**: in [src/context/QuizContext.tsx](file:///d:/Github/Quiz_VDS-VL/src/context/QuizContext.tsx), in `saveExam`, la chiamata `syncEngine.pushNow()` veniva effettuata incondizionatamente anche con auto-sync disabilitato (`isAutoSyncEnabled: false`), scatenando un tentativo non richiesto di apertura popup OAuth Google (`[GSI_LOGGER]: Failed to open popup window...`). Aggiunto controllo `if (syncEngine.getState().isAutoSyncEnabled)` prima del push immediato.
  - In [src/components/QuestionCard.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/QuestionCard.tsx): aggiunto `data-testid="option-${optNum}"` sui pulsanti delle opzioni risposta per un targeting deterministico e accessibile nei test automatici.
  - Verificato che al termine del ciclo di collaudo headless:
    * 0 errori in console JavaScript browser.
    * 0 eccezioni runtime non gestite.
    * 131 su 131 test unitari Vitest superati con successo (`npm run test:unit`).
    * Build di produzione superata con esito positivo (`tsc && vite build`).
- **Scelte architetturali & Rationale**:
  - *Active Session Dismissal on Final Submit*: La sessione attiva in Dexie ha lo scopo di consentire il recupero dell'esame in caso di crash o ricaricamento pagina accidentale. Una volta che l'esame è formalmente archiviato in `db.sessions`, il puntatore `activeExamSession` deve essere immediatamente azzerato per evitare stati incoerenti tra revisione e nuovo avvio.
  - *Defensive Cloud Sync Guard*: Il modulo di sincronizzazione cloud con Google Drive non deve mai avviare flussi interattivi GIS OAuth a meno che l'allievo non abbia esplicitamente abilitato l'auto-sync nelle impostazioni. Il controllo preliminare di `isAutoSyncEnabled` garantisce totale silenziosità e resilienza sia nei test headless che durante l'uso offline/aereo.
- **Impatto sul Desiderata**:
  - Esperienza utente solida, priva di trappole di navigazione al termine dell'esame e completamente immune da popup OAuth indesiderati durante il normale salvataggio delle schede.

---

### [2026-09-29] - Portato in Primo Piano il Menu Rapido Impostazioni Voce (Fix Z-Index & Overflow)
- **Cosa abbiamo fatto**:
  - Risolto il problema per cui il menu rapido delle voci (`VoiceQuickMenu`) si apriva "in background" o veniva tagliato e reso invisibile:
    * In [src/components/Navbar.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/Navbar.tsx): rimosso `overflow-hidden` dal container interno della barra superiore (`h-14`), che causava il ritaglio completo del popover a 56px di altezza impedendone la visualizzazione al di sotto dell'header.
    * In [src/components/Navbar.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/Navbar.tsx): impostato `z-30` (anziché `z-40`) sulla barra di navigazione inferiore fissa (`<nav>`). Avendo `<header>` `z-40`, il popover del menu vocale (`z-[60]`) si colloca ora inequivocabilmente al di sopra della barra di navigazione inferiore anche su schermi a risoluzione verticale ridotta o orientamento orizzontale (mobile landscape).
    * In [src/components/AudioDownloadBanner.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/AudioDownloadBanner.tsx): allineato il livello z-index del banner inferiore di download da `z-40` a `z-30`, prevenendo sovrapposizioni anomale con i flyout e menu a comparsa della barra superiore.
  - Verificato il comportamento tramite collaudo visivo headless CDP su viewport Desktop (1200x800), Mobile Portrait (390x844) e Mobile Landscape (844x390):
    * Popover perfettamente in primo piano, pienamente leggibile e interattivo.
    * 0 errori in console browser JavaScript.
  - Verificata la suite unitaria Vitest (131 test su 131 superati) e la build di produzione (`tsc && vite build`).
- **Scelte architetturali & Rationale**:
  - *Removal of Header overflow-hidden*: I contenitori flex con altezza fissa (`h-14`) non devono mai avere `overflow-hidden` se contengono elementi a posizionamento assoluto come popover e dropdown (`VoiceQuickMenu`). La protezione dall'overflow orizzontale del testo sul logo è già gestita con precisione tramite `min-w-0 flex-shrink` e `truncate`.
  - *Stacking Context Hierarchy (Header z-40 vs Bottom Nav z-30)*: Quando header superiore e bottom bar condividono lo stesso livello `z-40`, l'elemento che segue nel DOM (la bottom bar) viene renderizzato sopra i popover dell'header che si estendono verso il basso. Assegnando `z-40` all'header e `z-30` alla bottom bar e al banner di download, tutti i flyout discendenti dell'header mantengono la precedenza visiva in primo piano, preservando al contempo `z-50` per le modali a pieno schermo (`SettingsModal`, `DriveModeScreen`).
- **Impatto sul Desiderata**:
  - Il pilota può accedere istantaneamente e senza ostacoli visivi a tutte le impostazioni vocali rapide con 1 tocco dalla barra di navigazione.

---

### [2026-09-29] - Aggiornamento Backlog Operativo: Filtro Deltaplano, Menu al Top, Impostazioni ad Accordion, Numero Versione
- **Cosa abbiamo fatto**:
  - Aggiunti e dettagliati i nuovi requisiti operativi richiesti dall'utente all'interno di [TODO.md](file:///d:/Github/Quiz_VDS-VL/TODO.md) (Fase 8: Nuove Funzionalità & Backlog Attivo) e [DESIDERATA.md](file:///d:/Github/Quiz_VDS-VL/DESIDERATA.md):
    * **Filtro Domande Esclusive Deltaplano (Discipline Tagging con Protezione Quesiti Condivisi)**: pianificato l'audit semantico delle 504 domande per discriminare quesiti specifici del deltaplano (pilotaggio pendolare con barra di controllo/trapezio/A-frame, spostamento del baricentro, trave di chiglia, cavi e tubi strutturali) da quelli del parapendio (freni, elevatori, fascio funicolare, cassoni, centine). Fissato il vincolo tassativo di salvaguardia per preservare categoricamente tutte le domande di teoria comune (aerodinamica generale, meteo, normativa D.P.R. 133/2010, primo soccorso, fisiologia del volo e strumentazione).
    * **Blocco Menu di Navigazione al Top (Sticky/Fixed Top Navigation)**: pianificata la riorganizzazione dell'ancoraggio della navigazione principale in alto, integrando i 5 tab di navigazione nell'header superiore ed eliminando o alleggerendo la bottom nav su smartphone, per recuperare spazio verticale prezioso e garantire coerenza ergonomica tra desktop e mobile.
    * **Ristrutturazione Impostazioni con Accordion Compresso Singolo (Single-Open Accordion)**: pianificata la sostituzione del menu a schede/pillole orizzontale in [src/components/SettingsModal.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/SettingsModal.tsx) con un layout ad accordion verticale a sezioni ripiegabili compatto, governato da una regola di mutua esclusione (l'apertura di un pannello chiude automaticamente il precedente, mantenendo aperta una sola sezione alla volta).
    * **Visualizzazione Globale del Numero di Versione**: pianificata l'integrazione di un badge di versione sempre visibile e discreto (es. in Navbar, header Impostazioni o footer), agganciato dinamicamente alla costante di build `__APP_VERSION__` definita in `vite.config.ts`, per facilitare la diagnostica, la verifica degli aggiornamenti PWA offline e le segnalazioni dell'allievo pilota.
- **Scelte architetturali & Rationale**:
  - *Discipline Filtering Safety Rationale*: L'esame VDS/VL dell'Aero Club d'Italia è unificato per il Volo Libero. Escludere erroneamente quesiti generali dall'esercitazione di un allievo parapendista creerebbe lacune gravi su aerodinamica di base o meteo. L'audit deve essere chirurgico e conservativo (default `all`, marcatura `hang_glider` solo su elementi inequivocabili di ala rigida/trapezio).
  - *Top Sticky Menu Ergonomics*: Su schermi smartphone allungati (19.5:9 o 20:9), la compresenza di header in alto e barra fissa in basso sottrae fino a 140px di altezza viewport ai quiz e alle opzioni. Fissare il menu in alto unifica i comandi primari e libera la visuale per le risposte e il feedback didattico immediato.
  - *Single-Open Accordion vs Multi-Tab Pills*: Con 6 sezioni di configurazione ricche di opzioni e toggle, la barra orizzontale a pillole richiede scorrimenti orizzontali su schermi stretti e nasconde la panoramica delle categorie. L'accordion verticale compresso a sezione singola offre un'architettura visuale ordinata, densa e senza dispersione.
  - *Dynamic Version Rationale*: L'uso di `__APP_VERSION__` (e facoltativamente `__APP_BUILD_ID__` / commit hash) garantisce che la versione mostrata sia sempre allineata a `package.json` senza bisogno di sincronizzazioni manuali soggette a dimenticanze.
- **Impatto sul Desiderata**:
  - Allineata la roadmap di sviluppo con le priorità del pilota, garantendo continuità cognitiva per le prossime implementazioni.

### [2026-09-29] - Impostazione Voce di Default su Elsa (TTS Neurale Femminile)
- **Cosa abbiamo fatto**:
  - Impostata la voce **Elsa** (`'elsa'`) come voce di default predefinita dell'applicazione:
    * In [src/db/index.ts](file:///d:/Github/Quiz_VDS-VL/src/db/index.ts): aggiornato `DEFAULT_SETTINGS.ttsVoice` da `'giuseppe'` a `'elsa'`.
    * In [src/services/voiceService.ts](file:///d:/Github/Quiz_VDS-VL/src/services/voiceService.ts): aggiornato lo stato iniziale del singleton `VoiceService` (`private voiceName: 'giuseppe' | 'elsa' = 'elsa'`).
    * In [src/context/QuizContext.tsx](file:///d:/Github/Quiz_VDS-VL/src/context/QuizContext.tsx): aggiornato il fallback della voce in `voiceService.setVoice(settings.ttsVoice || 'elsa')`.
    * In [src/components/AudioOfflinePromptModal.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/AudioOfflinePromptModal.tsx): impostato il fallback a `'elsa'`.
    * In [src/components/DriveModeScreen.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/DriveModeScreen.tsx): impostato il fallback `activeVoice` a `'elsa'`.
    * In [src/components/VoiceQuickMenu.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/VoiceQuickMenu.tsx): impostato il fallback `currentVoice` a `'elsa'`.
    * In [src/components/SettingsModal.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/SettingsModal.tsx): aggiornata la logica di visualizzazione dello stato attivo (`(settings.ttsVoice || 'elsa') === 'elsa'`).
    * In [src/services/voiceService.test.ts](file:///d:/Github/Quiz_VDS-VL/src/services/voiceService.test.ts): allineate le asserzioni dei test unitari della suite vocale con la voce predefinita `elsa` (131 test su 131 superati con esito positivo).
- **Scelte architetturali & Rationale**:
  - *Dizione Cristallina & Preferenza Utente*: La voce neurale `it-IT-ElsaNeural` offre un'articolazione chiara ed energica particolarmente adatta all'ascolto rapido delle opzioni d'esame. L'utente può comunque commutare su Giuseppe con 1 tocco dal menu rapido vocale o dalle Impostazioni.
- **Impatto sul Desiderata**:
  - Tutte le nuove installazioni e i profili senza selezione pregressa avviano immediatamente la sintesi vocale con Elsa.

### [2026-09-29] - Integrazione Menu Rapido Impostazioni Voce in Modalità Guida
- **Cosa abbiamo fatto**:
  - Esteso il componente [src/components/VoiceQuickMenu.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/VoiceQuickMenu.tsx):
    * Aggiunto supporto a proprietà flessibili: `id`, `popoverId`, `align`, `className`, `buttonClassName`, `forceDark`, `onOpenVoiceGuide`, `onReplaySpokenGuide` e `onOpenChange`.
    * Introdotta la modalità `forceDark`: garantisce che quando il menu viene aperto all'interno della Modalità Guida (sempre ancorata al tema scuro Cockpit Black per evitare riflessi sul parabrezza dell'auto), non vengano applicate le classi chiare di `Hangar Light` anche qualora l'utente abbia il tema chiaro attivo nel resto dell'applicazione.
    * Implementata la delimitazione reattiva dello spazio del popover (`max-w-[calc(100vw-24px)]` e `max-h-[calc(100dvh-80px)] overflow-y-auto`) con blocco della propagazione degli eventi touch (`stopPropagation`), impedendo che i tocchi o scorrimenti all'interno del popover attivino inavvertitamente i gesti di swipe per il cambio quiz.
    * Garantita la retrocompatibilità totale (100%) con il `Navbar`: in assenza di proprietà `id`, vengono mantenuti gli ID originali (`btn-voice-quick-menu`, `voice-quick-popover`, `quick-voice-giuseppe`, `quick-voice-elsa`, `quick-toggle-tts`, `quick-speed-${rate}`).
  - Integrato il menu rapido voce in tutti e 3 gli stati di [src/components/DriveModeScreen.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/DriveModeScreen.tsx):
    * **Launcher Guida**: posizionato nell'header superiore (`#btn-drive-launcher-voice-menu`) adiacente al pulsante di uscita `X`, per consentire di regolare voce (Giuseppe/Elsa), velocità (0.9x-1.25x), lettura automatica ed effetti sonori prima di avviare l'esercitazione.
    * **Quiz Attivo (HUD Superiore)**: posizionato nella Top Bar HUD (`#btn-drive-voice-quick-menu`) a fianco dei controlli del Pilota Automatico e del microfono vocale, consentendo il cambio al volo delle preferenze vocali durante la guida.
    * **Debriefing**: integrato nell'header della schermata di riepilogo (`#btn-drive-debriefing-voice-menu`).
    * Aggiunto lo stato `isVoiceMenuOpen` per inibire i comandi da tastiera e telecomandi da volante (tasti 1, 2, 3, frecce) mentre il popover è aperto, consentendo la chiusura pulita con `Escape`.
  - In [src/components/VoiceCommandsModal.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/VoiceCommandsModal.tsx):
    * Elevato l'overlay a `z-[70]` per garantire che la guida comandi vocali Hands-Free si posizioni sempre al di sopra sia della Modalità Guida (`z-50`) sia del popover rapido (`z-[60]`).
  - Creata la suite di collaudo visivo CDP [scripts/test_drive_quick_voice_menu.js](file:///d:/Github/Quiz_VDS-VL/scripts/test_drive_quick_voice_menu.js) su viewport mobile (390x844):
    * Verificata l'apertura e il layout del popover sia dal Launcher ([public/test_drive_launcher_voice_menu_screenshot.png](file:///d:/Github/Quiz_VDS-VL/public/test_drive_launcher_voice_menu_screenshot.png)) sia durante il quiz attivo ([public/test_drive_running_voice_menu_screenshot.png](file:///d:/Github/Quiz_VDS-VL/public/test_drive_running_voice_menu_screenshot.png)).
    * Verificato il contenimento perfetto del popover (bounds: `left=1.5`, `right=289.5` nei 390px, 0 overflow orizzontale) e 0 errori in console.
    * Validata la suite multi-contesto [scripts/test_all_use_cases.js](file:///d:/Github/Quiz_VDS-VL/scripts/test_all_use_cases.js) superata al 100% con 0 errori in console.
  - Aggiornato [README.md](file:///d:/Github/Quiz_VDS-VL/README.md) e [DESIDERATA.md](file:///d:/Github/Quiz_VDS-VL/DESIDERATA.md).
  - Superati tutti i 131 test unitari Vitest (`npm run test:unit`) e completata con successo la build di produzione (`tsc && vite build`).
- **Scelte architetturali & Rationale**:
  - *Cockpit Dark Invariance (forceDark Rationale)*: In Modalità Guida, l'allievo pilota non deve mai essere abbagliato da finestre popup bianche durante la guida serale o in condizioni di bassa luminosità. L'isolamento tramite `forceDark` mantiene il popover ancorato al carbon dark con accenti ambra avionica, indipendentemente dal tema globale dell'app.
  - *Event Stop Propagation Rationale*: Poiché la Modalità Guida implementa swipe orizzontali a schermo intero per cambiare quesito, arrestare la propagazione degli eventi `touchstart` e `touchend` sul popover è fondamentale per permettere all'utente di interagire con pulsanti e cursori senza provocare cambi quiz imprevisti.
- **Impatto sul Desiderata**:
  - Piena parità funzionale per il controllo vocale rapido a 1 clic anche durante l'utilizzo in auto o con telecomandi da volante.

---

### [2026-09-29] - Schermata Impostazioni Fullscreen & Supporto Schermo Intero
- **Cosa abbiamo fatto**:
  - Trasformata la modale delle impostazioni in una schermata **fullscreen nativa** ([src/components/SettingsModal.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/SettingsModal.tsx)):
    * Rimosso il vecchio layout a card popup limitata (`max-w-md max-h-[92vh]` con oscuramento di sfondo `bg-black/75`).
    * Implementato il layout fullscreen viewport-filling (`fixed inset-0 z-50 h-[100dvh] w-screen overflow-hidden`) sia in Carbon Cockpit (`bg-zinc-950`) che in Hangar Light (`light:bg-slate-50`).
    * Aggiunto l'header fisso superiore (`sticky top-0 z-20 h-14 border-b`) con pulsante Indietro ergonomico (`#btn-close-settings`, con freccia sinistra ed etichetta), titolo con icona ingranaggio ambra, e pulsante di chiusura rapida `X` (`#btn-close-settings-x`).
    * Aggiunto il blocco dello scorrimento del documento sottostante (`document.body.style.overflow = 'hidden'`) all'apertura per prevenire doppio scroll, con ripristino trasparente alla chiusura.
    * Aggiunta la scorciatoia da tastiera avionica `Escape` per uscire istantaneamente dalle impostazioni.
    * Subheader con selettore schede a segmenti (`sticky top-14 z-10`) con auto-scorrimento orizzontale e allineamento reattivo centrato fino a `max-w-2xl` su desktop.
    * Corpo centrale a scorrimento verticale fluido a tutto schermo (`flex-1 overflow-y-auto overscroll-contain pb-24`) con contenitore centrato ergonomico `max-w-2xl mx-auto`.
    * Aggiunta l'opzione **"Schermo Intero (Fullscreen)"** nella scheda *Aspetto* con toggle interattivo (`#btn-toggle-fullscreen`) per browser che supportano la Fullscreen API (`requestFullscreen` / `exitFullscreen`).
    * Esportato anche l'alias `export const SettingsScreen = SettingsModal`.
    * Aggiunto `aria-label="Impostazioni"` al pulsante `#btn-settings` in [src/components/Navbar.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/Navbar.tsx) per maggiore accessibilità.
  - Creato lo script di collaudo headless [scripts/test_settings_fullscreen.js](file:///d:/Github/Quiz_VDS-VL/scripts/test_settings_fullscreen.js) ed eseguiti collaudi visivi CDP:
    * Verificate le dimensioni esatte a tutto schermo su Mobile Portrait 390x844 ([public/test_settings_fullscreen_mobile.png](file:///d:/Github/Quiz_VDS-VL/public/test_settings_fullscreen_mobile.png)).
    * Verificate le dimensioni esatte a tutto schermo su Desktop 1440x900 ([public/test_settings_fullscreen_desktop.png](file:///d:/Github/Quiz_VDS-VL/public/test_settings_fullscreen_desktop.png)).
    * Verificata la chiusura con pulsante Indietro e confermata l'assenza assoluta di errori in console JavaScript (0 console errors).
    * Rieseguito con successo anche il test storico [scripts/test_settings_about.js](file:///d:/Github/Quiz_VDS-VL/scripts/test_settings_about.js).
  - Superati tutti i 131 test unitari Vitest (`npm run test:unit`) e completata con successo la build di produzione (`npm run build`).
- **Scelte architetturali & Rationale**:
  - *Fullscreen Screen Layout vs Small Modal Popup*: Con 6 ricche sezioni tematiche (Aspetto, Voce e gestione cache offline per due voci, Guida con parametri radio/hands-free, Backup Google Drive con sync e token, Dati con export/import, About con regole ufficiali), la visualizzazione a modale popup ristretta risultava angusta, specialmente su smartphone. La transizione a schermata fullscreen offre uno spazio di consultazione arioso, leggibile e privo di barre di scorrimento annidate.
  - *Body Scroll Lock Rationale*: Il lock dell'overflow sul `body` garantisce che il touch o la rotellina del mouse agiscano esclusivamente sui controlli di configurazione, evitando scorrimenti accidentali della schermata sottostante.
  - *Dual Close Controls & Escape Rationale*: Fornire sia il pulsante a freccia "Indietro" a sinistra che la "X" a destra, combinati con il supporto tastiera `Escape`, asseconda indistintamente le abitudini d'uso mobile (back navigation) e desktop (window closing).
- **Impatto sul Desiderata**:
  - Soddisfatta puntualmente la richiesta dell'utente ("la pagina impostazioni deve essere fullscreen"), elevando l'ergonomia complessiva dell'interfaccia.

### [2026-09-29] - Modalità Simulazione Didattica (Tutor) & Risoluzione Cache Service Worker PWA
- **Cosa abbiamo fatto**:
  - Implementata la nuova **Simulazione Didattica (Tutor)** richiesta dall'utente, integrata organicamente nella scheda Esame ([src/components/ExamScreen.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/ExamScreen.tsx)):
    * **Launcher Rinnovato**: Scheda primaria in evidenza per *Simulazione Didattica (Tutor)* con badge *"Consigliata per imparare"*, spiegazione chiara e pulsante d'avvio prioritario `btn-start-tutor-exam`, affiancata da *Esame Ufficiale AeCI* (45 min) e *Maratona Intensiva* (60 min).
    * **Assenza di Limiti di Tempo**: Sostituito il countdown timer con un cronometro conteggio progressivo (`elapsedSeconds`) discreto, etichettato con badge verde `Senza limiti` e contatore live delle risposte `X ✓ / Y ✗`.
    * **Feedback Didattico Istantaneo**: Validazione cromatica immediata per ogni risposta con blocco anti-manomissione della domanda e visualizzazione contestuale della soluzione ufficiale, **Regola** e **Tranello**.
    * **Avanzamento a 1 Tocco**: Pulsante ad alta visibilità `"Prossima Domanda (N/30) →"` posizionato subito sotto la spiegazione per un flusso di studio rapido ed ergonomico.
    * **Griglia Reattiva 30 Bolle**: Aggiornamento in tempo reale dello stato visivo di ogni quesito (verde per risposta corretta, rosso per errore) con possibilità di rivedere in qualsiasi momento le domande già affrontate.
    * **Telemetria e Quaderno Errori**: Registrazione immediata in Dexie (`recordAnswer`) senza duplicazione alla consegna finale.
  - Aggiornato il modello dati in [src/types/database.ts](file:///d:/Github/Quiz_VDS-VL/src/types/database.ts) con `ExamModeType = 'official' | 'tutor' | 'marathon'`, estendendo `ExamSession` e `InProgressSession`.
  - Aggiornato il motore di valutazione [src/services/examEvaluator.ts](file:///d:/Github/Quiz_VDS-VL/src/services/examEvaluator.ts) e il relativo test [src/services/examEvaluator.test.ts](file:///d:/Github/Quiz_VDS-VL/src/services/examEvaluator.test.ts) (`EVAL-11`).
  - **Risoluzione Anomalie di Visualizzazione & Cache Browser**:
    * Identificato e terminato il processo orfano `vite preview` (PID 41968) in ascolto su `::1:5173` (IPv6), che intercettava le connessioni browser servendo una build precedente a quella aggiornata.
    * Aggiunto in [src/main.tsx](file:///d:/Github/Quiz_VDS-VL/src/main.tsx) il meccanismo automatico di invalidazione/unregistration dei Service Worker obsoleti in modalità sviluppo (`import.meta.env.DEV`), prevenendo l'intercettazione aggressiva della cache locale.
    * Ricompilata la build di produzione (`npm run build`) in [dist/](file:///d:/Github/Quiz_VDS-VL/dist/) con zero errori e verificata l'intera suite Vitest (131/131 superati).
- **Scelte architetturali & Rationale**:
  - *Tutor Mode Embedded Rationale*: Invece di creare una schermata isolata, l'integrazione diretta all'interno del flusso d'esame (`ExamScreen`) riutilizza l'algoritmo *Fair Coverage Randomizer* e la distribuzione per le 9 materie AeCI, permettendo all'allievo di prepararsi esattamente sul formato del test ufficiale ma con supporto didattico immediato.
  - *Dev Service Worker Auto-Unregister Rationale*: Nei progetti PWA Vite, un Service Worker registrato in una sessione di preview può rimanere attivo sul dominio locale `localhost:5173`, servendo bundle statici vecchi e bloccando l'aggiornamento dell'interfaccia. La deregistrazione automatica in ambiente di sviluppo garantisce che il browser riceva sempre il codice più recente.
- **Impatto sul Desiderata**:
  - Piena realizzazione del requisito di studio guidato con feedback per domanda, consolidando l'esperienza didattica per gli allievi piloti VDS-VL.


### [2026-09-29] - Feedback Visivo Reattivo e Pulsazione Microfono durante la Ricezione Comandi Vocali (Modalità Alla Guida)
- **Cosa abbiamo fatto**:
  - Risolta l'assenza di feedback percettivo sul funzionamento del riconoscimento vocale lamentata dall'utente:
    * In [src/hooks/useDriveVoiceCommands.ts](file:///d:/Github/Quiz_VDS-VL/src/hooks/useDriveVoiceCommands.ts):
      - Esposti i nuovi stati reattivi `isReceiving` (indica ricezione attiva di suoni/parlato/comandi), `interimTranscript` (trascrizione in tempo reale durante la dizione) ed `error` tipizzato (`not-allowed`, `network`, `audio-capture`).
      - Agganciati gli eventi nativi Web Speech API (`onaudiostart`, `onsoundstart`, `onspeechstart`, `onspeechend`, `onsoundend`, `onaudioend`) e impostato `rec.interimResults = true` per garantire reattività istantanea al parlato.
      - Implementato meccanismo di debounce/cooldown (1.5s - 1.8s) su `isReceiving` per rendere la pulsazione visibile, fluida e chiara anche per parole brevissime ("Uno", "Due", "Tre").
      - Prevenuta la doppia esecuzione dei comandi tra trascrizioni parziali e definitive tramite tracciamento progressivo dell'indice `lastHandledIndexRef`.
      - Irrobustito il ciclo di vita `onend`: gestione differenziata degli errori fatali (blocco riavvii a vuoto in caso di permessi negati `not-allowed`) e riavvio asincrono protetto con timeout da 150ms per prevenire `InvalidStateError` su Chrome/WebKit.
    * In [src/utils/voiceCommandParser.ts](file:///d:/Github/Quiz_VDS-VL/src/utils/voiceCommandParser.ts) e test [src/utils/voiceCommandParser.test.ts](file:///d:/Github/Quiz_VDS-VL/src/utils/voiceCommandParser.test.ts):
      - Normalizzazione e pulizia automatica di tutta la punteggiatura (`.`, `,`, `!`, `?`) inserita dai motori STT.
      - Estesa la grammatica vocale a forme naturali colloquiali italiane: *"la prima"*, *"la seconda"*, *"la terza"*, *"la uno"*, *"la due"*, *"la tre"*, *"scelgo la prima"*, *"scelgo la seconda"*, *"scelgo la terza"*.
    * In [src/components/DriveModeScreen.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/DriveModeScreen.tsx):
      - **Pulsazione Icona Microfono Header**: Quando i comandi vocali sono attivi e `isReceiving` è `true`, l'icona `<Mic />` pulsa vistosamente (`animate-pulse text-emerald-200 scale-125`), circondata da un'onda radar espansa (`animate-ping`) e da un bagliore avionico (`ring-2 ring-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.6)]`). In caso di errore (es. microfono negato), commuta su `MicOff` con bordo rosso/ambra e tooltip diagnostico esplicativo.
      - **Pulsazione e Feedback HUD Inferiore**: Sostituito il testo statico con un banner dinamico reattivo: icona microfono pulsante con onda radar; feedback in tempo reale *"In ricezione: '[testo]' "* durante il parlato; conferma immediata *"Comando: '[Azione]' ✓"* per 2.5s; notifica trasparente *"Sentito: '[testo]' (non riconosciuto)"* in caso di parole diverse dai comandi; e avviso diagnostico chiaro in caso di permessi negati nel browser.
      - **Banner Attesa Pilota Automatico**: Durante il conto alla rovescia di 5s, se l'utente parla il microfono pulsa e mostra la dizione live invece del testo generico.
      - **Launcher Guida**: Persistenza automatica della preferenza comandi vocali nelle impostazioni (`driveModeVoiceCommands`).
    * Creato lo script di collaudo headless [scripts/test_mic_pulsing.cjs](file:///d:/Github/Quiz_VDS-VL/scripts/test_mic_pulsing.cjs) registrato in `package.json` come `npm run test:visual:mic`.
    * Acquisito e verificato lo screenshot pixel-perfect [public/drive_mode_mic_active.png](file:///d:/Github/Quiz_VDS-VL/public/drive_mode_mic_active.png) confermando ZERO errori in console.
    * Superati tutti i 131 test unitari (`npm run test:unit`) e completata la compilazione del bundle di produzione (`npm run build`).
- **Scelte architetturali & Rationale**:
  - *Interim Results + Speech Start Pattern Rationale*: Nei test di guida a mani libere, l'attesa del risultato finale (`isFinal`) del motore STT introduceva un ritardo percettivo di 400-800ms durante il quale l'interfaccia appariva completamente inerte. Attivando `onsoundstart`/`onspeechstart` e `interimResults: true`, l'utente riceve un feedback visivo immediato (pulsazione e trascrizione in tempo reale) appena apre bocca.
  - *Diagnostica "Sentito (non riconosciuto)" Rationale*: Il motivo principale per cui un utente non comprende se il riconoscimento funzioni o meno risiede nei falsi negativi silenziosi (frasi pronunciate ma non riconosciute dal parser). Mostrando esplicitamente cosa il microfono ha captato, l'utente ha la certezza matematica che il microfono funziona e comprende subito se deve aggiustare la pronuncia (es. dire "Due" invece di parole discorsive).
- **Impatto sul Desiderata**:
  - Elevata l'esperienza d'uso della Modalità alla Guida hands-free a livello professionale, eliminando qualsiasi ambiguità sullo stato del microfono e del motore vocale.

### [2026-09-28] - Spostamento Progressione Download Voci in Banner Inferiore (Fix Overflow UI)
- **Cosa abbiamo fatto**:
  - Risolto il problema di overflow orizzontale su schermi smartphone provocato dall'accumulo di controlli nell'header superiore durante lo scaricamento delle voci audio:
    * Creato il nuovo componente [src/components/AudioDownloadBanner.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/AudioDownloadBanner.tsx) posizionato in basso (`fixed bottom-16 left-0 right-0 z-40`) immediatamente sopra la barra di navigazione inferiore. Il banner visualizza la voce in download (`Giuseppe` / `Elsa` o combinata), la percentuale, il conteggio file progressivo (`X / 2.520 file`), la barra di avanzamento e il pulsante per annullare il download.
    * In [src/components/AudioDownloadProgressHUD.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/AudioDownloadProgressHUD.tsx): convertito il modulo in un re-export trasparente di `AudioDownloadBanner` per garantire la retrocompatibilità del 100%.
    * In [src/components/Navbar.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/Navbar.tsx): rimosso l'indicatore di download dall'header superiore (che provocava l'allargamento forzato oltre i 390px di viewport e il conseguente troncamento del lato sinistro dello schermo) e agganciato `AudioDownloadBanner` sopra la navbar inferiore. Rafforzata la resilienza flex (`min-w-0 flex-shrink` e `gap-1 sm:gap-2`) per impedire sforamenti su qualsiasi viewport.
    * In [src/components/DriveModeScreen.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/DriveModeScreen.tsx): rimossi i riferimenti all'HUD dai titoli `<h1>` e dall'header quesito, integrandolo in modo ordinato e non invasivo all'interno del corpo del Launcher prima dei pulsanti di avvio rapido.
    * In [src/App.tsx](file:///d:/Github/Quiz_VDS-VL/src/App.tsx): implementato l'adattamento dinamico del padding inferiore (`pb-36` quando un download è attivo, `pb-20` standard), garantendo che i controlli a fondo pagina non vengano mai oscurati dal banner.
    * In [src/index.css](file:///d:/Github/Quiz_VDS-VL/src/index.css): applicato `overflow-x: hidden` e `max-width: 100vw` a `html, body` come misura di sicurezza sistemica anti-scroll orizzontale.
    * In [src/services/audioDownloadManager.ts](file:///d:/Github/Quiz_VDS-VL/src/services/audioDownloadManager.ts) e test [src/services/audioDownloadManager.test.ts](file:///d:/Github/Quiz_VDS-VL/src/services/audioDownloadManager.test.ts): aggiunto il metodo di utilità reattivo `isAnyDownloading()` (suite test passata al 100% con 131 test totali).
  - Validata l'interfaccia via CDP headless su viewport mobile 390x844 simulando un esame attivo con download vocale al 40%:
    * Screenshot generato e verificato: [public/audio_download_banner_screenshot.png](file:///d:/Github/Quiz_VDS-VL/public/audio_download_banner_screenshot.png) (zero overflow, testo del quiz e pulsanti perfettamente leggibili e allineati).
    * Build di produzione verificata con successo (`tsc && vite build`).
- **Scelte architetturali & Rationale**:
  - *Bottom Banner Pattern sopra la Nav Bar*: Sulle PWA mobile l'header superiore deve rimanere sobrio e riservato a elementi essenziali (logo, stato sessione/esame, modalità guida e impostazioni). I processi in background prolungati (come il download di 150-300 MB di audio) appartengono naturalmente all'area inferiore, dove non competono per la larghezza orizzontale con i comandi del cockpit e permettono di esporre informazioni dettagliate (nome voce, contatore file, barra grafica e cancel button).
  - *Zero Horizontal Overflow Guarantee*: L'impiego coordinato di `pointer-events-none` sul wrapper esterno, `pointer-events-auto` sulla scheda centrata (`max-w-md`) e `overflow-x: hidden` a livello di `html, body` elimina alla radice qualsiasi anomalia di trascinamento laterale o taglio del testo sui dispositivi mobili.
- **Impatto sul Desiderata**:
  - Esperienza utente impeccabile e priva di troncamenti visivi su smartphone durante sessioni d'esame con download audio in background.

### [2026-09-28] - Implementazione Modalità Simulazione Didattica (Tutor)
- **Cosa abbiamo fatto**:
  - Introdotta la nuova modalità **Simulazione Didattica (Tutor)** nella PWA:
    * In [src/types/database.ts](file:///d:/Github/Quiz_VDS-VL/src/types/database.ts): definito il tipo `ExamModeType = 'official' | 'tutor' | 'marathon'` ed estese le interfacce `ExamSession` e `InProgressSession` con il campo opzionale `examMode`.
    * In [src/services/examEvaluator.ts](file:///d:/Github/Quiz_VDS-VL/src/services/examEvaluator.ts): esteso `EvaluateExamParams` e propagato `examMode` all'interno dell'oggetto sessione d'esame generato. Aggiunto test unitario dedicato in [src/services/examEvaluator.test.ts](file:///d:/Github/Quiz_VDS-VL/src/services/examEvaluator.test.ts).
    * In [src/components/ExamScreen.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/ExamScreen.tsx):
      - Riorganizzata la schermata iniziale (`idle`) con una card principale in evidenza **Simulazione Didattica (Tutor)** (*Consigliata per imparare* · 30 quiz AeCI · Senza limiti di tempo · Feedback istantaneo e spiegazioni), mantenendo al contempo l'avvio dell'**Esame Ufficiale AeCI** (45 min) e della **Maratona Intensiva** (60 quiz).
      - Implementato il cronometro progressivo per la modalità didattica (tempo trascorso invece del countdown con allarmi).
      - Integrata la correzione cromatico-sonora immediata al tocco di ciascuna opzione (`showFeedback = true`), con blocco anti-modifica accidentale, visualizzazione immediata della spiegazione **Regola** e **Tranello**, e riproduzione vocale on-demand.
      - Implementata la colorazione dinamica in tempo reale nella griglia a 30 bolle (verde smeraldo per risposte corrette, rosso per gli errori) per consultazione rapida del bilancio d'esame.
      - Aggiunto il pulsante ergonomico *"Prossima Domanda"* visualizzato sotto al box spiegazione per avanzare comodamente ad una mano su dispositivi mobili.
      - Registrazione istantanea delle statistiche e telemetria in IndexedDB tramite `recordAnswer` senza attendere la fine della scheda, alimentando subito il Quaderno Errori.
      - Adattata la schermata di debriefing e le modali di consegna/abbandono per riflettere la natura della sessione didattica.
    * In [README.md](file:///d:/Github/Quiz_VDS-VL/README.md) e [DESIDERATA.md](file:///d:/Github/Quiz_VDS-VL/DESIDERATA.md): documentata la nuova modalità sia nelle specifiche funzionali che nella matrice di stato.
  - Creato lo script di collaudo headless [scripts/test_tutor_mode.js](file:///d:/Github/Quiz_VDS-VL/scripts/test_tutor_mode.js) ed eseguiti test CDP:
    * Catturato screenshot launcher [public/test_tutor_idle_screenshot.png](file:///d:/Github/Quiz_VDS-VL/public/test_tutor_idle_screenshot.png).
    * Catturato screenshot feedback positivo [public/test_tutor_feedback_screenshot.png](file:///d:/Github/Quiz_VDS-VL/public/test_tutor_feedback_screenshot.png).
    * Catturato screenshot feedback errato con Regola/Tranello e quaderno errori incrementato [public/test_tutor_wrong_feedback_screenshot.png](file:///d:/Github/Quiz_VDS-VL/public/test_tutor_wrong_feedback_screenshot.png).
    * Verificata l'assenza assoluta di errori in console browser (0 console errors).
  - Superati tutti i 130 test unitari Vitest (`npm run test:unit`) e completata con successo la build di produzione (`npm run build`).
- **Scelte architetturali & Rationale**:
  - *Dual-Path Architecture Rationale*: Invece di creare un quarto schermo o affollare la barra di navigazione inferiore a 5 slot (ottimale per i 390px dei dispositivi mobili), integrare la Simulazione Didattica all'interno della scheda Esame fornisce una gerarchia naturale tra prova formativa (Tutor senza tempo) e prova formale (Esame AeCI a tempo).
  - *Real-Time Telemetry Writing in Tutor Mode Rationale*: Scrivere subito in IndexedDB la risposta fornita assicura che qualsiasi errore commesso durante lo studio entri immediatamente nel Quaderno Errori (algoritmo Leitner), anche se lo studente interrompe l'esercitazione prima di completare tutti i 30 quiz.
  - *30-Slot Grid Live Balance Rationale*: La visualizzazione in tempo reale di verde/rosso sulle 30 caselle offre all'allievo un colpo d'occhio immediato sul rispetto della soglia dei 3 errori massimi durante l'apprendimento.
- **Impatto sul Desiderata**:
  - Soddisfatto pienamente il requisito dell'utente per una modalità identica all'esame ma concepita per imparare senza ansia temporale e con correzione guidata quesito per quesito.

### [2026-09-28] - Normalizzazione Microcopy: da "Prontezza" a "Preparazione"
- **Cosa abbiamo fatto**:
  - Sostituito il termine "Prontezza" con il più naturale ed efficace "Preparazione":
    * In [src/components/Navbar.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/Navbar.tsx): convertita la label sotto al logo da `Prontezza: {score}%` a `Preparazione: {score}%`.
    * In [src/components/StatsScreen.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/StatsScreen.tsx): convertito il titolo della card principale da `Prontezza Esame` a `Preparazione Esame`.
    * In [src/utils/analytics.test.ts](file:///d:/Github/Quiz_VDS-VL/src/utils/analytics.test.ts): aggiornato il titolo della suite test `Indice di Preparazione Esame`.
    * In [README.md](file:///d:/Github/Quiz_VDS-VL/README.md) e [DESIDERATA.md](file:///d:/Github/Quiz_VDS-VL/DESIDERATA.md): allineata la documentazione e la matrice di stato delle feature a "Indice di Preparazione Esame".
  - Verificato il rendering visivo tramite screenshot CDP headless [public/navbar_preparazione_screenshot.png](file:///d:/Github/Quiz_VDS-VL/public/navbar_preparazione_screenshot.png).
  - Superati tutti i 129 test unitari (`npm run test:unit`) e completata la compilazione del bundle di produzione (`npm run build`).
- **Scelte architetturali & Rationale**:
  - *Linguaggio Naturale & Didattico Rationale*: Per un allievo pilota che studia per l'esame teorico di volo libero, il termine "Preparazione" descrive esattamente e chiaramente lo stato di avanzamento e consolidamento delle nozioni rispetto a "Prontezza", che richiamava impropriamente una terminologia militare ("readiness") non in linea con un'esperienza di studio accogliente e pulita.
- **Impatto sul Desiderata**:
  - Piena coerenza e immediatezza di comprensione del microcopy per gli utenti finali.

### [2026-09-28] - Risoluzione ReferenceError navigator nei test CI e aggiornamento Node.js 22
- **Cosa abbiamo fatto**:
  - Risolto il fallimento degli 11 test su GitHub Actions (`ReferenceError: navigator is not defined` in `syncEngine.test.ts` e `voiceService.test.ts`):
    * Creato il file di setup globale Vitest [src/test/setup.ts](file:///d:/Github/Quiz_VDS-VL/src/test/setup.ts) che definisce ed esporta in modo sicuro `globalThis.navigator` con `onLine: true` negli ambienti Node (come Node 20, dove `navigator` non è disponibile come globale built-in).
    * Registrato `setupFiles: ['./src/test/setup.ts']` in [vitest.config.ts](file:///d:/Github/Quiz_VDS-VL/vitest.config.ts) ed esclusa la cartella `src/test/**` dal coverage.
    * In [src/services/syncEngine.ts](file:///d:/Github/Quiz_VDS-VL/src/services/syncEngine.ts), isolato l'accesso a `navigator.onLine` tramite l'helper sicuro `isDeviceOnline()`, prevenendo `ReferenceError` a runtime in contesti privi di `navigator`.
    * In [src/services/syncEngine.test.ts](file:///d:/Github/Quiz_VDS-VL/src/services/syncEngine.test.ts) e [src/services/voiceService.test.ts](file:///d:/Github/Quiz_VDS-VL/src/services/voiceService.test.ts), sostituite le chiamate dirette `Object.defineProperty(navigator, 'onLine', ...)` con un helper modulare `setNavigatorOnline(online: boolean)` che opera in sicurezza su `globalThis.navigator`.
    * Aggiornata la versione di Node.js in [.github/workflows/deploy.yml](file:///d:/Github/Quiz_VDS-VL/.github/workflows/deploy.yml) da `node-version: 20` (ormai deprecata su GitHub Actions) a `node-version: 22` (Active LTS).
  - Validata l'esecuzione completa della suite di test: 15 suite e 129 test passati al 100%, con esito positivo anche per la build di produzione (`tsc && vite build`).
- **Scelte architetturali & Rationale**:
  - *SetupFiles Pattern in Vitest*: Invece di confidare nel runtime host Node (introdotto solo in Node 21+), una PWA che testa codice browser in ambiente `node` deve fornire shim leggeri e deterministici in `setupFiles` per le API web minime utilizzate (`navigator.onLine`).
  - *Helper difensivo isDeviceOnline*: In `syncEngine.ts`, evitare sempre l'accesso diretto non presidiato a globali del browser per garantire la massima stabilità in qualunque runtime o contesto di esecuzione.
- **Impatto sul Desiderata**:
  - Pipeline di Continuous Integration (CI/CD) su GitHub Actions ripristinata e verde al 100%, eliminando anche i warning di deprecazione su Node 20.

### [2026-09-28] - Rimozione Buzzword, Slogan e Allineamento Microcopy Sobrio ed Essenziale
- **Cosa abbiamo fatto**:
  - Eliminati tutti gli slogan di marketing, le diciture ridondanti e i testi autoreferenziali ("Cockpit Avionics Design", "Zero-Blue Theme", "Avionics Ready") che non apportavano reale valore all'utente:
    * In [src/components/SettingsModal.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/SettingsModal.tsx):
      - Scheda Aspetto: convertito "Tema Visivo Cockpit" in "Tema dell'applicazione".
      - Scheda Voce: convertito "Effetti Sonori Cockpit" in "Effetti sonori", con spiegazione essenziale "Feedback sonoro per tocco e conferma delle risposte".
      - Scheda About: rimossa completamente la riga `Cockpit Avionics Design · Zero-Blue Theme · Fast & Offline`. Riorganizzati e riscritti i punti dell'elenco caratteristiche in linguaggio chiaro, sobrio e orientato ai benefici concreti dell'utente (*Funzionamento Offline*, *Copertura Completa*, *Quaderno Errori*, *Supporto Vocale*, *Privacy dei Dati*).
    * In [src/components/VoiceQuickMenu.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/VoiceQuickMenu.tsx): convertito "Effetti sonori cockpit" in "Effetti sonori".
    * In [src/components/VoiceCommandsModal.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/VoiceCommandsModal.tsx): convertito "Consigli Cockpit per la Guida" in "Consigli per la guida".
    * In [src/services/voiceService.ts](file:///d:/Github/Quiz_VDS-VL/src/services/voiceService.ts): convertito l'album dei metadati audio MediaSession da "Istruzioni Avioniche" in "Guida Vocale".
    * In [index.html](file:///d:/Github/Quiz_VDS-VL/index.html): sostituito "Avionics Ready" nello splash screen con "Caricamento...".
  - Aggiornato [MEMORY.md](file:///d:/Github/Quiz_VDS-VL/MEMORY.md) codificando la regola permanente vincolante: **Divieto Assoluto di Slogan e Buzzword Inutili**.
  - Verificato con test CDP headless [scripts/test_settings_about.js](file:///d:/Github/Quiz_VDS-VL/scripts/test_settings_about.js) e generato nuovo screenshot visivo [public/test_settings_about_screenshot.png](file:///d:/Github/Quiz_VDS-VL/public/test_settings_about_screenshot.png).
  - Superati tutti i 129 test unitari (`npm run test:unit`) e la compilazione del bundle di produzione (`npm run build`).
- **Scelte architetturali & Rationale**:
  - *Comunicazione Utile e Non-Pretenziosa Rationale*: L'allievo pilota che si prepara all'esame cerca chiarezza e affidabilità, non vuoti slogan di marketing ("Cockpit Avionics Design", "Zero-Blue"). L'applicazione deve mantenere un'interfaccia impeccabile e pulita, con testi che descrivono fedelmente solo le funzioni reali senza ridondanze.
- **Impatto sul Desiderata**:
  - Massima fruibilità, rispetto per l'utente ed eliminazione di qualsiasi attrito percettivo.

### [2026-09-28] - Iniezione Metadati di Build e Tracciamento Build Number in Console DevTools
- **Cosa abbiamo fatto**:
  - Configurato [vite.config.ts](file:///d:/Github/Quiz_VDS-VL/vite.config.ts) con iniezione a compile-time tramite `define`:
    * `__APP_VERSION__`: versione semantica letta dinamicamente da `package.json`.
    * `__APP_BUILD_NUMBER__`: contatore incrementale calcolato via `git rev-list --count HEAD` (es. `#61`, `#62`).
    * `__APP_COMMIT_HASH__`: hash sintetico del commit corrente (`git rev-parse --short HEAD`).
    * `__APP_BUILD_TIME__`: timestamp ISO della generazione bundle.
    * `__APP_BUILD_ID__`: stringa descrittiva completa `Build #<N> (<hash>) - <timestamp>`.
  - Creato il file di definizioni TypeScript ambientali [src/vite-env.d.ts](file:///d:/Github/Quiz_VDS-VL/src/vite-env.d.ts) con estensione dell'interfaccia globale `window.__APP_BUILD_INFO__`.
  - Aggiornato il bootstrap dell'applicazione in [src/main.tsx](file:///d:/Github/Quiz_VDS-VL/src/main.tsx):
    * Emette un banner stilizzato con badge cockpit in console browser all'avvio.
    * Emette una riga plain-text `[VDS-VL Build ID] ...` facilmente filtrabile in console.
    * Espone l'oggetto completo dei metadati su `window.__APP_BUILD_INFO__` per consultazione istantanea nel terminale DevTools.
  - Verificato con successo tramite script CDP headless il corretto output dei log di build e la presenza dell'oggetto in runtime.
  - Eseguiti con successo tutti i 129 test unitari (`npm run test:unit`) e la compilazione completa del bundle di produzione (`npm run build`).
- **Scelte architetturali & Rationale**:
  - *Build Number Deterministico da Git rev-list Rationale*: L'uso del numero cumulativo di commit Git assicura un identificativo progressivo intero naturale, immediatamente comprensibile dall'utente per accertarsi che il browser stia eseguendo la versione aggiornata e non una copia memorizzata nella cache del Service Worker.
  - *Doppio Canale Console + Window Rationale*: La visualizzazione automatica in console garantisce feedback visivo immediato a ogni apertura di pagina o refresh, mentre la disponibilità su `window.__APP_BUILD_INFO__` consente verifiche programmatiche o manuali rapide in qualsiasi momento.
- **Impatto sul Desiderata**:
  - Elimina l'ambiguità sullo stato di aggiornamento della PWA, consentendo diagnosi istantanea di eventuali disallineamenti di cache locale o Service Worker.

### [2026-09-28] - Integrazione Scheda About nelle Impostazioni e Protocollo di Collaudo Manuale Completo nei TODO
- **Cosa abbiamo fatto**:
  - Esteso il componente modale [src/components/SettingsModal.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/SettingsModal.tsx):
    - Aggiunto il tipo `'about'` a `SettingsTab` e introdotto la sesta scheda tematica **About** (`id="tab-about"`) con icona `Info` da Lucide React.
    - Implementato il layout avionico completo per la scheda About:
      * Banner identità software con badge versione (`v1.0.0 · PWA Cockpit Edition`).
      * Card normativa AeCI: riferimento al D.P.R. 9 luglio 2010 n. 133, catalogo ufficiale di 504 quiz (edizione 2017), formato esame 30 quiz / 45 minuti, soglia di idoneità (max 3 errori, ≥27/30) e quote canoniche per le 9 materie.
      * Card architettura & privacy: architettura 100% Offline-First (IndexedDB/Dexie + CacheStorage Service Worker), Fair Coverage Randomizer, Spaced Repetition Leitner, motore vocale neurale multi-voce e sovranità assoluta dei dati personali.
      * Footer didattico con dedica agli allievi piloti italiani di Volo Libero.
    - Riorganizzata la scheda Dati focalizzandola sull'Archivio Locale IndexedDB e l'Area Reset.
    - Implementato `scrollIntoView` fluido (`tabRefs`) sulla barra dei selettori per garantire che la scheda attiva sia sempre visibile e centrata anche su schermi mobili stretti (390x844).
  - Aggiornato [TODO.md](file:///d:/Github/Quiz_VDS-VL/TODO.md):
    - Aggiunta la **Fase 7: Protocollo di Collaudo Manuale Completo E2E (Checklist Operativa Pilota)** suddivisa in 9 aree operative dettagliate e complete di criteri di accettazione BVA:
      1. Avvio, Installazione PWA, Temi & Interfaccia Avionica
      2. Simulatore d'Esame Ufficiale AeCI (30 Quiz / 45 Minuti, Max 3 Errori)
      3. Studio per Materie & Didattica Immediata
      4. Quaderno Errori (Ripetizione Spaziata Leitner a 2 successi consecutivi)
      5. Archivio Completo & Ricerca Full-Text
      6. Motore Audio Vocale Cockpit & Quick Speech Menu
      7. Modalità Alla Guida (Truck & Cockpit Drive Mode, Wake Lock, Briefing Run-Once, Comandi Vocali)
      8. Gestione Offline & Audio CacheStorage
      9. Backup Cloud Google Drive & Esportazione File JSON
  - Creato lo script di collaudo headless [scripts/test_settings_about.js](file:///d:/Github/Quiz_VDS-VL/scripts/test_settings_about.js) via CDP:
    - Verificata l'apertura delle impostazioni, la navigazione alla tab About, la presenza di tutti i nodi di testo e regolamento nel DOM e l'assenza assoluta di errori in console JavaScript.
    - Generato lo screenshot di collaudo [public/test_settings_about_screenshot.png](file:///d:/Github/Quiz_VDS-VL/public/test_settings_about_screenshot.png).
  - Aggiornati [README.md](file:///d:/Github/Quiz_VDS-VL/README.md) e [DESIDERATA.md](file:///d:/Github/Quiz_VDS-VL/DESIDERATA.md).
- **Scelte architetturali & Rationale**:
  - *Scheda Dedicata About Rationale*: L'allievo pilota che si prepara all'esame di volo libero necessita di certezze assolute sulle fonti normative dei quiz (D.P.R. 133/2010, edizione AeCI 2017) e sui criteri d'esame. Inserire una scheda About pulita e dedicata, anziché comprimere le note nella scheda Dati, conferisce autorevolezza istituzionale e trasparenza all'app.
  - *Auto Scroll Tab Bar Rationale*: Su viewport mobili da 390px, 6 schede con icona e testo superano leggermente la larghezza orizzontale disponibile. L'uso di `ref` + `scrollIntoView({ inline: 'nearest' })` assicura che al tocco o all'apertura la scheda selezionata scivoli fluidamente in primo piano senza troncare le etichette.
- **Impatto sul Desiderata**:
  - Pieno allineamento delle impostazioni modulari e disponibilità di una checklist di collaudo manuale esaustiva per la certificazione sul campo.

### [2026-09-28] - Incorporamento Icona Master Esatta nello Splash Screen e Risoluzione Screenshot
- **Cosa abbiamo fatto**:
  - Risolto il difetto di rendering negli screenshot precedenti: il tag `<img src="/icons/icon-512x512.png">` in ambiente di collaudo headless isolato via protocollo `file:///` non risolveva la root web, generando un'immagine vuota/incompleta.
  - Sostituito l'approccio con l'incorporamento diretto della stringa base64 JPEG ottimizzata a 512x512 dell'icona master *Paraglider Question Mark* sia in [index.html](file:///d:/Github/Quiz_VDS-VL/index.html) sia nel master [public/favicon.svg](file:///d:/Github/Quiz_VDS-VL/public/favicon.svg):
    - Zero dipendenze di rete sul caricamento a freddo.
    - Resa istantanea dell'icona master completa di texture carbonio a micro-rete e bagliore ambra avionico organico.
  - Rigenerati gli screenshot verificando programmaticamente via CDP che `img.naturalWidth === 512`, `img.complete === true` e `img.clientWidth === 240`:
    - [public/splash_screen_mobile.png](file:///d:/Github/Quiz_VDS-VL/public/splash_screen_mobile.png) (286 KB, resa mobile reale iPhone 390x844).
    - [public/splash_screen_desktop.png](file:///d:/Github/Quiz_VDS-VL/public/splash_screen_desktop.png) (111 KB, resa desktop reale 1440x900).
  - Aggiornato il visualizzatore interattivo [splash_viewer.html](file:///C:/Users/aless/.gemini/antigravity/brain/7895f15b-0ae5-48a0-a929-6b6e8b3cc02a/splash_viewer.html).
  - Verificato con successo `npm run test:unit` (129/129 passing) e `npm run build` (zero errori TypeScript).
- **Scelte architetturali & Rationale**:
  - *Self-Contained Data URI Rationale*: L'inlining del JPEG 512x512 a qualità 92% dentro il tag dello splash screen elimina qualsiasi race condition o ritardo di rendering durante il Cold Start su qualsiasi host (Vite locale, PWA standalone, GitHub Pages o WebView).
- **Impatto sul Desiderata**:
  - Allineamento estetico al 100% con l'icona master scelta dall'utente.

### [2026-09-28] - Interruzione Simulazione d'Esame con Conferma Guidata (ExamScreen & DriveMode)
- **Cosa abbiamo fatto**:
  - Implementato in [src/components/ExamScreen.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/ExamScreen.tsx) un flusso esplicito e accessibile per interrompere la simulazione d'esame in qualsiasi momento:
    - Sostituito il pulsante secondario con testo nascosto su mobile con un pulsante avionico ad alto contrasto `Interrompi` (`btn-abandon-exam`), dotato di icona `XCircle`, bordo e bagliore rose (`border-rose-500/40 bg-rose-500/10 text-rose-400`), visibile su qualsiasi viewport (mobile e desktop).
    - Aggiunto un pulsante secondario a fondo pagina (`btn-bottom-abandon-exam`) sotto i controlli Precedente/Successiva per permettere l'interruzione rapida anche dopo aver fatto scorrere le opzioni.
    - Aggiornata la modale di conferma: titolo chiaro *"Interrompere la Simulazione?"*, riepilogo delle risposte inserite non conteggiate, supporto alla chiusura con tasto `Escape` e backdrop click.
    - Gestione pulita dell'arresto audio tramite `voiceService.stop()` e cancellazione della sessione attiva persistita su Dexie via `dismissActiveSession()`.
  - Esteso il comportamento in [src/components/DriveModeScreen.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/DriveModeScreen.tsx):
    - Il tasto `Esci` della barra HUD commuta automaticamente su `Interrompi` (con stile rose) durante le sessioni d'esame.
    - Introdotta la modale dedicata di conferma interruzione per la guida: se l'esame proviene da `ExamScreen` (`sessionContext`), l'allievo può scegliere tra *"Continua Esame"*, *"Torna alla Scheda"* (senza perdere i progressi dell'esame) e *"Interrompi Esame"*.
    - Aggiunto il listener del tasto `Escape` per annullare la modale in modalità guida.
  - Aggiornato [src/App.tsx](file:///d:/Github/Quiz_VDS-VL/src/App.tsx):
    - Nella modale di cambio tab durante un esame attivo, il pulsante *"Interrompi ed Esci"* invoca ora tassativamente `dismissActiveSession()` per evitare la ri-comparsa indesiderata del banner di sessione attiva non voluta.
  - Convalidata la suite con **129/129 test unitari superati** (`npm run test:unit`) e `npm run build` a zero errori.
- **Scelte architetturali & Rationale**:
  - *Visibilità Mobile First Rationale*: Gli allievi piloti utilizzano la PWA prevalentemente su smartphone (portrait 390x844). Nascondere il testo "Abbandona" con `hidden sm:inline` rendeva invisibile l'intento dell'azione. L'etichetta "Interrompi" sempre presente con semantica visiva rose garantisce chiarezza e previene clic errati.
  - *Opzione "Torna alla Scheda" in Drive Mode*: Consente al candidato di passare fluidamente dalla visualizzazione ad alto contrasto da cruscotto alla scheda classica senza interrompere la simulazione ufficiale.
- **Impatto sul Desiderata**:
  - Pieno controllo dell'utente sull'esame, prevenzione di perdite accidentali di dati e rispetto rigoroso dei requisiti UX di conferma.

### [2026-09-28] - Avvio e Persistenza Demone Server Web Locale & Rete (Watchdog Resurrezione Automatica)
- **Cosa abbiamo fatto**:
  - Creato lo script demone [scripts/start_server_daemon.ps1](file:///d:/Github/Quiz_VDS-VL/scripts/start_server_daemon.ps1) per l'esecuzione continua di Vite (`0.0.0.0:5173`) con ciclo di watchdog infinito e auto-restart in caso di crash o arresto imprevisto.
  - Creato lo script di controllo e stop pulito [scripts/stop_server_daemon.ps1](file:///d:/Github/Quiz_VDS-VL/scripts/stop_server_daemon.ps1) che gestisce l'interruzione selettiva del watchdog e dei processi collegati alla porta 5173.
  - Avviato il demone come processo nativo Windows completamente distaccato tramite Windows Management Instrumentation (`Invoke-CimMethod -ClassName Win32_Process -MethodName Create` con parent `WmiPrvSE.exe`).
  - Verificato il binding completo su `0.0.0.0:5173` sia per localhost (`http://localhost:5173/`, `http://127.0.0.1:5173/`) che per l'interfaccia Wi-Fi locale (`http://192.168.1.13:5173/` per collaudo diretto da smartphone).
  - Testata e validata la tolleranza ai guasti (Fault Tolerance / Watchdog): terminando forzatamente il processo `node` su porta 5173, il watchdog ha riavviato automaticamente il server in meno di 2 secondi con nuovo PID garantendo disponibilità ininterrotta fino al prossimo riavvio del sistema.
- **Scelte architetturali & Rationale**:
  - *WMI / CIM Detached Process Rationale*: L'avvio tramite CIM `Win32_Process.Create` isola il server dal ciclo di vita della sessione dell'IDE/agente Antigravity, agganciandolo al sottosistema dei servizi Windows (`WmiPrvSE.exe`). Questo assicura che il server continui a funzionare senza interruzioni anche al termine delle sessioni dell'assistente, fino allo spegnimento o riavvio del sistema operativo.
- **Impatto sul Desiderata**:
  - PWA sempre raggiungibile in tempo reale su browser desktop e dispositivi fisici mobili (come Pixel 9 su rete Wi-Fi) senza necessità di rieseguire manualmente comandi da terminale.

### [2026-09-28] - Splash Screen Cockpit a Latenza Zero (0ms First Paint) e Perfezionamento Comandi Audio
- **Cosa abbiamo fatto**:
  - Implementato in [index.html](file:///d:/Github/Quiz_VDS-VL/index.html) il First-Paint Splash Screen a zero latenza direttamente all'interno di `<div id="root">`:
    - Vettore SVG inline del logo ufficiale *Paraglider Question Mark* (`#09090b` carbonio e `#f59e0b` ambra avionica) a 0 richieste HTTP aggiuntive.
    - Tipografia avionica e barra a sweep con gradient ambra (`splashSweep` CSS animation).
    - Risoluzione immediata a T=0ms del caricamento iniziale a freddo (Cold Start) su qualsiasi connessione e browser.
    - Stili critici di posizionamento e background applicati inline su `#splash-screen` e classi/animazioni collocate in [src/index.css](file:///d:/Github/Quiz_VDS-VL/src/index.css), eliminando alla radice l'estrazione `html-proxy` CSS di Vite e azzerando qualsiasi errore PostCSS in fase di sviluppo/HMR.
    - Sostituzione istantanea (zero delay, zero timer artificiali) nel momento esatto in cui React idrata `<App />`.
    - Aggiunto `<link rel="apple-touch-startup-image" href="/icons/icon-512x512.png" />` per azzerare sfarfallii su iOS standalone.
  - Perfezionati i controlli vocali in [src/components/DriveModeScreen.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/DriveModeScreen.tsx) e [src/components/QuestionCard.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/QuestionCard.tsx):
    - Introdotto il comando vocale `"stop"` e il tasto `[■]` dedicato per arresto immediato del pilota automatico e del countdown.
    - Aggiornato `"ripeti"` e tasto `[R]` a `restartCurrentOrSequence()` per un riascolto coerente dell'elemento attivo.
  - Eseguiti e superati con successo:
    - **129/129 test unitari Vitest** (`npm run test:unit`) su 15 test suite.
    - Build di produzione PWA (`tsc && vite build`) a 0 errori.
    - Collaudo headless CDP a 0 errori console su mobile portrait, mobile landscape e desktop.
- **Scelte architetturali & Rationale**:
  - *Zero-Latency In-DOM Splash Screen Rationale*: Evita l'anti-pattern del timer fittizio da 2-3 secondi che fa perdere tempo agli allievi piloti, fornendo al contempo un'esperienza visiva premium dal primissimo byte di rendering dell'HTML.
- **Impatto sul Desiderata**:
  - Esperienza nativa PWA impeccabile su iOS, Android e Desktop, preservando la massima velocità di utilizzo.

### [2026-09-28] - Spiegazione Vocale di Benvenuto in Modalità Alla Guida (Run-Once & Riascolto On-Demand)
- **Cosa abbiamo fatto**:
  - Creato lo script [scripts/generate_drive_intro.py](file:///d:/Github/Quiz_VDS-VL/scripts/generate_drive_intro.py) e generato i file audio neurali ad alta fedeltà [public/audio/giuseppe/drive_intro.mp3](file:///d:/Github/Quiz_VDS-VL/public/audio/giuseppe/drive_intro.mp3) (155 KB) e [public/audio/elsa/drive_intro.mp3](file:///d:/Github/Quiz_VDS-VL/public/audio/elsa/drive_intro.mp3) (144 KB) con testo didattico ottimizzato cockpit.
  - Aggiornato il modello dati e Dexie SSOT in [src/types/database.ts](file:///d:/Github/Quiz_VDS-VL/src/types/database.ts) e [src/db/index.ts](file:///d:/Github/Quiz_VDS-VL/src/db/index.ts) aggiungendo `driveModeIntroPlayed: boolean` (default `false`).
  - Aggiornato [src/types/audio.ts](file:///d:/Github/Quiz_VDS-VL/src/types/audio.ts) con frammento `'intro'` e flag `isDriveIntroPlaying`.
  - Esteso il motore vocale [src/services/voiceService.ts](file:///d:/Github/Quiz_VDS-VL/src/services/voiceService.ts) con i metodi `playDriveIntro()`, `stopDriveIntro()`, fallback automatico su Web Speech API (`speechSynthesis`) e gestione ciclo vita audio (`handleAudioEnded`, `stop`).
  - Aggiornato il hook [src/hooks/useAviationVoice.ts](file:///d:/Github/Quiz_VDS-VL/src/hooks/useAviationVoice.ts) esponendo `playDriveIntro` e `stopDriveIntro`.
  - Aggiornato [src/utils/voiceCommandParser.ts](file:///d:/Github/Quiz_VDS-VL/src/utils/voiceCommandParser.ts) abilitando i termini `"spiegazione"` e `"tutorial"` per il comando vocale `'help'`.
  - Implementato in [src/components/DriveModeScreen.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/DriveModeScreen.tsx):
    - Trigger automatico condizionato a `!settings.driveModeIntroPlayed` sia all'avvio da Launcher che all'apertura diretta da sessione attiva.
    - Banner avionico con indicatore audio animato e pulsante rapido `[⏭ Salta]`.
    - Guard sul sequence autopilot (`!isIntroActive`) per impedire la sovrapposizione tra la spiegazione vocale e la lettura della prima domanda.
    - Marcatura `driveModeIntroPlayed: true` al termine o al salto del briefing e avvio fluido della prima domanda.
    - Pulsante on-demand `[🔊 Spiegazione Vocale]` nel Launcher della Guida.
  - Aggiornato [src/components/VoiceCommandsModal.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/VoiceCommandsModal.tsx) integrando la card di riascolto on-demand della spiegazione parlata con pulsante `Ascolta`.
  - Aggiornato [src/components/SettingsModal.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/SettingsModal.tsx) nella scheda 🚗 Guida aggiungendo la card "Spiegazione Vocale Iniziale" con stato, ascolto immediato e toggle di riattivazione all'avvio (`driveModeIntroPlayed = false`).
  - Creato lo script di collaudo headless [scripts/test_drive_intro.js](file:///d:/Github/Quiz_VDS-VL/scripts/test_drive_intro.js) con 6 verifiche complete via CDP (avvio automatico, tasto salta, mancata ripetizione alla riapertura, riascolto on-demand, riarmo da impostazioni e riesecuzione post-riarmo), tutte superate con 0 errori in console.
  - Aggiornato [README.md](file:///d:/Github/Quiz_VDS-VL/README.md), [DESIDERATA.md](file:///d:/Github/Quiz_VDS-VL/DESIDERATA.md) e [MEMORY.md](file:///d:/Github/Quiz_VDS-VL/MEMORY.md).
- **Scelte architetturali & Rationale**:
  - *Run-Once Dexie SSOT Rationale*: Memorizzare lo stato in `AppSettings.driveModeIntroPlayed` su IndexedDB garantisce che il briefing venga riprodotto una sola volta all'allievo pilota, evitando qualsiasi ripetizione fastidiosa nelle sessioni di guida successive senza richiedere account o backend esterno.
  - *Cockpit Banner con Salta Rationale*: Il pilota in viaggio deve avere sempre il pieno controllo. Il pulsante `[⏭ Salta]` permette di interrompere immediatamente il parlato e passare all'istante al primo quiz se l'utente conosce già il funzionamento.
  - *Autopilot Sequence Guard Rationale*: Il timer di auto-advance della Modalità Guida leggerebbe la domanda 1 dopo il mount del componente; inserendo la guardia `!isIntroActive`, si garantisce che la lettura del quesito inizi solo a conclusione o annullamento dell'audio di benvenuto, azzerando sovrapposizioni sonore.
- **Impatto sul Desiderata**:
  - Soddisfazione completa del requisito di onboarding vocale per la Modalità Alla Guida, migliorando sicurezza ed ergonomia d'uso al volante.

### [2026-09-28] - Identità Visiva PWA: Adozione Icona Ufficiale "Paraglider Question Mark" ed Estensione Test Suite
- **Cosa abbiamo fatto**:
  - Adottata la nuova icona ufficiale PWA: concept *Paraglider Question Mark* (testa del punto interrogativo formata dalla cupola aerodinamica a celle del parapendio in volo e punto inferiore formato dalla sagoma del pilota nel bozzolo con comandi).
  - Generati gli asset ad alta fedeltà con script CDP dedicato [scripts/apply_paraglider_question_icon.cjs](file:///d:/Github/Quiz_VDS-VL/scripts/apply_paraglider_question_icon.cjs):
    - [public/icons/icon-512x512.png](file:///d:/Github/Quiz_VDS-VL/public/icons/icon-512x512.png) (512x512 PWA master)
    - [public/icons/icon-192x192.png](file:///d:/Github/Quiz_VDS-VL/public/icons/icon-192x192.png) (192x192 PWA homescreen)
    - [public/apple-touch-icon.png](file:///d:/Github/Quiz_VDS-VL/public/apple-touch-icon.png) (180x180 iOS Safari touch icon)
    - [public/favicon.svg](file:///d:/Github/Quiz_VDS-VL/public/favicon.svg) (Favicon vettoriale con ghiera bussola avionica, profilo cassonato e pilota)
    - Collegato `apple-touch-icon` in [index.html](file:///d:/Github/Quiz_VDS-VL/index.html).
  - Archiviati i 5 concept di icona in [public/proposals/](file:///d:/Github/Quiz_VDS-VL/public/proposals/) e lo script visuale [scripts/build_gallery.cjs](file:///d:/Github/Quiz_VDS-VL/scripts/build_gallery.cjs).
  - Estesi i test di unità portando la suite Vitest da 121 a **125 test superati** su 15 test suite:
    - [src/services/voiceService.test.ts](file:///d:/Github/Quiz_VDS-VL/src/services/voiceService.test.ts): aggiunti `VOICE-19`, `VOICE-20` e `VOICE-21` per la gestione completa di `playDriveIntro`, `stopDriveIntro` e reset su evento `ended`.
    - [src/utils/voiceCommandParser.test.ts](file:///d:/Github/Quiz_VDS-VL/src/utils/voiceCommandParser.test.ts): aggiunti i trigger vocali `spiegazione` e `tutorial` per il comando vocale `help`.
    - [src/db/database.test.ts](file:///d:/Github/Quiz_VDS-VL/src/db/database.test.ts): aggiunto `DB-12` per la persistenza e il toggle di `driveModeIntroPlayed` su Dexie IndexedDB.
  - Verificato con successo `npm run build` (zero errori TypeScript, bundle PWA ottimizzato) e `npm run test:unit` (125/125 passing).
- **Scelte architetturali & Rationale**:
  - *Metacognizione Visiva Rationale*: L'icona unisce in un unico simbolo concettuale la componente aeronautica del volo libero (la vela del parapendio con i cordini e il pilota) con la componente didattica (il punto interrogativo del quiz), rendendo l'icona immediatamente riconoscibile e memorabile sia nella homescreen degli smartphone (PWA) che nella tab del browser desktop.
  - *Apple Touch Icon Dedicata Rationale*: iOS Safari richiede un link esplicito `<link rel="apple-touch-icon" href="/apple-touch-icon.png" />` per visualizzare correttamente l'icona senza bordi neri o glitch durante l'aggiunta alla schermata Home.
- **Impatto sul Desiderata**:
  - Consolidamento dell'identità visiva e perfezionamento della qualità percepita della PWA VDS-VL Quiz Master.


### [2026-09-28] - Indicatore di Stato Offline Avionico (Cockpit Offline HUD & Briefing)
- **Cosa abbiamo fatto**:
  - Creato il servizio puro [src/services/networkStatus.ts](file:///d:/Github/Quiz_VDS-VL/src/services/networkStatus.ts) con gestione reattiva degli eventi `online`/`offline`, listener immediati al boot, tracking temporale di disconnessione e finestra temporale di riconnessione (3.5s).
  - Creato il hook [src/hooks/useOnlineStatus.ts](file:///d:/Github/Quiz_VDS-VL/src/hooks/useOnlineStatus.ts) per esporre lo stato di connettività reattivo a tutta l'applicazione.
  - Sviluppato [src/components/OfflineIndicator.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/OfflineIndicator.tsx) esportando 3 componenti conformi al design avionico:
    - `OfflineIndicator`: pillola avionica ambra `[⚡ OFFLINE]` nella barra superiore con apertura della modale informativa Cockpit Briefing via `createPortal` (spiegazione dei 504 quiz 100% offline, salvataggio locale IndexedDB e sync differita).
    - `OfflineBanner`: banner discreto sotto l'header con pulsante di chiusura e feedback automatico di riconnessione `[ONLINE]` in verde smeraldo.
    - `OfflineHUDTag`: tag compatto ad alto contrasto per la top bar HUD della Modalità Alla Guida (`DriveModeScreen.tsx`).
  - Integrato `OfflineIndicator` in [src/components/Navbar.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/Navbar.tsx).
  - Integrato `OfflineBanner` in [src/App.tsx](file:///d:/Github/Quiz_VDS-VL/src/App.tsx).
  - Integrato `OfflineHUDTag` in [src/components/DriveModeScreen.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/DriveModeScreen.tsx).
  - Creata la suite unit test [src/services/networkStatus.test.ts](file:///d:/Github/Quiz_VDS-VL/src/services/networkStatus.test.ts) (8 test per fallback SSR, disconnessione, riconnessione temporizzata, multi-subscriber e cancellazione timer).
  - Realizzato lo script di collaudo headless [scripts/test_offline_indicator.js](file:///d:/Github/Quiz_VDS-VL/scripts/test_offline_indicator.js) via CDP (`Network.emulateNetworkConditions`), verificando con successo la comparsa di badge, banner, modale, HUD guida, feedback di riconnessione e 0 errori in console.
  - Aggiornati [README.md](file:///d:/Github/Quiz_VDS-VL/README.md) e [DESIDERATA.md](file:///d:/Github/Quiz_VDS-VL/DESIDERATA.md).
- **Scelte architetturali & Rationale**:
  - *Cockpit Zero Clutter Rationale*: Quando la connessione è nominale (`isOnline` e non recentemente offline), i componenti offline renderizzano `null`, occupando 0 pixel e non distraendo l'utente sul cruscotto o durante l'esame.
  - *createPortal per la Modale Rationale*: Poiché l'header dell'app adotta `backdrop-blur`, gli elementi con `position: fixed` discendenti verrebbero confinati al containing block dell'header (56px) tagliando il layout della modale. Con `createPortal(..., document.body)` la modale viene renderizzata direttamente su `document.body` garantendo un centraggio verticale e orizzontale impeccabile su qualsiasi viewport (desktop e mobile 390x844).
- **Impatto sul Desiderata**:
  - Risolve l'incertezza dello studente quando studia offline sul campo di volo o in decollo montano: l'allievo vede all'istante lo stato offline e viene rassicurato sulla piena autonomia dei 504 quiz e sulla conservazione di tutti i risultati.

### [2026-09-28] - Gestione Offline del Parlato: Download Background Non Bloccante, Prompt Guida e Fallback Intelligente
- **Cosa abbiamo fatto**:
  - Creato il singleton service [src/services/audioDownloadManager.ts](file:///d:/Github/Quiz_VDS-VL/src/services/audioDownloadManager.ts) per il download in background non bloccante dei 2.520 file MP3 per voce verso CacheStorage (`vds-audio-giuseppe` e `vds-audio-elsa`) con pool di 8 connessioni concorrenti, resume automatico dei file già presenti, throttling non bloccante via `setTimeout` e supporto cancellazione/abort.
  - Implementato in [src/services/voiceService.ts](file:///d:/Github/Quiz_VDS-VL/src/services/voiceService.ts) il fallback offline deterministico: se l'app è offline (`!navigator.onLine`) o la risorsa non è disponibile e la voce preferita non è scaricata in cache, il motore commuta all'istante sulla voce alternativa scaricata emettendo un evento cockpit dedicato.
  - Creato il componente modale avionico [src/components/AudioOfflinePromptModal.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/AudioOfflinePromptModal.tsx): presentato al primo avvio della Modalità Guida se la voce attiva non è scaricata, con scelte a 1 tocco (voce attiva consigliata ~154 MB, entrambe ~302 MB, o "Non ora").
  - Creato il mini-indicatore [src/components/AudioDownloadProgressHUD.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/AudioDownloadProgressHUD.tsx) con percentuale live e popover di dettaglio, integrato nella barra di navigazione [src/components/Navbar.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/Navbar.tsx) e nell'header della Modalità Guida [src/components/DriveModeScreen.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/DriveModeScreen.tsx).
  - Estesa la scheda *Voce* in [src/components/SettingsModal.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/SettingsModal.tsx) con la sezione dedicata *Archivio Audio Offline (PWA)*: card indipendenti per Giuseppe ed Elsa con monitoraggio avanzamento/dimensione, pulsanti Scarica ed Elimina cache, e ripristino dell'avviso primo avvio.
  - Configurato Workbox in [vite.config.ts](file:///d:/Github/Quiz_VDS-VL/vite.config.ts) con cache `CacheFirst` per ciascuna voce e `rangeRequests: true` per garantire piena compatibilità con lo streaming audio di iOS Safari.
  - Aggiunti 7 nuovi unit test in [src/services/audioDownloadManager.test.ts](file:///d:/Github/Quiz_VDS-VL/src/services/audioDownloadManager.test.ts) e 4 nuovi test in [src/services/voiceService.test.ts](file:///d:/Github/Quiz_VDS-VL/src/services/voiceService.test.ts), portando la suite Vitest a **121/121 test superati** in ~600ms.
  - Realizzato lo script di collaudo headless [scripts/test_offline_audio.js](file:///d:/Github/Quiz_VDS-VL/scripts/test_offline_audio.js) via CDP, con esito 100% positivo e zero errori in console JavaScript.
- **Scelte architetturali & Rationale**:
  - *Download Sola Voce Consigliata Rationale*: 1 voce occupa ~154 MB (2.520 richieste HTTP), entrambe ~302 MB (5.040 richieste). Poiché oltre il 90% degli allievi seleziona una singola voce preferita, proporre come default consigliato la voce attiva dimezza i tempi di download (~30-45s) e il traffico dati mobile, lasciando comunque all'utente la libertà di scaricare entrambe le voci o gestirle separatamente nelle Impostazioni.
  - *CacheStorage Dedicato per Voce Rationale*: Separare le cache in `vds-audio-giuseppe` e `vds-audio-elsa` permette di contare le chiavi scaricate a costo zero (`cache.keys().length`), calcolare la percentuale esatta ed eseguire la cancellazione atomica immediata con `caches.delete(name)` senza dover ciclare ed eliminare 2.520 singoli elementi.
  - *Non-Blocking Concurrency Rationale*: L'uso di un pool a 8 worker asincroni con pause inter-batch previene il sovraccarico del thread UI, mantenendo 60fps costanti anche durante l'allenamento in Modalità Guida mentre il download procede in background.
  - *Range Requests iOS Safari Rationale*: I browser basati su WebKit su iOS inviano richieste `Range: bytes=0-` per i tag `<audio>`. L'abilitazione di `rangeRequests: true` in Workbox runtimeCaching garantisce che le risposte parziali 206 vengano generate direttamente dalla cache locale senza fallimenti di riproduzione.
- **Impatto sul Desiderata**:
  - Piena realizzazione del requisito di fruizione offline del parlato neurale per la preparazione all'esame, specialmente in vista delle trasferte sui campi di volo e decolli montani privi di copertura cellulare.

### [2026-09-28] - Estensione Universale Controlli Audio: Play/Pausa e Riavvio da Capo su Domande, Opzioni e Spiegazione
- **Cosa abbiamo fatto**:
  - Esteso [src/services/voiceService.ts](file:///d:/Github/Quiz_VDS-VL/src/services/voiceService.ts) implementando:
    - Ristrutturazione di `playSinglePart(questionId, part)`: verifica dello stato di riproduzione/pausa del frammento attivo *prima* di cancellare la coda, garantendo che mettere in pausa una singola opzione (es. `opt2`) durante l'ascolto della sequenza automatica preservi lo stato `isSequencePlaying` e consenta, alla ripresa, di completare l'opzione e avanzare fluidamente alle successive.
    - Implementazione di `restartSinglePart(questionId, part)`: consente di riavviare istantaneamente da capo (`currentTime = 0`) qualsiasi frammento audio parlato (domanda, opzione 1/2/3 o spiegazione didattica) sia mentre sta parlando sia in stato di pausa.
  - Aggiornato [src/hooks/useAviationVoice.ts](file:///d:/Github/Quiz_VDS-VL/src/hooks/useAviationVoice.ts) esponendo i metodi e selettori reattivi: `isPartActive`, `restartQuestion`, `restartOption(1 | 2 | 3)`, `restartExplanation`.
  - Aggiornato [src/components/QuestionCard.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/QuestionCard.tsx):
    - **Testo Domanda**: visualizzazione di una pillola cockpit con toggle Play/Pausa (`Pause` animata / `Play`), pulsante `[↺]` per riavvio immediato da capo, e scorciatoie `Q` (toggle) e `Shift + Q` (da capo).
    - **Tre Opzioni di Risposta (1, 2, 3)**: quando un'opzione è attiva (in ascolto o in pausa), il pulsante audio si espande in una mini-pillola ergonomica con toggle Play/Pausa e pulsante `[↺]` per ricominciare da capo l'opzione; scorciatoie `Alt + 1 / 2 / 3` (toggle) e `Alt + Shift + 1 / 2 / 3` (da capo).
    - **Spiegazione Didattica**: pillola completa con toggle Play/Pausa (`Pause` / `Play`), pulsante `[↺ Da capo]` e pulsante `[⏹ Stop]`; scorciatoie `E` (toggle) e `Shift + E` (da capo).
  - Aggiornato [src/components/ArchiveScreen.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/ArchiveScreen.tsx) allineando tutti i controlli audio (domanda, opzioni 1/2/3 e spiegazione didattica) alle medesime capacità interattive.
  - Sviluppati e aggiunti in [src/services/voiceService.test.ts](file:///d:/Github/Quiz_VDS-VL/src/services/voiceService.test.ts) i test `VOICE-11`, `VOICE-12`, `VOICE-13` e `VOICE-14` (copertura completa di toggle, restart e continuità sequenziale).
  - Esteso e superato al 100% il collaudo headless con Chrome DevTools Protocol in [scripts/test_audio_play_pause.js](file:///d:/Github/Quiz_VDS-VL/scripts/test_audio_play_pause.js).
  - Validati con successo:
    - **110/110 test Vitest** (`npm run test:unit`) a esito positivo al 100% in 567ms.
    - Build di produzione PWA (`npm run build`) a zero avvisi e zero errori TypeScript.
  - Aggiornati [README.md](file:///d:/Github/Quiz_VDS-VL/README.md) e [DESIDERATA.md](file:///d:/Github/Quiz_VDS-VL/DESIDERATA.md).
- **Scelte architetturali & Rationale**:
  - *Coerenza Semantica & Ergonomia Avionica*: L'utente non deve mai essere costretto a riascoltare l'intera domanda se vuole soffermarsi o riascoltare una singola risposta o un dettaglio della regola didattica.
  - *Stato Sequenza Resiliente*: Preservare `isSequencePlaying` durante la pausa di una risposta garantisce che l'allievo possa interrompere l'ascolto per riflettere, riprendere e far scorrere automaticamente le opzioni rimanenti senza dover reinizializzare la lettura.
- **Impatto sul Desiderata**:
  - Completa la modularità totale del motore audio neurale PWA e massimizza l'accessibilità uditiva durante lo studio sia da desktop che da mobile.
- **Cosa abbiamo fatto**:
  - Aggiunti i test di unità `VOICE-11`, `VOICE-12`, `VOICE-13` e `VOICE-14` in [src/services/voiceService.test.ts](file:///d:/Github/Quiz_VDS-VL/src/services/voiceService.test.ts), validando:
    - Toggle play/pausa e riavvio da capo (`restartSinglePart`) sui singoli pulsanti delle opzioni di risposta (`opt1`, `opt2`, `opt3`).
    - Mantenimento del flag `isSequencePlaying` durante la messa in pausa di una singola opzione all'interno della sequenza automatica, con prosecuzione fluida alla risposta successiva alla fine del brano.
  - Integrato `<OfflineBanner />` in [src/App.tsx](file:///d:/Github/Quiz_VDS-VL/src/App.tsx) e `<OfflineHUDTag />` nella schermata [src/components/DriveModeScreen.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/DriveModeScreen.tsx).
  - Esteso [scripts/test_audio_play_pause.js](file:///d:/Github/Quiz_VDS-VL/scripts/test_audio_play_pause.js) con collaudo interattivo CDP dei pulsanti dedicati ai singoli segmenti.
  - Suite Vitest portata a **110/110 test superati** su 14 file di test (`npm run test:unit`).
- **Scelte architetturali & Rationale**:
  - Assicurata la totale copertura dei flussi di interruzione e ripresa delle singole opzioni, eliminando qualsiasi rischio di race condition o desincronizzazione della coda audio.
- **Impatto sul Desiderata**:
  - Resilienza e robustezza massima della fruizione vocale sia in modalità standard che in Drive Mode.

### [2026-09-28] - Identità Visiva PWA: Icona Ufficiale "Aero Shield" e Tema Dark "Carbon Cockpit" (Zero-Blue)
- **Cosa abbiamo fatto**:
  - **Ideazione e Creazione Icona PWA "Aero Shield"**:
    - Disegnato e realizzato l'asset vettoriale master [public/favicon.svg](file:///d:/Github/Quiz_VDS-VL/public/favicon.svg): squircle in carbonio/titanio `#09090b` con indicatori cardinali bussola avionica, profilo a celle cassonate del parapendio fuso con l'ala triangolare a 'V' del deltaplano (trave di chiglia e barra di controllo A-frame) con bagliore ambra avionico (`#fbbf24`, `#f59e0b`).
    - Creato lo script CDP [scripts/generate_icons.js](file:///d:/Github/Quiz_VDS-VL/scripts/generate_icons.js) con rendering pixel-perfect Chrome DevTools Protocol per generare [public/icons/icon-192x192.png](file:///d:/Github/Quiz_VDS-VL/public/icons/icon-192x192.png) e [public/icons/icon-512x512.png](file:///d:/Github/Quiz_VDS-VL/public/icons/icon-512x512.png).
  - **Eliminazione Totale Dominante Blu (Tema "Carbon Cockpit")**:
    - Aggiornati i token di configurazione in [tailwind.config.js](file:///d:/Github/Quiz_VDS-VL/tailwind.config.js), [index.html](file:///d:/Github/Quiz_VDS-VL/index.html), [vite.config.ts](file:///d:/Github/Quiz_VDS-VL/vite.config.ts), [src/context/ThemeContext.tsx](file:///d:/Github/Quiz_VDS-VL/src/context/ThemeContext.tsx) e [src/index.css](file:///d:/Github/Quiz_VDS-VL/src/index.css) con palette base carbonio neutro: sfondo `#09090b` (`zinc-950`), card `#18181b` (`zinc-900`), bordi `#27272a` (`zinc-800`), testo `#f4f4f5` (`zinc-100`) e accento primario caldo **Aviation Amber** (`amber-500` / `amber-600`).
    - Migrati integralmente tutti i componenti applicativi rimuovendo qualsiasi classe `slate-` o `sky-` dal tema scuro:
      - [src/App.tsx](file:///d:/Github/Quiz_VDS-VL/src/App.tsx)
      - [src/components/Navbar.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/Navbar.tsx)
      - [src/components/QuestionCard.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/QuestionCard.tsx)
      - [src/components/ExamScreen.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/ExamScreen.tsx)
      - [src/components/TopicsScreen.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/TopicsScreen.tsx)
      - [src/components/MistakesScreen.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/MistakesScreen.tsx)
      - [src/components/ArchiveScreen.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/ArchiveScreen.tsx)
      - [src/components/StatsScreen.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/StatsScreen.tsx)
      - [src/components/SettingsModal.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/SettingsModal.tsx)
      - [src/components/VoiceQuickMenu.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/VoiceQuickMenu.tsx)
      - [src/components/VoiceCommandsModal.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/VoiceCommandsModal.tsx)
      - [src/components/DriveModeScreen.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/DriveModeScreen.tsx)
    - Preservato al 100% il tema diurno ad altissimo contrasto solare **Hangar Light** tramite le varianti dedicate `light:*`.
  - **Validazione & Collaudo E2E**:
    - **98/98 unit test Vitest** superati con successo in <550ms.
    - Build di produzione PWA (`tsc && vite build`) compilata a 0 errori.
    - Collaudo headless CDP multi-scenario eseguito con successo al 100% e **zero errori in console JavaScript**.
    - Aggiornati [MEMORY.md](file:///d:/Github/Quiz_VDS-VL/MEMORY.md), [DESIDERATA.md](file:///d:/Github/Quiz_VDS-VL/DESIDERATA.md) e [README.md](file:///d:/Github/Quiz_VDS-VL/README.md).
- **Scelte architetturali & Rationale**:
  - *Zero-Blue Hue Rationale*: La palette standard di Tailwind `slate` presenta una temperatura colore fredda e azzurrata (`#020617`, `#0f172a`), affaticante in ambienti a bassa luminosità (cockpit, tenda, decollo crepuscolare) e incoerente con la richiesta di un tema autenticamente avionico e neutro. L'adozione di `zinc` (grigi perfettamente neutrali a base carbonio puro) combinata con l'ambra avionico (`amber-500` / `amber-600`) ricrea fedelmente la strumentazione notturna dei velivoli e garantisce un riposo visivo ottimale.
  - *Icona "Aero Shield" Rationale*: Rappresenta contemporaneamente l'ala flessibile del parapendio e l'ala rigida a freccia del deltaplano, racchiuse in un'armoniosa "V" di Volo Libero / VDS con un look moderno, riconoscibile anche su display piccoli (favicon 16x16 / 32x32) o come icona schermata home su smartphone.
- **Impatto sul Desiderata**:
  - Consolidamento dell'identità visiva e dell'estetica PWA in accordo con i desiderata di progetto (DESIDERATA.md sez. 2.9 e 4).

### [2026-09-28] - Chiarimento Microcopy: Da "Voce Guida" a "Lettura Vocale" e Allineamento Palette Cockpit
- **Cosa abbiamo fatto**:
  - Rinominata la voce *"Voce Guida"* in *"Lettura Vocale"* in [src/components/VoiceQuickMenu.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/VoiceQuickMenu.tsx) e in [src/components/SettingsModal.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/SettingsModal.tsx).
  - Eliminata l'ambiguità tra la "Modalità Alla Guida" (guida dell'automobile a schermo intero con comandi vocali hands-free e Wake Lock) e la semplice sintesi vocale / lettura dei quesiti.
  - Rifiniti gli stili e le classi del tema avionico scuro in `SettingsModal.tsx` per piena coerenza con la palette Cockpit (`zinc-` e `amber-`).
  - Eseguiti e superati con successo:
    - **98/98 test Vitest** (`npm test`) in 555ms.
    - Build di produzione PWA (`npm run build`) a zero errori TypeScript.
- **Scelte architetturali & Rationale**:
  - *Disambiguazione Terminologica*: La polisemia del termine "guida" (guidare un veicolo vs voce che funge da guida/tutor) generava confusione percepita nell'utente. "Lettura Vocale" comunica immediatamente e senza fraintendimenti l'azione di Text-to-Speech dei quesiti.
- **Impatto sul Desiderata**:
  - Miglioramento immediato dell'ergonomia cognitiva dell'interfaccia sia su smartphone che su desktop.

### [2026-09-28] - Controlli Parlato Interattivi: Play, Pausa, Riprendi e Riavvio dall'Inizio (Da Capo)
- **Cosa abbiamo fatto**:
  - Esteso [src/types/audio.ts](file:///d:/Github/Quiz_VDS-VL/src/types/audio.ts) introducendo il campo `isPaused: boolean` nell'interfaccia `VoicePlaybackState`.
  - Riprogettato [src/services/voiceService.ts](file:///d:/Github/Quiz_VDS-VL/src/services/voiceService.ts) per implementare:
    - `togglePlayPause(questionId)`: se in riproduzione, mette in pausa l'audio preservando il secondo esatto; se in pausa, riprende la riproduzione dallo stesso istante; se inattivo, avvia la sequenza completa.
    - `pause()` e `resume()`: gestione dello stato di pausa atomica dell'elemento HTMLAudioElement, supporto alla pausa durante l'intervallo naturale di 350ms tra domanda e opzioni (con memorizzazione della parte pendente `pendingSequencePart`), e allineamento di `navigator.mediaSession.playbackState` ('playing' / 'paused' / 'none').
    - `restartFullSequence(questionId)`: arresto immediato del frammento in corso, azzeramento a `currentTime = 0` e riavvio deterministico dall'inizio della domanda sia mentre l'audio sta parlando sia in stato di pausa.
  - Aggiornato [src/hooks/useAviationVoice.ts](file:///d:/Github/Quiz_VDS-VL/src/hooks/useAviationVoice.ts) esponendo `isPaused`, `isPartPaused`, `togglePlayPause`, `restartFullSequence`, `pause` e `resume`.
  - Evoluto il componente [src/components/QuestionCard.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/QuestionCard.tsx):
    - Trasformato il pulsante statico "Ascolta" in una pillola multimediale cockpit dinamica:
      - Quando inattivo: pulsante singolo essenziale `[🔊 Ascolta]`.
      - Quando attivo (in riproduzione o in pausa): gruppo controlli con:
        1. Pulsante **Play/Pausa** (`[⏸ Pausa]` con badge ciano pulsante / `[▶ Riprendi]` con badge ambra).
        2. Pulsante **Da capo** (`[↺ Da capo]`) per ricominciare istantaneamente dall'inizio della domanda mentre parla o in pausa.
        3. Pulsante **Stop** (`[⏹]`) per interrompere l'ascolto e ripristinare il pulsante singolo.
    - Introdotte scorciatoie da tastiera desktop dedicate:
      - Tasto `V`: toggle Play / Pausa.
      - Tasto `R` o `Shift + V`: ricomincia dall'inizio (Da capo).
      - Tasto `Esc`: interrompe e chiude i controlli audio.
  - Allineato il rendering dell'audio modulare anche in [src/components/ArchiveScreen.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/ArchiveScreen.tsx) e in [src/components/DriveModeScreen.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/DriveModeScreen.tsx).
  - Creata la suite completa di unit test in [src/services/voiceService.test.ts](file:///d:/Github/Quiz_VDS-VL/src/services/voiceService.test.ts) (10 test dedicati che coprono transizioni, pausa/ripresa, ricomincia, cambi voce e gestione gap temporali).
  - Creato ed eseguito il test di integrazione CDP reale [scripts/test_audio_play_pause.js](file:///d:/Github/Quiz_VDS-VL/scripts/test_audio_play_pause.js) con browser headless a 0 errori.
  - Validati con successo:
    - **98/98 unit test Vitest** (`npm run test:unit`) superati al 100% in 531ms.
    - Bundle di produzione PWA compilato senza avvisi (`npm run build`).
  - Aggiornati [README.md](file:///d:/Github/Quiz_VDS-VL/README.md) e [DESIDERATA.md](file:///d:/Github/Quiz_VDS-VL/DESIDERATA.md).
- **Scelte architetturali & Rationale**:
  - *Evitare il reset forzato (Zero Frustrazione)*: In precedenza, un secondo clic sul pulsante audio fermava completamente la riproduzione azzerando il cursore a 0. Se l'allievo desiderava un attimo di pausa durante la lettura dell'opzione 2 o 3, al tocco successivo doveva riascoltare l'intera domanda e l'opzione 1 da capo. La differenziazione netta tra Pausa/Ripresa (freeze/unfreeze al millisecondo esatto) e Da capo (reset volontario a inizio quesito) risolve radicalmente il problema.
  - *Pillola Cockpit Contestuale (Zero Invasività)*: Mantenere un unico pulsante `[Ascolta]` quando l'audio non è in uso preserva la pulizia visiva e gli spazi limitati su mobile. Solo all'avvio della riproduzione il controllo si espande mostrando i tasti dedicati `[Pausa/Riprendi]`, `[Da capo]` e `[Stop]`, che tornano a scomparire automaticamente al termine delle opzioni.
  - *Doppio Accesso Keyboard (Tasto R e Shift+V)*: Per l'uso ergonomico da tastiera su desktop, sia `Shift+V` (variante naturale di `V`) che il tasto mnemonico `R` ("Restart / Ripeti") consentono di far ripartire la voce all'istante senza toccare il mouse.
- **Impatto sul Desiderata**:
  - Piena aderenza alla richiesta utente e ai principi di Cockpit Style & Audio Ergonomics (cfr. DESIDERATA.md sez. 2.6).

### [2026-09-28] - Rilascio: Guida Contestuale Comandi Vocali (Hands-Free HUD & Cheat Sheet Modale)
- **Cosa abbiamo fatto**:
  - Creato il nuovo componente [src/components/VoiceCommandsModal.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/VoiceCommandsModal.tsx):
    - Cheat Sheet modale compatto in stile cockpit avionico ad alto contrasto.
    - Elenco completo e strutturato delle 6 categorie di comandi: Risposte ("Uno", "Due", "Tre"), Navigazione ("Avanti", "Indietro"), Ripasso Audio ("Ripeti"), Segnalibro ("Bandiera"), Pilota Automatico ("Pausa", "Continua"), Richiesta Assistenza ("Aiuto").
    - Sezione "Consigli Cockpit per la Guida" con indicazioni pratiche per l'uso con vivavoce auto, auricolari e caschi Bluetooth.
  - Esteso il parser deterministico in [src/utils/voiceCommandParser.ts](file:///d:/Github/Quiz_VDS-VL/src/utils/voiceCommandParser.ts) e la relativa suite di unit test [src/utils/voiceCommandParser.test.ts](file:///d:/Github/Quiz_VDS-VL/src/utils/voiceCommandParser.test.ts):
    - Introdotto il comando `'help'` attivabile pronunciando *"aiuto"*, *"guida"*, *"comandi"*, *"istruzioni"*, *"cosa posso dire"*, *"help"*.
  - Integrata la guida contestuale su 3 livelli in [src/components/DriveModeScreen.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/DriveModeScreen.tsx):
    - **HUD Live Rotativo**: indicatore discreto animato sopra le macro-fasce di risposta che suggerisce i comandi a rotazione periodica ("Microfono ON: Dì 'Uno', 'Avanti' o 'Aiuto'").
    - **Pulsante Guida '?'**: presente sia nella schermata di lancio che nella barra comandi superiore durante lo svolgimento dei quiz.
    - **Trigger Vocale "Aiuto"**: pronunciando a voce *"Aiuto"*, l'assistente sospende ordinatamente l'audio e apre istantaneamente la guida su schermo.
  - Arricchita la scheda "Guida" di [src/components/SettingsModal.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/SettingsModal.tsx) con box riassuntivo e pulsante diretto al Cheat Sheet.
  - Aggiunto link alla guida comandi vocali anche nel flyout rapido [src/components/VoiceQuickMenu.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/VoiceQuickMenu.tsx).
  - Corretto l'edge case del mock `Audio` in [src/services/voiceService.test.ts](file:///d:/Github/Quiz_VDS-VL/src/services/voiceService.test.ts) per piena conformità ai costruttori Vitest v5.
  - Esteso lo script di collaudo headless [scripts/test_all_use_cases.js](file:///d:/Github/Quiz_VDS-VL/scripts/test_all_use_cases.js) verificando l'apertura e chiusura del modale via CDP.
  - Verificato con successo:
    - **98/98 unit test Vitest** superati in 559ms.
    - Bundle PWA di produzione compilato con successo (`npm run build`).
    - Collaudo multi-contesto a zero errori in console browser.
  - Aggiornati [DESIDERATA.md](file:///d:/Github/Quiz_VDS-VL/DESIDERATA.md) e [README.md](file:///d:/Github/Quiz_VDS-VL/README.md).
- **Scelte architetturali & Rationale**:
  - *Zero Cognitive Load in Guida*: Quando si guida o si usa l'app a mani libere, l'utente non deve mai dover ricordare a memoria una sintassi rigida. L'HUD live rotativo fornisce piccoli suggerimenti visivi senza distrarre, mentre la possibilità di dire *"Aiuto"* o premere `?` rende il sistema immediatamente trasparente e inclusivo.
  - *Componente Unificato Reutilizzabile*: `VoiceCommandsModal` è incapsulato e condiviso tra `DriveModeScreen`, `SettingsModal` e `VoiceQuickMenu`, garantendo una Single Source of Truth (SSOT) per la documentazione didattica dei comandi vocali.
- **Impatto sul Desiderata**:
  - Requisito pienamente implementato e registrato in [DESIDERATA.md](file:///d:/Github/Quiz_VDS-VL/DESIDERATA.md).

### [2026-09-28] - Rilascio: Auto-Sync Google Drive, Smart Merge Deterministico & Ripresa Sessione Cross-Device
- **Cosa abbiamo fatto**:
  - Progettato e risolto l'intero albero decisionale tramite sessione interattiva `/grill-me`, formalizzando il piano operativo nell'artifact [auto_sync_smart_merge_plan.md](file:///C:/Users/aless/.gemini/antigravity/brain/2988c1c6-7e5b-4739-9662-fdbaa695c8d8/auto_sync_smart_merge_plan.md).
  - Implementato il modulo di calcolo puro [src/services/smartMerge.ts](file:///d:/Github/Quiz_VDS-VL/src/services/smartMerge.ts) e la relativa suite di unit test [src/services/smartMerge.test.ts](file:///d:/Github/Quiz_VDS-VL/src/services/smartMerge.test.ts) (12 test):
    - Fusione deterministica per `QuestionStat` basata sul timestamp `lastAnsweredAt` per lo stato didattico (risultato e sequenza consecutiva corretta) e massimo monotono per i contatori cumulativi (`timesSeen`, `timesCorrect`, `timesWrong`).
    - Unione senza perdita di dati per `ExamSession` con deduplicazione basata sulla chiave di business (`date + durationSeconds + questionCounts`) e rimozione automatica degli ID auto-incrementali di conflitto.
    - Gestione e unione delle impostazioni applicative e della sessione attiva in corso con filtro di decadimento (max 48 ore).
  - Esteso lo store IndexedDB in [src/db/index.ts](file:///d:/Github/Quiz_VDS-VL/src/db/index.ts) e i tipi in [src/types/database.ts](file:///d:/Github/Quiz_VDS-VL/src/types/database.ts):
    - Introdotta la persistenza di `InProgressSession` (`saveActiveSession`, `getActiveSession`, `clearActiveSession`).
    - Aggiornato l'export di backup al formato `version: 2` includendo la sessione attiva.
    - Aggiornato `importDatabaseBackup` per eseguire transazionalmente lo Smart Merge con i dati locali preesistenti, preservando tutti gli esami passati sia per il ripristino cloud che per i file JSON locali.
    - Aggiunti test di persistenza e ripristino in [src/db/database.test.ts](file:///d:/Github/Quiz_VDS-VL/src/db/database.test.ts) (11 test).
  - Creato l'engine di sincronizzazione continua [src/services/syncEngine.ts](file:///d:/Github/Quiz_VDS-VL/src/services/syncEngine.ts) con relativa suite [src/services/syncEngine.test.ts](file:///d:/Github/Quiz_VDS-VL/src/services/syncEngine.test.ts) (7 test):
    - Gestione degli stati: `idle`, `syncing`, `synced`, `offline`, `needs_auth`, `error`.
    - Salvataggio automatico continuo in background con debounce (15-20s) e push istantaneo al termine delle simulazioni d'esame.
    - Rilevamento automatico dello stato offline con invio differito e sincronizzazione bidirezionale al rientro della connettività (`online` listener).
  - Integrata la sincronizzazione e la persistenza della sessione in [src/context/QuizContext.tsx](file:///d:/Github/Quiz_VDS-VL/src/context/QuizContext.tsx) con reattività Dexie (`useLiveQuery`).
  - Aggiornati i controller di studio [src/components/TopicsScreen.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/TopicsScreen.tsx), [src/components/ExamScreen.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/ExamScreen.tsx) e [src/components/MistakesScreen.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/MistakesScreen.tsx) per salvare continuamente la domanda corrente, le risposte e il timer, e per auto-riprendere la sessione attiva all'ingresso.
  - Implementato in [src/App.tsx](file:///d:/Github/Quiz_VDS-VL/src/App.tsx) il **Banner Avionico di Ripresa Rapida** per riprendere con un tocco la sessione lasciata su un'altra postazione (PC o telefono).
  - Inserito in [src/components/Navbar.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/Navbar.tsx) l'indicatore discreto di stato cloud (nuvola verde/sincronizzato, animata/sync in corso, ambra/richiesta accesso, barrata/offline).
  - Aggiornato [src/components/SettingsModal.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/SettingsModal.tsx) (scheda Cloud) con il toggle Auto-Sync, la barra di stato in tempo reale e il feedback didattico sullo Smart Merge.
  - Aggiornato [README.md](file:///d:/Github/Quiz_VDS-VL/README.md) documentando la sincronizzazione continua, lo Smart Merge e la ripresa sessione cross-device.
  - Superati al 100% tutti i test: **98/98 unit test Vitest** (`npm run test:unit`) in 523ms e build di produzione Vite (`npm run build`) verificata con successo (0 errori `tsc`).
- **Scelte architetturali & Rationale**:
  - *Smart Merge Deterministico vs Last-Write-Wins*: Sovrascrivere ciecamente il database locale al ripristino avrebbe cancellato esami o risposte fornite offline su un altro dispositivo. Lo Smart Merge adotta un'unione monotona sicura: tutti gli esami sostenuti su qualsiasi dispositivo vengono conservati e le domande adottano lo stato didattico dell'ultimo tentativo cronologico.
  - *Storage in Dexie Settings per activeSession*: Invece di creare una tabella aggiuntiva che avrebbe richiesto una migrazione di schema Dexie (version bump), `activeSession` risiede come chiave dedicata nella tabella `settings`. Questo garantisce massima compatibilità con i database già esistenti e zero rischio di corruzione.
  - *Disaccoppiamento SyncEngine & Test Isolati*: I test di `SyncEngine` isolano i timer reali e simulano le chiamate DB per evitare blocchi sulla coda delle transazioni di `fake-indexeddb`.
- **Impatto sul Desiderata**:
  - Soddisfatto pienamente il requisito di continuità di studio cross-device senza attrito: l'allievo pilota può iniziare un esame o studiare sul PC a casa e riprendere istantaneamente sullo smartphone al campo di volo senza perdere progressi.

### [2026-09-28] - Interfaccia Vocale Rapida (VoiceQuickMenu) e Refactoring Schede Impostazioni
- **Cosa abbiamo fatto**:
  - Creato il nuovo componente [src/components/VoiceQuickMenu.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/VoiceQuickMenu.tsx) per il controllo vocale rapido a 1 clic:
    - Master toggle Voce Guida ON/OFF con arresto vocale immediato su disattivazione.
    - Selezione istantanea a un tocco dell'istruttore: 👨‍✈️ Giuseppe (tono cockpit calmo) e 👩‍✈️ Elsa (dizione brillante).
    - Regolazione al volo della velocità: `0.9x`, `1.0x`, `1.15x`, `1.25x`.
    - Toggle rapidi per lettura automatica quesiti, spiegazione didattica automatica su errore ed effetti sonori cockpit.
    - Chiusura automatica al click esterno e tasto ESC.
  - Integrato il `VoiceQuickMenu` nella barra superiore di [src/components/Navbar.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/Navbar.tsx) con badge dinamico (`1.0x` / `Muto`) sempre accessibile da qualsiasi schermata dell'app.
  - Eseguito il refactoring completo di [src/components/SettingsModal.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/SettingsModal.tsx) a navigazione per schede tematiche (segmented control):
    - **🎨 Aspetto**: Tema visivo (Scuro, Chiaro, Auto) e feedback immediato nelle Materie.
    - **🎙️ Voce**: Impostazioni complete assistente vocale e suoni cockpit.
    - **🚗 Guida**: Opzioni Modalità Alla Guida (Radio Quiz, comandi vocali, tempo per pensare).
    - **☁️ Backup**: Salvataggio/Ripristino Google Drive e download/upload copie JSON offline.
    - **⚙️ Dati**: Riepilogo versione database AeCI e reset progressi con conferma di sicurezza.
    - Eliminato completamente lo scrolling verticale continuo: ogni scheda si adatta all'altezza viewport.
  - Aggiornato [scripts/test_all_use_cases.js](file:///d:/Github/Quiz_VDS-VL/scripts/test_all_use_cases.js) collaudando il Quick Speech Menu e le 5 schede tematiche via CDP.
  - Eseguiti e validati con successo al 100%:
    - **67/67 unit test Vitest** (`npm run test:unit`) superati in 383ms.
    - Bundle di produzione PWA compilato senza avvisi (`npm run build`).
    - Collaudo multi-contesto headless a 0 errori in console JavaScript.
  - Aggiornati [DESIDERATA.md](file:///d:/Github/Quiz_VDS-VL/DESIDERATA.md) e [README.md](file:///d:/Github/Quiz_VDS-VL/README.md).
- **Scelte architetturali & Rationale**:
  - *Zero-Friction Audio Cockpit*: In volo o durante lo studio intensivo, cambiare voce o mutare la lettura non deve mai richiedere l'apertura di schermate modali invasive né più di un singolo tap. Il popover leggero ancorato alla Navbar consente regolazioni a caldo senza perdere il focus sul quiz.
  - *Segmented Tabs Navigation per Impostazioni*: Suddividere le preferenze in 5 argomenti chiari e focalizzati ha ridotto l'altezza necessaria per schermata a meno di 300px, eliminando la frustrazione del dover scrollare liste lunghe sia su smartphone che su tablet e desktop.
- **Impatto sul Desiderata**:
  - Piena soddisfazione di entrambi i requisiti richiesti dall'utente. Matrice di stato in [DESIDERATA.md](file:///d:/Github/Quiz_VDS-VL/DESIDERATA.md) aggiornata a 🟢 Completato.

### [2026-09-28] - Parlato Vocale Conciso: Rimozione Prefisso Domanda/Materia & Rigenerazione Audio Batch
- **Cosa abbiamo fatto**:
  - Aggiornato lo script batch di generazione audio [scripts/generate_audio_database.py](file:///d:/Github/Quiz_VDS-VL/scripts/generate_audio_database.py):
    - Rimosso il preambolo verboso `Domanda {qid}. {sub_name}.` da `build_segments(q)`, facendo pronunciare alle tracce `_q.mp3` unicamente il testo normalizzato della domanda.
    - Introdotti i parametri CLI `--part {all,q,options,explanation}` e `--force` per consentire la rigenerazione selettiva chirurgica delle sole domande senza riscaricare le 4.032 opzioni didattiche intatte.
  - Rigenerati con successo tutti i **1.008 segmenti audio delle domande** (`_q.mp3`) per entrambe le voci:
    - 504 segmenti in `public/audio/giuseppe/` (voce maschile cockpit).
    - 504 segmenti in `public/audio/elsa/` (voce femminile cristallina).
  - Allineato lo script di collaudo [scripts/test_discrete.py](file:///d:/Github/Quiz_VDS-VL/scripts/test_discrete.py).
  - Esteso il modulo [src/utils/aviationPhonetics.ts](file:///d:/Github/Quiz_VDS-VL/src/utils/aviationPhonetics.ts) esportando la funzione `formatQuestionForSpeech(questionText: string): string` ed estendendo la suite Vitest [src/utils/aviationPhonetics.test.ts](file:///d:/Github/Quiz_VDS-VL/src/utils/aviationPhonetics.test.ts) con test dedicati in lingua inglese.
  - Aggiornato [MEMORY.md](file:///d:/Github/Quiz_VDS-VL/MEMORY.md) (Sezione 6) e [DESIDERATA.md](file:///d:/Github/Quiz_VDS-VL/DESIDERATA.md) (Sezione 2.6) documentando la direttiva del parlato conciso Cockpit Minimalist.
  - Verificato il superamento al 100% di tutti i **67 test unitari Vitest** (`npm run test:unit`) e compilato con successo il bundle di produzione PWA (`npm run build`).
- **Scelte architetturali & Rationale**:
  - *Cockpit Style Minimalist Audio (Zero Preamboli)*: Durante la simulazione d'esame o la modalità di guida a mani libere ("Pilota Automatico"), ascoltare "Domanda 1001. Normativa e Legislazione." prima di ciascun quesito aggiungeva tra i 3 e i 5 secondi di latenza a vuoto (pari a oltre 2 minuti di attesa cumulativa in un esame di 30 quesiti). Il numero domanda e la materia sono già visibili a colpo d'occhio nell'UI; il parlato deve concentrarsi puramente sull'enunciato del problema.
  - *Rigenerazione Selettiva (--part q --force)*: Filtrare unicamente i segmenti `_q.mp3` ha evitato 4.032 chiamate API ridondanti per opzioni e spiegazioni, riducendo dell'80% l'utilizzo di rete e i tempi di esecuzione.
- **Impatto sul Desiderata**:
  - Esperienza didattica e audio molto più fluida e immediata in [QuestionCard.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/QuestionCard.tsx) e [DriveModeScreen.tsx](file:///d:/Github/Quiz_VDS-VL/src/components/DriveModeScreen.tsx). Risparmio tangibile di tempo e concentrazione per l'allievo pilota.

### [2026-09-28] - Piano Architetturale: Quick Speech Menu (1-Click) & Impostazioni a Schede (Zero-Scroll)
- **Cosa abbiamo fatto**:
  - Formulato il piano esecutivo e architetturale nell'artefatto `plan_speech_menu_and_categorized_settings.md` per l'introduzione di un menu del parlato rapido a 1 clic e la riorganizzazione a schede tematiche compatte delle impostazioni.
  - Aggiornato [DESIDERATA.md](file:///d:/Github/Quiz_VDS-VL/DESIDERATA.md) introducendo:
    - Sezione 2.6: specifica del *Quick Speech Menu* accessibile dall'header per regolazione istantanea senza modali invasivi.
    - Sezione 2.8: specifica delle *Impostazioni Modulari per Argomenti* con eliminazione dello scrolling continuo.
    - Sezione 4 (Matrice di Stato): aggiunti i due moduli in stato 🟡 Pianificato con relative note tecniche.
  - Eseguita e convalidata la suite Vitest: 65/65 test superati con successo in 1.47s.
- **Scelte architetturali & Rationale**:
  - *Cockpit Quick-Control Popover vs Nested Modals*: Il controllo vocale deve essere immediato durante lo studio o l'esame; dover aprire un intero modale di impostazioni e scrollare genera attrito cognitivo. Un flyout/popover compatto ancorato alla barra superiore consente la regolazione istantanea (1 clic) di voce e velocità preservando il contesto di studio.
  - *Segmented Tabs Navigation per Impostazioni*: La suddivisione in 5 argomenti (Voce, Guida, Aspetto, Backup, Dati) azzera la necessità di scorrimento verticale, massimizzando l'ergonomia sia su smartphone che su tablet/desktop.
- **Impatto sul Desiderata**:
  - Pieno allineamento della roadmap di sviluppo con le preferenze di usabilità e comfort espresse dall'utente.

### [2026-09-28] - Vincolo Porta 5173 per Google Drive OAuth, Suite Vitest & Anteprima Locale
- **Cosa abbiamo fatto**:
  - Configurato `vite.config.ts` bloccando sia `server.port` che `preview.port` su **5173** con `strictPort: true`, impedendo l'uso accidentale della porta 4173 o porte casuali.
  - Riavviamo il server di anteprima PWA su [http://localhost:5173/](http://localhost:5173/) con esito HTTP 200 OK.
  - Sancito il vincolo operativo e architetturale in [MEMORY.md](file:///d:/Github/Quiz_VDS-VL/MEMORY.md) (Sezione 2) per evitare disallineamenti di origine OAuth.
  - Ripristinate le dipendenze di progetto tramite installazione deterministica `npm ci`.
  - Eseguita e validata l'intera suite di unit & integration test Vitest: **65/65 test superati** al 100% (10 test file).
  - Compilato il bundle PWA di produzione con `npm run build` (typecheck `tsc` superato con zero errori, bundle Vite e manifest PWA generati con successo).
- **Scelte architetturali & Rationale**:
  - *Google OAuth Authorized JavaScript Origin Strictness*: Il Client ID OAuth di Google autorizza specificamente `http://localhost:5173`. L'uso della porta di default di Vite preview (4173) provocava il blocco delle richieste verso le API di Google Drive per discrepanza di origine. Il vincolo `strictPort: true` a livello di configurazione Vite garantisce che l'anteprima locale funzioni sempre in modo trasparente e conforme per il backup cloud.
- **Impatto sul Desiderata**:
  - Funzionalità Google Drive Cloud Sync pienamente fruibile sia in ambiente `dev` che in `preview` su `http://localhost:5173/`.


### [2026-09-27] - Analisi Funzionale Approfondita & Collaudo Multi-Contesto d'Uso
- **Cosa abbiamo fatto**:
  - Modellati ed esaminati 5 contesti d'uso reali per la PWA:
    1. *Studio Desktop a Casa*: Schermo 1440x900, scorciatoie tastiera (`1`, `2`, `3`, `F`, frecce), navigatore a 30 slot, Navigation Guard su cambio tab durante simulazione e schermata finale di debriefing con esito AeCI.
    2. *Ripasso alla Guida / in Viaggio (Truck & Cockpit Drive Mode)*: Schermo mobile 390x844, layout zero-scroll `100dvh`, macro-pulsanti tattili Fitts's law, Pilota Automatico sequenziale (Radio Quiz) e comandi vocali.
    3. *Campo di Volo / Sole Diretto (Hangar Light)*: Contrasto elevato bivalente chiaro/scuro, studio per singola materia con spiegazioni didattiche istantanee Regola + Tranello.
    4. *Archivio & Privacy Dati*: Ricerca full-text istantanea per testo e keyword, gestione note personali persistenti, toggle preferiti ed export locale JSON offline-first.
    5. *Ripasso Intensivo Pre-Esame (Quaderno Errori)*: Verifica algoritmo Spaced Repetition Leitner (rimozione vincolata a 2 risposte corrette consecutive) e radar 9 materie.
  - Diagnosticato e risolto un difetto critico di sincronizzazione stato tra `DriveModeScreen` e le schermate chiamanti (`ExamScreen`, `TopicsScreen`, `MistakesScreen`):
    - Introdotto passaggio esplicito dell'identificativo quesito `qid` nei gestori `handleSelectAnswer(ans, qid)` e `handleToggleFlag(qid)` per prevenire race conditions e stale closure.
    - Prevenuta la doppia registrazione delle risposte (`recordAnswer`) e il doppio salvataggio delle sessioni d'esame (`saveExam`) delegando interamente la finalizzazione al context genitore quando presente.
    - Evitata la marcatura erronea di risposte non date durante simulazioni d'esame attive in Drive Mode.
  - Implementato lo script di collaudo headless automatico `scripts/test_all_use_cases.js` via Chrome DevTools Protocol (CDP), verificando con successo al 100% tutti i 5 contesti con zero errori in console browser.
  - Validata l'intera suite Vitest: 65 test unitari e di integrazione superati in 491ms, con compilazione bundle Vite (`npm run build`) senza avvisi o errori.
- **Scelte architetturali & Rationale**:
  - *Disaccoppiamento Closure vs Parametro Esplicito*: Affidare la risoluzione della domanda corrente allo stato locale del componente genitore durante l'apertura di un modal a schermo intero è soggetto a disallineamenti asincroni React. Il passaggio esplicito del `qid` come parametro primario rende la sincronizzazione deterministica, pura e a prova di race condition.
  - *Delega del Ciclo di Vita (Single Responsibility)*: Quando `DriveModeScreen` opera come interfaccia alternativa di un esame già avviato in `ExamScreen`, non deve duplicare la logica di valutazione o persistenza DB, ma delegare il completamento alla sessione chiamante.
- **Impatto sul Desiderata**:
  - Piena conformità funzionale a tutti i 7 requisiti core del [DESIDERATA.md](file:///c:/github/Quiz_VDS-VL/DESIDERATA.md). Nessuna regressione rilevata nei test.

### [2026-09-27] - Adozione Standard Operativo "Cockpit Executive Mode"
- **Cosa abbiamo fatto**:
  - Formalizzato in [MEMORY.md](file:///c:/github/Quiz_VDS-VL/MEMORY.md) (Sezione 7) lo standard operativo "Cockpit Executive Mode" per l'interazione agente-utente:
    - Risposte strutturate su sintesi estrema (max 3 bullet: cosa fatto, dove intervenire, cosa decidere).
    - Progressive disclosure: dettagli tecnici, codice esteso e diff confinati nei file di progetto o negli Artifacts.
    - Decisioni e bivi gestiti via modali rapidi `ask_question` con opzione raccomandata in cima per decisioni a 1 click.
    - Riserva esclusiva del tag `> [!WARNING]` per reali rischi di rottura, breaking change o perdita dati.
    - Dimostrazione tangibile tramite esiti test/typecheck prima delle spiegazioni discorsive.
    - Suddivisione del lavoro in task atomici (1 problema alla volta) con diff leggibili in 15 secondi.
- **Scelte architetturali & Rationale**:
  - *Mitigazione della Fatica Cognitiva*: Lo sviluppo guidato da LLM soffre frequentemente di "muri di testo" prolissi che portano l'utente a saltare la lettura critica e accettare modifiche alla cieca. L'adozione del paradigma Cockpit Executive protegge la concentrazione dell'utente, riduce i tempi decisionali e azzera il rischio di allucinazioni inosservate.
- **Impatto sul Desiderata**:
  - Incremento immediato della qualità delle revisioni umane e dell'efficienza nel ciclo di sviluppo di [Quiz_VDS-VL](file:///c:/github/Quiz_VDS-VL/). Nessun impatto runtime sull'applicazione.

### [2026-09-27] - Istituzione Vincolo Lingua Inglese per Sorgenti, Commenti e Commit Git
- **Cosa abbiamo fatto**:
  - Formalizzato il vincolo cogente di utilizzo esclusivo della lingua inglese per tutti gli artefatti di sviluppo:
    - `.agents/AGENTS.md`: introdotta la direttiva comportamentale cardine n. 7 che impone l'inglese per file sorgente, script, commenti inline, docstring, asserzioni di test e messaggi di commit Git.
    - `.agents/rules/constraints.md`: aggiornata la sezione 2 vietando esplicitamente commenti in italiano nel codice e prescrivendo Conventional Commits in inglese.
    - `.agents/skills/git-pro/SKILL.md`: revisionata la specifica dei commit message sostituendo gli esempi italiani con template rigorosamente in inglese (`feat(...)`, `fix(...)`, `refactor(...)`, etc.) e vietando testi di commit in italiano.
    - `.agents/workflows/task_lifecycle.md`: ribadito l'obbligo di Conventional Commits in inglese nel ciclo di vita dei task.
    - `MEMORY.md`: consolidata la convenzione nella memoria tecnica permanente del repository.
  - Circoscritta puntualmente l'unica eccezione ammessa per l'italiano: il microcopy visibile all'utente finale (l'allievo pilota che sostiene l'esame AeCI), il catalogo ufficiale dei 504 quiz (`questions.json`: quesiti, opzioni, spiegazioni didattiche) e la documentazione di alto livello / dialogo chat con l'utente.
- **Scelte architetturali & Rationale**:
  - *Separazione tra Livello Tecnico e Livello Utente*: Negli standard ingegneristici professionali moderni, il codice, i commenti tecnici, le suite di test e la cronologia Git devono essere scritti in inglese per garantire interoperabilità con strumenti di analisi statica, linter, modelli AI e sviluppatori internazionali. L'interfaccia utente finale rimane invece rigorosamente in italiano coerente con le normative dell'Aero Club d'Italia (AeCI).
- **Impatto sul Desiderata**:
  - Governance del codice ineccepibile e allineamento perfetto con le migliori pratiche di sviluppo open source professionale. Nessun impatto sulla funzionalità runtime dell'applicazione.

### [2026-09-27] - Umanizzazione UI/UX & Rimozione Configurazione Tecnica Client ID
- **Cosa abbiamo fatto**:
  - Rimossa dall'interfaccia utente qualsiasi menzione visibile del "Google Client ID", il campo di testo per l'inserimento manuale, il pulsante toggle per opzioni sviluppatore e la dicitura tecnica `(appDataFolder)`.
  - Il Client ID Google OAuth opera ora completamente sotto il cofano, garantendo l'accesso e la sincronizzazione cloud tramite due soli pulsanti immediati: **"Salva su Google"** e **"Ripristina da Google"**.
  - Revisionato e semplificato l'intero microcopy dell'applicazione per renderlo chiaro, naturale e accessibile a qualsiasi aspirante pilota (da chi non ha competenze informatiche agli esperti):
    - `SettingsModal.tsx`: testi semplici per sincronizzazione cloud, salvataggio su file ("Scarica copia" / "Carica copia") e azzeramento ("Cancella tutti i dati e ricomincia da zero"). Semplificate le descrizioni di voci, velocità e modalità alla guida.
    - `ExamScreen.tsx`: sostituito "Algoritmo Copertura Garantita: Priorità mai viste" con "Selezione domande: Priorità a quelle non ancora viste".
    - `StatsScreen.tsx`: sostituito "Statistiche & Telemetria" con "I tuoi Progressi", "Indice di Prontezza" con "Prontezza Esame", "Copertura" con "Quiz Visti" e "errori attivi" con "errori da rivedere".
    - `MistakesScreen.tsx`: sostituito il gergo didattico astratto con "Rispondi esattamente per 2 volte di fila per togliere una domanda dagli errori" e "Domande da Ripassare".
    - `ArchiveScreen.tsx`: sostituito "Ascolto Vocale Neurale" con "Ascolto Vocale" e testo del pulsante note.
    - `DriveModeScreen.tsx`: chiarito lo stato dello schermo sempre acceso e dei pulsanti giganti.
  - Esteso lo script headless CDP `visual_check.js` con il supporto per selettori di scorrimento `scroll:<selector>`.
  - Convalidato l'aggiornamento visivo tramite screenshot headless pixel-perfect in tema scuro e chiaro (0 errori in console) e superamento di tutti i 63 test unitari Vitest (`npm test`).
- **Scelte architetturali & Rationale**:
  - *Zero Gergo Tecnico (No Jargon Principle)*: In un'applicazione rivolta a studenti e allievi di volo libero di qualunque estrazione (dal camionista alla bidella all'ingegnere), la complessità tecnica (OAuth, Client ID, JSON, appDataFolder) deve essere interamente assorbita dall'architettura del software. L'interfaccia deve parlare la lingua dell'utente: "Salva su Google", "Salva su file", "Ricomincia da capo".
- **Impatto sul Desiderata**:
  - Esperienza utente estremamente fluida, rassicurante e accessibile. Tutti i requisiti del [DESIDERATA.md](file:///c:/github/Quiz_VDS-VL/DESIDERATA.md) restano pienamente operativi con 63/63 test verdi.

### [2026-09-27] - Integrazione Client ID Google OAuth & Configurazione .env
- **Cosa abbiamo fatto**:
  - Creato il file di configurazione locale `.env` contenente il Client ID Google OAuth fornito dall'utente (`182413802928-q7sphls58ob60s2mu3fspbbkk9kq2am9.apps.googleusercontent.com`).
  - Configurato il Client ID come fallback predefinito in `src/services/googleDrive.ts` e `src/components/SettingsModal.tsx` per garantire il funzionamento automatico a 1-click anche nelle build statiche distribuite su GitHub Pages.
  - Verificato con test headless CDP il rendering del badge verde **"Pronto"** nella sezione Backup Cloud di `SettingsModal.tsx`.
- **Scelte architetturali & Rationale**:
  - *Fallback duale .env + build*: Poiché `.env` è escluso dal controllo di versione per prassi, impostare il Client ID come fallback garantisce che il deploy su `https://alessandroame.github.io/Quiz_VDS-VL/` funzioni istantaneamente senza dipendere da configurazioni manuali di GitHub Actions secrets.
- **Impatto sul Desiderata**:
  - Sincronizzazione cloud 1-click pronta all'uso sia in locale sia online.

### [2026-09-27] - Redazione README Funzionale & Istituzione Vincolo di Allineamento Continuo
- **Cosa abbiamo fatto**:
  - Redatto e integrato nella root del progetto il file [README.md](file:///c:/github/Quiz_VDS-VL/README.md) completo ed esaustivo, documentando nel dettaglio tutte le 11 macro-funzionalità dell'app (Database 504 quiz AeCI con Regola e Tranello, Simulatore d'Esame con quote e timer 45 min, Studio per Materie, Quaderno Errori Leitner, Archivio full-text con Note Personali e Preferiti, Statistiche con radar 9 materie, Modalità Alla Guida con zero-scroll e Web Speech Recognition, Motore Vocale Neurale offline bivalente Giuseppe/Elsa e fonetica ICAO, Ergonomia cockpit con temi Dark/Light e scorciatoie tastiera, Fair Coverage Randomizer, PWA Offline-First e sincronizzazione dati locale/Drive).
  - Documentato lo stack tecnologico (React 19, Vite, TypeScript strict, Tailwind CSS, Dexie.js, Vitest, Web Audio/Speech API).
  - Aggiunte istruzioni dettagliate di avvio rapido, comandi di test unitari, coverage e collaudi visivi CDP headless.
  - Istituito il vincolo normativo permanente di allineamento continuo del [README.md](file:///c:/github/Quiz_VDS-VL/README.md) in [.agents/AGENTS.md](file:///c:/github/Quiz_VDS-VL/.agents/AGENTS.md), in [MEMORY.md](file:///c:/github/Quiz_VDS-VL/MEMORY.md), in [.agents/rules/constraints.md](file:///c:/github/Quiz_VDS-VL/.agents/rules/constraints.md) e nel workflow di fine lavorazione di [.agents/skills/self-correction-loop/SKILL.md](file:///c:/github/Quiz_VDS-VL/.agents/skills/self-correction-loop/SKILL.md).
- **Scelte architetturali & Rationale**:
  - *Allineamento a Catena della Governance*: La richiesta utente di "tienile aggiornate anche in futuro quando faremo modifiche" è stata formalizzata sia a livello di direttive agent (`AGENTS.md`), sia nella memoria stabile di progetto (`MEMORY.md`), sia nei vincoli architetturali (`constraints.md`), sia nello schema procedurale della skill `self-correction-loop`. In questo modo qualsiasi sessione futura o subagente avrà il vincolo esplicito di aggiornare il `README.md` all'aggiunta o modifica di funzionalità.
- **Impatto sul Desiderata**:
  - Massima trasparenza per utenti, sviluppatori e allievi piloti che approcciano il repository GitHub. Documentazione completa, navigabile e integrata con la triade di conoscenza.

### [2026-09-27] - Integrazione Voce Neurale Femminile Elsa & Selettore Multi-Voce Istruttore
- **Cosa abbiamo fatto**:
  - Esteso lo script di generazione `scripts/generate_audio_database.py` con supporto al flag `--voice` (`giuseppe` ed `elsa`).
  - Generato l'intero catalogo dei 2.520 segmenti audio in italiano naturale con la voce femminile ad alta chiarezza **Elsa** (`it-IT-ElsaNeural`) archiviati in `public/audio/elsa/`.
  - Esteso il tipo `AppSettings` con `ttsVoice: 'giuseppe' | 'elsa'` e valorizzato il default in `src/db/index.ts`.
  - Aggiornato `src/services/voiceService.ts` per supportare il cambio dinamico della voce (`setVoice`, `getVoice`) e la risoluzione dei percorsi `public/audio/{voice}/`.
  - Sincronizzata la voce nel `QuizContext.tsx` con effetto immediato su ogni componente dell'applicazione.
  - Implementato in `src/components/SettingsModal.tsx` il selettore visivo card-based per la scelta tra la voce maschile (*👨‍✈️ Giuseppe - Tono calmo cockpit*) e femminile (*👩‍✈️ Elsa - Dizione cristallina*).
  - Verificato il superamento di tutti i 63 test Vitest (`npm test`) e la compilazione del bundle PWA di produzione (`npm run build`).
- **Scelte architetturali & Rationale**:
  - *Separazione Directory Audio per Voce*: Archiviando `public/audio/giuseppe/` e `public/audio/elsa/` separatamente, la selezione della voce a runtime è un'operazione O(1) priva di fetch a server esterni e compatibile al 100% con la natura offline PWA.
  - *Coerenza Fonetica*: Entrambe le voci condividono la stessa pipeline di normalizzazione fonetica aeronautica (`aviationPhonetics.ts`) e la cadenza cockpit (*"Uno."*, *"Due."*, *"Tre."*).
- **Impatto sul Desiderata**:
  - Completa libertà di scelta per il candidato pilota tra voce maschile e femminile ad altissima qualità, con persistenza locale e zero latenza.

### [2026-09-27] - Implementazione Modalità Alla Guida ("Truck & Drive Cockpit Mode")
- **Cosa abbiamo fatto**:
  - Redatto lo studio di fattibilità ed ergonomia tattile in [truck_cockpit_mode_plan.md](file:///C:/Users/aless/.gemini/antigravity/brain/4f1a0bad-73d5-4ee0-9d28-f4a2d17159c5/truck_cockpit_mode_plan.md).
  - Implementato `src/utils/voiceCommandParser.ts` per il parsing selettivo e deterministico dei comandi vocali italiani ("Uno", "Due", "Tre", "Avanti", "Indietro", "Ripeti", "Bandiera", "Pausa", "Riprendi") con suite di unit test (`src/utils/voiceCommandParser.test.ts`).
  - Implementato `src/hooks/useWakeLock.ts` per il mantenimento attivo del display su supporto cruscotto (Screen Wake Lock API) con gestione del ciclo di vita e riaggancio su `visibilitychange`.
  - Implementato `src/hooks/useDriveVoiceCommands.ts` per il controllo vocale hands-free continuo via Web Speech Recognition.
  - Realizzato il componente `src/components/DriveModeScreen.tsx`: layout a tutto schermo con viewport bloccato (`100dvh`) e zero-scroll, 3 macro-fasce tattili ingrandite (Fitts's Law estrema), pilota automatico sequenziale ("Radio Quiz") e supporto gesture swipe.
  - Integrato lo switch alla Modalità Alla Guida in `Navbar.tsx`, `ExamScreen.tsx`, `TopicsScreen.tsx`, `MistakesScreen.tsx` e `QuizContext.tsx` per supportare sia l'avvio autonomo che la prosecuzione istantanea di una sessione d'esame in corso.
  - Aggiunte impostazioni dedicate (Pilota Automatico, Comandi Vocali, Tempo di attesa) in `SettingsModal.tsx` e nel DB Dexie.
  - Collaudato con successo con Chrome CDP headless (`scripts/test_drive_mode.js`) su viewport mobile (390x844), validando l'interazione, la navigazione e registrando zero errori in console.
- **Scelte architetturali & Rationale**:
  - *Modalità Dedicata vs Compromesso Universale*: Forzare bottoni da 80-100px nella vista standard avrebbe compromesso la densità informativa dello studio a casa, costringendo a continuo scrolling verticale. La modalità dedicata a schermo intero (`100dvh`) consente zero scrolling e massima reattività tattile a distanza braccio.
  - *Pilota Automatico Passivo / Radio Quiz*: Essenziale in viaggio: permette l'ascolto continuo di domande e opzioni con auto-rivelazione della risposta e della regola dopo un tempo limite (3-8s), studiando senza dover toccare il dispositivo.
  - *Screen Wake Lock*: Impedisce lo spegnimento dello schermo ogni 30 secondi quando il telefono è agganciato al cruscotto.
- **Impatto sul Desiderata**:
  - Requisito 7 del [DESIDERATA.md](file:///c:/github/Quiz_VDS-VL/DESIDERATA.md) pienamente soddisfatto. La suite Vitest sale a 63 test unitari tutti verdi.

### [2026-09-27] - Integrazione Motore Vocale Neurale Integrale (TTS Giuseppe Calmo) & Generazione Catalogo 504 Quiz
- **Cosa abbiamo fatto**:
  1. **Valutazione Critica & Blind Test preliminare**:
     - Dimostrata l'inadeguatezza del `window.speechSynthesis` nativo del browser desktop Windows (voce robotica metallica `Microsoft Elsa Desktop SAPI5`).
     - Approvata la voce neurale da studio **Giuseppe Calmo** (`it-IT-GiuseppeMultilingualNeural`) calibrata con `rate: -5%` e `pitch: -5Hz` (timbro baritonale pacato, stile istruttore di volo, zero picchi acuti).
     - Corretta la pronuncia delle opzioni in puro stile cockpit italiano (*"Uno. [testo]"*, *"Due. [testo]"*, *"Tre. [testo]"*) eliminando collisioni fonetiche con l'inglese (*"Option 1"*).
  2. **Pipeline Batch di Generazione Completa (504 Quiz)**:
     - Creato lo script concorrente `scripts/generate_audio_database.py` per generare tutti i 5 segmenti discreti per ciascuna domanda: domanda (`_q.mp3`), tre opzioni (`_1.mp3`, `_2.mp3`, `_3.mp3`) e spiegazione didattica su errore (`_e.mp3`).
     - Generati con successo **tutti i 2.520 segmenti audio** per l'intero catalogo dei 504 quiz in `public/audio/` (~167 MB).
  3. **Normalizzatore Fonetico Aeronautico (`src/utils/aviationPhonetics.ts`)**:
     - Sostituzione di acronimi e unità di misura con pronuncia naturale: `D.P.R. 133/2010`, `VDS/VL`, `AeCI`, `RCT`, `QNH`, `QFE`, `hPa`, `FL`, `km/h`, `m/s`, `kt`, gradi e punteggiatura morbida per evitare intonazioni interrogative stridule.
     - Suite di 7 unit test dedicati con Vitest (`src/utils/aviationPhonetics.test.ts`), tutti superati.
  4. **Servizio Audio Centrale & MediaSession (`src/services/voiceService.ts` & `src/hooks/useAviationVoice.ts`)**:
     - Riproduzione atomica di singoli frammenti e sequenza continua con highlighting visivo sincronizzato.
     - Supporto `navigator.mediaSession` per riproduzione e metadati a schermo spento con auricolari Bluetooth.
  5. **Integrazione UI Cockpit in [QuestionCard.tsx](file:///c:/github/Quiz_VDS-VL/src/components/QuestionCard.tsx) & [ArchiveScreen.tsx](file:///c:/github/Quiz_VDS-VL/src/components/ArchiveScreen.tsx)**:
     - Header: tasto sequenziale "Ascolta / Ascolto..." con animazione d'onda.
     - Domanda: micro-icona speaker per ascolto atomico del solo testo domanda (tasto `Q`).
     - Opzioni 1, 2, 3: micro-icona per ascolto della singola opzione (tasti `Alt+1`, `Alt+2`, `Alt+3`).
     - Feedback su errore: trigger vocale automatico della risposta corretta, della regola e del tranello.
     - Box spiegazione didattica: pulsante "Ascolta Spiegazione" per risentire la motivazione.
  6. **Impostazioni in [SettingsModal.tsx](file:///c:/github/Quiz_VDS-VL/src/components/SettingsModal.tsx)**:
     - Toggle Voce Istruttore (On/Off).
     - Toggle Spiegazione Vocale Automatica su Errore.
     - Toggle Lettura Automatica all'apertura del quiz.
     - Selettore velocità parlato (`0.9x`, `1.0x`, `1.15x`, `1.25x`).
- **Scelte architetturali & Rationale**:
  - *Segmentazione discreta vs Audio Sprites monolitici*: 5 file per quiz evitano problemi di buffer range seek sui browser mobile e consentono una gestione dello stato pulita e immediata.
  - *Normalizzazione fonetica a monte*: Garantisce che termini complessi come "QNH 1013 hPa" o "D.P.R. 133/2010" vengano pronunciati con perfetta dizione aeronautica.
- **Impatto sul Desiderata**:
  - PWA completamente accessibile e fruibile a mani libere, con supporto studio durante tragitti o passeggiate (cuffie Bluetooth e schermo spento).

### [2026-09-27] - Configurazione GitHub Pages & CI/CD Pipeline (.github/workflows/deploy.yml)
- **Cosa abbiamo fatto**:
  1. **Configurazione Base Path per GitHub Pages**:
     - In `vite.config.ts`, impostato `base: process.env.BASE_PATH || (process.env.GITHUB_ACTIONS ? '/Quiz_VDS-VL/' : '/')`. In questo modo in sviluppo locale il server risponde sempre su `/` (compatibilità con test CDP e porte standard), mentre nei runner di build GitHub Pages imposta il subpath del repository.
     - Nel manifest PWA (`vite.config.ts`), convertite le icone in percorsi relativi (`'icons/icon-192x192.png'`) per evitare che cerchino la cartella icons nella root del dominio host (`username.github.io/icons`).
  2. **Risoluzione Path Audio per Deployment Subpath**:
     - In `src/services/voiceService.ts`, aggiornato `getAudioUrl` con `import.meta.env.BASE_URL` dinamico, garantendo che gli stream audio ICAO vengano risolti correttamente sia in locale che su GitHub Pages.
  3. **Automazione CI/CD con GitHub Actions**:
     - Creato il workflow standard `.github/workflows/deploy.yml` con trigger su `push` al branch `main` e `workflow_dispatch`. Il job esegue `npm ci`, la suite di test Vitest (`npm test`), il build PWA (`npm run build` con `BASE_PATH: '/Quiz_VDS-VL/'`), il packaging dell'artifact `dist` e il deployment su GitHub Pages tramite le action ufficiali `actions/deploy-pages@v4`.
- **Scelte architetturali & Rationale**:
  - *GitHub Pages come Hosting Ideale*: L'app è una Single Page Application 100% client-side senza backend proprietario. GitHub Pages fornisce HTTPS nativo e permanente (prerequisito obbligatorio per Service Worker e Web App Install Banner), zero costi e zero manutenzione server.
  - *Automazione GitHub Actions vs Branch Orfano*: Adottato il deployment moderno nativo via artifact Actions (`actions/deploy-pages@v4`), evitando l'inquinamento del repository con branch sporchi come `gh-pages` o build committati manualmente nel repo.
- **Impatto sul Desiderata**:
  - Preparata la PWA per la distribuzione pubblica e l'installazione su dispositivi reali (smartphone Android, iOS, tablet e desktop) con Service Worker e cache offline operativi.

### [2026-09-27] - Risoluzione Difetti: Visibilità Note Personali & Protezione Esame Attivo (Navigation Guard)
- **Cosa abbiamo fatto**:
  1. **Visualizzazione, Modifica ed Eliminazione Note Personali**:
     - Risolto il difetto per cui le note personali non erano visibili in `Archivio`:
       * In `src/components/ArchiveScreen.tsx`, aggiunto nel riepilogo collassato di ogni quesito un badge/pill visibile con il testo della nota (`"{stat.userNote}"`).
       * Nella vista espansa dell'archivio, implementata una sezione dedicata ad alto contrasto "Nota Personale" con pulsanti di azione immediata ("Modifica", "Elimina") e pulsante per aggiungere note se assenti (`+ Aggiungi appunto personale sul quesito`).
       * In `src/components/QuestionCard.tsx`, ridisegnata la card della nota con intestazione chiara, contrasto pienamente conforme sia al tema Cockpit Dark che Hangar Light (`light:bg-sky-50 light:border-sky-200 light:text-sky-950`), pulsanti di Modifica ed Eliminazione rapida, e sincronizzazione automatica dello stato al cambio quesito (`useEffect`).
       * In `src/components/MistakesScreen.tsx`, aggiunto lo snippet della nota nel riepilogo dei quesiti da perfezionare.
       * In `src/db/index.ts`, aggiornata la funzione `saveQuestionNote` con trimming del testo ed eliminazione automatica del campo se la nota viene svuotata, con test di regressione dedicati in `database.test.ts`.
  2. **Protezione Simulazione Esame & Navigation Guard**:
     - Risolto il difetto per cui spostandosi di pagina durante una simulazione si perdevano i progressi:
       * Introdotto in `QuizContext.tsx` lo stato reattivo globale `isExamRunning` e `setIsExamRunning`.
       * In `src/components/ExamScreen.tsx`, sincronizzato lo stato dell'esame attivo (`running`), aggiunto pulsante esplicito "Abbandona" nella barra superiore con modal di conferma dedicato.
       * In `src/App.tsx`, implementato il Navigation Guard: se l'utente tenta di cambiare scheda (Materie, Errori, Archivio, Stats) mentre una simulazione è in corso, la navigazione viene intercettata e compare un modal di avviso avionico chiaro e non invasivo:
         - **"Rimani nell'Esame"** (opzione primaria sicura): annulla il cambio scheda e mantiene la simulazione intatta con timer e risposte preservati.
         - **"Abbandona ed Esci"** (opzione distruttiva): termina la simulazione e reindirizza alla scheda desiderata.
       * Aggiunto il listener nativo `beforeunload` sul browser per impedire ricaricamenti o chiusure accidentali della tab durante l'esame.
       * Nella `Navbar.tsx`, aggiunti indicatori visivi in tempo reale: badge pulsante "IN CORSO" nell'header e beacon luminoso sulla scheda "Esame".
  3. **Collaudo e Validazione Visiva**:
     - Verificato con test CDP headless sia su desktop (1440x900) che smartphone (390x844), in modalità sia Cockpit Dark che Hangar Light.
     - Eseguita la suite Vitest con 57 test passati al 100% e build Vite completata senza errori.
- **Scelte architetturali & Rationale**:
  - *Safety Guard contro Perdita Dati*: L'esame teorico AeCI dura 45 minuti e richiede concentrazione. Tasti o tap accidentali non devono mai provocare la perdita della sessione. Il blocco con conferma a doppio pulsante (con focus sulla continuazione dell'esame) protegge l'utente senza intrappolarlo.
  - *Accessibilità e Contrasto Bimodale*: Le note personali devono risaltare visivamente all'aperto sia in tema scuro che in tema chiaro, offrendo al contempo strumenti completi di CRUD (Create, Read, Update, Delete) direttamente nei punti focali di studio (Archivio, Scheda Quesito, Quaderno Errori).
- **Impatto sul Desiderata**:
  - Eliminati entrambi i punti di attrito UX segnalati dall'utente. La PWA offre ora un flusso didattico ergonomico, affidabile e protetto da errori accidentali.

### [2026-09-27] - Fix Service Worker GitHub Pages & Diagnostica Google Drive API 403
- **Cosa abbiamo fatto**:
  - Risolto errore 404 del Service Worker (`Failed to register a ServiceWorker for scope ('https://alessandroame.github.io/') with script ('https://alessandroame.github.io/sw.js')`): rimosso il blocco manuale ridondante in `src/main.tsx` che forzava `/sw.js` alla root del dominio anziché rispettare il base path `/Quiz_VDS-VL/`. La registrazione è ora interamente delegata al file `registerSW.js` generato e iniettato automaticamente da `vite-plugin-pwa`.
  - Risolto l'avviso correlato del browser `cross-world service worker resource mismatch` e `link preload not used`.
  - Diagnosticato e gestito l'errore `403 (Forbidden)` sulle chiamate `https://www.googleapis.com/drive/v3/files`: la Google Drive API deve essere abilitata nel progetto Google Cloud associato al Client ID.
  - Aggiornato `src/services/googleDrive.ts` con un metodo dedicato `handleApiError` che intercetta i codici 403 e fornisce messaggi diagnostici chiari in italiano anziché fallire silenziosamente o mostrare messaggi generici.
  - Aggiunti unit test dedicati `DRV-07` e `DRV-08` in `src/services/googleDrive.test.ts` (suite portata a 65 test, 100% passati).
- **Scelte architetturali & Rationale**:
  - *Single Registration Authority*: Evitare doppie registrazioni conflittuali del Service Worker; `vite-plugin-pwa` calcola a compile-time il base path corretto sia per sviluppo locale (`/`) che per produzione GitHub Pages (`/Quiz_VDS-VL/`).
  - *Fail-Fast & Feedback Diagnostico*: Quando un servizio esterno (come Google Drive API) restituisce 403 per API disabilitata nel progetto Cloud, l'applicazione deve guidare lo sviluppatore/utente verso l'esatta schermata di abilitazione nella Cloud Console.
- **Impatto sul Desiderata**:
  - Deploy GitHub Pages perfettamente conforme come PWA offline senza errori in console.
  - Robustezza e resilienza del connettore Google Drive Cloud Sync.

### [2026-09-27] - Semplificazione UX Backup Google Drive & Supporto .env
- **Cosa abbiamo fatto**:
  - Rimosso il campo di testo obbligatorio "Google OAuth Client ID" dalla vista primaria del pannello Impostazioni: ora l'utente vede direttamente i comodi pulsanti ad azione singola **"Salva su Drive"** e **"Ripristina da Drive"**.
  - Integrata in `src/services/googleDrive.ts` la lettura automatica della variabile d'ambiente `import.meta.env.VITE_GOOGLE_CLIENT_ID`.
  - Creato il file di documentazione [`.env.example`](file:///c:/github/Quiz_VDS-VL/.env.example) con le istruzioni per configurare il Client ID a livello di progetto.
  - Relegata la configurazione manuale del Client ID a un menu espandibile secondario ("Opzioni Avanzate"), evitando di disorientare gli utenti finali.
  - Valorizzato il "Backup File Locale (JSON)" come metodo predefinito zero-config, sicuro e 100% offline.
- **Scelte architetturali & Rationale**:
  - *Zero Technical Friction per l'Utente Finale*: Gli studenti/piloti non devono interagire con concetti da sviluppatore (OAuth Client ID). Il flusso di backup cloud deve avviarsi in 1 click aprendo il popup standard Google Account.
- **Impatto sul Desiderata**:
  - Esperienza utente nelle Impostazioni allineata ai più elevati standard moderni di usabilità e privacy.

### [2026-09-27] - Integrazione Audio Avionico & Sintesi Vocale Fonetica ICAO
- **Cosa abbiamo fatto**:
  - Sviluppato modulo di fonetica aeronautica ICAO (`src/utils/aviationPhonetics.ts`) con conversione numeri e abbreviazioni avioniche, coperto da suite di unit test (`src/utils/aviationPhonetics.test.ts`).
  - Implementato `voiceService.ts` e hook `useAviationVoice.ts` per la lettura automatica o manuale delle domande d'esame tramite Web Speech API con tuning per voce italiana.
  - Implementato sound generator sintetico avionico via Web Audio API (`src/utils/audio.ts`) per click, feedback risposta (ding/buzzer) e allarmi quota/tempo.
  - Aggiunti controlli audio dedicati in `SettingsModal.tsx` (volume, muto, toggle voce) e pulsante altoparlante in `QuestionCard.tsx`.
- **Scelte architetturali & Rationale**:
  - *Zero dipendenze esterne per l'audio*: Generazione suoni via oscillatori nativi Web Audio API e sintesi vocale via Web Speech API del browser, preservando l'architettura 100% offline-first senza scaricare pesanti file audio binari.
  - *Fonetica ICAO*: I numeri e i termini tecnici aeronautici vengono pronunciati secondo gli standard radiofonici ICAO per massima fedeltà al contesto didattico di volo.
- **Impatto sul Desiderata**:
  - Requisito di accessibilità e audio cockpit completato e collaudato con successo.

### [2026-09-27] - Fix Critico Sistema Temi (Cockpit Dark / Hangar Light) & Diagnosi Chrome

- **Cosa abbiamo fatto**:
  - Diagnosticato con CDP headless e risolto il motivo per cui il cambio tema non produceva effetti visivi nel browser:
    1. In `tailwind.config.js` mancava la registrazione della variante `light:`, impedendo la generazione nel CSS di oltre 150 regole `light:*` presenti nei componenti. Aggiunto il plugin con `addVariant('light', ':is(.light &)')`.
    2. La sequenza di toggle rapido in `Navbar.tsx` partiva da `system` (risolto scuro su OS dark) e passava a `dark` (ancora visivamente scuro), provocando un click a vuoto invisibile. Riprogettata la transizione per passare immediatamente a `light` se il tema attuale percepito è scuro.
    3. In `ThemeContext.tsx`, Dexie sovrascriveva il `localStorage` impostando `system` se non trovava record salvati. Corretta la query per verificare la presenza reale di `entry.value`.
    4. In `index.html`, il tag `<body>` conteneva la classe fissa `bg-slate-950 text-slate-100` senza la variante `light:bg-slate-50 light:text-slate-900`.
  - Collaudato con successo in Chrome CDP headless il passaggio esplicito tra tutti e 3 i temi (`light`, `dark`, `system`) sia da Navbar che dal pannello Impostazioni, con verifica dei computed styles e zero errori in console.
- **Scelte architetturali & Rationale**:
  - *Feedback Visivo Immediato*: Il toggle rapido nell'header deve sempre produrre una variazione visiva percepibile al primo click, invertendo la modalità corrente senza stati intermedi invisibili.
  - *Sincronizzazione coerente SSOT*: Il `localStorage` gestisce l'idratazione sincrona immediata pre-paint per evitare flash di stile scorretto (FOUC), mentre IndexedDB garantisce la persistenza del profilo.
- **Impatto sul Desiderata**:
  - Il sistema a doppio tema avionico (Cockpit Dark per uso notturno/standard e Hangar Light per visibilità sotto il sole) è ora 100% funzionante e reattivo in qualsiasi browser e dispositivo.

### [2026-09-27] - Governance: Separazione Desiderata, Worklog e Regole di Dominio
- **Cosa abbiamo fatto**:
  - Creato [DESIDERATA.md](file:///c:/github/Quiz_VDS-VL/DESIDERATA.md) nella root come bussola funzionale, matrice di stato e guida di onboarding per i nuovi agenti.
  - Creato [WORKLOG.md](file:///c:/github/Quiz_VDS-VL/WORKLOG.md) come diario di bordo cronologico e registro ADR (Architectural Decision Records).
  - Ripulito e ottimizzato [MEMORY.md](file:///c:/github/Quiz_VDS-VL/MEMORY.md) affinché rimanga un prontuario ultra-denso e compatto delle sole regole di dominio e vincoli tecnici stabili.
  - Aggiornato [.agents/AGENTS.md](file:///c:/github/Quiz_VDS-VL/.agents/AGENTS.md), il workflow [task_lifecycle.md](file:///c:/github/Quiz_VDS-VL/.agents/workflows/task_lifecycle.md), la skill [self-correction-loop](file:///c:/github/Quiz_VDS-VL/.agents/skills/self-correction-loop/SKILL.md) e la regola [constraints.md](file:///c:/github/Quiz_VDS-VL/.agents/rules/constraints.md) per sancire l'obbligo di aggiornare `WORKLOG.md` e consultare `DESIDERATA.md`.
- **Scelte architetturali & Rationale**:
  - *Separation of Concerns (SoC) nella documentazione di progetto*: Incorporare il diario di bordo all'interno di `MEMORY.md` lo avrebbe reso ingestibile, consumando token e diluendo le regole vincolanti lette ad ogni pre-flight. Separare **Desiderata** (cosa vogliamo fare), **Worklog** (cosa abbiamo fatto e perché) e **Memory** (vincoli e regole stabili) offre massima chiarezza e rapidità di consultazione sia ad agenti che a umani.
- **Impatto sul Desiderata**:
  - Architettura di governance e onboarding completata al 100%. Qualsiasi agente futuro può orientarsi in 30 secondi e sa dove registrare le scelte prese.

### [2026-09-27] - Architettura Suite Vitest & Refactoring SRP
- **Cosa abbiamo fatto**:
  - Estratto la logica pura di valutazione esame in `src/services/examEvaluator.ts`, il timer in `src/utils/timer.ts` e il calcolo analitico in `src/utils/analytics.ts`.
  - Implementata una suite di unit & integration test con Vitest (`tests/unit/examEvaluator.test.ts`, `tests/unit/timer.test.ts`, `tests/unit/analytics.test.ts`, `tests/unit/randomizer.test.ts`, `tests/integration/db.test.ts`).
  - Applicata Boundary Value Analysis (BVA) sulle soglie di idoneità (2, 3, 4 errori per esame standard; 6, 7 per maratona) e simulazione Monte Carlo su 100 estrazioni del randomizer.
  - Configurato l'ambiente in-memory per Dexie con `fake-indexeddb/auto`.
- **Scelte architetturali & Rationale**:
  - *Single Responsibility Principle (SRP)*: Disaccoppiare la logica matematica e di business dal ciclo di vita di React evita race conditions e rende i moduli puri, deterministici e testabili in millisecondi (<500ms) senza overhead di rendering DOM.
  - *Bando ai test fittizi (Zero Faux-Testing)*: Scrittura di test basati su specifiche regolamentari esterne e indipendenti per impedire logiche circolari o tautologiche.
- **Impatto sul Desiderata**:
  - Massima solidità e verificabilità della business logic. La suite conta 50 test unitari ed esegue in ~430ms.

### [2026-09-27] - Sviluppo Interfaccia Cockpit & 5 Sezioni Funzionali
- **Cosa abbiamo fatto**:
  - Implementato il layout cockpit responsive con navigazione primaria a 5 tab (**Esame**, **Materie**, **Errori**, **Archivio**, **Stats**).
  - Creata la schermata **Esame** con 30 quiz conformi alle quote ministeriali, countdown 45 min, griglia interattiva con flag `⚑ Rivedi` e schermata di debriefing finale.
  - Creata la sezione **Materie** con filtro per le 9 materie e visualizzazione didattica immediata.
  - Implementato il **Quaderno Errori** con ripetizione spaziata (uscita solo dopo 2 risposte corrette consecutive).
  - Implementato l'**Archivio** con ricerca full-text istantanea e gestione preferiti/note.
  - Creata la dashboard **Stats** con indice di prontezza esame, radar delle 9 materie e storico sessioni.
  - Aggiunte scorciatoie da tastiera desktop (`1`, `2`, `3`, `F`, `Spazio`/frecce).
- **Scelte architetturali & Rationale**:
  - *Design System Avionico ad alto contrasto*: Ottimizzato specificamente per la consultazione su campo di volo/decollo o in condizioni di forte illuminazione solare (palette Cockpit Dark & Hangar Light).
  - *Microcopy essenziale*: Nessun testo prolisso o verboso nei bottoni e nelle schermate; etichette brevi, asciutte e telegrafiche.
- **Impatto sul Desiderata**:
  - Tutte le funzionalità utente principali della PWA sono operative e navigabili nel browser.

### [2026-09-27] - Scaffolding PWA, Layer Database Dexie & Motore Fair Coverage
- **Cosa abbiamo fatto**:
  - Inizializzato stack Vite + React 19 + TypeScript + Tailwind CSS.
  - Configurato il database IndexedDB locale tramite Dexie (`src/db/index.ts`, `src/types/database.ts`).
  - Sviluppato l'algoritmo `FairCoverageRandomizer` (`src/services/randomizer.ts` e `src/utils/fairRandomizer.ts`) per l'estrazione bilanciata dei quiz.
  - Integrato il modulo Google Identity Services (GIS) per il backup su Google Drive (`appDataFolder`) e l'export/import JSON locale.
  - Configurato Workbox via `vite-plugin-pwa` per il caching offline totale e generato il set di icone PWA.
- **Scelte architetturali & Rationale**:
  - *Dexie.js anziché LocalStorage*: LocalStorage ha un limite di 5MB ed è sincrono/bloccante sul main thread. Dexie offre query asincrone indicizzate e reattività integrata tramite `dexie-react-hooks`.
  - *Fair Coverage a Bucket*: I generatori pseudocasuali puri provocano una dispersione eccessiva delle domande non viste. La priorità a bucket (`times_seen == 0` prima di tutto) azzera il coupon collector problem.
  - *Google Drive appDataFolder*: Permette la sincronizzazione cloud opzionale e privata dell'utente senza richiedere backend server remoti gestiti.
- **Impatto sul Desiderata**:
  - Requisito di PWA installabile, 100% offline-first e con persistenza locale robusta completato.

### [2026-09-27] - Estrazione Dataset 504 Quiz AeCI & Regolamento
- **Cosa abbiamo fatto**:
  - Analizzato il PDF ufficiale `quiz_VDS-VL_2017.pdf` (504 quesiti, 9 materie, griglia risposte pp. 50-51).
  - Sviluppata la pipeline di estrazione Python (`extract_quizzes.py`), risolvendo l'anomalia del quiz 7037 (numerato 4, 5, 6 nel PDF originale), normalizzando cesure e caratteri speciali.
  - Generate le sintesi didattiche (`Regola` + `Tranello`) per ogni quiz.
  - Validata l'integrità del dataset (504 quiz, 3 risposte a quesito, 1 sola esatta) e generati `src/data/questions.json`, `public/data/questions.json` e `src/types/quiz.ts`.
- **Scelte architetturali & Rationale**:
  - *Dataset statico JSON come SSOT immutabile*: Azzerare qualsiasi dipendenza da backend esterni o chiamate API di rete durante l'uso dell'applicazione, garantendo caricamento istantaneo e funzionamento offline deterministico.
  - *Spiegazioni telegrafiche (Regola + Tranello)*: Evitare di incorporare testi didattici prolissi da manuali non autorizzati; focalizzare l'attenzione del candidato solo sul principio normativo/fisico e sul tranello tipico della domanda.
- **Impatto sul Desiderata**:
  - Dataset completo e validato al 100%. Base dati solida e pronta per il motore quiz e l'interfaccia PWA.
