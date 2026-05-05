export function normalizeTikTokUrl(url: string | null | undefined) {
  const value = url?.trim();

  if (!value) return "";
  if (value.startsWith("https://") || value.startsWith("http://")) return value;
  if (value.startsWith("//")) return `https:${value}`;
  if (value.startsWith("/")) return `https://www.tiktok.com${value}`;
  if (value.startsWith("www.")) return `https://${value}`;
  if (value.startsWith("tiktok.com")) return `https://${value}`;

  return value;
}

function toTikTokSlug(title: string | null | undefined) {
  const slug = title
    ?.toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "product";
}

export function getTikTokProductUrl(product: {
  productUrl?: string | null;
  productId: string;
  title?: string | null;
}) {
  const normalizedUrl = normalizeTikTokUrl(product.productUrl);

  if (normalizedUrl) return normalizedUrl;

  return `https://www.tiktok.com/shop/pdp/${toTikTokSlug(product.title)}/${product.productId}`;
}
