# Direttive di Progetto e Configurazione Agent (Quiz_VDS-VL) 🛩️

Questo documento rappresenta la guida operativa centrale per l'AI Agent che sviluppa, collauda e manutiene la PWA **VDS-VL Quiz Master**.

---

## 1. Mappa Strutturale di `.agents/`

L'alberatura delle configurazioni dell'agente è standardizzata, modulare e ordinata come segue:

```
.agents/
├── AGENTS.md                   # Questo documento di regia e direttive operative
├── rules/                      # Regole e vincoli architetturali vincolanti
│   ├── anti_sycophancy_integrity.md  # Rigore tecnico, circuit breaker anti-loop, zero test fittizi
│   ├── constraints.md                # Vincoli architetturali PWA (Vite, TS strict, Dexie SSOT)
│   ├── proactive_mentorship.md       # Mentorship critica, anti-sycophancy e prompt refactoring
│   └── trace_based_debugging.md      # Protocollo deterministico di debug a tracce numerate
├── skills/                     # Skill specializzate (ciascuna con SKILL.md conforme)
│   ├── test-architect-vitest/  # Piani di test, Unit & Integration test Vitest, mock Dexie e BVA
│   ├── autonomous-loops/       # Circuit breaker salva-token per cicli di build e test
│   ├── self-correction-loop/   # Cattura permanente delle correzioni su MEMORY.md
│   ├── headless-pwa-tester/    # Collaudo visivo CDP zero-dipendenze (mobile 390x844 e desktop)
│   ├── aviation-ui-ux/         # Design system avionico, microcopy minimale e palette cockpit
│   ├── pwa-quiz-engine/        # Fair Coverage Randomizer, persistenza Dexie e gestione offline
│   ├── vds-exam-examiner/      # Regolamento esame ufficiale AeCI (30 quiz, 45 min, max 3 errori)
│   ├── vds-quiz-extractor/     # Pipeline estrazione e normalizzazione dei 504 quiz dal PDF ufficiale
│   └── git-pro/                # Standard Conventional Commits e igiene del repository
└── workflows/                  # Flussi procedurali standardizzati
    ├── task_lifecycle.md       # Pre-flight, gestione processi sincroni e pulizia task
    └── browser_testing.md      # Collaudo visivo PWA e verifica console browser
```

---

## 2. Direttive Comportamentali Cardine

1. **Token Economy & Circuit Breaker**:
   - Rispettare rigorosamente i limiti di iterazione della skill `autonomous-loops`.
   - Se lo stesso errore si ripete immutato per 2 iterazioni consecutive (`STUCK`), interrompere il ciclo e comunicarlo all'utente.
   - Vietato invocare per più di 2 volte consecutive lo stesso tool di ispezione sullo stesso file senza produrre avanzamento (`anti_sycophancy_integrity.md`).

2. **Zero Dangling Background Tasks**:
   - Eseguire i comandi di build e test con `WaitMsBeforeAsync: 10000` per favorire l'esecuzione sincrona.
   - Terminare immediatamente con `manage_task(Action='kill')` qualsiasi task di breve durata che scivola in background.

3. **Link Cliccabili Sempre Attivi**:
   - Rendere sempre cliccabili tutti i percorsi di file e URL nel markdown (es. `[MEMORY.md](file:///c:/github/Quiz_VDS-VL/MEMORY.md)`).

4. **Proattività Critica e Prompt Refactoring**:
   - Applicare [proactive_mentorship.md](file:///c:/github/Quiz_VDS-VL/.agents/rules/proactive_mentorship.md) per individuare rischi tecnici, trade-off negativi o ottimizzazioni del prompt prima di avviare interventi massicci.

5. **Memoria di Progetto Permanente**:
   - Registrare decisioni stabili o correzioni dell'utente in `MEMORY.md` via `self-correction-loop`.
