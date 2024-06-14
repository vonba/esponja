export function formatDescription(description: string | undefined | null) {
  if (!description) return '';

  // Convert URLs into clickable links
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  let formattedDescription = description.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');

  // Convert newlines into <br> tags
  formattedDescription = formattedDescription.replace(/\n/g, '<br>');

  return formattedDescription;
}
