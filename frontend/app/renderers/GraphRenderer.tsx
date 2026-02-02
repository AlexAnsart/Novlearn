'use client';

import React, { useEffect, useRef } from 'react';
import { GraphContent, RendererProps } from '../types/exercise';
import { substituteVariables } from '../utils/math/parsing';
import { evaluate } from '../utils/math/evaluation';

const GraphRenderer: React.FC<RendererProps<GraphContent>> = ({
  content,
  variables,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Nettoyage de l'expression pour l'affichage (f(x) = ...)
  const displayExpression = substituteVariables(content.expression, variables);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { xMin, xMax, yMin, yMax, showGrid, showAxes } = content;
    const width = canvas.width;
    const height = canvas.height;

    // Échelles
    const scaleX = width / (xMax - xMin);
    const scaleY = height / (yMax - yMin);
    const toCanvasX = (x: number) => (x - xMin) * scaleX;
    const toCanvasY = (y: number) => height - (y - yMin) * scaleY;

    // Fond
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Grille
    if (showGrid) {
      ctx.strokeStyle = '#f3f4f6'; // Gris très clair
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

    // Axes
    if (showAxes) {
      ctx.strokeStyle = '#374151'; // Gris foncé
      ctx.lineWidth = 2;
      
      // Axe X
      const yZero = toCanvasY(0);
      if (yZero >= 0 && yZero <= height) {
        ctx.beginPath();
        ctx.moveTo(0, yZero);
        ctx.lineTo(width, yZero);
        ctx.stroke();
      }

      // Axe Y
      const xZero = toCanvasX(0);
      if (xZero >= 0 && xZero <= width) {
        ctx.beginPath();
        ctx.moveTo(xZero, height);
        ctx.lineTo(xZero, 0);
        ctx.stroke();
      }
    }

    // Courbe
    ctx.strokeStyle = '#3b82f6'; // Bleu
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();

    let started = false;
    for (let px = 0; px <= width; px++) {
      const x = xMin + px / scaleX;
      // Évaluation : On passe l'expression brute (avec @a) et x comme variable locale
      // On combine les variables globales et la variable locale x
      const y = evaluate(content.expression, { ...variables, x });

      const isValid = !isNaN(y) && isFinite(y);
      // Éviter de dessiner les asymptotes verticales (sauts brutaux)
      // et ne pas dessiner hors limites extrêmes pour éviter les bugs graphiques
      const inBounds = y >= yMin - (yMax-yMin) && y <= yMax + (yMax-yMin);

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
        started = false; // Rupture de la ligne (ex: asymptote)
      }
    }
    ctx.stroke();

  }, [content, variables]);

  return (
    <div className="p-5 bg-white rounded-2xl shadow-md border border-gray-100">
      <div className="flex justify-center overflow-hidden rounded-xl border border-gray-200">
        <canvas
          ref={canvasRef}
          width={500}
          height={400}
          className="bg-white w-full max-w-[500px]"
        />
      </div>
      <div className="text-center text-gray-500 text-sm mt-3 font-medium">
        f(x) = {displayExpression}
      </div>
    </div>
  );
};

export default GraphRenderer;