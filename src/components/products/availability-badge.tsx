import { Badge } from "@/components/ui/badge";
import type { Availability } from "@/generated/prisma/client";

const CONFIG: Record<Availability, { label: string; variant: "success" | "warning" | "muted" | "info" | "destructive" }> = {
  IN_STOCK: { label: "In Stock", variant: "success" },
  LOW_STOCK: { label: "Low Stock", variant: "warning" },
  OUT_OF_STOCK: { label: "Out of Stock", variant: "muted" },
  PRE_ORDER: { label: "Pre-order", variant: "info" },
  COMING_SOON: { label: "Coming Soon", variant: "info" },
  UNKNOWN: { label: "Unknown", variant: "muted" },
};

export function AvailabilityBadge({ availability }: { availability: Availability }) {
  const config = CONFIG[availability];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
