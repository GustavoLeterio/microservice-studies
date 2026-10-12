const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };

/** Escapa texto para uso seguro dentro do HTML do conteúdo. */
export const esc = (text: string): string => text.replace(/[&<>"]/g, (char) => ESCAPES[char]);

/** Código inline: c('Optional<Cart>') => <code>Optional&lt;Cart&gt;</code> */
export const c = (text: string): string => `<code>${esc(text)}</code>`;

/** Link interno (navegado pelo Router através da diretiva appInternalLinks). */
export const link = (path: string, label: string): string => `<a href="${path}">${label}</a>`;

/** Link externo, abre em nova aba. */
export const ext = (url: string, label: string): string =>
  `<a href="${url}" target="_blank" rel="noopener">${label}</a>`;
