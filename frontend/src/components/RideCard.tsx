import FareCard from "./FareCard";
import StatusBadge from "./StatusBadge";

interface RideCardProps {
  pickup: string;
  destination: string;
  seats: number;
  fare: number;
  status: string;
  driver?: string;
  action?: React.ReactNode;
  details?: React.ReactNode;
}

export default function RideCard({
  pickup,
  destination,
  seats,
  fare,
  status,
  driver,
  action,
  details,
}: RideCardProps) {
  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-[#dce6e0] p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-semibold">{pickup} → {destination}</p>
        <p className="mt-1 text-sm text-[#6b7f76]">
          {seats} seat{seats > 1 ? "s" : ""} · <FareCard fare={fare} />
          {driver ? ` · Driver ${driver}` : ""}
        </p>
        {details}
      </div>
      <div className="flex items-center gap-3">
        <StatusBadge status={status} />
        {action}
      </div>
    </article>
  );
}
