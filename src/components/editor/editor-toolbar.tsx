"use client";

import { Download, FileJson, ImageDown, Printer, Redo2, Save, Share2, Undo2, ZoomIn } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function EditorToolbar({
  dirty,
  saving,
  canEdit,
  onSave,
  onUndo,
  onRedo,
  onExportJson,
  onImportJson,
  onExportImage,
  onPrint,
  onFit
}: {
  dirty: boolean;
  saving: boolean;
  canEdit: boolean;
  onSave: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onExportJson: () => void;
  onImportJson: (file: File) => void;
  onExportImage: () => void;
  onPrint: () => void;
  onFit: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b bg-card px-3 py-2">
      <Button size="sm" onClick={onSave} disabled={!canEdit || saving} title="Speichern">
        <Save className="h-4 w-4" />
        {saving ? "Speichert" : "Speichern"}
      </Button>
      <Button size="icon" variant="ghost" onClick={onUndo} disabled={!canEdit} title="Rückgängig">
        <Undo2 className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="ghost" onClick={onRedo} disabled={!canEdit} title="Wiederholen">
        <Redo2 className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="ghost" onClick={onFit} title="Fit View">
        <ZoomIn className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="ghost" onClick={onExportJson} title="JSON exportieren">
        <FileJson className="h-4 w-4" />
      </Button>
      <label className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md hover:bg-accent" title="JSON importieren">
        <Download className="h-4 w-4" />
        <input
          type="file"
          accept="application/json"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onImportJson(file);
            event.currentTarget.value = "";
          }}
        />
      </label>
      <Button size="icon" variant="ghost" onClick={onExportImage} title="Bild exportieren">
        <ImageDown className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="ghost" onClick={onPrint} title="PDF/Druck">
        <Printer className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="ghost" title="Teilen" onClick={() => navigator.clipboard.writeText(window.location.href)}>
        <Share2 className="h-4 w-4" />
      </Button>
      <Badge variant={dirty ? "warning" : "success"} className="ml-auto">
        {saving ? "Auto-Save" : dirty ? "Ungespeichert" : "Gespeichert"}
      </Badge>
    </div>
  );
}
