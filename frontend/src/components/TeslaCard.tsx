interface TeslaCardProps {
  name: string;
  capacity: number;
  availableSeats: number;
  isOnline: boolean;
  currentArea: string | null;
  areas: string[];
  selectedArea: string;
  pending: boolean;
  onAreaChange: (area: string) => void;
  onUpdateArea: () => void;
  onToggle: () => void;
}

export default function TeslaCard({
  name,
  capacity,
  availableSeats,
  isOnline,
  currentArea,
  areas,
  selectedArea,
  pending,
  onAreaChange,
  onUpdateArea,
  onToggle,
}: TeslaCardProps) {
  return (
    <section className="flex flex-col justify-between gap-6 rounded-3xl bg-emerald-300 p-7 text-[#083c2d] lg:flex-row lg:items-end">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em]">
          Tesla · {isOnline ? "Online" : "Offline"}
        </p>
        <h2 className="mt-3 text-4xl font-semibold tracking-tight">{name}</h2>
        <p className="mt-2 text-sm">
          {availableSeats} of {capacity} seats available
        </p>
        <p className="mt-1 text-sm font-medium">
          {isOnline && currentArea
            ? `Receiving requests from ${currentArea}`
            : "Choose your current area to receive nearby requests"}
        </p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <select
          aria-label="Current driver area"
          className="rounded-xl border border-[#083c2d]/20 bg-white/70 px-4 py-3 text-sm font-semibold outline-none focus:border-[#083c2d]"
          value={selectedArea}
          onChange={(event) => onAreaChange(event.target.value)}
          disabled={pending}
        >
          {areas.map((area) => (
            <option key={area} value={area}>{area}</option>
          ))}
        </select>
        {isOnline && (
          <button
            className="rounded-xl border border-[#083c2d]/30 px-4 py-3 text-sm font-semibold disabled:opacity-50"
            disabled={pending || selectedArea === currentArea}
            onClick={onUpdateArea}
          >
            Update area
          </button>
        )}
        <button
          className="rounded-xl bg-[#083c2d] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          disabled={pending}
          onClick={onToggle}
        >
          {pending ? "Updating…" : isOnline ? "Go offline" : "Go online"}
        </button>
      </div>
    </section>
  );
}
