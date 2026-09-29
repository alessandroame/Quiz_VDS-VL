/**
 * Script per l'arricchimento didattico e la normalizzazione delle spiegazioni
 * per i soggetti P2:
 * - Materia 1: Normativa e Legislazione (1001 - 1040, 40 quiz)
 * - Materia 9: Sicurezza del Volo (9001 - 9045, 45 quiz)
 * Totale 85 quiz arricchiti con Regola e Tranello specifici.
 */

const fs = require('fs');
const path = require('path');

const P2_EXPLANATIONS = {
  // === Materia 1: Normativa e Legislazione (1001 - 1040) ===
  1001: {
    rule: "Il D.P.R. 133/2010 stabilisce che per volare legalmente servono attestato VDS/VL in corso di validità e polizza assicurativa RCT verso terzi attiva.",
    trap: "Pensare che basti aver frequentato la scuola o superato l'esame senza essere in possesso dell'attestato rilasciato da AeCI e dell'assicurazione."
  },
  1002: {
    rule: "Il pilota in comando ha la responsabilità esclusiva e indelegabile della condotta del mezzo, della pianificazione del volo e della sicurezza.",
    trap: "Ritenere che la responsabilità ricada sull'Ente di controllo o dipenda dal livello di anzianità ed esperienza del pilota."
  },
  1003: {
    rule: "L'età minima legale per l'attività VDS è 16 anni compiuti con l'assenso scritto di chi esercita la potestà genitoriale (18 anni per fare l'istruttore).",
    trap: "Confondere i 16 anni per il conseguimento dell'attestato con i 18 anni della maggiore età o con i 14 anni previsti per altri sport."
  },
  1004: {
    rule: "Il certificato di idoneità psicofisica per il VDS ha validità biennale (24 mesi), rinnovabile previa visita medica specialistica.",
    trap: "Ipotizzare scadenze annuali (12 mesi) o triennali (36 mesi), ignorando la periodicità fissa di due anni fissata dal regolamento."
  },
  1005: {
    rule: "L'assicurazione per la responsabilità civile verso terzi (RCT) sulla persona del pilota è obbligo di legge inderogabile per volare in VDS/VL.",
    trap: "Credere che l'assicurazione sia facoltativa o richiesta solo per gare, manifestazioni sportive e voli di distanza (cross-country)."
  },
  1006: {
    rule: "Chi è in fase di atterraggio (incluso il top landing sul decollo) ha sempre la precedenza assoluta su chiunque stia preparando o effettuando il decollo.",
    trap: "Pensare che chi decolla abbia la precedenza per liberare il pendio, dimenticando che chi è in volo ha opzioni di manovra limitate e prioritarie."
  },
  1007: {
    rule: "L'uso del casco protettivo omologato è obbligatorio per legge durante tutte le fasi del volo e del decollo/atterraggio in parapendio e deltaplano.",
    trap: "Ritenere che il casco sia solo una raccomandazione di buonsenso o che sia obbligatorio esclusivamente per il deltaplano."
  },
  1008: {
    cleanOpt1: "Qualsiasi spazio aereo purché ad una quota inferiore ai 1000 piedi.",
    rule: "Il volo libero si pratica nello spazio aereo non controllato (classe G), salvo corridoi o riserve di spazio aereo autorizzate con specifico NOTAM.",
    trap: "Confondere lo spazio controllato (riservato al traffico IFR/commerciale) con quello non controllato in cui il VDS opera a vista."
  },
  1009: {
    rule: "La segregazione degli spazi aerei serve a separare fisicamente gli aeromobili veloci IFR/commerciali dai mezzi lenti da diporto, prevenendo collisioni in volo.",
    trap: "Vedere la suddivisione dello spazio come una discriminazione burocratica verso il volo libero anziché come presidio fondamentale di sicurezza."
  },
  1010: {
    rule: "Nel volo libero non esiste una quota minima fissa in piedi: la regola impone di mantenere sempre una quota utile a raggiungere un atterraggio sicuro senza rischi per terzi.",
    trap: "Applicare al volo libero le quote minime degli apparecchi a motore (500 o 1000 ft), ignorando che il mezzo privo di motore vola sfruttando i pendii."
  },
  1011: {
    rule: "Le regole VFR impongono al pilota di rimanere costantemente al di fuori delle nubi e con continuo contatto visivo col terreno o la superficie acquea.",
    trap: "Cercare distanze geometriche fisse (es. 1000m): la norma base del volo libero è non entrare mai in nube e vedere sempre il suolo."
  },
  1012: {
    rule: "Volare in nube è vietato per l'impossibilità di garantire la separazione visiva da ostacoli e per l'inevitabile perdita dell'orientamento spaziale.",
    trap: "Credere che la docilità di comando del parapendio permetta di volare alla cieca senza riferimenti visivi dell'orizzonte."
  },
  1013: {
    rule: "Il VDS è consentito unicamente durante il giorno aeronautico: da 30 minuti prima del sorgere del sole a 30 minuti dopo il tramonto (effemeridi ufficiali).",
    trap: "Pensare che le effemeridi servano per la navigazione astronomica con le stelle anziché per conoscere i limiti legali di luce effettiva."
  },
  1014: {
    rule: "La normativa attuale consente l'attività di volo libero anche entro la fascia di 4 km dal confine di Stato, salvo specifiche zone vietate (P).",
    trap: "Ricordare vecchi divieti storici di frontiera ormai superati dal D.P.R. 133/2010 per gli apparecchi privi di motore."
  },
  1015: {
    rule: "Deltaplano e parapendio sono giuridicamente classificati come apparecchi per il Volo da Diporto o Sportivo (VDS) privi di motore.",
    trap: "Classificarli erroneamente come alianti (aeromobili immatricolati ENAC) o semplici aerostati."
  },
  1016: {
    rule: "È lo spazio aereo all'interno del quale gli aeromobili volano sotto il controllo e le istruzioni vincolanti dei servizi di traffico aereo (ATC civili/militari).",
    trap: "Credere che controllato significhi semplicemente 'sorvegliato da radar militari' senza implicare la separazione attiva del traffico."
  },
  1017: {
    rule: "Nello spazio aereo controllato opera il traffico commerciale/militare: gli apparecchi VDS/VL sono esclusi salvo specifica e preventiva autorizzazione.",
    trap: "Pensare che nei festivi gli spazi aerei controllati siano aperti liberamente al volo libero."
  },
  1018: {
    rule: "L'ingresso in spazi controllati (CTR, TMA, ATZ) da parte del volo libero richiede categoricamente un'autorizzazione preventiva dell'autorità competente.",
    trap: "Ritenere sufficiente la presenza di condizioni VMC (volo a vista) per entrare in spazio controllato senza autorizzazione."
  },
  1019: {
    rule: "È obbligatorio mantenersi ad almeno 5 km di distanza dal perimetro di qualsiasi aeroporto non dotato di ATZ protetta.",
    trap: "Avvicinarsi fino a 1 km o credere che basti un margine di quota per sorvolare il traffico di un aeroporto."
  },
  1020: {
    rule: "L'ATZ è la porzione di spazio aereo controllato a protezione immediata del circuito di traffico e delle manovre di un aerodromo.",
    trap: "Confondere l'ATZ con l'area di smistamento a terra (vie di rullaggio) o con le holding di attesa in rotta."
  },
  1021: {
    rule: "Il volo libero è vietato all'interno delle ATZ, salvo specifiche deroghe autorizzate dall'Ente aeroportuale competente.",
    trap: "Pensare che l'assenza visiva di aeroplani autorizzi a entrare e veleggiare liberamente nell'ATZ."
  },
  1022: {
    rule: "Il CTR è uno spazio aereo controllato che si estende dal suolo verso l'alto per proteggere le traiettorie di avvicinamento e decollo degli aeroporti.",
    trap: "Ritenere che il CTR non parta dal livello del suolo o che sia riservato esclusivamente a basi aeree militari."
  },
  1023: {
    rule: "È vietato impegnare un CTR in volo libero senza esplicita autorizzazione dell'Ente del traffico aereo che gestisce la zona.",
    trap: "Credere che nei fine settimana il CTR sia disattivato o accessibile a vista senza autorizzazione."
  },
  1024: {
    rule: "La TMA è una regione di spazio aereo controllato posta alla confluenza di più aerovie sopra e attorno a uno o più aeroporti principali.",
    trap: "Confondere la TMA con uno spazio aereo militare non controllato o con corridoi riservati."
  },
  1025: {
    rule: "L'ingresso in TMA con deltaplano o parapendio è consentito unicamente previa esplicita autorizzazione dell'Ente ATC competente.",
    trap: "Ipotizzare l'accesso libero purché non si incrocino aerei commerciali in decollo o atterraggio."
  },
  1026: {
    rule: "L'aerovia è un corridoio di spazio aereo controllato a forma di parallelepipedo che collega punti di navigazione per le rotte commerciali.",
    trap: "Confondere l'aerovia con una via di rullaggio (taxiway) presente sulla pista aeroportuale."
  },
  1027: {
    rule: "È categoricamente vietato impegnare le aerovie (AWY) con apparecchi da volo libero, a causa della velocità e densità del traffico commerciale.",
    trap: "Pensare che l'assenza momentanea di velivoli consenta il transito o l'aggancio di termiche lungo l'aerovia."
  },
  1028: {
    rule: "La zona P (Prohibited) è uno spazio aereo permanente in cui il sorvolo è vietato a qualsiasi aeromobile per motivi di sicurezza nazionale o obiettivi sensibili.",
    trap: "Ritenere che la lettera P indichi uno spazio riservato al solo parapendio."
  },
  1029: {
    rule: "La zona D (Danger) indica un volume di spazio aereo all'interno del quale si svolgono attività pericolose per il volo (es. tiri d'artiglieria, lanci).",
    trap: "Interpretare la lettera D come zona dedicata al deltaplano anziché come area di potenziale pericolo letale."
  },
  1030: {
    rule: "La zona R (Restricted) è uno spazio aereo in cui il volo è subordinato a specifiche condizioni e autorizzazioni per la presenza di attività speciali.",
    trap: "Confondere 'Regolamentata' con 'Raccomandata' per il volo da diporto."
  },
  1031: {
    rule: "Nel volo libero è normalmente vietato entrare nelle zone P (vietate) e D (pericolose) pubblicate sulle carte aeronautiche AIP.",
    trap: "Pensare che nei giorni festivi le zone proibite o pericolose decadano automaticamente senza NOTAM."
  },
  1032: {
    rule: "La regola d'aria inderogabile stabilisce che il primo pilota che imposta la termica decide il senso di rotazione (orario o antiorario) per tutti gli altri.",
    trap: "Ritenere che decida l'esperienza, la presenza del cumulo o che si debba virare sempre a destra."
  },
  1033: {
    rule: "Gli apparecchi privi di motore hanno sempre la precedenza sui velivoli a motore in caso di rotte convergenti, in quanto meno veloci e manovrabili.",
    trap: "Pensare che l'apparecchio a motore abbia la precedenza perché più pesante o veloce."
  },
  1034: {
    rule: "In caso di rotte frontali/convergenti alla stessa quota, entrambi i piloti devono virare verso destra mantenendosi a vista per evitare la collisione.",
    trap: "Pensare che chi viene da destra continui diritto: nel fronteggiamento frontale entrambi virano a destra."
  },
  1035: {
    rule: "Chi vola con il pendio alla propria destra ha la precedenza e prosegue; chi ha il pendio a sinistra deve virare a destra allontanandosi dal costone.",
    trap: "Virare verso il monte o pretendere la precedenza pur avendo il pendio sul lato sinistro."
  },
  1036: {
    rule: "A parità di mezzo ha precedenza il biposto; tra mezzi diversi ha precedenza il mezzo con minore manovrabilità e velocità (parapendio biposto > deltaplano).",
    trap: "Dare la precedenza al monoposto per agilità o confondere le gerarchie di manovrabilità tra i diversi mezzi."
  },
  1037: {
    rule: "In circuito di atterraggio il velivolo che vola a quota inferiore ha la precedenza assoluta, poiché dispone di minor tempo e opzioni per impostare il finale.",
    trap: "Dare la precedenza ai piloti più esperti o ai mezzi più lenti indipendentemente dalla quota reale sul terreno."
  },
  1038: {
    rule: "Nel volo libero il mezzo non è immatricolato: l'assicurazione obbligatoria per legge è stipulata sul pilota (RCT del pilota), non sull'apparecchio.",
    trap: "Rispondere Sì dimenticando che parapendii e deltaplani non hanno targa: la polizza copre la persona del pilota."
  },
  1039: {
    rule: "L'autorità aeronautica competente in prima istanza per la vigilanza e le infrazioni alla normativa VDS è la Direzione Aeroportuale ENAC di circoscrizione.",
    trap: "Rivolgersi genericamente alla polizia municipale o ai carabinieri, che non sono autorità di navigazione aerea."
  },
  1040: {
    cleanOpt3: "Attestato di pilota in corso di validità, buona esperienza di volo, condizioni meteo favorevoli.",
    rule: "Il trasporto del passeggero richiede il superamento di un esame specifico per il conseguimento dell'abilitazione al biposto su attestato valido.",
    trap: "Pensare che basti accumulare un certo numero di ore di volo per portare legalmente un passeggero."
  },

  // === Materia 9: Sicurezza del Volo (9001 - 9045) ===
  9001: {
    rule: "La sicurezza attiva risiede nell'equilibrio perfetto tra il livello tecnico reale del pilota e l'esigenza di pilotaggio dell'ala scelta.",
    trap: "Credere che un'ala performante protegga il pilota inesperto o che il mezzo sia ininfluente."
  },
  9002: {
    rule: "Valutare correttamente l'intensità di vento, turbolenza e attività termica rispetto ai propri limiti è la prima garanzia di incolumità.",
    trap: "Pensare che l'esperienza consenta di affrontare qualsiasi condizione aerologica estrema senza rischi."
  },
  9003: {
    rule: "Modifiche sartoriali o strutturali non certificate alterano l'equilibrio di stabilità dell'ala, esponendo a reazioni imprevedibili e stalli.",
    trap: "Fidarsi delle rassicurazioni verbali o provare il mezzo modificato al limite delle prestazioni."
  },
  9004: {
    rule: "I materiali tessili e i metalli invecchiano anche fermi nella sacca: le scadenze del costruttore (porosità, calettamento) vanno sempre rispettate.",
    trap: "Pensare di revisionare il mezzo solo quando manifesta difetti evidenti di volo o ridurre i controlli se si vola poco."
  },
  9005: {
    rule: "La check-list pre-volo standardizzata individua fascio accavallato, nodi, maillons aperti e mancato aggancio prima del distacco dal suolo.",
    trap: "Credere che l'esperienza pluriennale o la freccia mentale permettano di saltare la verifica sistematica a terra."
  },
  9006: {
    cleanQuestion: "Se avete dei dubbi sulle condizioni meteo in rapporto alla vostra attrezzatura e/o esperienza, pur avendo sentito il parere di un pilota più esperto:",
    rule: "In aviazione il dubbio è una certezza di stop: se le condizioni generano incertezza, l'unica decisione corretta è rinunciare al volo.",
    trap: "Farsi condizionare dal gruppo o cercare finché non si trova qualcuno che dice che si può decollare."
  },
  9007: {
    rule: "Ali con allungamento elevato richiedono controllo attivo istantaneo e preciso: un pilota novizio non ha i riflessi per gestire le chiusure.",
    trap: "Pensare che un'ala con alte prestazioni garantisca maggior sicurezza per via della sola efficienza di planata."
  },
  9008: {
    rule: "In siti sconosciuti la fretta è letale: attendere che il ciclo termico o la brezza si calmino permette di comprendere l'aerologia locale.",
    trap: "Decollare per imitazione sociale perché altri stanno volando, ignorando che ogni pilota ha limiti differenti."
  },
  9009: {
    rule: "Col vento in coda la velocità di stacco all'aria richiede una velocità al suolo insostenibile a piedi e degrada la pendenza di salita.",
    trap: "Sottovalutare la velocità necessaria alla corsa di decollo o credere che l'ala si gonfi normalmente."
  },
  9010: {
    rule: "Il gradino verticale genera un rotore sottovento e una bolla di ristagno che collassa l'ala o la rigonfia in modo incontrollabile.",
    trap: "Ritenere il dirupo spettacolare o facile perché 'ci si stacca subito', ignorando la turbolenza del gradino."
  },
  9011: {
    rule: "L'attività convettiva intensa all'interno e sotto la base del cumulo può superare i 10-15 m/s, rendendo inefficace qualsiasi manovra di discesa.",
    trap: "Temere solo i fulmini e non il risucchio violento che trascina l'apparecchio dentro la nube a quote ipossiche."
  },
  9012: {
    rule: "Senza orizzonte naturale visivo, il cervello subisce illusioni gravissime perdendo il controllo dell'assetto e finendo in spirale.",
    trap: "Pensare che il pericolo maggiore sia il freddo o il ghiaccio, mentre è la disorientamento vestibolare letale."
  },
  9013: {
    rule: "Il gradiente di vento o wind shear è una variazione repentina di direzione e/o velocità del vento nello spazio o nel tempo.",
    trap: "Confondere il wind shear con una semplice raffica lineare o con l'aumento continuo del vento con la quota."
  },
  9014: {
    rule: "Per inerzia del sistema, la cessazione istantanea del vento lascia l'ala senza flusso relativo, provocando stallo immediato e perdita d'assetto.",
    trap: "Credere che l'ala conservi istantaneamente la velocità all'aria precedente senza risentire dell'arresto del vento."
  },
  9015: {
    rule: "È qualsiasi assetto anomalo (chiusure, stallo, vite, autorotazione) che porta il mezzo al di fuori dei parametri certificati di stabilità.",
    trap: "Considerare inusuale solo un assetto con cui il pilota non ha familiarità ma che è normale per il mezzo."
  },
  9016: {
    rule: "L'omologazione garantisce che le reazioni alle manovre standardizzate siano documentate, ripetibili e conformi alla classe d'uso.",
    trap: "Pensare che l'omologazione renda l'ala immune da incidenti o che un'ala certificata non possa mai chiudere."
  },
  9017: {
    rule: "Le gole e valli strette creano effetto Venturi: la massa d'aria si comprime accelerando e generando turbolenze feroci a terra.",
    trap: "Cercare atterraggi sul fondo valle sottovalutando la violenza e i cambi di direzione del vento incanalato."
  },
  9018: {
    rule: "Gli ostacoli sopravento generano rotori turbolenti discensionali imprevedibili capaci di provocare chiusure catastrofiche a pochi metri da terra.",
    trap: "Ritenere che l'abilità tecnica consenta di dominare un rotore violento sottovento a palazzi, alberi o costoni."
  },
  9019: {
    rule: "Volare con angolo di deriva (a granchio) mantiene velocità all'aria e controllo direzionale, evitando di essere spazzati indietro fuori campo.",
    trap: "Impostare virate standard a favore di vento che portano a superare il campo o atterrare arretrando alla cieca."
  },
  9020: {
    rule: "Rallentare l'impatto controvento sul tetto degli alberi e proteggere testa e collo con le braccia evita ferite da rami spezzati.",
    trap: "Tentare disperate virate tra i tronchi a terra o spiralare stretto su micro-radure a bassa quota."
  },
  9021: {
    rule: "Le fibbie dell'imbrago vanno slacciate prima di toccare l'acqua: una volta immersi, vele e cordini bagnati tirano a fondo il pilota.",
    trap: "Aspettare di essere sott'acqua per slacciare l'imbrago: il panico e il peso dell'attrezzatura rendono lo sgancio impossibile."
  },
  9022: {
    rule: "Vicino a terra non c'è margine di quota: qualsiasi beccheggio, chiusura o stallo indotto da comandi bruschi causa l'impatto prima del recupero.",
    trap: "Attribuire la delicatezza dei comandi all'effetto suolo o alla densità dell'aria anziché al fattore tempo/quota."
  },
  9023: {
    rule: "Senza cosciali, al momento dello stacco il pilota scivola inesorabilmente fuori dall'imbrago, non potendo reggersi a braccia.",
    trap: "Pensare che il solo pettorale chiuda la selletta o che ci si possa aggrappare con le mani agli elevatori."
  },
  9024: {
    rule: "Se l'ala sale storta, sgonfia o cravattata, si frena energicamente annullando il decollo prima di raggiungere il ciglio del pendio.",
    trap: "Accelerare la corsa sperando che la vela si sistemi in volo, finendo lanciati nel vuoto con mezzo fuori controllo."
  },
  9025: {
    rule: "Lo studio del bollettino aerologico, della stabilità e del vento in quota permette di prevedere fronti, temporali e inversioni.",
    trap: "Pensare che guardare il cielo al decollo basti o che una previsione favorevole esoneri dalla vigilanza attiva in volo."
  },
  9026: {
    rule: "La cravatta genera resistenza e asimmetria massiccia: l'ala vira violentemente verso il lato chiuso schiantando il pilota sul pendio.",
    trap: "Sottovalutare la cravatta pensando che si riapra da sola o che si possa contrastarla senza fatica."
  },
  9027: {
    rule: "Trazionare delicatamente gli elevatori C o D (posteriori) consente il controllo direzionale e la frenata in atterraggio senza stallo.",
    trap: "Pilotare solo con il freno superstite (rischio di autorotazione o stallo d'ala) o fare manovre brusche vicino al terreno."
  },
  9028: {
    rule: "La norma EN/LTF classifica le ali per livello di abilità: la sicurezza omologata richiede pilota idoneo e regolazione corretta della selletta.",
    trap: "Credere che un'ala avanzata EN-C o D sia sicura per un allievo solo perché ha superato i test di omologazione."
  },
  9029: {
    rule: "Le ali di classe scuola (EN-A) riaprono spontaneamente senza intervento entro limiti rigorosi di geometria e larghezza del ventrale.",
    trap: "Pensare che l'ala si comporti da classe A anche con ventrali strettissimi o allargati fuori specifica del costruttore."
  },
  9030: {
    rule: "Sulle ali performanti le chiusure richiedono pilotaggio attivo tempestivo per prevenire cascate di stalli, rotazioni e cravatte.",
    trap: "Attendere passivamente che l'ala si rimetta da sola come una vela scuola, lasciando degenerare l'autorotazione."
  },
  9031: {
    rule: "La priorità assoluta è impedire l'autorotazione contrastando con peso e leggero freno sul lato sano; solo stabilizzata la rotta si pompa il lato chiuso.",
    trap: "Tirare d'istinto il freno del lato collassato prima di fermare la rotazione, provocando lo stallo dell'unica semiala portante."
  },
  9032: {
    rule: "Rilasciare i comandi fa ripartire il flusso d'aria e riapre il bordo d'attacco; bisogna poi frenare prontamente la picchiata dell'ala.",
    trap: "Frenare mentre l'ala è chiusa e dietro al pilota, prolungando lo stallo e innescando violente configurazioni inusuali."
  },
  9033: {
    rule: "Alzare prontamente e simmetricamente le mani permette al profilo stallato di riprendere velocità; va poi frenato l'abbattimento in avanti.",
    trap: "Affondare anche l'altro freno trasformando la vite in stallo profondo, o rilasciare asimmetricamente peggiorando la rotazione."
  },
  9034: {
    rule: "Mantenere i comandi affondati dopo il distacco del flusso provoca il collasso posteriore e la deformazione caotica della calotta.",
    trap: "Ritenere il post-stallo una fase tranquilla e controllabile, senza comprendere il rischio di chiusure a ferro di cavallo."
  },
  9035: {
    rule: "Rilasciare gli elevatori B troppo lentamente o volare una vela porosa impedisce la riattaccatura del flusso: l'ala sprofonda paracadutando.",
    trap: "Credere che sia colpa di un rilascio troppo rapido o che la porosità del tessuto non c'entri con il mancato avanzamento."
  },
  9036: {
    rule: "Bisogna abbassare l'angolo d'incidenza spingendo sulle bretelle A o premendo l'acceleratore per far ripartire la velocità all'aria.",
    trap: "Tirare i freni istintivamente per 'sostenere' l'ala, finendo per consolidare definitivamente lo stallo paracadutale."
  },
  9037: {
    rule: "L'assistente non può percepire le pressioni sul trapezio avvertite dal pilota e rischia di alterare incidenza e rollio provocando lo stallo.",
    trap: "Pensare che l'aiuto fisico sia sempre benefico, ignorando la perdita di sensibilità del pilota al momento dello stacco."
  },
  9038: {
    rule: "La mancata connessione del moschettone alla cinghia di sospendita provoca la caduta nel vuoto del pilota non appena il deltaplano decolla.",
    trap: "Credere di potersi sostenere a braccia sul trapezio durante il volo senza essere vincolati alla struttura."
  },
  9039: {
    rule: "Senza antidrappo la vela in assetto picchiato perde stabilità e precipita avvitandosi: il soccorso va lanciato subito prima della VNE.",
    trap: "Attendere di raggiungere velocità estreme sperando di riprendere il mezzo col trapezio, distruggendo il soccorso all'apertura."
  },
  9040: {
    rule: "La picchiata preliminare e la violenta richiamata inducono velocità e fattori di carico (+G) superiori ai limiti strutturali di travi e cavi.",
    trap: "Ritenere che il pericolo risieda solo nella velocità iniziale o solo nella fase rovesciata della manovra."
  },
  9041: {
    rule: "Il tumbling è una serie di rotazioni complete a 360° attorno all'asse trasversale (beccheggio in avanti), con collasso strutturale.",
    trap: "Confondere il tumbling (beccheggio distruttivo) con l'imbardata o con le viti attorno all'asse longitudinale."
  },
  9042: {
    rule: "Una forte cabrata a bassa velocità combinata con una raffica discendente provoca lo stallo a campana e la capottata in avanti.",
    trap: "Pensare che il tumbling sia causato solo da velocità eccessiva o da virate in termica sostenuta."
  },
  9043: {
    rule: "Si lancia solo se il mezzo è irrecuperabile, ma una volta presa la decisione non si deve esitare: ogni secondo costa quota vitale.",
    trap: "Indugiare tentando manovre disperate fino a quote inferiori ai 50 metri dove il paracadute non ha tempo di dispiegarsi."
  },
  9044: {
    rule: "Il soccorso si estrae per avarie strutturali o configurazioni stallo/vite irreversibili, lanciando con vigore la sacca verso lo spazio libero.",
    trap: "Lanciare per semplice turbolenza o tirare la maniglia senza scagliare con decisione la sacca lontano dal fascio funicolare."
  },
  9045: {
    rule: "La maggior parte dei soccorsi è a calotta emisferica fissa: discendono col vento senza controllo del punto di impatto (fili, rocce, tetti).",
    trap: "Ritenere che il soccorso consenta di atterrare dove si vuole o che si possa sempre pilotare con precisione fino a terra."
  }
};

function enrichQuestionsFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const questions = JSON.parse(raw);

  let updatedCount = 0;
  for (const q of questions) {
    const meta = P2_EXPLANATIONS[q.id];
    if (meta) {
      q.explanation = {
        rule: meta.rule,
        trap: meta.trap
      };
      if (meta.cleanQuestion) {
        q.question = meta.cleanQuestion;
      }
      if (meta.cleanOpt1 && q.options && q.options.length === 3) {
        q.options[0] = meta.cleanOpt1;
      }
      if (meta.cleanOpt3 && q.options && q.options.length === 3) {
        q.options[2] = meta.cleanOpt3;
      }
      updatedCount++;
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(questions, null, 2) + '\n', 'utf8');
  console.log(`[OK] Aggiornate ${updatedCount} domande in: ${filePath}`);
}

const srcFile = path.resolve(__dirname, '../src/data/questions.json');
const publicFile = path.resolve(__dirname, '../public/data/questions.json');

enrichQuestionsFile(srcFile);
enrichQuestionsFile(publicFile);
