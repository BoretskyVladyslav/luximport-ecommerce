import { z } from 'zod'
import { normalizeUaPhone, isValidUaPhoneE164 } from '@/lib/phone'

const REQUIRED = "Це поле є обов'язковим"

export const profileUpdateSchema = z.object({
    firstName: z
        .string({ required_error: REQUIRED })
        .trim()
        .min(1, { message: REQUIRED })
        .min(2, { message: "Ім'я повинно містити щонайменше 2 літери" })
        .max(120),
    lastName: z.string().trim().max(120).optional().or(z.literal('')),
    phone: z.preprocess(
        (v) => {
            const raw = typeof v === 'string' ? v : ''
            const cleaned = normalizeUaPhone(raw)
            return cleaned === '+' ? '' : cleaned
        },
        z
            .string()
            .optional()
            .or(z.literal(''))
            .refine((v) => !v || isValidUaPhoneE164(v), { message: 'Введіть коректний номер телефону' })
    ),
    address: z.string().trim().max(240).optional().or(z.literal('')),
})

export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>

