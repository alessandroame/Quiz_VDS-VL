# Piano di Progetto: Armonizzazione UI/UX & Disambiguazione Stati Top Bar 🛩️

Data: 2026-09-30  
Stato: Approvato / In Pianificazione (`TODO-08` / `Fase 10`)  
Target Files:
- [src/components/Navbar.tsx](file:///c:/github/Quiz_VDS-VL/src/components/Navbar.tsx)
- [src/components/VoiceQuickMenu.tsx](file:///c:/github/Quiz_VDS-VL/src/components/VoiceQuickMenu.tsx)
- [src/components/HomeScreen.tsx](file:///c:/github/Quiz_VDS-VL/src/components/HomeScreen.tsx)
- [src/components/ExamScreen.tsx](file:///c:/github/Quiz_VDS-VL/src/components/ExamScreen.tsx)
- [src/components/TopicsScreen.tsx](file:///c:/github/Quiz_VDS-VL/src/components/TopicsScreen.tsx)
- [src/components/MistakesScreen.tsx](file:///c:/github/Quiz_VDS-VL/src/components/MistakesScreen.tsx)
- [src/components/drive/DriveActiveHUD.tsx](file:///c:/github/Quiz_VDS-VL/src/components/drive/DriveActiveHUD.tsx)

---

## 1. Visione & Diagnosi del Problema

Nella top bar dell'applicazione (sia nella barra standard dell'Home Hub sia nel mini-header delle sessioni interne), due pulsanti adiacenti presentano una forte colorazione ambra/gialla:
1. **Modalità Audio (`#btn-drive-mode` / `#btn-mini-audio`)**: stilizzato con `bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 light:bg-amber-100 light:text-amber-800 border border-amber-500/30`.
2. **Menu Rapido Voce (`VoiceQuickMenu`)**: stilizzato con `bg-amber-500/15 border-amber-500/30 text-amber-400 light:bg-amber-50 light:border-amber-300 light:text-amber-700 shadow-sm` ogni volta che `settings.ttsEnabled` è attivo (stato predefinito dell'app).

### Perché questo confonde l'allievo pilota:
- **Bias del Toggle Attivo**: Nel design moderno, un pulsante con sfondo colorato e bordo in risalto indica uno **stato attivo/selezionato** (toggle ON) o un avviso di pericolo.
- **Mancata Corrispondenza Funzionale**:
  - Il pulsante `Modalità Audio` è una **pura azione di navigazione** (apre la visualizzazione hands-free Drive Mode a schermo intero), NON una modalità attualmente attiva in background. L'allievo crede che l'audio stia già andando o che debba "spegnerlo", ma cliccandoci finisce catapultato nella schermata Guida.
  - Il pulsante `VoiceQuickMenu` è un **trigger di menu a tendina (dropdown/flyout)**, NON un toggle rapido on/off. Se affiancato alle cuffie gialle, l'header presenta due rettangoli gialli isolati mentre le altre icone (Tema, Impostazioni, Sincronizzazione) sono neutre.
- **Anomalie Sparse Correlate**:
  - Il medesimo pulsante di salto in Modalità Audio è duplicato con lo stesso stile di "toggle attivo" su `HomeScreen.tsx`, `ExamScreen.tsx`, `TopicsScreen.tsx` e `MistakesScreen.tsx`.
  - Nel mini-header, l'icona freccia `ChevronLeft` del tasto "Home" è `text-amber-400`, attirando attenzione senza scopo semantico.
  - Il badge "2017" accanto al logo usa un'ulteriore pillola ambra (`bg-amber-500/20 text-amber-400`) che compete visivamente con il badge di versione e lo stato di rete.

---

## 2. Tassonomia Visiva Rigorosa (Design System VDS-VL)

In ossequio al principio di **zero distrazioni e alta leggibilità di studio** ([minimal-ui-ux](file:///c:/github/Quiz_VDS-VL/.agents/skills/minimal-ui-ux/SKILL.md)), viene formalizzata la seguente classificazione:

| Categoria Componente | Ruolo Funzionale | Aspetto Visivo Corretto |
| :--- | :--- | :--- |
| **Azione di Navigazione** | Cambia schermata (es. Apri Audio, Torna Home, Esci) | **Neutro**: `border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:text-white hover:bg-zinc-800` (Dark) / `bg-slate-100 border-slate-200 text-slate-700` (Light). Nessun bordo ambra o sfondo colorato permanente. |
| **Trigger Menu Dropdown** | Apre un pannello di opzioni contestuali (`VoiceQuickMenu`) | **Neutro Coordinato**: stesso container sobrio dei controlli di testata. Stato visibile tramite icona e microcopy (`Volume2` + `1.0x` bianco/zinco; `VolumeX` + `Muto` grigio/spento). |
| **Vero Toggle di Stato** | Accende/spegne una feature in loco (es. `⚑ Rivedi`, `Pilota Auto`) | **Spento**: grigio/zinco neutro. **Acceso**: anello/bordo di accento (`amber-500/30` o `emerald-500/30`) con accento visibile. |
| **Player Audio Dinamico** | Traccia audio attualmente in ascolto (`QuestionCard`) | **Inattivo/Riposo**: neutro `zinc-400`. **In riproduzione**: anello e pulsazione ambra (`ring-1 ring-amber-500/50`). |
| **Filtro Attivo / Segmented** | Chip di selezione mutuamente esclusiva (es. Disciplina) | **Selezionato**: `bg-amber-500 text-zinc-950 font-bold`. **Non selezionato**: neutro `bg-zinc-900 text-zinc-400`. |

### Regola Ferrea per l'Ambra:
L'ambra (`amber-400` / `amber-500`) è un colore semantico di allerta e memoria: è riservata esclusivamente a **domande da rivedere (`⚑ Rivedi`)**, **spiegazioni didattiche Tranello**, **indicatore prontezza esame (%)**, **filtri attivi** e **audio in effettiva riproduzione**.

---

## 3. Specifiche di Intervento Dettagliate

### Step 1: Top Bar & Navbar (`src/components/Navbar.tsx`)
1. **Pulsante `Modalità Audio` (`#btn-drive-mode` e `#btn-mini-audio`)**:
   - Rimuovere `bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30 light:bg-amber-100 light:text-amber-800`.
   - Adottare stile pillola neutra: `p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white light:bg-slate-100 light:border-slate-200 light:text-slate-700 light:hover:text-slate-900 shadow-sm flex items-center gap-1.5 text-xs font-semibold transition-all active:scale-95`.
   - Icona `Headphones`: `text-zinc-400 group-hover:text-zinc-200 light:text-slate-500`.
2. **Pulsante Menu Voce (`src/components/VoiceQuickMenu.tsx`)**:
   - Rimuovere la pillola ambra permanente `bg-amber-500/15 border-amber-500/30 text-amber-400`.
   - Allineare il container a stile neutro:
     ```tsx
     className={`px-2 py-1.5 rounded-lg border flex items-center gap-1.5 text-xs font-semibold transition-all active:scale-95 border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 light:bg-slate-100 light:border-slate-200 light:text-slate-700 ${buttonClassName}`}
     ```
   - Icona: `Volume2` in `text-zinc-200 light:text-slate-700` quando attivo; `VolumeX` in `text-zinc-500 light:text-slate-400` quando muto.
3. **Pulsante Ritorno Home (`#btn-nav-back-home`)**:
   - Icona `ChevronLeft`: da `text-amber-400 light:text-amber-600` a `text-zinc-400 group-hover:text-white light:text-slate-500`.
4. **Badge Edizione "2017"**:
   - Da `bg-amber-500/20 text-amber-400` a `bg-zinc-800/80 text-zinc-400 border border-zinc-700/60 light:bg-slate-100 light:text-slate-600 light:border-slate-200` coordinato al badge di build.

### Step 2: Schermate Interne (Pulsanti Salto Audio Secondari)
Armonizzare i 4 pulsanti di accesso rapido alla Modalità Audio con container neutro:
1. `src/components/HomeScreen.tsx` (`#btn-home-audio-quick`):
   - Pillola neutra nel box telemetria: `border border-zinc-800 bg-zinc-800/60 hover:bg-zinc-700/80 text-zinc-300 hover:text-white light:bg-slate-100 light:border-slate-300 light:text-slate-700`.
2. `src/components/ExamScreen.tsx` (`#btn-exam-drive-mode`):
   - Toolbar esame: convertire da bordo/testo ambra a pulsante di controllo neutro `border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 light:bg-slate-100 light:border-slate-200 light:text-slate-700`.
3. `src/components/TopicsScreen.tsx` (`#btn-topics-drive-mode`):
   - Idem per la toolbar della materia selezionata.
4. `src/components/MistakesScreen.tsx` (`#btn-mistakes-drive-mode`):
   - Idem per la testata del ripasso errori.

### Step 3: HUD Modalità Guida (`src/components/drive/DriveActiveHUD.tsx`)
- Con `VoiceQuickMenu` ora neutro, nella barra comandi della Guida spiccheranno nitidamente **solo i veri toggle attivi**:
  - `btn-drive-autopilot-toggle` (acceso = ambra/verde)
  - `btn-drive-tutor-toggle` (acceso = ambra)
  - `btn-drive-toggle-voice` (acceso = verde microfono)
- Eliminato il rumore visivo dei controlli che prima apparivano tutti indistintamente gialli.

---

## 4. Criteri di Accettazione & Verifica

- [ ] **Zero Ambiguità Toggle**: Nessun pulsante di pura navigazione o apertura menu si presenta colorato come toggle acceso.
- [ ] **Armonia Top Bar**: I controlli nella testata superiore formano una barra coerente ed equilibrata sia su mobile (390px) che su desktop (1440px).
- [ ] **Coerenza Temi**: Testata impeccabile sia in tema scuro Zero-Blue (`zinc-950`/`zinc-900`) sia in tema chiaro ad alto contrasto (`slate-50`/`white`).
- [ ] **TestSuite Integrità**: 100% test Vitest superati (`npm run test:unit`) con 0 rotture sui selettori ID.
- [ ] **Zero Errori Console**: Collaudo headless CDP con `consoleErrors.length === 0`.
