'use client'

import React from 'react'
import { PatternFormat } from 'react-number-format'

type Props = {
    id?: string
    name?: string
    value?: string
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
    onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void
    placeholder?: string
    className?: string
    disabled?: boolean
    required?: boolean
}

export const PhoneInput = React.forwardRef<HTMLInputElement, Props>(function PhoneInput(props, ref) {
    return (
        <PatternFormat
            id={props.id}
            name={props.name}
            value={props.value}
            onChange={props.onChange}
            onBlur={props.onBlur}
            disabled={props.disabled}
            className={props.className}
            format="+380 (##) ###-##-##"
            allowEmptyFormatting
            mask="_"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            placeholder={props.placeholder ?? '+380 (__) ___-__-__'}
            getInputRef={ref}
        />
    )
})

