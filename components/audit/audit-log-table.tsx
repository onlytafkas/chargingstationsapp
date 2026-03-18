"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getAllAuditLogs } from "@/data/audit";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type AuditLog = Awaited<ReturnType<typeof getAllAuditLogs>>[number];

interface AuditLogTableProps {
  logs: AuditLog[];
  userEmails: Map<string, string>;
}

function StatusBadge({ status }: { status: string }) {
  const classes: Record<string, string> = {
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    unauthorized: "bg-red-500/10 text-red-400 border-red-500/20",
    forbidden: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    not_found: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    validation_error: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    error: "bg-red-500/10 text-red-400 border-red-500/20",
    confirmation_required: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  };
  const cls = classes[status] ?? "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${cls}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

function truncate(val: string | null | undefined, len = 20) {
  if (!val) return "—";
  return val.length > len ? `${val.slice(0, len)}…` : val;
}

const COLUMNS = [
  { label: "Time",      defaultWidth: 160, hidden: false },
  { label: "Action",   defaultWidth: 200, hidden: false },
  { label: "Entity",   defaultWidth: 100, hidden: false },
  { label: "Entity ID",defaultWidth: 100, hidden: false },
  { label: "Actor",    defaultWidth: 160, hidden: false },
  { label: "Email",    defaultWidth: 200, hidden: false },
  { label: "Status",   defaultWidth: 120, hidden: false },
  { label: "Error",    defaultWidth: 200, hidden: false },
  { label: "IP",       defaultWidth: 100, hidden: true  },
];

const MIN_COL_WIDTH = 60;

export function AuditLogTable({ logs, userEmails }: AuditLogTableProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [colWidths, setColWidths] = useState<number[]>(COLUMNS.map((c) => c.defaultWidth));
  const resizingRef = useRef<{ colIndex: number; startX: number; startWidth: number } | null>(null);

  const updateScrollButtons = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => updateScrollButtons());
    observer.observe(el);
    return () => observer.disconnect();
  }, [updateScrollButtons]);

  const scrollBy = useCallback((amount: number) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.scrollBy({ left: amount, behavior: "smooth" });
  }, []);

  const startResize = useCallback((e: React.MouseEvent, colIndex: number) => {
    e.preventDefault();
    resizingRef.current = { colIndex, startX: e.clientX, startWidth: colWidths[colIndex] };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, [colWidths]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizingRef.current) return;
      const { colIndex, startX, startWidth } = resizingRef.current;
      const newWidth = Math.max(MIN_COL_WIDTH, startWidth + (e.clientX - startX));
      setColWidths((prev) => {
        const next = [...prev];
        next[colIndex] = newWidth;
        return next;
      });
    };
    const handleMouseUp = () => {
      if (!resizingRef.current) return;
      resizingRef.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  if (logs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-400 text-lg">No audit log entries yet.</p>
      </div>
    );
  }

  return (
    <div className="relative rounded-lg border border-zinc-800">
      {/* Left arrow */}
      <button
        onClick={() => scrollBy(-300)}
        className={`absolute left-1 top-1/2 -translate-y-1/2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 shadow-md hover:bg-zinc-700 transition-opacity ${!canScrollLeft ? "opacity-0 pointer-events-none" : "opacity-100"}`}
        aria-label="Scroll left"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {/* Right arrow */}
      <button
        onClick={() => scrollBy(300)}
        className={`absolute right-1 top-1/2 -translate-y-1/2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 shadow-md hover:bg-zinc-700 transition-opacity ${!canScrollRight ? "opacity-0 pointer-events-none" : "opacity-100"}`}
        aria-label="Scroll right"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      <div
        ref={scrollContainerRef}
        onScroll={updateScrollButtons}
        className="overflow-x-hidden rounded-lg [&_[data-slot='table-container']]:overflow-x-visible"
      >
        <Table className="table-fixed">
          <colgroup>
            {colWidths.map((w, i) => (
              <col key={i} style={{ width: `${w}px` }} />
            ))}
          </colgroup>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-transparent">
              {COLUMNS.map((col, i) => (
                <TableHead
                  key={col.label}
                  className={`text-zinc-400 relative select-none${col.hidden ? " hidden lg:table-cell" : ""}`}
                >
                  {col.label}
                  {/* Resize handle */}
                  <div
                    className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-zinc-600 active:bg-zinc-400"
                    onMouseDown={(e) => startResize(e, i)}
                  />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow
                key={log.id}
                className="border-zinc-800 hover:bg-zinc-900/50"
              >
                <TableCell className="text-zinc-400 text-xs overflow-hidden text-ellipsis whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleString(undefined, {
                    dateStyle: "short",
                    timeStyle: "medium",
                  })}
                </TableCell>
                <TableCell className="font-mono text-xs text-zinc-300 overflow-hidden text-ellipsis whitespace-nowrap">
                  {log.action}
                </TableCell>
                <TableCell className="text-zinc-400 capitalize text-sm overflow-hidden text-ellipsis whitespace-nowrap">
                  {log.entityType}
                </TableCell>
                <TableCell className="font-mono text-xs text-zinc-500 overflow-hidden text-ellipsis whitespace-nowrap">
                  {log.entityId ?? "—"}
                </TableCell>
                <TableCell
                  className="font-mono text-xs text-zinc-500 overflow-hidden text-ellipsis whitespace-nowrap"
                  title={log.performedByUserId ?? "unauthenticated"}
                >
                  {truncate(log.performedByUserId, 18)}
                </TableCell>
                <TableCell className="text-xs text-zinc-400 overflow-hidden text-ellipsis whitespace-nowrap">
                  {log.performedByUserId
                    ? (userEmails.get(log.performedByUserId) ?? "—")
                    : "unauthenticated"}
                </TableCell>
                <TableCell>
                  <StatusBadge status={log.status} />
                </TableCell>
                <TableCell
                  className="text-xs text-zinc-500 overflow-hidden text-ellipsis whitespace-nowrap"
                  title={log.errorMessage ?? ""}
                >
                  {log.errorMessage ?? "—"}
                </TableCell>
                <TableCell className="text-xs text-zinc-600 hidden lg:table-cell overflow-hidden text-ellipsis whitespace-nowrap">
                  {log.ipAddress ?? "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
