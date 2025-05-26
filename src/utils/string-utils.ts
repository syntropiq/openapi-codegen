export function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export function toCamelCase(string: string): string {
  return string
    .replace(/[^a-zA-Z0-9]/g, '_')
    .split('_')
    .map((word, index) => {
      if (index === 0) return word.toLowerCase();
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join('');
}

export function toPascalCase(string: string): string {
  return string
    .replace(/[^a-zA-Z0-9]/g, '_')
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

export function toKebabCase(string: string): string {
  return string
    .replace(/[^a-zA-Z0-9]/g, '-')
    .toLowerCase();
}

export function toSnakeCase(string: string): string {
  return string
    .replace(/[^a-zA-Z0-9]/g, '_')
    .toLowerCase();
}

export function sanitizeIdentifier(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .replace(/^(\d)/, '_$1')
    .replace(/^$/, '_empty');
}

export function pluralize(word: string): string {
  if (word.endsWith('y')) {
    return word.slice(0, -1) + 'ies';
  }
  if (word.endsWith('s') || word.endsWith('sh') || word.endsWith('ch') || word.endsWith('x') || word.endsWith('z')) {
    return word + 'es';
  }
  return word + 's';
}