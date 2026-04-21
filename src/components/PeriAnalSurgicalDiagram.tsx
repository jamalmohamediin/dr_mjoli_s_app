import React, { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Eraser, Pencil, Type } from "lucide-react";
import { getSurgicalDiagramMarkingMetrics } from "@/utils/surgicalDiagramMarkings";

type DiagramTool = "draw" | "text" | "erase";
type TextFontStyle = "regular" | "bold" | "italic";

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
  fontStyle?: TextFontStyle;
  fontWeight?: string;
  underline?: boolean;
};

type PeriAnalMarking = DrawStrokeMarking | TextBoxMarking | any;

type TextEditorState = {
  canvasX: number;
  canvasY: number;
  xPercent: number;
  yPercent: number;
};

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
  const textInputRef = useRef<HTMLInputElement>(null);
  const serializedInitialMarkings = JSON.stringify(initialMarkings || []);
  const lastCommittedMarkingsRef = useRef(serializedInitialMarkings);
  const previousDiagramImageRef = useRef(diagramImage);

  const [markings, setMarkings] = useState<PeriAnalMarking[]>(initialMarkings || []);
  const [draftStroke, setDraftStroke] = useState<DrawStrokeMarking | null>(null);
  const [activeTool, setActiveTool] = useState<DiagramTool>("draw");
  const [strokeColor, setStrokeColor] = useState("#111111");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [textFontSize, setTextFontSize] = useState(16);
  const [textFontStyle, setTextFontStyle] = useState<TextFontStyle>("regular");
  const [textUnderline, setTextUnderline] = useState(false);
  const [textEditor, setTextEditor] = useState<TextEditorState | null>(null);
  const [textDraft, setTextDraft] = useState("");
  const drawingMetrics = getSurgicalDiagramMarkingMetrics(markingScale);

  const getCanvasCoordinatesFromPoint = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }, []);

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

    const size = Number(mark.size) > 0 ? Number(mark.size) : 16;
    const fontWeight = mark.fontWeight || (mark.fontStyle === "bold" ? "700" : "400");
    const fontStyle = mark.fontStyle === "italic" ? "italic" : "normal";

    ctx.save();
    ctx.fillStyle = mark.color || "#111111";
    ctx.font = `${fontStyle} ${fontWeight} ${size}px Arial`;
    ctx.textBaseline = "top";
    ctx.fillText(mark.text, mark.x, mark.y);

    if (mark.underline) {
      const measuredTextWidth = ctx.measureText(mark.text).width;
      const underlineY = mark.y + size + 1;
      ctx.strokeStyle = mark.color || "#111111";
      ctx.lineWidth = Math.max(1, size / 14);
      ctx.beginPath();
      ctx.moveTo(mark.x, underlineY);
      ctx.lineTo(mark.x + measuredTextWidth, underlineY);
      ctx.stroke();
    }

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
    setTextEditor(null);
    setTextDraft("");
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
      const size = Number(mark.size) > 0 ? Number(mark.size) : 16;
      const text = String(mark.text || "");
      const width = Math.max(20, text.length * size * 0.56);
      const height = size * 1.2 + (mark.underline ? 2 : 0);
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

  const commitTextEditor = useCallback(() => {
    if (!textEditor) return;

    const trimmedText = String(textDraft || "").trim();
    if (!trimmedText) {
      setTextEditor(null);
      setTextDraft("");
      return;
    }

    const fontWeight = textFontStyle === "bold" ? "700" : "400";
    const nextMarkings = [
      ...markings,
      {
        id: createMarkingId(),
        type: "textBox",
        color: strokeColor,
        size: Math.max(10, textFontSize),
        text: trimmedText,
        x: textEditor.canvasX,
        y: textEditor.canvasY,
        fontStyle: textFontStyle,
        fontWeight,
        underline: textUnderline,
      } as TextBoxMarking,
    ];

    commitMarkings(nextMarkings);
    setTextEditor(null);
    setTextDraft("");
  }, [
    markings,
    strokeColor,
    textDraft,
    textEditor,
    textFontSize,
    textFontStyle,
    textUnderline,
  ]);

  const cancelTextEditor = useCallback(() => {
    setTextEditor(null);
    setTextDraft("");
  }, []);

  const openTextEditorAtPoint = useCallback((point: Point) => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.width || !canvas.height) {
      return;
    }

    setTextEditor({
      canvasX: point.x,
      canvasY: point.y,
      xPercent: (point.x / canvas.width) * 100,
      yPercent: (point.y / canvas.height) * 100,
    });
    setTextDraft("");

    window.setTimeout(() => {
      textInputRef.current?.focus();
    }, 0);
  }, []);

  const handleTextEditorKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commitTextEditor();
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      cancelTextEditor();
    }
  };

  const finishStroke = useCallback(() => {
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
        color: strokeColor,
        width: strokeWidth,
        points: drawingStrokeRef.current,
      } as DrawStrokeMarking,
    ];
    commitMarkings(nextMarkings);
    isDrawingRef.current = false;
    drawingStrokeRef.current = null;
    setDraftStroke(null);
  }, [markings, strokeColor, strokeWidth]);

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const point = getCanvasCoordinatesFromPoint(event.clientX, event.clientY);

    if (activeTool === "text") {
      if (textEditor) {
        commitTextEditor();
      }
      openTextEditorAtPoint(point);
      return;
    }

    if (textEditor) {
      commitTextEditor();
    }

    if (activeTool === "erase") {
      eraseAtPoint(point);
      return;
    }

    event.currentTarget.setPointerCapture?.(event.pointerId);
    isDrawingRef.current = true;
    drawingStrokeRef.current = [point];
    setDraftStroke({
      id: "draft",
      type: "drawStroke",
      color: strokeColor,
      width: strokeWidth,
      points: [point],
    });
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
      color: strokeColor,
      width: strokeWidth,
      points: drawingStrokeRef.current,
    });
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
    finishStroke();
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  };

  useEffect(() => {
    if (activeTool !== "text" && textEditor) {
      commitTextEditor();
    }
  }, [activeTool, textEditor, commitTextEditor]);

  return (
    <div className="space-y-4">
      <Card className="mx-auto flex w-full max-w-2xl flex-col gap-3 p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-start">
        <Button
          type="button"
          onClick={() => setActiveTool("draw")}
          variant={activeTool === "draw" ? "default" : "outline"}
          className="w-full sm:w-auto"
        >
          <Pencil className="mr-2 h-4 w-4" />
          Draw
        </Button>
        <Button
          type="button"
          onClick={() => setActiveTool("text")}
          variant={activeTool === "text" ? "default" : "outline"}
          className="w-full sm:w-auto"
        >
          <Type className="mr-2 h-4 w-4" />
          Textbox
        </Button>
        <Button
          type="button"
          onClick={() => setActiveTool("erase")}
          variant={activeTool === "erase" ? "default" : "outline"}
          className="w-full sm:w-auto"
        >
          <Eraser className="mr-2 h-4 w-4" />
          Erase
        </Button>

        {activeTool !== "erase" ? (
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-700">Color</label>
            <input
              type="color"
              value={strokeColor}
              onChange={(event) => setStrokeColor(event.target.value)}
              className="h-8 w-10 cursor-pointer rounded border border-gray-300 bg-white p-1"
            />
          </div>
        ) : null}

        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-700">Thickness</label>
          <input
            type="range"
            min={1}
            max={16}
            value={strokeWidth}
            onChange={(event) => setStrokeWidth(Number(event.target.value))}
            className="w-28"
          />
          <span className="text-xs text-gray-600">{strokeWidth}px</span>
        </div>

        {activeTool === "text" ? (
          <>
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-700">Font Size</label>
              <select
                value={textFontSize}
                onChange={(event) => setTextFontSize(Number(event.target.value))}
                className="h-8 rounded border border-gray-300 bg-white px-2 text-xs"
              >
                {[12, 14, 16, 18, 20, 24, 28, 32].map((size) => (
                  <option key={size} value={size}>
                    {size}px
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant={textFontStyle === "regular" ? "default" : "outline"}
                className="h-8 px-2 text-xs"
                onClick={() => setTextFontStyle("regular")}
              >
                Regular
              </Button>
              <Button
                type="button"
                variant={textFontStyle === "bold" ? "default" : "outline"}
                className="h-8 px-2 text-xs font-semibold"
                onClick={() => setTextFontStyle("bold")}
              >
                Bold
              </Button>
              <Button
                type="button"
                variant={textFontStyle === "italic" ? "default" : "outline"}
                className="h-8 px-2 text-xs italic"
                onClick={() => setTextFontStyle("italic")}
              >
                Italic
              </Button>
              <Button
                type="button"
                variant={textUnderline ? "default" : "outline"}
                className="h-8 px-2 text-xs underline"
                onClick={() => setTextUnderline((previous) => !previous)}
              >
                Underline
              </Button>
            </div>
          </>
        ) : null}
      </Card>

      <div className="relative mx-auto flex w-full justify-center rounded-lg border bg-white p-2 sm:p-4">
        <div className="relative w-full max-w-[520px]">
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
              cursor: activeTool === "text" ? "text" : "crosshair",
              touchAction: "none",
            }}
          />
          {textEditor ? (
            <input
              ref={textInputRef}
              type="text"
              value={textDraft}
              onChange={(event) => setTextDraft(event.target.value)}
              onBlur={commitTextEditor}
              onKeyDown={handleTextEditorKeyDown}
              className="absolute z-10 h-8 min-w-[140px] max-w-[220px] rounded border border-gray-300 bg-white px-2 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
              style={{
                left: `${textEditor.xPercent}%`,
                top: `${textEditor.yPercent}%`,
                transform: "translate(-1px, -1px)",
                fontSize: `${Math.max(12, textFontSize)}px`,
                fontWeight: textFontStyle === "bold" ? 700 : 400,
                fontStyle: textFontStyle === "italic" ? "italic" : "normal",
                textDecoration: textUnderline ? "underline" : "none",
              }}
              placeholder="Type text..."
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              autoComplete="off"
            />
          ) : null}
        </div>
      </div>

      <p className="text-xs text-gray-500">
        Select a tool, then draw, erase, or place text directly on the diagram using touch, pen, or mouse.
      </p>
    </div>
  );
};

