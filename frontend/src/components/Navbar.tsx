interface NavbarProps {
  title: string;
  onLogout: () => void;
  dark?: boolean;
}

export default function Navbar({ title, onLogout, dark = false }: NavbarProps) {
  return (
    <header className={dark ? "border-b border-white/10" : "border-b border-[#dce6e0] bg-white/90 backdrop-blur"}>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-500">
            Dhaka Tesla Pool
          </p>
          <h1 className="mt-1 text-xl font-semibold">{title}</h1>
        </div>
        <button
          className={dark ? "text-sm font-semibold text-white/60 hover:text-white" : "text-sm font-semibold text-[#526b60] hover:text-[#10231c]"}
          onClick={onLogout}
        >
          Log out
        </button>
      </div>
    </header>
  );
}
