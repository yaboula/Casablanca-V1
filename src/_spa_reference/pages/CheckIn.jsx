import { useParams, useNavigate } from "react-router-dom";
import { ShieldCheck, ArrowRight, Lock } from "lucide-react";
import { useStore, REQUIRED_DOCUMENTS } from "@/context/AppStore";
import AppShell from "@/components/app/AppShell";
import DocumentUploadCard from "@/components/app/DocumentUploadCard";
import ReservationSummary from "@/components/app/ReservationSummary";
import PremiumButton from "@/components/app/PremiumButton";
import ErrorState from "@/components/app/ErrorState";

export default function CheckIn() {
    const { ref } = useParams();
    const navigate = useNavigate();
    const { getReservation, getVehicle, uploadDocument, removeDocument } = useStore();
    const reservation = getReservation(ref);
    const vehicle = reservation ? getVehicle(reservation.vehicleId) : null;

    if (!reservation || !vehicle) {
        return (
            <AppShell>
                <ErrorState title="Reservation not found" actionLabel="Back to my trips" actionTo="/dashboard" />
            </AppShell>
        );
    }

    const docs = reservation.documents;
    const done = docs.filter((d) => d.status === "uploaded" || d.status === "approved").length;
    const allUploaded = done === docs.length;
    const hintFor = (id) => REQUIRED_DOCUMENTS.find((d) => d.id === id)?.hint;

    return (
        <AppShell max="default">
            <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-8 lg:gap-12 items-start">
                <div>
                    <span className="nx-eyebrow text-neutral-500 font-medium">Check-in · {reservation.ref}</span>
                    <h1 className="nx-h2 font-display font-light text-neutral-900 mt-2">
                        Prepare your documents
                    </h1>
                    <p className="nx-lead text-neutral-600 mt-3 max-w-xl">
                        Upload these before you land. Our operators verify them in advance so
                        your handover at arrivals is fast and calm.
                    </p>

                    {/* Progress */}
                    <div className="mt-7 rounded-2xl border border-neutral-200 px-5 py-4">
                        <div className="flex items-center justify-between">
                            <span className="nx-label text-neutral-500">Upload progress</span>
                            <span className="text-[0.9rem] font-semibold text-neutral-900">{done} of {docs.length}</span>
                        </div>
                        <div className="mt-3 h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                            <div className="h-full bg-[#1E41FC] transition-all duration-500" style={{ width: `${(done / docs.length) * 100}%` }} />
                        </div>
                    </div>

                    {/* Uploads */}
                    <div className="mt-6 space-y-4">
                        {docs.map((doc) => (
                            <DocumentUploadCard
                                key={doc.id}
                                doc={doc}
                                hint={hintFor(doc.id)}
                                onUpload={(fileName) => uploadDocument(reservation.ref, doc.id, fileName)}
                                onRemove={(docId) => removeDocument(reservation.ref, docId)}
                            />
                        ))}
                    </div>

                    {/* Privacy */}
                    <div className="mt-6 flex items-start gap-3 rounded-2xl bg-neutral-50 border border-neutral-200 px-5 py-4">
                        <Lock className="w-5 h-5 text-[#1E41FC] shrink-0 mt-0.5" />
                        <p className="nx-meta text-neutral-500">
                            Your documents are used only to verify your identity for this
                            reservation. In this demo nothing is uploaded to a server — files
                            stay in your browser.
                        </p>
                    </div>

                    <div className="mt-8 flex items-center justify-between gap-4 border-t border-neutral-200 pt-6">
                        <PremiumButton variant="ghost" to={`/confirmation/${reservation.ref}`}>
                            Back
                        </PremiumButton>
                        <PremiumButton
                            variant="dark"
                            iconRight={ArrowRight}
                            disabled={!allUploaded}
                            onClick={() => navigate(`/waiting/${reservation.ref}`)}
                            data-testid="checkin-submit"
                        >
                            Submit for review
                        </PremiumButton>
                    </div>
                    {!allUploaded && (
                        <p className="nx-meta text-neutral-400 text-right mt-2">
                            Upload all documents to submit for review.
                        </p>
                    )}
                </div>

                <div className="lg:sticky lg:top-24 space-y-5">
                    <ReservationSummary reservation={reservation} vehicle={vehicle} showPricing={false} />
                    <div className="flex items-start gap-3 rounded-2xl border border-neutral-200 px-5 py-4">
                        <ShieldCheck className="w-5 h-5 text-[#1E41FC] shrink-0 mt-0.5" />
                        <p className="nx-meta text-neutral-500">
                            Verifying early means no counter, no paperwork, and a pickup in under
                            ten minutes.
                        </p>
                    </div>
                </div>
            </div>
        </AppShell>
    );
}
