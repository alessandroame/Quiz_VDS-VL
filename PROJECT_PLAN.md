# Piano di Progetto: VDS-VL Quiz Master PWA 🛩️

## 1. Visione del Progetto ed Obiettivi
PWA per la preparazione all'esame teorico **VDS-VL (Volo da Diporto o Sportivo - Volo Libero: Parapendio e Deltaplano)** dell'Aero Club d'Italia (AeCI).
Filosofia: **zero parole inutili, velocità da cockpit, offline assoluto, copertura garantita di tutti i 504 quiz e spiegazioni didattiche essenziali**.

---

## 2. Requisiti Chiave e Specifiche

### A. Algoritmo di Randomizzazione a Copertura Garantita (Fair Coverage Randomizer)
- Evita il "coupon collector's problem".
- Ripartizione proporzionale sulle 9 materie secondo l'esame ufficiale.
- Priorità assoluta alle domande mai viste (`times_seen == 0`), poi a quelle viste meno volte (`min(times_seen)`).
- In circa 17 simulazioni (510 quiz) si ha la certezza matematica di aver visto tutti i 504 quiz del database ufficiale.
- A catalogo completato, bilanciamento tra meno viste ed errori più frequenti.

### B. Microcopy Estremo: Solo l'Essenziale
- Sezioni: **Esame** | **Materie** | **Errori** | **Archivio** | **Stats**
- Feedback: **Esatta** | **Errata** | **⚑ Rivedi** | **Consegna** | **IDONEO / NON IDONEO**
- Prontezza: **Prontezza: 87%**

### C. Spiegazioni Didattiche Sintetiche
- **Regola**: dato fisico o norma essenziale.
- **Tranello**: motivo tipico di errore.
- Tratte dai principi teorici di volo libero senza menzione di fonti terze.

### D. Persistenza Totale
- Ogni impostazione, switch tema, stato del timer, risposte, sessioni, note e preferiti salvata istantaneamente in locale (**IndexedDB via Dexie + localStorage**).

### E. Autenticazione Google & Drive Cloud Backup
- Accesso Google (GIS).
- Backup e Restore in `appDataFolder` o file JSON con 1 tocco.

### F. Temi Visivi
- **Scuro**: Cockpit Dark (nero/ardesia).
- **Chiaro**: Hangar Light (alto contrasto per il sole).
- **Automatico**: Sincronizzato con il sistema operativo.

---

## 3. Database Quiz & Regolamento Esame

### 504 Quiz Ufficiali (Database AeCI 2017)
1. Normativa e Legislazione (1001-1040, 40 quiz)
2. Aerodinamica (2001-2150, 150 quiz)
3. Pronto Soccorso (3001-3020, 20 quiz)
4. Fisiopatologia del Volo (4001-4010, 10 quiz)
5. Meteorologia e Aerologia (5001-5120, 120 quiz)
6. Strumenti (6001-6020, 20 quiz)
7. Tecnica di Pilotaggio (7001-7079, 79 quiz)
8. Materiali (8001-8020, 20 quiz)
9. Sicurezza del Volo (9001-9045, 45 quiz)

### Standard Esame Ufficiale (Skill `vds-exam-examiner`)
- **30 quiz**, **45 minuti**, **max 3 errori** per l'idoneità (minimo 27 esatte).
- *(Opzione Maratona 60 quiz per allenamento intensivo).*

---

## 4. Architettura Tecnica
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons.
- **Data Layer**: Dexie.js (IndexedDB).
- **PWA**: vite-plugin-pwa (Workbox, 100% offline).
- **Cloud**: Google Identity Services + Google Drive REST API v3.
