export interface TextEdit {
  text: string;
  cursor: number;
}

export interface Selection {
  start: number;
  end: number;
}

export function withHeading(text: string, selection: Selection): TextEdit {
  const lineStart = text.lastIndexOf('\n', selection.start - 1) + 1;
  return {
    text: `${text.slice(0, lineStart)}## ${text.slice(lineStart)}`,
    cursor: selection.start + 3,
  };
}

export function withCode(text: string, selection: Selection): TextEdit {
  const selected = text.slice(selection.start, selection.end);
  const wrapped = selected.includes('\n') ? `\n\`\`\`\n${selected}\n\`\`\`\n` : `\`${selected}\``;
  return {
    text: text.slice(0, selection.start) + wrapped + text.slice(selection.end),
    cursor: selection.start + (selected ? wrapped.length : 1),
  };
}
