/**
 * Script per l'arricchimento didattico e la normalizzazione delle spiegazioni
 * per i soggetti P1:
 * - Materia 4: Fisiopatologia del Volo (4001 - 4010, 10 quiz)
 * - Materia 6: Strumenti (6001 - 6020, 20 quiz)
 * - Materia 3: Pronto Soccorso (3001 - 3020, 20 quiz)
 * Totale 50 quiz arricchiti con Regola scientifica e Tranello cognitivo specifici.
 */

const fs = require('fs');
const path = require('path');

const P1_EXPLANATIONS = {
  // === Materia 4: Fisiopatologia del Volo (4001 - 4010) ===
  4001: {
    rule: "Con la quota la pressione atmosferica totale cala: pur restando costante la percentuale di ossigeno (21%), la sua pressione parziale alveolare si riduce proporzionalmente.",
    trap: "Credere che la percentuale di ossigeno nell'aria diminuisca in quota, mentre a ridursi è unicamente la pressione parziale che ne consente l'assorbimento polmonare."
  },
  4002: {
    rule: "L'ipossia è la carenza di ossigeno a livello dei tessuti biologici dovuta al ridotto gradiente barometrico tra alveoli polmonari e globuli rossi.",
    trap: "Confondere ipossia (carenza di ossigeno) con ipotermia (abbassamento della temperatura corporea) o ipotensione (calo della pressione sanguigna)."
  },
  4003: {
    rule: "L'ipossia da quota (altitudinale o ipobarica) dipende direttamente dal deficit di pressione alveolare dell'O2, che riduce la saturazione dell'emoglobina arteriosa.",
    trap: "Attribuire l'ipossia a cali della pressione arteriosa o a sbalzi termici, ignorando che la causa primaria è la ridotta tensione dell'ossigeno nell'aria inspirata."
  },
  4004: {
    rule: "Il cervello soffre per primo il deficit di O2: compaiono euforia ingiustificata, perdita di senso critico, rallentamento dei riflessi e iperventilazione compensatoria.",
    trap: "La sensazione ingannevole di euforia o benessere fa sottovalutare il pericolo, impedendo al pilota di riconoscere l'imminente perdita di coscienza."
  },
  4005: {
    cleanOpt3: "Permanenza ad alta quota dopo lungo periodo di ambientamento.",
    rule: "Una rapida perdita di pressione atmosferica provoca la liberazione di azoto disciolto nel sangue sotto forma di bolle gassose (legge di Henry), causando aeroembolismo.",
    trap: "Pensare che l'embolismo dipenda dalla durata della permanenza in quota o da salite lente: il fattore scatenante primario è la rapidità del salto barometrico verso quote estreme."
  },
  4006: {
    rule: "L'organismo sopporta accelerazioni positive (+Gz) fino a 4-5G prima del blackout, mentre tollera solo -2G o -3G negative prima della visione rossa e danni encefalici.",
    trap: "Pensare che le accelerazioni negative siano meno gravose, mentre l'afflusso massiccio di sangue alla testa (-Gz) provoca ipertensione cranica e rischi vascolari immediati."
  },
  4007: {
    rule: "Nella virata corretta la forza centrifuga si somma vettorialmente alla gravità, aumentando il fattore di carico verticale (+Gz) e schiacciando il pilota sull'imbraco.",
    trap: "Ritenere che il volo rettilineo in picchiata generi carico positivo, mentre l'aumento di 'G' richiede una curvatura della traiettoria come virate strette o richiamate."
  },
  4008: {
    rule: "Una brusca spinta in picchiata o cresta d'onda verso il basso produce accelerazioni verso l'alto (-Gz), riducendo il carico apparente e spingendo il sangue verso la testa.",
    trap: "Confondere la richiamata (che aumenta i G positivi) con la picchiata brusca (che riduce il carico o genera G negativi con tendenza a fluttuare dall'imbrago)."
  },
  4009: {
    rule: "Sotto +4G prolungati per oltre 4 secondi, la pressione cardiaca non riesce a pompare sangue agli occhi e al cervello: si passa da visione a tunnel, a 'greyout', fino al blackout.",
    trap: "Credere che l'oscuramento visivo avvenga con accelerazioni negative (che provocano invece visione rossa o 'redout') o sottovalutare la variabile tempo di esposizione."
  },
  4010: {
    cleanOpt3: "Si, se l'equilibrio è affinato da adeguato addestramento.",
    rule: "Senza riferimenti visivi orizzontali, l'apparato vestibolare subisce illusioni sensoriali gravissime ('somatogiriche'): in pochi secondi si perde l'orientamento spaziale entrando in vite.",
    trap: "Ritenere che la sensibilità dell'orecchio interno o l'esperienza permettano di percepire l'assetto: le forze centrifughe ingannano inevitabilmente il labirinto auricolare."
  },

  // === Materia 6: Strumenti (6001 - 6020) ===
  6001: {
    rule: "L'altimetro aeronautico misura la quota rispetto a un piano isobarico di riferimento (es. livello del mare QNH o quota di decollo QFE), non la distanza dal terreno sottostante.",
    trap: "Confondere l'altitudine (quota rispetto al mare) con l'altezza assoluta dal terreno, che può essere rilevata unicamente da radioaltimetri o sensori ottici/laser."
  },
  6002: {
    rule: "È un barometro graduato in metri o piedi secondo l'atmosfera standard: rileva la pressione statica locale tramite capsula o sensore piezoresistivo e la traduce in quota.",
    trap: "Ipotizzare che l'altimetro misuri direttamente distanze geometriche o velocità, dimenticando che è a tutti gli effetti un misuratore di pressione dell'aria circostante."
  },
  6003: {
    rule: "L'avvezione di masse d'aria modifica la pressione al suolo indipendentemente dall'altitudine: l'altimetro deve essere tarato sul valore barometrico locale prima di ogni volo.",
    trap: "Ritenere che a una certa quota corrisponda sempre la stessa pressione fissa, ignorando le continue oscillazioni dei sistemi barici (alta e bassa pressione)."
  },
  6004: {
    rule: "Durante la durata del volo la pressione atmosferica locale è variata per il passaggio di un fronte o per riscaldamento diurno, causando una deriva della lettura strumentale.",
    trap: "Ritenere che lo strumento sia guasto, senza considerare che il passaggio da alta a bassa pressione ('da alta a bassa occhio alla cassa') falsa la quota indicata."
  },
  6005: {
    rule: "Il codice QNH tara la scala altimetrica sulla pressione al livello medio del mare (MSL): a terra l'altimetro segnerà l'elevazione geografica del decollo riportata sulle carte.",
    trap: "Confondere l'altitudine riferita al mare (QNH) con l'altezza da terra del decollo (QFE, che a terra segna zero), o con la distanza libera dal terreno sorvolato (altezza)."
  },
  6006: {
    cleanOpt3: "È lo strumento che in volo misura la velocità all'aria.",
    rule: "Il variometro misura il rateo di salita o di discesa (velocità verticale) espresso in m/s o ft/min, calcolando la rapidità con cui varia la pressione atmosferica.",
    trap: "Confondere la velocità verticale lungo l'asse Z con la velocità di avanzamento all'aria lungo la traiettoria di volo (misurata invece dall'anemometro)."
  },
  6007: {
    rule: "Rileva la differenza di pressione tra una camera a volume costante (serbatoio compensato o sensore MEMS) e l'aria esterna attraverso un orifizio calibrato o capillare.",
    trap: "Pensare che il variometro misuri gradienti termici, mentre rileva puramente variazioni barometriche nel tempo (dp/dt)."
  },
  6008: {
    rule: "Segnali acustici e visivi di forte ascendenza sotto nubi cumuliformi avvertono tempestivamente dell'aspirazione della nube, permettendo manovre di discesa rapida prima dell'intrappolamento.",
    trap: "Considerare il variometro solo un accessorio per prolungare il veleggiamento, trascurando il suo ruolo vitale nell'evitare risucchi all'interno di cumuli temporaleschi."
  },
  6009: {
    rule: "L'anemometro rileva la velocità relativa della massa d'aria che investe il velivolo (Airspeed), elemento da cui dipendono direttamente la portanza e la sicurezza aerodinamica.",
    trap: "Confondere la velocità all'aria (IAS) con la velocità al suolo (GS), che risente della componente favorevole o contraria del vento."
  },
  6010: {
    rule: "Nei tubi di Pitot misura la differenza tra pressione totale e pressione statica (pressione dinamica q = 1/2*rho*v^2), oppure sfrutta la rotazione di micro-giranti calibrate.",
    trap: "Credere che l'anemometro misuri la pressione statica o l'energia termica, anziché l'energia cinetica della pressione d'impatto del vento relativo."
  },
  6011: {
    rule: "La velocità all'aria (TAS/IAS) coincide con la velocità al suolo (Ground Speed) solo ed esclusivamente quando il vento meteorologico è nullo (aria perfettamente immobile).",
    trap: "Ritenere che l'anemometro indichi sempre la velocità rispetto ai punti geografici a terra, ignorando che l'aria in movimento trasla l'intero velivolo."
  },
  6012: {
    rule: "La bussola magnetica si orienta spontaneamente lungo le linee di forza del campo magnetico terrestre, puntando verso il polo Nord magnetico e non verso quello geografico.",
    trap: "Dare per scontato che la bussola indichi il Nord geografico (asse di rotazione terrestre), trascurando l'angolo di declinazione magnetica locale."
  },
  6013: {
    rule: "Un equipaggio magnetico mobile (ago o disco graduato) galleggia in un liquido smorzante allineandosi al vettore orizzontale del campo geomagnetico.",
    trap: "Pensare che sfrutti principi meccanici basati sui meridiani o che punti al nord geografico senza l'interazione magnetica naturale."
  },
  6014: {
    rule: "Campi magnetici ed elettromagnetici generati da batterie, radio, smartphone e altoparlanti inducono deviazioni bussola gravissime, rendendo l'indicazione di rotta errata.",
    trap: "Ritenere la bussola immune da influenze esterne perché 'autonoma', montandola a stretto contatto con dispositivi elettronici attivi o masse ferrose."
  },
  6015: {
    rule: "I poli magnetici non coincidono con i poli geografici: la differenza angolare tra la direzione del Nord geografico e del Nord magnetico è detta declinazione magnetica.",
    trap: "Credere che polo geografico e magnetico siano nello stesso punto, o che la variazione dipenda dall'alternarsi delle stagioni dell'anno."
  },
  6016: {
    rule: "Senza orizzonte artificiale (giroscopio d'assetto), il pilota non ha modo di conoscere beccheggio e rollio: gli strumenti di volo libero non consentono in alcun modo il volo IFR.",
    trap: "Confondere la conoscenza della quota e del rateo di salita con il controllo dell'assetto spaziale: senza orizzonte si finisce inevitabilmente in spirale picchiata."
  },
  6017: {
    rule: "Il GPS calcola lo spostamento trigonometrico tra coordinate geografiche satellitari nel tempo: fornisce quindi esclusivamente la velocità al suolo (Ground Speed) e la rotta (Track).",
    trap: "Confondere la velocità al suolo fornita dal GPS con la velocità all'aria: il GPS non può avvisare dell'avvicinamento allo stallo se si vola con forte vento in coda."
  },
  6018: {
    rule: "Il GPS non fornisce l'assetto istantaneo (rollio/beccheggio) e ha latenza di calcolo: inoltre l'umidità e la geometria satellitare possono degradare il segnale, vietando il volo cieco.",
    trap: "Pensare che la mappa mobile o la traccia GPS bastino a navigare in sicurezza dentro una nube privi di visibilità naturale dell'orizzonte."
  },
  6019: {
    rule: "Se il vento contrario supera la velocità propria all'aria del velivolo, la velocità al suolo si azzera e diventa negativa rispetto alla prua: si retrocede verso nord e serve accelerare.",
    trap: "Pensare a un malfunzionamento dello strumento anziché riconoscere che si sta volando arretrando col rischio di finire sottovento ad ostacoli o crinali."
  },
  6020: {
    cleanOpt3: "Calcola la posizione nello spazio per mezzo di un barometro differenziale.",
    rule: "Riceve i segnali orari ultraprecisi da almeno 4 satelliti atomici e calcola la posizione 3D (latitudine, longitudine, quota) misurando il tempo di propagazione del segnale radio.",
    trap: "Ipotizzare che il GPS contenga sensori di movimento inerziali o capsule barometriche, dimenticando che è un ricevitore radio di trilaterazione satellitare."
  },

  // === Materia 3: Pronto Soccorso (3001 - 3020) ===
  3001: {
    rule: "Il trasporto del traumatizzato deve avvenire unicamente tramite ambulanza o eliambulanza attrezzata con personale sanitario, preservando la catena dei soccorsi e informando i familiari.",
    trap: "Caricare il ferito su un'auto privata per fare prima: movimenti scorretti durante il trasporto possono causare lesioni midollari irreversibili."
  },
  3002: {
    rule: "Sostenere l'infortunato dal lato leso cingendogli la vita permette di fare da stampella umana, scaricando il peso dall'arto infortunato senza forzarne la postura.",
    trap: "Caricarsi l'infortunato a spalle con rischio di cadute di entrambi, o collocarsi dal lato sano lasciando l'arto dolente privo di sostegno."
  },
  3003: {
    rule: "Qualsiasi movimento in presenza di emorragie interne o fratture instabili può scatenare shock emorragico fatale o perforazioni d'organo: l'immobilizzazione è prioritaria.",
    trap: "Cercare di far alzare o muovere il ferito per 'testare' dove fa male, ritardando l'allertamento del 112/118."
  },
  3004: {
    rule: "La regola d'oro del primo soccorritore è non nuocere (primum non nocere): mantenere la calma, non muovere il paziente e attivare immediatamente il NUE 112/118.",
    trap: "Allontanarsi alla ricerca di un medico o tentare manovre ortopediche fai-da-te non qualificate sul campo."
  },
  3005: {
    cleanOpt1: "Lasciare uscire più sangue possibile onde lavare la ferita.",
    rule: "L'emorragia arteriosa massiva impone compressione diretta con tampone o laccio a monte (tra ferita e cuore) per scongiurare l'ipovolemia e l'arresto cardiaco entro pochi minuti.",
    trap: "Lasciar sanguinare per 'pulire la ferita' o limitarsi a sollevare l'arto senza applicare adeguata pressione emostatica."
  },
  3006: {
    rule: "La medicazione compressiva pulita arresta il sanguinamento e protegge i tessuti esposti dalla contaminazione batterica e dal raffreddamento fino alle cure mediche.",
    trap: "Rimuovere continuamente il tampone per controllare il taglio, distruggendo il coagulo di fibrina in formazione."
  },
  3007: {
    rule: "Inclinare il capo in avanti previene l'ingestione o l'inalazione di sangue nelle vie aeree superiori, facilitando la respirazione e il monitoraggio dell'emorragia.",
    trap: "Reclinare la testa all'indietro: fa defluire il sangue in gola provocando tosse, nausea, vomito o soffocamento."
  },
  3008: {
    rule: "La pervietà delle vie aeree è il primo step di sopravvivenza (Airway): rimuovere corpi estranei, drenare liquidi e iperestendere moderatamente il capo se non c'è trauma cervicale.",
    trap: "Eseguire compressioni addominali cieche a terra senza prima aver ispezionato il cavo orale e liberato la gola ostruita."
  },
  3009: {
    rule: "Lo shock ipovolemico causa ipotermia sistemica e collasso circolatorio: coprire la vittima con telo termico e tenerla distesa preserva la perfusione degli organi vitali.",
    trap: "Somministrare alcolici, caffè o liquidi caldi a una persona in shock, peggiorando la vasodilatazione periferica o provocando vomito."
  },
  3010: {
    rule: "L'arto fratturato va immobilizzato bloccando l'articolazione a monte e a valle per evitare lacerazioni dei vasi e dolori acuti, senza mai tentare di riallineare l'osso.",
    trap: "Tentare manovre di trazione o riduzione manuale della frattura, rischiando di recidere arterie o nervi periferici con i monconi ossei."
  },
  3011: {
    rule: "Posizionare il lato che sanguina verso il basso favorisce il libero drenaggio del sangue e del liquor, evitando che l'accumulo interno aumenti la pressione intracranica.",
    trap: "Tamponare o bloccare con garze l'orecchio che perde sangue: l'aumento della pressione endocranica può provocare danni cerebrali irreversibili."
  },
  3012: {
    rule: "Un colpo all'addome può provocare la rottura di milza o fegato con emorragia interna occulta: comprimere o muovere l'addome aggrava le lesioni interne.",
    trap: "Praticare massaggi addominali o far alzare in piedi la persona, aumentando il sanguinamento interno e favorendo lo shock."
  },
  3013: {
    rule: "L'alta tensione genera archi voltaici nell'aria e tensioni di passo letali nel terreno circostante: avvicinarsi anche con legni asciutti è mortale per il soccorritore.",
    trap: "Pensare che un bastone di legno isoli da migliaia di volt: con l'alta tensione l'arco elettrico fulmina all'istante anche chi tenta di intervenire."
  },
  3014: {
    rule: "Sui circuiti a bassa tensione (entro i 220-380V), prima di toccare la vittima bisogna interrompere la corrente o allontanare il cavo con un oggetto isolante non conduttore (legno secco).",
    trap: "Afferrare direttamente l'infortunato a mani nude: la contrazione muscolare da tetania trasmette la scarica anche al soccorritore bloccandolo."
  },
  3015: {
    rule: "Il protocollo RICE per distorsioni prevede riposo, ghiaccio, compressione con fasciatura morbida ed elevazione, per contenere l'ematoma e stabilizzare i legamenti.",
    trap: "Far camminare subito il soggetto 'per riattivare la circolazione' o tirare il piede, aggravando lo stiramento o la rottura dei legamenti."
  },
  3016: {
    rule: "Nella lussazione gleno-omerale la testa dell'omero esce dalla cavità: si osserva il tipico profilo 'a spallina' con scalino/infossamento e blocco del braccio verso il basso.",
    trap: "Confondere la lussazione articolare con una contusione o frattura dell'avambraccio, ignorando la caratteristica asimmetria della spalla."
  },
  3017: {
    rule: "L'ustione grave va raffreddata con acqua pulita tiepida/fresca e protetta con teli sterili senza sfregare o applicare pomate che favorirebbero infezioni batteriche.",
    trap: "Applicare olio, burro, dentifricio o unguenti non sterili sulla pelle ustionata, aumentando la macerazione e il rischio di sepsi grave."
  },
  3018: {
    rule: "La Posizione Laterale di Sicurezza (PLS) assicura il drenaggio verso l'esterno di fluidi e vomito ed evita che la lingua ricada all'indietro ostruendo la trachea.",
    trap: "Lasciare l'infortunato incosciente supino sulla schiena, col rischio concreto di asfissia per soffocamento da lingua o rigurgito gastrico."
  },
  3019: {
    rule: "Nel trauma con sincope è prioritario valutare e monitorare costantemente i parametri vitali (respiro e polso) senza scuotere la vittima per proteggere il rachide cervicale.",
    trap: "Scuotere energicamente la persona svenuta dopo un impatto traumatico: in caso di lesione delle vertebre cervicali si rischiano danni midollari letali."
  },
  3020: {
    cleanOpt3: "Tenere la parte colpita al caldo coprendola e facendo ingerire al paziente bevande calde.",
    rule: "Il riscaldamento graduale passivo (coperte termiche, bevande zuccherate calde) ripristina la circolazione evitando il collasso da shock termico ('afterdrop').",
    trap: "Far bere alcolici (l'alcol vasodilata disperdendo calore vitale dagli organi interni) o frizionare vigorosamente la cute lesionando i tessuti congelati."
  }
};

function enrichQuestionsFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const questions = JSON.parse(raw);

  let updatedCount = 0;
  for (const q of questions) {
    const meta = P1_EXPLANATIONS[q.id];
    if (meta) {
      q.explanation = {
        rule: meta.rule,
        trap: meta.trap
      };
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
