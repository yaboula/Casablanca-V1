"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useMotionValue, animate } from "framer-motion";
import { addDays, format, startOfDay, differenceInCalendarDays, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { TIMELINE_DAYS_AHEAD } from "@/lib/constants";

// ── Types ────────────────────────────────────────────────────

export interface DateRange {
  pickup: Date;
  return: Date;
  days: number;
}

interface DualTimelineSliderProps {
  onDatesChange: (range: DateRange) => void;
  initialPickupOffset?: number; // days from today (default 1)
  initialReturnOffset?: number; // days from today (default 4)
}

// ── Constants ────────────────────────────────────────────────

const TRACK_HEIGHT = 4;
const THUMB_SIZE_DESKTOP = 44;
const THUMB_SIZE_MOBILE = 52; // larger hit area for thumbs
const TOOLTIP_OFFSET = 48;
const MIN_GAP_DAYS = 1;

// ── Helper: snap to nearest day index ───────────────────────

function pxToDay(px: number, trackWidth: number, totalDays: number): number {
  const ratio = Math.max(0, Math.min(1, px / trackWidth));
  return Math.round(ratio * totalDays);
}

function dayToPx(day: number, trackWidth: number, totalDays: number): number {
  return (day / totalDays) * trackWidth;
}

// ── Sub-components ───────────────────────────────────────────

function DayLabel({ date, isAccent }: { date: Date; isAccent: boolean }) {
  return (
    <div
      className={`flex flex-col items-center gap-0.5 select-none pointer-events-none ${
        isAccent ? "text-brand-primary" : "text-brand-muted"
      }`}
    >
      <span className="text-[10px] font-semibold uppercase tracking-wider">
        {format(date, "EEE", { locale: es })}
      </span>
      <span className="text-xs font-bold">{format(date, "d MMM", { locale: es })}</span>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────

export default function DualTimelineSlider({
  onDatesChange,
  initialPickupOffset = 1,
  initialReturnOffset = 4,
}: DualTimelineSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const today = startOfDay(new Date());

  // Day indices (0 = today, TIMELINE_DAYS_AHEAD = last day)
  const [pickupDay, setPickupDay] = useState(initialPickupOffset);
  const [returnDay, setReturnDay] = useState(initialReturnOffset);
  const [trackWidth, setTrackWidth] = useState(0);
  const [dragging, setDragging] = useState<"pickup" | "return" | null>(null);

  const pickupX = useMotionValue(0);
  const returnX = useMotionValue(0);

  // Measure track on mount and resize
  useEffect(() => {
    function measure() {
      if (trackRef.current) {
        setTrackWidth(trackRef.current.offsetWidth);
      }
    }
    measure();
    const ro = new ResizeObserver(measure);
    if (trackRef.current) ro.observe(trackRef.current);
    return () => ro.disconnect();
  }, []);

  // Sync motion values when trackWidth or day indices change
  useEffect(() => {
    if (trackWidth === 0) return;
    animate(pickupX, dayToPx(pickupDay, trackWidth, TIMELINE_DAYS_AHEAD), {
      duration: 0.25,
      ease: "easeOut",
    });
    animate(returnX, dayToPx(returnDay, trackWidth, TIMELINE_DAYS_AHEAD), {
      duration: 0.25,
      ease: "easeOut",
    });
  }, [trackWidth, pickupDay, returnDay, pickupX, returnX]);

  // Emit changes upward
  useEffect(() => {
    const pickup = addDays(today, pickupDay);
    const ret = addDays(today, returnDay);
    const days = differenceInCalendarDays(ret, pickup);
    if (days > 0) onDatesChange({ pickup, return: ret, days });
  }, [pickupDay, returnDay]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Drag handlers ──────────────────────────────────────────

  const handlePointerDown = useCallback(
    (thumb: "pickup" | "return") =>
      (e: React.PointerEvent<HTMLDivElement>) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        setDragging(thumb);
      },
    []
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragging || !trackRef.current || trackWidth === 0) return;
      const rect = trackRef.current.getBoundingClientRect();
      const rawPx = e.clientX - rect.left;
      const day = pxToDay(rawPx, trackWidth, TIMELINE_DAYS_AHEAD);

      if (dragging === "pickup") {
        const clamped = Math.min(day, returnDay - MIN_GAP_DAYS);
        setPickupDay(Math.max(0, clamped));
      } else {
        const clamped = Math.max(day, pickupDay + MIN_GAP_DAYS);
        setReturnDay(Math.min(TIMELINE_DAYS_AHEAD, clamped));
      }
    },
    [dragging, trackWidth, pickupDay, returnDay]
  );

  const handlePointerUp = useCallback(() => setDragging(null), []);

  const pickupDate = addDays(today, pickupDay);
  const returnDate = addDays(today, returnDay);
  const totalDays = returnDay - pickupDay;

  // ── Thumb sizes (responsive) ─────────────────────────────
  const thumbSize =
    typeof window !== "undefined" && window.innerWidth < 768
      ? THUMB_SIZE_MOBILE
      : THUMB_SIZE_DESKTOP;

  const thumbHalfSize = thumbSize / 2;

  return (
    <div className="flex flex-col gap-5 w-full select-none touch-none">
      {/* ── Summary pill ──────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] uppercase tracking-widest text-brand-muted font-medium">
            Recogida
          </span>
          <span className="text-sm font-bold text-brand-dark">
            {format(pickupDate, "EEE d MMM", { locale: es })}
          </span>
        </div>

        <div className="flex flex-col items-center gap-0.5">
          <div className="px-3 py-1 rounded-full bg-brand-primary/10 border border-brand-primary/20">
            <span className="text-xs font-bold text-brand-primary">
              {totalDays} {totalDays === 1 ? "día" : "días"}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-0.5">
          <span className="text-[10px] uppercase tracking-widest text-brand-muted font-medium">
            Devolución
          </span>
          <span className="text-sm font-bold text-brand-dark">
            {format(returnDate, "EEE d MMM", { locale: es })}
          </span>
        </div>
      </div>

      {/* ── Track area ────────────────────────────────────── */}
      <div
        ref={trackRef}
        className="relative w-full"
        style={{ height: thumbSize + TOOLTIP_OFFSET + 16 }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* Base track */}
        <div
          className="absolute rounded-full bg-slate-200"
          style={{
            top: TOOLTIP_OFFSET + thumbHalfSize - TRACK_HEIGHT / 2,
            left: thumbHalfSize,
            right: thumbHalfSize,
            height: TRACK_HEIGHT,
          }}
        />

        {/* Active range highlight */}
        {trackWidth > 0 && (
          <motion.div
            className="absolute rounded-full bg-brand-primary/20"
            style={{
              top: TOOLTIP_OFFSET + thumbHalfSize - TRACK_HEIGHT / 2,
              height: TRACK_HEIGHT,
              left: dayToPx(pickupDay, trackWidth, TIMELINE_DAYS_AHEAD) + thumbHalfSize,
              width:
                dayToPx(returnDay - pickupDay, trackWidth, TIMELINE_DAYS_AHEAD),
            }}
          />
        )}

        {/* ── PICKUP THUMB ──────────────────────────────── */}
        <motion.div
          className="absolute"
          style={{
            x: pickupX,
            top: TOOLTIP_OFFSET,
            cursor: dragging === "pickup" ? "grabbing" : "grab",
          }}
          onPointerDown={handlePointerDown("pickup")}
        >
          {/* Tooltip */}
          <div
            className="absolute -top-1 left-1/2 -translate-x-1/2 flex flex-col items-center"
            style={{ bottom: thumbSize + 4, top: "auto" }}
          >
            <DayLabel date={pickupDate} isAccent />
            <div className="w-px h-3 bg-brand-primary/40" />
          </div>

          {/* Thumb circle */}
          <motion.div
            className="rounded-full border-2 border-brand-primary bg-white shadow-lg flex items-center justify-center"
            style={{ width: thumbSize, height: thumbSize }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            animate={
              dragging === "pickup"
                ? { scale: 1.12, boxShadow: "0 8px 24px rgba(37,99,235,0.3)" }
                : { scale: 1, boxShadow: "0 4px 12px rgba(0,0,0,0.12)" }
            }
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <div className="w-2 h-2 rounded-full bg-brand-primary" />
          </motion.div>
        </motion.div>

        {/* ── RETURN THUMB ──────────────────────────────── */}
        <motion.div
          className="absolute"
          style={{
            x: returnX,
            top: TOOLTIP_OFFSET,
            cursor: dragging === "return" ? "grabbing" : "grab",
          }}
          onPointerDown={handlePointerDown("return")}
        >
          {/* Tooltip */}
          <div className="absolute flex flex-col items-center" style={{ bottom: thumbSize + 4, top: "auto" }}>
            <DayLabel date={returnDate} isAccent={false} />
            <div className="w-px h-3 bg-slate-400/40" />
          </div>

          {/* Thumb circle */}
          <motion.div
            className="rounded-full border-2 border-slate-400 bg-white shadow-lg flex items-center justify-center"
            style={{ width: thumbSize, height: thumbSize }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            animate={
              dragging === "return"
                ? { scale: 1.12, boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }
                : { scale: 1, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }
            }
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <div className="w-2 h-2 rounded-full bg-slate-400" />
          </motion.div>
        </motion.div>

        {/* ── Day markers (every 7 days) ─────────────────── */}
        {trackWidth > 0 &&
          [7, 14, 21].map((d) => {
            const markerPx = dayToPx(d, trackWidth, TIMELINE_DAYS_AHEAD) + thumbHalfSize;
            const isInRange = d > pickupDay && d < returnDay;
            return (
              <div
                key={d}
                className="absolute pointer-events-none"
                style={{
                  left: markerPx,
                  top: TOOLTIP_OFFSET + thumbHalfSize - 8,
                }}
              >
                <div
                  className="w-px h-4 rounded-full"
                  style={{
                    background: isInRange
                      ? "rgba(37,99,235,0.35)"
                      : "rgba(148,163,184,0.5)",
                  }}
                />
                <span
                  className="absolute top-5 -translate-x-1/2 text-[9px] font-medium"
                  style={{ color: isInRange ? "#2563EB" : "#94A3B8" }}
                >
                  +{d}d
                </span>
              </div>
            );
          })}
      </div>

      {/* ── Quick-select pills ─────────────────────────── */}
      <div className="flex gap-2 flex-wrap">
        {[
          { label: "3 días", days: 3 },
          { label: "1 semana", days: 7 },
          { label: "10 días", days: 10 },
          { label: "2 semanas", days: 14 },
        ].map(({ label, days }) => {
          const isActive = totalDays === days;
          return (
            <button
              key={label}
              type="button"
              onClick={() => {
                setPickupDay(pickupDay);
                setReturnDay(Math.min(pickupDay + days, TIMELINE_DAYS_AHEAD));
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all min-h-[32px] ${
                isActive
                  ? "bg-brand-primary text-white border-brand-primary"
                  : "bg-white text-brand-muted border-slate-200 hover:border-brand-primary hover:text-brand-primary"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
