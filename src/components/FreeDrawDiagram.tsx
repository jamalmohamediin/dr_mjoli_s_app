import React, { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

type DiagramMode = "draw" | "textbox" | "erase";

interface PathPoint {
  x: number;
  y: number;
}

interface DrawPath {
  points: PathPoint[];
  color: string;
  width: number;
  erase?: boolean;
}

interface TextAnnotation {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  size: number;
  fontWeight: "normal" | "bold";
  fontStyle: "normal" | "italic";
  underline: boolean;
}

interface DraftTextAnnotation extends TextAnnotation {}

interface DiagramLegendItem {
  color: string;
  label: string;
}

interface FreeDrawDiagramUpdate {
  findings: any[];
  canvasImageData: string;
  legendItems?: DiagramLegendItem[];
}

interface FreeDrawDiagramProps {
  backgroundImage: string;
  initialCanvasImageData?: string;
  initialLegendItems?: DiagramLegendItem[];
  maxHeight?: number;
  maxWidth?: number;
  onUpdate: (data: FreeDrawDiagramUpdate) => void;
  enableDrawColorLegend?: boolean;
  allowTextOutsideDiagram?: boolean;
}

const DEFAULT_CANVAS_WIDTH = 1200;
const DEFAULT_CANVAS_HEIGHT = 800;
const DEFAULT_OUTSIDE_TEXT_PADDING = 120;
const TEXT_SIZE_OPTIONS = [32, 36, 40, 44, 48, 56, 64];

const normalizeColor = (value: string) => {
  const raw = String(value || "").trim();
  if (!raw) {
    return "";
  }

  const normalized = raw.toLowerCase();
  const shortHexMatch = normalized.match(/^#([0-9a-f]{3})$/i);
  if (shortHexMatch) {
    const [r, g, b] = shortHexMatch[1].split("");
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }

  const fullHexMatch = normalized.match(/^#([0-9a-f]{6})$/i);
  if (fullHexMatch) {
    return `#${fullHexMatch[1].toLowerCase()}`;
  }

  return normalized;
};

const toLegendItemsMap = (items?: DiagramLegendItem[]) => {
  const next: Record<string, string> = {};
  (items || []).forEach((item) => {
    const color = normalizeColor(item?.color || "");
    const label = String(item?.label || "").trim();
    if (!color || !label) {
      return;
    }

    next[color] = label;
  });
  return next;
};

export const FreeDrawDiagram = ({
  backgroundImage,
  initialCanvasImageData,
  initialLegendItems,
  maxHeight,
  maxWidth = 480,
  onUpdate,
  enableDrawColorLegend = false,
  allowTextOutsideDiagram = false,
}: FreeDrawDiagramProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const baseImageRef = useRef<HTMLImageElement | null>(null);
  const lastEmittedImageRef = useRef<string>("");
  const initializedFromSavedMarkupRef = useRef(
    Boolean(String(initialCanvasImageData || "").trim()),
  );

  const [mode, setMode] = useState<DiagramMode>("draw");
  const [strokeColor, setStrokeColor] = useState("#e11d48");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [textSize, setTextSize] = useState(40);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [draggingTextId, setDraggingTextId] = useState<string | null>(null);
  const [paths, setPaths] = useState<DrawPath[]>([]);
  const [currentPath, setCurrentPath] = useState<DrawPath | null>(null);
  const [textAnnotations, setTextAnnotations] = useState<TextAnnotation[]>([]);
  const [draftTextAnnotation, setDraftTextAnnotation] = useState<DraftTextAnnotation | null>(null);
  const [imageReady, setImageReady] = useState(false);
  const textDragOffsetRef = useRef({ x: 0, y: 0 });
  const [canvasSize, setCanvasSize] = useState({
    width: DEFAULT_CANVAS_WIDTH,
    height: DEFAULT_CANVAS_HEIGHT,
  });
  const [isPaddedBaseImage, setIsPaddedBaseImage] = useState(false);
  const [legendLabelsByColor, setLegendLabelsByColor] = useState<
    Record<string, string>
  >(() => toLegendItemsMap(initialLegendItems));
  const [baseImageSource, setBaseImageSource] = useState(() => {
    const initial = String(initialCanvasImageData || "").trim();
    return initial || backgroundImage;
  });

  useEffect(() => {
    const incoming = String(initialCanvasImageData || "").trim();

    if (incoming && incoming === lastEmittedImageRef.current) {
      return;
    }

    initializedFromSavedMarkupRef.current = Boolean(incoming);
    const nextSource = incoming || backgroundImage;
    setBaseImageSource((prev) => (prev === nextSource ? prev : nextSource));
    setIsPaddedBaseImage(false);
    setLegendLabelsByColor(toLegendItemsMap(initialLegendItems));
    setPaths([]);
    setCurrentPath(null);
    setTextAnnotations([]);
    setDraftTextAnnotation(null);
    setDraggingTextId(null);
    setIsDrawing(false);
  }, [backgroundImage, initialCanvasImageData, initialLegendItems]);

  useEffect(() => {
    setImageReady(false);
    const image = new Image();
    image.onload = () => {
      const shouldPadBackgroundImage =
        allowTextOutsideDiagram &&
        !initializedFromSavedMarkupRef.current &&
        !isPaddedBaseImage &&
        baseImageSource === backgroundImage;

      if (shouldPadBackgroundImage) {
        const pad = DEFAULT_OUTSIDE_TEXT_PADDING;
        const sourceWidth = image.naturalWidth || DEFAULT_CANVAS_WIDTH;
        const sourceHeight = image.naturalHeight || DEFAULT_CANVAS_HEIGHT;
        const paddedCanvas = document.createElement("canvas");
        paddedCanvas.width = sourceWidth + pad * 2;
        paddedCanvas.height = sourceHeight + pad * 2;
        const paddedContext = paddedCanvas.getContext("2d");
        if (paddedContext) {
          paddedContext.fillStyle = "#ffffff";
          paddedContext.fillRect(0, 0, paddedCanvas.width, paddedCanvas.height);
          paddedContext.drawImage(image, pad, pad, sourceWidth, sourceHeight);
          setIsPaddedBaseImage(true);
          setBaseImageSource(paddedCanvas.toDataURL("image/png"));
          return;
        }
      }

      baseImageRef.current = image;
      setCanvasSize({
        width: image.naturalWidth || DEFAULT_CANVAS_WIDTH,
        height: image.naturalHeight || DEFAULT_CANVAS_HEIGHT,
      });
      setImageReady(true);
    };
    image.onerror = () => {
      setImageReady(false);
    };
    image.src = baseImageSource;
  }, [allowTextOutsideDiagram, backgroundImage, baseImageSource, isPaddedBaseImage]);

  const normalizedLegendItems = Object.entries(legendLabelsByColor)
    .map(([color, label]) => ({
      color: normalizeColor(color),
      label: String(label || "").trim(),
    }))
    .filter((item) => item.color && item.label);

  const getCanvasCoordinates = (event: React.PointerEvent<HTMLCanvasElement>) => {
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
  };

  const getTextAnnotationBounds = useCallback((annotation: TextAnnotation) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const lines = String(annotation.text || "").split(/\r?\n/);
    const lineHeight = Math.max(annotation.size * 1.25, 14);

    if (!ctx) {
      return {
        left: annotation.x - 4,
        top: annotation.y - 4,
        right: annotation.x + 220,
        bottom: annotation.y + lines.length * lineHeight + 4,
      };
    }

    ctx.save();
    ctx.font = `${annotation.fontStyle} ${annotation.fontWeight} ${annotation.size}px Arial`;
    const textWidth = lines.reduce((maxWidth, line) => Math.max(maxWidth, ctx.measureText(line).width), 0);
    ctx.restore();

    const padding = Math.max(4, annotation.size * 0.08);
    return {
      left: annotation.x - padding,
      top: annotation.y - padding,
      right: annotation.x + textWidth + padding,
      bottom: annotation.y + lines.length * lineHeight + padding,
    };
  }, []);

  const fitTextAnnotationWithinCanvas = useCallback(
    (annotation: TextAnnotation): TextAnnotation => {
      const bounds = getTextAnnotationBounds(annotation);
      const padding = 2;
      let nextX = annotation.x;
      let nextY = annotation.y;

      if (bounds.left < padding) {
        nextX += padding - bounds.left;
      }
      if (bounds.right > canvasSize.width - padding) {
        nextX -= bounds.right - (canvasSize.width - padding);
      }
      if (bounds.top < padding) {
        nextY += padding - bounds.top;
      }
      if (bounds.bottom > canvasSize.height - padding) {
        nextY -= bounds.bottom - (canvasSize.height - padding);
      }

      return {
        ...annotation,
        x: Math.max(0, Math.min(canvasSize.width, nextX)),
        y: Math.max(0, Math.min(canvasSize.height, nextY)),
      };
    },
    [canvasSize.height, canvasSize.width, getTextAnnotationBounds],
  );

  const findTextAnnotationAtPoint = useCallback(
    (point: { x: number; y: number }) => {
      for (let index = textAnnotations.length - 1; index >= 0; index -= 1) {
        const annotation = textAnnotations[index];
        const bounds = getTextAnnotationBounds(annotation);
        if (
          point.x >= bounds.left &&
          point.x <= bounds.right &&
          point.y >= bounds.top &&
          point.y <= bounds.bottom
        ) {
          return annotation;
        }
      }

      return null;
    },
    [getTextAnnotationBounds, textAnnotations],
  );

  const redrawOverlay = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const drawPath = (path: DrawPath) => {
      if (!path.points.length) {
        return;
      }

      ctx.save();
      ctx.globalCompositeOperation = path.erase ? "destination-out" : "source-over";
      ctx.strokeStyle = path.erase ? "rgba(0,0,0,1)" : path.color;
      ctx.lineWidth = path.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(path.points[0].x, path.points[0].y);
      for (let index = 1; index < path.points.length; index += 1) {
        ctx.lineTo(path.points[index].x, path.points[index].y);
      }
      ctx.stroke();
      ctx.restore();
    };

    paths.forEach(drawPath);
    if (currentPath) {
      drawPath(currentPath);
    }

    textAnnotations.forEach((annotation) => {
      ctx.save();
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = annotation.color;
      ctx.font = `${annotation.fontStyle} ${annotation.fontWeight} ${annotation.size}px Arial`;
      ctx.textBaseline = "top";
      const lines = String(annotation.text || "").split(/\r?\n/);
      const lineHeight = Math.max(annotation.size * 1.25, 14);
      lines.forEach((line, lineIndex) => {
        const lineY = annotation.y + lineIndex * lineHeight;
        ctx.fillText(line, annotation.x, lineY);
        if (annotation.underline) {
          const measuredWidth = ctx.measureText(line).width;
          const underlineY = lineY + annotation.size + 1;
          ctx.beginPath();
          ctx.moveTo(annotation.x, underlineY);
          ctx.lineTo(annotation.x + measuredWidth, underlineY);
          ctx.lineWidth = Math.max(1, annotation.size / 14);
          ctx.strokeStyle = annotation.color;
          ctx.stroke();
        }
      });
      ctx.restore();
    });
  }, [paths, currentPath, textAnnotations]);

  const emitCanvasUpdate = useCallback(() => {
    const overlayCanvas = canvasRef.current;
    const baseImage = baseImageRef.current;
    if (!overlayCanvas || !baseImage || !imageReady) {
      return;
    }

    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = canvasSize.width;
    exportCanvas.height = canvasSize.height;

    const exportCtx = exportCanvas.getContext("2d");
    if (!exportCtx) {
      return;
    }

    exportCtx.drawImage(baseImage, 0, 0, exportCanvas.width, exportCanvas.height);
    exportCtx.drawImage(overlayCanvas, 0, 0, exportCanvas.width, exportCanvas.height);

    const canvasImageData = exportCanvas.toDataURL("image/png");
    onUpdate({
      findings: [{ type: "diagramMarkup" }],
      canvasImageData,
      legendItems: normalizedLegendItems,
    });
    lastEmittedImageRef.current = canvasImageData;
  }, [
    canvasSize.height,
    canvasSize.width,
    imageReady,
    normalizedLegendItems,
    onUpdate,
  ]);

  useEffect(() => {
    redrawOverlay();
  }, [redrawOverlay]);

  useEffect(() => {
    if (!imageReady) {
      return;
    }

    const incoming = String(initialCanvasImageData || "").trim();
    if (incoming && incoming !== lastEmittedImageRef.current) {
      onUpdate({
        findings: [{ type: "diagramMarkup" }],
        canvasImageData: incoming,
        legendItems: normalizedLegendItems,
      });
      lastEmittedImageRef.current = incoming;
      return;
    }

    if (
      paths.length === 0 &&
      textAnnotations.length === 0 &&
      normalizedLegendItems.length === 0
    ) {
      return;
    }

    emitCanvasUpdate();
  }, [
    emitCanvasUpdate,
    imageReady,
    initialCanvasImageData,
    normalizedLegendItems,
    onUpdate,
    paths,
    textAnnotations,
  ]);

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    event.preventDefault();

    const point = getCanvasCoordinates(event);

    if (mode === "textbox") {
      const hitTextAnnotation = findTextAnnotationAtPoint(point);
      if (hitTextAnnotation) {
        if (draftTextAnnotation) {
          commitDraftTextAnnotation();
        }

        canvas.setPointerCapture(event.pointerId);
        textDragOffsetRef.current = {
          x: point.x - hitTextAnnotation.x,
          y: point.y - hitTextAnnotation.y,
        };
        setDraggingTextId(hitTextAnnotation.id);
        return;
      }

      commitDraftTextAnnotation();
      setDraftTextAnnotation({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        x: point.x,
        y: point.y,
        text: "",
        color: strokeColor,
        size: textSize,
        fontWeight: isBold ? "bold" : "normal",
        fontStyle: isItalic ? "italic" : "normal",
        underline: isUnderline,
      });
      return;
    }

    if (draftTextAnnotation) {
      commitDraftTextAnnotation();
    }

    canvas.setPointerCapture(event.pointerId);
    setIsDrawing(true);
    setCurrentPath({
      points: [point],
      color: strokeColor,
      width: strokeWidth,
      erase: mode === "erase",
    });
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (draggingTextId) {
      event.preventDefault();
      const point = getCanvasCoordinates(event);
      const offset = textDragOffsetRef.current;

      setTextAnnotations((previous) => {
        const dragged = previous.find((annotation) => annotation.id === draggingTextId);
        if (!dragged) {
          return previous;
        }

        const fitted = fitTextAnnotationWithinCanvas({
          ...dragged,
          x: point.x - offset.x,
          y: point.y - offset.y,
        });

        return previous.map((annotation) =>
          annotation.id === draggingTextId
            ? {
                ...annotation,
                x: fitted.x,
                y: fitted.y,
              }
            : annotation,
        );
      });
      return;
    }

    if (!isDrawing || !currentPath) {
      return;
    }
    event.preventDefault();

    const point = getCanvasCoordinates(event);
    setCurrentPath((prev) => {
      if (!prev) {
        return prev;
      }
      return {
        ...prev,
        points: [...prev.points, point],
      };
    });
  };

  const finishPath = () => {
    if (!currentPath || currentPath.points.length < 2) {
      setCurrentPath(null);
      setIsDrawing(false);
      return;
    }

    setPaths((prev) => [...prev, currentPath]);
    setCurrentPath(null);
    setIsDrawing(false);
  };

  const commitDraftTextAnnotation = useCallback(() => {
    setDraftTextAnnotation((previousDraft) => {
      if (!previousDraft) {
        return null;
      }

      const normalizedText = String(previousDraft.text || "").trim();
      if (!normalizedText) {
        return null;
      }

      setTextAnnotations((current) => [
        ...current,
        fitTextAnnotationWithinCanvas({
          ...previousDraft,
          text: normalizedText,
        }),
      ]);
      return null;
    });
  }, [fitTextAnnotationWithinCanvas]);

  const discardDraftTextAnnotation = useCallback(() => {
    setDraftTextAnnotation(null);
  }, []);

  useEffect(() => {
    if (mode !== "textbox" && draftTextAnnotation) {
      commitDraftTextAnnotation();
    }
  }, [commitDraftTextAnnotation, draftTextAnnotation, mode]);

  useEffect(() => {
    if (mode !== "textbox" && draggingTextId) {
      setDraggingTextId(null);
    }
  }, [draggingTextId, mode]);

  useEffect(() => {
    setDraftTextAnnotation((previousDraft) => {
      if (!previousDraft) {
        return previousDraft;
      }

      const nextFontWeight: TextAnnotation["fontWeight"] = isBold ? "bold" : "normal";
      const nextFontStyle: TextAnnotation["fontStyle"] = isItalic ? "italic" : "normal";
      const nextUnderline = isUnderline;

      if (
        previousDraft.size === textSize &&
        previousDraft.fontWeight === nextFontWeight &&
        previousDraft.fontStyle === nextFontStyle &&
        previousDraft.underline === nextUnderline
      ) {
        return previousDraft;
      }

      return {
        ...previousDraft,
        size: textSize,
        fontWeight: nextFontWeight,
        fontStyle: nextFontStyle,
        underline: nextUnderline,
      };
    });
  }, [isBold, isItalic, isUnderline, textSize]);

  const handlePointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas?.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }

    if (draggingTextId) {
      setDraggingTextId(null);
      return;
    }

    finishPath();
  };

  const handlePointerLeaveOrCancel = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas?.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }

    if (draggingTextId) {
      setDraggingTextId(null);
      return;
    }

    finishPath();
  };

  const draftLeftPercent = draftTextAnnotation
    ? (draftTextAnnotation.x / canvasSize.width) * 100
    : 0;
  const draftTopPercent = draftTextAnnotation
    ? (draftTextAnnotation.y / canvasSize.height) * 100
    : 0;
  const activeLegendColor = normalizeColor(strokeColor);
  const activeLegendLabel = legendLabelsByColor[activeLegendColor] || "";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <Button
          type="button"
          size="sm"
          variant={mode === "draw" ? "default" : "outline"}
          onClick={() => setMode("draw")}
        >
          Draw
        </Button>
        <Button
          type="button"
          size="sm"
          variant={mode === "textbox" ? "default" : "outline"}
          onClick={() => setMode("textbox")}
        >
          Textbox
        </Button>
        <Button
          type="button"
          size="sm"
          variant={mode === "erase" ? "default" : "outline"}
          onClick={() => setMode("erase")}
        >
          Erase
        </Button>

        <div className="flex items-center gap-2">
          <Label className="text-xs font-medium text-gray-700">Color</Label>
          <Input
            aria-label="Drawing color"
            type="color"
            value={strokeColor}
            onChange={(event) => setStrokeColor(normalizeColor(event.target.value))}
            className="h-8 w-12 p-1"
          />
        </div>

        <div className="flex items-center gap-2">
          <Label className="text-xs font-medium text-gray-700">Thickness</Label>
          <Input
            aria-label="Drawing thickness"
            type="range"
            min={1}
            max={12}
            step={1}
            value={strokeWidth}
            onChange={(event) => setStrokeWidth(Number(event.target.value))}
            className="h-8 w-28"
          />
          <span className="text-xs text-gray-600">{strokeWidth}px</span>
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="diagram-text-size" className="text-xs font-medium text-gray-700">
            Font
          </Label>
          <select
            id="diagram-text-size"
            aria-label="Textbox font size"
            value={textSize}
            onChange={(event) => setTextSize(Number(event.target.value))}
            className="h-8 rounded border border-gray-300 bg-white px-2 text-xs text-gray-700 shadow-sm outline-none focus:ring-2 focus:ring-gray-400"
          >
            {TEXT_SIZE_OPTIONS.map((sizeOption) => (
              <option key={sizeOption} value={sizeOption}>
                {sizeOption}px
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant={!isBold && !isItalic && !isUnderline ? "default" : "outline"}
            onClick={() => {
              setIsBold(false);
              setIsItalic(false);
              setIsUnderline(false);
            }}
          >
            Regular
          </Button>
          <Button
            type="button"
            size="sm"
            variant={isBold ? "default" : "outline"}
            onClick={() => setIsBold((previousValue) => !previousValue)}
          >
            Bold
          </Button>
          <Button
            type="button"
            size="sm"
            variant={isItalic ? "default" : "outline"}
            onClick={() => setIsItalic((previousValue) => !previousValue)}
          >
            Italic
          </Button>
          <Button
            type="button"
            size="sm"
            variant={isUnderline ? "default" : "outline"}
            onClick={() => setIsUnderline((previousValue) => !previousValue)}
          >
            Underline
          </Button>
        </div>
      </div>
      {enableDrawColorLegend && mode === "draw" ? (
        <div className="rounded-md border border-gray-200 bg-gray-50/60 p-3 space-y-3">
          <div className="space-y-1">
            <Label className="text-xs font-medium text-gray-700">
              Legend label for selected color
            </Label>
            <Input
              value={activeLegendLabel}
              onChange={(event) => {
                const nextLabel = event.target.value;
                setLegendLabelsByColor((previous) => ({
                  ...previous,
                  [activeLegendColor]: nextLabel,
                }));
              }}
              placeholder='e.g. "Mass"'
              className="h-9"
            />
          </div>
          {normalizedLegendItems.length > 0 ? (
            <div className="space-y-2">
              <Label className="text-xs font-medium text-gray-700">Generated legend</Label>
              <div className="space-y-1">
                {normalizedLegendItems.map((item) => (
                  <div key={`${item.color}-${item.label}`} className="flex items-center gap-2 text-xs text-gray-700">
                    <span
                      className="inline-block h-3 w-3 rounded-sm border border-gray-300"
                      style={{ backgroundColor: item.color }}
                    />
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <div
        className="relative mx-auto w-fit max-w-full rounded border bg-white"
        style={{ maxWidth: `min(100%, ${maxWidth}px)` }}
      >
        <img
          src={baseImageSource}
          alt="Colonoscopy diagram background"
          className="block h-auto max-w-full select-none"
          style={maxHeight ? { maxHeight: `${maxHeight}px` } : undefined}
          draggable={false}
        />
        {draftTextAnnotation ? (
          <textarea
            autoFocus
            value={draftTextAnnotation.text}
            onChange={(event) => {
              const nextValue = event.target.value;
              setDraftTextAnnotation((previousDraft) =>
                previousDraft
                  ? {
                      ...previousDraft,
                      text: nextValue,
                    }
                  : previousDraft,
              );
            }}
            onBlur={commitDraftTextAnnotation}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                commitDraftTextAnnotation();
              }

              if (event.key === "Escape") {
                event.preventDefault();
                discardDraftTextAnnotation();
              }
            }}
            className="absolute z-20 min-w-[180px] max-w-none resize-none overflow-hidden rounded border border-gray-300 bg-white px-2 text-xs shadow-sm outline-none focus:ring-2 focus:ring-gray-400"
            style={{
              left: `${draftLeftPercent}%`,
              top: `${draftTopPercent}%`,
              transform: "translate(-2px, -2px)",
              width: `${Math.max(180, Math.min(460, Math.max(10, String(draftTextAnnotation.text || "").length + 2) * Math.max(9, draftTextAnnotation.size * 0.52)))}px`,
              color: draftTextAnnotation.color,
              height: `${Math.max(32, Math.round(draftTextAnnotation.size * 1.35))}px`,
              fontSize: `${draftTextAnnotation.size}px`,
              fontWeight: draftTextAnnotation.fontWeight,
              fontStyle: draftTextAnnotation.fontStyle,
              textDecoration: draftTextAnnotation.underline ? "underline" : "none",
              lineHeight: 1.2,
            }}
            placeholder="Type here"
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            autoComplete="off"
          />
        ) : null}
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          className="absolute inset-0 h-full w-full"
          style={{
            touchAction: "none",
            cursor:
              draggingTextId
                ? "grabbing"
                : mode === "textbox"
                  ? "text"
                  : mode === "erase"
                    ? "crosshair"
                    : "crosshair",
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerLeaveOrCancel}
          onPointerCancel={handlePointerLeaveOrCancel}
        />
      </div>
    </div>
  );
};
