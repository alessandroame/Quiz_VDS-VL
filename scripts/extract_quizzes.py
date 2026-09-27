#!/usr/bin/env python3
"""
Script di estrazione, normalizzazione e validazione dei 504 quiz ufficiali VDS-VL
dal documento PDF AeCI 'quiz_VDS-VL_2017.pdf'.
Genera src/data/questions.json, public/data/questions.json e src/types/quiz.ts.
"""

import os
import re
import json
import pdfplumber

SUBJECTS = {
    1: {"name": "Normativa e Legislazione", "range": (1001, 1040)},
    2: {"name": "Aerodinamica", "range": (2001, 2150)},
    3: {"name": "Pronto Soccorso", "range": (3001, 3020)},
    4: {"name": "Fisiopatologia del Volo", "range": (4001, 4010)},
    5: {"name": "Meteorologia e Aerologia", "range": (5001, 5120)},
    6: {"name": "Strumenti", "range": (6001, 6020)},
    7: {"name": "Tecnica di Pilotaggio", "range": (7001, 7079)},
    8: {"name": "Materiali", "range": (8001, 8020)},
    9: {"name": "Sicurezza del Volo", "range": (9001, 9045)}
}

def clean_text(text: str) -> str:
    """Pulisce il testo da a capo incoerenti, spazi doppi e normalizza apici/virgolette."""
    text = text.replace('\r\n', '\n').replace('\r', '\n')
    text = text.replace('’', "'").replace('‘', "'")
    text = text.replace('“', '"').replace('”', '"')
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'\s*\n\s*', ' ', text)
    return text.strip()

def get_subject_for_id(qid: int):
    for sub_id, info in SUBJECTS.items():
        if info["range"][0] <= qid <= info["range"][1]:
            return sub_id, info["name"]
    raise ValueError(f"Domanda {qid} fuori dai range ufficiali delle 9 materie")

def extract_all():
    pdf_path = "quiz_VDS-VL_2017.pdf"
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"File {pdf_path} non trovato!")

    print(f"Apertura del file {pdf_path}...")
    pdf = pdfplumber.open(pdf_path)

    # 1. Estrazione Soluzioni ufficiali (pagine 50 e 51, indici 49 e 50)
    sol_text = pdf.pages[49].extract_text() + '\n' + pdf.pages[50].extract_text()
    raw_solutions = re.findall(r'(\d)\.(\d{3})\s*-\s*(\d)', sol_text)
    sol_dict = {int(f"{m[0]}{m[1]}"): int(m[2]) for m in raw_solutions}
    print(f"Soluzioni ufficiali caricate: {len(sol_dict)} (attese 504)")
    assert len(sol_dict) == 504, f"Numero soluzioni errato: {len(sol_dict)}"

    # 2. Estrazione testo colonne pagine 1-49
    columns_text = []
    for pno in range(49):
        page = pdf.pages[pno]
        mid = page.width / 2
        # Crop colonna sinistra e destra
        left = page.crop((0, 0, mid, page.height)).extract_text(layout=False) or ''
        right = page.crop((mid, 0, page.width, page.height)).extract_text(layout=False) or ''
        columns_text.append(left)
        columns_text.append(right)

    doc_raw = '\n'.join(columns_text)
    # Ricongiungi cesure di fine riga (es. del- taplano -> deltaplano)
    doc_clean = re.sub(r'(\w+)-\s*\n\s*(\w+)', r'\1\2', doc_raw)

    q_ids = sorted(list(sol_dict.keys()))
    pattern = r'(?:^|\n)(' + '|'.join([str(qid) for qid in q_ids]) + r')\s+'
    splits = list(re.finditer(pattern, doc_clean))
    print(f"Segmenti domanda identificati: {len(splits)} / 504")

    questions = []
    for i in range(len(splits)):
        qid = int(splits[i].group(1))
        start_pos = splits[i].end()
        end_pos = splits[i+1].start() if i + 1 < len(splits) else len(doc_clean)
        chunk = doc_clean[start_pos:end_pos].strip()

        # Gestione opzioni (caso anomalo 7037 numerato 4, 5, 6 nel PDF originale)
        if qid == 7037:
            m1 = re.search(r'(?:^|\n)\s*4\.\s+', chunk)
            m2 = re.search(r'(?:^|\n)\s*5\.\s+', chunk)
            m3 = re.search(r'(?:^|\n)\s*6\.\s+', chunk)
        else:
            m1 = re.search(r'(?:^|\n)\s*1\.\s+', chunk)
            m2 = re.search(r'(?:^|\n)\s*2\.\s+', chunk)
            m3 = re.search(r'(?:^|\n)\s*3\.\s+', chunk)

        if not (m1 and m2 and m3):
            raise ValueError(f"Impossibile identificare le 3 opzioni per la domanda {qid}")

        stem = clean_text(chunk[:m1.start()])
        opt1 = clean_text(chunk[m1.end():m2.start()])
        opt2 = clean_text(chunk[m2.end():m3.start()])
        opt3 = clean_text(chunk[m3.end():])

        sub_id, sub_name = get_subject_for_id(qid)
        correct_answer = sol_dict[qid]

        # Spiegazione didattica sintetica strutturata (Regola + Tranello)
        # Principi universali di volo libero, aerodinamica, micrometeo e regolamento
        explanation = generate_didactic_summary(qid, sub_id, stem, [opt1, opt2, opt3], correct_answer)

        questions.append({
            "id": qid,
            "subjectId": sub_id,
            "subjectName": sub_name,
            "question": stem,
            "options": [opt1, opt2, opt3],
            "correctAnswer": correct_answer,
            "explanation": explanation
        })

    # Validazione finale
    assert len(questions) == 504, f"Numero totale estratto non conforme: {len(questions)}"
    for q in questions:
        assert len(q["options"]) == 3, f"Domanda {q['id']} non ha 3 opzioni"
        assert q["correctAnswer"] in [1, 2, 3], f"Risposta {q['id']} fuori range"
        assert len(q["question"]) > 3, f"Testo domanda {q['id']} troppo corto"
        for opt in q["options"]:
            assert len(opt) > 0, f"Opzione vuota in domanda {q['id']}"

    print("Validazione completata con successo: 504 quesiti conformi al 100%.")
    return questions

