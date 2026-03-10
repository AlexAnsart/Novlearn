"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Latex from "../components/ui/Latex";
import { GraphContent, RendererProps } from "../types/exercise";
import {
  evaluate,
  mathJsExprToLatex,
  toMathJsSyntax,
} from "../utils/math/evaluation";
import { substituteVariables } from "../utils/math/parsing";

// Rapport hauteur / largeur du graphe
const ASPECT = 4 / 5;

const GraphRenderer: React.FC<RendererProps<GraphContent>> = ({
  content,
  variables,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const staticRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const [hoverX, setHoverX] = useState<number | null>(null);
  // Largeur CSS du conteneur, mise à jour par le ResizeObserver
  const [containerWidth, setContainerWidth] = useState(0);

  /** Résout une borne qui peut être un nombre ou une formule avec variables. */
  const resolveBound = useCallback(
    (val: number | string): number => {
      if (typeof val === "number") return val;
      const result = evaluate(val, variables ?? {});
      return isFinite(result) ? result : 0;
    },
    [variables],
  );

  // ─── ResizeObserver : suit la largeur du conteneur ───────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });
    ro.observe(container);
    setContainerWidth(container.clientWidth);
    return () => ro.disconnect();
  }, []);

  // ─── Dessin statique (courbe + axes) ────────────────────────────────────
  // Se déclenche quand le conteneur change de taille OU quand le contenu change.
  // Synchronise aussi les dimensions des deux canvas (DPR-aware) avant de dessiner.
  useEffect(() => {
    const sc = staticRef.current;
    const oc = overlayRef.current;
    if (!sc || !oc || !containerWidth) return;
    const ctx = sc.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const cssW = containerWidth;
    const cssH = Math.round(cssW * ASPECT);

    // Redimensionne les deux canvas (remet également l'overlay à blanc)
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
    const { showGrid, functions } = content;

    ctx.save();
    ctx.scale(dpr, dpr); // tout le dessin se fait en coordonnées CSS pixels

    const scaleX = cssW / (xMax - xMin);
    const scaleY = cssH / (yMax - yMin);
    const toX = (x: number) => (x - xMin) * scaleX;
    const toY = (y: number) => cssH - (y - yMin) * scaleY;

    // Fond
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, cssW, cssH);

    // Grille
    if (showGrid) {
      ctx.strokeStyle = "#f3f4f6";
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

    // Axes
    ctx.strokeStyle = "#374151";
    ctx.lineWidth = 2;
    if (yZero >= 0 && yZero <= cssH) {
      ctx.beginPath();
      ctx.moveTo(0, yZero);
      ctx.lineTo(cssW, yZero);
      ctx.stroke();
    }
    if (xZero >= 0 && xZero <= cssW) {
      ctx.beginPath();
      ctx.moveTo(xZero, cssH);
      ctx.lineTo(xZero, 0);
      ctx.stroke();
    }

    // Graduations et labels
    ctx.font = "12px sans-serif";
    ctx.fillStyle = "#6b7280";
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "#374151";

    if (yZero >= 0 && yZero <= cssH) {
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      for (let x = Math.ceil(xMin); x <= xMax; x++) {
        if (x === 0) continue;
        const cx = toX(x);
        ctx.beginPath();
        ctx.moveTo(cx, yZero - 4);
        ctx.lineTo(cx, yZero + 4);
        ctx.stroke();
        ctx.fillText(x.toString(), cx, yZero + 8);
      }
    }
    if (xZero >= 0 && xZero <= cssW) {
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      for (let y = Math.ceil(yMin); y <= yMax; y++) {
        if (y === 0) continue;
        const cy = toY(y);
        ctx.beginPath();
        ctx.moveTo(xZero - 4, cy);
        ctx.lineTo(xZero + 4, cy);
        ctx.stroke();
        ctx.fillText(y.toString(), xZero - 8, cy);
      }
      if (yZero >= 0 && yZero <= cssH) {
        ctx.textAlign = "right";
        ctx.textBaseline = "top";
        ctx.fillText("0", xZero - 8, yZero + 8);
      }
    }

    // Courbes
    functions.forEach((fn) => {
      // Pré-traitement : substitution des variables puis conversion LaTeX→mathjs
      // Une seule fois par courbe, pas à chaque pixel.
      const mathJsExpr = toMathJsSyntax(
        substituteVariables(fn.expression, variables ?? {}),
      );
      ctx.strokeStyle = fn.color || "#3b82f6";
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      let started = false;
      for (let px = 0; px <= cssW; px++) {
        const x = xMin + px / scaleX;
        const y = evaluate(mathJsExpr, { x });
        const valid = !isNaN(y) && isFinite(y);
        const inBounds = y >= yMin - (yMax - yMin) && y <= yMax + (yMax - yMin);
        if (valid && inBounds) {
          if (!started) {
            ctx.moveTo(toX(x), toY(y));
            started = true;
          } else {
            ctx.lineTo(toX(x), toY(y));
          }
        } else {
          started = false;
        }
      }
      ctx.stroke();
    });

    ctx.restore();
  }, [containerWidth, content, variables, resolveBound]);

  // ─── Overlay interactif (curseur + bulles de coordonnées) ───────────────
  // Ne redimensionne PAS les canvas (déjà fait par l'effet statique).
  // Utilise canvas.width / DPR pour retrouver les dimensions CSS exactes.
  useEffect(() => {
    const canvas = overlayRef.current;
    if (!canvas || !containerWidth) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (hoverX === null) return;

    // Dimensions CSS déduites des pixels physiques
    const cssW = canvas.width / dpr;
    const cssH = canvas.height / dpr;

    const xMin = resolveBound(content.xMin);
    const xMax = resolveBound(content.xMax);
    const yMin = resolveBound(content.yMin);
    const yMax = resolveBound(content.yMax);
    const scaleX = cssW / (xMax - xMin);
    const scaleY = cssH / (yMax - yMin);
    const toX = (x: number) => (x - xMin) * scaleX;
    const toY = (y: number) => cssH - (y - yMin) * scaleY;

    ctx.save();
    ctx.scale(dpr, dpr);

    const cx = toX(hoverX);

    // Ligne verticale en pointillés
    ctx.strokeStyle = "rgba(107,114,128,0.45)";
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, cssH);
    ctx.stroke();
    ctx.setLineDash([]);

    content.functions.forEach((fn) => {
      // Même pré-traitement que pour le dessin statique
      const mathJsExpr = toMathJsSyntax(
        substituteVariables(fn.expression, variables ?? {}),
      );
      const y = evaluate(mathJsExpr, { x: hoverX });
      if (isNaN(y) || !isFinite(y)) return;
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

  // ─── Gestion souris ──────────────────────────────────────────────────────
  // getBoundingClientRect() de l'overlay lui-même : toujours exact,
  // quelle que soit la taille CSS affichée.
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

  return (
    <div className="p-5 bg-white rounded-2xl shadow-sm border border-gray-100">
      {/* Taille limitée — graphe compact */}
      <div className="max-w-sm mx-auto">
        {/* Conteneur à rapport d'aspect fixe — les canvas s'adaptent via ResizeObserver */}
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
        {/* Légende des fonctions — expressions rendues en LaTeX */}
        {content.functions && content.functions.length > 0 && (
          <div className="text-center text-sm mt-4 font-medium flex flex-wrap gap-4 justify-center">
            {content.functions.map((fn, idx) => (
              <span
                key={idx}
                className="flex items-center gap-1.5"
                style={{ color: fn.color }}
              >
                <span
                  className="w-3 h-3 rounded-full block flex-shrink-0"
                  style={{ backgroundColor: fn.color }}
                />
                <span className="text-gray-600">
                  {content.functions.length > 1 ? (
                    <>
                      f<sub>{idx + 1}</sub>(x) ={" "}
                    </>
                  ) : (
                    <>f(x) = </>
                  )}
                </span>
                <Latex>
                  {mathJsExprToLatex(fn.expression, variables ?? {})}
                </Latex>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GraphRenderer;
