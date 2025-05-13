"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Download,
  Grid,
  Columns,
  ImageIcon,
  Heart,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Info,
  Camera,
  Briefcase,
  Maximize2,
  ArrowDownToLine,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import getImageUrl from "@/hooks/useImageUrl";
import Link from "next/link";
import Image from "next/image";

export function ClientGalleryView({
  gallery,
  likedImages,
  onToggleLike,
  userEmail,
  portfolio,
}) {
  const [viewImage, setViewImage] = useState(null);
  const [viewIndex, setViewIndex] = useState(null);
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'columns'
  const [selectedImages, setSelectedImages] = useState([]);
  const [downloadingImages, setDownloadingImages] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [loadingImages, setLoadingImages] = useState({});

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (viewIndex !== null && gallery.images && gallery.images[viewIndex]) {
      setViewImage(gallery.images[viewIndex]);
    }
  }, [gallery.images, viewIndex]);

  const toggleImageSelection = (index, event) => {
    if (event) {
      event.stopPropagation();
    }

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
      setSelectedImages(gallery.images.map((_, index) => index));
    }
  };

  const handleLikeClick = (index, event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    onToggleLike(index);
  };

  const openImageView = (image, index) => {
    setViewImage(image);
    setViewIndex(index);
  };

  const navigateImage = (direction) => {
    if (!gallery.images || gallery.images.length === 0) return;

    const newIndex =
      (viewIndex + direction + gallery.images.length) % gallery.images.length;
    setViewImage(gallery.images[newIndex]);
    setViewIndex(newIndex);
  };

  const handleImageLoad = (index) => {
    setLoadingImages((prev) => ({
      ...prev,
      [index]: false,
    }));
  };

  const handleImageError = (index) => {
    setLoadingImages((prev) => ({
      ...prev,
      [index]: false,
    }));
  };

  const handleDownloadImages = async () => {
    if (selectedImages.length === 0) return;

    try {
      setDownloadingImages(true);

      // Create a single popup notification for Google Drive images
      const selectedImageObjects = selectedImages.map(
        (index) => gallery.images[index]
      );
      const googleDriveImages = selectedImageObjects.filter(
        (img) => img.url.includes("drive.google.com") && img.driveId
      );
      const regularImages = selectedImageObjects.filter(
        (img) => !(img.url.includes("drive.google.com") && img.driveId)
      );

      // First handle Google Drive images with a notification
      if (googleDriveImages.length > 0) {
        // Create a notification for Google Drive images
        const notification = document.createElement("div");
        notification.className =
          "fixed top-4 right-4 z-50 bg-background p-4 border rounded-lg shadow-lg max-w-md";
        notification.id = "drive-notification";

        const header = document.createElement("h3");
        header.textContent = "Descargas de Google Drive";
        header.className = "font-bold mb-2";
        notification.appendChild(header);

        const message = document.createElement("p");
        message.textContent = `${googleDriveImages.length} imágenes de Google Drive se abrirán en pestañas separadas. Por favor, permita las ventanas emergentes.`;
        message.className = "text-sm mb-4";
        notification.appendChild(message);

        const closeBtn = document.createElement("button");
        closeBtn.textContent = "X";
        closeBtn.className = "absolute top-2 right-2 text-sm";
        closeBtn.onclick = () =>
          document.getElementById("drive-notification").remove();
        notification.appendChild(closeBtn);

        document.body.appendChild(notification);

        // Wait a moment for the user to see the notification
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Create container for download buttons
        let containerElement;
        if (!document.getElementById("temp-download-buttons")) {
          // Create a new container if it doesn't exist
          const container = document.createElement("div");
          container.id = "temp-download-buttons";
          container.className =
            "fixed top-4 right-4 z-50 bg-background p-4 border rounded-lg shadow-lg";

          const header = document.createElement("h3");
          header.textContent = "Descargas de Google Drive";
          header.className = "font-bold mb-2";
          container.appendChild(header);

          const closeBtn = document.createElement("button");
          closeBtn.textContent = "X";
          closeBtn.className = "absolute top-2 right-2 text-sm";
          closeBtn.onclick = () =>
            document.getElementById("temp-download-buttons").remove();
          container.appendChild(closeBtn);

          document.body.appendChild(container);
          containerElement = container;
        } else {
          containerElement = document.getElementById("temp-download-buttons");
        }

        // Add download buttons for each Google Drive image
        for (let i = 0; i < googleDriveImages.length; i++) {
          const image = googleDriveImages[i];
          const downloadUrl = `https://drive.google.com/uc?export=download&id=${image.driveId}`;

          const tempButton = document.createElement("button");
          tempButton.textContent = `Descargar ${
            image.name || `imagen ${i + 1}`
          }`;
          tempButton.className =
            "bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded mb-2 mr-2";
          tempButton.onclick = () => window.open(downloadUrl, "_blank");

          containerElement.appendChild(tempButton);
        }

        // Remove the notification
        document.getElementById("drive-notification")?.remove();
      }

      // Then handle regular images
      for (let i = 0; i < regularImages.length; i++) {
        const image = regularImages[i];

        try {
          // For other sources, download using fetch
          const response = await fetch(image.url);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);

          const link = document.createElement("a");
          link.href = url;
          link.download = image.name || `image-${i + 1}`;

          // Use click() method instead of appending to the document
          // This is less likely to trigger popup blockers
          link.style.display = "none";
          document.body.appendChild(link);
          link.click();

          // Small delay before removing the link
          await new Promise((resolve) => setTimeout(resolve, 100));
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);

          // Add a small delay between downloads to prevent browser blocking
          if (i < regularImages.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 1500));
          }
        } catch (error) {
          console.error(`Error downloading image ${image.name || i}:`, error);

          // Create an error notification
          const errorNotification = document.createElement("div");
          errorNotification.className =
            "fixed bottom-4 right-4 z-50 bg-red-50 text-red-800 p-4 border border-red-200 rounded-lg shadow-lg max-w-md";
          errorNotification.innerHTML = `<p>Error al descargar ${
            image.name || `imagen ${i + 1}`
          }: ${error.message}</p>`;

          // Auto-remove after 5 seconds
          setTimeout(() => errorNotification.remove(), 5000);

          document.body.appendChild(errorNotification);
        }
      }
    } catch (error) {
      console.error("Error downloading images:", error);
    } finally {
      setDownloadingImages(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-black to-purple-900/20">
      {/* Cover Image Section */}
      {gallery.coverImage && (
        <div className="relative w-full h-[45vh] md:h-[60vh] overflow-hidden">
          <div className="absolute inset-0 bg-black/50 z-10"></div>
          <img
            src={getImageUrl({
              driveId: gallery.coverImage,
            })}
            alt={gallery.name || "Gallery Cover"}
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent z-10"></div>

          {/* Gallery Info Overlay */}
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <div className="container mx-auto px-4 flex flex-col items-center text-center">
              <div className="mb-6 relative">
                <div className="size-20 md:size-24 rounded-full border-4 border-purple-500 overflow-hidden shadow-lg shadow-purple-500/20 mx-auto">
                  <Image
                    src={
                      getImageUrl({
                        url: portfolio?.pfp || "/placeholder.svg",
                      }) || "/placeholder.svg"
                    }
                    alt={portfolio?.photographer || "Fotógrafo"}
                    width={100}
                    height={100}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-purple-600 rounded-full p-1.5 shadow-md">
                  <Camera className="h-4 w-4 text-white" />
                </div>
              </div>

              <h1 className="text-3xl md:text-5xl font-bold text-white mb-3 tracking-tight">
                {gallery.name}
              </h1>

              {gallery.description && (
                <p className="text-gray-200 max-w-2xl text-sm md:text-base mb-6 mx-auto">
                  {gallery.description}
                </p>
              )}

              <div className="flex items-center gap-3 flex-wrap justify-center">
                {gallery.images && gallery.images.length > 0 && (
                  <Badge className="bg-purple-600/80 text-white border-none backdrop-blur-sm px-3 py-1 text-sm">
                    {gallery.images.length}{" "}
                    {gallery.images.length === 1 ? "imagen" : "imágenes"}
                  </Badge>
                )}
                {portfolio && (
                  <Link href={`/p/${portfolio.id}`} className="inline-block">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm"
                    >
                      <Briefcase className="h-4 w-4 mr-2" />
                      Ver Portafolio
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black to-transparent z-10"></div>
        </div>
      )}

      <header
        className={cn(
          "sticky top-0 z-30 transition-all duration-500",
          isScrolled
            ? "bg-black/90 shadow-lg shadow-purple-900/10 py-3 backdrop-blur-md"
            : "bg-gradient-to-b from-black/80 to-black/40 py-4 backdrop-blur-sm"
        )}
      >
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className={cn("hidden", isScrolled && "block")}>
              <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-300">
                {gallery.name}
              </h2>
            </div>
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={selectAll}
                      className="border-purple-700/50 text-purple-300 hover:border-purple-600 hover:bg-purple-900/30 transition-all duration-300"
                    >
                      {selectedImages.length > 0 ? (
                        <>
                          <X className="h-4 w-4 mr-1" />
                          <span className="hidden sm:inline">Anular</span>{" "}
                          Selección
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-1" />
                          <span className="hidden sm:inline">
                            Seleccionar
                          </span>{" "}
                          Todo
                        </>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {selectedImages.length > 0
                      ? "Anular selección de todas las imágenes"
                      : "Seleccionar todas las imágenes"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <div className="flex rounded-md overflow-hidden border border-purple-700/50 shadow-sm">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "rounded-none h-9 w-9 transition-all duration-300",
                          viewMode === "grid"
                            ? "bg-purple-700 text-purple-100"
                            : "text-purple-300 hover:bg-purple-900/30 hover:text-purple-200"
                        )}
                        onClick={() => setViewMode("grid")}
                      >
                        <Grid className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Vista de cuadrícula</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "rounded-none h-9 w-9 transition-all duration-300",
                          viewMode === "columns"
                            ? "bg-purple-700 text-purple-100"
                            : "text-purple-300 hover:bg-purple-900/30 hover:text-purple-200"
                        )}
                        onClick={() => setViewMode("columns")}
                      >
                        <Columns className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Vista de columnas</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {selectedImages.length > 0 && (
                <Button
                  className="bg-purple-600 hover:bg-purple-700 text-white shadow-md transition-all duration-300 hover:shadow-lg hover:shadow-purple-700/20"
                  onClick={handleDownloadImages}
                  disabled={downloadingImages}
                >
                  {downloadingImages ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Descargando...
                    </>
                  ) : (
                    <>
                      <ArrowDownToLine className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Descargar</span>{" "}
                      <Badge
                        variant="secondary"
                        className="ml-1 bg-white/10 text-white border-none"
                      >
                        {selectedImages.length}
                      </Badge>
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 md:py-12">
        {gallery.images && gallery.images.length > 0 ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {gallery.images.map((image, index) => {
                const imageId = image.id || `image_${index}`;
                const isLiked = likedImages.includes(imageId);

                return (
                  <Card
                    key={index}
                    className={cn(
                      "relative overflow-hidden group transition-all duration-300 hover:shadow-xl hover:shadow-purple-900/20 bg-black border-gray-800",
                      selectedImages.includes(index)
                        ? "ring-2 ring-purple-500 shadow-lg shadow-purple-500/20"
                        : "hover:scale-[1.02] hover:border-purple-800"
                    )}
                  >
                    <div className="aspect-square bg-gray-900 relative overflow-hidden">
                      {/* Loading state - simplified */}
                      {loadingImages[index] !== false && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
                          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}

                      <img
                        src={getImageUrl(image)}
                        alt={image?.name || "Image"}
                        className="w-full h-full object-cover cursor-pointer transition-all duration-500 group-hover:scale-105"
                        onClick={() => openImageView(image, index)}
                        onLoad={() => handleImageLoad(index)}
                        onError={() => handleImageError(index)}
                      />

                      {/* Overlay gradient */}
                      <div
                        className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        onClick={() => openImageView(image, index)}
                      />

                      {/* Selection checkbox */}
                      <div className="absolute top-3 left-3 z-20">
                        <div
                          className={cn(
                            "h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all duration-300",
                            selectedImages.includes(index)
                              ? "bg-purple-600 border-purple-400 scale-110"
                              : "bg-black/40 border-white/60 group-hover:bg-black/60 backdrop-blur-sm"
                          )}
                          onClick={(e) => toggleImageSelection(index, e)}
                        >
                          {selectedImages.includes(index) && (
                            <Check className="h-3.5 w-3.5 text-white" />
                          )}
                        </div>
                      </div>

                      {/* Image actions */}
                      <div className="absolute bottom-0 left-0 right-0 p-3 flex justify-between items-end opacity-0 group-hover:opacity-100 transition-all duration-300 z-20">
                        {/* Image name */}
                        {image.name && (
                          <p className="text-sm font-medium text-white truncate max-w-[70%] drop-shadow-md">
                            {image.name}
                          </p>
                        )}

                        {/* Quick actions */}
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm"
                            onClick={() => openImageView(image, index)}
                          >
                            <Maximize2 className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(getImageUrl(image), "_blank");
                            }}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Likes badge */}
                      {image.likes > 0 && (
                        <div className="absolute top-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm z-10 flex items-center gap-1">
                          <Heart className="h-3 w-3 fill-purple-400 text-purple-400" />
                          {image.likes}
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="columns-1 sm:columns-2 md:columns-3 gap-6 space-y-6">
              {gallery.images.map((image, index) => {
                const imageId = image.id || `image_${index}`;
                const isLiked = likedImages.includes(imageId);

                return (
                  <div
                    key={index}
                    className={cn(
                      "relative overflow-hidden break-inside-avoid group mb-6 rounded-lg transition-all duration-300 hover:shadow-xl hover:shadow-purple-900/20 bg-black border border-gray-800",
                      selectedImages.includes(index)
                        ? "ring-2 ring-purple-500 shadow-lg shadow-purple-500/20"
                        : "hover:border-purple-800"
                    )}
                  >
                    <div className="relative">
                      {/* Loading state - simplified */}
                      {loadingImages[index] !== false && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
                          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}

                      <img
                        src={getImageUrl(image)}
                        alt={image?.name || "Image"}
                        className="w-full h-auto cursor-pointer rounded-lg transition-all duration-500"
                        onClick={() => openImageView(image, index)}
                        onLoad={() => handleImageLoad(index)}
                        onError={() => handleImageError(index)}
                      />

                      {/* Overlay gradient */}
                      <div
                        className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"
                        onClick={() => openImageView(image, index)}
                      />

                      {/* Selection checkbox */}
                      <div className="absolute top-3 left-3 z-20">
                        <div
                          className={cn(
                            "h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all duration-300",
                            selectedImages.includes(index)
                              ? "bg-purple-600 border-purple-400 scale-110"
                              : "bg-black/40 border-white/60 group-hover:bg-black/60 backdrop-blur-sm"
                          )}
                          onClick={(e) => toggleImageSelection(index, e)}
                        >
                          {selectedImages.includes(index) && (
                            <Check className="h-3.5 w-3.5 text-white" />
                          )}
                        </div>
                      </div>

                      {/* Image actions */}
                      <div className="absolute bottom-0 left-0 right-0 p-3 flex justify-between items-end opacity-0 group-hover:opacity-100 transition-all duration-300 z-20">
                        {/* Image name */}
                        {image.name && (
                          <p className="text-sm font-medium text-white truncate max-w-[70%] drop-shadow-md">
                            {image.name}
                          </p>
                        )}

                        {/* Quick actions */}
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm"
                            onClick={() => openImageView(image, index)}
                          >
                            <Maximize2 className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(getImageUrl(image), "_blank");
                            }}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Likes badge */}
                      {image.likes > 0 && (
                        <div className="absolute top-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm z-10 flex items-center gap-1">
                          <Heart className="h-3 w-3 fill-purple-400 text-purple-400" />
                          {image.likes}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          <Card className="p-8 text-center border-dashed border-2 border-purple-700/50 bg-black/50 text-white">
            <div className="flex flex-col items-center gap-2 max-w-md mx-auto">
              <div className="rounded-full bg-purple-900/50 p-6 mb-2">
                <ImageIcon className="h-12 w-12 text-purple-400" />
              </div>
              <h3 className="text-2xl font-medium mt-2">No hay imágenes</h3>
              <p className="text-gray-400 mb-4">
                El propietario de la galería aún no ha agregado ninguna imagen.
              </p>
            </div>
          </Card>
        )}
      </main>

      <Dialog
        open={!!viewImage}
        onOpenChange={(open) => !open && setViewImage(null)}
      >
        <DialogContent className="max-w-6xl p-0 overflow-hidden bg-black border border-purple-900/50 shadow-2xl shadow-purple-900/20 rounded-xl">
          <div className="relative flex flex-col h-[90vh] max-h-[90vh]">
            {/* Image navigation controls */}
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-3 backdrop-blur-md z-20 transition-all duration-300 hover:scale-110"
              onClick={() => navigateImage(-1)}
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-3 backdrop-blur-md z-20 transition-all duration-300 hover:scale-110"
              onClick={() => navigateImage(1)}
            >
              <ChevronRight className="h-6 w-6" />
            </button>

            {/* Close button */}
            {/* <button
              className="absolute right-4 top-4 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 backdrop-blur-md z-20 transition-all duration-300"
              onClick={() => setViewImage(null)}
            >
              <X className="h-5 w-5" />
            </button> */}

            {/* Image container */}
            <div className="flex-1 flex items-center justify-center overflow-hidden bg-black/90">
              <img
                src={getImageUrl(viewImage)}
                alt={viewImage?.name || "Image"}
                className="max-h-full max-w-full object-contain transition-transform duration-300"
              />
            </div>

            {/* Image info footer */}
            <div className="bg-black/95 text-white p-4 border-t border-purple-900/30 backdrop-blur-md">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium">
                    {viewImage?.name.slice(0, 10) + "..." || "Sin título"}
                  </h3>
                  <div className="flex items-center text-xs text-purple-300 mt-1">
                    <Info className="h-3 w-3 mr-1" />
                    {viewImage?.type && (
                      <span className="mr-2">{viewImage.type}</span>
                    )}
                    {viewImage?.size && (
                      <span>{Math.round(viewImage.size / 1024)} KB</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {viewImage && (
                    <Button
                      variant={
                        viewImage.likedBy?.includes(userEmail)
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      className={cn(
                        viewImage.likedBy?.includes(userEmail)
                          ? "bg-purple-600 hover:bg-purple-700"
                          : "border-purple-400 text-purple-400 hover:bg-purple-950"
                      )}
                      onClick={() => handleLikeClick(viewIndex)}
                    >
                      <Heart
                        className={cn(
                          "h-4 w-4 mr-1",
                          viewImage.likedBy?.includes(userEmail)
                            ? "fill-current"
                            : ""
                        )}
                      />
                      {/* {viewImage.likedBy?.includes(userEmail)
                        ? "Me gusta"
                        : "Dar Like"} */}
                      {viewImage.likes > 0 && (
                        <Badge
                          variant="secondary"
                          className="ml-1 bg-purple-500/20 text-purple-100"
                        >
                          {viewImage.likes}
                        </Badge>
                      )}
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    className="border-purple-400 text-purple-400 hover:bg-purple-950"
                    onClick={() =>
                      window.open(
                        viewImage?.url || getImageUrl(viewImage),
                        "_blank"
                      )
                    }
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Descargar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
