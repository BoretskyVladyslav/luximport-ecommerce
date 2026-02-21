'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import styles from '../auth.module.scss'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const login = useAuthStore((state) => state.login)
    const router = useRouter()

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        login({ id: '1', name: 'Користувач', email })
        router.push('/catalog')
    }

    return (
        <div className={styles.container}>
            <div className={styles.formWrapper}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Вхід</h1>
                    <p className={styles.subtitle}>LUXIMPORT ACCOUNT</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label htmlFor='email' className={styles.label}>Email</label>
                        <input
                            id='email'
                            type='email'
                            className={styles.input}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor='password' className={styles.label}>Пароль</label>
                        <input
                            id='password'
                            type='password'
                            className={styles.input}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type='submit' className={styles.submitBtn}>УВІЙТИ</button>
                </form>

                <Link href='/account/register' className={styles.switchLink}>
                    Немає акаунту? Створити.
                </Link>
            </div>
        </div>
    )
}
