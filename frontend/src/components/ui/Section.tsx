import React from "react";

type SectionElement = keyof React.JSX.IntrinsicElements;

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  as?: SectionElement;
}

export default function Section({
  as: Tag = "section",
  className = "",
  children,
  ...props
}: SectionProps) {
  const Component = Tag as React.ElementType;

  return (
    <Component
      className={[
        "section-stack",
        "rounded-2xl border px-4 py-5 md:px-6 md:py-5 shadow-card",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        borderColor: "var(--color-border)",
        backgroundColor: "var(--color-surface)",
        boxShadow: "var(--shadow-card)",
      }}
      {...props}
    >
      {children}
    </Component>
  );
}
