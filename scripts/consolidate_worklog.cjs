/**
 * Consolidate worklog fragments from .agents/worklog.d/ into WORKLOG.md.
 * Prevents merge conflicts between parallel agent sessions by allowing
 * each session to write its own isolated markdown file.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const FRAGMENTS_DIR = path.join(ROOT_DIR, '.agents', 'worklog.d');
const WORKLOG_PATH = path.join(ROOT_DIR, 'WORKLOG.md');

function cleanFragmentContent(raw) {
  return raw
    .trim()
    .replace(/^---+[\r\n]*/, '')
    .replace(/[\r\n]*---+$/, '')
    .trim();
}

function consolidateWorklog(dryRun = false) {
  if (!fs.existsSync(FRAGMENTS_DIR)) {
    console.log('[worklog] Fragments directory .agents/worklog.d/ does not exist. Nothing to consolidate.');
    return { count: 0 };
  }

  const files = fs.readdirSync(FRAGMENTS_DIR)
    .filter(file => file.endsWith('.md') && file.toLowerCase() !== 'readme.md')
    .sort()
    .reverse();

  if (files.length === 0) {
    console.log('[worklog] No fragment files found in .agents/worklog.d/ to consolidate.');
    return { count: 0 };
  }

  if (!fs.existsSync(WORKLOG_PATH)) {
    console.error(`[worklog] WORKLOG.md not found at ${WORKLOG_PATH}`);
    process.exit(1);
  }

  const worklogContent = fs.readFileSync(WORKLOG_PATH, 'utf-8');

  const fragments = [];
  const processedFiles = [];

  for (const file of files) {
    const filePath = path.join(FRAGMENTS_DIR, file);
    const content = cleanFragmentContent(fs.readFileSync(filePath, 'utf-8'));
    if (content) {
      fragments.push(content);
      processedFiles.push(file);
    }
  }

  if (fragments.length === 0) {
    console.log('[worklog] All found fragment files were empty.');
    return { count: 0 };
  }

  const templateMarker = '## Template per Nuove Voci';
  const templateIdx = worklogContent.indexOf(templateMarker);

  if (templateIdx === -1) {
    console.error('[worklog] Template section not found in WORKLOG.md');
    process.exit(1);
  }

  const codeBlockStart = worklogContent.indexOf('```', templateIdx);
  if (codeBlockStart === -1) {
    console.error('[worklog] Could not find template code block start');
    process.exit(1);
  }

  const codeBlockEnd = worklogContent.indexOf('```', codeBlockStart + 3);
  if (codeBlockEnd === -1) {
    console.error('[worklog] Could not find template code block end');
    process.exit(1);
  }

  const insertionIndex = codeBlockEnd + 3;

  const combinedEntries = '\n\n' + fragments.join('\n\n---\n\n') + '\n\n---';

  const newWorklogContent =
    worklogContent.slice(0, insertionIndex) +
    combinedEntries +
    worklogContent.slice(insertionIndex);

  if (!dryRun) {
    fs.writeFileSync(WORKLOG_PATH, newWorklogContent, 'utf-8');
    for (const file of processedFiles) {
      fs.unlinkSync(path.join(FRAGMENTS_DIR, file));
    }
    console.log(`[worklog] Successfully consolidated ${processedFiles.length} fragment(s) into WORKLOG.md.`);
  } else {
    console.log(`[worklog] [Dry-Run] Would consolidate ${processedFiles.length} fragment(s) into WORKLOG.md:`);
    for (const file of processedFiles) {
      console.log(`  - ${file}`);
    }
  }

  return { count: processedFiles.length };
}

if (require.main === module) {
  const isDryRun = process.argv.includes('--dry-run');
  consolidateWorklog(isDryRun);
}

module.exports = { consolidateWorklog, cleanFragmentContent };
