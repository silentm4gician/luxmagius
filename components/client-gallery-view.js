"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, Grid, Columns, ImageIcon, Heart } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import getImageUrl from "@/hooks/useImageUrl";

export function ClientGalleryView({ gallery, likedImages, onToggleLike, userEmail }) {
  const [viewImage, setViewImage] = useState(null);
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'columns'
  const [selectedImages, setSelectedImages] = useState([]);

  const toggleImageSelection = (index) => {
    if (selectedImages.includes(index)) {
      setSelectedImages(selectedImages.filter((i) => i !== index));
    } else {
      setSelectedImages([...selectedImages, index]);
    }
  };

  const selectAll = () => {
    if (selectedImages.length === gallery.images.length) {
      setSelectedImages([]);
    } else {
      setSelectedImages(gallery.images.map((_, index) => index));
    }
  };

  const handleLikeClick = (index) => {
    onToggleLike(index);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
      <header className="container mx-auto py-6 px-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{gallery.name}</h1>
            {gallery.description && (
              <p className="text-muted-foreground mt-1">
                {gallery.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={selectAll}>
              {selectedImages.length === gallery.images?.length
                ? "Deselect All"
                : "Select All"}
            </Button>
            <Button
              variant="outline"
              size="icon"
              className={viewMode === "grid" ? "bg-muted" : ""}
              onClick={() => setViewMode("grid")}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className={viewMode === "columns" ? "bg-muted" : ""}
              onClick={() => setViewMode("columns")}
            >
              <Columns className="h-4 w-4" />
            </Button>
            {selectedImages.length > 0 && (
              <Button
                className="bg-purple-600 hover:bg-purple-700"
                onClick={() => {
                  // En una app real, implementarías la funcionalidad de descarga aquí
                  alert(`Downloading ${selectedImages.length} images`);
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Descargar {selectedImages.length} Seleccionadas
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {gallery.images && gallery.images.length > 0 ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {gallery.images.map((image, index) => {
                const imageId = image.id || `image_${index}`;
                const isLiked = likedImages.includes(imageId);
                
                return (
                  <Card
                    key={index}
                    className="relative overflow-hidden group"
                  >
                    <div className="aspect-square bg-muted relative">
                      <img
                        src={getImageUrl(image)}
                        alt={image?.name || "Image"}
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => setViewImage(image)}
                      />
                      <Button
                        variant={image.likedBy?.includes(userEmail) ? "default" : "outline"}
                        size="icon"
                        className={`absolute top-2 right-2 h-8 w-8 rounded-full bg-white/80 hover:bg-white ${
                          image.likedBy?.includes(userEmail) ? 'bg-purple-600 hover:bg-purple-700' : ''
                        }`}
                        onClick={() => handleLikeClick(index)}
                      >
                        <Heart className={`h-4 w-4 ${image.likedBy?.includes(userEmail) ? 'fill-current' : ''}`} />
                      </Button>
                      {image.likes > 0 && (
                        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-sm px-2 py-1 rounded-full">
                          {image.likes} {image.likes === 1 ? 'like' : 'likes'}
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="columns-1 sm:columns-2 md:columns-3 gap-4 space-y-4">
              {gallery.images.map((image, index) => {
                const imageId = image.id || `image_${index}`;
                const isLiked = likedImages.includes(imageId);
                
                return (
                  <div
                    key={index}
                    className="relative overflow-hidden break-inside-avoid"
                  >
                    <img
                      src={getImageUrl(image)}
                      alt={image?.name || "Image"}
                      className="w-full h-auto cursor-pointer"
                      onClick={() => setViewImage(image)}
                    />
                    <Button
                      variant={image.likedBy?.includes(userEmail) ? "default" : "outline"}
                      size="icon"
                      className={`absolute top-2 right-2 h-8 w-8 rounded-full bg-white/80 hover:bg-white ${
                        image.likedBy?.includes(userEmail) ? 'bg-purple-600 hover:bg-purple-700' : ''
                      }`}
                      onClick={() => handleLikeClick(index)}
                    >
                      <Heart className={`h-4 w-4 ${image.likedBy?.includes(userEmail) ? 'fill-current' : ''}`} />
                    </Button>
                    {image.likes > 0 && (
                      <div className="absolute bottom-2 right-2 bg-black/60 text-white text-sm px-2 py-1 rounded-full">
                        {image.likes} {image.likes === 1 ? 'like' : 'likes'}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        ) : (
          <Card className="p-8 text-center">
            <div className="flex flex-col items-center gap-2 max-w-md mx-auto">
              <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900">
                <ImageIcon className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-medium mt-2">No hay imagenes</h3>
              <p className="text-muted-foreground mb-4">
                El propietario de la galeria aun no ha agregado ninguna imagen.
              </p>
            </div>
          </Card>
        )}
      </main>

      <Dialog
        open={!!viewImage}
        onOpenChange={(open) => !open && setViewImage(null)}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{viewImage?.name}</DialogTitle>
            <DialogDescription>
              {viewImage?.type} ·{" "}
              {viewImage?.size
                ? `${Math.round(viewImage.size / 1024)} KB`
                : "Tamaño desconocido"}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center">
            <img
              src={getImageUrl(viewImage)}
              alt={viewImage?.name || "Image"}
              className="max-h-[70vh] object-contain"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                window.open(viewImage?.url || getImageUrl(viewImage), "_blank")
              }
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