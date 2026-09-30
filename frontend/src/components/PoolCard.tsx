import FareCard from "./FareCard";
import StatusBadge from "./StatusBadge";

interface PoolCardProps {
  teslaName: string;
  capacity: number;
  usedSeats: number;
  memberCount: number;
  status: string;
  route?: string;
  fare?: number;
}

export default function PoolCard(props: PoolCardProps) {
  return (
    <article className="rounded-2xl border border-[#dce6e0] p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-semibold">{props.teslaName}</p>
          <p className="mt-1 text-sm text-[#6b7f76]">
            {props.usedSeats} of {props.capacity} seats · {props.memberCount} passenger request{props.memberCount === 1 ? "" : "s"}
          </p>
        </div>
        <StatusBadge status={props.status} />
      </div>
      {props.route && typeof props.fare === "number" && (
        <div className="mt-4 rounded-xl bg-[#f4f7f4] px-3 py-2 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span>{props.route}</span>
            <FareCard fare={props.fare} />
          </div>
          <p className="mt-1 text-xs text-[#62766d]">
            {props.memberCount >= 2
              ? "20% shared-ride discount applied"
              : "Full fare for now — the discount applies when another passenger shares this Tesla"}
          </p>
        </div>
      )}
      <p className="mt-3 text-xs text-[#6b7f76]">
        Other passengers’ routes and fares stay private.
      </p>
    </article>
  );
}
