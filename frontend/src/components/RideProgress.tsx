const stages = [
  { status: "REQUESTED", label: "Requested" },
  { status: "MATCHED", label: "Matched" },
  { status: "DRIVER_ARRIVED", label: "Driver arrived" },
  { status: "STARTED", label: "In progress" },
  { status: "COMPLETED", label: "Completed" },
];

export default function RideProgress({
  history,
  currentStatus,
}: {
  history: string[];
  currentStatus: string;
}) {
  if (currentStatus === "CANCELLED") {
    return <p className="mt-3 text-xs font-medium text-red-600">Trip cancelled</p>;
  }

  const reached = new Set([...history, currentStatus]);

  return (
    <ol className="mt-3 flex flex-wrap gap-x-3 gap-y-2" aria-label="Trip progress">
      {stages.map((stage) => (
        <li
          key={stage.status}
          className={`text-xs ${
            reached.has(stage.status)
              ? "font-semibold text-emerald-700"
              : "text-[#8ca097]"
          }`}
        >
          <span aria-hidden="true">{reached.has(stage.status) ? "●" : "○"}</span>{" "}
          {stage.label}
        </li>
      ))}
    </ol>
  );
}
