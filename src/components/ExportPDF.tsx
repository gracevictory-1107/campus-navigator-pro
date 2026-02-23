import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { allFloorPlans } from "@/data/floorPlans";
import { toast } from "@/hooks/use-toast";

export default function ExportPDF() {
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

        // Create an offscreen container to render the floor plan
        const container = document.createElement("div");
        container.style.cssText = `
          position: fixed; left: -9999px; top: 0;
          background: #0a0f1a; padding: 24px;
          width: ${Math.max(plan.svgWidth + 48, 800)}px;
        `;

        // Title
        const title = document.createElement("div");
        title.style.cssText = "color: #7ab8cc; font-size: 18px; font-weight: bold; letter-spacing: 3px; margin-bottom: 4px; font-family: monospace;";
        title.textContent = plan.title;
        container.appendChild(title);

        const subtitle = document.createElement("div");
        subtitle.style.cssText = "color: #4a6670; font-size: 11px; letter-spacing: 2px; margin-bottom: 16px; font-family: monospace;";
        subtitle.textContent = `${plan.subtitle}  //  CODE ${plan.code}`;
        container.appendChild(subtitle);

        // Build SVG
        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute("width", String(plan.svgWidth));
        svg.setAttribute("height", String(plan.svgHeight));
        svg.setAttribute("xmlns", svgNS);

        const roomColors: Record<string, { fill: string; stroke: string }> = {
          lab: { fill: "#0d2a3a", stroke: "#1a4a6a" },
          class: { fill: "#0d2a3a", stroke: "#1a4a6a" },
          hod: { fill: "#1a2a1a", stroke: "#2a4a2a" },
          stairs: { fill: "#1a1a2a", stroke: "#2a2a4a" },
          lift: { fill: "#1a1a2a", stroke: "#2a2a4a" },
          wc: { fill: "#2a1a2a", stroke: "#4a2a4a" },
          exit: { fill: "#0a2a1a", stroke: "#1a4a2a" },
          corridor: { fill: "#0a0f1a", stroke: "#1a2530" },
          staff: { fill: "#1a2a1a", stroke: "#2a4a2a" },
          innov: { fill: "#1a1a2a", stroke: "#3a2a5a" },
          open: { fill: "#0d2030", stroke: "#1a3a4a" },
          canteen: { fill: "#2a1a0a", stroke: "#4a3a1a" },
          dean: { fill: "#1a1a2a", stroke: "#3a2a5a" },
          court: { fill: "#0a1a0a", stroke: "#1a3a1a" },
        };

        for (const room of plan.rooms) {
          const colors = roomColors[room.type] || roomColors.class;
          const rect = document.createElementNS(svgNS, "rect");
          rect.setAttribute("x", String(room.x));
          rect.setAttribute("y", String(room.y));
          rect.setAttribute("width", String(room.w));
          rect.setAttribute("height", String(room.h));
          rect.setAttribute("rx", "2");
          rect.setAttribute("fill", colors.fill);
          rect.setAttribute("stroke", colors.stroke);
          rect.setAttribute("stroke-width", "1.5");
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
            text.setAttribute("fill", room.type === "corridor" ? "#4a6670" : "#c0dce8");
            text.setAttribute("font-size", room.type === "corridor" ? "8" : "8.5");
            text.setAttribute("letter-spacing", "0.3");
            text.setAttribute("font-family", "monospace");
            if (vertical) text.setAttribute("transform", `rotate(-90,${cx},${cy})`);
            text.textContent = room.label;
            svg.appendChild(text);

            if (room.sublabel) {
              const sub = document.createElementNS(svgNS, "text");
              sub.setAttribute("x", String(cx));
              sub.setAttribute("y", String(cy + 10));
              sub.setAttribute("text-anchor", "middle");
              sub.setAttribute("dominant-baseline", "middle");
              sub.setAttribute("fill", "#7ab8cc");
              sub.setAttribute("font-size", "8");
              sub.setAttribute("font-family", "monospace");
              if (vertical) sub.setAttribute("transform", `rotate(-90,${cx},${cy + 10})`);
              sub.textContent = room.sublabel;
              svg.appendChild(sub);
            }
          }
        }

        // Direction labels
        if (plan.labels) {
          for (const label of plan.labels) {
            const t = document.createElementNS(svgNS, "text");
            t.setAttribute("x", String(label.x));
            t.setAttribute("y", String(label.y));
            t.setAttribute("text-anchor", label.anchor || "start");
            t.setAttribute("fill",
              label.color === "green" ? "#22c55e" :
              label.color === "amber" ? "#f59e0b" : "#7ab8cc"
            );
            t.setAttribute("font-size", "9");
            t.setAttribute("letter-spacing", "1");
            t.setAttribute("font-family", "monospace");
            t.textContent = label.text;
            svg.appendChild(t);
          }
        }

        container.appendChild(svg);
        document.body.appendChild(container);

        const canvas = await html2canvas(container, {
          backgroundColor: "#0a0f1a",
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

      pdf.save("AWDC-KKD-Campus-Blueprint.pdf");
      toast({ title: "PDF exported", description: "All floor plans saved to PDF." });
    } catch (err) {
      console.error(err);
      toast({ title: "Export failed", description: "Could not generate PDF.", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={exporting}
      className="text-[10px] tracking-wider border-cyan-dim text-cyan-dim hover:text-cyan hover:border-cyan h-7 px-2.5"
    >
      {exporting ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Download className="h-3 w-3 mr-1" />}
      {exporting ? "EXPORTING..." : "EXPORT PDF"}
    </Button>
  );
}
