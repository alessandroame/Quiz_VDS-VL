// scripts/extract_ui_strings.cjs
// Extracts all user-facing UI strings (JSX text, attributes, toasts) from the codebase
// for automated semantic analysis and anti-pleonasm / microcopy audit with LLM models.

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const PROJECT_ROOT = path.join(__dirname, '..');
const SRC_DIR = path.join(PROJECT_ROOT, 'src');
const REPORTS_DIR = path.join(PROJECT_ROOT, 'reports');

if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

function getAllFiles(dir, exts = ['.tsx', '.ts']) {
  let results = [];
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of list) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      if (item.name === 'node_modules' || item.name === 'dist' || item.name === 'data') continue;
      results = results.concat(getAllFiles(fullPath, exts));
    } else if (item.isFile()) {
      const ext = path.extname(item.name);
      if (exts.includes(ext) && !item.name.includes('.test.') && !item.name.includes('.spec.')) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

const UI_ATTRIBUTES = new Set([
  'title',
  'placeholder',
  'aria-label',
  'alt',
  'label',
  'headerTitle',
  'description',
  'confirmLabel',
  'cancelLabel'
]);

function shouldIgnoreText(text) {
  if (!text) return true;
  const trimmed = text.trim();
  if (trimmed.length < 2) return true;
  // Ignore single words that are pure numbers, punctuation or technical keys
  if (/^[\d\s.,:/%#\-_()\[\]{}+*&|!?=><"']+$/.test(trimmed)) return true;
  // Ignore CSS classes or styles (e.g. contains 'bg-', 'text-', 'flex', 'px-')
  if (trimmed.includes('bg-') || trimmed.includes('text-') || trimmed.includes('border-') || trimmed.includes('px-')) return true;
  // Ignore pure code identifiers or hex colors
  if (/^#[0-9a-fA-F]{3,8}$/.test(trimmed)) return true;
  if (/^[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+$/.test(trimmed)) return true; // file names
  // Ignore SVG paths or data URIs
  if (trimmed.startsWith('M') && trimmed.includes(',') && /\d/.test(trimmed)) return true;
  if (trimmed.startsWith('data:') || trimmed.startsWith('http://') || trimmed.startsWith('https://')) return true;

  return false;
}

function extractStringsFromFile(filePath) {
  const code = fs.readFileSync(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(
    filePath,
    code,
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );

  const findings = [];
  const relPath = path.relative(PROJECT_ROOT, filePath).replace(/\\/g, '/');

  function getLineNumber(pos) {
    return sourceFile.getLineAndCharacterOfPosition(pos).line + 1;
  }

  function addFinding(text, node, contextType) {
    const cleanText = text.replace(/\s+/g, ' ').trim();
    if (shouldIgnoreText(cleanText)) return;

    findings.push({
      file: relPath,
      line: getLineNumber(node.getStart(sourceFile)),
      text: cleanText,
      context: contextType
    });
  }

  function visit(node) {
    // 1. JSX Text Nodes: <h1>Testo</h1>, <span>Ciao</span>
    if (ts.isJsxText(node)) {
      const rawText = node.getText(sourceFile);
      if (rawText && !shouldIgnoreText(rawText)) {
        addFinding(rawText, node, 'jsx-text');
      }
    }

    // 2. JSX Attributes: title="...", placeholder="...", aria-label="..."
    else if (ts.isJsxAttribute(node)) {
      const attrName = node.name.getText(sourceFile);
      if (UI_ATTRIBUTES.has(attrName) && node.initializer) {
        if (ts.isStringLiteral(node.initializer)) {
          addFinding(node.initializer.text, node.initializer, `attr:${attrName}`);
        } else if (
          ts.isJsxExpression(node.initializer) &&
          node.initializer.expression &&
          ts.isStringLiteral(node.initializer.expression)
        ) {
          addFinding(node.initializer.expression.text, node.initializer.expression, `attr:${attrName}`);
        }
      }
    }

    // 3. UI Toast / Alerts: showToast("..."), alert("...")
    else if (ts.isCallExpression(node)) {
      const callName = node.expression.getText(sourceFile);
      if (['showToast', 'alert', 'confirm', 'setToast', 'setVoiceToast'].includes(callName)) {
        const firstArg = node.arguments[0];
        if (firstArg && ts.isStringLiteral(firstArg)) {
          addFinding(firstArg.text, firstArg, `call:${callName}`);
        }
      }
    }

    // 4. Object properties for navigation or scenarios: label: "...", description: "..."
    else if (ts.isPropertyAssignment(node)) {
      const propName = node.name.getText(sourceFile);
      if (['label', 'headerTitle', 'description', 'title'].includes(propName)) {
        if (ts.isStringLiteral(node.initializer)) {
          addFinding(node.initializer.text, node.initializer, `prop:${propName}`);
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return findings;
}

function main() {
  console.log('🔍 Estrazione automatizzata di tutte le stringhe UI per Analisi Semantica AI...');
  const files = getAllFiles(SRC_DIR);
  console.log(`📂 Scansione di ${files.length} file sorgente TS/TSX...`);

  let allFindings = [];
  for (const f of files) {
    const items = extractStringsFromFile(f);
    allFindings = allFindings.concat(items);
  }

  // Deduplicate identical string instances in the same file & line
  const uniqueMap = new Map();
  for (const item of allFindings) {
    const key = `${item.file}:${item.line}:${item.text}`;
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, item);
    }
  }
  const cleanList = Array.from(uniqueMap.values());

  console.log(`✨ Estratte ${cleanList.length} stringhe UI uniche totali.\n`);

  // Write JSON Catalog
  const jsonPath = path.join(REPORTS_DIR, 'ui_strings_catalog.json');
  fs.writeFileSync(jsonPath, JSON.stringify(cleanList, null, 2), 'utf8');
  console.log(`💾 Catalogo JSON salvato in: ${jsonPath}`);

  // Write Markdown Catalog for Agent inspection
  const mdPath = path.join(REPORTS_DIR, 'ui_strings_catalog.md');
  let mdContent = `# 📋 Catalogo delle Stringhe UI dell'Applicazione (${cleanList.length} stringhe)\n\n`;
  mdContent += `Generato automaticamente per l'analisi semantica anti-pleonasmo e coerenza microcopy.\n\n`;
  mdContent += `| File e Riga | Contesto | Testo Estratto |\n`;
  mdContent += `| :--- | :--- | :--- |\n`;

  for (const item of cleanList) {
    const escaped = item.text.replace(/\|/g, '\\|');
    mdContent += `| \`${item.file}:${item.line}\` | \`${item.context}\` | ${escaped} |\n`;
  }

  fs.writeFileSync(mdPath, mdContent, 'utf8');
  console.log(`📄 Catalogo Markdown salvato in: ${mdPath}`);
}

main();
