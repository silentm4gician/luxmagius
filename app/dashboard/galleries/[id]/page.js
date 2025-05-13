"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { db, storage } from "@/lib/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  increment,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowLeft,
  Upload,
  LinkIcon,
  Edit,
  Trash2,
  ImageIcon,
  Loader2,
  Info,
  Lock,
  Calendar,
  Grid,
  Download,
  AlertCircle,
  Check,
  Eye,
  Heart,
  Share2,
  Copy,
  SortAsc,
  X,
  CheckCircle,
  Clock,
  FileText,
  Users,
  EyeIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GoogleDrivePicker } from "@/components/google-drive-picker";
import { ImageGrid } from "@/components/image-grid";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import getImageUrl from "@/hooks/useImageUrl";
import Link from "next/link";

export default function GalleryDetail({ params }) {
  const { id } = React.use(params);
  const { user } = useAuth();
  const router = useRouter();
  const [gallery, setGallery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedImages, setSelectedImages] = useState([]);
  const [deleteImageIndex, setDeleteImageIndex] = useState(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [namesCopied, setNamesCopied] = useState(false);
  const [sortBy, setSortBy] = useState("newest"); // newest, oldest, name, likes
  const [filterLiked, setFilterLiked] = useState(false);
  const [uploadCount, setUploadCount] = useState({ total: 0, current: 0 });

  useEffect(() => {
    const fetchGallery = async () => {
      if (!user || !id) return;

      try {
        const galleryDoc = await getDoc(doc(db, "galleries", id));

        if (!galleryDoc.exists()) {
          router.push("/dashboard/galleries");
          return;
        }

        const galleryData = { id: galleryDoc.id, ...galleryDoc.data() };

        // Check if the gallery belongs to the current user
        if (galleryData.userId !== user.uid) {
          router.push("/dashboard/galleries");
          return;
        }

        // Ensure images array exists
        if (!galleryData.images) {
          galleryData.images = [];
        }

        setGallery(galleryData);
      } catch (error) {
        console.error("Error fetching gallery:", error);
        setError("Error al cargar los detalles de la galería");
      } finally {
        setLoading(false);
      }
    };

    fetchGallery();
  }, [id, user, router]);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    setError("");
    setUploadProgress(0);
    setUploadCount({ total: files.length, current: 0 });

    try {
      const uploadedImages = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadCount((prev) => ({ ...prev, current: i + 1 }));

        // Create a reference to the storage location
        const storageRef = ref(
          storage,
          `galleries/${id}/${Date.now()}_${file.name}`
        );

        // Upload the file
        const snapshot = await uploadBytes(storageRef, file);

        // Get the download URL
        const downloadURL = await getDownloadURL(snapshot.ref);

        uploadedImages.push({
          url: downloadURL,
          name: file.name,
          type: file.type,
          size: file.size,
          uploadedAt: new Date().toISOString(),
          likes: 0,
          likedBy: [],
        });

        // Update progress
        setUploadProgress(Math.round(((i + 1) / files.length) * 100));
      }

      // Update the gallery document with the new images
      const galleryRef = doc(db, "galleries", id);
      await updateDoc(galleryRef, {
        images: arrayUnion(...uploadedImages),
        imageCount: increment(uploadedImages.length),
        updatedAt: serverTimestamp(),
      });

      // Update the local state
      setGallery((prev) => {
        const currentImages = Array.isArray(prev.images) ? prev.images : [];
        return {
          ...prev,
          images: [...currentImages, ...uploadedImages],
          imageCount: (prev.imageCount || 0) + uploadedImages.length,
        };
      });

      setSuccess(`${uploadedImages.length} imágenes subidas correctamente`);
      setTimeout(() => setSuccess(""), 3000);

      // Reset the file input
      e.target.value = null;
    } catch (error) {
      console.error("Error uploading files:", error);
      setError("Error al subir imágenes. Por favor, inténtalo de nuevo.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setUploadCount({ total: 0, current: 0 });
    }
  };

  const handleGoogleDriveUpload = async (files) => {
    if (files.length === 0) return;

    setUploading(true);
    setError("");
    setUploadProgress(0);
    setUploadCount({ total: files.length, current: 0 });

    try {
      const uploadedImages = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadCount((prev) => ({ ...prev, current: i + 1 }));

        uploadedImages.push({
          url: file.url,
          name: file.name,
          type: file.mimeType,
          size: file.sizeBytes,
          driveId: file.id,
          uploadedAt: new Date().toISOString(),
          likes: 0,
          likedBy: [],
        });

        // Update progress
        setUploadProgress(Math.round(((i + 1) / files.length) * 100));
      }

      // Update the gallery document with the new images
      const galleryRef = doc(db, "galleries", id);
      await updateDoc(galleryRef, {
        images: arrayUnion(...uploadedImages),
        imageCount: increment(uploadedImages.length),
        updatedAt: serverTimestamp(),
      });

      // Update the local state
      setGallery((prev) => {
        const currentImages = Array.isArray(prev.images) ? prev.images : [];
        return {
          ...prev,
          images: [...currentImages, ...uploadedImages],
          imageCount: (prev.imageCount || 0) + uploadedImages.length,
        };
      });

      setSuccess(
        `${uploadedImages.length} imágenes de Google Drive añadidas correctamente`
      );
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Error adding Google Drive files:", error);
      setError(
        "Error al añadir imágenes desde Google Drive. Por favor, inténtalo de nuevo."
      );
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setUploadCount({ total: 0, current: 0 });
    }
  };

  const handleDeleteImage = async () => {
    // If we're deleting a single image via the delete button on the image
    if (deleteImageIndex !== null && !Array.isArray(deleteImageIndex)) {
      try {
        const updatedImages = [...gallery.images];
        updatedImages.splice(deleteImageIndex, 1);

        // Update the gallery document
        const galleryRef = doc(db, "galleries", id);
        await updateDoc(galleryRef, {
          images: updatedImages,
          imageCount: increment(-1),
          updatedAt: serverTimestamp(),
        });

        // Update the local state
        setGallery((prev) => ({
          ...prev,
          images: updatedImages,
          imageCount: prev.imageCount - 1,
        }));

        // Reset selected images if needed
        if (selectedImages.includes(deleteImageIndex)) {
          setSelectedImages(
            selectedImages.filter((index) => index !== deleteImageIndex)
          );
        }

        setSuccess("Imagen eliminada correctamente");
        setTimeout(() => setSuccess(""), 3000);
      } catch (error) {
        console.error("Error deleting image:", error);
        setError("Error al eliminar la imagen. Por favor, inténtalo de nuevo.");
      } finally {
        setDeleteImageIndex(null);
      }
    }
    // If we're deleting multiple selected images
    else if (Array.isArray(deleteImageIndex) && deleteImageIndex.length > 0) {
      try {
        // Sort indices in descending order to avoid index shifting issues when removing items
        const indicesToDelete = [...deleteImageIndex].sort((a, b) => b - a);
        const updatedImages = [...gallery.images];

        // Remove images from the array
        for (const index of indicesToDelete) {
          updatedImages.splice(index, 1);
        }

        // Update the gallery document
        const galleryRef = doc(db, "galleries", id);
        await updateDoc(galleryRef, {
          images: updatedImages,
          imageCount: increment(-indicesToDelete.length),
          updatedAt: serverTimestamp(),
        });

        // Update the local state
        setGallery((prev) => ({
          ...prev,
          images: updatedImages,
          imageCount: prev.imageCount - indicesToDelete.length,
        }));

        // Clear selected images
        setSelectedImages([]);

        setSuccess(
          `${indicesToDelete.length} imágenes eliminadas correctamente`
        );
        setTimeout(() => setSuccess(""), 3000);
      } catch (error) {
        console.error("Error deleting images:", error);
        setError(
          "Error al eliminar las imágenes. Por favor, inténtalo de nuevo."
        );
      } finally {
        setDeleteImageIndex(null);
      }
    }
  };

  const handleDownloadImage = async (imageOrImages) => {
    // If we're downloading a single image
    if (!Array.isArray(imageOrImages)) {
      const image = imageOrImages;
      try {
        const isGoogleDrive = image.url.includes("drive.google.com");

        if (isGoogleDrive && image.driveId) {
          // Open direct download link from Google Drive
          const downloadUrl = `https://drive.google.com/uc?export=download&id=${image.driveId}`;
          window.open(downloadUrl, "_blank");
        } else {
          // Download from Firebase or other sources allowed by fetch
          const response = await fetch(image.url);
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);

          const link = document.createElement("a");
          link.href = url;
          link.download = image.name || "image";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        }
      } catch (err) {
        console.error("Failed to download image", err);
        setError("Error al descargar la imagen.");
      }
    }
    // If we're downloading multiple images, download them individually instead of as a ZIP
    else if (Array.isArray(imageOrImages) && imageOrImages.length > 0) {
      try {
        setError("");
        // Show loading state
        const downloadButton = document.getElementById(
          "download-selected-button"
        );
        if (downloadButton) {
          downloadButton.disabled = true;
          downloadButton.innerHTML =
            '<span class="animate-spin mr-2">↻</span> Descargando...';
        }

        // Create a single popup notification for Google Drive images
        const googleDriveImages = imageOrImages.filter(
          (img) => img.url.includes("drive.google.com") && img.driveId
        );
        const regularImages = imageOrImages.filter(
          (img) => !(img.url.includes("drive.google.com") && img.driveId)
        );

        // First handle Google Drive images with a notification
        if (googleDriveImages.length > 0) {
          // Create a notification for Google Drive images
          setError(
            `${googleDriveImages.length} imágenes de Google Drive se abrirán en pestañas separadas. Por favor, permita las ventanas emergentes.`
          );

          // Wait a moment for the user to see the notification
          await new Promise((resolve) => setTimeout(resolve, 2000));

          // Open Google Drive images with a larger delay between them
          for (let i = 0; i < googleDriveImages.length; i++) {
            const image = googleDriveImages[i];
            const downloadUrl = `https://drive.google.com/uc?export=download&id=${image.driveId}`;

            // Create a temporary button that the user can click to download
            const tempButton = document.createElement("button");
            tempButton.textContent = `Descargar ${
              image.name || `imagen ${i + 1}`
            }`;
            tempButton.className =
              "bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded mb-2 mr-2";
            tempButton.onclick = () => window.open(downloadUrl, "_blank");

            // Add the button to a container
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
              containerElement = document.getElementById(
                "temp-download-buttons"
              );
            }

            containerElement.appendChild(tempButton);
          }
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

            setError("");
          } catch (error) {
            console.error(`Error downloading image ${image.name || i}:`, error);

            // Add to the notification panel instead of opening a new tab
            setError(
              (prev) =>
                prev +
                `\nError al descargar ${image.name || `imagen ${i + 1}`}: ${
                  error.message
                }`
            );
          }
        }

        // Reset button state
        if (downloadButton) {
          downloadButton.disabled = false;
          downloadButton.innerHTML =
            '<svg class="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>Descargar Seleccionados';
        }
      } catch (err) {
        console.error("Failed to download images:", err);
        setError(
          "Error al descargar las imágenes. Por favor, inténtalo de nuevo."
        );

        // Reset button state
        const downloadButton = document.getElementById(
          "download-selected-button"
        );
        if (downloadButton) {
          downloadButton.disabled = false;
          downloadButton.innerHTML =
            '<svg class="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>Descargar Seleccionados';
        }
      }
    }
  };

  const copyGalleryLink = () => {
    const link = `${window.location.origin}/g/${id}`;
    navigator.clipboard.writeText(link);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const copyLikedImageNames = () => {
    const likedImages = gallery.images
      .filter((img) => img.likes > 0)
      .map((img) => img.name)
      .join(", ");
    navigator.clipboard.writeText(likedImages);
    setNamesCopied(true);
    setTimeout(() => setNamesCopied(false), 2000);
  };

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return "Sin fecha";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return new Intl.DateTimeFormat("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    } catch (e) {
      return "Fecha inválida";
    }
  };

  // Get sorted and filtered images
  const getSortedAndFilteredImages = () => {
    if (!gallery || !gallery.images) return [];

    let filteredImages = [...gallery.images];

    // Apply filter
    if (filterLiked) {
      filteredImages = filteredImages.filter((img) => img.likes > 0);
    }

    // Apply sort
    return filteredImages.sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.uploadedAt || 0) - new Date(a.uploadedAt || 0);
      } else if (sortBy === "oldest") {
        return new Date(a.uploadedAt || 0) - new Date(b.uploadedAt || 0);
      } else if (sortBy === "name") {
        return (a.name || "").localeCompare(b.name || "");
      } else if (sortBy === "likes") {
        return (b.likes || 0) - (a.likes || 0);
      }
      return 0;
    });
  };

  // Calculate total likes
  const getTotalLikes = () => {
    if (!gallery || !gallery.images) return 0;
    return gallery.images.reduce((total, img) => total + (img.likes || 0), 0);
  };

  // Calculate total size
  const getTotalSize = () => {
    if (!gallery || !gallery.images) return 0;
    const totalBytes = gallery.images.reduce(
      (total, img) => total + (img.size || 0),
      0
    );
    const totalMB = totalBytes / (1024 * 1024);
    return totalMB.toFixed(2);
  };

  if (loading) {
    return (
      <div className="md:ml-64 flex justify-center items-center h-[calc(100vh-64px)]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-purple-300 animate-pulse">Cargando galería...</p>
        </div>
      </div>
    );
  }

  if (!gallery) {
    return (
      <div className="md:ml-64 p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Galería no encontrada o no tienes permiso para verla.
          </AlertDescription>
        </Alert>
        <Button
          className="mt-4"
          onClick={() => router.push("/dashboard/galleries")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Galerías
        </Button>
      </div>
    );
  }

  const sortedImages = getSortedAndFilteredImages();

  return (
    <div className="md:ml-64 p-6">
      <div className="flex flex-col gap-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/dashboard/galleries")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">{gallery.name}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Calendar className="h-3 w-3" />
                <span>Creada el {formatDate(gallery.createdAt)}</span>
                {gallery.password && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    <Lock className="h-3 w-3 mr-1" />
                    Protegida
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    onClick={copyGalleryLink}
                    className="gap-2"
                  >
                    {linkCopied ? (
                      <>
                        <Check className="h-4 w-4" />
                        Copiado
                      </>
                    ) : (
                      <>
                        <LinkIcon className="h-4 w-4" />
                        Copiar Link
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Copiar enlace de la galería para compartir
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Link href={`/g/${id}`} target="_blank">
              <Button className="border hover:bg-gray-400/20 bg-transparent">
                <EyeIcon className="h-4 w-4 mr-2" />
                Vista Previa
              </Button>
            </Link>

            <Button
              onClick={() => router.push(`/dashboard/galleries/${id}/edit`)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar Galería
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-500/10 text-green-500 border-green-500/20">
            <Check className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
          <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <div className="rounded-full bg-purple-100 p-2 dark:bg-purple-900/30 mb-2">
                <ImageIcon className="h-5 w-5 text-purple-600" />
              </div>
              <div className="text-2xl font-bold">
                {gallery.imageCount || 0}
              </div>
              <p className="text-xs text-muted-foreground">Imágenes</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <div className="rounded-full bg-purple-100 p-2 dark:bg-purple-900/30 mb-2">
                <Heart className="h-5 w-5 text-purple-600" />
              </div>
              <div className="text-2xl font-bold">{getTotalLikes()}</div>
              <p className="text-xs text-muted-foreground">Me gusta</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <div className="rounded-full bg-purple-100 p-2 dark:bg-purple-900/30 mb-2">
                <Eye className="h-5 w-5 text-purple-600" />
              </div>
              <div className="text-2xl font-bold">{gallery.views || 0}</div>
              <p className="text-xs text-muted-foreground">Vistas</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <div className="rounded-full bg-purple-100 p-2 dark:bg-purple-900/30 mb-2">
                <FileText className="h-5 w-5 text-purple-600" />
              </div>
              <div className="text-2xl font-bold">{getTotalSize()} MB</div>
              <p className="text-xs text-muted-foreground">Tamaño total</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="images" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:w-[400px]">
            <TabsTrigger value="images" className="flex items-center gap-2">
              <Grid className="h-4 w-4" />
              Imágenes
            </TabsTrigger>
            <TabsTrigger value="details" className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              Detalles
            </TabsTrigger>
          </TabsList>

          <TabsContent value="images" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle>Galería de Imágenes</CardTitle>
                    <CardDescription>
                      {gallery.imageCount > 0
                        ? `Esta galería contiene ${gallery.imageCount} imágenes`
                        : "Sube imágenes a esta galería"}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className={
                              filterLiked
                                ? "bg-purple-100 text-purple-700 border-purple-200"
                                : ""
                            }
                            onClick={() => setFilterLiked(!filterLiked)}
                          >
                            <Heart className="h-4 w-4 mr-2" />
                            {filterLiked ? "Todas" : "Con Me gusta"}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {filterLiked
                            ? "Mostrar todas las imágenes"
                            : "Mostrar solo imágenes con Me gusta"}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <SortAsc className="h-4 w-4 mr-2" />
                          Ordenar
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSortBy("newest")}>
                          <Clock className="mr-2 h-4 w-4" />
                          Más recientes primero
                          {sortBy === "newest" && (
                            <CheckCircle className="ml-2 h-4 w-4 text-green-500" />
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortBy("oldest")}>
                          <Clock className="mr-2 h-4 w-4" />
                          Más antiguas primero
                          {sortBy === "oldest" && (
                            <CheckCircle className="ml-2 h-4 w-4 text-green-500" />
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortBy("name")}>
                          <FileText className="mr-2 h-4 w-4" />
                          Ordenar por nombre
                          {sortBy === "name" && (
                            <CheckCircle className="ml-2 h-4 w-4 text-green-500" />
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortBy("likes")}>
                          <Heart className="mr-2 h-4 w-4" />
                          Más Me gusta primero
                          {sortBy === "likes" && (
                            <CheckCircle className="ml-2 h-4 w-4 text-green-500" />
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <Label htmlFor="file-upload" className="block mb-2">
                      Subir desde tu dispositivo
                    </Label>
                    <div className="flex gap-2">
                      {/* <Input
                        id="file-upload"
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileUpload}
                        disabled={uploading}
                        className="flex-1"
                      /> */}
                      <Input
                        placeholder="Proximamente..."
                        disabled
                        type="text"
                        className="flex-1"
                      />
                      {/* <Button
                        onClick={() =>
                          document.getElementById("file-upload").click()
                        }
                        disabled={uploading}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        {uploading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                      </Button> */}
                    </div>
                  </div>

                  <div className="flex-1">
                    <Label className="block mb-2">
                      Importar desde Google Drive
                    </Label>
                    <GoogleDrivePicker
                      onSelect={handleGoogleDriveUpload}
                      disabled={uploading}
                    />
                  </div>
                </div>

                {uploading && (
                  <div className="mb-6">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Subiendo imágenes...</span>
                      <span>
                        {uploadCount.current} de {uploadCount.total}
                      </span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                )}

                {filterLiked && (
                  <div className="mb-4">
                    <Badge
                      variant="outline"
                      className="bg-purple-50 text-purple-700"
                    >
                      Mostrando solo imágenes con Me gusta (
                      {sortedImages.length} de {gallery.images.length})
                    </Badge>
                  </div>
                )}

                {sortedImages.length > 0 ? (
                  <ImageGrid
                    images={sortedImages}
                    onDelete={(indexFromSorted) => {
                      // Get the specific image object from the sorted/filtered array
                      const imageToDelete = sortedImages[indexFromSorted];
                      // Find the index of this *exact* image object in the original gallery.images array
                      const originalIndex = gallery.images.findIndex(
                        (img) => img.url === imageToDelete.url // Assuming URL is unique identifier
                        // If URL isn't guaranteed unique, you might need a different identifier like driveId or compare the objects directly
                        // (img) => img === imageToDelete
                      );
                      if (originalIndex !== -1) {
                        setDeleteImageIndex(originalIndex); // Set the index from the original array
                      } else {
                        console.error(
                          "Could not find image in original gallery array for deletion."
                        );
                        // Handle error appropriately - maybe show a message to the user
                      }
                    }}
                    onDownload={handleDownloadImage}
                    selectedImages={selectedImages}
                    setSelectedImages={setSelectedImages}
                  />
                ) : (
                  <div className="text-center py-12 border rounded-lg">
                    <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-medium">
                      No hay imágenes
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {filterLiked
                        ? "No hay imágenes con Me gusta. Cambia el filtro para ver todas las imágenes."
                        : "Sube imágenes para comenzar"}
                    </p>
                    {filterLiked && (
                      <Button
                        variant="outline"
                        onClick={() => setFilterLiked(false)}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Quitar filtro
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
              {sortedImages.length > 0 && (
                <CardFooter className="flex justify-between">
                  {selectedImages.length > 0 ? (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="text-red-600"
                        onClick={() => {
                          const originalIndicesToDelete = selectedImages
                            .map((selectedIndex) => {
                              const imageToDelete = sortedImages[selectedIndex];
                              if (!imageToDelete) return -1; // Should not happen, but safeguard
                              return gallery.images.findIndex(
                                (img) => img.url === imageToDelete.url // Or use another unique identifier
                                // (img) => img === imageToDelete
                              );
                            })
                            .filter((index) => index !== -1); // Filter out any not found indices

                          if (
                            originalIndicesToDelete.length !==
                            selectedImages.length
                          ) {
                            console.error(
                              "Some selected images could not be found in the original gallery array for deletion."
                            );
                            setError(
                              "Error al preparar imágenes para eliminar. Algunas imágenes seleccionadas no se encontraron."
                            );
                            // Optionally clear selectedImages here or handle differently
                          }

                          // Only proceed if we found all original indices
                          if (
                            originalIndicesToDelete.length > 0 &&
                            originalIndicesToDelete.length ===
                              selectedImages.length
                          ) {
                            setDeleteImageIndex(originalIndicesToDelete);
                          } else if (
                            originalIndicesToDelete.length === 0 &&
                            selectedImages.length > 0
                          ) {
                            // Handle case where no images could be mapped (edge case)
                            setError(
                              "No se pudieron encontrar las imágenes seleccionadas para eliminar."
                            );
                          }
                          // If lengths don't match and error was already set, do nothing more
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Borrar {selectedImages.length} seleccionadas
                      </Button>
                      <Button
                        variant="outline"
                        id="download-selected-button"
                        onClick={async () => {
                          await handleDownloadImage(
                            selectedImages.map((index) => sortedImages[index])
                          );
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Descargar {selectedImages.length} seleccionadas
                      </Button>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      Selecciona imágenes para borrar o descargar.{" "}
                      {sortedImages.length} imágenes disponibles.
                    </p>
                  )}
                </CardFooter>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="details" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Información de la Galería</CardTitle>
                <CardDescription>
                  Ver y administrar detalles de la galería
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Nombre
                    </h3>
                    <p className="text-lg font-medium">{gallery.name}</p>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Fecha de Creación
                    </h3>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-purple-600" />
                      <p>{formatDate(gallery.createdAt)}</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Descripción
                    </h3>
                    <p>{gallery.description || "Sin descripción"}</p>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Protección con contraseña
                    </h3>
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-purple-600" />
                      <p>{gallery.password ? "Habilitada" : "Deshabilitada"}</p>
                      {gallery.password && (
                        <Badge variant="outline" className="ml-2">
                          ••••••••
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">
                      Estadísticas de la Galería
                    </h3>
                    <Badge
                      variant="outline"
                      className="bg-purple-50 text-purple-700"
                    >
                      Última actualización: {formatDate(gallery.updatedAt)}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="rounded-full bg-purple-100 p-2 dark:bg-purple-900/30">
                          <Eye className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Vistas
                          </p>
                          <p className="text-2xl font-bold">
                            {gallery.views || 0}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="rounded-full bg-purple-100 p-2 dark:bg-purple-900/30">
                          <Heart className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Me gusta
                          </p>
                          <p className="text-2xl font-bold">
                            {getTotalLikes()}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="rounded-full bg-purple-100 p-2 dark:bg-purple-900/30">
                          <Users className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Visitantes
                          </p>
                          <p className="text-2xl font-bold">
                            {gallery.uniqueVisitors?.length || 0}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Imágenes con Me Gusta</h3>
                  {gallery.images &&
                  gallery.images.some((img) => img.likes > 0) ? (
                    <>
                      <div className="space-y-2 mb-4 max-h-[300px] overflow-y-auto pr-2">
                        {gallery.images
                          .filter((img) => img.likes > 0)
                          .sort((a, b) => b.likes - a.likes)
                          .map((img, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between gap-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded overflow-hidden bg-muted flex-shrink-0">
                                  <img
                                    src={getImageUrl(img) || "/placeholder.svg"}
                                    alt={img.name}
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                                <div>
                                  <p className="font-medium truncate max-w-[200px]">
                                    {img.name}
                                  </p>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <div className="flex items-center">
                                      <Heart className="h-3 w-3 mr-1 text-red-500" />
                                      <span>{img.likes} me gusta</span>
                                    </div>
                                    {img.likedBy && img.likedBy.length > 0 && (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <div className="flex items-center cursor-help">
                                              <Users className="h-3 w-3 mr-1" />
                                              <span>
                                                {img.likedBy
                                                  .map((user) => user)
                                                  .join(", ")}
                                              </span>
                                            </div>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>{img.likedBy.join(", ")}</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  navigator.clipboard.writeText(img.name);
                                  setSuccess("Nombre copiado al portapapeles");
                                  setTimeout(() => setSuccess(""), 2000);
                                }}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={copyLikedImageNames}>
                          {namesCopied ? (
                            <>
                              <Check className="h-4 w-4 mr-2" />
                              Nombres Copiados
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4 mr-2" />
                              Copiar Todos los Nombres
                            </>
                          )}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 border rounded-lg">
                      <Heart className="h-12 w-12 mx-auto text-muted-foreground" />
                      <h3 className="mt-4 text-lg font-medium">
                        No hay imágenes con Me Gusta todavía
                      </h3>
                      <p className="text-muted-foreground">
                        Cuando tus clientes marquen imágenes con Me Gusta,
                        aparecerán aquí
                      </p>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Enlace de la galería</h3>
                  <div className="flex gap-2">
                    <Input
                      value={`${window.location.origin}/g/${id}`}
                      readOnly
                      className="flex-1"
                    />
                    <Button variant="outline" onClick={copyGalleryLink}>
                      {linkCopied ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          Copiar
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Share2 className="h-4 w-4" />
                    <p>
                      Comparte este enlace con tus clientes para que puedan ver
                      la galería
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => router.push("/dashboard/galleries")}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Regresar a las galerías
                </Button>
                <Button
                  onClick={() => router.push(`/dashboard/galleries/${id}/edit`)}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar galería
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <AlertDialog
        open={deleteImageIndex !== null}
        onOpenChange={(open) => !open && setDeleteImageIndex(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              {Array.isArray(deleteImageIndex)
                ? `Estás a punto de eliminar ${deleteImageIndex.length} imágenes. Esta acción será permanente y no podrá ser deshecha.`
                : "Esta acción será permanente y no podrá ser deshecha."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteImage}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Borrar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
