'use client'

import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'
import { registerSchema, type RegisterFormData } from '@/lib/validations/auth'
import styles from '../auth.module.scss'
import { PhoneInput } from '@/components/ui/phone-input'

export default function RegisterPage() {
    const register = useAuthStore((state) => state.register)

    const {
        register: rhfRegister,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
        defaultValues: { name: '', email: '', phone: '+380', password: '' },
        shouldFocusError: true,
    })

    const onSubmit = async (values: RegisterFormData) => {
        const normalizedEmail = values.email.trim().toLowerCase()
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
                name: values.name.trim(),
                email: normalizedEmail,
                phone: values.phone,
                password: values.password,
            }),
        })
        const data = await res.json().catch(() => null)
        if (!res.ok) {
            const msg =
                typeof data?.message === 'string'
                    ? data.message
                    : typeof data?.error === 'string'
                        ? data.error
                        : 'Виникла помилка. Перевірте дані та спробуйте ще раз.'
            toast.error(msg)
            return
        }
        const u = data?.user
        if (!u || typeof u !== 'object') {
            toast.error('Виникла помилка. Перевірте дані та спробуйте ще раз.')
            return
        }
        register({
            id: String(u.id ?? ''),
            email: String(u.email ?? normalizedEmail),
            name: typeof u.name === 'string' ? u.name : values.name.trim(),
            firstName: typeof u.firstName === 'string' ? u.firstName : '',
            lastName: typeof u.lastName === 'string' ? u.lastName : '',
            phone: typeof u.phone === 'string' ? u.phone : '',
            address: typeof u.address === 'string' ? u.address : '',
        })
        const signInResult = await signIn('credentials', {
            redirect: false,
            email: normalizedEmail,
            password: values.password,
        })
        if (!signInResult?.ok) {
            toast.error('Акаунт створено, але вхід не вдався. Увійдіть вручну.')
            window.location.assign('/account/login')
            return
        }
        toast.success('Акаунт створено')
        window.location.assign('/account/profile')
    }

    return (
        <div className={styles.container}>
            <div className={styles.formWrapper}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Реєстрація</h1>
                    <p className={styles.subtitle}>LUXIMPORT ACCOUNT</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                    <div className={styles.formGroup}>
                        <label htmlFor='name' className={styles.label}>Ім&#39;я</label>
                        <input
                            id='name'
                            type='text'
                            className={styles.input}
                            {...rhfRegister('name')}
                        />
                        {errors.name?.message && (
                            <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                        )}
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor='email' className={styles.label}>Email</label>
                        <input
                            id='email'
                            type='email'
                            className={styles.input}
                            {...rhfRegister('email')}
                        />
                        {errors.email?.message && (
                            <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                        )}
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor='phone' className={styles.label}>Телефон</label>
                        <PhoneInput id="phone" className={styles.input} {...rhfRegister('phone')} />
                        {errors.phone?.message && (
                            <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
                        )}
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor='password' className={styles.label}>Пароль</label>
                        <input
                            id='password'
                            type='password'
                            className={styles.input}
                            {...rhfRegister('password')}
                        />
                        {errors.password?.message && (
                            <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
                        )}
                    </div>

                    <button type='submit' className={styles.submitBtn} disabled={isSubmitting}>
                        {isSubmitting ? 'ОБРОБКА...' : 'СТВОРИТИ АКАУНТ'}
                    </button>
                </form>

                <Link href='/account/login' className={styles.switchLink}>
                    Вже є акаунт? Увійти.
                </Link>
            </div>
        </div>
    )
}
