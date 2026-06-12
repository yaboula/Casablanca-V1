import { useState } from "react";
import { Check, X, FileText } from "lucide-react";
import StatusBadge from "@/components/app/StatusBadge";
import PremiumButton from "@/components/app/PremiumButton";

const DocRow = ({ doc, onApprove, onReject }) => {
    const [rejecting, setRejecting] = useState(false);
    const [note, setNote] = useState("");
    const decided = doc.status === "approved" || doc.status === "rejected";

    return (
        <div className="border border-neutral-200 rounded-[1.1rem] p-4" data-testid={`review-doc-${doc.id}`}>
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    <span className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-500 shrink-0">
                        <FileText className="w-5 h-5" />
                    </span>
                    <div className="min-w-0">
                        <div className="text-[0.95rem] font-semibold text-neutral-900">{doc.label}</div>
                        <div className="nx-meta text-neutral-500 truncate">
                            {doc.fileName || "Not uploaded yet"}
                        </div>
                    </div>
                </div>
                <StatusBadge status={doc.status} size="sm" />
            </div>

            {doc.status === "uploaded" && !rejecting && (
                <div className="mt-4 flex items-center gap-2.5">
                    <PremiumButton size="sm" variant="primary" icon={Check} onClick={() => onApprove(doc.id)} data-testid={`approve-${doc.id}`}>
                        Approve
                    </PremiumButton>
                    <PremiumButton size="sm" variant="outline" icon={X} onClick={() => setRejecting(true)} data-testid={`reject-${doc.id}`}>
                        Reject
                    </PremiumButton>
                </div>
            )}

            {rejecting && (
                <div className="mt-4 space-y-2.5">
                    <input
                        className="nx-input"
                        placeholder="Reason for rejection (shown to customer)"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        data-testid={`reject-note-${doc.id}`}
                    />
                    <div className="flex items-center gap-2.5">
                        <PremiumButton
                            size="sm"
                            variant="dark"
                            onClick={() => {
                                onReject(doc.id, note.trim());
                                setRejecting(false);
                                setNote("");
                            }}
                        >
                            Confirm rejection
                        </PremiumButton>
                        <PremiumButton size="sm" variant="ghost" onClick={() => setRejecting(false)}>
                            Cancel
                        </PremiumButton>
                    </div>
                </div>
            )}

            {decided && doc.status === "rejected" && doc.note && (
                <p className="mt-3 text-[0.85rem] text-red-600">Note to customer: {doc.note}</p>
            )}
        </div>
    );
};

export const OperatorActionPanel = ({ reservation, onApprove, onReject }) => {
    if (!reservation) return null;
    return (
        <div className="space-y-4" data-testid="operator-action-panel">
            {reservation.documents.map((doc) => (
                <DocRow key={doc.id} doc={doc} onApprove={onApprove} onReject={onReject} />
            ))}
        </div>
    );
};

export default OperatorActionPanel;
