import { User } from "lucide-react";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4 w-full">
        {/* Logo */}
        <span className="text-xl font-bold text-brand-dark tracking-tight">
          Casablanca<span className="text-brand-primary">.</span>
        </span>

        {/* Profile button */}
        <button
          type="button"
          aria-label="Perfil de usuario"
          className="p-2 rounded-full bg-slate-100 text-brand-dark hover:bg-slate-200 transition-all min-h-[48px] min-w-[48px] flex items-center justify-center"
        >
          <User size={20} />
        </button>
      </div>
    </header>
  );
}
