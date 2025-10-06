export function getLastRoute(): string | null {
  return localStorage.getItem('last:route');
}
