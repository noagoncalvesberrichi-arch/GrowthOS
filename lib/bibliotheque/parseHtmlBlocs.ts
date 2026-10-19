export type RawParsed = { titre: string; contenu: string; source_fichier: string }

/**
 * Parses the HTML output of mammoth into structured blocs.
 * Node.js compatible (no DOMParser needed) — uses regex to extract block elements.
 * Matches the behaviour of parseWordDoc in BibliothequeClient.tsx.
 */
export function parseHtmlBlocs(html: string, fileName: string): RawParsed[] {
  // Wrap <img> in a <p> so it gets captured by blockRe and lands in the section content
  const cleanHtml = html.replace(/<img\b[^>]*\/?>/gi, '<p>[IMAGE]</p>')

  const blocs: RawParsed[] = []
  let currentTitre = ''
  let currentLines: string[] = []

  const flush = () => {
    const content = currentLines.filter(Boolean).join('\n').trim()
    if (currentTitre && content.length >= 40) {
      blocs.push({ titre: currentTitre, contenu: content, source_fichier: fileName })
    }
  }

  // Match block-level elements: h1/h2/h3 and p (including multi-line content, with inner tags)
  const blockRe = /<(h[1-3]|p)(?:\s[^>]*)?>([^]*?)<\/\1>/gi
  let match
  while ((match = blockRe.exec(cleanHtml)) !== null) {
    const tag = match[1].toLowerCase()
    // Strip inner HTML tags to get text content
    const text = match[2].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim()

    if (tag === 'h1' || tag === 'h2' || tag === 'h3') {
      flush()
      currentTitre = text
      currentLines = []
    } else if (tag === 'p' && currentTitre) {
      if (text) currentLines.push(text)
    }
  }
  flush()

  // Merge blocs < 20 words without images into the previous bloc
  const merged: RawParsed[] = []
  for (const b of blocs) {
    const words = b.contenu.trim().split(/\s+/).filter(Boolean).length
    const hasImage = b.contenu.includes('[IMAGE]')
    if (words < 20 && !hasImage && merged.length > 0) {
      merged[merged.length - 1] = {
        ...merged[merged.length - 1],
        contenu: merged[merged.length - 1].contenu + '\n' + b.contenu,
      }
    } else {
      merged.push(b)
    }
  }

  return merged
}
