/**
 * Script per l'arricchimento didattico e la normalizzazione delle spiegazioni
 * della materia 8: Materiali (ID 8001 - 8020).
 * Sostituisce i vecchi placeholder generici con spiegazioni specifiche, concise
 * e calibrate su Regola (principio fisico/norma) e Tranello (errore cognitivo).
 */

const fs = require('fs');
const path = require('path');

const MATERIALI_EXPLANATIONS = {
  8001: {
    rule: "Sull'estradosso anteriore agisce la massima depressione (portanza) e concentrazione di sforzo alare. Un taglio in quest'area riduce la portanza e rischia di propagarsi rapidamente per trazione.",
    trap: "Si tende a pensare che l'intradosso sostenga il carico o che le estremità siano più sollecitate, mentre la massima tensione strutturale è al centro del bordo d'attacco."
  },
  8002: {
    rule: "I cordini (Kevlar, Dyneema) devono essere anelastici per mantenere invariato il profilo, l'incidenza e il calettamento della vela sotto le continue variazioni di carico aerodinamico.",
    trap: "L'allievo pensa che l'elasticità ammortizzi gli scossoni, dimenticando che cordini elastici deformerebbero l'assetto alare causando stalli o chiusure improvvise."
  },
  8003: {
    rule: "Il centro di pressione alare si trova nel primo terzo del profilo (25-30% della corda). I cordini anteriori (linee A) sopportano perciò oltre il 60-70% del peso totale del pilota.",
    trap: "Si ipotizza una distribuzione uniforme del carico tra le linee o si confondono i cordini portanti con quelli posteriori collegati ai comandi di pilotaggio."
  },
  8004: {
    rule: "La tessitura rip-stop incorpora fili di rinforzo più spessi a maglia quadrettata (reticolo) che bloccano la propagazione di lacerazioni o strappi accidentali oltre la maglia.",
    trap: "Confondere la resistenza alla propagazione degli strappi con l'indistruttibilità assoluta: il rip-stop può tagliarsi, ma ne confina l'allargamento."
  },
  8005: {
    rule: "Il tessuto da parapendio deve trattenere la pressione interna generata dai cassoni (impermeabilità ai gas), resistere all'abrasione e non deformarsi per preservare il profilo alare.",
    trap: "Ipotizzare che la traspirabilità (gas-permeabile) o l'elasticità siano benefiche: una vela permeabile o deformabile perde pressione interna e stalla."
  },
  8006: {
    rule: "I raggi UV spezzano le catene molecolari polimeriche del nylon rendendolo fragile, mentre l'umidità accelera l'idrolisi e favorisce muffe e decadimento dell'induzione siliconica.",
    trap: "Confondere i raggi ultravioletti (radiazione solare chimicamente degradante) con i raggi infrarossi (radiazione termica che trasmette solo calore)."
  },
  8007: {
    cleanOpt3: "risultano degradate le sue prestazioni e compromessa la sua affidabilità.",
    rule: "La porosità lascia sfuggire la sovrapressione interna dei cassoni: la vela perde efficienza, fatica a rigonfiarsi e diventa pericolosamente incline allo stallo paracadutale.",
    trap: "Credere che la porosità sia solo un problema estetico o di lieve degrado velocistico, ignorando il gravissimo rischio di instabilità e stallo profondo."
  },
  8008: {
    rule: "Il rimessaggio richiede assenza assoluta di umidità e calore per scongiurare delaminazioni dell'induzione siliconica/poliuretanica, decomposizione da funghi e porosità precoce.",
    trap: "Pensare che lasciare la sacca aperta in ambiente caldo consenta alla vela umida di asciugare: l'umidità residua intrappolata tra le pieghe innesca la degradazione."
  },
  8009: {
    rule: "L'anima portante in aramide (Kevlar) è estremamente fotosensibile e decade rapidamente sotto i raggi UV: la calza esterna la protegge dalla luce. Il nastro è un riparo UV provvisorio.",
    trap: "Fare nodi sul cordino per accorciarlo o rinforzarlo: qualsiasi nodo riduce la resistenza strutturale del cordino di oltre il 40-50%."
  },
  8010: {
    rule: "I moschettoni di connessione vela-imbrago devono essere certificati per carichi aerei (minimo 20-24 kN) e avere chiusura di sicurezza vincolata per impedire aperture accidentali.",
    trap: "Scegliere moschettoni generici da alpinismo leggero senza bloccaggio o privilegiare la leggerezza rispetto ai carichi di fatica e all'omologazione aeronautica."
  },
  8011: {
    rule: "La piombatura metallica concentra carichi e flessioni ripetute: la rottura per fatica dei singoli trefoli d'acciaio avviene quasi sempre subito prima o subito dopo il manicotto.",
    trap: "Limitarsi a guardare che il manicotto di piombatura non sia crepato, trascurando i trefoli d'acciaio del cavo adiacenti alla giunzione."
  },
  8012: {
    rule: "I cavi di tiranteria inferiore e superiore garantiscono la stabilità strutturale del deltaplano. Un cavo logoro può cedere sotto fattore di carico, causando il collasso alare.",
    trap: "Pensare di poter compensare il tirante danneggiato volando 'con cautela' o improvvisando riparazioni senza ricambi certificati."
  },
  8013: {
    rule: "I tubi in alluminio aeronautico piegati subiscono snervamento strutturale e microfratture invisibili: raddrizzarli non ripristina la resistenza, rendendo cedimenti improvvisi inevitabili.",
    trap: "Raddrizzare i tubi manualmente pensando che l'aspetto rettilineo equivalga alla resistenza originale del materiale aeronautico bonificato."
  },
  8014: {
    rule: "La velatura in Dacron o Mylar/laminato soffre di foto-degradazione da radiazione UV solare, che cristallizza le resine e provoca perdita di resistenza allo strappo e delaminazione.",
    trap: "Confondere la componente calorica (infrarossi) con la radiazione ionizzante ultravioletta che distrugge la struttura chimica delle fibre sintetiche."
  },
  8015: {
    rule: "La sacca protegge da luce, polvere e sfregamenti, ma l'ala deve essere asciutta per evitare corrosione dei tubi in alluminio, ruggine sulla bulloneria e muffe sulla vela.",
    trap: "Riporre il deltaplano ancora umido di condensa o rugiada in scantinati umidi, innescando l'ossidazione galvanica della struttura e l'invecchiamento del dacron."
  },
  8016: {
    rule: "La corrosione intacca la sezione resistente dell'acciaio e favorisce la tensocorrosione. I componenti strutturali ossidati vanno sempre sostituiti con pezzi omologati originali.",
    trap: "Credere che basti un solvente chimico o grasso antiruggine superficiale per sanare una vite o un cavo strutturale internamente compromesso."
  },
  8017: {
    rule: "Il paracadute di soccorso va arieggiato e ripiegato periodicamente (ogni 6-12 mesi) per prevenire l'adesione del tessuto ed è indispensabile seguire rigorosamente le istruzioni del produttore.",
    trap: "Non aprirlo mai per paura di sbagliare a ripiegarlo: un soccorso rimasto compresso per anni nella sacca può incollarsi e non aprirsi in caso di emergenza."
  },
  8018: {
    rule: "Nel controllo pre-volo è vitale verificare: fissaggio delle spine della sacca, accessibilità della maniglia con entrambe le mani e corretto collegamento delle briglie all'imbrago.",
    trap: "Dare per scontata la connessione del soccorso perché presente a bordo, senza verificare che la maniglia non sia bloccata e che la fune di vincolo sia vincolata all'imbrago."
  },
  8019: {
    rule: "L'elettricità statica, la pressione costante e l'umidità possono far aderire le pieghe del tessuto di nylon leggero tra loro, ritardando o impedendo il gonfiaggio al lancio.",
    trap: "Ritenere che il tessuto si 'consumi' all'aria o che il problema principale sia la sola usura della fune di vincolo."
  },
  8020: {
    cleanOpt3: "solo a velocità pari a quelle massime del deltaplano e del parapendio.",
    rule: "La resistenza strutturale della calotta e dei cordini è calcolata per velocità di caduta limite (VNE del soccorso, tipicamente entro i 130 km/h); superata questa, si rischia l'esplosione della calotta.",
    trap: "Pensare che il soccorso resista a qualsiasi velocità di caduta libera o confondere la velocità massima del mezzo in volo livellato con la velocità limite di dispiegamento."
  }
};

function enrichQuestionsFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const questions = JSON.parse(raw);

  let updatedCount = 0;
  for (const q of questions) {
    const meta = MATERIALI_EXPLANATIONS[q.id];
    if (meta) {
      q.explanation = {
        rule: meta.rule,
        trap: meta.trap
      };
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
