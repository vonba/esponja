export function formatDescription(description: string | undefined | null) {
  if (!description) return '';

  // Convert URLs into clickable links
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  let formattedDescription = description.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');

  // Convert newlines into <br> tags
  formattedDescription = formattedDescription.replace(/\n/g, '<br>');

  return formattedDescription;
}

export function toSlug(input: string) {
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

  // Ensure the slug does not exceed 80 characters
  if (slug.length > 80) {
      slug = slug.substring(0, 80).replace(/-+$/g, ''); // Avoid trailing hyphens after truncation
  }

  return slug;
}