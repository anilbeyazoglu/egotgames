"use client";

import * as React from "react";
import { Check, ChevronDown, ChevronUp } from "lucide-react";

import { cn } from "@/lib/utils";

// Simple Select implementation since radix-ui/react-select is not installed.
// Handles single selection, simplified API matching the one used.

const SelectContext = React.createContext<{
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  optionsLabelMap: Map<string, React.ReactNode>;
} | null>(null);

const Select = ({ children, value, onValueChange, required }: any) => {
  const [open, setOpen] = React.useState(false);
  // We need to know the label for the selected value to display it in trigger
  const [optionsLabelMap] = React.useState(
    () => new Map<string, React.ReactNode>()
  );

  // Force update when map changes (not really needed if we just mutate, but good for react)
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);

  // This is a bit hacky to get labels up to the trigger without radix
  // In a real app, prefer installing the radix primitive!

  return (
    <SelectContext.Provider
      value={{ value, onValueChange, open, setOpen, optionsLabelMap }}
    >
      <div className="relative">{children}</div>
    </SelectContext.Provider>
  );
};

const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
  const context = React.useContext(SelectContext);
  if (!context) return null;

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => context.setOpen(!context.open)}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  );
});
SelectTrigger.displayName = "SelectTrigger";

const SelectContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, position = "popper", ...props }, ref) => {
  const context = React.useContext(SelectContext);
  if (!context || !context.open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50"
        onClick={() => context.setOpen(false)}
      />
      <div
        ref={ref}
        className={cn(
          "absolute z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 top-[calc(100%+4px)] w-full",
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
          className
        )}
        {...props}
      >
        <div className={cn("p-1", position === "popper" && "")}>{children}</div>
      </div>
    </>
  );
});
SelectContent.displayName = "SelectContent";

const SelectItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value: string }
>(({ className, children, value, ...props }, ref) => {
  const context = React.useContext(SelectContext);
  if (!context) return null;

  // Register label
  if (!context.optionsLabelMap.has(value)) {
    context.optionsLabelMap.set(value, children);
  }

  const isSelected = context.value === value;

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors",
        className
      )}
      onClick={(e) => {
        e.stopPropagation();
        context.onValueChange(value);
        context.setOpen(false);
      }}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {isSelected && <Check className="h-4 w-4" />}
      </span>

      <span className="truncate">{children}</span>
    </div>
  );
});
SelectItem.displayName = "SelectItem";

const SelectValue = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement> & { placeholder?: string }
>(({ className, placeholder, ...props }, ref) => {
  const context = React.useContext(SelectContext);

  const displayValues = context?.value
    ? context.optionsLabelMap.get(context.value)
    : placeholder;

  return (
    <span ref={ref} className={cn("pointer-events-none", className)} {...props}>
      {displayValues}
    </span>
  );
});
SelectValue.displayName = "SelectValue";

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue };
