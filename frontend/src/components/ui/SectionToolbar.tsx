import type { ReactNode } from "react";
import clsx from "clsx";

type SectionToolbarProps = {
  children: ReactNode;
  className?: string;
};

export default function SectionToolbar({ children, className }: SectionToolbarProps) {
  return <div className={clsx("toolbar", className)}>{children}</div>;
}
