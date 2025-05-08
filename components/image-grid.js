"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Trash2, Download, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import getImageUrl from "@/hooks/useImageUrl";

export function ImageGrid({
  images,
  onDelete,
  selectedImages,
  setSelectedImages,
}) {
  const [viewImage, setViewImage] = useState(null);

  const toggleImageSelection = (index) => {
    if (selectedImages.includes(index)) {
      setSelectedImages(selectedImages.filter((i) => i !== index));
    } else {
      setSelectedImages([...selectedImages, index]);
    }
  };

  const selectAll = () => {
    if (selectedImages.length > 0) {
      setSelectedImages([]);
    } else {
      setSelectedImages(images.map((_, index) => index));
    }
  };

  return (
    <div>
      <div className="flex justify-between mb-4">
        <Button variant="outline" size="sm" onClick={selectAll}>
          {selectedImages.length > 0 ? "Anular Seleccion" : "Seleccionar Todas"}
        </Button>
        <div className="text-sm text-muted-foreground">
          {selectedImages.length > 0
            ? `${selectedImages.length} seleccionadas`
            : `${images.length} imagenes`}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {images.map((image, index) => (
          <Card
            key={index}
            className={`relative overflow-hidden group ${
              selectedImages.includes(index) ? "ring-2 ring-purple-600" : ""
            }`}
          >
            <div
              className="aspect-square bg-muted cursor-pointer"
              onClick={() => toggleImageSelection(index)}
            >
              <img
                src={getImageUrl(image)}
                alt={image.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 left-2">
                <Checkbox
                  checked={selectedImages.includes(index)}
                  onCheckedChange={() => toggleImageSelection(index)}
                  className="h-5 w-5 bg-white/80 border-none"
                />
              </div>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewImage(image);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(image.url, "_blank");
                    }}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(index);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Dialog
        open={!!viewImage}
        onOpenChange={(open) => !open && setViewImage(null)}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{viewImage?.name}</DialogTitle>
            <DialogDescription>
              {viewImage?.type} ·{" "}
              {viewImage?.size
                ? `${Math.round(viewImage.size / 1024)} KB`
                : "Unknown size"}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center">
            <img
              src={getImageUrl(viewImage)}
              alt={viewImage?.name}
              className="max-h-[70vh] object-contain"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => window.open(viewImage?.url, "_blank")}
            >
              <Download className="h-4 w-4 mr-2" />
              Descargar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
