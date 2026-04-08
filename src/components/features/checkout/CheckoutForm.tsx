'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { checkoutSchema, CheckoutFormData } from '@/lib/validations/checkout'
import { useStore } from '@/store/cart'

export default function CheckoutForm() {
    const router = useRouter()
    const items = useStore((state) => state.items)
    const clearCart = useStore((state) => state.clearCart)

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<CheckoutFormData>({
        resolver: zodResolver(checkoutSchema),
    })

    const onSubmit = async (data: CheckoutFormData) => {
        const orderPayload = { ...data, items }
        await new Promise<void>((r) => setTimeout(r, 1000))
        void orderPayload
        clearCart()
        router.push('/checkout/success')
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 w-full max-w-lg">
            <div className="flex flex-col gap-1">
                <label htmlFor="name" className="text-sm font-medium text-stone-700">
                    Ім&apos;я та прізвище
                </label>
                <input
                    id="name"
                    type="text"
                    {...register('name')}
                    className="border border-stone-300 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 transition"
                />
                {errors.name && (
                    <p className="text-xs text-red-500">{errors.name.message}</p>
                )}
            </div>

            <div className="flex flex-col gap-1">
                <label htmlFor="phone" className="text-sm font-medium text-stone-700">
                    Телефон
                </label>
                <input
                    id="phone"
                    type="tel"
                    placeholder="+380"
                    {...register('phone')}
                    className="border border-stone-300 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 transition"
                />
                {errors.phone && (
                    <p className="text-xs text-red-500">{errors.phone.message}</p>
                )}
            </div>

            <div className="flex flex-col gap-1">
                <label htmlFor="city" className="text-sm font-medium text-stone-700">
                    Місто
                </label>
                <input
                    id="city"
                    type="text"
                    {...register('city')}
                    className="border border-stone-300 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 transition"
                />
                {errors.city && (
                    <p className="text-xs text-red-500">{errors.city.message}</p>
                )}
            </div>

            <div className="flex flex-col gap-1">
                <label htmlFor="postOffice" className="text-sm font-medium text-stone-700">
                    Відділення Нової Пошти
                </label>
                <input
                    id="postOffice"
                    type="text"
                    {...register('postOffice')}
                    className="border border-stone-300 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 transition"
                />
                {errors.postOffice && (
                    <p className="text-xs text-red-500">{errors.postOffice.message}</p>
                )}
            </div>

            <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-stone-700">Спосіб оплати</span>
                <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="radio"
                            value="cash"
                            {...register('paymentMethod')}
                            className="accent-stone-700"
                        />
                        <span className="text-sm text-stone-600">Накладений платіж</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="radio"
                            value="iban"
                            {...register('paymentMethod')}
                            className="accent-stone-700"
                        />
                        <span className="text-sm text-stone-600">Оплата за реквізитами (IBAN)</span>
                    </label>
                </div>
                {errors.paymentMethod && (
                    <p className="text-xs text-red-500">{errors.paymentMethod.message}</p>
                )}
            </div>

            <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 bg-stone-800 text-white text-sm font-medium py-3 px-6 rounded-md hover:bg-stone-700 active:bg-stone-900 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
                {isSubmitting ? 'Оформлення...' : 'Підтвердити замовлення'}
            </button>
        </form>
    )
}
