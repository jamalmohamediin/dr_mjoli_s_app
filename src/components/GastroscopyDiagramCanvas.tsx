import React from "react";
import { Eraser, Pencil, Type } from "lucide-react";
import { Button } from "@/components/ui/button";

type DiagramTool = "draw" | "text" | "erase";
type TextFontStyle = "regular" | "bold" | "italic";

interface GastroscopyDiagramCanvasProps {
  imageSrc: string;
  initialCanvasImageData?: string;
  onUpdate: (data: { findings: any[]; canvasImageData: string }) => void;
}

const TOOL_BUTTON_BASE = "h-8 px-3 text-xs";
type TextEditorState = {
  canvasX: number;
  canvasY: number;
  xPercent: number;
  yPercent: number;
};

export const GastroscopyDiagramCanvas = ({
  imageSrc,
  initialCanvasImageData,
  onUpdate,
}: GastroscopyDiagramCanvasProps) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const imageRef = React.useRef<HTMLImageElement>(null);
  const isDrawingRef = React.useRef(false);
  const lastPointRef = React.useRef<{ x: number; y: number } | null>(null);
  const loadedSignatureRef = React.useRef("");
  const lastEmittedSignatureRef = React.useRef("");
  const canvasSizedRef = React.useRef(false);
  const textInputRef = React.useRef<HTMLInputElement>(null);

  const [activeTool, setActiveTool] = React.useState<DiagramTool>("draw");
  const [strokeColor, setStrokeColor] = React.useState("#dc2626");
  const [strokeWidth, setStrokeWidth] = React.useState(3);
  const [imageReady, setImageReady] = React.useState(false);
  const [useLegacyCompositeBase, setUseLegacyCompositeBase] = React.useState(false);
  const [textEditor, setTextEditor] = React.useState<TextEditorState | null>(null);
  const [textDraft, setTextDraft] = React.useState("");
  const [textFontSize, setTextFontSize] = React.useState(16);
  const [textFontStyle, setTextFontStyle] = React.useState<TextFontStyle>("regular");
  const [textUnderline, setTextUnderline] = React.useState(false);

  const getCanvasContext = () => canvasRef.current?.getContext("2d") || null;

  const buildCompositeDataUrl = React.useCallback(
    (legacyOverride?: boolean) => {
      const canvas = canvasRef.current;
      const image = imageRef.current;
      if (!canvas) {
        return "";
      }

      const useLegacy = legacyOverride ?? useLegacyCompositeBase;
      if (useLegacy) {
        return canvas.toDataURL("image/png");
      }

      if (!image || !image.naturalWidth || !image.naturalHeight) {
        return canvas.toDataURL("image/png");
      }

      const exportCanvas = document.createElement("canvas");
      exportCanvas.width = canvas.width;
      exportCanvas.height = canvas.height;
      const exportContext = exportCanvas.getContext("2d");
      if (!exportContext) {
        return canvas.toDataURL("image/png");
      }

      exportContext.drawImage(image, 0, 0, exportCanvas.width, exportCanvas.height);
      exportContext.drawImage(canvas, 0, 0, exportCanvas.width, exportCanvas.height);
      return exportCanvas.toDataURL("image/png");
    },
    [useLegacyCompositeBase],
  );

  const emitDiagramUpdate = React.useCallback(
    (legacyOverride?: boolean) => {
      const canvasImageData = buildCompositeDataUrl(legacyOverride);
      lastEmittedSignatureRef.current = canvasImageData;
      onUpdate({
        findings: [],
        canvasImageData,
      });
    },
    [buildCompositeDataUrl, onUpdate],
  );

  const getCanvasPoint = React.useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return { x: 0, y: 0 };
    }

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  }, []);

  const drawSegment = React.useCallback(
    (from: { x: number; y: number }, to: { x: number; y: number }) => {
      const context = getCanvasContext();
      if (!context) return;

      context.save();
      context.lineCap = "round";
      context.lineJoin = "round";
      context.lineWidth = strokeWidth;

      if (activeTool === "erase") {
        context.globalCompositeOperation = "destination-out";
        context.strokeStyle = "rgba(0,0,0,1)";
        context.fillStyle = "rgba(0,0,0,1)";
      } else {
        context.globalCompositeOperation = "source-over";
        context.strokeStyle = strokeColor;
        context.fillStyle = strokeColor;
      }

      if (from.x === to.x && from.y === to.y) {
        context.beginPath();
        context.arc(from.x, from.y, Math.max(1, strokeWidth / 2), 0, Math.PI * 2);
        context.fill();
      } else {
        context.beginPath();
        context.moveTo(from.x, from.y);
        context.lineTo(to.x, to.y);
        context.stroke();
      }

      context.restore();
    },
    [activeTool, strokeColor, strokeWidth],
  );

  const commitTextEditor = React.useCallback(() => {
    if (!textEditor) {
      return;
    }

    const trimmedText = String(textDraft || "").trim();
    if (!trimmedText) {
      setTextEditor(null);
      setTextDraft("");
      return;
    }

    const context = getCanvasContext();
    if (!context) {
      setTextEditor(null);
      setTextDraft("");
      return;
    }

    context.save();
    context.globalCompositeOperation = "source-over";
    context.fillStyle = strokeColor;
    const resolvedFontSize = Math.max(10, textFontSize);
    const fontWeight = textFontStyle === "bold" ? "700" : "400";
    const fontStyle = textFontStyle === "italic" ? "italic" : "normal";
    context.font = `${fontStyle} ${fontWeight} ${resolvedFontSize}px Arial`;
    context.textBaseline = "top";
    context.fillText(trimmedText, textEditor.canvasX, textEditor.canvasY);

    if (textUnderline) {
      const measuredTextWidth = context.measureText(trimmedText).width;
      const underlineY = textEditor.canvasY + resolvedFontSize + 1;
      context.strokeStyle = strokeColor;
      context.lineWidth = Math.max(1, resolvedFontSize / 14);
      context.beginPath();
      context.moveTo(textEditor.canvasX, underlineY);
      context.lineTo(textEditor.canvasX + measuredTextWidth, underlineY);
      context.stroke();
    }
    context.restore();

    setTextEditor(null);
    setTextDraft("");
    emitDiagramUpdate();
  }, [
    emitDiagramUpdate,
    strokeColor,
    textDraft,
    textEditor,
    textFontSize,
    textFontStyle,
    textUnderline,
  ]);

  const cancelTextEditor = React.useCallback(() => {
    setTextEditor(null);
    setTextDraft("");
  }, []);

  const openTextEditorAtPoint = React.useCallback(
    (point: { x: number; y: number }) => {
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
    },
    [],
  );

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

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const point = getCanvasPoint(event);

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

    canvas.setPointerCapture(event.pointerId);
    isDrawingRef.current = true;
    lastPointRef.current = point;
    drawSegment(point, point);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) {
      return;
    }

    event.preventDefault();
    const nextPoint = getCanvasPoint(event);
    const previousPoint = lastPointRef.current || nextPoint;
    drawSegment(previousPoint, nextPoint);
    lastPointRef.current = nextPoint;
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas?.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }

    if (!isDrawingRef.current) {
      return;
    }

    event.preventDefault();
    isDrawingRef.current = false;
    lastPointRef.current = null;
    emitDiagramUpdate();
  };

  const initializeCanvas = React.useCallback(async () => {
    const image = imageRef.current;
    const canvas = canvasRef.current;
    if (!image || !canvas || !image.naturalWidth || !image.naturalHeight) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const incomingSignature = String(initialCanvasImageData || "").trim();
    const canvasNeedsResize =
      !canvasSizedRef.current ||
      canvas.width !== image.naturalWidth ||
      canvas.height !== image.naturalHeight;
    if (canvasNeedsResize) {
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      canvasSizedRef.current = true;
    }

    if (
      incomingSignature === loadedSignatureRef.current ||
      incomingSignature === lastEmittedSignatureRef.current
    ) {
      return;
    }

    loadedSignatureRef.current = incomingSignature;
    context.clearRect(0, 0, canvas.width, canvas.height);

    if (!incomingSignature) {
      setUseLegacyCompositeBase(false);
      return;
    }

    try {
      const existingImage = new Image();
      await new Promise<void>((resolve, reject) => {
        existingImage.onload = () => resolve();
        existingImage.onerror = () => reject(new Error("Failed to load diagram data"));
        existingImage.src = incomingSignature;
      });
      context.drawImage(existingImage, 0, 0, canvas.width, canvas.height);
      setUseLegacyCompositeBase(true);
    } catch (error) {
      setUseLegacyCompositeBase(false);
    }
  }, [initialCanvasImageData]);

  React.useEffect(() => {
    if (!imageReady) return;
    void initializeCanvas();
  }, [imageReady, initializeCanvas]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded-md border border-gray-200 p-3">
        <Button
          type="button"
          variant={activeTool === "draw" ? "default" : "outline"}
          className={TOOL_BUTTON_BASE}
          onClick={() => setActiveTool("draw")}
        >
          <Pencil className="mr-1 h-3.5 w-3.5" />
          Draw
        </Button>
        <Button
          type="button"
          variant={activeTool === "text" ? "default" : "outline"}
          className={TOOL_BUTTON_BASE}
          onClick={() => setActiveTool("text")}
        >
          <Type className="mr-1 h-3.5 w-3.5" />
          Textbox
        </Button>
        <Button
          type="button"
          variant={activeTool === "erase" ? "default" : "outline"}
          className={TOOL_BUTTON_BASE}
          onClick={() => setActiveTool("erase")}
        >
          <Eraser className="mr-1 h-3.5 w-3.5" />
          Erase
        </Button>

        {activeTool !== "erase" ? (
          <label className="ml-2 flex items-center gap-2 text-xs text-gray-700">
            <span>Color</span>
            <input
              type="color"
              value={strokeColor}
              onChange={(event) => setStrokeColor(event.target.value)}
              className="h-8 w-10 rounded border border-gray-300 bg-white"
            />
          </label>
        ) : null}

        <label className="ml-2 flex items-center gap-2 text-xs text-gray-700">
          <span>Thickness</span>
          <input
            type="range"
            min={1}
            max={16}
            value={strokeWidth}
            onChange={(event) => setStrokeWidth(Number(event.target.value))}
            className="w-28"
          />
          <span>{strokeWidth}px</span>
        </label>

        {activeTool === "text" ? (
          <>
            <label className="ml-2 flex items-center gap-2 text-xs text-gray-700">
              <span>Font Size</span>
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
            </label>

            <div className="ml-2 flex flex-wrap items-center gap-2">
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
      </div>

      <div className="relative mx-auto w-full max-w-[480px] overflow-hidden rounded-md border border-gray-200 bg-white">
        <img
          ref={imageRef}
          src={imageSrc}
          alt="Gastroscopy anatomy"
          className="block h-auto w-full select-none"
          draggable={false}
          onLoad={() => setImageReady(true)}
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full touch-none"
          style={{
            touchAction: "none",
            cursor: activeTool === "text" ? "text" : "crosshair",
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerUp}
          aria-label="Gastroscopy diagram drawing surface"
          role="img"
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

      <p className="text-xs text-gray-500">
        Select a tool, then draw, erase, or place text directly on the diagram using touch, pen, or mouse.
      </p>
    </div>
  );
};
