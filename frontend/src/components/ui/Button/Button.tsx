import React from 'react';
import cls from './Button.module.scss';
import { cn } from '@/utils/classNames';

interface ButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    type?: 'button' | 'submit' | 'reset';
    variant?: 'primary' | 'secondary' | 'danger';
    size?: 'small' | 'medium' | 'large';
    disabled?: boolean;
    fullWidth?: boolean;
    className?: string;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    onClick,
    type = 'button',
    variant = 'primary',
    size = 'medium',
    disabled = false,
    fullWidth = false,
    className = '',
}) => {
    const buttonClass = cn(
        cls.button,
        cls[variant],
        cls[size],
        {
            [cls.disabled]: disabled,
            [cls.fullWidth]: fullWidth,
        },
        className,
    );

    return (
        <button
            type={type}
            className={buttonClass}
            onClick={onClick}
            disabled={disabled}
        >
            {children}
        </button>
    );
};
