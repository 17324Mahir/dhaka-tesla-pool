export default function FareCard({ fare }: { fare: number }) {
  const amount = fare / 100;

  return (
    <span className="font-medium" aria-label={`${fare} paisa`}>
      {amount.toLocaleString("en-BD", {
        minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
        maximumFractionDigits: 2,
      })} BDT
    </span>
  );
}
