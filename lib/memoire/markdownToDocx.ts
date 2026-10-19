export type InlineRun = { text: string; bold: boolean }

export type ParaInstruction =
  | { type: 'skip' }
  | { type: 'empty' }
  | { type: 'heading'; level: 1 | 2 | 3; text: string }
  | { type: 'bullet'; runs: InlineRun[] }
  | { type: 'numbered'; runs: InlineRun[] }
  | { type: 'warning'; text: string }
  | { type: 'paragraph'; runs: InlineRun[] }

export function parseInlineRuns(text: string): InlineRun[] {
  return text.split(/(\*\*[^*]+\*\*)/).map(part =>
    part.startsWith('**') && part.endsWith('**')
      ? { text: part.slice(2, -2), bold: true }
      : { text: part, bold: false }
  ).filter(r => r.text !== '')
}

/**
 * Converts a markdown content string into an array of paragraph instructions
 * that can be used to build a docx document.
 * Matches the behaviour of downloadDocx in MemoireForm.tsx.
 */
export function buildParaInstructions(content: string): ParaInstruction[] {
  const instructions: ParaInstruction[] = []
  for (const line of content.split('\n')) {
    const t = line.trim()
    if (t === '---' || t === '***' || t === '___') {
      instructions.push({ type: 'skip' })
      continue
    }
    if (!t) {
      instructions.push({ type: 'empty' })
      continue
    }
    if (t.startsWith('### ')) {
      instructions.push({ type: 'heading', level: 3, text: t.slice(4) })
      continue
    }
    if (t.startsWith('## ')) {
      instructions.push({ type: 'heading', level: 2, text: t.slice(3) })
      continue
    }
    if (t.startsWith('# ')) {
      instructions.push({ type: 'heading', level: 1, text: t.slice(2) })
      continue
    }
    if (t.startsWith('⚠')) {
      instructions.push({ type: 'warning', text: t })
      continue
    }
    if (/^[*-] /.test(t)) {
      instructions.push({ type: 'bullet', runs: parseInlineRuns(t.slice(2)) })
      continue
    }
    if (/^\d+\. /.test(t)) {
      instructions.push({ type: 'numbered', runs: parseInlineRuns(t.replace(/^\d+\. /, '')) })
      continue
    }
    instructions.push({ type: 'paragraph', runs: parseInlineRuns(t) })
  }
  return instructions
}
