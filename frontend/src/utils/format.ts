export function formatNaira(kobo: number): string {
  const naira = kobo / 100;
  const hasFraction = kobo % 100 !== 0;

  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: hasFraction ? 2 : 0,
  }).format(naira);
}

/** Convert a naira input string (e.g. "25,000" or "25000.50") to integer kobo. */
export function nairaToKobo(value: string): number | null {
  const cleaned = value.replace(/[\s,₦]/g, '');
  if (!/^\d+(\.\d{0,2})?$/.test(cleaned)) return null;
  return Math.round(Number(cleaned) * 100);
}

export function koboToInput(kobo: number): string {
  return kobo % 100 === 0 ? String(kobo / 100) : (kobo / 100).toFixed(2);
}

export function stockLabel(product: { isAvailable: boolean; stockQuantity: number }): {
  label: string;
  tone: 'success' | 'warning' | 'danger';
} {
  if (!product.isAvailable) return { label: 'Hidden from catalogue', tone: 'warning' };
  if (product.stockQuantity <= 0) return { label: 'Out of stock', tone: 'danger' };
  if (product.stockQuantity <= 5) return { label: 'Low stock', tone: 'warning' };
  return { label: 'In stock', tone: 'success' };
}
