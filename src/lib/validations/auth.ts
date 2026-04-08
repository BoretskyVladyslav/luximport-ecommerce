import { z } from 'zod'
import { normalizeUaPhone, isValidUaPhoneE164 } from '@/lib/phone'

const REQUIRED = "Це поле є обов'язковим"

export const loginSchema = z.object({
    email: z
        .string({ required_error: REQUIRED })
        .trim()
        .min(1, { message: REQUIRED })
        .email({ message: 'Будь ласка, введіть коректний email' }),
    password: z.string({ required_error: REQUIRED }).min(1, { message: REQUIRED }).max(200),
})

export type LoginFormData = z.infer<typeof loginSchema>

export const registerSchema = z.object({
    name: z
        .string({ required_error: REQUIRED })
        .trim()
        .min(1, { message: REQUIRED })
        .min(2, { message: "Ім'я повинно містити щонайменше 2 літери" })
        .max(120),
    email: z
        .string({ required_error: REQUIRED })
        .trim()
        .min(1, { message: REQUIRED })
        .email({ message: 'Будь ласка, введіть коректний email' }),
    phone: z.preprocess(
        (v) => normalizeUaPhone(typeof v === 'string' ? v : ''),
        z
            .string({ required_error: REQUIRED })
            .min(1, { message: REQUIRED })
            .refine((v) => isValidUaPhoneE164(v), { message: 'Введіть коректний номер телефону' })
    ),
    password: z.string({ required_error: REQUIRED }).min(8, { message: REQUIRED }).max(200),
})

export type RegisterFormData = z.infer<typeof registerSchema>

