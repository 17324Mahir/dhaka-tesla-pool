export default function FareCard({ fare }: { fare: number }) {
  return (
    <span className="font-medium" aria-label={`${fare} paisa`}>
      {(fare / 100).toFixed(0)} BDT
    </span>
  );
}
