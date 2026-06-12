import React, {
    createContext,
    useContext,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";
import { VEHICLES as MOCK_VEHICLES, CATEGORIES } from "@/data/vehicles";
import { LOCATIONS } from "@/data/locations";
import { generateRef, rentalDays } from "@/lib/format";
import { fetchVehicles } from "@/services/vehicles.service";

const STORAGE_KEY = "nexus_store_v2";

export const REQUIRED_DOCUMENTS = [
    {
        id: "license",
        label: "Driving licence",
        hint: "Front and back, valid and unexpired.",
    },
    {
        id: "passport",
        label: "Passport or national ID",
        hint: "Photo page, clearly legible.",
    },
    {
        id: "selfie",
        label: "Identity selfie",
        hint: "A clear photo of your face for verification.",
    },
];

const makeDocs = (status = "required") =>
    REQUIRED_DOCUMENTS.map((d) => ({
        id: d.id,
        label: d.label,
        status,
        fileName: status === "required" ? null : `${d.id}-scan.jpg`,
        note: null,
    }));

export const deriveStatus = (r) => {
    if (!r) return "awaiting_documents";
    if (r.completed) return "completed";
    const docs = r.documents || [];
    if (docs.some((d) => d.status === "rejected")) return "action_required";
    if (docs.length && docs.every((d) => d.status === "approved")) return "approved";
    if (docs.length && docs.every((d) => d.status === "uploaded" || d.status === "approved"))
        return "under_review";
    return "awaiting_documents";
};

const seedReservations = () => {
    const now = Date.now();
    const iso = (offsetDays) =>
        new Date(now + offsetDays * 86400000).toISOString();
    return [
        {
            ref: "NX-AVERY1",
            vehicleId: "bmw-i7-xdrive60",
            owner: "demo",
            createdAt: iso(-1),
            pickup: { locationCode: "CMN", date: iso(2), time: "10:00" },
            return: { date: iso(5), time: "10:00" },
            driver: {
                firstName: "Avery",
                lastName: "Lindqvist",
                email: "avery.l@example.com",
                phone: "+46 70 555 0142",
                country: "Sweden",
                license: "SE-992134",
            },
            pricing: { perDay: 349, days: 3, deposit: 2200, total: 1047 },
            documents: makeDocs("uploaded"),
            payment: { mode: "demo", status: "authorized", amount: 1047 },
            completed: false,
        },
        {
            ref: "NX-MARLO2",
            vehicleId: "range-rover-autobiography",
            owner: "demo",
            createdAt: iso(-2),
            pickup: { locationCode: "CMN", date: iso(1), time: "14:30" },
            return: { date: iso(6), time: "14:30" },
            driver: {
                firstName: "Marlo",
                lastName: "Devereux",
                email: "marlo.d@example.com",
                phone: "+33 6 12 55 0198",
                country: "France",
                license: "FR-552010",
            },
            pricing: { perDay: 329, days: 5, deposit: 2200, total: 1645 },
            documents: makeDocs("approved"),
            payment: { mode: "demo", status: "authorized", amount: 1645 },
            completed: false,
        },
        {
            ref: "NX-SENNA3",
            vehicleId: "porsche-911-carrera",
            owner: "demo",
            createdAt: iso(-3),
            pickup: { locationCode: "CMN", date: iso(4), time: "09:00" },
            return: { date: iso(7), time: "09:00" },
            driver: {
                firstName: "Senna",
                lastName: "Ricci",
                email: "senna.r@example.com",
                phone: "+39 33 555 0177",
                country: "Italy",
                license: "IT-771204",
            },
            pricing: { perDay: 389, days: 3, deposit: 2500, total: 1167 },
            documents: makeDocs("required"),
            payment: { mode: "demo", status: "authorized", amount: 1167 },
            completed: false,
        },
    ];
};

const defaultSearch = {
    locationCode: "CMN",
    pickupDate: null,
    pickupTime: "10:00",
    returnDate: null,
    returnTime: "10:00",
    category: "all",
};

const load = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch {
        return null;
    }
};

const AppStoreContext = createContext(null);

