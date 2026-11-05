import { z } from 'zod';

export const updateSettingsSchema = z.object({
  business_name: z.string().trim().max(120).optional(),
  whatsapp_number: z
    .string()
    .trim()
    .max(30)
    .regex(/^[0-9+\s()-]*$/, 'Use digits, spaces, +, - or parentheses only.')
    .optional(),
  phone_number: z
    .string()
    .trim()
    .max(30)
    .regex(/^[0-9+\s()-]*$/, 'Use digits, spaces, +, - or parentheses only.')
    .optional(),
  contact_email: z.string().trim().max(200).email('Enter a valid email address.').or(z.literal('')).optional(),
  address: z.string().trim().max(300).optional(),
  instagram_url: z.string().trim().max(300).url('Enter a valid URL.').or(z.literal('')).optional(),
  facebook_url: z.string().trim().max(300).url('Enter a valid URL.').or(z.literal('')).optional(),
});

export type SettingsInput = z.infer<typeof updateSettingsSchema>;
