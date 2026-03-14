import { ReactNode } from "react";
import { useVirtualGrid } from "@/hooks/useVirtualGrid";

interface VirtualGalleryGridProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  /** Row height in px (including gap). Default 280 */
  rowHeight?: number;
  /** Rows to render outside viewport. Default 3 */
  overscan?: number;
  /** CSS grid class. Default "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4" */
  gridClassName?: string;
  /** Min items to activate virtualization. Below this, render normally. Default 20 */
  threshold?: number;
}

/**
 * Drop-in virtual scrolling grid for image galleries.
 * Below `threshold` items, renders all items normally (no virtualization overhead).
 */
export function VirtualGalleryGrid<T>({
  items,
  renderItem,
  rowHeight = 280,
  overscan = 3,
  gridClassName = "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4",
  threshold = 20,
}: VirtualGalleryGridProps<T>) {
  if (items.length < threshold) {
    return (
      <div className={gridClassName}>
        {items.map((item, i) => renderItem(item, i))}
      </div>
    );
  }

  return (
    <VirtualizedInner
      items={items}
      renderItem={renderItem}
      rowHeight={rowHeight}
      overscan={overscan}
      gridClassName={gridClassName}
    />
  );
}

function VirtualizedInner<T>({
  items,
  renderItem,
  rowHeight,
  overscan,
  gridClassName,
}: {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  rowHeight: number;
  overscan: number;
  gridClassName: string;
}) {
  const { containerRef, virtualItems, totalHeight, columns } = useVirtualGrid({
    totalItems: items.length,
    rowHeight,
    overscan,
  });

  const firstRow = virtualItems.length > 0 ? Math.floor(virtualItems[0].index / columns) : 0;
  const lastRow = virtualItems.length > 0 ? Math.floor(virtualItems[virtualItems.length - 1].index / columns) : 0;
  const totalRows = Math.ceil(items.length / columns);
  const topSpacer = firstRow * rowHeight;
  const bottomSpacer = Math.max(0, (totalRows - lastRow - 1) * rowHeight);

  return (
    <div>
      {topSpacer > 0 && <div style={{ height: topSpacer }} aria-hidden />}
      <div ref={containerRef as any} className={gridClassName}>
        {virtualItems.map((vi) => (
          <div key={vi.index}>{renderItem(items[vi.index], vi.index)}</div>
        ))}
      </div>
      {bottomSpacer > 0 && <div style={{ height: bottomSpacer }} aria-hidden />}
    </div>
  );
}
