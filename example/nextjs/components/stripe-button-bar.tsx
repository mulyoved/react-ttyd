import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface StripeButtonBarProps {
    header?: React.ReactNode;
    footer?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}

export const StripeButtonBar: React.FC<StripeButtonBarProps> = ({
    header,
    footer,
    children,
    className,
}) => {
    return (
        <aside
            className={cn(
                'flex h-full w-16 sm:w-20 flex-col gap-0 border-l-2 border-border bg-gray-900 px-0 py-3 sm:py-4 text-white',
                'shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]',
                className,
            )}
        >
            {header && (
                <div className="flex flex-col items-center gap-1 sm:gap-2 text-[10px] sm:text-xs font-bold">
                    {header}
                </div>
            )}
            <div className="flex-1 flex flex-col gap-0 items-stretch overflow-y-auto">
                {children}
            </div>
            {footer && (
                <div className="flex flex-col items-center gap-2 sm:gap-3">
                    {footer}
                </div>
            )}
        </aside>
    );
};

type StripeButtonTone = 'default' | 'muted' | 'danger';

interface StripeButtonProps extends React.ComponentProps<typeof Button> {
    label: string;
    icon: React.ReactNode;
    tone?: StripeButtonTone;
    active?: boolean;
}

export const StripeButton: React.FC<StripeButtonProps> = ({
    label,
    icon,
    tone = 'default',
    active,
    className,
    ...props
}) => {
    const toneClasses = {
        default: 'bg-transparent text-white border-transparent hover:bg-white/5',
        muted: 'bg-transparent text-white border-transparent hover:bg-white/5',
        danger: 'bg-transparent text-white border-transparent hover:bg-white/5',
    } as const;

    return (
        <Button
            {...props}
            size="icon"
            variant="noShadow"
            aria-label={label}
            title={label}
            className={cn(
                'w-full border-2 shadow-shadow transition-transform hover:-translate-y-px',
                toneClasses[tone],
                active ? 'ring-2 ring-offset-2 ring-main ring-offset-gray-900' : 'ring-0',
                className,
            )}
        >
            {icon}
        </Button>
    );
};
