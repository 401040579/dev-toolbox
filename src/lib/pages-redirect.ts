// Decode the query form produced by public/404.html before Router reads location.
export function restorePagesRedirect() {
  const { pathname, search, hash, origin } = window.location;
  if (!search.startsWith('?/')) return;
  const decoded = search.slice(1).split('&').map((part) => part.replace(/~and~/g, '&')).join('?');
  // Never let a crafted query become a protocol-relative/external navigation.
  if (!/^\/(?!\/)/.test(decoded)) return;
  const target = new URL(pathname.replace(/\/$/, '') + decoded + hash, origin);
  if (target.origin !== origin) return;
  window.history.replaceState(null, '', target.pathname + target.search + target.hash);
}
