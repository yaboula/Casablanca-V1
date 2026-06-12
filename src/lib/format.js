import { format as fmt, differenceInCalendarDays } from "date-fns";

export const formatCurrency = (n) =>
    `$${Number(n || 0).toLocaleString("en-US")}`;

export const formatDate = (value, pattern = "EEE, MMM d") => {
    if (!value) return "\u2014";
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return "\u2014";
    return fmt(d, pattern);
};

export const rentalDays = (start, end) => {
    if (!start || !end) return 1;
    const a = start instanceof Date ? start : new Date(start);
    const b = end instanceof Date ? end : new Date(end);
    const days = differenceInCalendarDays(b, a);
    return days > 0 ? days : 1;
};

export const generateRef = () => {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let s = "";
    for (let i = 0; i < 6; i += 1)
        s += alphabet[Math.floor(Math.random() * alphabet.length)];
    return `NX-${s}`;
};

export const initials = (first = "", last = "") =>
    `${(first[0] || "").toUpperCase()}${(last[0] || "").toUpperCase()}` || "NX";
