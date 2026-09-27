# 📋 VDS-VL Quiz Master - Avanzamento Lavori (TODO)

**Data Inizio**: 27/09/2026  
**Stato Generale**: 🟡 In Corso (Fase 1 & Fase 2)

---

## 🗂️ Fasi di Sviluppo

### [x] Fase 0: Analisi & Allineamento Requisiti
- [x] Analisi struttura `quiz_VDS-VL_2017.pdf` (504 quiz, 9 materie, soluzioni pp. 50-51)
- [x] Verifica assenza elementi grafici/immagini nel PDF
- [x] Verifica del manuale teorico di approfondimento anonimo (`Il Parapendio.pdf`)
- [x] Verifica e correzione della skill di regolamento AeCI (30 domande, 45 min, max 3 errori)
- [x] Redazione e approvazione del piano strategico `PROJECT_PLAN.md`

---

### [ ] Fase 1: Creazione Custom Skills (.agents/skills)
- [x] `.agents/skills/vds-exam-examiner` (Regolamento ufficiale AeCI & D.P.R. 133/2010)
- [ ] `.agents/skills/vds-quiz-extractor` (Pipeline estrazione PDF, normalizzazione, validazione)
- [ ] `.agents/skills/pwa-quiz-engine` (Fair Coverage Randomizer, Dexie DB, Drive Backup, PWA)
- [ ] `.agents/skills/aviation-ui-ux` (Design cockpit avionico, microcopy minimale, temi chiaro/scuro/auto)

---

### [ ] Fase 2: Estrazione Dati & Dataset 504 Quiz
- [ ] Script Python `extract_quizzes.py` per parsing su 2 colonne e join con soluzioni
- [ ] Correzione cesure a capo, trattini e caratteri speciali UTF-8
- [ ] Sintesi spiegazioni didattiche essenziali (Regola fisica/normativa + Tranello)
- [ ] Validazione di integrità: 504 quiz estratti, 3 opzioni per quiz, risposte 1-3 valide
- [ ] Generazione `src/data/questions.json` e tipi TypeScript `src/types/quiz.ts`

---

### [ ] Fase 3: Scaffolding PWA & Tooling
- [ ] Inizializzazione Vite + React 19 + TypeScript
- [ ] Configurazione Tailwind CSS con palette Cockpit Dark & Hangar Light
- [ ] Installazione dipendenze: `dexie`, `lucide-react`, `canvas-confetti`, `vite-plugin-pwa`
- [ ] Configurazione PWA: `manifest.webmanifest`, service worker offline (Workbox)

---

### [ ] Fase 4: Database Layer, Fair Randomizer & Google Drive
- [ ] Schema Dexie (statistiche domande, sessioni esame, quaderno errori, preferiti, impostazioni)
- [ ] Modulo `FairCoverageRandomizer` (priorità mai viste > meno viste)
- [ ] Modulo Google Identity Services (GIS) & Google Drive Backup (`appDataFolder`)
- [ ] Store reattivo per persistenza istantanea di qualunque impostazione e tema

---

### [ ] Fase 5: UI Cockpit & Sezioni Funzionali
- [ ] Layout principale responsive con microcopy minimale (**Esame** | **Materie** | **Errori** | **Archivio** | **Stats**)
- [ ] Switch rapido Temi: Chiaro / Scuro / Automatico
- [ ] **Esame**: 30 quiz, countdown 45 min, navigatore a griglia, bandierina ⚑ Rivedi, scheda esito
- [ ] **Materie**: Filtro per le 9 materie, feedback immediato e spiegazione sintetica
- [ ] **Errori**: Quaderno con ripetizione spaziata (rimozione dopo 2 successi)
- [ ] **Archivio**: Ricerca full-text e segnalibri
- [ ] **Stats**: Indice prontezza, radar materie, grafico storico esami, top errori
- [ ] Modal Impostazioni & Backup Google Drive

---

### [ ] Fase 6: Testing, Icone PWA & Rifinitura
- [ ] Generazione set icone PWA (192x192, 512x512, maskable)
- [ ] Verifica funzionamento 100% offline (disconnessione rete simulata)
- [ ] Test usabilità mobile (tap ergonomici) e desktop (scorciatoie 1, 2, 3, F, Invio)
- [ ] Collaudo finale
