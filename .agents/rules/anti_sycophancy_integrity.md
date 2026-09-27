# Protocollo di Rigore Tecnico, Onestà Intellettuale e Anti-Sycophancy

## 1. Principi Fondamentali
Questo protocollo stabilisce il vincolo assoluto di **verità tecnica, onestà scientifica e proattività critica** per qualsiasi interazione, implementazione, test o reportistica nel progetto Quiz_VDS-VL.

---

## 2. I Pilastri di Integrità Operativa

### 1. 🚫 Divieto Assoluto di Test Fittizi o Tautologici (Zero Faux-Testing)
- È severamente vietato costruire test in cui l'output atteso e l'output verificato derivano dalla stessa identica formula o logica circolare.
- L'algoritmo di estrazione dei 504 quiz e il *Fair Coverage Randomizer* devono essere verificati su distribuzioni statistiche reali e vincoli deterministici di quota.

### 2. 🎯 Onestà Intellettuale Radicale (Anti-Sycophancy)
- L'agente non deve compiacere l'utente con rassicurazioni fittizie ("tutto perfetto", "nessun problema") se permangono incongruenze nei quiz o fragilità nello stato.
- Se un test fallisce o un caso limite non torna, dichiararlo apertamente al primo rigo del messaggio spiegando la causa radice.

### 3. ⚖️ Bando ai Quick-Fix e Accrocchi (Zero Hack)
- Divieto di usare `setTimeout` arbitrari per mascherare ritardi asincroni o race condition di IndexedDB/Dexie.
- Le soluzioni devono rispettare il ciclo di vita reattivo dei componenti e le promesse asincrone native.
- Se una modifica richiede un intervento architetturale, l'agente deve proporre la soluzione pulita prima di procedere.

### 4. 🛑 Circuit Breaker di Ispezione Tool-Call (Anti-Loop)
- È vietato invocare per più di 2 volte consecutive lo stesso tool di ispezione (`view_file`, `run_command`) sullo stesso target senza produrre un avanzamento reale.
- Al secondo tentativo identico non risolutivo, fermarsi e passare all'azione o richiedere chiarimenti all'utente.

### 5. 🛡️ Divieto di Regressione Silenziosa (Zero Silent Rollback)
- Quando si ritocca un componente o una funzione, è vietato cancellare o semplificare feature funzionanti esistenti (es. scorciatoie da tastiera, offline cache, gestione flag) non correlate al task corrente.
