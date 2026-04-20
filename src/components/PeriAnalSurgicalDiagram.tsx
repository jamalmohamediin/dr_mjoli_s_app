import React, { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Eraser, Pencil, Type } from "lucide-react";
import { getSurgicalDiagramMarkingMetrics } from "@/utils/surgicalDiagramMarkings";

type DiagramTool = "draw" | "textBox" | "erase" | null;

type Point = {
  x: number;
  y: number;
};

type DrawStrokeMarking = {
  id: string;
  type: "drawStroke";
  color: string;
  width: number;
  points: Point[];
};

type TextBoxMarking = {
  id: string;
  type: "textBox";
  color: string;
  size: number;
  text: string;
  x: number;
  y: number;
};

type PeriAnalMarking = DrawStrokeMarking | TextBoxMarking | any;

interface PeriAnalSurgicalDiagramProps {
  diagramImage: string;
  onUpdate: (markings: PeriAnalMarking[]) => void;
  initialMarkings?: PeriAnalMarking[];
  markingScale?: number;
}

const pointDistance = (left: Point, right: Point) =>
  Math.hypot(left.x - right.x, left.y - right.y);

const distanceToSegment = (point: Point, start: Point, end: Point) => {
  const segmentX = end.x - start.x;
  const segmentY = end.y - start.y;
  const lengthSquared = segmentX * segmentX + segmentY * segmentY;

  if (lengthSquared === 0) {
    return pointDistance(point, start);
  }

  let t =
    ((point.x - start.x) * segmentX + (point.y - start.y) * segmentY) /
    lengthSquared;
  t = Math.max(0, Math.min(1, t));

  const projection = {
    x: start.x + t * segmentX,
    y: start.y + t * segmentY,
  };

  return pointDistance(point, projection);
};

