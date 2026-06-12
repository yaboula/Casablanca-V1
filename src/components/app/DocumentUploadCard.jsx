import { useRef, useState } from "react";
import { UploadCloud, FileCheck2, X, RotateCcw, Check, AlertCircle } from "lucide-react";
import StatusBadge from "@/components/app/StatusBadge";

export const DocumentUploadCard = ({ doc, hint, onUpload, onRemove }) => {
    const inputRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleFile = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        setProgress(0);
        const started = Date.now();
        const tick = setInterval(() => {
            const pct = Math.min(100, ((Date.now() - started) / 900) * 100);
            setProgress(pct);
            if (pct >= 100) {
                clearInterval(tick);
                setUploading(false);
                onUpload?.(file.name);
            }
        }, 60);
    };

    const trigger = () => inputRef.current?.click();
    const status = doc.status;

    return (
        <div
            className="bg-white border border-neutral-200 rounded-[1.25rem] p-5"
            data-testid={`doc-card-${doc.id}`}
        >
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h4 className="text-[1.05rem] font-semibold text-neutral-900">{doc.label}</h4>
                    {hint && <p className="nx-meta text-neutral-500 mt-1 max-w-sm">{hint}</p>}
                </div>
                <StatusBadge status={status} size="sm" />
            </div>

            <input
                ref={inputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={handleFile}
                data-testid={`doc-input-${doc.id}`}
            />

            <div className="mt-4">
                {uploading ? (
                    <div className="py-2">
                        <div className="flex items-center justify-between nx-meta text-neutral-500 mb-2">
                            <span>Uploading…</span>
                            <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                            <div className="h-full bg-[#1E41FC] transition-all duration-100" style={{ width: `${progress}%` }} />
                        </div>
                    </div>
                ) : status === "required" ? (
                    <button
                        type="button"
                        onClick={trigger}
                        data-testid={`doc-upload-${doc.id}`}
                        className="w-full border border-dashed border-neutral-300 rounded-xl py-7 flex flex-col items-center justify-center gap-2 text-neutral-500 hover:border-[#1E41FC] hover:text-[#1E41FC] hover:bg-neutral-50 transition-colors"
                    >
                        <UploadCloud className="w-6 h-6" />
                        <span className="text-[0.9rem] font-medium">Upload file</span>
                        <span className="text-[0.75rem] text-neutral-400">JPG, PNG or PDF · up to 10MB</span>
                    </button>
                ) : status === "rejected" ? (
                    <div className="space-y-3">
                        <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                            <p className="text-[0.85rem] text-red-700">{doc.note || "Please re-upload a clearer copy."}</p>
                        </div>
                        <button
                            type="button"
                            onClick={trigger}
                            data-testid={`doc-reupload-${doc.id}`}
                            className="inline-flex items-center gap-2 text-[0.9rem] font-medium text-neutral-900 hover:text-[#1E41FC] transition-colors"
                        >
                            <RotateCcw className="w-4 h-4" /> Re-upload
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center justify-between rounded-xl border border-neutral-200 px-4 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${status === "approved" ? "bg-emerald-50 text-emerald-600" : "bg-neutral-100 text-neutral-500"}`}>
                                {status === "approved" ? <Check className="w-4 h-4" /> : <FileCheck2 className="w-4 h-4" />}
                            </span>
                            <span className="text-[0.9rem] text-neutral-700 truncate">{doc.fileName}</span>
                        </div>
                        {status === "uploaded" && onRemove && (
                            <button
                                type="button"
                                onClick={() => onRemove(doc.id)}
                                className="p-1.5 text-neutral-400 hover:text-red-500 transition-colors"
                                aria-label="Remove file"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DocumentUploadCard;
