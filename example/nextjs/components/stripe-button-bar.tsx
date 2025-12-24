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
    size?: React.ComponentProps<typeof Button>['size'];
    stretch?: boolean;
    shortLabel?: string;
}

export const StripeButton = React.forwardRef<HTMLButtonElement, StripeButtonProps>(function StripeButton(
    {
        label,
        icon,
        tone = 'default',
        active,
        className,
        size = 'icon',
        stretch = true,
        shortLabel,
        ...props
    },
    ref
) {
    const toneClasses = {
        default: 'bg-transparent text-white border-transparent hover:bg-white/5',
        muted: 'bg-transparent text-white border-transparent hover:bg-white/5',
        danger: 'bg-transparent text-white border-transparent hover:bg-white/5',
    } as const;

    return (
        <Button
            {...props}
            ref={ref}
            size={size}
            variant="noShadow"
            aria-label={label}
            title={label}
            className={cn(
                'w-full border-2 shadow-shadow transition-transform hover:-translate-y-px',
                stretch ? 'flex-1 min-h-12' : 'flex-none min-h-12',
                toneClasses[tone],
                active ? 'ring-2 ring-offset-2 ring-main ring-offset-gray-900' : 'ring-0',
                shortLabel ? 'flex-col gap-0.5 py-1' : '',
                className,
            )}
        >
            {icon}
            {shortLabel && (
                <span className="text-[8px] sm:text-[9px] leading-tight opacity-70 truncate max-w-full">
                    {shortLabel}
                </span>
            )}
        </Button>
    );
});

type OverlayButton = {
    key: string | number;
    label: string;
    shortLabel?: string;
    icon: React.ReactNode;
    onClick: () => void;
    disabled?: boolean;
    active?: boolean;
    stretch?: boolean;
    size?: React.ComponentProps<typeof Button>['size'];
    className?: string;
};

interface SideButtonOverlayProps {
    buttons: OverlayButton[];
    side?: 'left' | 'right';
    className?: string;
    fitContent?: boolean;
    maxWidthPercent?: number;
}

export const SideButtonOverlay = React.forwardRef<HTMLDivElement, SideButtonOverlayProps>(
    ({ buttons, side = 'left', className, fitContent = false, maxWidthPercent = 50 }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    'pointer-events-auto absolute top-0 bottom-0 z-50 flex flex-col gap-0 border-2 border-border bg-gray-900 px-0 py-3 sm:py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]',
                    fitContent ? 'w-auto min-w-[4rem] sm:min-w-[5rem] max-w-[50vw]' : 'w-16 sm:w-20',
                    side === 'left' ? 'left-0' : 'right-0',
                    className,
                )}
                style={fitContent ? { maxWidth: `${maxWidthPercent}vw` } : undefined}
            >
                {buttons.map((btn) => (
                    <StripeButton
                        key={btn.key}
                        label={btn.label}
                        shortLabel={btn.shortLabel}
                        icon={btn.icon}
                        onClick={btn.onClick}
                        disabled={btn.disabled}
                        active={btn.active}
                        stretch={btn.stretch}
                        size={btn.size}
                        className={btn.className}
                    />
                ))}
            </div>
        );
    }
);
