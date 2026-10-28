const defaultDestination = '/board';
const protectedPaths = new Set(['/board', '/my-tasks']);
const appOrigin = 'http://sprintboard.local';

export function safeAuthDestination(candidate: string | null): string {
  // Accept app-relative destinations only; never redirect to another origin or login.
  if (!candidate?.startsWith('/') || candidate.startsWith('//')) {
    return defaultDestination;
  }

  try {
    const url = new URL(candidate, appOrigin);

    if (url.origin !== appOrigin || !protectedPaths.has(url.pathname)) {
      return defaultDestination;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return defaultDestination;
  }
}

export function loginHref(destination: string): string {
  const url = new URL(safeAuthDestination(destination), appOrigin);
  url.searchParams.delete('next');
  const query = url.searchParams.toString();

  // The allowlisted path is safe to write literally; filter values stay encoded once.
  return `/login?next=${url.pathname}${query ? `&${query}` : ''}${url.hash}`;
}

export function loginDestination(params: URLSearchParams, hash: string): string {
  // Older links may still contain the full destination inside an encoded next value.
  const url = new URL(safeAuthDestination(params.get('next')), appOrigin);

  for (const key of new Set(params.keys())) {
    if (key !== 'next') {
      // Explicit outer parameters override the same keys in an older nested link.
      url.searchParams.delete(key);
      for (const value of params.getAll(key)) {
        url.searchParams.append(key, value);
      }
    }
  }

  url.hash = hash || url.hash;
  return safeAuthDestination(`${url.pathname}${url.search}${url.hash}`);
}
