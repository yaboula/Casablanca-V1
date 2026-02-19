import { User } from "lucide-react";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full bg-[#060910]/70 backdrop-blur-xl border-b border-white/8">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4 w-full">
        {/* Logo */}
        <span className="text-xl font-bold text-white tracking-tight">
          Nexus<span className="text-blue-400">.</span>
        </span>

        {/* Profile button */}
        <button
          type="button"
          aria-label="Perfil de usuario"
          className="p-2 rounded-full bg-white/8 border border-white/12 text-white/80 hover:bg-white/14 hover:text-white transition-all min-h-[48px] min-w-[48px] flex items-center justify-center"
        >
          <User size={20} />
        </button>
      </div>
    </header>
  );
}
