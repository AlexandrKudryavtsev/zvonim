import React from 'react';
import { cn } from '@/utils/classNames';
import cls from './MainLayout.module.scss';

interface MainLayoutProps {
  children: React.ReactNode;
  centerContent?: boolean;
  className?: string;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  centerContent = false,
  className = '',
}) => {
  return (
    <div className={cn(cls.layout, { [cls.centerContent]: centerContent }, className)}>
      <div className={cls.content}>
        {children}
      </div>
    </div>
  );
};
