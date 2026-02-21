'use client'

import { useState, useEffect, useRef } from 'react'
import styles from './np-select.module.scss'

interface NpSelectProps {
    label: string
    placeholder: string
    value: string
    onChange: (value: string, ref: string) => void
    onSearch: (query: string) => Promise<Array<{ description: string; ref: string }>>
}

export function NpSelect({ label, placeholder, value, onChange, onSearch }: NpSelectProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState(value)
    const [results, setResults] = useState<Array<{ description: string; ref: string }>>([])
    const [isLoading, setIsLoading] = useState(false)
    const wrapperRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        setSearchTerm(value)
    }, [value])

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    useEffect(() => {
        const fetchResults = async () => {
            if (!searchTerm || searchTerm.length < 2) {
                setResults([])
                setIsOpen(false)
                return
            }

            if (searchTerm === value) {
                return
            }

            setIsLoading(true)
            const data = await onSearch(searchTerm)
            setResults(data)
            setIsOpen(true)
            setIsLoading(false)
        }

        const timer = setTimeout(() => {
            fetchResults()
        }, 300)

        return () => clearTimeout(timer)
    }, [searchTerm, onSearch, value])

    const handleSelect = (itemDesc: string, itemRef: string) => {
        setSearchTerm(itemDesc)
        onChange(itemDesc, itemRef)
        setIsOpen(false)
    }

    return (
        <div className={styles.wrapper} ref={wrapperRef}>
            <label className={styles.label}>{label}</label>
            <input
                type='text'
                className={styles.input}
                placeholder={placeholder}
                value={searchTerm}
                onChange={(e) => {
                    setSearchTerm(e.target.value)
                    if (e.target.value === '') {
                        onChange('', '')
                    }
                }}
                onFocus={() => {
                    if (results.length > 0) setIsOpen(true)
                }}
            />
            {isOpen && (
                <div className={styles.dropdown}>
                    {isLoading ? (
                        <div className={styles.loader}>Завантаження...</div>
                    ) : results.length > 0 ? (
                        results.map((item) => (
                            <div
                                key={item.ref}
                                className={styles.item}
                                onClick={() => handleSelect(item.description, item.ref)}
                            >
                                {item.description}
                            </div>
                        ))
                    ) : (
                        <div className={styles.loader}>Нічого не знайдено</div>
                    )}
                </div>
            )}
        </div>
    )
}
