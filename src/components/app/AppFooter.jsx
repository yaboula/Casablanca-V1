import { Link } from "react-router-dom";

export const AppFooter = () => (
    <footer className="bg-white border-t border-neutral-200 mt-auto">
        <div className="nx-container py-10 md:py-12 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-2.5">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1E41FC]" />
                <span className="font-display text-lg font-medium tracking-tight">
                    Nexus<span className="text-neutral-400">/Car</span>
                </span>
                <span className="ml-3 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-[#1E41FC] bg-[#1E41FC]/10 border border-[#1E41FC]/20 rounded-full px-2.5 py-1">
                    Demo concept
                </span>
            </div>
            <div className="flex items-center gap-6 nx-meta text-neutral-500">
                <Link to="/catalog" className="hover:text-neutral-900">Vehicles</Link>
                <Link to="/dashboard" className="hover:text-neutral-900">My trips</Link>
                <Link to="/operator" className="hover:text-neutral-900">Operator</Link>
            </div>
            <div className="nx-meta text-neutral-400">
                © {new Date().getFullYear()} Nexus Car — concept, not a real product.
            </div>
        </div>
    </footer>
);

export default AppFooter;
