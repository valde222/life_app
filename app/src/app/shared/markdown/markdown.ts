const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (char) => ESCAPES[char]);
}

const LINK_URL = String.raw`https?:\/\/[^\s<>"')]+`;
const INLINE = new RegExp(
  [
    '`([^`]+)`',
    String.raw`\[\[([^\]]+)\]\]`,
    String.raw`\[([^\]]+)\]\((${LINK_URL})\)`,
    String.raw`\*\*([^*]+)\*\*`,
    String.raw`\*([^*\s][^*]*)\*`,
    `(${LINK_URL})`,
  ].join('|'),
  'g',
);

function link(href: string, content: string): string {
  return `<a href="${escapeHtml(href)}" target="_blank" rel="noopener">${content}</a>`;
}

function inline(text: string, links = true): string {
  let html = '';
  let last = 0;
  for (const match of text.matchAll(INLINE)) {
    const [whole, code, note, label, href, strong, em, bare] = match;
    const before = text[match.index - 1];
    html += escapeHtml(text.slice(last, match.index));
    last = match.index + whole.length;
    if (code !== undefined) {
      html += `<code>${escapeHtml(code)}</code>`;
    } else if (note !== undefined && links) {
      html += `<a class="note-link" data-note="${escapeHtml(note)}">${escapeHtml(note)}</a>`;
    } else if (label !== undefined && links) {
      html += link(href, inline(label, false));
    } else if (strong !== undefined) {
      html += `<strong>${inline(strong, links)}</strong>`;
    } else if (em !== undefined) {
      html += `<em>${inline(em, links)}</em>`;
    } else if (bare !== undefined && links && (before === undefined || /[\s(]/.test(before))) {
      html += link(bare, escapeHtml(bare));
    } else {
      html += escapeHtml(whole);
    }
  }
  return html + escapeHtml(text.slice(last));
}

type Block =
  | { kind: 'p' | 'ul' | 'ol' | 'code'; lines: string[] }
  | { kind: 'h'; level: number; text: string };

function blocks(markdown: string): Block[] {
  const result: Block[] = [];
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
  const open: { block: Block | null } = { block: null };
  const flush = () => {
    if (open.block) {
      result.push(open.block);
      open.block = null;
    }
  };
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    if (line.startsWith('```')) {
      flush();
      const code: string[] = [];
      for (index++; index < lines.length && !lines[index].startsWith('```'); index++) {
        code.push(lines[index]);
      }
      result.push({ kind: 'code', lines: code });
      continue;
    }
    const heading = /^(#{1,3})\s+(.*)$/.exec(line);
    const bullet = /^\s*[-*]\s+(.*)$/.exec(line);
    const numbered = /^\s*\d+[.)]\s+(.*)$/.exec(line);
    if (heading) {
      flush();
      result.push({ kind: 'h', level: heading[1].length, text: heading[2] });
    } else if (bullet || numbered) {
      const kind = bullet ? 'ul' : 'ol';
      if (open.block?.kind !== kind) {
        flush();
        open.block = { kind, lines: [] };
      }
      (open.block as { lines: string[] }).lines.push((bullet ?? numbered)![1]);
    } else if (!line.trim()) {
      flush();
    } else {
      if (open.block?.kind !== 'p') {
        flush();
        open.block = { kind: 'p', lines: [] };
      }
      (open.block as { lines: string[] }).lines.push(line.trim());
    }
  }
  flush();
  return result;
}

export function renderMarkdown(markdown: string): string {
  return blocks(markdown)
    .map((block) => {
      switch (block.kind) {
        case 'h':
          return `<h${block.level + 2}>${inline(block.text)}</h${block.level + 2}>`;
        case 'code':
          return `<pre><code>${escapeHtml(block.lines.join('\n'))}</code></pre>`;
        case 'ul':
        case 'ol':
          return `<${block.kind}>${block.lines.map((line) => `<li>${inline(line)}</li>`).join('')}</${block.kind}>`;
        case 'p':
          return `<p>${block.lines.map((line) => inline(line)).join('<br>')}</p>`;
      }
    })
    .join('');
}

export function firstLine(markdown: string): string {
  const line = markdown.split('\n').find((each) => each.trim() && !each.startsWith('```')) ?? '';
  return line
    .replace(/^#+\s*/, '')
    .replace(/^\s*[-*]\s+/, '')
    .replace(/[`*]|\[\[|\]\]/g, '');
}
