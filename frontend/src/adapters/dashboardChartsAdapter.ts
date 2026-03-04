import { DashboardSummaryDTO } from "../types/dashboard";

export function mapDistributionToChart(
  timeline: DashboardSummaryDTO["timeline"]
) {
  if (!Array.isArray(timeline)) return [];
  return timeline.map(item => ({
    label: item.date,
    value: item.total,
  }));
}
