import { useState, useRef, useCallback, useLayoutEffect } from "react";
import { createPortal } from "react-dom";

interface TooltipProps {
  text: string;
  children: React.ReactNode;
}

export default function Tooltip({ text, children }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLSpanElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setCoords({
      top: rect.top + window.scrollY,
      left: rect.left + rect.width / 2,
    });
  }, []);

  useLayoutEffect(() => {
    if (visible) updatePosition();
  }, [visible, updatePosition]);

  const show = () => {
    timeoutRef.current = setTimeout(() => setVisible(true), 300);
  };

  const hide = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(false);
  };

  return (
    <>
      <span ref={triggerRef} className="inline-flex" onMouseEnter={show} onMouseLeave={hide}>
        {children}
      </span>
      {visible &&
        createPortal(
          <div
            style={{
              position: "absolute",
              top: coords.top - 8,
              left: coords.left,
              transform: "translate(-50%, -100%)",
              zIndex: 9999,
            }}
            className="w-64 rounded-lg bg-gray-900 px-3 py-2 text-xs font-normal normal-case tracking-normal text-white shadow-lg"
          >
            {text}
            <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
          </div>,
          document.body
        )}
    </>
  );
}
