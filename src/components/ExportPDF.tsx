import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { allFloorPlans } from "@/data/floorPlans";
import { toast } from "@/hooks/use-toast";

interface Props {
  iconOnly?: boolean;
}

export default function ExportPDF({ iconOnly }: Props) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: html2canvas } = await import("html2canvas");

      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 10;

      const floorIds = Object.keys(allFloorPlans);
      let isFirst = true;

      for (const floorId of floorIds) {
        const plan = allFloorPlans[floorId];

        const container = document.createElement("div");
        container.style.cssText = `
          position: fixed; left: -9999px; top: 0;
          background: #ffffff; padding: 24px;
          width: ${Math.max(plan.svgWidth + 48, 800)}px;
        `;

        const title = document.createElement("div");
        title.style.cssText = "color: #1a1a2e; font-size: 18px; font-weight: bold; letter-spacing: 1px; margin-bottom: 4px; font-family: sans-serif;";
        title.textContent = plan.title;
        container.appendChild(title);

        const subtitle = document.createElement("div");
        subtitle.style.cssText = "color: #666; font-size: 12px; margin-bottom: 16px; font-family: sans-serif;";
        subtitle.textContent = `${plan.subtitle}  •  Floor ${plan.code}`;
        container.appendChild(subtitle);

        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute("width", String(plan.svgWidth));
        svg.setAttribute("height", String(plan.svgHeight));
        svg.setAttribute("xmlns", svgNS);

        const roomColors: Record<string, { fill: string; stroke: string }> = {
          lab: { fill: "#e8f5e9", stroke: "#66bb6a" },
          class: { fill: "#e3f2fd", stroke: "#42a5f5" },
          hod: { fill: "#f3e5f5", stroke: "#ab47bc" },
          stairs: { fill: "#fff8e1", stroke: "#ffa726" },
          lift: { fill: "#e3f2fd", stroke: "#5c6bc0" },
          wc: { fill: "#e0f7fa", stroke: "#26a69a" },
          exit: { fill: "#e8f5e9", stroke: "#43a047" },
          corridor: { fill: "#f5f5f5", stroke: "#bdbdbd" },
          staff: { fill: "#e8f5e9", stroke: "#66bb6a" },
          innov: { fill: "#ede7f6", stroke: "#7e57c2" },
          open: { fill: "#f1f8e9", stroke: "#7cb342" },
          canteen: { fill: "#fff3e0", stroke: "#ef6c00" },
          dean: { fill: "#fce4ec", stroke: "#e91e63" },
          court: { fill: "#e0f2f1", stroke: "#009688" },
        };

        for (const room of plan.rooms) {
          const colors = roomColors[room.type] || roomColors.class;
          const rect = document.createElementNS(svgNS, "rect");
          rect.setAttribute("x", String(room.x));
          rect.setAttribute("y", String(room.y));
          rect.setAttribute("width", String(room.w));
          rect.setAttribute("height", String(room.h));
          rect.setAttribute("rx", "6");
          rect.setAttribute("fill", colors.fill);
          rect.setAttribute("stroke", colors.stroke);
          rect.setAttribute("stroke-width", "1.2");
          svg.appendChild(rect);

          if (room.label) {
            const cx = room.x + room.w / 2;
            const cy = room.y + room.h / 2;
            const vertical = room.h > room.w * 1.8;
            const labelY = room.sublabel ? cy - 6 : cy;

            const text = document.createElementNS(svgNS, "text");
            text.setAttribute("x", String(cx));
            text.setAttribute("y", String(labelY));
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("dominant-baseline", "middle");
            text.setAttribute("fill", room.type === "corridor" ? "#999" : "#333");
            text.setAttribute("font-size", room.type === "corridor" ? "8" : "9");
            text.setAttribute("font-weight", "600");
            text.setAttribute("font-family", "sans-serif");
            if (vertical) text.setAttribute("transform", `rotate(-90,${cx},${cy})`);
            text.textContent = room.label;
            svg.appendChild(text);

            if (room.sublabel) {
              const sub = document.createElementNS(svgNS, "text");
              sub.setAttribute("x", String(cx));
              sub.setAttribute("y", String(cy + 10));
              sub.setAttribute("text-anchor", "middle");
              sub.setAttribute("dominant-baseline", "middle");
              sub.setAttribute("fill", "#666");
              sub.setAttribute("font-size", "8");
              sub.setAttribute("font-family", "sans-serif");
              if (vertical) sub.setAttribute("transform", `rotate(-90,${cx},${cy + 10})`);
              sub.textContent = room.sublabel;
              svg.appendChild(sub);
            }
          }
        }

        if (plan.labels) {
          for (const label of plan.labels) {
            const t = document.createElementNS(svgNS, "text");
            t.setAttribute("x", String(label.x));
            t.setAttribute("y", String(label.y));
            t.setAttribute("text-anchor", label.anchor || "start");
            t.setAttribute("fill",
              label.color === "green" ? "#43a047" :
              label.color === "amber" ? "#ef6c00" : "#1565c0"
            );
            t.setAttribute("font-size", "10");
            t.setAttribute("font-weight", "600");
            t.setAttribute("font-family", "sans-serif");
            t.textContent = label.text;
            svg.appendChild(t);
          }
        }

        container.appendChild(svg);
        document.body.appendChild(container);

        const canvas = await html2canvas(container, {
          backgroundColor: "#ffffff",
          scale: 2,
        });

        if (!isFirst) pdf.addPage();
        isFirst = false;

        const imgData = canvas.toDataURL("image/png");
        const ratio = canvas.width / canvas.height;
        const availW = pageW - margin * 2;
        const availH = pageH - margin * 2;
        let imgW = availW;
        let imgH = imgW / ratio;
        if (imgH > availH) {
          imgH = availH;
          imgW = imgH * ratio;
        }
        const xOffset = margin + (availW - imgW) / 2;

        pdf.addImage(imgData, "PNG", xOffset, margin, imgW, imgH);
        document.body.removeChild(container);
      }

      pdf.save("AWDC-KKD-Campus-Navigator.pdf");
      toast({ title: "PDF exported", description: "All floor plans saved to PDF." });
    } catch (err) {
      console.error(err);
      toast({ title: "Export failed", description: "Could not generate PDF.", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  if (iconOnly) {
    return (
      <button
        onClick={handleExport}
        disabled={exporting}
        className="flex flex-col items-center gap-0.5 text-muted-foreground hover:text-primary transition-colors p-2"
      >
        {exporting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
        <span className="text-[10px]">Export</span>
      </button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={exporting}
      className="hidden sm:flex gap-1.5 h-9"
    >
      {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
      <span className="text-xs">{exporting ? "Exporting..." : "Export"}</span>
    </Button>
  );
}
