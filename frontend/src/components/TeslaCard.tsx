interface TeslaCardProps {
  name: string;
  capacity: number;
  availableSeats: number;
  isOnline: boolean;
  pending: boolean;
  onToggle: () => void;
}

export default function TeslaCard({
  name,
  capacity,
  availableSeats,
  isOnline,
  pending,
  onToggle,
}: TeslaCardProps) {
  return (
    <section className="flex flex-col justify-between gap-6 rounded-3xl bg-emerald-300 p-7 text-[#083c2d] sm:flex-row sm:items-end">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em]">
          Tesla · {isOnline ? "Online" : "Offline"}
        </p>
        <h2 className="mt-3 text-4xl font-semibold tracking-tight">{name}</h2>
        <p className="mt-2 text-sm">
          {availableSeats} of {capacity} seats available
        </p>
      </div>
      <button
        className="rounded-xl bg-[#083c2d] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
        disabled={pending}
        onClick={onToggle}
      >
        {pending ? "Updating…" : isOnline ? "Go offline" : "Go online"}
      </button>
    </section>
  );
}
