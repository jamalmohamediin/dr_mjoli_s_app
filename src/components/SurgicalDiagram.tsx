import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { PortMarking, StomaMarking, IncisionMarking, SurgicalMarking } from '@/types/surgical';
import { getSurgicalDiagramMarkingMetrics } from '@/utils/surgicalDiagramMarkings';

interface SurgicalDiagramProps {
  diagramImage: string;
  onUpdate: (markings: SurgicalMarking[]) => void;
  initialMarkings?: SurgicalMarking[];
  markingScale?: number;
}

type Tool = 'port' | 'stoma' | 'incision';

export const SurgicalDiagram: React.FC<SurgicalDiagramProps> = ({
  diagramImage,
  onUpdate,
  initialMarkings = [],
  markingScale = 1,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const [markings, setMarkings] = useState<SurgicalMarking[]>(initialMarkings);
  const [activeTool, setActiveTool] = useState<Tool | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  
  // Undo/Redo state - Initialize with current markings as first history entry
  const [history, setHistory] = useState<SurgicalMarking[][]>([initialMarkings]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [historyInitialized, setHistoryInitialized] = useState(false);

  const [portSize, setPortSize] = useState<'5mm' | '10/11mm' | '12mm' | '15mm'>('12mm');
  const [stomaType, setStomaType] = useState<'ileostomy' | 'colostomy'>('ileostomy');
  const serializedInitialMarkings = JSON.stringify(initialMarkings);
  const drawingMetrics = getSurgicalDiagramMarkingMetrics(markingScale);

  const getCanvasCoordinatesFromPoint = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const getCanvasCoordinates = (
    e:
      | React.MouseEvent<HTMLCanvasElement>
      | React.PointerEvent<HTMLCanvasElement>
      | React.Touch
  ) => getCanvasCoordinatesFromPoint(e.clientX, e.clientY);

  const drawMarkings = useCallback(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    markings.forEach(mark => {
      if (mark.type === 'port') {
        drawPort(ctx, mark);
      } else if (mark.type === 'stoma') {
        drawStoma(ctx, mark);
      } else if (mark.type === 'incision') {
        drawIncision(ctx, mark);
      }
    });
  }, [markings]);

  // Initialize history properly when component mounts
  useEffect(() => {
    if (!historyInitialized) {
      setHistory([initialMarkings]);
      setHistoryIndex(0);
      setHistoryInitialized(true);
    }
  }, [historyInitialized, initialMarkings]);

  useEffect(() => {
    setMarkings(initialMarkings);
    setHistory([initialMarkings]);
    setHistoryIndex(0);
  }, [diagramImage, serializedInitialMarkings, initialMarkings]);

  useEffect(() => {
    const image = imageRef.current;
    const canvas = canvasRef.current;
    if (image && canvas) {
      image.onload = () => {
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        drawMarkings();
      };
      if (image.complete) {
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        drawMarkings();
      }
      image.src = diagramImage;
    }
  }, [diagramImage, drawMarkings]);

  // Redraw markings whenever they change
  useEffect(() => {
    drawMarkings();
  }, [drawMarkings]);

  const drawPort = (ctx: CanvasRenderingContext2D, mark: PortMarking) => {
    ctx.save();
    ctx.font = `bold ${drawingMetrics.portFontSize}px Arial`;
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(mark.size, mark.x, mark.y - drawingMetrics.portLabelOffset);

    ctx.beginPath();
    ctx.moveTo(mark.x - drawingMetrics.portHalfLength, mark.y);
    ctx.lineTo(mark.x + drawingMetrics.portHalfLength, mark.y);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = drawingMetrics.portLineWidth;
    ctx.stroke();
    ctx.restore();
  };

  const drawStoma = (ctx: CanvasRenderingContext2D, mark: StomaMarking) => {
    ctx.save();
    if (mark.stomaType === 'ileostomy') {
      ctx.beginPath();
      ctx.arc(mark.x, mark.y, drawingMetrics.stomaRadius, 0, 2 * Math.PI);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = drawingMetrics.ileostomyLineWidth;
      ctx.setLineDash(drawingMetrics.ileostomyDash);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(mark.x, mark.y, drawingMetrics.stomaRadius, 0, 2 * Math.PI);
      ctx.strokeStyle = '#16a34a'; // Green
      ctx.lineWidth = drawingMetrics.colostomyLineWidth;
      ctx.setLineDash([]);
      ctx.stroke();
    }
    ctx.restore();
  };

  const drawIncision = (ctx: CanvasRenderingContext2D, mark: IncisionMarking) => {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(mark.start.x, mark.start.y);
    ctx.lineTo(mark.end.x, mark.end.y);
    ctx.strokeStyle = '#8B0000'; // Dark red
    ctx.lineWidth = drawingMetrics.incisionLineWidth;
    ctx.setLineDash(drawingMetrics.incisionDash);
    ctx.stroke();
    ctx.restore();
  };


  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!activeTool) return;
    e.preventDefault();
    const coords = getCanvasCoordinates(e);

    if (activeTool === 'incision') {
      e.currentTarget.setPointerCapture?.(e.pointerId);
      setIsDrawing(true);
      setStartPoint(coords);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPoint || activeTool !== 'incision') return;
    e.preventDefault();
    const coords = getCanvasCoordinates(e);
    drawMarkings();
    const tempIncision: IncisionMarking = { id: 'temp', type: 'incision', start: startPoint, end: coords };
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) drawIncision(ctx, tempIncision);
  };

  const finishMarking = (coords: { x: number; y: number }) => {
    if (!activeTool) return;
    let newMarking: SurgicalMarking | null = null;

    if (activeTool === 'port') {
      newMarking = { id: Date.now().toString(), type: 'port', x: coords.x, y: coords.y, size: portSize };
    } else if (activeTool === 'stoma') {
      newMarking = { id: Date.now().toString(), type: 'stoma', x: coords.x, y: coords.y, stomaType: stomaType };
    } else if (activeTool === 'incision' && isDrawing && startPoint) {
      newMarking = { id: Date.now().toString(), type: 'incision', start: startPoint, end: coords };
    }

    if (newMarking) {
      const newMarkings = [...markings, newMarking];
      setMarkings(newMarkings);
      onUpdate(newMarkings);
      
      // Update history for undo/redo
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newMarkings);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }

    setIsDrawing(false);
    setStartPoint(null);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!activeTool) return;
    e.preventDefault();
    const coords = getCanvasCoordinates(e);
    finishMarking(coords);
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!activeTool) return;
    e.preventDefault();
    drawMarkings();
    setIsDrawing(false);
    setStartPoint(null);
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  };

  const toggleTool = (tool: Tool) => {
    setActiveTool(activeTool === tool ? null : tool);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const previousMarkings = history[newIndex];
      setHistoryIndex(newIndex);
      setMarkings(previousMarkings);
      onUpdate(previousMarkings);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const nextMarkings = history[newIndex];
      setHistoryIndex(newIndex);
      setMarkings(nextMarkings);
      onUpdate(nextMarkings);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
        <div className="flex w-full flex-col items-center gap-2 sm:w-auto">
          <Button
            onClick={() => toggleTool('port')}
            variant={activeTool === 'port' ? 'default' : 'outline'}
            className="w-full sm:w-auto"
          >
            Ports and Size
          </Button>
          {activeTool === 'port' && (
            <div className="flex flex-wrap justify-center gap-3">
              {(['5mm', '10/11mm', '12mm', '15mm'] as const).map(size => (
                <div key={size} className="flex items-center gap-1">
                  <Checkbox 
                    id={`port-${size}`} 
                    checked={portSize === size} 
                    onCheckedChange={() => setPortSize(size)}
                  />
                  <label htmlFor={`port-${size}`} className="text-xs font-medium">{size}</label>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex w-full flex-col items-center gap-2 sm:w-auto">
          <Button
            onClick={() => toggleTool('stoma')}
            variant={activeTool === 'stoma' ? 'default' : 'outline'}
            className="w-full sm:w-auto"
          >
            Stoma Site
          </Button>
          {activeTool === 'stoma' && (
            <div className="flex flex-wrap justify-center gap-3">
              {(['ileostomy', 'colostomy'] as const).map(type => (
                <div key={type} className="flex items-center gap-1">
                  <Checkbox 
                    id={`stoma-${type}`} 
                    checked={stomaType === type} 
                    onCheckedChange={() => setStomaType(type)}
                  />
                  <label htmlFor={`stoma-${type}`} className="text-xs font-medium capitalize">{type}</label>
                </div>
              ))}
            </div>
          )}
        </div>

        <Button
          onClick={() => toggleTool('incision')}
          variant={activeTool === 'incision' ? 'default' : 'outline'}
          className="w-full sm:w-auto"
        >
          Access Incision
        </Button>
        <Button variant="outline" onClick={handleUndo} disabled={historyIndex === 0} className="w-full sm:w-auto">Undo</Button>
        <Button variant="outline" onClick={handleRedo} disabled={historyIndex === history.length - 1} className="w-full sm:w-auto">Redo</Button>
      </Card>

      <div className="relative mx-auto flex w-full justify-center rounded-lg border bg-white p-2 sm:p-4">
        <div className="w-full max-w-[480px]">
          <img ref={imageRef} alt="Surgical diagram" className="hidden" />
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            onPointerLeave={handlePointerCancel}
            className="mx-auto block h-auto w-full max-w-[480px] select-none"
            style={{
              cursor: activeTool ? 'crosshair' : 'default',
              touchAction: activeTool ? 'none' : 'manipulation',
            }}
          />
        </div>
      </div>
    </div>
  );
};
