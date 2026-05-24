"use client";

import { useRef, useState, useEffect } from "react";

export default function SignaturePad({ onSave, onClear }) {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const lastPos = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.strokeStyle = "#1A3A32";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    if (e.touches) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    setDrawing(true);
    setHasSignature(true);
    lastPos.current = getPos(e, canvas);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!drawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;
  };

  const stopDrawing = (e) => {
    e.preventDefault();
    setDrawing(false);
    lastPos.current = null;
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onClear?.();
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) return;
    const dataUrl = canvas.toDataURL("image/png");
    onSave?.(dataUrl);
  };

  return (
    <div className="space-y-3">
      <div className="relative rounded-[12px] border-2 border-dashed border-[#E8EDE9] bg-white overflow-hidden"
        style={{ height: "160px" }}>
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full touch-none cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {!hasSignature && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <p className="text-sm text-[#C5D4CC]">Sign here</p>
          </div>
        )}
        <div className="pointer-events-none absolute bottom-2 left-4 right-4 border-t border-[#E8EDE9]" />
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleClear}
          className="flex-1 min-h-[44px] rounded-[10px] border border-[#E8EDE9] bg-white text-sm font-semibold uppercase tracking-[0.14em] text-[#4A5568] hover:bg-[#F4F9F7] transition-colors"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!hasSignature}
          className="flex-1 min-h-[44px] rounded-[10px] bg-[#2A6B52] text-sm font-semibold uppercase tracking-[0.14em] text-white hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Accept & Sign
        </button>
      </div>
    </div>
  );
}
