"use client";

import React, { useEffect, useRef } from "react";
import { RendererProps } from "../types/exercise";
import { evaluate } from "../utils/math/evaluation";
import { GraphContent } from "../types/exercise";

const GraphRenderer: React.FC<RendererProps<GraphContent>> = ({
  content,
  variables,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { xMin, xMax, yMin, yMax, showGrid, functions } = content;
    const width = canvas.width;
    const height = canvas.height;

    // Échelles
    const scaleX = width / (xMax - xMin);
    const scaleY = height / (yMax - yMin);
    const toCanvasX = (x: number) => (x - xMin) * scaleX;
    const toCanvasY = (y: number) => height - (y - yMin) * scaleY;

    // 1. Fond
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    // 2. Grille
    if (showGrid) {
      ctx.strokeStyle = "#f3f4f6"; // Gris très clair
      ctx.lineWidth = 1;
      for (let x = Math.ceil(xMin); x <= xMax; x++) {
        ctx.beginPath();
        ctx.moveTo(toCanvasX(x), 0);
        ctx.lineTo(toCanvasX(x), height);
        ctx.stroke();
      }
      for (let y = Math.ceil(yMin); y <= yMax; y++) {
        ctx.beginPath();
        ctx.moveTo(0, toCanvasY(y));
        ctx.lineTo(width, toCanvasY(y));
        ctx.stroke();
      }
    }

    // Positions des axes 0
    const yZero = toCanvasY(0);
    const xZero = toCanvasX(0);

    // 3. Axes
    ctx.strokeStyle = "#374151"; // Gris foncé
    ctx.lineWidth = 2;

    // Axe X
    if (yZero >= 0 && yZero <= height) {
      ctx.beginPath();
      ctx.moveTo(0, yZero);
      ctx.lineTo(width, yZero);
      ctx.stroke();
    }

    // Axe Y
    if (xZero >= 0 && xZero <= width) {
      ctx.beginPath();
      ctx.moveTo(xZero, height);
      ctx.lineTo(xZero, 0);
      ctx.stroke();
    }

    // 4. Graduations et nombres
    ctx.font = "12px sans-serif";
    ctx.fillStyle = "#6b7280"; // Gris moyen pour le texte
    ctx.lineWidth = 1.5;

    // Graduations Axe X
    if (yZero >= 0 && yZero <= height) {
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      for (let x = Math.ceil(xMin); x <= xMax; x++) {
        if (x === 0) continue; // On saute le 0 pour l'axe X
        const canvasX = toCanvasX(x);
        
        // Tiret
        ctx.beginPath();
        ctx.moveTo(canvasX, yZero - 4);
        ctx.lineTo(canvasX, yZero + 4);
        ctx.stroke();
        
        // Chiffre
        ctx.fillText(x.toString(), canvasX, yZero + 8);
      }
    }

    // Graduations Axe Y
    if (xZero >= 0 && xZero <= width) {
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      for (let y = Math.ceil(yMin); y <= yMax; y++) {
        if (y === 0) continue; // On saute le 0 pour l'axe Y
        const canvasY = toCanvasY(y);
        
        // Tiret
        ctx.beginPath();
        ctx.moveTo(xZero - 4, canvasY);
        ctx.lineTo(xZero + 4, canvasY);
        ctx.stroke();
        
        // Chiffre
        ctx.fillText(y.toString(), xZero - 8, canvasY);
      }
      
      // Afficher le "0" à l'origine s'il est visible sur l'écran
      if (yZero >= 0 && yZero <= height) {
        ctx.textAlign = "right";
        ctx.textBaseline = "top";
        ctx.fillText("0", xZero - 8, yZero + 8);
      }
    }

    // 5. Courbes (plusieurs fonctions)
    functions.forEach((fn) => {
      ctx.strokeStyle = fn.color || "#3b82f6";
      ctx.lineWidth = 2.5; // Un peu affiné pour l'élégance
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      
      let started = false;
      for (let px = 0; px <= width; px++) {
        const x = xMin + px / scaleX;
        const y = evaluate(fn.expression, { ...variables, x });
        const isValid = !isNaN(y) && isFinite(y);
        const inBounds = y >= yMin - (yMax - yMin) && y <= yMax + (yMax - yMin);
        
        if (isValid && inBounds) {
          const canvasX = toCanvasX(x);
          const canvasY = toCanvasY(y);
          if (!started) {
            ctx.moveTo(canvasX, canvasY);
            started = true;
          } else {
            ctx.lineTo(canvasX, canvasY);
          }
        } else {
          started = false;
        }
      }
      ctx.stroke();
    });
  }, [content, variables]);

  return (
    <div className="p-5 bg-white rounded-2xl shadow-sm border border-gray-100">
      <div className="flex justify-center overflow-hidden rounded-xl border border-gray-200 bg-white">
        <canvas
          ref={canvasRef}
          width={500}
          height={400}
          className="w-full max-w-[500px]"
        />
      </div>
      {/* Légende des fonctions */}
      {content.functions && content.functions.length > 0 && (
        <div className="text-center text-sm mt-4 font-medium flex flex-wrap gap-4 justify-center">
          {content.functions.map((fn, idx) => (
            <span key={idx} style={{ color: fn.color }} className="flex items-center gap-1.5">
              <span 
                className="w-3 h-3 rounded-full block" 
                style={{ backgroundColor: fn.color }} 
              />
              f{content.functions.length > 1 ? `_${idx + 1}` : ""}(x) = {fn.expression}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default GraphRenderer;