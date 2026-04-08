import { z } from 'zod'
import { normalizeUaPhone, isValidUaPhoneE164 } from '@/lib/phone'

const REQUIRED = "Це поле є обов'язковим"

export const checkoutSchema = z.object({
    name: z
        .string({ required_error: REQUIRED })
        .trim()
        .min(1, { message: REQUIRED })
        .min(2, { message: "Ім'я повинно містити щонайменше 2 літери" }),
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
    city: z
        .string({ required_error: REQUIRED })
        .trim()
        .min(1, { message: 'Будь ласка, оберіть місто доставки' }),
    postOffice: z
        .string({ required_error: REQUIRED })
        .trim()
        .min(1, { message: 'Будь ласка, оберіть відділення або поштомат' }),
    paymentMethod: z
        .enum(['cash', 'iban'], {
            errorMap: () => ({ message: REQUIRED }),
        })
        .optional(),
})

export type CheckoutFormData = z.infer<typeof checkoutSchema>
