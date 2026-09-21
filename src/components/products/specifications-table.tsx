export function SpecificationsTable({ specifications }: { specifications: Record<string, string> }) {
  const entries = Object.entries(specifications);
  if (entries.length === 0) return null;

  return (
    <div className="rounded-lg border divide-y">
      {entries.map(([key, value]) => (
        <div key={key} className="flex justify-between gap-4 px-4 py-2.5 text-sm">
          <span className="text-muted-foreground">{key}</span>
          <span className="font-medium text-right">{value}</span>
        </div>
      ))}
    </div>
  );
}
