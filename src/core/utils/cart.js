// Cart storage is untrusted display state. Prices and entitlements must be resolved server-side.
export const MAX_QUANTITY = 99;
export const clampQuantity = (value) => Number.isFinite(Number(value)) ? Math.min(MAX_QUANTITY, Math.max(1, Math.trunc(Number(value)))) : 1;
const text = (value, max) => typeof value === 'string' ? value.slice(0, max) : '';
export function normalizeCart(value) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 100).flatMap((item) => {
    if (!item || typeof item !== 'object' || typeof item.id !== 'string' || !item.id || typeof item.productId !== 'string') return [];
    if (typeof item.title !== 'string' || !Number.isFinite(item.price) || item.price < 0 || item.price > 1000000) return [];
    return [{
      id: text(item.id, 500), productId: text(item.productId, 100), title: text(item.title, 200),
      price: item.price, quantity: clampQuantity(item.quantity), category: text(item.category, 100),
      image: typeof item.image === 'string' && /^\/assets\/[\w.-]+$/.test(item.image) ? item.image : '',
      sku: text(item.sku, 100),
      freebies: Array.isArray(item.freebies) ? [...new Set(item.freebies.filter((v) => typeof v === 'string').map((v) => v.slice(0, 200)))].slice(0, 2) : [],
    }];
  });
}
