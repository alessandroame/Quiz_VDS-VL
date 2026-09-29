/**
 * Script to enrich Materia 7: Tecnica di Pilotaggio (79 quizzes: #7001-#7079)
 * with bespoke Regola and Tranello explanations and clean OCR artifacts.
 */
const fs = require('fs');
const path = require('path');

const explanations = {
  7001: {
    regola: "Prima del decollo è indispensabile ispezionare l'atterraggio per verificare pendenza, ostacoli, linee elettriche e installare un segnavento per avere chiara la direzione d'avvicinamento.",
    tranello: "Non basta controllare solo il terreno; senza un indicatore di vento al suolo (manica a vento o nastro) l'avvicinamento finale diventa cieco e rischioso."
  },
  7002: {
    regola: "La pianificazione del volo di distanza (cross country) richiede studio accurato dello spazio aereo (CTR, parchi, zone vietate), opzioni di atterraggio di sicurezza lungo rotta e meteo.",
    tranello: "Il benessere fisico e l'eventuale recupero sono importanti, ma la conformità agli spazi aerei e la sicurezza dei campi di atterraggio intermedi sono vincoli primari ed eliminatori."
  },
  7003: {
    regola: "Una pendenza tra 20° e 35° garantisce una rincorsa agevole e un rapido allontanamento dal suolo, risultando nettamente superiore all'angolo di discesa dell'ala (inclinazione traiettoria).",
    tranello: "Pendenze superiori a 35°-45° diventano strapiombi pericolosi che ostacolano una corsa progressiva e impediscono un aborto sicuro del decollo."
  },
  7004: {
    regola: "La corsa di decollo deve essere progressiva: passi via via più lunghi e velocità accelerata fino a superare nettamente la velocità di sostentamento prima dello stacco.",
    tranello: "Correre a velocità costante o a passi corti impedisce di raggiungere la necessaria velocità anemometrica, rischiando uno stallo dinamico o un decollo appeso."
  },
  7005: {
    regola: "Appena staccati dal terreno l'ala deve accelerare per creare un margine di sicurezza dallo stallo; tirare la barra (delta) o rilasciare un poco i freni (parapendio) dona velocità.",
    tranello: "Cercare subito di sedersi nell'imbrago o frenare per non perdere quota riduce pericolosamente la velocità a pochi metri dal pendio, esponendo a stallo letale."
  },
  7006: {
    regola: "Il regime di minimo tasso di caduta si ottiene volando a velocità inferiore e incidenza maggiore rispetto alla massima efficienza, mantenendosi comunque a debita distanza dallo stallo.",
    tranello: "All'incidenza massima consentita l'ala è prossima o dentro lo stallo; alla massima efficienza la velocità è superiore al punto di caduta minima."
  },
  7007: {
    regola: "L'efficienza aerodinamica all'aria (portanza diviso resistenza) è una proprietà intrinseca dell'ala determinata dal profilo e dall'incidenza, indipendente dal vento della massa d'aria.",
    tranello: "Non confondere efficienza all'aria con efficienza al suolo: il vento frontale abbatte la penetrazione al suolo, ma non tocca l'aerodinamica pura all'aria."
  },
  7008: {
    regola: "La distanza orizzontale massima rispetto al terreno si ottiene volando al regime di massima efficienza al suolo, adattando la velocità al vento secondo la polare di velocità.",
    tranello: "Volare al minimo tasso di caduta massimizza il tempo di volo (autonomia oraria), non i chilometri percorsi sul terreno."
  },
  7009: {
    regola: "Per prolungare al massimo la durata del volo (minimo consumo di quota al secondo) bisogna volare alla velocità di minimo rateo di discesa (minimo tasso di caduta).",
    tranello: "La massima efficienza fa percorrere più spazio orizzontale a parità di quota persa, ma comporta un tasso di caduta verticale leggermente superiore."
  },
  7010: {
    regola: "Controvento, per contrastare l'arretramento e massimizzare i km percorsi sul terreno, la teoria di McCready impone di accelerare rispetto alla velocità di massima efficienza in aria calma.",
    tranello: "Istintivamente si vorrebbe rallentare per non perdere quota, ma controvento volare lenti schiaccia la traiettoria al suolo facendo quasi azzerare l'avanzamento."
  },
  7011: {
    regola: "L'efficienza rispetto al suolo è data dal rapporto tra velocità al suolo e velocità di discesa; qualsiasi variazione della componente di vento altera immediatamente l'efficienza al suolo.",
    tranello: "L'efficienza al suolo non varia solo se il vento aumenta: varia in ogni caso, sia che il vento frontale aumenti sia che diminuisca."
  },
  7012: {
    regola: "Più forte è il vento contrario, minore è la velocità orizzontale al suolo a parità di quota persa, con conseguente diminuzione dell'efficienza al suolo e traiettoria più ripida.",
    tranello: "Non pensare che il vento contrario sostenti l'ala aumentando l'efficienza: la portanza all'aria resta uguale, ma al suolo si copre molto meno spazio."
  },
  7013: {
    regola: "In corrente ascensionale la massa d'aria spinge verso l'alto; volare a incidenza maggiore (più lenti, verso la minima caduta) permette di sostare più a lungo nell'ascendenza massimizzando la planata.",
    tranello: "In ascendenza conviene volare più lenti della massima efficienza, esattamente all'opposto della discendenza dove occorre accelerare riducendo l'incidenza."
  },
  7014: {
    regola: "Attraversando discendenze bisogna ridurre l'incidenza accelerando l'ala per attraversare l'aria sfavorevole nel minor tempo possibile e massimizzare l'efficienza al suolo.",
    tranello: "Rallentare in discendenza fa precipitare l'efficienza al suolo, poiché l'aria discendente agisce per un tempo maggiore abbattendo drammaticamente la quota."
  },
  7015: {
    regola: "L'anemometro misura la velocità all'aria: con velocità al suolo di 10 km/h e vento contrario di 30 km/h, la velocità all'aria è la somma: 10 + 30 = 40 km/h.",
    tranello: "Non sottrarre 10 da 30: per avanzare a 10 km/h contro un muro di vento di 30 km/h l'ala deve fendere l'aria a 40 km/h effettivi."
  },
  7016: {
    regola: "Con vento in coda la velocità al suolo è la somma di aria e vento; l'anemometro segna la velocità all'aria pura: 60 km/h al suolo meno 30 km/h di vento = 30 km/h all'aria.",
    tranello: "Non sommare 60 + 30 = 90: l'anemometro è a bordo e risente solo del flusso d'aria locale, non della traslazione rispetto al terreno."
  },
  7017: {
    regola: "L'acceleratore abbassa il bordo d'attacco riducendo l'incidenza; aumentando la velocità all'aria contrasta il vento frontale e migliora l'efficienza rispetto al terreno.",
    tranello: "L'acceleratore non va usato in forte turbolenza per 'ridurre l'assetto', poiché riduce l'angolo di incidenza rendendo il profilo più esposto alle chiusure frontali."
  },
  7018: {
    regola: "Rispetto al terreno la massa d'aria trasla con il vento; per compensare la deriva e disegnare un cerchio al suolo bisogna variare opportunamente l'inclinazione dell'ala durante la virata.",
    tranello: "Se si mantiene un'inclinazione costante all'aria, la traiettoria al suolo risulterà deformata dal vento diventando una cicloide allungata sottovento."
  },
  7019: {
    regola: "Volare con prua orientata a granchio verso il vento permette inversioni a 'otto' sempre verso la valle a basso rollio, scongiurando il rischio di impatto alare contro il costone.",
    tranello: "Virare a 360° verso la montagna o effettuare virate strette ad alto rollio riduce la portanza e scaglia l'ala verso il pendio in caso di stallo o ritardo."
  },
  7020: {
    regola: "Le colonne termiche hanno ampiezza orizzontale limitata; spiralare a 360° consente al pilota di rimanere centrato nel nocciolo ascendente sfruttando la spinta verticale.",
    tranello: "Le termiche non salgono necessariamente a spirale e la virata continua aumenta la caduta propria, ma è l'unico modo per non uscire dalla zona di risalita."
  },
  7021: {
    regola: "All'interno della colonna ascensionale si interviene sui comandi per ridurre la velocità al regime di minimo tasso di caduta, massimizzando il guadagno di quota al secondo.",
    tranello: "Accelerare in termica riduce il tempo di permanenza nell'ascendenza e aumenta il tasso di caduta propria, riducendo l'efficacia del galleggiamento."
  },
  7022: {
    regola: "È lo stallo dinamico: richiamando bruscamente la barra o i freni ad alta velocità l'angolo di incidenza supera il valore critico prima che l'ala possa cambiare traiettoria.",
    tranello: "Lo stallo non dipende solo dalla velocità assoluta ma dall'angolo critico d'incidenza, che può essere superato istantaneamente a qualunque velocità."
  },
  7023: {
    regola: "In turbolenza serve velocità di poco superiore alla massima efficienza in delta e la massima compatibile con la corretta pressione nei cassoni in parapendio (mani al contatto).",
    tranello: "Volare alla velocità minima espone allo stallo al primo rotore; volare alla massima velocità con acceleratore in parapendio sgonfia i cassoni innescando chiusure."
  },
  7024: {
    regola: "Gli indicatori ambientali al suolo (fumo di comignoli, piega di alberi, bandiere, onde su specchi d'acqua o erba) e la deriva rivelano direzione e intensità del vento a terra.",
    tranello: "Il movimento delle nubi indica il vento in quota, che per rotazione barica e attrito può differire di molti gradi rispetto al vento effettivo al suolo."
  },
  7025: {
    regola: "L'avvicinamento ad otto smaltisce quota a monte del campo con virate di oltre 180° orientate sempre verso l'atterraggio, mantenendo visuale e prossimità costanti.",
    tranello: "Le virate dell'otto non devono mai essere a 360° cieche o allontanarsi dal campo dando le spalle all'atterraggio."
  },
  7026: {
    regola: "Il circuito standard a 'C' (braccio sottovento, virata base al traverso e finale controvento) stabilizza la traiettoria e consente un arrivo preciso evitando manovre basse.",
    tranello: "Non è riservato solo all'aviazione generale: è il circuito raccomandato per delta e parapendio per garantire ordine e prevedibilità del traffico."
  },
  7027: {
    regola: "In un atterraggio molto frequentato il circuito a 'C' è fondamentale perché rende il flusso delle ali ordinato e prevedibile lungo un corridoio comune di traffico.",
    tranello: "Il circuito ad otto in un atterraggio affollato genera conflitti di rotta imprevedibili e altissimo rischio di collisioni a bassa quota."
  },
  7028: {
    regola: "Con molti piloti in atterraggio si imposta il circuito a 'C' dando la precedenza a chi è più basso di quota, avviandosi al contatto quando si è il mezzo a quota inferiore.",
    tranello: "Non è ammesso alternare liberamente otto e C nello stesso momento: la disomogeneità delle traiettorie compromette la separazione del traffico."
  },
  7029: {
    regola: "L'attrito col terreno crea gradiente: la velocità del vento cala drasticamente negli ultimi metri dal suolo; se ne deve tenere conto in atterraggio e vicino al pendio.",
    tranello: "In quota in termica il gradiente da attrito al suolo è trascurabile; è a ridosso degli ostacoli e in atterraggio che provoca perdite improvvise di portanza."
  },
  7030: {
    regola: "Con vento forte il tratto finale controvento riduce drasticamente l'avanzamento al suolo; iniziare la virata base non troppo oltre il traverso evita di atterrare corti.",
    tranello: "Allungare troppo il sottovento con vento sostenuto impedisce all'ala di avanzare a sufficienza nel finale controvento, finendo fuori campo."
  },
  7031: {
    regola: "Se l'asse degli otto viene impostato troppo a ridosso della toccata, il pilota esaurisce lo spazio e si trova costretto a completare l'ultima virata a quota pericolosamente bassa.",
    tranello: "L'asse degli otto va tenuto arretrato rispetto al campo per poter concludere con un finale rettilineo e livellato di congrua lunghezza."
  },
  7032: {
    regola: "Controvento forte la traiettoria reale è ripida; mantenere velocità elevata contrasta il wind shear da gradiente e fornisce l'energia cinetica per il raccordo finale vicino a terra.",
    tranello: "Rallentare in finale con vento forte per 'scendere piano' fa crollare l'ala nello stallo da gradiente non appena il vento relativo cala negli ultimi metri."
  },
  7033: {
    regola: "Scendendo nel gradiente il vento cala repentinamente: l'ala perde vento relativo e portanza, aumentando il tasso di caduta con tendenza a picchiare per accelerare.",
    tranello: "Non si assiste a una frenata innocua al suolo: la perdita di vento relativo toglie portanza istantanea e fa sprofondare l'ala se non si ha riserva di velocità."
  },
  7034: {
    regola: "Mantenere velocità sostenuta in finale garantisce energia cinetica e riserva di portanza per superare indenni improvvisi cesoiamenti di vento (wind shear) o gradiente.",
    tranello: "La velocità non serve ad atterrare più ripidi, ma a conservare reattività dei comandi e margine dallo stallo vicino al terreno."
  },
  7035: {
    regola: "Controvento sostenuto, accelerare aumenta la penetrazione e massimizza l'efficienza al suolo, riducendo la pendenza della traiettoria e garantendo il sorvolo degli ostacoli.",
    tranello: "Volare alla minima caduta controvento blocca l'avanzamento sul terreno, facendo sprofondare il mezzo direttamente contro gli ostacoli a monte della pista."
  },
  7036: {
    regola: "Il controllo visivo del fascio funicolare, bretelle e nodi va eseguito a terra durante la preparazione e stesura dell'ala prima di accingersi al gonfiaggio.",
    tranello: "Accorgersi di cordini attorcigliati o chiavi dopo il decollo o a vela alzata è troppo tardi ed espone al rischio immediato di vite o chiusura asimmetrica."
  },
  7037: {
    regola: "Nel volo di cross è indispensabile padroneggiare la precisione d'atterraggio per posarsi in sicurezza su fazzoletti di terreno sconosciuti o pendenze montane non preparate.",
    tranello: "Non si atterra mai col vento in coda per accorciare il campo: atterrare a favore di vento raddoppia la velocità d'impatto al suolo provocando lesioni gravissime."
  },
  7038: {
    regola: "I controlli di sicurezza pre-decollo (check-list a 5 punti) verificano: pilota e scarpe, cosciali e imbrago allacciati, bretelle e comandi in mano, vela disposta, casco, meteo e spazio aereo.",
    tranello: "Dimenticare i cosciali dell'imbrago o il casco allacciato è una delle cause primarie di incidenti mortali al momento dello stacco dal decollo."
  },
  7039: {
    regola: "La larghezza della ventrale tra i maillons e l'altezza di sospensione devono rispettare scrupolosamente i valori riportati sulla targhetta di omologazione dell'ala.",
    tranello: "Una ventrale regolata a caso altera drasticamente il comportamento omologato: troppo larga rende l'ala instabile, troppo stretta ostacola il pilotaggio col peso."
  },
  7040: {
    regola: "Il tessuto bagnato appesantisce l'ala e altera lo strato limite favorendo lo stallo paracadutale; occorre volare veloci con comandi alti e manovre dolcissime.",
    tranello: "Fare le orecchie con la vela umida o bagnata è pericolosissimo poiché riduce la superficie alare e innesca uno stallo paracadutale spesso irrecuperabile."
  },
  7041: {
    regola: "Il decollo fronte all'ala (reverse launch) è indicato con vento sostenuto, poiché permette di controllare visivamente la salita dell'ala e smorzare le raffiche camminando in avanti.",
    tranello: "Con vento calmo o debolissimo il decollo fronte vela non è consigliato perché non vi è pressione dinamica sufficiente a gonfiare la vela all'indietro."
  },
  7042: {
    regola: "Le fasi del decollo sono: gonfiaggio, sollevamento e arresto con i freni allo zenit, controllo visivo della campata, decisa rincorsa con aumento di velocità e involo.",
    tranello: "Correre alla cieca senza aver fermato e controllato a vista l'ala sulla verticale espone a decollare con nodi, cravatte o asimmetrie vicino al terreno."
  },
  7043: {
    regola: "Prima di voltarsi fronte valle per la corsa bisogna stabilizzare perfettamente l'ala sulla verticale con bretelle e freni, per evitare sbandamenti o anticipi dell'ala.",
    tranello: "Girarsi precipitosamente o mollare i freni durante la rotazione fa scappare la vela in avanti o fuori asse, causando rovinosi trascinamenti."
  },
  7044: {
    regola: "Con vento al traverso moderato si stende e gonfia la vela allineata controvento, conducendola poi con i freni lungo la linea di massima pendenza durante la rincorsa.",
    tranello: "Correre di traverso su un pendio ripido sbilancia l'appoggio degli arti e rischia di far scivolare il pilota prima di aver acquisito portanza."
  },
  7045: {
    regola: "Nel decollo corretto il pilota, verificata l'ala allo zenit, sporge il busto in avanti e corre accelerando con determinazione finché la portanza non lo solleva in volo.",
    tranello: "Inclinarsi all'indietro guardando la vela frena l'avanzamento, scarica la portanza e provoca pericolosi decolli mancati o stalli a ridosso del pendio."
  },
  7046: {
    regola: "Per abortire il decollo si trazionano a fondo e simmetricamente i freni per far stallare la vela all'indietro fungendo da freno aerodinamico, fermando gradualmente la corsa.",
    tranello: "Arrestare bruscamente le sole gambe senza stallare l'ala fa proiettare o trascinare il pilota in avanti lungo la scarpata dalla trazione residua."
  },
  7047: {
    regola: "Trattenere le bretelle A a vela alzata durante la corsa forza l'ala a un'incidenza negativa rispetto alla traiettoria, provocando un'immediata chiusura frontale.",
    tranello: "Le bretelle anteriori servono esclusivamente per la salita iniziale della vela; vanno rilasciate non appena la vela raggiunge la verticale."
  },
  7048: {
    regola: "In una chiusura asimmetrica la priorità assoluta è la rotta: contrastare col peso e leggero freno opposto per allontanarsi dal rilievo, e solo dopo intervenire per riaprire.",
    tranello: "Pompare precipitosamente sul lato chiuso senza governare la rotta manda l'ala in autorotazione o vite negativa dritta contro il costone roccioso."
  },
  7049: {
    regola: "Lo spostamento laterale del baricentro nella selletta carica la semiala interna provocando rollio e virata coordinata, con intensità dipendente dal tipo e regolazione dell'imbrago.",
    tranello: "Il solo spostamento di peso non provoca alcuno stallo (anzi è la manovra più pulita ed efficiente per iniziare la virata risparmiando resistenza)."
  },
  7050: {
    regola: "Per virate ottimali si imposta l'inclinazione col peso rilasciando il freno opposto (esterno), modulando poi la curva con entrambi i freni per stabilizzare l'assetto.",
    tranello: "Tirare il freno interno a fondo tenendo frenato anche l'esterno strozza il profilo, aumenta drasticamente la caduta ed espone allo stallo d'ala."
  },
  7051: {
    regola: "In termica si sceglie il miglior compromesso tra inclinazione e raggio di virata per non fuoriuscire dal nucleo ascensionale, minimizzando la caduta propria compatibilmente col raggio.",
    tranello: "Volare troppo piatti allarga il raggio facendo scivolare l'ala fuori dall'ascendenza; fare 'otto' spezza il ritmo e fa perdere il centro della termica."
  },
  7052: {
    regola: "Lo stallo in parapendio va provato solo durante corsi SIV con istruttore qualificato, sopra specchi d'acqua, con salvagente e imbarcazione di soccorso pronta.",
    tranello: "Provare avvicinamenti allo stallo da soli o sulla terraferma espone al rischio di cravatte, avvitamenti incontrollabili e impatti al suolo ad alta velocità."
  },
  7053: {
    regola: "Nello stallo paracadutale la vela resta aperta e gonfia, l'avanzamento orizzontale all'aria è praticamente nullo e il variometro segna una caduta verticale elevata (5-8 m/s).",
    tranello: "Non vi sono chiusure d'ala né rotazioni: l'ala ha forma normale ma non vola in avanti; il rumore del vento è verticale e le maniglie risultano leggere."
  },
  7054: {
    regola: "In full stall si mantengono i comandi affondati finché l'ala non si stabilizza sopra la testa, rilasciando poi simmetricamente e gradualmente pronti a frenare l'abbattimento in avanti.",
    tranello: "Rilasciare i freni precipitosamente mentre l'ala è arretrata causa un abbattimento violento in avanti con rischio di cadere direttamente all'interno della vela."
  },
  7055: {
    regola: "Le manovre standard per perdere rapidamente quota sono: le orecchie (piccole o grandi, abbinabili a speed-bar), i wing-over accentuati e la spirale picchiata.",
    tranello: "Lo stallo non è una manovra di discesa controllata ma una grave emergenza aerodinamica; le virate piatte ordinarie non smaltiscono quota a sufficienza."
  },
  7056: {
    regola: "Tirare simmetricamente gli elevatori posteriori altera la curvatura complessiva del profilo alare, producendo una contemporanea variazione di assetto, incidenza e velocità.",
    tranello: "Non varia solo l'incidenza: la trazione sugli elevatori posteriori deforma l'intero bordo d'uscita modificando l'equilibrio cinematico dell'ala."
  },
  7057: {
    regola: "In caso di rottura di una maniglia o cordino freno è perfettamente possibile governare direzione e velocità tirando dolcemente le bretelle posteriori.",
    tranello: "Non è impossibile pilotare senza freni: il controllo con gli elevatori posteriori è una manovra d'emergenza fondamentale insegnata a scuola di volo."
  },
  7058: {
    regola: "L'uso della pedalina dell'acceleratore riduce l'incidenza delle bretelle anteriori aumentando la velocità dell'ala entro i limiti geometrici e di omologazione previsti dal costruttore.",
    tranello: "Non si può variare la velocità a proprio piacimento: oltre la corsa omologata dell'acceleratore l'incidenza scenderebbe a valori negativi provocando chiusure frontali."
  },
  7059: {
    regola: "Le oscillazioni di rollio da sovracorrezione (PIO) si arrestano smettendo di controsterzare e applicando una decisa frenata simmetrica per ricaricare e stabilizzare la campata.",
    tranello: "Insistere a dare comandi alternati in controfase amplifica le oscillazioni per ritardo di risposta, rischiando di far collassare l'estremità alare."
  },
  7060: {
    regola: "In finale con vento moderato: velocità sino a 4-5 metri da terra, primo tocco sui comandi per smaltire e spianare la traiettoria, poi frenata progressiva e completa sino al contatto.",
    tranello: "Stallare di colpo a 1 metro senza prima raccordare fa cadere duramente il pilota; volare lenti fin dall'inizio espone allo stallo da gradiente di vento."
  },
  7061: {
    regola: "Con vento a 25° rispetto al pendio si orienta la vela controvento per un gonfiaggio simmetrico, curvando poi la rincorsa lungo la massima pendenza per staccarsi agevolmente.",
    tranello: "Gonfiare di sbieco lungo la pendenza con vento al traverso fa decollare la vela asimmetrica; correre di traverso rischia di far inciampare sulle asperità."
  },
  7062: {
    regola: "Il controllo dell'avvenuto aggancio del pilota al deltaplano (hang check) è il controllo vitale per antonomasia, la cui omissione ha storicamente causato incidenti gravissimi e fatali.",
    tranello: "L'allineamento o il paracadute sono controlli standard, ma staccarsi dal pendio senza essere agganciati al deltaplano non lascia alcuna via di scampo."
  },
  7063: {
    regola: "L'hang check ottimale si esegue con un assistente che tiene la chiglia, disponendosi stesi in posizione di volo orizzontale per verificare tensione del nastro e distanza dalla barra.",
    tranello: "La sola occhiata al moschettone può trarre in inganno se il moschettone è agganciato a un cordino errato o non è in tensione di carico reale."
  },
  7064: {
    regola: "Con vento sostenuto gli assistenti possono tenere l'ala a terra, ma durante la rincorsa nessuno deve trattenere il deltaplano per non indurre asimmetrie e rotazioni incontrollabili.",
    tranello: "Se un assistente trattiene o spinge un'estremità mentre l'altro la rilascia, l'ala imbarderà violentemente toccando con l'ala il terreno."
  },
  7065: {
    regola: "Con vento angolato entro 45° e moderato si corre lungo la linea di massima pendenza orientando parzialmente la prua controvento per mantenere le semiali bilanciate.",
    tranello: "Non si corre di traverso sui sassi né si decolla con vento forte al traverso: solo con intensità limitata la prua controvento consente un decollo sicuro."
  },
  7066: {
    regola: "Se il pilota spinge in avanti la barra cabrando prima di raggiungere la velocità di sostentamento, l'incidenza supera il valore critico provocando uno stallo immediato vicino a terra.",
    tranello: "Cabrare non fa salire prima l'ala: senza adeguata velocità anemometrica l'ala stalla all'istante precipitando sul pendio di decollo."
  },
  7067: {
    regola: "L'interruzione di decollo in deltaplano è consentita solo per emergenza estrema prima dello stacco, poiché l'inerzia della struttura comporta quasi sempre rotture del mezzo e lesioni.",
    tranello: "A differenza del parapendio, non si può abortire con facilità: una volta partita la rincorsa decisa, la via più sicura è completare il decollo e volare via."
  },
  7068: {
    regola: "In deltaplano il pilota si infila nell'imbrago solo dopo aver acquisito quota di sicurezza, perfetta velocità e controllo direzionale lontano dal costone.",
    tranello: "Tentare di infilarsi nell'imbrago a pochi metri dal decollo distrae dai comandi e altera il baricentro mentre si è ancora a rischio ostacoli."
  },
  7069: {
    regola: "Nel deltaplano il controllo del beccheggio avviene per spostamento pendolare del baricentro del pilota agendo sulla barra di controllo con movimenti di spinta o trazione.",
    tranello: "Il corpo non deve scaricare il proprio peso appoggiandosi alla barra; il peso è retto dal punto di sospensione e le braccia applicano solo traslazione relativa."
  },
  7070: {
    regola: "La virata corretta richiede: presa di velocità tirando la barra, traslazione laterale del corpo parallelo alla chiglia, leggera spinta per coordinare e ritorno al centro.",
    tranello: "Ruotare il corpo o spingere asimmetricamente sulla barra senza traslare il baricentro non genera una virata pulita e induce scivolate d'ala."
  },
  7071: {
    regola: "In virata inclinata la componente verticale di portanza diminuisce; una mancata coordinazione con insufficiente spinta sulla barra causa una scivolata d'ala verso l'interno.",
    tranello: "Non è l'eccesso di spinta a far scivolare: è la carenza di spinta (incidenza troppo bassa rispetto al fattore di carico) a far perdere quota alla semiala interna."
  },
  7072: {
    regola: "Il controllo di rollio si ottiene spostando lateralmente il corpo rispetto alla barra di controllo, mantenendolo costantemente parallelo alla chiglia del deltaplano.",
    tranello: "Ruotare il corpo senza traslare il bacino non sposta efficacemente il centro di gravità rispetto al trapezio dell'ala."
  },
  7073: {
    regola: "L'ala rigida (Classe 5 / Swift) dispone di comandi aerodinamici mobili (spoiler, alettoni, flap) che agiscono in sinergia con lo spostamento del peso del pilota.",
    tranello: "A differenza dei deltaplani flessibili puri, la rigidità strutturale impedisce la deformazione velica, richiedendo superfici mobili per rollio e controllo."
  },
  7074: {
    regola: "La prova di stallo in quota si effettua spingendo dolcemente e gradualmente la barra fino allo stallo, ripristinando immediatamente la velocità tirando la barra alla rimessa.",
    tranello: "Non bisogna dare spinte brusche o veloci: una spinta improvvisa porta allo stallo a campana e al rischio di rovesciamento (tumble)."
  },
  7075: {
    regola: "Entrato nel nucleo termico, il pilota spinge leggermente la barra per volare alla velocità di minimo tasso di caduta ed esegue virate a 360° per restare nell'ascendenza.",
    tranello: "Volare alla massima efficienza comporta velocità troppo alta e raggio di virata troppo ampio, facendo uscire il deltaplano dall'area utile di salita."
  },
  7076: {
    regola: "Il tumbling è una catastrofica instabilità di beccheggio in cui il deltaplano ruota continuamente in avanti su se stesso a seguito di rotori o fortissime turbolenze.",
    tranello: "Non è un'acrobazia voluta né una discesa rapida: è un'emergenza estrema con rischio di cedimento strutturale che richiede l'immediato lancio del paracadute."
  },
  7077: {
    regola: "Per aumentare la velocità di trim (assetto a comandi liberi) si sposta in avanti il punto di aggancio sulla chiglia, avanzando il baricentro e picchiando l'ala.",
    tranello: "Spostare l'aggancio indietro arretrerebbe il baricentro rendendo il deltaplano più cabrato e lento, vicino alla velocità di stallo."
  },
  7078: {
    regola: "La sequenza finale d'atterraggio prevede raccordo a filo d'erba mantenendo volo orizzontale (smaltita) sino a spingere con decisione la barra (flare) alla minima velocità.",
    tranello: "Spingere la barra troppo presto a 4-5 metri dal suolo fa impennare il delta e precipitare a terra senza velocità residua."
  },
  7079: {
    regola: "Il pilota si porta in posizione verticale con le mani sui montanti in finale durante il raccordo vicino a terra, preparandosi alla spinta decisiva di stallo (flare).",
    tranello: "Mettersi verticali troppo presto rovina la penetrazione aerodinamica; aspettare lo stallo impedisce di impugnare saldamente i montanti per la spinta."
  }
};

const srcFile = path.resolve('src/data/questions.json');
const pubFile = path.resolve('public/data/questions.json');

[srcFile, pubFile].forEach(filePath => {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let updatedCount = 0;

  data.forEach(q => {
    // Clean OCR artifacts
    if (q.id === 7005 && q.options && q.options[2]) {
      q.options[2] = q.options[2].replace(/\s*I PILOTAGGIO\s*$/, '').trim();
    }
    if (q.id === 7079 && q.options && q.options[2]) {
      q.options[2] = q.options[2].replace(/\s*8 - MAT\s*$/, '').trim();
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
