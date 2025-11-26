import React, { useEffect, useRef } from 'react';
import { GraphContent, RendererProps } from '../types/exercise';
import { substituteVariables, evaluateAt } from '../utils/MathParser';

const GraphRenderer: React.FC<RendererProps<GraphContent>> = ({
  content,
  variables,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const expression = substituteVariables(content.expression, variables, { useBraces: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { xMin, xMax, yMin, yMax, showGrid, showAxes } = content;
    const width = canvas.width;
    const height = canvas.height;

    const scaleX = width / (xMax - xMin);
    const scaleY = height / (yMax - yMin);

    const toCanvasX = (x: number) => (x - xMin) * scaleX;
    const toCanvasY = (y: number) => height - (y - yMin) * scaleY;

    // Clear avec fond blanc
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Grille
    if (showGrid) {
      ctx.strokeStyle = '#e5e7eb';
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
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 2;

      // Axe X
      if (yMin <= 0 && yMax >= 0) {
        ctx.beginPath();
        ctx.moveTo(0, toCanvasY(0));
        ctx.lineTo(width, toCanvasY(0));
        ctx.stroke();

        // Flèche X
        ctx.beginPath();
        ctx.moveTo(width - 10, toCanvasY(0) - 5);
        ctx.lineTo(width, toCanvasY(0));
        ctx.lineTo(width - 10, toCanvasY(0) + 5);
        ctx.stroke();
      }

      // Axe Y
      if (xMin <= 0 && xMax >= 0) {
        ctx.beginPath();
        ctx.moveTo(toCanvasX(0), height);
        ctx.lineTo(toCanvasX(0), 0);
        ctx.stroke();

        // Flèche Y
        ctx.beginPath();
        ctx.moveTo(toCanvasX(0) - 5, 10);
        ctx.lineTo(toCanvasX(0), 0);
        ctx.lineTo(toCanvasX(0) + 5, 10);
        ctx.stroke();
      }

      // Labels
      ctx.fillStyle = '#6b7280';
      ctx.font = "500 12px 'Fredoka', sans-serif";
      ctx.textAlign = 'center';

      for (let x = Math.ceil(xMin); x <= xMax; x++) {
        if (x !== 0) {
          const cy = yMin <= 0 && yMax >= 0 ? toCanvasY(0) + 16 : height - 5;
          ctx.fillText(x.toString(), toCanvasX(x), cy);
        }
      }

      ctx.textAlign = 'right';
      for (let y = Math.ceil(yMin); y <= yMax; y++) {
        if (y !== 0) {
          const cx = xMin <= 0 && xMax >= 0 ? toCanvasX(0) - 8 : 20;
          ctx.fillText(y.toString(), cx, toCanvasY(y) + 4);
        }
      }

      // Origine
      if (xMin <= 0 && xMax >= 0 && yMin <= 0 && yMax >= 0) {
        ctx.fillText('O', toCanvasX(0) - 8, toCanvasY(0) + 16);
      }
    }

    // Courbe
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();

    let started = false;
    let prevY: number | null = null;

    for (let px = 0; px <= width; px++) {
      const x = xMin + px / scaleX;
      const y = evaluateAt(expression, x);

      const isValid = !isNaN(y) && isFinite(y);
      const inBounds = y >= yMin - 5 && y <= yMax + 5;
      const hasDiscontinuity = prevY !== null && Math.abs(y - prevY) > (yMax - yMin) / 2;

      if (isValid && inBounds && !hasDiscontinuity) {
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

      prevY = isValid ? y : null;
    }
    ctx.stroke();

  }, [content, expression, variables]);

  return (
    <div className="p-5 bg-white/95 rounded-2xl shadow-md border border-gray-100">
      {/* Canvas */}
      <div className="flex justify-center">
        <canvas
          ref={canvasRef}
          width={500}
          height={400}
          className="rounded-xl border-2 border-gray-200 shadow-inner"
          style={{ maxWidth: '100%', height: 'auto' }}
        />
      </div>

      {/* Expression */}
      <div 
        className="text-center text-gray-500 text-sm mt-3"
        style={{ fontFamily: "'Fredoka', sans-serif" }}
      >
        f(x) = {expression}
      </div>
    </div>
  );
};

export default GraphRenderer;