import React from "react";
import { Eraser, Pencil, Type } from "lucide-react";
import { Button } from "@/components/ui/button";

type DiagramTool = "draw" | "text" | "erase";
type TextFontStyle = "regular" | "bold" | "italic";

type TextAnnotation = {
  id: string;
  text: string;
  xPercent: number;
  yPercent: number;
  color: string;
  fontSize: number;
  fontStyle: TextFontStyle;
  underline: boolean;
};

interface GastroscopyDiagramCanvasProps {
  imageSrc: string;
  initialCanvasImageData?: string;
  initialDrawingImageData?: string;
  initialTextAnnotations?: TextAnnotation[];
  onUpdate: (data: {
    findings: any[];
    drawingImageData: string;
    textAnnotations: TextAnnotation[];
    canvasImageData: string;
  }) => void;
}

type TextEditorState = {
  xPercent: number;
  yPercent: number;
};

type DragState = {
  id: string;
  offsetXPercent: number;
  offsetYPercent: number;
};

const TOOL_BUTTON_BASE = "h-8 px-3 text-xs";

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const normalizeTextAnnotations = (value: unknown): TextAnnotation[] =>
  Array.isArray(value)
    ? value
        .map((entry, index) => {
          const candidate = entry as Partial<TextAnnotation>;
          const text = String(candidate?.text || "").trim();
          if (!text) {
            return null;
          }

          return {
            id: String(candidate?.id || `text-${index}`),
            text,
            xPercent: Number(candidate?.xPercent ?? 0),
            yPercent: Number(candidate?.yPercent ?? 0),
            color: String(candidate?.color || "#dc2626"),
            fontSize: Number(candidate?.fontSize || 32),
            fontStyle:
              candidate?.fontStyle === "bold" || candidate?.fontStyle === "italic"
                ? candidate.fontStyle
                : "regular",
            underline: Boolean(candidate?.underline),
          };
        })
        .filter((entry): entry is TextAnnotation => Boolean(entry))
    : [];

