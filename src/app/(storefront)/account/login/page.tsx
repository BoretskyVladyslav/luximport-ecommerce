'use client'

import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'
import { loginSchema, type LoginFormData } from '@/lib/validations/auth'
import styles from '../auth.module.scss'

export default function LoginPage() {
    const login = useAuthStore((state) => state.login)

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: '', password: '' },
        shouldFocusError: true,
    })

    const onSubmit = async (values: LoginFormData) => {
        const normalizedEmail = values.email.trim().toLowerCase()
        const result = await signIn('credentials', {
            redirect: false,
            email: normalizedEmail,
            password: values.password,
        })
        if (!result?.ok) {
            const msg =
                result?.error === 'CredentialsSignin'
                    ? 'Невірний email або пароль'
                    : 'Виникла помилка. Перевірте дані та спробуйте ще раз.'
            toast.error(msg)
            return
        }
        const meRes = await fetch('/api/user/me')
        const meData = await meRes.json().catch(() => null)
        const u = meData?.user
        if (!u || typeof u !== 'object') {
            toast.error('Виникла помилка. Перевірте дані та спробуйте ще раз.')
            return
        }
        login({
            id: String(u.id ?? ''),
            email: String(u.email ?? normalizedEmail),
            name: typeof u.name === 'string' ? u.name : '',
            firstName: typeof u.firstName === 'string' ? u.firstName : '',
            lastName: typeof u.lastName === 'string' ? u.lastName : '',
            phone: typeof u.phone === 'string' ? u.phone : '',
            address: typeof u.address === 'string' ? u.address : '',
        })
        toast.success('Успішний вхід')
        window.location.assign('/account/profile')
    }

    return (
        <div className={styles.container}>
            <div className={styles.formWrapper}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Вхід</h1>
                    <p className={styles.subtitle}>LUXIMPORT ACCOUNT</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                    <div className={styles.formGroup}>
                        <label htmlFor='email' className={styles.label}>Email</label>
                        <input
                            id='email'
                            type='email'
                            className={styles.input}
                            {...register('email')}
                        />
                        {errors.email?.message && (
                            <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                        )}
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor='password' className={styles.label}>Пароль</label>
                        <input
                            id='password'
                            type='password'
                            className={styles.input}
                            {...register('password')}
                        />
                        {errors.password?.message && (
                            <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
                        )}
                    </div>

                    <button type='submit' className={styles.submitBtn} disabled={isSubmitting}>
                        {isSubmitting ? 'ОБРОБКА...' : 'УВІЙТИ'}
                    </button>
                </form>

                <Link href='/account/register' className={styles.switchLink}>
                    Немає акаунту? Створити.
                </Link>
            </div>
        </div>
    )
}
