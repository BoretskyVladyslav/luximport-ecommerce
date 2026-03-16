import { z } from 'zod'

export const checkoutSchema = z.object({
    name: z.string().min(2, { message: "Ім'я має містити щонайменше 2 символи" }),
    email: z.string().email({ message: 'Введіть коректний email адресу' }),
    phone: z
        .string()
        .regex(/^\+380\d{9}$/, { message: 'Введіть коректний номер телефону (+380XXXXXXXXX)' }),
    city: z.string().min(1, { message: 'Вкажіть місто' }),
    postOffice: z.string().min(1, { message: 'Вкажіть відділення' }),
    paymentMethod: z.enum(['cash', 'iban'], {
        errorMap: () => ({ message: 'Оберіть спосіб оплати' }),
    }),
})

export type CheckoutFormData = z.infer<typeof checkoutSchema>