const createMarkingId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export const PeriAnalSurgicalDiagram: React.FC<PeriAnalSurgicalDiagramProps> = ({
  diagramImage,
  onUpdate,
  initialMarkings = [],
  markingScale = 1,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const drawingStrokeRef = useRef<Point[] | null>(null);
  const isDrawingRef = useRef(false);
  const serializedInitialMarkings = JSON.stringify(initialMarkings || []);
  const lastCommittedMarkingsRef = useRef(serializedInitialMarkings);
  const previousDiagramImageRef = useRef(diagramImage);

  const [markings, setMarkings] = useState<PeriAnalMarking[]>(initialMarkings || []);
  const [draftStroke, setDraftStroke] = useState<DrawStrokeMarking | null>(null);
  const [activeTool, setActiveTool] = useState<DiagramTool>("draw");
  const [drawColor, setDrawColor] = useState("#111111");
  const [drawWidth, setDrawWidth] = useState(3);
  const [textValue, setTextValue] = useState("");
  const [textSize, setTextSize] = useState(20);
  const [textColor, setTextColor] = useState("#111111");
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

  const drawLegacyPort = (ctx: CanvasRenderingContext2D, mark: any) => {
    ctx.save();
    ctx.font = `bold ${drawingMetrics.portFontSize}px Arial`;
    ctx.fillStyle = "black";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText(mark.size, mark.x, mark.y - drawingMetrics.portLabelOffset);
    ctx.beginPath();
    ctx.moveTo(mark.x - drawingMetrics.portHalfLength, mark.y);
    ctx.lineTo(mark.x + drawingMetrics.portHalfLength, mark.y);
    ctx.strokeStyle = "black";
    ctx.lineWidth = drawingMetrics.portLineWidth;
    ctx.stroke();
    ctx.restore();
  };

  const drawLegacyStoma = (ctx: CanvasRenderingContext2D, mark: any) => {
    ctx.save();
    ctx.beginPath();
    ctx.arc(mark.x, mark.y, drawingMetrics.stomaRadius, 0, 2 * Math.PI);
    ctx.strokeStyle = mark.stomaType === "ileostomy" ? "#f59e0b" : "#16a34a";
    ctx.lineWidth =
      mark.stomaType === "ileostomy"
        ? drawingMetrics.ileostomyLineWidth
        : drawingMetrics.colostomyLineWidth;
    ctx.setLineDash(mark.stomaType === "ileostomy" ? drawingMetrics.ileostomyDash : []);
    ctx.stroke();
    ctx.restore();
  };

  const drawLegacyIncision = (ctx: CanvasRenderingContext2D, mark: any) => {
    if (!mark?.start || !mark?.end) return;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(mark.start.x, mark.start.y);
    ctx.lineTo(mark.end.x, mark.end.y);
    ctx.strokeStyle = "#8B0000";
    ctx.lineWidth = drawingMetrics.incisionLineWidth;
    ctx.setLineDash(drawingMetrics.incisionDash);
    ctx.stroke();
    ctx.restore();
  };

  const drawStrokeMarking = (ctx: CanvasRenderingContext2D, mark: DrawStrokeMarking) => {
    if (!Array.isArray(mark.points) || mark.points.length === 0) return;
    ctx.save();
    ctx.strokeStyle = mark.color || "#111111";
    ctx.lineWidth = Number(mark.width) > 0 ? Number(mark.width) : 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(mark.points[0].x, mark.points[0].y);
    for (let index = 1; index < mark.points.length; index += 1) {
      ctx.lineTo(mark.points[index].x, mark.points[index].y);
    }
    if (mark.points.length === 1) {
      ctx.lineTo(mark.points[0].x + 0.01, mark.points[0].y + 0.01);
    }
    ctx.stroke();
    ctx.restore();
  };

  const drawTextBoxMarking = (ctx: CanvasRenderingContext2D, mark: TextBoxMarking) => {
    if (!mark?.text?.trim()) return;
    const size = Number(mark.size) > 0 ? Number(mark.size) : 20;
    ctx.save();
    ctx.fillStyle = mark.color || "#111111";
    ctx.font = `${size}px Arial`;
    ctx.textBaseline = "top";
    ctx.fillText(mark.text, mark.x, mark.y);
    ctx.restore();
  };

  const drawMarking = useCallback(
    (ctx: CanvasRenderingContext2D, mark: PeriAnalMarking) => {
      if (!mark) return;
      if (mark.type === "drawStroke") {
        drawStrokeMarking(ctx, mark as DrawStrokeMarking);
        return;
      }
      if (mark.type === "textBox") {
        drawTextBoxMarking(ctx, mark as TextBoxMarking);
        return;
      }
      if (mark.type === "port") {
        drawLegacyPort(ctx, mark);
        return;
      }
      if (mark.type === "stoma") {
        drawLegacyStoma(ctx, mark);
        return;
      }
      if (mark.type === "incision") {
        drawLegacyIncision(ctx, mark);
      }
    },
    [drawingMetrics],
  );

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    markings.forEach((mark) => drawMarking(ctx, mark));
    if (draftStroke) {
      drawStrokeMarking(ctx, draftStroke);
    }
  }, [drawMarking, draftStroke, markings]);

  useEffect(() => {
    const diagramChanged = previousDiagramImageRef.current !== diagramImage;
    const isLocalEcho = serializedInitialMarkings === lastCommittedMarkingsRef.current;

    if (!diagramChanged && isLocalEcho) {
      return;
    }

    setMarkings(initialMarkings || []);
    setDraftStroke(null);
    previousDiagramImageRef.current = diagramImage;
    lastCommittedMarkingsRef.current = serializedInitialMarkings;
  }, [diagramImage, initialMarkings, serializedInitialMarkings]);

  useEffect(() => {
    const image = imageRef.current;
    const canvas = canvasRef.current;
    if (!image || !canvas) return;

    image.onload = () => {
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      redrawCanvas();
    };

    if (image.complete && image.naturalHeight > 0) {
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      redrawCanvas();
    } else {
      image.src = diagramImage;
    }
  }, [diagramImage, redrawCanvas]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  const commitMarkings = (nextMarkings: PeriAnalMarking[]) => {
    const clonedMarkings = JSON.parse(JSON.stringify(nextMarkings || []));
    const serialized = JSON.stringify(clonedMarkings);
    lastCommittedMarkingsRef.current = serialized;
    setMarkings(clonedMarkings);
    onUpdate(clonedMarkings);
  };

  const isMarkingHit = (mark: PeriAnalMarking, point: Point) => {
    if (!mark) return false;

    if (mark.type === "drawStroke") {
      const points = Array.isArray(mark.points) ? mark.points : [];
      if (points.length === 0) return false;
      const threshold = Math.max(8, Number(mark.width) + 4 || 8);
      for (let index = 0; index < points.length; index += 1) {
        if (pointDistance(point, points[index]) <= threshold) return true;
        if (index > 0 && distanceToSegment(point, points[index - 1], points[index]) <= threshold) {
          return true;
        }
      }
      return false;
    }

    if (mark.type === "textBox") {
      const size = Number(mark.size) > 0 ? Number(mark.size) : 20;
      const text = String(mark.text || "");
      const width = Math.max(20, text.length * size * 0.56);
      const height = size * 1.2;
      return (
        point.x >= mark.x - 8 &&
        point.x <= mark.x + width + 8 &&
        point.y >= mark.y - 8 &&
        point.y <= mark.y + height + 8
      );
    }

    if (mark.type === "port" || mark.type === "stoma") {
      return pointDistance(point, { x: mark.x || 0, y: mark.y || 0 }) <= 16;
    }

    if (mark.type === "incision" && mark?.start && mark?.end) {
      return distanceToSegment(point, mark.start, mark.end) <= 12;
    }

    return false;
  };

  const eraseAtPoint = (point: Point) => {
    for (let index = markings.length - 1; index >= 0; index -= 1) {
      if (isMarkingHit(markings[index], point)) {
        const nextMarkings = markings.filter((_, markIndex) => markIndex !== index);
        commitMarkings(nextMarkings);
        return;
      }
    }
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const point = getCanvasCoordinatesFromPoint(event.clientX, event.clientY);

    if (activeTool === "draw") {
      event.currentTarget.setPointerCapture?.(event.pointerId);
      isDrawingRef.current = true;
      drawingStrokeRef.current = [point];
      setDraftStroke({
        id: "draft",
        type: "drawStroke",
        color: drawColor,
        width: drawWidth,
        points: [point],
      });
      return;
    }

    if (activeTool === "textBox") {
      const text = textValue.trim();
      if (!text) return;
      const nextMarkings = [
        ...markings,
        {
          id: createMarkingId(),
          type: "textBox",
          color: textColor,
          size: textSize,
          text,
          x: point.x,
          y: point.y,
        } as TextBoxMarking,
      ];
      commitMarkings(nextMarkings);
      return;
    }

    if (activeTool === "erase") {
      eraseAtPoint(point);
    }
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (activeTool !== "draw" || !isDrawingRef.current || !drawingStrokeRef.current) {
      return;
    }

    event.preventDefault();
    const point = getCanvasCoordinatesFromPoint(event.clientX, event.clientY);
    drawingStrokeRef.current = [...drawingStrokeRef.current, point];
    setDraftStroke({
      id: "draft",
      type: "drawStroke",
      color: drawColor,
      width: drawWidth,
      points: drawingStrokeRef.current,
    });
  };

  const finishStroke = () => {
    if (!drawingStrokeRef.current || drawingStrokeRef.current.length === 0) {
      isDrawingRef.current = false;
      setDraftStroke(null);
      drawingStrokeRef.current = null;
      return;
    }

    const nextMarkings = [
      ...markings,
      {
        id: createMarkingId(),
        type: "drawStroke",
        color: drawColor,
        width: drawWidth,
        points: drawingStrokeRef.current,
      } as DrawStrokeMarking,
    ];
    commitMarkings(nextMarkings);
    isDrawingRef.current = false;
    drawingStrokeRef.current = null;
    setDraftStroke(null);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (activeTool !== "draw") return;
    event.preventDefault();
    finishStroke();
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  };

  const handlePointerCancel = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (activeTool !== "draw") return;
    event.preventDefault();
    isDrawingRef.current = false;
    drawingStrokeRef.current = null;
    setDraftStroke(null);
    redrawCanvas();
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  };

  const toggleTool = (tool: Exclude<DiagramTool, null>) => {
    setActiveTool((previousTool) => (previousTool === tool ? null : tool));
  };

  return (
    <div className="space-y-4">
      <Card className="mx-auto flex w-full max-w-2xl flex-col gap-3 p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-start">
        <Button
          type="button"
          onClick={() => toggleTool("draw")}
          variant={activeTool === "draw" ? "default" : "outline"}
          className="w-full sm:w-auto"
        >
          <Pencil className="mr-2 h-4 w-4" />
          Draw
        </Button>
        <Button
          type="button"
          onClick={() => toggleTool("textBox")}
          variant={activeTool === "textBox" ? "default" : "outline"}
          className="w-full sm:w-auto"
        >
          <Type className="mr-2 h-4 w-4" />
          Textbox
        </Button>
        <Button
          type="button"
          onClick={() => toggleTool("erase")}
          variant={activeTool === "erase" ? "default" : "outline"}
          className="w-full sm:w-auto"
        >
          <Eraser className="mr-2 h-4 w-4" />
          Erase
        </Button>

        {activeTool === "draw" && (
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-700">Color</label>
              <input
                type="color"
                value={drawColor}
                onChange={(event) => setDrawColor(event.target.value)}
                className="h-8 w-10 cursor-pointer rounded border border-gray-300 p-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-700">Thickness</label>
              <input
                type="range"
                min={1}
                max={14}
                value={drawWidth}
                onChange={(event) => setDrawWidth(Number(event.target.value))}
                className="w-28"
              />
              <span className="text-xs text-gray-600">{drawWidth}</span>
            </div>
          </div>
        )}

        {activeTool === "textBox" && (
          <div className="flex w-full flex-col gap-2 sm:w-full">
            <Input
              value={textValue}
              onChange={(event) => setTextValue(event.target.value)}
              placeholder="Type text, then tap on diagram to place it"
            />
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-gray-700">Color</label>
                <input
                  type="color"
                  value={textColor}
                  onChange={(event) => setTextColor(event.target.value)}
                  className="h-8 w-10 cursor-pointer rounded border border-gray-300 p-1"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-gray-700">Size</label>
                <input
                  type="range"
                  min={12}
                  max={36}
                  value={textSize}
                  onChange={(event) => setTextSize(Number(event.target.value))}
                  className="w-28"
                />
                <span className="text-xs text-gray-600">{textSize}px</span>
              </div>
            </div>
          </div>
        )}
      </Card>

      <div className="relative mx-auto flex w-full justify-center rounded-lg border bg-white p-2 sm:p-4">
        <div className="w-full max-w-[520px]">
          <img ref={imageRef} alt="Peri-Anal surgical diagram" className="hidden" />
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            onPointerLeave={handlePointerCancel}
            className="mx-auto block h-auto w-full max-w-[520px] select-none"
            style={{
              cursor: activeTool ? "crosshair" : "default",
              touchAction: "none",
            }}
          />
        </div>
      </div>
    </div>
  );
};
