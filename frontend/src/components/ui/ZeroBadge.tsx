import clsx from "clsx";

const ZeroVisualizer = ({ height = 44 }: { height?: number }) => {
  const width = 120;
  const baseline = height - 6;
  const points = [
    { x: 4, y: baseline - 2 },
    { x: 28, y: baseline - 14 },
    { x: 48, y: baseline - 6 },
    { x: 72, y: baseline - 24 },
    { x: 94, y: baseline - 12 },
    { x: 114, y: baseline - 26 },
  ];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} role="presentation" aria-hidden="true">
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points.map((pt) => `${pt.x},${pt.y}`).join(" ")}
        opacity={0.8}
      />
      {points.slice(1, -1).map((pt, idx) => (
        <circle key={idx} cx={pt.x} cy={pt.y} r={2.4} fill="currentColor" opacity={0.35} />
      ))}
    </svg>
  );
};

export type ZeroBadgeProps = {
  label?: string;
  helper?: string;
  size?: "default" | "compact";
};

export default function ZeroBadge({ label = "Sem dados", helper, size = "default" }: ZeroBadgeProps) {
  const padding = size === "compact" ? "px-3 py-2" : "px-4 py-3";
  const vizWidth = size === "compact" ? "w-14" : "w-16";
  const vizHeight = size === "compact" ? 32 : 40;

  return (
    <div
      className={clsx(
        "inline-flex items-center gap-3 rounded-2xl border border-dashed text-left",
        padding,
      )}
      style={{
        borderColor: "color-mix(in srgb, var(--color-border) 80%, transparent)",
        backgroundColor: "color-mix(in srgb, var(--color-surface) 92%, white)",
        color: "var(--color-text-muted)",
      }}
    >
      <div
        className={clsx(
          "flex items-center justify-center rounded-xl border border-dashed",
          vizWidth,
        )}
        style={{
          minHeight: vizHeight,
          borderColor: "color-mix(in srgb, var(--color-border) 60%, transparent)",
          background: "linear-gradient(180deg, rgba(226, 232, 240, 0.4), rgba(226, 232, 240, 0)",
          color: "var(--color-text-muted)",
        }}
      >
        <ZeroVisualizer height={vizHeight} />
      </div>
      <div className="space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.3em]">{label}</p>
        {helper && <p className="text-[11px] font-medium tracking-normal">{helper}</p>}
      </div>
    </div>
  );
}
