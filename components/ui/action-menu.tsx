"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MoreVertical } from "lucide-react";

type ActionMenuItem =
  | { separator: true }
  | {
      separator?: false;
      label: string;
      onClick: () => void;
      variant?: "default" | "danger";
      disabled?: boolean;
    };

interface ActionMenuProps {
  items: ActionMenuItem[];
}

export function ActionMenu({ items }: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, right: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function handleOpen(e: React.MouseEvent) {
    e.stopPropagation();
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    }
    setOpen((v) => !v);
  }

  return (
    <div className="inline-block">
      <button
        ref={btnRef}
        onClick={handleOpen}
        className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        title="Acciones"
      >
        <MoreVertical size={15} />
      </button>

      {open && typeof document !== "undefined" && createPortal(
        <div
          ref={menuRef}
          style={{ position: "fixed", top: pos.top, right: pos.right, zIndex: 9999 }}
          className="w-44 bg-white border border-gray-200 rounded-lg shadow-lg py-1 text-sm"
        >
          {items.map((item, i) =>
            item.separator ? (
              <div key={i} className="my-1 border-t border-gray-100" />
            ) : (
              <button
                key={i}
                disabled={item.disabled}
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                  item.onClick();
                }}
                className={`w-full text-left px-4 py-2 transition-colors ${
                  item.disabled
                    ? "text-gray-300 cursor-not-allowed"
                    : item.variant === "danger"
                    ? "text-red-500 hover:bg-red-50"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {item.label}
              </button>
            )
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
