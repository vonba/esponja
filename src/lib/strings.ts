export function formatDescription(description: string | undefined | null) {
  if (!description) return '';

  // Convert URLs into clickable links without the initial http:// or https:// in the link text
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  let formattedDescription = description.replace(urlRegex, (url) => {
    // Remove the protocol (http:// or https://) from the link text
    const linkText = url.replace(/https?:\/\//, '');
    return `<a href="${url}" target="_blank" rel="noopener noreferrer">${linkText}</a>`;
  });

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
  if (slug.length > 120) {
      slug = slug.substring(0, 120).replace(/-+$/g, ''); // Avoid trailing hyphens after truncation
  }

  return slug;
}

export function truncateAndAppend(input: string): string {
  const maxLength = 118;
  const suffix = "-2";

  // If the input length is greater than the maxLength, truncate it and add the suffix
  if (input.length > maxLength) {
    return input.substring(0, maxLength) + suffix;
  }

  // Otherwise, just append the suffix
  return input + suffix;
}

export function capitalizeFirstChar(str: string) {
  if (!str) return str; // Handle empty or null strings
  return str.charAt(0).toUpperCase() + str.slice(1);
}