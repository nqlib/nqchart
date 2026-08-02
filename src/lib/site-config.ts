export const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "https://www.nqlib.com").replace(
  /\/$/,
  "",
);

export function absoluteUrl(path: string) {
  if (!path) return SITE_URL;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
