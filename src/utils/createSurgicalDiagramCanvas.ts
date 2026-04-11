import { getSurgicalDiagramMarkingMetrics } from "@/utils/surgicalDiagramMarkings";

export const createSurgicalDiagramCanvas = async (
  diagramImage: string,
  markings: any[],
  markingScale = 1.5,
): Promise<string | null> =>
  new Promise((resolve) => {
    if (!Array.isArray(markings) || markings.length === 0) {
      resolve(null);
      return;
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      resolve(null);
      return;
    }

    const image = new Image();
    image.onload = () => {
      const drawingMetrics = getSurgicalDiagramMarkingMetrics(markingScale);
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0);

      markings.forEach((marking) => {
        if (marking.type === "port") {
          ctx.save();
          ctx.font = `bold ${drawingMetrics.portFontSize}px Arial`;
          ctx.fillStyle = "black";
          ctx.textAlign = "center";
          ctx.textBaseline = "bottom";
          ctx.fillText(marking.size, marking.x, marking.y - drawingMetrics.portLabelOffset);
          ctx.beginPath();
          ctx.moveTo(marking.x - drawingMetrics.portHalfLength, marking.y);
          ctx.lineTo(marking.x + drawingMetrics.portHalfLength, marking.y);
          ctx.strokeStyle = "black";
          ctx.lineWidth = drawingMetrics.portLineWidth;
          ctx.stroke();
          ctx.restore();
          return;
        }

        if (marking.type === "stoma") {
          ctx.save();
          ctx.beginPath();
          ctx.arc(marking.x, marking.y, drawingMetrics.stomaRadius, 0, 2 * Math.PI);
          ctx.strokeStyle = marking.stomaType === "ileostomy" ? "#f59e0b" : "#16a34a";
          ctx.lineWidth =
            marking.stomaType === "ileostomy"
              ? drawingMetrics.ileostomyLineWidth
              : drawingMetrics.colostomyLineWidth;
          ctx.setLineDash(marking.stomaType === "ileostomy" ? drawingMetrics.ileostomyDash : []);
          ctx.stroke();
          ctx.restore();
          return;
        }

        if (marking.type === "incision") {
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(marking.start.x, marking.start.y);
          ctx.lineTo(marking.end.x, marking.end.y);
          ctx.strokeStyle = "#8B0000";
          ctx.lineWidth = drawingMetrics.incisionLineWidth;
          ctx.setLineDash(drawingMetrics.incisionDash);
          ctx.stroke();
          ctx.restore();
        }
      });

      resolve(canvas.toDataURL("image/png"));
    };

    image.onerror = () => resolve(null);
    image.src = diagramImage;
  });
