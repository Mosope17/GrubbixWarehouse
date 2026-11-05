import type { Product } from '../types';
import { formatNaira } from './format';

export function normalisePhoneNumber(raw: string): string {
  return raw.replace(/[^\d]/g, '');
}

export function buildWhatsAppUrl(number: string, message: string): string | null {
  const digits = normalisePhoneNumber(number);
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function productEnquiryMessage(product: Product, productUrl: string): string {
  const lines = [
    `Hello Grubbix Warehouse, I would like to enquire about "${product.name}" (${formatNaira(product.priceKobo)}).`,
  ];
  if (productUrl) lines.push(productUrl);
  return lines.join('\n');
}

export function generalEnquiryMessage(businessName: string): string {
  return `Hello ${businessName}, I would like to make an enquiry.`;
}
