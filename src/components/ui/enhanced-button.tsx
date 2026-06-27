import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import * as React from "react";

import { cn } from "@/lib/utils";
import { wrapInlineLabelTextNodes } from "@/lib/wrap-inline-label-text";

/** Action-target focus ring — ported from @nqlib/nqui focus-styles. */
const actionFocusClasses =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background";

/**
 * Enhanced button, ported from @nqlib/nqui.
 *
 * Pill shape, dimensional gradient + soft shadow on filled variants, opacity
 * hover, and a `scale-95` + inset-shadow press. Filled variants degrade to a
 * legible muted disabled state (no white-on-white).
 *
 * Self-contained: relies only on the `.nqui-button-gradient` /
 * `.nqui-button-shadow` utilities and `--button-gradient` / `--button-shadow`
 * vars defined in globals.css. Semantic variants (success/warning/info) are
 * omitted because this app does not define those tokens.
 */
const enhancedButtonVariants = cva(
  cn(
    "inline-flex min-w-0 max-w-full items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium leading-normal text-center cursor-pointer select-none touch-manipulation transition-[color,background-color,border-color,box-shadow,opacity,transform] duration-150 ease-in-out focus:outline-0 disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-current",
    actionFocusClasses,
  ),
  {
    variants: {
      variant: {
        default: [
          "bg-primary text-primary-foreground border border-primary",
          "nqui-button-gradient nqui-button-shadow",
          "opacity-90 hover:opacity-100 dark:opacity-100 dark:hover:brightness-110",
          "hover:bg-primary/90 hover:border-primary/90",
          "focus:bg-primary/80 focus:border-primary/80",
          "active:bg-primary/75 active:border-primary/75 active:shadow-[inset_0_3px_5px_rgba(0,0,0,0.125)] active:scale-95",
          "disabled:bg-muted/60 disabled:text-muted-foreground disabled:border-border disabled:shadow-none",
        ],
        destructive: [
          "bg-destructive text-destructive-foreground border border-destructive",
          "nqui-button-gradient nqui-button-shadow",
          "opacity-90 hover:opacity-100 dark:opacity-100 dark:hover:brightness-110",
          "hover:bg-destructive/90 hover:border-destructive/90",
          "focus:bg-destructive/80 focus:border-destructive/80",
          "active:bg-destructive/75 active:border-destructive/75 active:shadow-[inset_0_3px_5px_rgba(0,0,0,0.125)] active:scale-95",
          "disabled:bg-muted/60 disabled:text-muted-foreground disabled:border-border disabled:shadow-none",
        ],
        secondary: [
          "bg-secondary text-secondary-foreground border border-border",
          "nqui-button-gradient nqui-button-shadow",
          "opacity-90 hover:opacity-100 dark:opacity-100 dark:hover:brightness-110",
          "hover:bg-secondary/90 hover:border-border",
          "focus:bg-secondary/80 focus:border-border",
          "active:bg-secondary/75 active:border-border active:shadow-[inset_0_3px_5px_rgba(0,0,0,0.125)] active:scale-95",
          "disabled:bg-muted/60 disabled:text-muted-foreground disabled:border-border disabled:shadow-none",
        ],
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-7 min-w-7 px-3",
        sm: "h-6 min-w-6 px-2 text-xs",
        lg: "h-8 min-w-8 px-4",
        icon: "h-7 w-7 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface EnhancedButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof enhancedButtonVariants> {
  asChild?: boolean;
}

const EnhancedButton = React.forwardRef<HTMLButtonElement, EnhancedButtonProps>(
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    // Slot requires a single child element — only wrap plain text labels when
    // rendering a real <button>. With asChild the child is already one element.
    const content = asChild ? children : wrapInlineLabelTextNodes(children);
    return (
      <Comp
        data-slot="button"
        data-variant={variant}
        data-size={size}
        className={cn(enhancedButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {content}
      </Comp>
    );
  },
);
EnhancedButton.displayName = "EnhancedButton";

export { EnhancedButton, enhancedButtonVariants };
