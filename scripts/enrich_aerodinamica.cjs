/**
 * Script to enrich Materia 2: Aerodinamica (150 quizzes: #2001-#2150)
 * with bespoke Regola and Tranello explanations and clean OCR artifacts.
 */
const fs = require('fs');
const path = require('path');

const explanations = {
  2001: {
    regola: "L'aerodinamica è il ramo della fluidodinamica che studia le leggi fisiche del moto dei corpi solidi immersi e in movimento relativo entro fluidi gassosi come l'aria.",
    tranello: "Non studia i fluidi in generale (idrodinamica) né le masse d'aria dell'atmosfera (meteorologia), ma specificamente l'interazione tra corpi solidi e aria."
  },
  2002: {
    regola: "Un'ala è un corpo solido conformato secondo una specifica sezione geometrica che, mosso rispetto all'aria, genera forze aerodinamiche (portanza e resistenza).",
    tranello: "L'ala non genera sempre e comunque portanza in ogni condizione (es. oltre lo stallo o a incidenza zero simmetrica) né genera unicamente portanza senza resistenza."
  },
  2003: {
    regola: "Il profilo alare è la forma geometrica della sezione dell'ala ottenuta sezionandola con un piano verticale perpendicolare all'asse trasversale (apertura alare).",
    tranello: "Non è la proiezione della pianta alare sul piano orizzontale o verticale, ma la sezione trasversale ortogonale alla linea dell'apertura."
  },
  2004: {
    regola: "Nel volo libero i profili più diffusi sono il concavo-convesso (vele a semplice superficie o parapendio frenato), piano-convesso e biconvesso (asimmetrico).",
    tranello: "I profili biconvessi simmetrici ed ellittici puri sono tipici dell'acrobazia a motore o dei caccia, non del volo veleggiato dove serve camber positivo."
  },
  2005: {
    regola: "Il bordo d'attacco è la porzione anteriore del profilo alare che incontra per prima il flusso; il bordo d'uscita è l'estremità posteriore dove i flussi si ricongiungono.",
    tranello: "Non indicano i punti di attacco alla struttura o i bordi esterni/interni, ma la linea frontale e posteriore dell'ala rispetto al moto."
  },
  2006: {
    regola: "La corda alare è il segmento rettilineo ideale che congiunge direttamente il bordo d'attacco con il bordo d'uscita del profilo.",
    tranello: "Non è la campata dell'ala (apertura) né un asse di simmetria; è la linea di riferimento geometrica fondamentale per calcolare incidenza e spessore."
  },
  2007: {
    regola: "L'estradosso è la superficie superiore curva dell'ala soggetta a depressione; l'intradosso è la superficie inferiore dell'ala soggetta a sovrappressione.",
    tranello: "Non invertire le definizioni: l'estradosso sta sopra (dorso dell'ala), l'intradosso sta sotto (ventre dell'ala)."
  },
  2008: {
    regola: "L'apertura alare è la distanza rettilinea misurata tra le due estremità alari più esterne (wingtip).",
    tranello: "Non confonderla con la corda alare (distanza bordo d'attacco-uscita) o con lo spessore massimo del profilo."
  },
  2009: {
    regola: "L'allungamento alare (aspect ratio, AR) è il rapporto adimensionale tra il quadrato dell'apertura alare e la superficie alare totale (AR = b²/S).",
    tranello: "Non è semplicemente la distanza tra le tips né il rapporto superficie/apertura; per ali non rettangolari è rigorosamente b²/S."
  },
  2010: {
    regola: "Con apertura alare b = 10 m e superficie S = 25 m², l'allungamento è: AR = 10² / 25 = 100 / 25 = 4.",
    tranello: "Non fare 25/10 = 2.5: l'allungamento richiede il quadrato dell'apertura alare diviso per la superficie."
  },
  2011: {
    regola: "Il moto nello spazio di un aeromobile avviene attorno a tre assi ortogonali passanti per il baricentro: asse longitudinale, asse trasversale e asse verticale.",
    tranello: "Non sono solo due: nello spazio tridimensionale sono sempre necessari tre assi ortogonali per descrivere tutti i gradi di libertà."
  },
  2012: {
    regola: "La rotazione dell'ala attorno all'asse longitudinale (che va da prua a poppa) prende il nome di rollio (inclinazione laterale delle semiali).",
    tranello: "Il rollio avviene sull'asse longitudinale; il beccheggio sull'asse trasversale e l'imbardata su quello verticale."
  },
  2013: {
    regola: "La rotazione dell'ala attorno all'asse trasversale (parallelo all'apertura alare) prende il nome di beccheggio (movimento di cabrata o picchiata).",
    tranello: "Il beccheggio varia l'assetto longitudinale alzando o abbassando il muso dell'ala rispetto all'orizzonte."
  },
  2014: {
    regola: "La rotazione dell'ala attorno all'asse verticale (perpendicolare al piano di volo) prende il nome di imbardata (rotazione della prua a destra o sinistra).",
    tranello: "L'imbardata devia la direzione della prua sul piano orizzontale, distinta dall'inclinazione alare che è il rollio."
  },
  2015: {
    regola: "L'ala è a tutti gli effetti una macchina fluidodinamica perché trasforma l'energia potenziale di quota o cinetica di moto in portanza aerodinamica utile.",
    tranello: "Non occorrono motori o ingranaggi complessi per essere una macchina: l'ala compie lavoro meccanico utile convertendo flussi ed energie."
  },
  2016: {
    regola: "Il passaggio di un'ala perturba lo stato di quiete dell'aria circostante all'interno di un volume teorico denominato tubo di flusso.",
    tranello: "L'ala perturba eccome l'aria circostante, concentrando l'effetto fluidodinamico all'interno delle linee di corrente del tubo di flusso."
  },
  2017: {
    regola: "Il concetto teorico di tubo di flusso è necessario perché le equazioni di continuità e conservazione dell'energia si applicano all'interno di volumi delimitati da linee di corrente.",
    tranello: "Non è un'invenzione per le gallerie del vento o un vezzo formale: è la base matematica su cui Bernoulli e la fisica dei fluidi formulano i principi aerodinamici."
  },
  2018: {
    regola: "Il tubo di flusso è la porzione ideale di fluido delimitata da linee di corrente che racchiude l'aria perturbata dal moto del corpo solido.",
    tranello: "Non è uno strumento di misura né coincide unicamente con la scia posteriore turbolenta dell'ala."
  },
  2019: {
    regola: "All'interno di un tubo di flusso la presenza di qualsiasi corpo solido deforma le linee di corrente e perturba localmente velocità e pressione del fluido.",
    tranello: "Anche il solido più perfetto e profilato altera la geometria del flusso; non può esistere moto solido-fluido senza perturbazione locale."
  },
  2020: {
    regola: "Per il principio di relatività galileiana, un profilo fermo investito da una corrente d'aria genera gli stessi identici effetti aerodinamici di un profilo che avanza in aria ferma.",
    tranello: "Gli effetti sono identici a condizione categorica che velocità vettoriale e direzione del moto relativo coincidano perfettamente."
  },
  2021: {
    regola: "Il vento relativo è il flusso d'aria che investe l'aeromobile in movimento, avente direzione e velocità uguali e contrarie al moto dell'ala nell'aria.",
    tranello: "Non è la differenza di velocità tra le due semiali in virata né il vento meteorologico al suolo; è il vettore aria-ala locale."
  },
  2022: {
    regola: "La velocità e le forze aerodinamiche sono grandezze vettoriali definite da punto d'applicazione, direzione, verso e intensità, componibili con l'algebra vettoriale.",
    tranello: "Non sono scalari semplici (numeri puri): sommare velocità e forze richiede la scomposizione e somma vettoriale trigonometrica."
  },
  2023: {
    regola: "La pressione di un fluido su una superficie è definita come il rapporto tra la forza normale esercitata dal fluido e l'area della superficie (P = F / S).",
    tranello: "Non è il prodotto della forza per la superficie né il quadrato dell'area, ma la forza per unità di superficie."
  },
  2024: {
    regola: "In base al teorema di Bernoulli, la pressione totale di un fluido ideale incomprimibile in moto è la somma di pressione statica e pressione dinamica.",
    tranello: "La pressione totale non include la portata o il peso grezzo: si compone esclusivamente della quota statica (termica) e dinamica (cinetica)."
  },
  2025: {
    regola: "La pressione statica è la pressione isotropa esercitata dal fluido indipendentemente dal moto, legata al peso molecolare e alla compressione del fluido.",
    tranello: "Non dipende dalla velocità del fluido: è la pressione che misurerebbe un manometro solidale con la corrente fluida."
  },
  2026: {
    regola: "La pressione dinamica è la pressione supplementare generata dall'energia cinetica del fluido in movimento contro una superficie, pari a 1/2 ρ V².",
    tranello: "Non è il rapporto velocità/densità: è l'energia cinetica volumetrica prodotta dall'impatto del fluido in scorrimento."
  },
  2027: {
    regola: "L'espressione fondamentale 1/2 ρ V² rappresenta la pressione dinamica del fluido avente densità ρ e velocità di scorrimento V.",
    tranello: "Non esprime la densità o la pressione statica: è l'equivalente aerodinamico dell'energia cinetica (1/2 m v² per unità di volume)."
  },
  2028: {
    regola: "Sia la portanza che la resistenza dipendono linearmente dal fattore 1/2 ρ V², risultando quindi direttamente proporzionali alla sola pressione dinamica.",
    tranello: "Non sono proporzionali alla pressione statica o totale, ma alla pressione dinamica dell'aria che lambisce l'ala."
  },
  2029: {
    regola: "La generazione di portanza nasce dalla differenza di velocità di scorrimento dei filetti fluidi tra l'estradosso (più veloci) e l'intradosso (più lenti).",
    tranello: "A basse velocità subsoniche l'aria è incomprimibile; non vi è differenza di densità o chimica molecolare tra le due facce dell'ala."
  },
  2030: {
    regola: "A causa della maggiore curvatura del profilo superiore, la velocità dei filetti fluidi rispetto all'ala in volo è nettamente maggiore sull'estradosso.",
    tranello: "Sull'intradosso la velocità è minore o rallentata rispetto all'aria indisturbata; la massima accelerazione avviene sull'estradosso."
  },
  2031: {
    regola: "Essendo la velocità del fluido maggiore sull'estradosso, per la formula 1/2 ρ V² la pressione dinamica risulta maggiore sull'estradosso rispetto all'intradosso.",
    tranello: "Non confondere pressione dinamica (che aumenta dove il flusso è veloce) con pressione statica (che diminuisce)."
  },
  2032: {
    regola: "Per il teorema di Bernoulli, dove la velocità e la pressione dinamica aumentano, la pressione statica deve diminuire: la pressione statica è perciò minore sull'estradosso.",
    tranello: "È proprio questa depressione statica sull'estradosso che 'risucchia' l'ala verso l'alto generando oltre i due terzi della portanza totale."
  },
  2033: {
    regola: "Il principio di Bernoulli afferma che lungo una linea di flusso a densità costante la somma di pressione statica e pressione dinamica si mantiene costante (P_tot = cost).",
    tranello: "La pressione totale non varia spontaneamente: se la dinamica sale la statica scende per conservare l'energia totale."
  },
  2034: {
    regola: "In un tubo Venturi a portata costante il restringimento aumenta la velocità e la pressione dinamica riducendo la pressione statica, mantenendo costante la pressione totale.",
    tranello: "Variando la sezione variano sia velocità che pressione statica e dinamica, ma la somma (pressione totale) resta invariata."
  },
  2035: {
    regola: "Per l'equazione di continuità (Portata = Sezione x Velocità), al variare della sezione del tubo la velocità del fluido incomprimibile deve necessariamente variare.",
    tranello: "La velocità non resta costante: se il condotto si restringe il fluido accelera, se si allarga rallenta."
  },
  2036: {
    regola: "In assenza di apporti energetici esterni o attriti dissipativi la somma della pressione statica e dinamica in un tubo Venturi resta perfettamente costante.",
    tranello: "La pressione totale non varia con la sezione: è la quantità conservativa fondamentale del flusso di Bernoulli."
  },
  2037: {
    regola: "Quando la sezione del tubo diminuisce, il fluido accelera incrementando la propria energia cinetica e quindi la propria pressione dinamica (a scapito della statica).",
    tranello: "Non si riduce la pressione dinamica: accelerando il flusso la pressione dinamica cresce quadraticamente."
  },
  2038: {
    regola: "Dove la sezione del tubo aumenta il fluido rallenta diminuendo la pressione dinamica, con conseguente recupero e aumento della pressione statica.",
    tranello: "Allargando il condotto la pressione statica non scende: sale, compensando il calo di velocità del fluido."
  },
  2039: {
    regola: "La superficie curva dell'estradosso strozza le linee di flusso sovrastanti simulando un tubo Venturi aperto, applicando appieno il principio di Bernoulli.",
    tranello: "L'ala sfrutta la fisica di Bernoulli in tutte le fasi di volo, termica compresa; non c'è eccezione nelle ascendenze."
  },
  2040: {
    regola: "I profili usati in deltaplano e parapendio sono asimmetrici ad alta portanza, tipicamente concavo-convessi (vele flessibili) o biconvessi asimmetrici (cassoni).",
    tranello: "I profili biconvessi simmetrici non generano portanza a zero gradi e non sono adatti per il volo libero planato."
  },
  2041: {
    regola: "La risultante aerodinamica è la somma vettoriale di tutte le forze di pressione e attrito esercitate dall'aria sull'intera superficie dell'ala in movimento.",
    tranello: "Non include la forza peso (che è gravitazionale), ma rappresenta unicamente la reazione generata dal fluido attorno al profilo."
  },
  2042: {
    regola: "La risultante aerodinamica ha una direzione complessivamente orientata verso l'alto e leggermente all'indietro, contrastando la forza peso del sistema.",
    tranello: "Non è rigorosamente perpendicolare alla traiettoria (quella è la sola portanza) né parallela (quella è la sola resistenza)."
  },
  2043: {
    regola: "La scomposizione classica della risultante aerodinamica identifica: la Portanza, ortogonale alla traiettoria di volo, e la Resistenza, parallela alla traiettoria.",
    tranello: "Non sono riferite alla corda alare geometrica o al terreno, ma rigorosamente alla direzione del vento relativo e della traiettoria."
  },
  2044: {
    regola: "È un principio fisico inderogabile dell'aerodinamica: non è possibile generare portanza senza produrre contemporaneamente una resistenza aerodinamica.",
    tranello: "Non si può annullare la resistenza: la sola generazione di portanza produce inevitabilmente resistenza indotta e attrito."
  },
  2045: {
    regola: "In volo planato a velocità costante la resistenza aerodinamica dell'ala è esattamente uguale e contraria alla componente della forza peso lungo la traiettoria.",
    tranello: "La resistenza non equilibra l'intera velocità né la portanza; equilibra la forza motrice di trazione gravitazionale."
  },
  2046: {
    regola: "La resistenza aerodinamica per convenzione fisica è sempre parallela alla traiettoria di volo e al vettore del vento relativo, con verso contrario all'avanzamento.",
    tranello: "Non è perpendicolare alla traiettoria né parallela alla corda geometrica: agisce lungo la linea di scorrimento del vento relativo."
  },
  2047: {
    regola: "La formula della resistenza aerodinamica è: R = 1/2 ρ S C_r V², dove ρ è la densità, S la superficie alare, C_r il coefficiente di resistenza e V la velocità.",
    tranello: "La velocità è sempre al quadrato (V²); la superficie e il coefficiente non sono elevati al quadrato."
  },
  2048: {
    regola: "La resistenza è direttamente proporzionale sia alla densità dell'aria ρ che alla superficie alare S: raddoppiando l'una o l'altra la resistenza raddoppia.",
    tranello: "La proporzionalità non è inversa o nulla: c'è proporzionalità diretta di primo grado sia per la superficie che per la densità dell'aria."
  },
  2049: {
    regola: "Poiché la resistenza cresce col quadrato della velocità (V²), triplicando la velocità (3V) la resistenza diventa: 3² = 9 volte più grande.",
    tranello: "Non triplica: l'effetto quadratico (3² = 9) moltiplica per nove la forza resistente dell'aria."
  },
  2050: {
    regola: "Il coefficiente di resistenza C_r è un numero puro adimensionale determinato dalla forma del profilo alare e dall'angolo di incidenza.",
    tranello: "Non è una forza in Newton o kg né dipende dal carico alare; è un coefficiente geometrico-fluidodinamico puro."
  },
  2051: {
    regola: "La resistenza totale dell'ala si suddivide convenzionalmente in tre contributi primari: resistenza d'attrito, resistenza di forma e resistenza indotta.",
    tranello: "Non si esaurisce in sole due componenti: attrito, forma (le due parassite) e indotta (legata alla portanza) sono tutte indispensabili."
  },
  2052: {
    regola: "La resistenza di forma (o di pressione) deriva dalla separazione del flusso e dalla differenza di pressione tra il fronte dell'ala e la scia posteriore.",
    tranello: "Non dipende solo dalle dimensioni geometriche lorde, ma dal grado di affusolamento ed efficienza aerodinamica della sagoma solida."
  },
  2053: {
    regola: "Uno spessore maggiore dell'ala sposta più volume d'aria e allarga la scia posteriore, influenzando direttamente e primariamente la resistenza di forma.",
    tranello: "Non influisce principalmente sull'attrito (legato alla superficie bagnata) o sull'indotta (legata all'allungamento), ma sulla resistenza di forma."
  },
  2054: {
    regola: "La resistenza di forma fa parte della resistenza parassita: all'aumentare della velocità all'aria cresce proporzionalmente al quadrato della velocità.",
    tranello: "Non cala aumentando la velocità: solo la resistenza indotta cala con la velocità; la forma aumenta vistosamente."
  },
  2055: {
    regola: "La resistenza d'attrito è causata dalle forze viscose tangenziali che si generano quando le molecole d'aria scorrono a contatto della superficie dell'ala.",
    tranello: "Non è dovuta ai vortici marginali né alla forma frontale: nasce dalla viscosità molecolare sul tessuto bagnato dal flusso."
  },
  2056: {
    regola: "Lo strato limite è il sottile velo d'aria a ridosso dell'ala in cui la velocità varia da zero (a contatto della parete) fino alla velocità indisturbata esterna.",
    tranello: "Non è l'intero tubo di flusso né uno strato esterno: è la pellicola millimetrica microscopica di transizione viscosa."
  },
  2057: {
    regola: "La resistenza d'attrito dipende strettamente dalla natura dello strato limite, risultando molto inferiore se lo strato è laminare rispetto a quando diventa turbolento.",
    tranello: "Lo strato limite turbolento moltiplica la resistenza d'attrito superficiale per via dei microvortici interni allo strato."
  },
  2058: {
    regola: "La resistenza d'attrito viscoso aumenta all'aumentare della velocità dell'aria sulla superficie dell'ala per via delle maggiori forze di taglio.",
    tranello: "Non rimane costante né cala con la velocità: cresce all'aumentare della velocità all'aria."
  },
  2059: {
    regola: "La resistenza indotta è la componente di resistenza generata dai vortici di estremità alare (wingtip vortices), conseguenza diretta della creazione di portanza.",
    tranello: "Non è l'attrito superficiale né la sagoma frontale: è la deviazione verso il basso del flusso (downwash) indotta dai vortici marginali."
  },
  2060: {
    regola: "La resistenza indotta nasce dalla differenza di pressione tra intradosso (alta pressione) ed estradosso (depressione), che fa travasare l'aria alle estremità alari.",
    tranello: "Il travaso spontaneo dell'aria dai bordi marginali da sotto a sopra crea due potenti rotoli d'aria vorticosi alle estremità."
  },
  2061: {
    regola: "La resistenza indotta è inversamente proporzionale all'allungamento alare: ali a grande allungamento riducono la proporzione dei vortici marginali.",
    tranello: "Non dipende solo dall'allungamento (dipende anche dal coefficiente di portanza), ma un allungamento maggiore abbatte nettamente la resistenza indotta."
  },
  2062: {
    regola: "A velocità elevate l'ala vola a incidenza minore e coefficiente di portanza C_p basso, riducendo l'intensità dei vortici e facendo diminuire la resistenza indotta.",
    tranello: "A differenza delle resistenze parassite che aumentano con la velocità, la resistenza indotta diminuisce all'aumentare della velocità."
  },
  2063: {
    regola: "A parità di altre condizioni un'ala con allungamento maggiore presenta minore resistenza indotta, garantendo una migliore efficienza aerodinamica globale.",
    tranello: "Un'ala allungata non è meno efficiente o più fragile: è aerodinamicamente più efficiente e penetrante a basse velocità."
  },
  2064: {
    regola: "Il motivo primario per cui i progettisti aumentano l'allungamento nei parapendio e alianti è abbattere la resistenza indotta e i vortici marginali.",
    tranello: "Non serve a diminuire l'attrito o la forma (che anzi aumentano leggermente per la maggiore corda flessibile), ma a stroncare la resistenza indotta."
  },
  2065: {
    regola: "La resistenza indotta è l'unica componente della resistenza totale che diminuisce all'aumentare della velocità all'aria.",
    tranello: "Sia l'attrito che la forma crescono rapidamente con la velocità; solo la componente indotta gode di questo andamento decrescente."
  },
  2066: {
    regola: "La resistenza aerodinamica è direttamente proporzionale al quadrato della velocità dell'aria (R ∝ V²).",
    tranello: "La proporzionalità non è lineare di primo grado: il legame è quadratico (velocità al quadrato)."
  },
  2067: {
    regola: "Diminuire la resistenza complessiva a parità di portanza innalza il rapporto portanza/resistenza, migliorando l'efficienza e le prestazioni di planata.",
    tranello: "Non aumenta solo la velocità o solo il rateo: migliora l'intera polare di volo e la capacità di coprire distanza a terra."
  },
  2068: {
    regola: "Variando l'angolo d'incidenza varia l'esposizione del profilo al flusso e la portanza, modificando sia la resistenza di forma che quella indotta.",
    tranello: "La resistenza non è costante: cabrare o picchiare sposta l'angolo d'attacco variando istantaneamente il coefficiente di resistenza C_r."
  },
  2069: {
    regola: "In atmosfera reale è fisicamente impossibile annullare la resistenza aerodinamica di un'ala in volo, poiché esisterà sempre attrito viscoso e spessore solido.",
    tranello: "Nessun angolo di incidenza o profilo speciale può ridurre a zero la resistenza nell'aria; la resistenza in volo è sempre maggiore di zero."
  },
  2070: {
    regola: "Anche con un profilo alare sottilissimo a incidenza zero la resistenza non si annulla, a causa della viscosità e dell'attrito dello strato limite sulla superficie.",
    tranello: "Anche la superficie più levigata produce attrito viscoso tangenziale contro le molecole d'aria, impedendo l'azzeramento della resistenza."
  },
  2071: {
    regola: "La portanza è la componente della risultante aerodinamica orientata rigorosamente in modo perpendicolare alla traiettoria di volo o al vento relativo.",
    tranello: "Non è la componente orizzontale né parallela alla corda alare; la definizione scientifica esige che sia perpendicolare al vento relativo."
  },
  2072: {
    regola: "In un profilo convenzionale la portanza è generata per oltre i due terzi dalla forte depressione (diminuzione di pressione statica) presente sull'estradosso.",
    tranello: "Non è la spinta da sotto sull'intradosso a fare la parte principale: è la suzione generata dalla depressione statica dorsale sull'estradosso."
  },
  2073: {
    regola: "La portanza dipende dalla forma e disegno del profilo, dalla densità dell'aria, dalla superficie alare, dal quadrato della velocità e dall'angolo d'incidenza.",
    tranello: "Non dipende solo dall'incidenza o solo dalla velocità: la formula P = 1/2 ρ S C_p V² racchiude tutti questi cinque parametri."
  },
  2074: {
    regola: "La formula corretta della portanza è: P = 1/2 ρ S C_p V², con la velocità al quadrato (V²) e gli altri fattori lineari.",
    tranello: "Non confondere gli esponenti: la superficie S e il coefficiente C_p non sono elevati al quadrato; solo la velocità è V²."
  },
  2075: {
    regola: "Il coefficiente di portanza C_p è un fattore numerico adimensionale che dipende dalla geometria del profilo e dall'angolo di incidenza con cui vola.",
    tranello: "Non è una forza in kg o Newton né una velocità; è un coefficiente puro di efficacia di sostentamento."
  },
  2076: {
    regola: "Aumentando lo spessore del profilo entro certi limiti aumentano sia la portanza massima che la resistenza di forma dell'ala.",
    tranello: "Un profilo più spesso non diminuisce la resistenza: offre maggiore portanza a basse velocità pagando pegno con una maggiore resistenza di forma."
  },
  2077: {
    regola: "Sia la portanza che la resistenza contengono il termine della densità dell'aria ρ nella loro equazione e ne dipendono direttamente in ogni condizione di volo.",
    tranello: "In quota con aria rarefatta (minore densità) la portanza cala a parità di velocità vera, imponendo velocità di volo superiori."
  },
  2078: {
    regola: "L'angolo d'incidenza (o angolo d'attacco) è l'angolo formato tra la corda alare del profilo e la direzione del vento relativo o traiettoria di volo.",
    tranello: "Non è l'angolo con l'orizzonte (quello è l'assetto) né con il centro di pressione; è riferito al moto relativo dell'aria."
  },
  2079: {
    regola: "L'assetto è l'angolo geometrico formato tra la corda alare del profilo e il piano orizzontale terrestre, indipendente dalla direzione del vento relativo.",
    tranello: "L'assetto guarda l'orizzonte visivo; l'incidenza guarda da dove arriva il vento relativo. Sono due angoli concettualmente distinti."
  },
  2080: {
    regola: "La pendenza della traiettoria è data dalla differenza: Assetto - Incidenza = (+6°) - (+10°) = -4°, cioè traiettoria discendente di 4° sotto l'orizzonte.",
    tranello: "Se l'incidenza supera l'assetto, l'ala sta scendendo rispetto all'orizzonte; con +6° di assetto e +10° d'incidenza la discesa è di 4°."
  },
  2081: {
    regola: "L'incidenza e l'assetto coincidono perfettamente solo e soltanto se la traiettoria di volo dell'ala è perfettamente orizzontale in aria calma.",
    tranello: "In discesa o salita l'angolo della traiettoria separa i due valori; solo quando la traiettoria giace sul piano orizzontale i due angoli sono identici."
  },
  2082: {
    regola: "L'angolo d'incidenza non compare esplicitamente nella formula della resistenza perché la sua influenza è già interamente incorporata nel coefficiente C_r.",
    tranello: "Non è omesso per errore: il valore numerico del coefficiente C_r varia in funzione dell'angolo d'incidenza tramite la polare del profilo."
  },
  2083: {
    regola: "Aumentando l'incidenza la portanza aumenta linearmente, ma solo entro ben precisi limiti fino a raggiungere l'angolo critico di stallo.",
    tranello: "Non si può aumentare l'incidenza all'infinito: oltre l'incidenza critica i filetti fluidi si staccano e la portanza crolla rovinosamente."
  },
  2084: {
    regola: "Al variare dell'angolo d'incidenza varia la curvatura apparente e la circolazione dell'aria attorno al profilo, modificando la portanza generata.",
    tranello: "Variando l'incidenza cambiano contemporaneamente sia la portanza che la resistenza; non è possibile variare l'una lasciando invariata l'altra."
  },
  2085: {
    regola: "L'angolo d'incidenza non compare esplicitamente nella formula P = 1/2 ρ S C_p V² perché la sua variazione è compresa all'interno del coefficiente C_p.",
    tranello: "Il coefficiente C_p è una funzione diretta dell'angolo d'incidenza tracciata sperimentalmente sulla curva del profilo."
  },
  2086: {
    regola: "In volo il pilota può variare la portanza modificando l'angolo d'incidenza entro i limiti consentiti agendo sui comandi o sulla barra di controllo.",
    tranello: "Mantenere lo stesso assetto o sperare di ridurre la resistenza non cambia la portanza; è la modulazione dell'incidenza a regolarla."
  },
  2087: {
    regola: "La forza peso verticale si scompone rispetto alla traiettoria planata in: trazione (parallela alla traiettoria) e peso apparente (perpendicolare alla stessa).",
    tranello: "La componente lungo la traiettoria è la trazione motrice; la componente ortogonale è il peso apparente bilanciato dalla portanza."
  },
  2088: {
    regola: "Nel volo planato senza motore l'unica energia motrice è fornita dalla componente della forza peso orientata lungo la traiettoria di discesa.",
    tranello: "Non vi è propulsione meccanica o aerodinamica: è la gravità che agisce da propulsore facendo scivolare l'apparecchio verso il basso."
  },
  2089: {
    regola: "L'energia sfruttata dal deltaplano e parapendio per mantenersi in volo è l'energia potenziale gravitazionale dovuta alla quota del decollo (E_p = m g h).",
    tranello: "Non è energia termica o cinetica iniziale: la quota iniziale rappresenta un serbatoio di energia potenziale che viene convertito in moto."
  },
  2090: {
    regola: "Nel volo planato la trazione è la componente della forza peso diretta in avanti lungo la traiettoria di volo (Trazione = Peso x sen γ).",
    tranello: "Non è ortogonale alla traiettoria; è la forza propulsiva parallela alla rotta che compensa la resistenza aerodinamica dell'ala."
  },
  2091: {
    regola: "Il valore della forza di trazione varia variando la pendenza della traiettoria di discesa: più la traiettoria è picchiata, maggiore è la trazione gravitazionale.",
    tranello: "Non è un valore fisso: picchiando l'ala la componente del peso lungo la traiettoria aumenta facendo accelerare il mezzo."
  },
  2092: {
    regola: "In volo librato rettilineo uniforme il peso apparente (componente del peso ortogonale alla traiettoria) è perfettamente equilibrato dalla portanza aerodinamica.",
    tranello: "La trazione equilibra la resistenza; il peso apparente è bilanciato esattamente e unicamente dalla portanza."
  },
  2093: {
    regola: "In virata l'accelerazione centrifuga aumenta il peso apparente del pilota, mentre l'inclinazione laterale riduce la superficie alare proiettata sul piano orizzontale.",
    tranello: "Non aumentano entrambi: il peso apparente cresce per la forza centrifuga, ma la proiezione dell'ala sull'orizzontale cala trigonometricamente col coseno."
  },
  2094: {
    regola: "In virata inclinata il fattore di carico aumenta richiedendo maggiore portanza, mentre la superficie proiettata utile al sostentamento verticale si riduce.",
    tranello: "La resistenza aerodinamica non diminuisce ma aumenta a causa del maggior carico alare e dell'incremento dell'incidenza necessaria a sostenere la virata."
  },
  2095: {
    regola: "Il carico alare è definito come il rapporto tra il peso totale in volo (pilota + apparecchio) e la superficie dell'ala (Carico alare = Peso / Superficie, kg/m²).",
    tranello: "Non è il rapporto inverso superficie/peso né il carico strutturale di rottura; esprime quanti chilogrammi deve sostenere ogni metro quadro d'ala."
  },
  2096: {
    regola: "Con pilota di 78 kg, attrezzatura di 22 kg (peso totale = 100 kg) e superficie di 25 m², il carico alare è: 100 / 25 = 4 kg/m².",
    tranello: "Bisogna sommare il peso del pilota con l'attrezzatura completa prima di dividere per la superficie proiettata: 100 / 25 = 4 kg/m²."
  },
  2097: {
    regola: "Se una parte del parapendio collassa o si chiude, il peso del pilota resta invariato mentre la superficie portante utile diminuisce, facendo aumentare il carico alare.",
    tranello: "Il carico alare non si riduce né resta identico: dividendo la stessa massa per una superficie minore il carico alare specifico aumenta."
  },
  2098: {
    regola: "Il fattore di carico (n) è il rapporto numerico tra la portanza totale richiesta e il peso a terra del sistema (n = L / W), che varia con le accelerazioni in volo.",
    tranello: "Non indica di quante volte aumenta la sola resistenza né la robustezza statica dell'ala; misura l'accelerazione subita rispetto a 1G."
  },
  2099: {
    regola: "A un'accelerazione di due 'G' (fattore di carico n = 2), le sollecitazioni strutturali e la forza che grava sull'ala raddoppiano, rendendo il peso apparente doppio.",
    tranello: "La massa reale del pilota resta invariata, ma le forze apparenti e il carico percepito dall'ala sono moltiplicati esattamente per due."
  },
  2100: {
    regola: "Se durante una manovra o virata il fattore di carico raddoppia (2G), la portanza e la forza peso apparente raddoppiano, raddoppiando istantaneamente il carico alare.",
    tranello: "Il carico alare effettivo non può rimanere invariato: con carico apparente doppio ogni metro quadro di tessuto sopporta il doppio della forza."
  },
  2101: {
    regola: "Il centro di pressione (o centro di spinta) è il punto ideale di applicazione della risultante di tutte le forze aerodinamiche generate dal profilo.",
    tranello: "Non è il baricentro (che è il punto di applicazione della forza peso) né l'incrocio geometrico degli assi; è il centro aerodinamico delle pressioni."
  },
  2102: {
    regola: "In volo la posizione del centro di pressione lungo la corda alare varia continuamente al variare dell'angolo d'incidenza del profilo.",
    tranello: "Non è un punto fisso sulla corda: nei profili convenzionali avanza all'aumentare dell'incidenza, mentre nei profili autostabili reflex arretra."
  },
  2103: {
    regola: "Nei profili autostabili reflex usati nel volo libero, aumentando l'incidenza il centro di pressione arretra (creando momento picchiante stabilizzante), e diminuendola avanza.",
    tranello: "Nei profili convenzionali instabili accade l'opposto; sui profili reflex autostabili diminuire l'incidenza fa avanzare il centro di pressione richiamando il naso."
  },
  2104: {
    regola: "Il baricentro (centro di gravità) di un apparecchio è il punto geometrico in cui si applica la risultante della forza peso totale del sistema.",
    tranello: "Non è il centro di pressione aerodinamico; è il baricentro gravitazionale della massa combinata di ala, imbrago e pilota."
  },
  2105: {
    regola: "Il baricentro complessivo dell'apparecchio in volo si trova lungo la verticale tra il baricentro del pilota sospeso e quello della struttura alare sovrastante.",
    tranello: "Non coincide con il solo pilota né è posizionato sulla tela dell'ala; si colloca nello spazio intermedio dipendente dalle masse relative."
  },
  2106: {
    regola: "La posizione del baricentro si sposta rispetto all'ala sia a seguito di comandi di beccheggio (asse trasversale) che di comandi di rollio (asse longitudinale).",
    tranello: "Nel volo pendolare il pilota si muove sia avanti-indietro che lateralmente, modificando la posizione del baricentro rispetto a entrambi gli assi."
  },
  2107: {
    regola: "L'efficienza aerodinamica (E) è definita fisicamente come il rapporto tra la portanza e la resistenza generate dall'ala (E = P / R).",
    tranello: "Non è il rapporto con il carico alare o con la velocità; è il rapporto adimensionale puro tra forza portante e forza resistente."
  },
  2108: {
    regola: "Poiché densità, superficie e velocità si semplificano, l'efficienza aerodinamica coincide con il rapporto tra i coefficienti C_p e C_r (E = C_p / C_r).",
    tranello: "Non è legata al peso massimo o alla superficie lorda, ma al quoziente puro tra coefficiente di portanza e coefficiente di resistenza."
  },
  2109: {
    regola: "Geometricamente e cinematicamente in aria calma l'efficienza equivale al rapporto tra la velocità orizzontale e la velocità verticale di discesa (E = V_x / V_z).",
    tranello: "Non è verticale diviso orizzontale (quello sarebbe il gradiente di discesa reciproco); è la distanza orizzontale percorsa per unità di quota persa."
  },
  2110: {
    regola: "L'efficienza aerodinamica varia continuamente al variare dell'angolo d'incidenza, raggiungendo il suo valore massimo a una specifica incidenza ottimale.",
    tranello: "Non dipende dalla sola superficie alare o dal peso: a ogni angolo d'incidenza corrisponde un diverso rapporto C_p/C_r sulla polare."
  },
  2111: {
    regola: "Un'efficienza massima pari a 8 significa che in aria calma l'ala può percorrere 8 chilometri orizzontali perdendo 1000 metri di quota (rapporto 8:1).",
    tranello: "Non significa fare 1 km perdendo 800 m (che darebbe un'efficienza pessima di 1.25); significa 8 km di distanza per 1 km di quota persa."
  },
  2112: {
    regola: "Variando l'angolo d'incidenza cambiano contemporaneamente sia il coefficiente di portanza C_p che quello di resistenza C_r, determinando la variazione dell'efficienza.",
    tranello: "Non varia solo uno dei due: ruotando il profilo rispetto al flusso si modificano simultaneamente sia C_p che C_r."
  },
  2113: {
    regola: "In aria calma l'efficienza massima non varia al variare del peso del pilota, a condizione categorica che l'ala non subisca deformazioni strutturali sotto carico.",
    tranello: "Il pilota pesante volerà più veloce e con maggiore tasso di caduta, ma percorrerà esattamente la stessa distanza a terra per metro di quota persa."
  },
  2114: {
    regola: "Due piloti di peso diverso sulla stessa ala non deformabile in aria calma percorrono la stessa distanza di planata ma il pilota più pesante impiega meno tempo (è più veloce).",
    tranello: "La distanza percorsa è identica perché l'efficienza massima all'aria non cambia; cambia solo la velocità all'aria del percorso."
  },
  2115: {
    regola: "Aumentare il peso del pilota aumenta sia la velocità all'aria che il tasso di caduta verticale, ma lascia inalterata l'efficienza aerodinamica massima (angolo di planata).",
    tranello: "Il peso non degrada l'efficienza in aria calma: fa solo scivolare la polare lungo la tangente di massima efficienza aumentando la velocità."
  },
  2116: {
    regola: "Iniziando una virata l'inclinazione riduce la portanza verticale e la forza centrifuga aumenta il peso apparente, costringendo l'ala ad aumentare il proprio tasso di caduta.",
    tranello: "L'ala non può mantenere o ridurre il tasso di caduta in virata: per sostenere la curva senza perdere quota serve una corrente ascensionale esterna."
  },
  2117: {
    regola: "Aumentando il carico alare a parità di incidenza e profilo, l'ala vola a velocità orizzontale maggiore e con tasso di caduta verticale maggiore.",
    tranello: "Non diminuisce il tasso di caduta: per sostenere più peso serve più velocità di scorrimento, accelerando sia l'avanzamento che la discesa."
  },
  2118: {
    regola: "In aria calma un volo orizzontale stabile e prolungato è impossibile per deltaplano e parapendio perché la resistenza aerodinamica dissipa continuamente energia di quota.",
    tranello: "Senza un motore propulsivo o una corrente ascensionale esterna la resistenza impone una traiettoria costantemente discendente verso il suolo."
  },
  2119: {
    regola: "Traiettorie orizzontali stabili rispetto al terreno sono realizzabili solo in presenza di ascendenze capaci di compensare il tasso di caduta proprio dell'ala.",
    tranello: "Il vento in coda aumenta l'avanzamento ma non impedisce all'ala di scendere; solo una corrente ascensionale permette il volo orizzontale al suolo."
  },
  2120: {
    regola: "La polare aerodinamica (polare di Lilienthal) è la curva cartesiana che riporta i valori del coefficiente di portanza C_p e resistenza C_r al variare dell'incidenza.",
    tranello: "Non è basata sull'assetto visivo né sulla velocità al suolo: mette in relazione i coefficienti aerodinamici puri con l'angolo d'attacco."
  },
  2121: {
    regola: "La polare delle velocità (o odografa) è il grafico cartesiano che rappresenta la velocità orizzontale in ascissa e la velocità verticale di caduta in ordinata ai vari angoli d'incidenza.",
    tranello: "Non riporta forze in kg o Newton; traccia la cinematica del volo mostrando la velocità orizzontale e il relativo tasso di caduta."
  },
  2122: {
    regola: "Aumentando il peso del pilota la polare delle velocità trasla rigidamente verso il basso e verso destra rispetto agli assi cartesiani (senza deformarsi).",
    tranello: "La curva non resta ferma né cambia forma se l'ala è rigida: trasla verso valori di velocità orizzontale e verticale maggiori."
  },
  2123: {
    regola: "Dalla polare delle velocità si ricavano immediatamente la velocità di minimo tasso di caduta, la velocità di massima efficienza e la velocità massima ai vari angoli d'incidenza.",
    tranello: "Non fornisce i valori grezzi delle forze in Newton, ma la relazione operativa tra velocità orizzontale e verticale utile al pilota."
  },
  2124: {
    regola: "Il punto di minimo tasso di caduta si trova nel punto più alto della curva della polare delle velocità, a un'incidenza maggiore di quella di massima efficienza.",
    tranello: "Non coincide con la massima efficienza né con la minima resistenza: per cadere il meno possibile si vola più lenti e frenati rispetto alla massima planata."
  },
  2125: {
    regola: "La massima velocità orizzontale si ottiene alla minima incidenza consentita, dove la resistenza parassita è molto elevata e l'efficienza si degrada.",
    tranello: "Non si ottiene all'incidenza di massima efficienza o massima portanza: accelerare al massimo richiede di ridurre l'incidenza accettando forte resistenza."
  },
  2126: {
    regola: "La massima efficienza in aria calma si trova tracciando la retta tangente dall'origine degli assi alla polare, corrispondente al massimo rapporto portanza/resistenza.",
    tranello: "Non è il rapporto resistenza/portanza (che va minimizzato) né portanza/peso; è il punto di tangenza con la migliore pendenza di planata."
  },
  2127: {
    regola: "In corrente ascensionale la massa d'aria sale: per massimizzare l'efficienza al suolo conviene volare a velocità all'aria minore rispetto all'aria calma (verso la minima caduta).",
    tranello: "Non bisogna accelerare in ascendenza: volare lenti prolunga il tempo di permanenza nell'aria che sale migliorando la planata al suolo."
  },
  2128: {
    regola: "In condizioni di discendenza (sink) la massa d'aria sprofonda: la teoria di McCready impone di volare a velocità all'aria maggiore per attraversarla rapidamente.",
    tranello: "Rallentare in discendenza fa crollare l'efficienza al suolo; occorre accelerare per abbandonare la zona discendente nel minor tempo possibile."
  },
  2129: {
    regola: "Con vento a favore il vento in coda spinge l'ala: la massima efficienza al suolo si ottiene volando a velocità all'aria minore (maggiore incidenza) per galleggiare di più.",
    tranello: "Non conviene spingere la velocità con vento in coda: volando vicini alla minima caduta il vento a favore ci trasporta più a lungo sul terreno."
  },
  2130: {
    regola: "Con vento contrario l'ala viene respinta: per ottenere la massima efficienza al suolo bisogna accelerare (minore incidenza) per penetrare la massa d'aria contraria.",
    tranello: "Volare lenti controvento schiaccia la traiettoria sul terreno fino all'arretramento; accelerare ripristina la penetrazione al suolo."
  },
  2131: {
    regola: "A parità di ala e capacità veleggia più a lungo (maggiore autonomia oraria) il pilota più leggero, poiché vola con un tasso di caduta minimo assoluto inferiore.",
    tranello: "Il pilota pesante cade più velocemente; il pilota leggero, godendo di minor carico alare, galleggia più a lungo nelle ascendenze deboli."
  },
  2132: {
    regola: "Controvento il pilota più pesante vola naturalmente più veloce a parità di incidenza, penetrando meglio la massa d'aria e realizzando una migliore efficienza al suolo.",
    tranello: "Il carico alare superiore è un vantaggio controvento: l'ala carica penetra le masse d'aria contrarie con minore degradazione della planata."
  },
  2133: {
    regola: "Con vento a favore il pilota pesante è svantaggiato in termini di efficienza al suolo rispetto al pilota leggero, che volando più lento resta più a lungo sospinto dal vento.",
    tranello: "Con vento in poppa il pilota leggero sfrutta più a lungo la spinta favorevole della corrente d'aria rispetto a chi scende più veloce."
  },
  2134: {
    regola: "In condizioni sfavorevoli con vento contrario e discendenza il pilota più leggero è fortemente sfavorito perché non ha penetrazione per avanzare contro la massa d'aria.",
    tranello: "In condizioni avverse la bassa velocità del pilota leggero lo espone a un calo drammatico di avanzamento rispetto al pilota più carico."
  },
  2135: {
    regola: "Lo stallo è la separazione dei filetti fluidi dalla superficie dell'estradosso alare, con crollo improvviso della portanza, causata dal superamento dell'incidenza critica.",
    tranello: "Non è causato da un calo di resistenza o da incidenza troppo bassa: è sempre provocato dall'eccessivo angolo d'incidenza."
  },
  2136: {
    regola: "Lo stallo aerodinamico non dipende dalla velocità assoluta ma dall'angolo critico d'incidenza, e può perciò verificarsi a qualsiasi velocità se si supera tale valore.",
    tranello: "È un errore comune credere che lo stallo avvenga solo a bassa velocità; lo stallo dinamico ad alta velocità si verifica bruscamente richiamando i comandi."
  },
  2137: {
    regola: "In virata il fattore di carico è superiore a 1G aumentando il carico alare; di conseguenza sia la velocità minima che la velocità di stallo sono maggiori che in volo dritto.",
    tranello: "In virata la velocità di stallo non resta identica: cresce proporzionalmente alla radice quadrata del fattore di carico (Vs_virata = Vs * √n)."
  },
  2138: {
    regola: "La velocità di stallo cresce all'aumentare del carico alare, poiché per sostenere un peso maggiore serve più velocità di scorrimento prima di toccare l'incidenza limite.",
    tranello: "Un'ala più carica o appesantita stalla a una velocità più elevata rispetto alla stessa ala pilotata da un pilota leggero."
  },
  2139: {
    regola: "È perfettamente possibile stallare ad alta velocità (stallo dinamico o accelerato) se il pilota richiama bruscamente i comandi superando l'angolo critico d'attacco.",
    tranello: "L'inerzia dell'apparecchio fa superare l'angolo critico prima che l'ala cambi traiettoria, innescando lo stallo anche a velocità prossime alla massima."
  },
  2140: {
    regola: "L'angolo critico di stallo è una caratteristica geometrica fissa del profilo alare e non dipende dalla velocità di volo, rimanendo sempre costante.",
    tranello: "La velocità di stallo varia col carico, ma l'angolo d'incidenza al quale il flusso si distacca è rigorosamente costante per quel profilo."
  },
  2141: {
    regola: "L'autostabilità è la capacità intrinseca di un profilo o aeromobile di ritornare autonomamente alle condizioni di equilibrio dinamico senza intervento del pilota.",
    tranello: "Non è una tendenza a picchiare o cabrare incontrollata: è l'azione correttiva naturale che ripristina assetto e velocità stabili."
  },
  2142: {
    regola: "Deltaplano e parapendio sono autostabili perché reagiscono alle perturbazioni su tutti gli assi sviluppando momenti aerodinamici che ripristinano l'equilibrio.",
    tranello: "L'autostabilità non agisce su un solo asse: si estende a beccheggio, rollio e imbardata tramite profilo reflex, freccia e pendolo."
  },
  2143: {
    regola: "Abbassare il baricentro rispetto al centro di pressione (sospensione pendolare) crea un forte braccio di leva stabilizzante che aumenta la stabilità in beccheggio e rollio.",
    tranello: "Non varia solo la forza sui comandi: l'effetto pendolo richiama energicamente l'ala allineando baricentro e centro di pressione."
  },
  2144: {
    regola: "Nel parapendio la posizione molto bassa del baricentro (pilota sospeso sotto il fascio funicolare) conferisce un'elevata stabilità pendolare intrinseca.",
    tranello: "Il baricentro basso non diminuisce la stabilità, anzi la incrementa notevolmente garantendo il naturale richiamo dell'ala sopra la testa."
  },
  2145: {
    regola: "La grande distanza tra ala e baricentro nel parapendio favorisce stabilità ma può innescare ampie oscillazioni pendolari di beccheggio e rollio se mal gestite.",
    tranello: "La massa pendolare sospesa a diversi metri dalla vela agisce come un pendolo fisico, capace di ampie oscillazioni indotte dalle turbolenze."
  },
  2146: {
    regola: "Lo svergolamento alare (washout, incidenza geometrica decrescente verso le estremità) contribuisce in modo decisivo alla stabilità longitudinale e anti-stallo.",
    tranello: "Lo svergolamento non è un difetto: riducendo l'incidenza alle estremità garantisce controllo di rollio e impedisce lo stallo improvviso delle tip."
  },
  2147: {
    regola: "Volando vicinissimo al terreno il deltaplano incrementa la propria planata per l'effetto suolo, che ostacola lo sviluppo dei vortici marginali.",
    tranello: "Non sono termiche o reazioni istintive del pilota: è un fenomeno aerodinamico puro di interferenza della vicinanza della superficie solida."
  },
  2148: {
    regola: "L'effetto suolo è causato primariamente dalla riduzione della resistenza indotta, poiché la presenza del terreno deforma e smorza i vortici di estremità alare.",
    tranello: "Non è dovuto solo a un 'cuscino' di compressione d'aria né a una sensazione soggettiva: la vicinanza del suolo abbatte fisicamente la resistenza indotta."
  },
  2149: {
    regola: "Una configurazione inusuale è un assetto anomalo o una deformazione geometrica imprevista del mezzo, quali tumbling, chiusure, autorotazioni o stallo paracadutale.",
    tranello: "Non è un semplice volo con vento forte o passeggero extra; descrive alterazioni aerodinamico-strutturali fuori dal dominio del volo normale."
  },
  2150: {
    regola: "Il parametro di volo critico che provoca le configurazioni inusuali (stalli, viti, chiusure e collassi) è l'angolo d'incidenza quando eccede i limiti di stabilità.",
    tranello: "Non è la velocità al suolo (che all'aria non conta) né una virata moderata: è l'angolo d'incidenza eccessivo a scatenare la perdita di controllo aerodinamico."
  }
};

const srcFile = path.resolve('src/data/questions.json');
const pubFile = path.resolve('public/data/questions.json');

[srcFile, pubFile].forEach(filePath => {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let updatedCount = 0;

  data.forEach(q => {
    // Clean OCR artifacts
    if (q.id === 2007 && q.options && q.options[2]) {
      q.options[2] = q.options[2].replace(/\s*DINAMICA\s*$/, '').trim();
    }
    if (q.id === 2150 && q.options && q.options[2]) {
      q.options[2] = q.options[2].replace(/\s*3 - PRONTO\s*$/, '').trim();
    }

    if (explanations[q.id]) {
      const exp = explanations[q.id];
      q.explanation = {
        rule: exp.regola,
        trap: exp.tranello
      };
      updatedCount++;
    }
  });

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Updated ${updatedCount} questions in ${filePath}`);
});
