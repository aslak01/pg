export function parseMagnet(item: { info_hash: string; name: string }): string {
  return `magnet:?xt=urn:btih:${item.info_hash}&dn=${item.name}`;
}
export function formatDate(str: string) {
  const dt = Number(str) * 1000;
  if (typeof dt !== "number") return "";
  const date = new Date(dt);
  return new Intl.DateTimeFormat("fr-FR").format(date);
}
export function parseBytes(str: string) {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let bytes = Number(str);
  let i = 0;

  while (bytes >= 1024 && i < units.length - 1) {
    bytes /= 1024;
    i++;
  }

  return `${bytes.toFixed(2)} ${units[i]}`;
}
