import React from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "green" | "blue" | "black";

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  variant?: ButtonVariant;
  type?: "button" | "submit" | "reset";
}

const baseClasses = [
  "inline-flex h-10 items-center justify-center gap-2",
  "rounded-lg px-4 text-sm font-semibold",
  "transition-all",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2",
  "disabled:opacity-60 disabled:cursor-not-allowed",
];

const variantClasses: Record<ButtonVariant, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  ghost: "btn-outline",
  danger: "btn-danger",
  green: "btn-green",
  blue: "btn-blue",
  black: "btn-black",
};

export default function Button({
  variant = "primary",
  disabled,
  children,
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled}
      className={[
        ...baseClasses,
        variantClasses[variant],
        disabled ? "cursor-not-allowed" : "cursor-pointer",
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}
