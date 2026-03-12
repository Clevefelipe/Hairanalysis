import { ReactNode } from "react";
import AnalysisStatsGrid, { AnalysisStatItem } from "./AnalysisStatsGrid";

export type AnalysisWizardLayoutProps = {
  stats?: AnalysisStatItem[];
  heroSlot?: ReactNode;
  steps?: ReactNode;
  main: ReactNode;
  sidebar?: ReactNode;
};

export default function AnalysisWizardLayout({ stats, heroSlot, steps, main, sidebar }: AnalysisWizardLayoutProps) {
  return (
    <main className="section-stack animate-page-in relative w-full pt-0">
      {heroSlot}
      {steps}
      {stats && stats.length > 0 && <AnalysisStatsGrid items={stats} />}
      <section className="grid gap-3 lg:grid-cols-[2fr,1fr] items-start">
        <div className="rounded-2xl border p-5" style={{ borderColor: "rgba(226,232,240,0.85)", backgroundColor: "var(--color-surface)", boxShadow: "var(--shadow-card)" }}>
          {main}
        </div>
        {sidebar}
      </section>
    </main>
  );
}
