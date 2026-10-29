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

function inline(text: string): string {
  const codeSpans: string[] = [];
  let html = escapeHtml(text).replace(/`([^`]+)`/g, (_, code: string) => {
    codeSpans.push(`<code>${code}</code>`);
    return `\u0000${codeSpans.length - 1}\u0000`;
  });
  html = html
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>')
    .replace(/\[\[([^\]]+)\]\]/g, '<a class="note-link" data-note="$1">$1</a>')
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener">$1</a>',
    )
    .replace(
      /(^|[\s(])(https?:\/\/[^\s<)]+)/g,
      '$1<a href="$2" target="_blank" rel="noopener">$2</a>',
    );
  return html.replace(/\u0000(\d+)\u0000/g, (_, index: string) => codeSpans[Number(index)]);
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
          return `<p>${block.lines.map(inline).join('<br>')}</p>`;
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
