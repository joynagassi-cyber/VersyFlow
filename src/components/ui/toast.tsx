import * as React from 'react';
import * as ToastPrimitives from '@radix-ui/react-toast';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const ToastProvider = ToastPrimitives.Provider;

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      'fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse gap-2 sm:w-[400px]',
      className,
    )}
    {...props}
  />
));
ToastViewport.displayName = 'ToastViewport';

const toastVariants = cva(
  'pointer-events-auto rounded-lg border border-border bg-surface p-4 shadow-lg',
  {
    variants: {
      variant: {
        default: 'border-border bg-surface text-text-primary',
        destructive: 'border-error bg-error-light text-error',
        success: 'border-success bg-success-light text-success',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => (
  <ToastPrimitives.Root
    ref={ref}
    className={cn(toastVariants({ variant }), className)}
    {...props}
  />
));
Toast.displayName = 'Toast';

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn('inline-flex h-8 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-white', className)}
    {...props}
  />
));
ToastAction.displayName = 'ToastAction';

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn('absolute right-2 top-2 rounded-full p-1 text-text-muted hover:text-text-primary', className)}
    toast-close=""
    {...props}
  >
    <X size={14} />
  </ToastPrimitives.Close>
));
ToastClose.displayName = 'ToastClose';

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn('text-sm font-semibold text-text-primary', className)}
    {...props}
  />
));
ToastTitle.displayName = 'ToastTitle';

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn('text-sm text-text-muted', className)}
    {...props}
  />
));
ToastDescription.displayName = 'ToastDescription';

type ToastActionElement = React.ReactElement<typeof ToastAction>;

function useToast() {
  const [toasts, setToasts] = React.useState<Array<{
    id: string;
    title?: string;
    description?: string;
    variant?: 'default' | 'destructive' | 'success';
    action?: ToastActionElement;
  }>>([]);

  const toast = ({ id, title, description, variant, action }: {
    id?: string;
    title?: string;
    description?: string;
    variant?: 'default' | 'destructive' | 'success';
    action?: ToastActionElement;
  }) => {
    const toastId = id ?? `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts((prev) => [
      ...prev,
      { id: toastId, title, description, variant, action },
    ]);
    return toastId;
  };

  const dismiss = (id: string) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  return {
    toast,
    toasts,
    dismiss,
  };
}

export {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastAction,
  ToastClose,
  ToastTitle,
  ToastDescription,
  useToast,
};
