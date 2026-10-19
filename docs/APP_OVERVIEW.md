# Presentazione dell'Applicazione: Quiz VDS-VL

**Ultimo aggiornamento:** 19 Ottobre 2026  
**Applicazione Web (PWA):** [https://alessandroame.github.io/Quiz_VDS-VL/](https://alessandroame.github.io/Quiz_VDS-VL/)  
**Pagina Informativa Pubblica:** [https://alessandroame.github.io/Quiz_VDS-VL/about.html](https://alessandroame.github.io/Quiz_VDS-VL/about.html)  
**Informativa sulla Privacy:** [https://alessandroame.github.io/Quiz_VDS-VL/privacy-policy.html](https://alessandroame.github.io/Quiz_VDS-VL/privacy-policy.html)  
**Termini di Servizio:** [https://alessandroame.github.io/Quiz_VDS-VL/terms-of-service.html](https://alessandroame.github.io/Quiz_VDS-VL/terms-of-service.html)

---

## 1. Che cos'è Quiz VDS-VL

**Quiz VDS-VL** (*VDS-VL Quiz Master*) è una Progressive Web App (PWA) gratuita, open-source e funzionante al 100% offline, progettata per gli allievi piloti di **Volo Libero (Parapendio)** che preparano l'esame teorico per il conseguimento dell'attestato **VDS/VL (Volo da Diporto o Sportivo)** secondo i programmi ufficiali dell'**Aero Club d'Italia (AeCI)** e il **D.P.R. 9 luglio 2010, n. 133**.

L'applicazione offre un ambiente di studio ad alto contrasto, privo di pubblicità e di distrazioni visive, accessibile da smartphone (iOS e Android), tablet e computer desktop senza necessità di registrazione.

---

## 2. Funzionalità Principali

1. **Simulazione Esame Ufficiale AeCI**:
   - Estrazione di 30 quesiti ripartiti fedelmente secondo le quote ministeriali sulle 9 materie d'esame: Aerodinamica (9), Meteorologia (8), Tecnica di Pilotaggio (5), Normativa e Legislazione (2), Sicurezza del Volo (2), Primo Soccorso (1), Fisiopatologia del Volo (1), Strumenti di Volo (1), Materiali e Manutenzione (1).
   - Timer regolamentare di 45 minuti e calcolo automatico dell'idoneità (massimo 3 errori ammessi, minimo 27/30).
2. **Modalità Tutor Didattico (Flash 10, Standard 30, Continuo)**:
   - Studio guidato con verifica immediata ad ogni risposta e spiegazione tecnica strutturata in **Regola** (principio fisico o norma di legge) e **Tranello** (errore ricorrente o insidia lessicale del quesito).
3. **Studio per Materie e Archivio Completo**:
   - Consultazione e allenamento mirato su ciascuna delle 9 materie, ricerca rapida per parola chiave o codice identificativo ministeriale (`#ID`), salvataggio nei preferiti e annotazioni personali di studio.
4. **Quaderno degli Errori (Metodo Leitner)**:
   - Raccolta automatica di tutte le domande sbagliate durante lo studio o le simulazioni; un quesito viene rimosso dal quaderno solo dopo 2 risposte esatte consecutive.
5. **Modalità Mani Libere e Sintesi Vocale Offline**:
   - Lettura vocale italiana dei quesiti, delle opzioni e delle spiegazioni didattiche con possibilità di scaricare i pacchetti audio per l'uso offline e di rispondere tramite comandi vocali o macro-pulsanti tattili.
6. **Algoritmo Fair Coverage Randomizer**:
   - Sistema di estrazione bilanciata che assegna priorità alle domande non ancora incontrate e a quelle con il maggior tasso di errore, garantendo la copertura integrale del catalogo ufficiale.

---

## 3. Architettura dei Dati e Integrazione Google Drive (OAuth 2.0)

- **Funzionamento Locale (100% Client-Side)**: L'applicazione non utilizza server backend proprietari né richiede la creazione di un account per funzionare. Tutti i progressi di studio, gli esami svolti, gli errori e le note personali sono salvati localmente nel browser del dispositivo tramite tecnologia `IndexedDB` (`Dexie.js`).
- **Perché l'applicazione utilizza Google Sign-In / Google Drive API**:
  - L'integrazione con **Google Drive** è **totalmente facoltativa** e viene attivata solo su esplicita richiesta dell'utente nella sezione *Impostazioni -> Backup Cloud*.
  - Consente all'allievo pilota di salvare una copia di sicurezza dei propri progressi di studio (`vds_quiz_master_backup.json`) nel proprio spazio personale Google Drive e di sincronizzare automaticamente lo stato di preparazione tra più dispositivi (es. computer di casa e smartphone).
  - L'applicazione richiede esclusivamente gli ambiti ristretti e non sensibili `https://www.googleapis.com/auth/drive.appdata` e `https://www.googleapis.com/auth/drive.file`, limitando rigorosamente l'accesso ai soli file di backup creati dall'app stessa, senza alcuna visibilità sugli altri file o documenti personali presenti sul Google Drive dell'utente.

---

## 4. Riferimenti e Documentazione Legale

- **Applicazione Web:** [Avvia Quiz VDS-VL](https://alessandroame.github.io/Quiz_VDS-VL/)
- **Informativa sulla Privacy (Privacy Policy):** [Leggi la Privacy Policy](https://alessandroame.github.io/Quiz_VDS-VL/privacy-policy.html) ([Markdown](./PRIVACY_POLICY.md))
- **Termini e Condizioni di Servizio (Terms of Service):** [Leggi i Termini di Servizio](https://alessandroame.github.io/Quiz_VDS-VL/terms-of-service.html) ([Markdown](./TERMS_OF_SERVICE.md))
- **Manuale Utente Illustrato:** [Consulta il Manuale Utente](./MANUALE_UTENTE.md)
- **Codice Sorgente e Supporto:** [Repository GitHub Ufficiale](https://github.com/alessandroame/Quiz_VDS-VL)
