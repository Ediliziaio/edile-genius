import { useState, useEffect, useCallback, useRef, useMemo } from "react";

interface UseVirtualGridOptions {
  totalItems: number;
  rowHeight: number;
  overscan?: number;
}

interface UseVirtualGridResult {
  containerRef: React.RefObject<HTMLDivElement>;
  virtualItems: { index: number; offsetTop: number }[];
  totalHeight: number;
  columns: number;
}

/**
 * Lightweight virtual grid hook.
 * Calculates which rows to render based on scroll position.
 * Works with CSS Grid — no absolute positioning needed.
 */
export function useVirtualGrid({
  totalItems,
  rowHeight,
  overscan = 3,
}: UseVirtualGridOptions): UseVirtualGridResult {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(800);
  const [columns, setColumns] = useState(3);

  // Detect columns from grid container
  const detectColumns = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const style = getComputedStyle(el);
    const cols = style.gridTemplateColumns.split(" ").length;
    if (cols > 0 && cols !== columns) setColumns(cols);
  }, [columns]);

  // Scroll handler on window (since galleries are in page flow)
  useEffect(() => {
    const onScroll = () => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      // scrollTop relative to the grid container top
      setScrollTop(-rect.top);
      setViewportHeight(window.innerHeight);
    };

    const onResize = () => {
      detectColumns();
      onScroll();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    // Initial
    const raf = requestAnimationFrame(() => {
      detectColumns();
      onScroll();
    });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
    };
  }, [detectColumns]);

  // Re-detect columns when totalItems changes (grid might re-layout)
  useEffect(() => {
    const raf = requestAnimationFrame(detectColumns);
    return () => cancelAnimationFrame(raf);
  }, [totalItems, detectColumns]);

  const totalRows = Math.ceil(totalItems / columns);
  const totalHeight = totalRows * rowHeight;

  const virtualItems = useMemo(() => {
    const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
    const endRow = Math.min(
      totalRows - 1,
      Math.ceil((scrollTop + viewportHeight) / rowHeight) + overscan
    );

    const items: { index: number; offsetTop: number }[] = [];
    for (let row = startRow; row <= endRow; row++) {
      for (let col = 0; col < columns; col++) {
        const index = row * columns + col;
        if (index < totalItems) {
          items.push({ index, offsetTop: row * rowHeight });
        }
      }
    }
    return items;
  }, [scrollTop, viewportHeight, rowHeight, overscan, totalRows, columns, totalItems]);

  return { containerRef, virtualItems, totalHeight, columns };
}