export const GastroscopyDiagramCanvas = ({
  imageSrc,
  initialCanvasImageData,
  initialDrawingImageData,
  initialTextAnnotations,
  onUpdate,
}: GastroscopyDiagramCanvasProps) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const imageRef = React.useRef<HTMLImageElement>(null);
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const textInputRef = React.useRef<HTMLInputElement>(null);
  const isDrawingRef = React.useRef(false);
  const lastPointRef = React.useRef<{ x: number; y: number } | null>(null);
  const canvasSizedRef = React.useRef(false);
  const loadedTextSignatureRef = React.useRef("");
  const lastEmittedDrawingSignatureRef = React.useRef("");
  const lastEmittedCompositeSignatureRef = React.useRef("");
  const lastEmittedTextSignatureRef = React.useRef("");

  const [activeTool, setActiveTool] = React.useState<DiagramTool>("draw");
  const [strokeColor, setStrokeColor] = React.useState("#dc2626");
  const [strokeWidth, setStrokeWidth] = React.useState(3);
  const [imageReady, setImageReady] = React.useState(false);
  const [useLegacyCompositeBase, setUseLegacyCompositeBase] = React.useState(false);
  const [textEditor, setTextEditor] = React.useState<TextEditorState | null>(null);
  const [textDraft, setTextDraft] = React.useState("");
  const [textFontSize, setTextFontSize] = React.useState(32);
  const [textFontStyle, setTextFontStyle] = React.useState<TextFontStyle>("regular");
  const [textUnderline, setTextUnderline] = React.useState(false);
  const [textAnnotations, setTextAnnotations] = React.useState<TextAnnotation[]>(
    normalizeTextAnnotations(initialTextAnnotations),
  );
  const [dragState, setDragState] = React.useState<DragState | null>(null);
  const textAnnotationsRef = React.useRef<TextAnnotation[]>(
    normalizeTextAnnotations(initialTextAnnotations),
  );

  const getCanvasContext = () => canvasRef.current?.getContext("2d") || null;

  const getWrapperPercentPoint = React.useCallback((clientX: number, clientY: number) => {
    const wrapper = wrapperRef.current;
    if (!wrapper) {
      return { xPercent: 0, yPercent: 0 };
    }

    const rect = wrapper.getBoundingClientRect();
    return {
      xPercent: clamp(((clientX - rect.left) / rect.width) * 100, 0, 99),
      yPercent: clamp(((clientY - rect.top) / rect.height) * 100, 0, 99),
    };
  }, []);

  const getCanvasPoint = React.useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
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
    },
    [],
  );

  const drawAnnotationToContext = React.useCallback(
    (context: CanvasRenderingContext2D, annotation: TextAnnotation, width: number, height: number) => {
      const x = (annotation.xPercent / 100) * width;
      const y = (annotation.yPercent / 100) * height;
      const resolvedFontSize = Math.max(18, Number(annotation.fontSize) || 32);
      const fontWeight = annotation.fontStyle === "bold" ? "700" : "400";
      const fontStyle = annotation.fontStyle === "italic" ? "italic" : "normal";

      context.save();
      context.globalCompositeOperation = "source-over";
      context.fillStyle = annotation.color;
      context.font = `${fontStyle} ${fontWeight} ${resolvedFontSize}px Arial`;
      context.textBaseline = "top";
      context.fillText(annotation.text, x, y);

      if (annotation.underline) {
        const measuredWidth = context.measureText(annotation.text).width;
        const underlineY = y + resolvedFontSize + 1;
        context.strokeStyle = annotation.color;
        context.lineWidth = Math.max(1, resolvedFontSize / 14);
        context.beginPath();
        context.moveTo(x, underlineY);
        context.lineTo(x + measuredWidth, underlineY);
        context.stroke();
      }

      context.restore();
    },
    [],
  );

  React.useEffect(() => {
    textAnnotationsRef.current = textAnnotations;
  }, [textAnnotations]);

  const buildCompositeDataUrl = React.useCallback((annotationsOverride?: TextAnnotation[]) => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    const annotations = annotationsOverride || textAnnotationsRef.current;
    if (!canvas) {
      return "";
    }

    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const exportContext = exportCanvas.getContext("2d");
    if (!exportContext) {
      return "";
    }

    if (useLegacyCompositeBase) {
      exportContext.drawImage(canvas, 0, 0, exportCanvas.width, exportCanvas.height);
    } else {
      if (image && image.naturalWidth && image.naturalHeight) {
        exportContext.drawImage(image, 0, 0, exportCanvas.width, exportCanvas.height);
      }
      exportContext.drawImage(canvas, 0, 0, exportCanvas.width, exportCanvas.height);
    }

    annotations.forEach((annotation) => {
      drawAnnotationToContext(exportContext, annotation, exportCanvas.width, exportCanvas.height);
    });

    return exportCanvas.toDataURL("image/png");
  }, [drawAnnotationToContext, useLegacyCompositeBase]);

  const emitDiagramUpdate = React.useCallback((annotationsOverride?: TextAnnotation[]) => {
    const canvas = canvasRef.current;
    const drawingImageData =
      canvas && !useLegacyCompositeBase ? canvas.toDataURL("image/png") : "";
    const normalizedAnnotations = normalizeTextAnnotations(
      annotationsOverride || textAnnotationsRef.current,
    );
    const canvasImageData = buildCompositeDataUrl(normalizedAnnotations);

    lastEmittedDrawingSignatureRef.current = drawingImageData;
    lastEmittedTextSignatureRef.current = JSON.stringify(normalizedAnnotations);
    lastEmittedCompositeSignatureRef.current = canvasImageData;

    onUpdate({
      findings: [],
      drawingImageData,
      textAnnotations: normalizedAnnotations,
      canvasImageData,
    });
  }, [buildCompositeDataUrl, onUpdate, useLegacyCompositeBase]);

  const drawSegment = React.useCallback(
    (from: { x: number; y: number }, to: { x: number; y: number }) => {
      const context = getCanvasContext();
      if (!context) {
        return;
      }

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

  const hydrateCanvas = React.useCallback(async () => {
    const image = imageRef.current;
    const canvas = canvasRef.current;
    if (!image || !canvas || !image.naturalWidth || !image.naturalHeight) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const incomingDrawingSignature = String(initialDrawingImageData || "").trim();
    const incomingCompositeSignature = String(initialCanvasImageData || "").trim();

    const canvasNeedsResize =
      !canvasSizedRef.current ||
      canvas.width !== image.naturalWidth ||
      canvas.height !== image.naturalHeight;

    if (canvasNeedsResize) {
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      canvasSizedRef.current = true;
    }

    const drawingWasJustEmitted =
      incomingDrawingSignature &&
      incomingDrawingSignature === lastEmittedDrawingSignatureRef.current;
    const compositeWasJustEmitted =
      incomingCompositeSignature &&
      incomingCompositeSignature === lastEmittedCompositeSignatureRef.current;

    if (drawingWasJustEmitted || compositeWasJustEmitted) {
      return;
    }

    context.clearRect(0, 0, canvas.width, canvas.height);

    if (incomingDrawingSignature) {
      setUseLegacyCompositeBase(false);

      try {
        const drawingImage = new Image();
        await new Promise<void>((resolve, reject) => {
          drawingImage.onload = () => resolve();
          drawingImage.onerror = () => reject(new Error("Failed to load diagram drawing"));
          drawingImage.src = incomingDrawingSignature;
        });
        context.drawImage(drawingImage, 0, 0, canvas.width, canvas.height);
      } catch (error) {
        context.clearRect(0, 0, canvas.width, canvas.height);
      }

      return;
    }

    if (incomingCompositeSignature) {
      setUseLegacyCompositeBase(true);

      try {
        const compositeImage = new Image();
        await new Promise<void>((resolve, reject) => {
          compositeImage.onload = () => resolve();
          compositeImage.onerror = () => reject(new Error("Failed to load composite diagram"));
          compositeImage.src = incomingCompositeSignature;
        });
        context.drawImage(compositeImage, 0, 0, canvas.width, canvas.height);
      } catch (error) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        setUseLegacyCompositeBase(false);
      }

      return;
    }

    setUseLegacyCompositeBase(false);
  }, [initialCanvasImageData, initialDrawingImageData]);

  React.useEffect(() => {
    if (!imageReady) {
      return;
    }

    void hydrateCanvas();
  }, [hydrateCanvas, imageReady]);

  React.useEffect(() => {
    const incomingAnnotations = normalizeTextAnnotations(initialTextAnnotations);
    const incomingSignature = JSON.stringify(incomingAnnotations);

    if (!incomingSignature) {
      loadedTextSignatureRef.current = "";
    }

    if (
      incomingSignature === loadedTextSignatureRef.current ||
      incomingSignature === lastEmittedTextSignatureRef.current
    ) {
      return;
    }

    loadedTextSignatureRef.current = incomingSignature;
    textAnnotationsRef.current = incomingAnnotations;
    setTextAnnotations(incomingAnnotations);
  }, [initialTextAnnotations]);

  React.useEffect(() => {
    if (!dragState) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      const point = getWrapperPercentPoint(event.clientX, event.clientY);
      setTextAnnotations((previous) => {
        const nextAnnotations = previous.map((annotation) =>
          annotation.id === dragState.id
            ? {
                ...annotation,
                xPercent: clamp(point.xPercent - dragState.offsetXPercent, 0, 96),
                yPercent: clamp(point.yPercent - dragState.offsetYPercent, 0, 96),
              }
            : annotation,
        );
        textAnnotationsRef.current = nextAnnotations;
        return nextAnnotations;
      });
    };

    const handlePointerUp = () => {
      setDragState(null);
      emitDiagramUpdate();
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [dragState, emitDiagramUpdate, getWrapperPercentPoint]);

  const openTextEditorAtPoint = React.useCallback(
    (point: { xPercent: number; yPercent: number }) => {
      setTextEditor(point);
      setTextDraft("");

      window.setTimeout(() => {
        textInputRef.current?.focus();
      }, 0);
    },
    [],
  );

  const cancelTextEditor = React.useCallback(() => {
    setTextEditor(null);
    setTextDraft("");
  }, []);

  const commitTextEditor = React.useCallback(() => {
    if (!textEditor) {
      return;
    }

    const trimmedText = String(textDraft || "").trim();
    setTextEditor(null);
    setTextDraft("");

    if (!trimmedText) {
      return;
    }

    const nextAnnotation: TextAnnotation = {
      id: `text-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text: trimmedText,
      xPercent: textEditor.xPercent,
      yPercent: textEditor.yPercent,
      color: strokeColor,
      fontSize: Math.max(18, textFontSize),
      fontStyle: textFontStyle,
      underline: textUnderline,
    };

    const nextAnnotations = [...textAnnotationsRef.current, nextAnnotation];
    textAnnotationsRef.current = nextAnnotations;
    setTextAnnotations(nextAnnotations);
    window.setTimeout(() => {
      emitDiagramUpdate(nextAnnotations);
    }, 0);
  }, [
    emitDiagramUpdate,
    strokeColor,
    textDraft,
    textEditor,
    textFontSize,
    textFontStyle,
    textUnderline,
  ]);

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
    if (!canvas) {
      return;
    }

    const canvasPoint = getCanvasPoint(event);
    const wrapperPoint = getWrapperPercentPoint(event.clientX, event.clientY);

    if (activeTool === "text") {
      if (textEditor) {
        commitTextEditor();
      }
      openTextEditorAtPoint(wrapperPoint);
      return;
    }

    if (textEditor) {
      commitTextEditor();
    }

    canvas.setPointerCapture(event.pointerId);
    isDrawingRef.current = true;
    lastPointRef.current = canvasPoint;
    drawSegment(canvasPoint, canvasPoint);
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

  const handleAnnotationPointerDown = (event: React.PointerEvent<HTMLDivElement>, annotation: TextAnnotation) => {
    if (activeTool !== "text") {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    if (textEditor) {
      commitTextEditor();
    }

    const point = getWrapperPercentPoint(event.clientX, event.clientY);
    setDragState({
      id: annotation.id,
      offsetXPercent: point.xPercent - annotation.xPercent,
      offsetYPercent: point.yPercent - annotation.yPercent,
    });
  };

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
                {[24, 28, 32, 36, 40, 48, 56, 64].map((size) => (
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

      <div
        ref={wrapperRef}
        className="relative mx-auto w-full max-w-[520px] overflow-hidden rounded-md border border-gray-200 bg-white"
      >
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

        {textAnnotations.map((annotation) => (
          <div
            key={annotation.id}
            className="absolute z-10 whitespace-nowrap select-none"
            style={{
              left: `${annotation.xPercent}%`,
              top: `${annotation.yPercent}%`,
              color: annotation.color,
              fontSize: `${annotation.fontSize}px`,
              fontWeight: annotation.fontStyle === "bold" ? 700 : 400,
              fontStyle: annotation.fontStyle === "italic" ? "italic" : "normal",
              textDecoration: annotation.underline ? "underline" : "none",
              cursor: activeTool === "text" ? "move" : "default",
              pointerEvents: activeTool === "text" ? "auto" : "none",
              transform: "translate(0, 0)",
              lineHeight: 1.1,
              textShadow: "0 1px 2px rgba(255,255,255,0.95)",
            }}
            onPointerDown={(event) => handleAnnotationPointerDown(event, annotation)}
          >
            {annotation.text}
          </div>
        ))}

        {textEditor ? (
          <input
            ref={textInputRef}
            type="text"
            value={textDraft}
            onChange={(event) => setTextDraft(event.target.value)}
            onBlur={commitTextEditor}
            onKeyDown={handleTextEditorKeyDown}
            className="absolute z-20 h-10 min-w-[180px] max-w-[260px] rounded border border-gray-300 bg-white px-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
            style={{
              left: `${textEditor.xPercent}%`,
              top: `${textEditor.yPercent}%`,
              fontSize: `${Math.max(18, textFontSize)}px`,
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
        Use the text tool to place labels, then drag them to reposition them before export.
      </p>
    </div>
  );
};
