import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export function AppLayout({ children }: Props) {
  return (
    <div>
      LAYOUT OK
      {children}
    </div>
  );
}
