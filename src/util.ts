export function abbr(s?: string): string {
  if (!s) {
    return `(${s})`;
  }

  return `${s.substr(0, 4)}...${s.substr(s.length - 4, 4)}`;
}
