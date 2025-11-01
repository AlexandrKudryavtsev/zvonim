import React from 'react';
import cls from './TextInput.module.scss';
import { cn } from '../../../utils/classNames';

interface TextInputProps {
    label?: string;
    id?: string;
    type?: 'text' | 'email' | 'password' | 'number';
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    fullWidth?: boolean;
    className?: string;
    error?: string;
}

export const TextInput: React.FC<TextInputProps> = ({
    label,
    id,
    type = 'text',
    value,
    onChange,
    placeholder,
    required = false,
    disabled = false,
    fullWidth = false,
    className = '',
    error,
}) => {
    const inputClass = cn(
        cls.input,
        {
            [cls.error]: error,
            [cls.fullWidth]: fullWidth,
        },
        className,
    );

    return (
        <div className={cls.container}>
            {label && (
                <label htmlFor={id} className={cls.label}>
                    {label}
                    {required && <span className={cls.required}>*</span>}
                </label>
            )}
            <input
                id={id}
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                disabled={disabled}
                className={inputClass}
            />
            {error && <span className={cls.errorText}>{error}</span>}
        </div>
    );
};
