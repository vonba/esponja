// XSS guard: the only schemes allowed in a link built from user input. Any other scheme
// (javascript:, data:, vbscript: ...) can run script when the link is clicked.
const SAFE_URL_PROTOCOLS = ['http:', 'https:'];

// XSS guard: returns the URL (normalized by the browser's URL parser, so quotes and angle
// brackets come out percent-encoded) only if it is an absolute http(s) URL, otherwise null.
// Use it for every href that comes from user input.
export function safeHttpUrl(value: string | undefined | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value.trim());
    return SAFE_URL_PROTOCOLS.includes(url.protocol) ? url.href : null;
  } catch {
    return null; // Not a URL at all
  }
}

// XSS guard: escapes text for HTML that is built as a string (the emails), whether it goes
// into an element or into a quoted attribute. Svelte templates escape on their own.
export function escapeHtml(value: unknown): string {
  const entities: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(value ?? '').replace(/[&<>"']/g, char => entities[char]);
}

export type DescriptionPart =
  | { kind: 'text'; text: string }
  | { kind: 'link'; text: string; href: string }
  | { kind: 'lineBreak' };

// Splits an event description into text, links and line breaks, so the page can show it with
// ordinary Svelte markup. URLs become clickable links without the http:// or https:// in the
// link text.
// XSS guard: this used to build an HTML string for {@html}, where a URL containing a quote
// could break out of the href attribute and add event handlers. Returning plain data instead
// means Svelte escapes every piece, and each href also goes through safeHttpUrl().
export function descriptionParts(description: string | undefined | null): DescriptionPart[] {
  if (!description) return [];

  const parts: DescriptionPart[] = [];
  description.split(/\r?\n/).forEach((line, lineIndex) => {
    if (lineIndex > 0) parts.push({ kind: 'lineBreak' });

    let textStart = 0;
    for (const match of line.matchAll(/https?:\/\/[^\s]+/g)) {
      const url = match[0];
      const urlStart = match.index ?? 0;
      if (urlStart > textStart) parts.push({ kind: 'text', text: line.slice(textStart, urlStart) });

      const href = safeHttpUrl(url);
      parts.push(href
        ? { kind: 'link', text: url.replace(/^https?:\/\//, ''), href }
        : { kind: 'text', text: url }); // Something the URL parser rejects stays plain text
      textStart = urlStart + url.length;
    }
    if (textStart < line.length) parts.push({ kind: 'text', text: line.slice(textStart) });
  });

  return parts;
}


export function toSlug(input: string, maxLength: number = 120) {
  if (!input) return '';

  // Normalize the input to decompose combined letters into their base characters
  let slug = input.normalize('NFD');

  // Remove accents and diacritics
  slug = slug.replace(/[\u0300-\u036f]/g, '');

  // Convert to lowercase
  slug = slug.toLowerCase();

  // Replace spaces and other unwanted characters with hyphens
  slug = slug.replace(/[^a-z0-9]+/g, '-');

  // Trim hyphens from start and end
  slug = slug.replace(/^-+|-+$/g, '');

  // Ensure the slug does not exceed the maximum length
  if (slug.length > maxLength) {
      slug = slug.substring(0, maxLength).replace(/-+$/g, ''); // Avoid trailing hyphens after truncation
  }

  return slug;
}

export function capitalizeFirstChar(str: string) {
  if (!str) return str; // Handle empty or null strings
  return str.charAt(0).toUpperCase() + str.slice(1);
}