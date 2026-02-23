'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import styles from '../auth.module.scss'

export default function RegisterPage() {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const register = useAuthStore((state) => state.register)
    const router = useRouter()

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        register({ id: '1', name, email })
        router.push('/catalog')
    }

    return (
        <div className={styles.container}>
            <div className={styles.formWrapper}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Реєстрація</h1>
                    <p className={styles.subtitle}>LUXIMPORT ACCOUNT</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label htmlFor='name' className={styles.label}>Ім&#39;я</label>
                        <input
                            id='name'
                            type='text'
                            className={styles.input}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

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

                    <button type='submit' className={styles.submitBtn}>СТВОРИТИ АКАУНТ</button>
                </form>

                <Link href='/account/login' className={styles.switchLink}>
                    Вже є акаунт? Увійти.
                </Link>
            </div>
        </div>
    )
}
