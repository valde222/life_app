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

interface Token {
  code?: string;
  note?: string;
  label?: string;
  href?: string;
  strong?: string;
  em?: string;
  bare?: string;
}

function formatted(token: Token, links: boolean): string | null {
  if (token.code !== undefined) {
    return `<code>${escapeHtml(token.code)}</code>`;
  }
  if (token.strong !== undefined) {
    return `<strong>${inline(token.strong, links)}</strong>`;
  }
  return token.em === undefined ? null : `<em>${inline(token.em, links)}</em>`;
}

function linked(token: Token, before: string | undefined): string | null {
  if (token.note !== undefined) {
    return `<a class="note-link" data-note="${escapeHtml(token.note)}">${escapeHtml(token.note)}</a>`;
  }
  if (token.label !== undefined && token.href !== undefined) {
    return link(token.href, inline(token.label, false));
  }
  const startsWord = before === undefined || /[\s(]/.test(before);
  return token.bare !== undefined && startsWord ? link(token.bare, escapeHtml(token.bare)) : null;
}

function inline(text: string, links = true): string {
  let html = '';
  let last = 0;
  for (const match of text.matchAll(INLINE)) {
    const [whole, code, note, label, href, strong, em, bare] = match;
    const token: Token = { code, note, label, href, strong, em, bare };
    html += escapeHtml(text.slice(last, match.index));
    last = match.index + whole.length;
    html +=
      formatted(token, links) ??
      (links ? linked(token, text[match.index - 1]) : null) ??
      escapeHtml(whole);
  }
  return html + escapeHtml(text.slice(last));
}

type Block =
  | { kind: 'p' | 'ul' | 'ol' | 'code'; lines: string[] }
  | { kind: 'h'; level: number; text: string };

interface OpenBlock {
  kind: 'p' | 'ul' | 'ol';
  lines: string[];
}

type Line =
  | { kind: 'h'; level: number; text: string }
  | { kind: 'ul' | 'ol' | 'p'; text: string }
  | { kind: 'blank' };

function heading(line: string): Line | null {
  const match = /^(#{1,3})\s+(.*)$/.exec(line);
  return match ? { kind: 'h', level: match[1]?.length ?? 1, text: match[2] ?? '' } : null;
}

function listItem(line: string): Line | null {
  const bullet = /^\s*[-*]\s+(.*)$/.exec(line)?.[1];
  if (bullet !== undefined) {
    return { kind: 'ul', text: bullet };
  }
  const numbered = /^\s*\d+[.)]\s+(.*)$/.exec(line)?.[1];
  return numbered === undefined ? null : { kind: 'ol', text: numbered };
}

function classify(line: string): Line {
  const text = line.trim();
  return heading(line) ?? listItem(line) ?? (text ? { kind: 'p', text } : { kind: 'blank' });
}

const FENCE = '```';

class BlockReader {
  private readonly result: Block[] = [];
  private open: OpenBlock | null = null;

  constructor(private readonly lines: string[]) {}

  read(): Block[] {
    for (let index = 0; index < this.lines.length; index++) {
      const line = this.lines[index] ?? '';
      if (line.startsWith(FENCE)) {
        index = this.codeBlock(index);
      } else {
        this.textLine(line);
      }
    }
    this.flush();
    return this.result;
  }

  private codeBlock(fence: number): number {
    this.flush();
    const code: string[] = [];
    let index = fence + 1;
    for (; index < this.lines.length && !this.lines[index]?.startsWith(FENCE); index++) {
      code.push(this.lines[index] ?? '');
    }
    this.result.push({ kind: 'code', lines: code });
    return index;
  }

  private textLine(line: string) {
    const classified = classify(line);
    switch (classified.kind) {
      case 'h':
        this.flush();
        this.result.push(classified);
        return;
      case 'blank':
        this.flush();
        return;
      default:
        this.append(classified.kind, classified.text);
    }
  }

  private append(kind: OpenBlock['kind'], line: string) {
    if (this.open?.kind !== kind) {
      this.flush();
      this.open = { kind, lines: [] };
    }
    this.open.lines.push(line);
  }

  private flush() {
    if (this.open) {
      this.result.push(this.open);
      this.open = null;
    }
  }
}

function blocks(markdown: string): Block[] {
  return new BlockReader(markdown.replace(/\r\n?/g, '\n').split('\n')).read();
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
