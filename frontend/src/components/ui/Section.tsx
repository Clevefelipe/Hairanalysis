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
      className={["panel-tight", "section-stack", className].filter(Boolean).join(" ")}
      {...props}
    >
      {children}
    </Component>
  );
}
