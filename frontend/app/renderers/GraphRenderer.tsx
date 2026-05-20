"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Latex from "../components/ui/Latex";
import { GraphContent, RendererProps } from "../types/exercise";
import { evaluate, toMathJsSyntax } from "../utils/math/evaluation";
import { substituteVariables } from "../utils/math/parsing";
import { simplifyLatexExpression } from "../utils/math/simplication";

// Rapport hauteur / largeur du graphe (paysage mathématique standard)
const ASPECT = 2 / 3;

const GraphRenderer: React.FC<RendererProps<GraphContent>> = ({
  content,
  variables,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const staticRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const [hoverX, setHoverX] = useState<number | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);


  /** Résout une borne qui peut être un nombre ou une expression avec variables. */
  const resolveBound = useCallback(
    (val: number | string): number => {
      if (typeof val === "number") return val;
      const result = evaluate(toMathJsSyntax(val), variables ?? {});
      return isFinite(result) ? result : 0;
    },
    [variables],
  );

  // ─── ResizeObserver : suit la largeur du conteneur ────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateWidth = () => {
      const w = container.getBoundingClientRect().width;
      if (w > 0) setContainerWidth(w);
    };

    const ro = new ResizeObserver(updateWidth);
    ro.observe(container);
    updateWidth();
    return () => ro.disconnect();
  }, []);

  // ─── Dessin statique (fond + grille + axes + courbes) ─────────────────────
  useEffect(() => {
    const sc = staticRef.current;
    const oc = overlayRef.current;
    if (!sc || !oc || !containerWidth) return;
    const ctx = sc.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const cssW = Math.floor(containerWidth);
    const cssH = Math.round(cssW * ASPECT);

    // Redimensionne les deux canvas (DPR-aware)
    for (const c of [sc, oc]) {
      c.width = Math.round(cssW * dpr);
      c.height = Math.round(cssH * dpr);
      c.style.width = `${cssW}px`;
      c.style.height = `${cssH}px`;
    }

    const xMin = resolveBound(content.xMin);
    const xMax = resolveBound(content.xMax);
    const yMin = resolveBound(content.yMin);
    const yMax = resolveBound(content.yMax);

    // Garde-fou : bornes invalides → ne rien dessiner
    if (xMax <= xMin || yMax <= yMin) return;

    const { showGrid, functions } = content;

    ctx.save();
    ctx.scale(dpr, dpr);

    const scaleX = cssW / (xMax - xMin);
    const scaleY = cssH / (yMax - yMin);
    const toX = (x: number) => (x - xMin) * scaleX;
    const toY = (y: number) => cssH - (y - yMin) * scaleY;

    // ── Fond ──────────────────────────────────────────────────────────────
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, cssW, cssH);

    // ── Grille ────────────────────────────────────────────────────────────
    if (showGrid) {
      ctx.strokeStyle = "#f0f0f0";
      ctx.lineWidth = 1;
      for (let x = Math.ceil(xMin); x <= xMax; x++) {
        ctx.beginPath();
        ctx.moveTo(toX(x), 0);
        ctx.lineTo(toX(x), cssH);
        ctx.stroke();
      }
      for (let y = Math.ceil(yMin); y <= yMax; y++) {
        ctx.beginPath();
        ctx.moveTo(0, toY(y));
        ctx.lineTo(cssW, toY(y));
        ctx.stroke();
      }
    }

    const yZero = toY(0);
    const xZero = toX(0);
    const ARROW = 8; // longueur des flèches (px)

    // ── Axes ──────────────────────────────────────────────────────────────
    ctx.strokeStyle = "#374151";
    ctx.fillStyle = "#374151";
    ctx.lineWidth = 1.5;

    // Axe X
    if (yZero >= 0 && yZero <= cssH) {
      ctx.beginPath();
      ctx.moveTo(0, yZero);
      ctx.lineTo(cssW - ARROW, yZero);
      ctx.stroke();
      // Flèche droite
      ctx.beginPath();
      ctx.moveTo(cssW, yZero);
      ctx.lineTo(cssW - ARROW, yZero - ARROW / 2);
      ctx.lineTo(cssW - ARROW, yZero + ARROW / 2);
      ctx.closePath();
      ctx.fill();
    }

    // Axe Y
    if (xZero >= 0 && xZero <= cssW) {
      ctx.beginPath();
      ctx.moveTo(xZero, cssH);
      ctx.lineTo(xZero, ARROW);
      ctx.stroke();
      // Flèche haute
      ctx.beginPath();
      ctx.moveTo(xZero, 0);
      ctx.lineTo(xZero - ARROW / 2, ARROW);
      ctx.lineTo(xZero + ARROW / 2, ARROW);
      ctx.closePath();
      ctx.fill();
    }

    // ── Labels des axes ───────────────────────────────────────────────────
    ctx.font = "11px sans-serif";
    ctx.fillStyle = "#6b7280";
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = "#9ca3af";

    // Graduations X
    if (yZero >= 0 && yZero <= cssH) {
      ctx.textAlign = "center";
      // Baseline : au-dessus si l'axe est en bas, en dessous sinon
      const labelBelow = yZero < cssH * 0.85;
      ctx.textBaseline = labelBelow ? "top" : "bottom";
      const labelOffsetY = labelBelow ? 5 : -5;

      for (let x = Math.ceil(xMin); x <= xMax; x++) {
        if (x === 0) continue;
        const cx = toX(x);
        if (cx < 4 || cx > cssW - 4) continue;
        ctx.strokeStyle = "#9ca3af";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx, yZero - 4);
        ctx.lineTo(cx, yZero + 4);
        ctx.stroke();
        ctx.fillStyle = "#6b7280";
        ctx.fillText(x.toString(), cx, yZero + labelOffsetY);
      }
    }

    // Graduations Y
    if (xZero >= 0 && xZero <= cssW) {
      const labelRight = xZero > cssW * 0.15;
      ctx.textAlign = labelRight ? "right" : "left";
      ctx.textBaseline = "middle";
      const labelOffsetX = labelRight ? -6 : 6;

      for (let y = Math.ceil(yMin); y <= yMax; y++) {
        if (y === 0) continue;
        const cy = toY(y);
        if (cy < 4 || cy > cssH - 4) continue;
        ctx.strokeStyle = "#9ca3af";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(xZero - 4, cy);
        ctx.lineTo(xZero + 4, cy);
        ctx.stroke();
        ctx.fillStyle = "#6b7280";
        ctx.fillText(y.toString(), xZero + labelOffsetX, cy);
      }

      // Origine "O" si les deux axes sont visibles
      if (yZero >= 0 && yZero <= cssH) {
        ctx.textAlign = labelRight ? "right" : "left";
        ctx.textBaseline = "top";
        ctx.fillStyle = "#6b7280";
        ctx.fillText("O", xZero + labelOffsetX, yZero + 4);
      }
    }

    // ── Courbes ───────────────────────────────────────────────────────────
    // Marge verticale pour éviter les artefacts de clipping
    const yMargin = (yMax - yMin) * 0.5;

    functions?.forEach((fn) => {
      const mathJsExpr = toMathJsSyntax(
        substituteVariables(fn.expression, variables ?? {}),
      );
      ctx.strokeStyle = fn.color || "#3b82f6";
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      let started = false;
      let prevY: number | null = null;

      for (let px = 0; px <= cssW; px++) {
        const x = xMin + px / scaleX;
        const y = evaluate(mathJsExpr, { x });
        const valid = typeof y === "number" && !isNaN(y) && isFinite(y);
        const inBounds = valid && y >= yMin - yMargin && y <= yMax + yMargin;

        if (inBounds) {
          // Détecte les discontinuités verticales (saut > 1/3 de la fenêtre)
          const jump =
            prevY !== null && Math.abs(y - prevY) > (yMax - yMin) * 0.33;
          if (!started || jump) {
            ctx.moveTo(toX(x), toY(y));
            started = true;
          } else {
            ctx.lineTo(toX(x), toY(y));
          }
          prevY = y;
        } else {
          started = false;
          prevY = null;
        }
      }
      ctx.stroke();
    });

    ctx.restore();
  }, [containerWidth, content, variables, resolveBound]);

  // ─── Overlay interactif (curseur + bulles) ────────────────────────────────
  useEffect(() => {
    const canvas = overlayRef.current;
    if (!canvas || !containerWidth) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (hoverX === null) return;

    const cssW = canvas.width / dpr;
    const cssH = canvas.height / dpr;
    const xMin = resolveBound(content.xMin);
    const xMax = resolveBound(content.xMax);
    const yMin = resolveBound(content.yMin);
    const yMax = resolveBound(content.yMax);
    if (xMax <= xMin || yMax <= yMin) return;

    const scaleX = cssW / (xMax - xMin);
    const scaleY = cssH / (yMax - yMin);
    const toX = (x: number) => (x - xMin) * scaleX;
    const toY = (y: number) => cssH - (y - yMin) * scaleY;

    ctx.save();
    ctx.scale(dpr, dpr);

    const cx = toX(hoverX);

    // Ligne verticale en pointillés
    ctx.strokeStyle = "rgba(107,114,128,0.4)";
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, cssH);
    ctx.stroke();
    ctx.setLineDash([]);

    content.functions?.forEach((fn) => {
      const mathJsExpr = toMathJsSyntax(
        substituteVariables(fn.expression, variables ?? {}),
      );
      const y = evaluate(mathJsExpr, { x: hoverX });
      if (typeof y !== "number" || isNaN(y) || !isFinite(y)) return;
      const cy = toY(y);
      if (cy < -10 || cy > cssH + 10) return;

      const color = fn.color || "#3b82f6";

      // Point : cercle blanc + anneau couleur + centre
      ctx.beginPath();
      ctx.arc(cx, cy, 7, 0, Math.PI * 2);
      ctx.fillStyle = "white";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx, cy, 7, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // Bulle de coordonnées
      const fmt = (v: number) =>
        Number.isInteger(v) ? v.toFixed(0) : v.toFixed(2);
      const label = `(${fmt(hoverX)} ; ${fmt(y)})`;
      ctx.font = "bold 12px sans-serif";
      const tw = ctx.measureText(label).width;
      const pad = 7;
      const bw = tw + pad * 2;
      const bh = 24;
      let bx = cx + 14;
      let by = cy - bh / 2;
      if (bx + bw > cssW - 4) bx = cx - bw - 14;
      if (by < 4) by = 4;
      if (by + bh > cssH - 4) by = cssH - bh - 4;

      ctx.shadowColor = "rgba(0,0,0,0.18)";
      ctx.shadowBlur = 6;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(bx, by, bw, bh, 5);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#fff";
      ctx.textBaseline = "middle";
      ctx.textAlign = "left";
      ctx.fillText(label, bx + pad, by + bh / 2);
    });

    ctx.restore();
  }, [hoverX, containerWidth, content, variables, resolveBound]);

  // ─── Gestion souris ───────────────────────────────────────────────────────
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const xNorm = (e.clientX - rect.left) / rect.width;
      const xMin = resolveBound(content.xMin);
      const xMax = resolveBound(content.xMax);
      setHoverX(xMin + xNorm * (xMax - xMin));
    },
    [content, resolveBound],
  );

  const handleMouseLeave = useCallback(() => setHoverX(null), []);

  // ── Légende : seules les fonctions avec showExpression !== false ──────────
  const visibleFunctions =
    content.functions?.filter((fn) => fn.showExpression !== false) ?? [];

  const showLegend = visibleFunctions.length > 0;

  return (
    <div className="p-5 bg-white rounded-2xl shadow-sm border border-gray-100">
      <div className="max-w-lg mx-auto">
        {/* Canvas — rapport d'aspect fixe via padding-bottom */}
        <div
          ref={containerRef}
          className="relative overflow-hidden rounded-xl border border-gray-200 bg-white"
          style={{ paddingBottom: `${ASPECT * 100}%` }}
        >
          <canvas ref={staticRef} className="absolute inset-0" />
          <canvas
            ref={overlayRef}
            className="absolute inset-0 cursor-crosshair"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          />
        </div>

        {/* Légende + bouton révéler */}
        {showLegend && (
          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            {/* Expressions visibles */}
            {visibleFunctions.map((fn, idx) => {
              const globalIdx = content.functions.indexOf(fn);
              return (
                <span
                  key={globalIdx}
                  className="flex items-center gap-1.5 text-sm font-medium"
                  style={{ color: fn.color }}
                >
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: fn.color }}
                  />
                  <span className="text-gray-600">
                    {content.functions.length > 1 ? (
                      <>
                        f<sub>{globalIdx + 1}</sub>(x) ={" "}
                      </>
                    ) : (
                      <>f(x) = </>
                    )}
                  </span>
                  <Latex>
                    {simplifyLatexExpression(fn.expression, variables ?? {})}
                  </Latex>
                </span>
              );
            })}

          </div>
        )}
      </div>
    </div>
  );
};

export default GraphRenderer;
