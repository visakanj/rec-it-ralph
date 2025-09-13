import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { db } from "@/lib/db";
import { collection, deleteDoc, doc, serverTimestamp, writeBatch } from "firebase/firestore";
import WhereToWatch from "./WhereToWatch";
import { detectSequel } from "@/lib/series";
import seriesMap from "@/data/seriesMap.json";
import { RoomState, PoolMovie } from "@/types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  room: RoomState;
  pool: PoolMovie[];
  onAfterAccept?: () => void;
  currentUserName?: string;
}

function useFocusTrap(active: boolean) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!active || !ref.current) return;
    const root = ref.current;
    const sel = 'a,button,input,select,textarea,[tabindex]:not([tabindex="-1"])';
    const nodes = Array.from(root.querySelectorAll<HTMLElement>(sel));
    const first = nodes[0], last = nodes[nodes.length - 1];
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Tab" && nodes.length) {
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
      if (e.key === "Escape") (root as any)?.dataset?.close && (root as any).dataset.close();
    };
    document.addEventListener("keydown", onKey);
    (first || root).focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [active]);
  return ref;
}

export default function RandomSuggestModal({
  isOpen,
  onClose,
  room,
  pool,
  onAfterAccept,
  currentUserName
}: Props) {
  const [picked, setPicked] = useState<PoolMovie | null>(null);
  const [displayTitle, setDisplayTitle] = useState<string>("");
  const [swappedFrom, setSwappedFrom] = useState<string | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);

  // Prevent body scroll while open
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  const trapRef = useFocusTrap(isOpen);

  // Pick a random movie from the (non-empty) pool
  const randomize = () => {
    if (!pool?.length) {
      setPicked(null);
      return;
    }
    const idx = Math.floor(Math.random() * pool.length);
    setPicked(pool[idx]);
  };

  // Open → pick once
  useEffect(() => {
    if (isOpen) {
      randomize();
    } else {
      setPicked(null);
      setDisplayTitle("");
      setSwappedFrom(null);
      setIsAccepting(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Apply sequel guard (if available)
  useEffect(() => {
    if (!picked) return;
    
    const t = picked.title;
    try {
      const res = detectSequel(t, seriesMap as any);
      if (res?.isSequel && res.firstTitle && res.firstTitle.toLowerCase() !== t.toLowerCase()) {
        setDisplayTitle(res.firstTitle);
        setSwappedFrom(t);
      } else {
        setDisplayTitle(t);
        setSwappedFrom(null);
      }
    } catch {
      setDisplayTitle(t);
      setSwappedFrom(null);
    }
  }, [picked]);

  const close = () => onClose();

  const onReroll = () => {
    if (isAccepting) return;
    randomize();
  };

  const onAccept = async () => {
    if (!picked || isAccepting) return;
    
    setIsAccepting(true);
    
    try {
      const roomCode = room.roomId || room.roomCode || room.theme;
      const batch = writeBatch(db);
      
      // Add to watched collection
      const watchedRef = doc(collection(db, "rooms", roomCode, "watched"));
      batch.set(watchedRef, {
        title: displayTitle || picked.title,
        posterUrl: picked.posterUrl || null,
        watchedAt: serverTimestamp(),
        acceptedBy: currentUserName || null,
      });
      
      // Delete from pool collection (use original id)
      const poolRef = doc(db, "rooms", roomCode, "pool", picked.id);
      batch.delete(poolRef);

      await batch.commit();
      
      onAfterAccept?.();
      close();
    } catch (error) {
      console.error("Error accepting movie:", error);
      setIsAccepting(false);
    }
  };

  if (!isOpen) return null;

  const node = (
    <div className="fixed inset-0 z-[1000]">
      {/* Backdrop must be opaque; do NOT use parent opacity */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        onClick={close}
      />
      {/* Centering layer */}
      <div className="fixed inset-0 grid place-items-center px-4">
        {/* Dialog surface */}
        <div
          ref={trapRef as any}
          role="dialog"
          aria-modal="true"
          className="w-full max-w-4xl bg-[#1a1a1a] text-white rounded-2xl shadow-2xl outline-none overflow-hidden"
          // small trick to let ESC handler above close from focus trap
          data-close={close}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <h2 className="text-lg font-bold">Suggestion</h2>
            <button
              onClick={close}
              className="px-3 py-1.5 rounded-lg border border-white/20 hover:bg-white/10 focus:ring-2 focus:ring-red-600"
            >
              Close
            </button>
          </div>

          {/* Content (scrolls inside, not window) */}
          <div className="max-h-[82vh] overflow-y-auto">
            {picked ? (
              <div className="p-5">
                <div className="grid gap-5 md:grid-cols-[220px_1fr]">
                  {/* Left: fixed poster */}
                  <div className="md:sticky md:top-5">
                    <div className="w-full aspect-[2/3] rounded-lg overflow-hidden bg-[#222]">
                      {picked.posterUrl ? (
                        <img 
                          src={picked.posterUrl} 
                          alt={picked.title}
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="w-full h-full grid place-items-center text-neutral-300 text-sm p-3 text-center">
                          {picked.title}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Title → chips → WhereToWatch → Actions */}
                  <div className="min-w-0">
                    <h3 className="text-2xl font-extrabold leading-snug">
                      {displayTitle || picked.title}
                    </h3>
                    
                    {swappedFrom && (
                      <div className="mt-1 text-xs text-amber-300">
                        Looks like a sequel ("{swappedFrom}"). Suggesting the first in the series.
                      </div>
                    )}

                    {/* Contributor chips */}
                    {picked.contributors?.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {picked.contributors.map((name) => (
                          <span
                            key={name}
                            className="text-[11px] uppercase tracking-wide bg-white/90 text-black px-2 py-0.5 rounded"
                          >
                            {name}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    {/* Where to watch */}
                    <div className="mt-4">
                      <WhereToWatch 
                        title={displayTitle || picked.title} 
                        region={room.region || "US"} 
                      />
                    </div>

                    <div className="pt-4 mt-6 border-t border-white/10 flex gap-2 flex-wrap">
                      <button
                        onClick={onAccept}
                        disabled={isAccepting}
                        className="bg-[#E50914] hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold focus:ring-2 focus:ring-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isAccepting ? "Adding to Watched..." : "Watch Now"}
                      </button>
                      <button
                        onClick={onReroll}
                        disabled={isAccepting}
                        className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg focus:ring-2 focus:ring-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Re-roll
                      </button>
                      <button
                        onClick={close}
                        disabled={isAccepting}
                        className="border border-white/30 hover:bg-white/10 px-4 py-2 rounded-lg focus:ring-2 focus:ring-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 text-neutral-300">
                No movies available in the pool.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}