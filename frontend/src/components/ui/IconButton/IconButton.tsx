import React from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/classNames';
import cls from './IconButton.module.scss';

interface IconButtonProps {
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  className?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onClick,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  className,
}) => {
  return (
    <Button
      variant={variant}
      size={size}
      onClick={onClick}
      disabled={disabled}
      className={cn(cls.iconButton, className)}
    >
      <span className={cls.iconWrapper}>
        {icon}
      </span>
    </Button>
  );
};
