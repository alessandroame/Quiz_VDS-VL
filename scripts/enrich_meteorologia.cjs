/**
 * Script to enrich Materia 5: Meteorologia e Aerologia (120 quizzes: #5001-#5120)
 * with bespoke Regola and Tranello explanations and clean OCR artifacts.
 */
const fs = require('fs');
const path = require('path');

const explanations = {
  5001: {
    regola: "L'atmosfera è l'involucro gassoso gravitazionalmente legato alla Terra, stratificato in sfere concentriche, la cui fascia basale a contatto col suolo è la troposfera.",
    tranello: "L'atmosfera non ha spessore illimitato né si esaurisce rigidamente a 12 km (quota limite della sola troposfera media)."
  },
  5002: {
    regola: "La troposfera è delimitata superiormente dalla tropopausa, una fascia di transizione termica isotermica dove il gradiente termico verticale dell'aria diviene praticamente nullo.",
    tranello: "La troposfera non termina dove la pressione si azzera né dove scompare l'umidità, ma in corrispondenza dell'arresto del gradiente termico verticale."
  },
  5003: {
    regola: "La quasi totalità del vapore acqueo e della massa atmosferica è concentrata nella troposfera, rendendola l'unica sede dei fenomeni meteorologici e delle nubi.",
    tranello: "Gli strati superiori (stratosfera, mesosfera) sono privi di vapore e moti convettivi umidi; nella troposfera i fenomeni avvengono a tutte le sue quote, non solo in basso."
  },
  5004: {
    regola: "A causa della forza centrifuga terrestre e del riscaldamento solare differenziale, la tropopausa oscilla mediamente tra 8 km ai poli e 16 km all'equatore, variando anche con le stagioni.",
    tranello: "La tropopausa non ha una quota fissa di 12 km e risente sensibilmente del ciclo stagionale e delle masse d'aria transitorie."
  },
  5005: {
    regola: "L'aria troposferica è una miscela composta prevalentemente da azoto (78%), ossigeno (21%), vapore acqueo in percentuali variabili (0-4%) e gas rari (argo, elio).",
    tranello: "Il vapore acqueo condensato non è un gas ma goccioline d'acqua liquida; l'aria secca contiene principalmente azoto e ossigeno."
  },
  5006: {
    regola: "Il triangolo fondamentale della meteorologia è costituito da pressione barica, temperatura e umidità: le loro combinazioni guidano i moti d'aria e i passaggi di stato.",
    tranello: "La densità e la velocità del vento sono conseguenze idrodinamiche e termodinamiche derivate dalle differenze primarie di pressione e temperatura."
  },
  5007: {
    regola: "L'acqua allo stato gassoso (vapore acqueo) è un gas perfettamente trasparente e invisibile finché non condensa in goccioline liquide o cristalli di ghiaccio.",
    tranello: "Si confonde popolarmente il vapore con il fumo o la nebbia; quando vediamo 'fumare' una pentola stiamo osservando goccioline liquide già condensate."
  },
  5008: {
    regola: "In tutta la troposfera terrestre naturale è sempre presente almeno una frazione infinitesima di vapore acqueo, persino nelle zone desertiche o nei ghiacci polari.",
    tranello: "Nemmeno l'aria desertica più arida è a umidità assoluta zero; l'aria totalmente secca è un'astrazione fisica usata solo nei modelli teorici."
  },
  5009: {
    regola: "L'umidità assoluta esprime la quantità in grammi di vapore acqueo presente in un volume di un metro cubo d'aria (g/m³).",
    tranello: "Non confonderla con l'umidità specifica (g/kg d'aria) né con il contenuto di saturazione massima."
  },
  5010: {
    regola: "L'umidità specifica è il rapporto tra la massa di vapore acqueo e la massa totale d'aria, misurata dimensionalmente in grammi per chilogrammo d'aria (g/kg).",
    tranello: "L'umidità specifica si riferisce alla massa d'aria (g/kg), mentre l'umidità assoluta si calcola sul volume (g/m³)."
  },
  5011: {
    regola: "L'umidità relativa è il rapporto percentuale tra il contenuto attuale di vapore acqueo dell'aria e il massimo contenuto possibile alla saturazione per quella temperatura e pressione.",
    tranello: "Non è una quantità assoluta in volume o in peso, ma una grandezza adimensionale percentuale fortemente legata alla temperatura dell'aria."
  },
  5012: {
    regola: "L'aria fredda può trattenere meno vapore dell'aria calda; raffreddando l'aria a pressione costante la capacità di saturazione cala e l'umidità relativa sale verso il 100%.",
    tranello: "Abbassare la temperatura riduce la capacità massima di vapore dell'aria, quindi il rapporto percentuale UR cresce, non diminuisce."
  },
  5013: {
    regola: "Comprimendo l'aria a temperatura costante si riduce il volume a parità di vapore, aumentando la tensione di vapore fino a raggiungere anche la saturazione al 100%.",
    tranello: "L'aumento di sola pressione barica avvicina le molecole e aumenta la concentrazione di vapore nel volume ridotto, innalzando l'umidità relativa."
  },
  5014: {
    regola: "La temperatura di rugiada (dew point) è la temperatura alla quale l'aria diverrebbe satura se raffreddata a pressione costante senza scambi di umidità.",
    tranello: "Non si ottiene riscaldando l'aria (che allontanerebbe dalla saturazione) né aumentando la pressione."
  },
  5015: {
    regola: "Al 100% di umidità relativa l'aria è completamente satura di vapore e ogni ulteriore apporto d'umidità o raffreddamento innesca il processo di condensazione.",
    tranello: "La saturazione al 100% è la condizione necessaria per la condensazione; non impedisce affatto la nascita di nubi o nebbia."
  },
  5016: {
    regola: "A pressione costante, per far condensare il vapore acqueo è necessario abbassare la temperatura dell'aria fino al raggiungimento della sua temperatura di rugiada.",
    tranello: "Riscaldare l'aria allontana dalla saturazione; a pressione costante la condensazione richiede inderogabilmente il calo termico."
  },
  5017: {
    regola: "Il passaggio di stato da gas a liquido (condensazione) sprigiona calore latente di condensazione (circa 2500 kJ/kg) che viene ceduto all'aria circostante riscaldandola.",
    tranello: "I passaggi di stato scambiano ingenti quantità di calore; la condensazione è un processo esotermico che rilascia energia termica sensibile nell'aria."
  },
  5018: {
    regola: "L'evaporazione è un processo endotermico: per passare allo stato gassoso l'acqua assorbe calore dall'ambiente, abbassando la temperatura dell'acqua residua e dell'aria.",
    tranello: "L'evaporazione consuma calore sottraendolo all'ambiente; non libera calore (che è invece proprio della condensazione)."
  },
  5019: {
    regola: "Quando si verifica la condensazione del vapore acqueo, il rilascio di calore latente tende a fare aumentare la temperatura della massa d'aria se non intervengono dispersioni.",
    tranello: "In atmosfera la condensazione accompagna la salita dell'aria, ma il contributo proprio del cambio di stato è di riscaldare l'aria rallentandone il raffreddamento."
  },
  5020: {
    regola: "I processi di condensazione e di evaporazione dell'acqua rispettivamente forniscono e sottraggono calore alla massa d'aria interessata.",
    tranello: "Non confondere i segni energetici dei due processi termodinamici: la condensazione cede calore, l'evaporazione lo assorbe."
  },
  5021: {
    regola: "I fenomeni meteorologici sono ampiamente alimentati dai cicli di evaporazione oceanica e rilascio di calore latente nelle nubi e temporali.",
    tranello: "I cambi di stato dell'acqua sono la sorgente primaria di energia per temporali, fronti e circolazione convettiva planetaria."
  },
  5022: {
    regola: "Le nubi visibili in cielo non sono costituite da vapore (che è trasparente e invisibile), bensì da minuscole goccioline di acqua liquida o cristalli di ghiaccio sospesi.",
    tranello: "Il gergo comune chiama 'vapore' la nuvola bianca; fisicamente la nuvola è acqua già condensata allo stato liquido o solido."
  },
  5023: {
    regola: "La pressione atmosferica è definita fisicamente come il peso della colonna d'aria che insiste sull'unità di superficie orizzontale.",
    tranello: "Non è legata solo a un valore fisso o a una colonna d'altezza unitaria, ma al peso totale della massa gassosa sovrastante per unità d'area."
  },
  5024: {
    regola: "Lo strumento deputato alla misurazione della pressione atmosferica è il barometro (a mercurio o a capsula aneroide metallica).",
    tranello: "L'anemometro misura la velocità del vento; il pressostato è un interruttore elettromeccanico di controllo per circuiti a pressione."
  },
  5025: {
    regola: "La diminuzione della pressione atmosferica con l'aumentare dell'altitudine prende il nome di gradiente barico verticale (circa 1 hPa ogni 8,5 metri al suolo).",
    tranello: "Il gradiente barico orizzontale misura le variazioni geografiche di pressione; il gradiente termico riguarda la temperatura."
  },
  5026: {
    regola: "A circa 5500 metri di altitudine risiede la superficie isobarica di 500 hPa, dove la pressione è esattamente la metà di quella standard a livello del mare.",
    tranello: "La pressione non scende a zero a quote basse né a un quarto; a 5500 m corrisponde a circa metà del valore marino."
  },
  5027: {
    regola: "Nell'atmosfera standard internazionale (ISA) la pressione di riferimento al livello del mare è stabilita a 1013.2 millibar o hectopascal (hPa).",
    tranello: "760 è il valore espresso in millimetri di mercurio (mmHg), mentre in millibar o hectopascal il valore convenzionale è 1013.2."
  },
  5028: {
    regola: "Se due punti sulla superficie terrestre alla medesima elevazione presentano valori di pressione diversi, tra di essi esiste un gradiente barico orizzontale.",
    tranello: "Non si tratta di gradiente verticale (che misura il cambio di quota), ma di gradiente barico orizzontale, motore primario del vento."
  },
  5029: {
    regola: "Le isobare sono le linee ideali tracciate sulle carte meteorologiche che uniscono i punti geografici con uguale valore di pressione atmosferica.",
    tranello: "Le linee di uguale quota sono le isoipse; le linee di uguale temperatura sono le isoterme."
  },
  5030: {
    regola: "Il vento di gradiente è uno spostamento di masse d'aria indotto dalla forza di gradiente da zone ad alta pressione verso zone a bassa pressione.",
    tranello: "L'aria non si muove mai spontaneamente da bassa ad alta pressione; il flusso primario scorre sempre verso il minimo di pressione."
  },
  5031: {
    regola: "La traiettoria del vento non è rettilinea tra alta e bassa pressione a causa dell'azione combinata della forza di Coriolis e dell'attrito col suolo.",
    tranello: "Non sono solo gli ostacoli locali a deviare il flusso, ma la rotazione terrestre su scala sinottica e l'attrito superficiale."
  },
  5032: {
    regola: "La forza di Coriolis è una forza d'inerzia apparente generata dalla rotazione giornaliera della Terra attorno al proprio asse polare.",
    tranello: "È la rotazione terrestre attorno al proprio asse a causare l'effetto Coriolis, non il moto di rivoluzione attorno al Sole."
  },
  5033: {
    regola: "Nell'emisfero Nord la forza di Coriolis devia qualsiasi massa d'aria o corpo in movimento verso la propria destra rispetto alla direzione di moto.",
    tranello: "Nell'emisfero Sud la deviazione avviene a sinistra; nell'emisfero Nord è sempre e rigorosamente verso destra."
  },
  5034: {
    regola: "Attorno a un'alta pressione nell'emisfero Nord, l'aria divergente deviata a destra da Coriolis circola in senso orario se osservata dall'alto.",
    tranello: "Attorno alle basse pressioni il moto è antiorario; negli anticicloni visti dall'alto è orario."
  },
  5035: {
    regola: "Attorno a una bassa pressione nell'emisfero Nord, l'aria convergente deviata a destra da Coriolis instaura una circolazione ciclonica in senso antiorario dall'alto.",
    tranello: "Attenzione alle prospettive: la circolazione ciclonica è antioraria se osservata dall'alto (satellite o carta meteo)."
  },
  5036: {
    regola: "Le basse pressioni sono dette aree cicloniche e indicate con L/B; le alte pressioni sono dette aree anticicloniche e indicate con H/A sulle carte sinottiche.",
    tranello: "Attenzione alle corrispondenze: ciclonica = Bassa (L/B, Low/Bassa); anticiclonica = Alta (H/A, High/Alta)."
  },
  5037: {
    regola: "Isobare molto ravvicinate sulla carta del tempo evidenziano un gradiente barico orizzontale elevato, indicando vento sostenuto o forte.",
    tranello: "Isobare fitte non indicano gradiente verticale ma orizzontale elevato, sinonimo di correnti aeree molto intense."
  },
  5038: {
    regola: "L'osservazione delle isobare consente di individuare direzione (parallela alle isobare) e intensità del vento (spaziatura isobare) oltre ai centri di pressione.",
    tranello: "Le isobare non forniscono solo dati sulla nuvolosità o sul gradiente verticale, ma sono il diagramma fondamentale dei venti sinottici."
  },
  5039: {
    regola: "Nel Volo Libero per vento meteorologico si intende il vento di gradiente su scala sinottica, generato dalla disposizione generale delle isobare.",
    tranello: "Non sono le brezze termiche locali di valle né i temporali isolati: è il vento a macroscala dettato dalla configurazione barica."
  },
  5040: {
    regola: "Nella rosa dei venti aeronautica il vento da Sud spira esattamente dalla direzione di 180° della bussola.",
    tranello: "135° corrisponde a Sud-Est (Scirocco); 270° a Ovest (Ponente); il Sud puro (Ostro) è a 180°."
  },
  5041: {
    regola: "Un vento proveniente da Nord-Est (Grecale) ha una direzione di provenienza angolare pari esattamente a 45°.",
    tranello: "225° è la provenienza opposta (Sud-Ovest / Libeccio); 135° è Sud-Est (Scirocco)."
  },
  5042: {
    regola: "Con bassa pressione centrata a Nord nell'emisfero settentrionale, il flusso ruota in senso antiorario e sul bordo meridionale soffia da Ovest verso Est.",
    tranello: "L'aria non punta direttamente verso Nord: il flusso ciclonico antiorario spira da Ovest per chi si trova a Sud del centro."
  },
  5043: {
    regola: "Con bassa pressione a Est, la circolazione antioraria sul settore occidentale della depressione convoglia correnti da Nord verso Sud.",
    tranello: "A Ovest del perno ciclonico antiorario il vento scende da Nord verso Sud (vento di provenienza settentrionale)."
  },
  5044: {
    regola: "Con alta pressione centrata a Nord, la circolazione anticiclonica oraria sul lato meridionale spira da Est verso Ovest.",
    tranello: "Nel moto orario anticiclonico il settore a Sud del massimo di pressione vede il vento scorrere da Est verso Ovest."
  },
  5045: {
    regola: "Con alta pressione centrata a Ovest, la circolazione oraria sul bordo orientale spinge aria discendente proveniente da Nord.",
    tranello: "Sul fianco orientale dell'anticiclone orario le correnti scorrono dal quadrante settentrionale verso Sud."
  },
  5046: {
    regola: "L'aria troposferica è trasparente alla luce solare diretta; il riscaldamento avviene in gran parte indirettamente dal suolo che irraggia e conduce calore.",
    tranello: "Il Sole non scalda direttamente l'aria per irraggiamento primario: è la superficie terrestre scaldata dal Sole a riscaldare l'aria dal basso."
  },
  5047: {
    regola: "La sequenza termica è: irraggiamento solare del suolo, conduzione di calore dal suolo all'aria sovrastante e circolazione convettiva verso l'alto.",
    tranello: "Non vi è conduzione diretta Sole-aria né riscaldamento per mera riflessione; il calore sale dal suolo per convezione."
  },
  5048: {
    regola: "Nella troposfera la temperatura dell'aria mediamente diminuisce all'aumentare della quota, poiché ci si allontana dal suolo riscaldante.",
    tranello: "Solo negli strati d'inversione termica la temperatura aumenta; nel comportamento medio della troposfera diminuisce sempre."
  },
  5049: {
    regola: "La variazione della temperatura dell'aria al variare della quota altimetrica prende il nome di gradiente termico verticale.",
    tranello: "Non confonderlo con il gradiente orizzontale (differenze geografiche) né con il gradiente barico (variazione di pressione)."
  },
  5050: {
    regola: "Nell'atmosfera standard internazionale (ISA) il gradiente termico verticale convenzionale è pari a 0.65°C ogni 100 m di quota (6.5°C/1000m).",
    tranello: "1°C/100m è il gradiente adiabatico secco dell'aria in salita, non il gradiente dell'atmosfera standard."
  },
  5051: {
    regola: "Riportando su un grafico cartesiano i valori di temperatura ambiente rilevati a varie quote si ottiene la curva o diagramma di stato dell'atmosfera locale.",
    tranello: "L'adiabatica è una curva teorica di raffreddamento di una particella in ascesa, non il rilievo effettivo dell'atmosfera reale."
  },
  5052: {
    regola: "Il gradiente termico verticale effettivo di una località e ora si ricava direttamente dalla pendenza della curva di stato dell'atmosfera di quel giorno.",
    tranello: "Le carte del tempo mostrano la situazione orizzontale delle isobare al suolo, non il profilo termico verticale ricavato dai radiosondaggi."
  },
  5053: {
    regola: "L'ascesa rapida di una massa d'aria avviene con espansione e calo termico senza scambi significativi con l'ambiente circostante: è un sollevamento adiabatico.",
    tranello: "Non è un processo che scambia calore con l'aria circostante (che lo renderebbe diabatico); è per definizione adiabatico."
  },
  5054: {
    regola: "L'aria non satura che si solleva adiabaticamente senza condensazione del vapore perde esattamente circa 1°C di temperatura ogni 100 m di dislivello.",
    tranello: "Non perde 0.65°C né valori variabili con la giornata: il gradiente adiabatico secco è una costante fisica fissa di 1°C/100m."
  },
  5055: {
    regola: "Il tasso di calo termico dell'aria non satura in ascesa si chiama gradiente adiabatico secco e si può affermare che non dipende da ora e località.",
    tranello: "Non confonderlo con il gradiente dell'aria ambiente circostante, che varia continuamente a seconda dell'insolazione e del luogo."
  },
  5056: {
    regola: "Raggiunta la saturazione (condensazione), l'aria che continua a salire si raffredda di circa 0.5°C ogni 100 m per effetto del rilascio di calore latente.",
    tranello: "Non continua a perdere 1°C/100m: la condensazione rilascia calore compensando parzialmente il raffreddamento da espansione."
  },
  5057: {
    regola: "Il sollevamento dell'aria in presenza di condensazione del vapore acqueo prende il nome di sollevamento adiabatico saturo o in regime di saturazione.",
    tranello: "Non è anomalo né secco: è il normale processo adiabatico saturo che alimenta le nubi cumuliformi."
  },
  5058: {
    regola: "Se il gradiente termico verticale dell'aria circostante è superiore a 1°C ogni 100 m (superadiabatico), l'aria si definisce instabile.",
    tranello: "Un gradiente termico ripido (> 1°C/100m) indica forte instabilità convettiva, non stabilità."
  },
  5059: {
    regola: "Il fattore determinante che indica la stabilità o instabilità della giornata è il gradiente termico verticale effettivo dell'aria ambiente.",
    tranello: "I gradienti adiabatici (secco e saturo) sono costanti fisse; ciò che decide la stabilità del giorno è il gradiente termico reale dell'atmosfera."
  },
  5060: {
    regola: "In aria instabile una bolla d'aria che inizia a salire si trova sempre più calda dell'aria circostante, accelerando la sua ascesa verso l'alto.",
    tranello: "In aria instabile la salita non si arresta ma accelera, generando forti correnti ascensionali utili al volo veleggiato."
  },
  5061: {
    regola: "Una massa d'aria umida è stabile quando il suo gradiente termico verticale è persino inferiore al gradiente adiabatico saturo (circa 0.5°C/100m).",
    tranello: "Per bloccare anche l'aria satura non basta essere sotto il gradiente secco (1°C): bisogna essere al di sotto di quello saturo (stabilità assoluta)."
  },
  5062: {
    regola: "Se il gradiente termico verticale di una massa d'aria asciutta è inferiore a 1°C ogni 100 m, essa è stabile perché la bolla si raffredda più in fretta dell'ambiente.",
    tranello: "Se l'ambiente perde meno di 1°C/100m, una bolla secca che sale a 1°C/100m diventa più fredda e pesante dell'ambiente, tendendo a ricadere."
  },
  5063: {
    regola: "Avendo temperatura superiore all'aria circostante (14°C contro 12°C), la bolla d'aria è meno densa e riceve una spinta ascensionale netta verso l'alto.",
    tranello: "L'aria più calda galleggia secondo il principio di Archimede; continuerà a salire finché non si raffredderà al livello dell'ambiente."
  },
  5064: {
    regola: "La condensazione del vapore acqueo all'interno di una bolla in ascesa rilascia calore latente, riscaldando la bolla e accelerandone il moto ascensionale.",
    tranello: "La comparsa della nube non arresta la salita: il calore latente ceduto dimezza il raffreddamento e funge da propulsore per la convezione."
  },
  5065: {
    regola: "In aria moderatamente instabile la bolla umida che raggiunge la quota di condensazione inizia a rilasciare calore latente salendo sicuramente più veloce.",
    tranello: "La base della nube non è un soffitto ma l'innesco di una risalita ancora più vigorosa dentro il cumulo."
  },
  5066: {
    regola: "In aria molto stabile una bolla calda che accenna a salire si trova presto più fredda dell'ambiente e si arresta per esaurimento della spinta di galleggiamento.",
    tranello: "La stabilità sopprime ogni moto convettivo verticale; la bolla non riesce a raggiungere quote significative."
  },
  5067: {
    regola: "Aria umida e instabile associata a forte insolazione al suolo produce potenti correnti ascensionali termo-convettive e nubi cumuliformi imponenti.",
    tranello: "Nebbia e nubi stratificate richiedono forte stabilità e aria ferma, l'esatto opposto dell'instabilità con riscaldamento solare."
  },
  5068: {
    regola: "I moti termo-convettivi sono moti ascensionali di aria che, riscaldata dal suolo e più leggera dell'aria circostante, sale per spinta di Archimede.",
    tranello: "Il sollevamento contro un costone montuoso è moto dinamico orografico; i moti convettivi nascono puramente da squilibri di densità termica."
  },
  5069: {
    regola: "Con vento debole o assente l'attività termo-convettiva in pianura e valli dà origine a bolle o colonne termiche isolate in risalita.",
    tranello: "Non si formano nubi stratificate (che richiedono stabilità) né vento di gradiente (che nasce da differenze bariche sinottiche)."
  },
  5070: {
    regola: "Una bava di vento che impatta su superfici irte di ostacoli rompe l'aderenza dello strato surriscaldato favorendo il distacco della bolla termica.",
    tranello: "Su superfici lisce e senza vento l'aria surriscaldata resta intrappolata al suolo formando un cuscino caldo che fatica a innescarsi."
  },
  5071: {
    regola: "I moti convettivi sono determinati primariamente dal forte riscaldamento solare del terreno e dal conseguente passaggio di calore per conduzione all'aria a contatto.",
    tranello: "Non nascono dalla stabilità dell'aria né dall'umidità da sola: la sorgente termica iniziale è sempre il terreno scaldato dal Sole."
  },
  5072: {
    regola: "La diversa colorazione e composizione del terreno crea gradienti termici orizzontali al suolo che innescano il distacco di bolle o colonne termiche.",
    tranello: "Il vento di gradiente dipende dalle differenze di pressione a macroscala, non dalla natura del suolo locale."
  },
  5073: {
    regola: "Se l'aria è troppo secca per raggiungere la saturazione lungo la colonna convettiva, le ascendenze si sviluppano senza nubi e si dicono termiche secche o blu.",
    tranello: "Non sono chiamate termiche adiabatiche; il termine meteorologico e aeronautico universale è 'termiche blu' (blue thermals)."
  },
  5074: {
    regola: "Se l'aria contiene adeguata umidità, la condensazione alla sommità delle termiche genera nubi cumuliformi (Cumulus humilis) che ne segnalano la presenza.",
    tranello: "I cumuli a base piatta sono i migliori marcatori visivi delle termiche; le nubi stratificate indicano invece assenza di convezione."
  },
  5075: {
    regola: "Nelle ore calde i terreni rocciosi, aridi o scuri si scaldano molto più rapidamente dell'acqua o della vegetazione verde, innescando potenti moti convettivi.",
    tranello: "L'acqua e i boschi umidi assorbono calore latente senza scaldarsi, comportandosi da aree stabili o discendenti rispetto alle pietraie."
  },
  5076: {
    regola: "Oltre alla convezione termica, l'aria può sollevarsi per via meccanica forzata quando una corrente di vento impatta contro rilievi montuosi.",
    tranello: "In pianura il vento orizzontale scorre parallelo al suolo senza generare sollevamento orografico forzato."
  },
  5077: {
    regola: "Il sollevamento dell'aria causato dal vento che urta un pendio montuoso si definisce sollevamento dinamico (o veleggiamento dinamico di pendio).",
    tranello: "Non è sollevamento adiabatico né termico puro: è originato dalla deviazione geometrica del flusso contro il costone montuoso."
  },
  5078: {
    regola: "Un sollevamento dinamico forzato può innescare convezione termica libera se l'aria è instabile e il sollevamento supera la quota di condensazione.",
    tranello: "Non avviene in aria stabile; richiede instabilità condizionata affinché il rilascio di calore latente alimenti l'ascesa spontanea."
  },
  5079: {
    regola: "Quando bolle termiche si staccano lungo un pendio battuto da vento favorevole, la componente dinamica si somma alla termica creando potenti ascendenze.",
    tranello: "Non si generano solo turbolenze: la cooperazione tra spinta orografica e bolla termica crea condizioni ascensionali molto generose."
  },
  5080: {
    regola: "L'inversione termica è un andamento anomalo in cui la temperatura dell'aria aumenta invece di diminuire con il crescere dell'altitudine.",
    tranello: "Non è una diminuzione marcata ma l'esatto contrario: un riscaldamento anomalo dell'aria salendo in quota che blocca i moti verticali."
  },
  5081: {
    regola: "L'inversione termica notturna al suolo raffredda l'aria a contatto col terreno sotto il punto di rugiada, favorendo la formazione di nebbia da irraggiamento.",
    tranello: "Sotto l'inversione non si formano cumuli convettivi né migliora la visibilità: l'aria fredda intrappolata genera nebbie e foschie dense."
  },
  5082: {
    regola: "Dal decollo l'inversione termica sottostante è riconoscibile per la presenza di una coltre di foschia o smog delimitata superiormente da un taglio orizzontale netto.",
    tranello: "Sotto l'inversione la visibilità è scarsa; lo strato superiore si presenta invece limpido e terso."
  },
  5083: {
    regola: "La presenza di uno strato d'inversione preannuncia turbolenza e variazioni marcate di vento (wind shear) e assetto nell'attraversamento della sua base.",
    tranello: "Non è una condizione neutra: passare attraverso la quota dell'inversione riserva scossoni, salti di densità e rotazioni improvvise del vento."
  },
  5084: {
    regola: "Una perturbazione frontale è il corpo nuvoloso e l'insieme dei fenomeni associati alla superficie di discontinuità tra due masse d'aria con caratteristiche fisiche diverse.",
    tranello: "Non è una semplice oscillazione barica o vento sui monti, ma la fascia di scontro e transizione tra due differenti masse d'aria."
  },
  5085: {
    regola: "Il fronte caldo è la superficie di separazione che si crea quando una massa d'aria calda in avanzamento scivola sopra una massa d'aria più fredda preesistente.",
    tranello: "Non è l'aria fredda ad avanzare (quello è il fronte freddo); nel fronte caldo è l'aria calda attiva a scorrere sopra quella fredda."
  },
  5086: {
    regola: "Il passaggio di un fronte caldo produce una sequenza di nubi stratiformi a sviluppo orizzontale (Nembostrati, Altostrati), piogge continue e rialzo della temperatura.",
    tranello: "I rovesci violenti, temporali e cumulonembi sono propri del fronte freddo, non del fronte caldo."
  },
  5087: {
    regola: "Il fronte freddo è la superficie di separazione lungo la quale una massa d'aria fredda avanza incuneandosi al di sotto di una massa d'aria più calda.",
    tranello: "L'aria fredda, più densa e pesante, scalza dal basso l'aria calda preesistente sollevandola bruscamente."
  },
  5088: {
    regola: "Il fronte freddo genera nubi a sviluppo verticale, rovesci violenti e temporaleschi, crollo della temperatura e instabilità marcata dopo il suo passaggio.",
    tranello: "Dopo il passaggio del fronte freddo l'aria non è stabile: l'aria fredda in quota instabilizza l'atmosfera generando rovesci post-frontali."
  },
  5089: {
    regola: "I cumuli a ingente sviluppo verticale (Cumuli congesti e Cumulonembi) e le condizioni di spiccata instabilità sono tipicamente associati al passaggio di un fronte freddo.",
    tranello: "Il fronte caldo porta nubi stratificate estese; i cumulonembi frontali violenti accompagnano la linea del fronte freddo."
  },
  5090: {
    regola: "Nubi stratiformi di notevole spessore come i Nembostrati (accompagnati da Altostrati e Strati) sono tipicamente associate al passaggio di un fronte caldo.",
    tranello: "I Nembostrati non sono nubi convettive temporalesche ma il classico sistema di nubi stratificate da scorrimento caldo."
  },
  5091: {
    regola: "Il fronte occluso è la perturbazione complessa generata quando il fronte freddo, più veloce, raggiunge e solleva il fronte caldo unendo i fenomeni di entrambi.",
    tranello: "Non è un semplice fronte freddo o caldo isolato: è la fusione dei due sistemi che combina nubi stratificate e rovesci cumuliformi."
  },
  5092: {
    regola: "In base alla classificazione WMO le nubi basse (suolo - 2000 m) comprendono essenzialmente Strati (Stratus) e Stratocumuli (Stratocumulus).",
    tranello: "I Cirrostrati sono nubi alte; i Nembostrati hanno sviluppo su più piani; i Cumulonembi sono nubi a sviluppo verticale."
  },
  5093: {
    regola: "Le nubi del livello medio (2000 - 6000 m) sono contraddistinte dal prefisso 'Alto-' e comprendono Altostrati e Altocumuli.",
    tranello: "I Cirrocumuli sono nubi alte; i Cumulonembi attraversano l'intera troposfera dal livello basso a quello alto."
  },
  5094: {
    regola: "Le nubi del livello alto (oltre 6000 m) sono formate da cristalli di ghiaccio e comprendono Cirri, Cirrostrati e Cirrocumuli.",
    tranello: "Altocumuli e Altostrati appartengono al livello medio; le nubi alte sono solo quelle della famiglia dei Cirri."
  },
  5095: {
    regola: "I Cumuli appartengono alla famiglia delle nubi a sviluppo verticale o convettive, generate da correnti termiche ascensionali.",
    tranello: "Non sono confinati nel solo piano basso o medio: si espandono verso l'alto attraversando diversi livelli atmosferici."
  },
  5096: {
    regola: "Il Cumulo congesto è un Cumulo in fase evolutiva avanzata caratterizzato da un imponente sviluppo verticale a cavolfiore, anticamera del temporale.",
    tranello: "Non è una nube iniziale né un cumulo bloccato: è il massimo stadio evolutivo del cumulo prima di trasformarsi in cumulonembo."
  },
  5097: {
    regola: "Il Cumulonembo è la nube temporalesca per eccellenza, culmine della convezione, accompagnata da fulmini, grandine, turbolenza estrema e violento wind shear.",
    tranello: "Non si forma solo d'estate né solo sui monti: può nascere ovunque vi sia sufficiente instabilità e forzante convettiva."
  },
  5098: {
    regola: "Per il Volo Libero il Cumulonembo è una nube estremamente letale a causa di risucchio violento, grandine, fulmini, gelo e turbolenze distruttive.",
    tranello: "Non è una nube sfruttabile per fare quota: avvicinarsi a un cumulonembo in parapendio o deltaplano costituisce un pericolo mortale."
  },
  5099: {
    regola: "La sequenza evolutiva convettiva ordinaria procede da: Cumulo di ridotte dimensioni (humilis), Cumulo congesto e infine Cumulonembo.",
    tranello: "Non inizia da nubi stratificate come Strati o Nembostrati, che appartengono a dinamiche frontali stabili."
  },
  5100: {
    regola: "Le nubi stratificate coprono uniformemente il cielo bloccando il soleggiamento e indicano aria stabile priva di moti convettivi utili al volo veleggiato.",
    tranello: "Sotto una copertura stratificata le termiche non si sviluppano: il volo libero si riduce a una discesa in aria calma verso l'atterraggio."
  },
  5101: {
    regola: "La presenza di nubi stratificate non esclude temporali se siamo in presenza di un fronte occluso, che può celare al suo interno Cumulonembi annegati.",
    tranello: "Non fidarsi della sola coltre stratiforme grigia: nei fronti occlusi i cumulonembi possono essere nascosti all'interno della nuvolosità stratificata."
  },
  5102: {
    regola: "Il forte vento perpendicolare ai rilievi genera onde orografiche stazionarie evidenziate da nubi lenticolari in cresta e nubi rotoriche nei vortici sottostanti.",
    tranello: "Non sono nubi stratificate basse né cumuli ordinari: sono formazioni stazionarie tipiche del moto ondulatorio ad alta quota."
  },
  5103: {
    regola: "Le nubi lenticolari (Altocumulus lenticularis) sono caratterizzate dalla tipica forma levigata a sezione aerodinamica, simile a una mandorla o lente.",
    tranello: "Non hanno sviluppo verticale e sembrano immobili nel cielo nonostante siano attraversate da venti violentissimi."
  },
  5104: {
    regola: "Nelle vallate montane la circolazione termica produce brezze di monte catabatiche di notte e primo mattino, e brezze di valle anabatiche nelle ore calde.",
    tranello: "La sequenza è precisa: notte = brezza di monte (verso il basso); pomeriggio caldo = brezza di valle (verso l'alto)."
  },
  5105: {
    regola: "Sulle coste marittime il riscaldamento diurno della terraferma richiama brezza dal mare nelle ore calde, mentre di notte il flusso si inverte da terra verso mare.",
    tranello: "Di giorno il vento spira dal mare verso terra (brezza di mare); di notte spira dalla costa verso il mare (brezza di terra)."
  },
  5106: {
    regola: "Le brezze che risalgono la valle generano correnti dinamiche e anabatiche lungo i versanti laterali, modulate pesantemente dalla morfologia orografica.",
    tranello: "Non sono del tutto indipendenti dal terreno: la pendenza e l'orientamento dei valloni laterali determinano dove e come la brezza si solleva."
  },
  5107: {
    regola: "La brezza di valle che risale i versanti solleva aria umida che, se l'atmosfera è instabile, può innescare imponenti cumuli e temporali orografici pomeridiani.",
    tranello: "I regimi di brezza montani non sono deboli: convogliano milioni di metri cubi d'aria calda sulle vette provocando temporali estivi violenti."
  },
  5108: {
    regola: "Nelle strozzature, strettoie o gole della valle la brezza di valle accelera pericolosamente per effetto Venturi, creando raffiche e rotori micidiali per il volo.",
    tranello: "Il pericolo maggiore della brezza non è sulle creste ma sul fondo valle in prossimità delle strettoie orografiche."
  },
  5109: {
    regola: "Quando un vento forte impatta perpendicolarmente una cresta, l'aria sul versante sottovento collassa in pericolosissimi rotori turbolenti e discendenze.",
    tranello: "Sottovento a un crinale non c'è mai calma o riparo: si trova solo una trappola di vortici e sprofondamenti letali per le ali libere."
  },
  5110: {
    regola: "Con vento forte parallelo all'asse della valle l'attrito laterale contro i versanti vallivi innesca rotori con asse pressoché parallelo alla massima pendenza.",
    tranello: "Il flusso d'aria canalizzato in valle non scorre mai laminare ma sviluppa continue turbolenze vorticose sui fianchi montuosi."
  },
  5111: {
    regola: "Quando il vento forte colpisce una valle con angolo superiore a 45°, sul fondo e sui pendii si formano rotori migratori con raffiche e direzioni del tutto caotiche.",
    tranello: "Non vi è alcuna calma nei valloni: il vento scavalca e precipita rimbalzando con rotori a barile estremamente violenti."
  },
  5112: {
    regola: "Contro un rilievo isolato e tondeggiante il vento preferisce defluire lateralmente aggirando l'ostacolo anziché scavalcarlo, non generando portanza orografica.",
    tranello: "Non tutti i rilievi producono dinamica: una collinetta isolata viene aggirata dal vento senza costringerlo a sollevarsi in quota."
  },
  5113: {
    regola: "Un rotore orografico compie una rotazione completa: la sua parte basale a contatto col pendio sottovento può risalire la china generando una falsa ascendenza.",
    tranello: "Veleggiare su questa ascendenza sottovento è un tranello gravissimo: pochi metri più in alto o verso la cresta si viene schiacciati dalla parte discendente."
  },
  5114: {
    regola: "Sul versante soleggiato in sottovento l'aria calda accumulata può essere innescata dal rotore dando origine a termiche di sottovento molto violente e turbolente.",
    tranello: "Le termiche di sottovento esistono e salgono poderose, ma sono bordate da rotori e cesoiamenti tra i più pericolosi in assoluto."
  },
  5115: {
    regola: "I rotori stazionari di cresta sono spesso rivelati da nubi rotoriche (Cumulus fractus) che si condensano nella parte ascendente ed evaporano in quella discendente.",
    tranello: "Non viaggiano veloci lontano dalla montagna: rimangono stazionarie a ridosso della cresta ruotando visibilmente sul posto."
  },
  5116: {
    regola: "L'aria umida costretta a scavalcare una catena genera Stau (nuvolosità e pioggia sopravento) e, ridiscendendo deumidificata sul versante opposto, Foehn (caldo e secco).",
    tranello: "Attenzione alle corrispondenze: Stau = sopravento (umido e piovoso); Foehn = sottovento (caldo, secco e ventoso)."
  },
  5117: {
    regola: "Il Foehn sulle Alpi italiane porta rialzo termico, forte calo dell'umidità e raffiche calde violentissime accompagnate da rotori pericolosi per il volo.",
    tranello: "Nonostante il cielo terso, il Foehn non è affatto un vento tranquillo o laminare: la sua estrema turbolenza impone lo stop assoluto del volo."
  },
  5118: {
    regola: "Salita 0-1000m secca: da 10°C a 0°C. Salita 1000-3000m satura (-0.5°C/100m): da 0°C a -10°C in cresta. Discesa 3000m secca (+1°C/100m): -10°C + 30°C = circa 20°C.",
    tranello: "Non si scalda con lo stesso tasso con cui è salita: salendo cede calore latente, scendendo si comprime a secco guadagnando l'intero grado ogni 100 metri."
  },
  5119: {
    regola: "Salita 0-2000m secca: da 10°C a -10°C. Salita 2000-3000m satura (-0.5°C/100m): da -10°C a -15°C in cresta. Discesa 3000m secca (+1°C/100m): -15°C + 30°C = circa 15°C.",
    tranello: "Condensando per soli 1000 metri la quantità di calore latente rilasciata è la metà, portando la temperatura finale a valle a circa 15°C anziché 20°C."
  },
  5120: {
    regola: "Il versante italiano sottovento all'arco alpino rispetto alle correnti umide atlantiche gode di un microclima secco e ventoso per ombra pluviometrica e Foehn.",
    tranello: "Non è freddo né umido: le masse d'aria hanno scaricato tutta la pioggia sul versante francese riscaldandosi e deumidificandosi nella discesa italiana."
  }
};

const srcFile = path.resolve('src/data/questions.json');
const pubFile = path.resolve('public/data/questions.json');

[srcFile, pubFile].forEach(filePath => {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let updatedCount = 0;

  data.forEach(q => {
    // Clean OCR artifacts
    if (q.id === 5006 && q.options && q.options[2]) {
      q.options[2] = q.options[2].replace(/\s*GIA E AEROLOGIA\s*$/, '').trim();
    }
    if (q.id === 5120 && q.options && q.options[2]) {
      q.options[2] = q.options[2].replace(/\s*6 - STRU\s*$/, '').trim();
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