export const AppStoreProvider = ({ children }) => {
    const persisted = load();
    const [reservations, setReservations] = useState(
        persisted?.reservations ?? seedReservations()
    );
    const [search, setSearchState] = useState(
        persisted?.search ?? defaultSearch
    );
    const [activeRef, setActiveRef] = useState(persisted?.activeRef ?? null);

    const [vehicles, setVehicles] = useState(MOCK_VEHICLES);
    const [vehiclesLoading, setVehiclesLoading] = useState(true);

    useEffect(() => {
        fetchVehicles()
            .then(data => {
                if (data && data.length > 0) {
                    setVehicles(data);
                } else {
                    setVehicles(MOCK_VEHICLES);
                }
            })
            .catch(err => {
                console.error("Failed to fetch vehicles from backend, using mocks:", err);
                setVehicles(MOCK_VEHICLES);
            })
            .finally(() => {
                setVehiclesLoading(false);
            });
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify({ reservations, search, activeRef })
            );
        } catch {
            /* ignore quota errors in demo */
        }
    }, [reservations, search, activeRef]);

    const setSearch = useCallback((patch) => {
        setSearchState((prev) => ({ ...prev, ...patch }));
    }, []);

    const getVehicle = useCallback(
        (id) => vehicles.find((v) => v.id === id) || null,
        [vehicles]
    );

    const getReservation = useCallback(
        (ref) => reservations.find((r) => r.ref === ref) || null,
        [reservations]
    );

    const patchReservation = useCallback((ref, updater) => {
        setReservations((prev) =>
            prev.map((r) => (r.ref === ref ? updater(r) : r))
        );
    }, []);

    const createReservation = useCallback(
        ({ vehicleId, driver, pickup, ret, pricing }) => {
            const ref = generateRef();
            const reservation = {
                ref,
                vehicleId,
                owner: "me",
                createdAt: new Date().toISOString(),
                pickup,
                return: ret,
                driver,
                pricing,
                documents: makeDocs("required"),
                payment: {
                    mode: "demo",
                    status: "authorized",
                    amount: pricing.total,
                },
                completed: false,
            };
            setReservations((prev) => [reservation, ...prev]);
            setActiveRef(ref);
            return ref;
        },
        []
    );

    const uploadDocument = useCallback(
        (ref, docId, fileName) => {
            patchReservation(ref, (r) => ({
                ...r,
                documents: r.documents.map((d) =>
                    d.id === docId
                        ? { ...d, status: "uploaded", fileName, note: null }
                        : d
                ),
            }));
        },
        [patchReservation]
    );

    const removeDocument = useCallback(
        (ref, docId) => {
            patchReservation(ref, (r) => ({
                ...r,
                documents: r.documents.map((d) =>
                    d.id === docId
                        ? { ...d, status: "required", fileName: null, note: null }
                        : d
                ),
            }));
        },
        [patchReservation]
    );

    const approveDocument = useCallback(
        (ref, docId) => {
            patchReservation(ref, (r) => ({
                ...r,
                documents: r.documents.map((d) =>
                    d.id === docId ? { ...d, status: "approved", note: null } : d
                ),
            }));
        },
        [patchReservation]
    );

    const rejectDocument = useCallback(
        (ref, docId, note) => {
            patchReservation(ref, (r) => ({
                ...r,
                documents: r.documents.map((d) =>
                    d.id === docId
                        ? { ...d, status: "rejected", note: note || "Please re-upload a clearer copy." }
                        : d
                ),
            }));
        },
        [patchReservation]
    );

    const confirmHandoff = useCallback(
        (ref) => {
            patchReservation(ref, (r) => ({ ...r, completed: true }));
        },
        [patchReservation]
    );

    const resetDemo = useCallback(() => {
        setReservations(seedReservations());
        setSearchState(defaultSearch);
        setActiveRef(null);
    }, []);

    const value = useMemo(
        () => ({
            vehicles,
            vehiclesLoading,
            categories: CATEGORIES,
            locations: LOCATIONS,
            getVehicle,
            reservations,
            getReservation,
            search,
            setSearch,
            activeRef,
            setActiveRef,
            createReservation,
            uploadDocument,
            removeDocument,
            approveDocument,
            rejectDocument,
            confirmHandoff,
            resetDemo,
            rentalDays,
        }),
        [
            vehicles,
            vehiclesLoading,
            getVehicle,
            reservations,
            getReservation,
            search,
            setSearch,
            activeRef,
            createReservation,
            uploadDocument,
            removeDocument,
            approveDocument,
            rejectDocument,
            confirmHandoff,
            resetDemo,
        ]
    );

    return (
        <AppStoreContext.Provider value={value}>
            {children}
        </AppStoreContext.Provider>
    );
};

export const useStore = () => {
    const ctx = useContext(AppStoreContext);
    if (!ctx) throw new Error("useStore must be used within AppStoreProvider");
    return ctx;
};
