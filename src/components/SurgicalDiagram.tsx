import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { PortMarking, StomaMarking, IncisionMarking, SurgicalMarking } from '@/types/surgical';

interface SurgicalDiagramProps {
  diagramImage: string;
  onUpdate: (markings: SurgicalMarking[]) => void;
}

type Tool = 'port' | 'stoma' | 'incision';

export const SurgicalDiagram: React.FC<SurgicalDiagramProps> = ({ diagramImage, onUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const [markings, setMarkings] = useState<SurgicalMarking[]>([]);
  const [activeTool, setActiveTool] = useState<Tool | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);

  const [portSize, setPortSize] = useState<'5mm' | '10/11mm' | '12mm' | '15mm'>('12mm');
  const [stomaType, setStomaType] = useState<'ileostomy' | 'colostomy'>('ileostomy');

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

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

  const drawPort = (ctx: CanvasRenderingContext2D, mark: PortMarking) => {
    ctx.save();
    ctx.font = 'bold 10px Arial';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(mark.size, mark.x, mark.y - 3);

    ctx.beginPath();
    ctx.moveTo(mark.x - 10, mark.y);
    ctx.lineTo(mark.x + 10, mark.y);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  };

  const drawStoma = (ctx: CanvasRenderingContext2D, mark: StomaMarking) => {
    ctx.save();
    if (mark.stomaType === 'ileostomy') {
      ctx.beginPath();
      ctx.arc(mark.x, mark.y, 15, 0, 2 * Math.PI);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 3]);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(mark.x, mark.y, 15, 0, 2 * Math.PI);
      ctx.strokeStyle = '#16a34a'; // Green
      ctx.lineWidth = 4;
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
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.stroke();
    ctx.restore();
  };


  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!activeTool) return;
    const coords = getCanvasCoordinates(e);

    if (activeTool === 'incision') {
      setIsDrawing(true);
      setStartPoint(coords);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPoint || activeTool !== 'incision') return;
    const coords = getCanvasCoordinates(e);
    drawMarkings();
    const tempIncision: IncisionMarking = { id: 'temp', type: 'incision', start: startPoint, end: coords };
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) drawIncision(ctx, tempIncision);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!activeTool) return;
    const coords = getCanvasCoordinates(e);
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
    }

    setIsDrawing(false);
    setStartPoint(null);
  };

  const toggleTool = (tool: Tool) => {
    setActiveTool(activeTool === tool ? null : tool);
  };

  return (
    <div className="space-y-4">
      <Card className="p-3 flex flex-wrap gap-4 items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Button onClick={() => toggleTool('port')} variant={activeTool === 'port' ? 'default' : 'outline'}>
            Ports and Size
          </Button>
          {activeTool === 'port' && (
            <div className="flex gap-3">
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

        <div className="flex flex-col items-center gap-2">
          <Button onClick={() => toggleTool('stoma')} variant={activeTool === 'stoma' ? 'default' : 'outline'}>
            Stoma Site
          </Button>
          {activeTool === 'stoma' && (
            <div className="flex gap-3">
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

        <Button onClick={() => toggleTool('incision')} variant={activeTool === 'incision' ? 'default' : 'outline'}>
          Access Incision
        </Button>
        <Button variant="outline">Undo</Button>
        <Button variant="outline">Redo</Button>
      </Card>

      <div className="relative border rounded-lg overflow-hidden" style={{ cursor: activeTool ? 'crosshair' : 'default' }}>
        <img ref={imageRef} alt="Surgical diagram" className="hidden" />
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="w-full h-auto"
        />
      </div>
    </div>
  );
};