def generate_didactic_summary(qid: int, sub_id: int, stem: str, options: list, correct: int) -> dict:
    """Genera una spiegazione sintetica ad alta densità didattica (Regola + Tranello)."""
    correct_text = options[correct - 1]
    
    # Sintesi didattiche contestuali per materia
    if sub_id == 1: # Normativa
        rule = "D.P.R. 133/2010 e regole dell'aria: rispetto rigoroso degli spazi aerei, precedenze a destra e quote di sicurezza."
        trap = "Attenzione a non confondere le regole generali VDS con quelle del volo commerciale o militare."
    elif sub_id == 2: # Aerodinamica
        rule = "Meccanica del volo: la portanza dipende dalla densità dell'aria, superficie alare, velocità al quadrato e coefficiente di portanza (angolo di incidenza)."
        trap = "Non confondere velocità al suolo (GS) con velocità all'aria (IAS): la vela risponde unicamente al flusso d'aria relativo."
    elif sub_id == 3: # Pronto Soccorso
        rule = "Protocollo d'urgenza: proteggere la scena, valutare le funzioni vitali (coscienza, respiro, circolo) e allertare il 112/118 senza muovere il traumatizzato."
        trap = "Evitare manovre brusche sulla colonna vertebrale o somministrazione di liquidi a soggetti incoscienti."
    elif sub_id == 4: # Fisiopatologia
        rule = "Fisiologia del volo: l'ipossia da quota e l'iperventilazione alterano la lucidità; l'orecchio medio richiede compensazione rapida in discesa."
        trap = "Non sottovalutare i sintomi iniziali di ipossia (euforia ingiustificata e perdita di visione periferica)."
    elif sub_id == 5: # Meteorologia
        rule = "Aerologia e termica: l'aria calda sale per galleggiamento; brezze di valle risalgono di giorno e scendono di notte (catabatiche). Attenzione ai rotori sottovento."
        trap = "Non farsi ingannare dall'assenza di vento al suolo in presenza di sviluppi cumuliformi o inversioni termiche marcate."
    elif sub_id == 6: # Strumenti
        rule = "Avionica di base: l'altimetro misura la pressione statica barometrica; il variometro rileva la variazione di pressione nel tempo."
        trap = "L'altimetro risente delle variazioni meteo locali: va tarato alla quota nota di decollo (QNH/QFE)."
    elif sub_id == 7: # Tecnica di Pilotaggio
        rule = "Controllo d'assetto: coordinare peso e comandi. Mantenere sempre velocità di sicurezza lontano dal pendio e gestire le chiusure mantenendo la direzione."
        trap = "Frenare eccessivamente per paura della velocità porta al distacco del flusso e allo stallo d'ala."
    elif sub_id == 8: # Materiali
        rule = "Tecnologia dei materiali: il tessuto da parapendio/deltaplano e i fasciami sono degradati dai raggi UV, dall'umidità e dallo sfregamento meccanico."
        trap = "Una vela apparentemente intatta può avere porosità compromessa o fascio fuori tolleranza a causa dell'invecchiamento."
    else: # Sicurezza
        rule = "Prevenzione e gestione emergenze: pianificare decollo, piano di volo e atterraggio; lanciare il paracadute di soccorso senza esitazione se l'assetto è irrecuperabile."
        trap = "Tentare di recuperare configurazioni inusuali a bassa quota ritarda fatalmente l'apertura del paracadute di soccorso."

    return {
        "rule": rule,
        "trap": trap
    }

def main():
    questions = extract_all()

    # Assicura le cartelle di destinazione
    os.makedirs("src/data", exist_ok=True)
    os.makedirs("public/data", exist_ok=True)
    os.makedirs("src/types", exist_ok=True)

    # Scrittura JSON
    for dest in ["src/data/questions.json", "public/data/questions.json"]:
        with open(dest, "w", encoding="utf-8") as f:
            json.dump(questions, f, ensure_ascii=False, indent=2)
        print(f"File salvato: {dest} ({os.path.getsize(dest)} bytes)")

    # Scrittura TypeScript types
    ts_types = """// Tipi per il catalogo quiz VDS-VL
export interface QuizExplanation {
  rule: string;
  trap: string;
}

export interface Question {
  id: number;
  subjectId: number;
  subjectName: string;
  question: string;
  options: [string, string, string];
  correctAnswer: 1 | 2 | 3;
  explanation: QuizExplanation;
}

export interface SubjectMeta {
  id: number;
  name: string;
  questionCount: number;
  examQuota: number;
}
"""
    with open("src/types/quiz.ts", "w", encoding="utf-8") as f:
        f.write(ts_types)
    print("File salvato: src/types/quiz.ts")

if __name__ == "__main__":
    main()
