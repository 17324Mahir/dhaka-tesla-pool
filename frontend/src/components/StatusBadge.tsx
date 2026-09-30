const colors: Record<string, string> = {
  REQUESTED: "bg-amber-100 text-amber-800",
  MATCHED: "bg-sky-100 text-sky-800",
  DRIVER_ARRIVED: "bg-violet-100 text-violet-800",
  STARTED: "bg-emerald-100 text-emerald-800",
  COMPLETED: "bg-slate-100 text-slate-700",
  CANCELLED: "bg-red-100 text-red-700",
  WAITING: "bg-amber-100 text-amber-800",
  ACTIVE: "bg-emerald-100 text-emerald-800",
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${colors[status] ?? "bg-slate-100 text-slate-700"}`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}
