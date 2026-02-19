import OperatorBottomNav from "@/components/operator/OperatorBottomNav";
import QRScannerFAB from "@/components/operator/QRScannerFAB";

export default function OperatorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20">
      {children}
      <QRScannerFAB />
      <OperatorBottomNav />
    </div>
  );
}
