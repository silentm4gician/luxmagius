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

export default function GalleryDetail({ params }) {
  const { id } = React.use(params);
  const { user } = useAuth();
  const router = useRouter();
  const [gallery, setGallery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [selectedImages, setSelectedImages] = useState([]);
  const [deleteImageIndex, setDeleteImageIndex] = useState(null);

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

        setGallery(galleryData);
      } catch (error) {
        console.error("Error fetching gallery:", error);
        setError("Failed to load gallery details");
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

    try {
      const uploadedImages = [];

      for (const file of files) {
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
        });
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

      // Reset the file input
      e.target.value = null;
    } catch (error) {
      console.error("Error uploading files:", error);
      setError("Failed to upload images. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleGoogleDriveUpload = async (files) => {
    if (files.length === 0) return;

    setUploading(true);
    setError("");

    try {
      const uploadedImages = files.map((file) => ({
        url: file.url,
        name: file.name,
        type: file.mimeType,
        size: file.sizeBytes,
        driveId: file.id,
        uploadedAt: new Date().toISOString(),
      }));

      // Update the gallery document with the new images
      const galleryRef = doc(db, "galleries", id);
      await updateDoc(galleryRef, {
        images: arrayUnion(...uploadedImages),
        imageCount: increment(uploadedImages.length),
        updatedAt: new Date(),
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
    } catch (error) {
      console.error("Error adding Google Drive files:", error);
      setError("Failed to add images from Google Drive. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async () => {
    if (deleteImageIndex === null) return;

    try {
      const updatedImages = [...gallery.images];
      updatedImages.splice(deleteImageIndex, 1);

      // Update the gallery document
      const galleryRef = doc(db, "galleries", id);
      await updateDoc(galleryRef, {
        images: updatedImages,
        imageCount: increment(-1),
        updatedAt: new Date(),
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
    } catch (error) {
      console.error("Error deleting image:", error);
      setError("Failed to delete image. Please try again.");
    } finally {
      setDeleteImageIndex(null);
    }
  };

  const handleDownloadImage = async (image) => {
    try {
      const isGoogleDrive = image.url.includes("drive.google.com");

      if (isGoogleDrive && image.driveId) {
        // Abrir el link directo a la descarga desde Google Drive
        const downloadUrl = `https://drive.google.com/uc?export=download&id=${image.driveId}`;
        window.open(downloadUrl, "_blank");
      } else {
        // Descargar desde Firebase u otros orígenes permitidos por fetch
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
      setError("Failed to download image.");
    }
  };

  const copyGalleryLink = () => {
    const link = `${window.location.origin}/g/${id}`;
    navigator.clipboard.writeText(link);
  };

  if (loading) {
    return (
      <div className="md:ml-64 flex justify-center items-center h-[calc(100vh-64px)]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!gallery) {
    return (
      <div className="md:ml-64 p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Galeria no encontrada o no tienes permiso para verla.
          </AlertDescription>
        </Alert>
        <Button
          className="mt-4"
          onClick={() => router.push("/dashboard/galleries")}
        >
          Volver a Galerias
        </Button>
      </div>
    );
  }

  return (
    <div className="md:ml-64">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/dashboard/galleries")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl sm:text-3xl font-bold">{gallery.name}</h1>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={copyGalleryLink}
              className="gap-2"
            >
              <LinkIcon className="h-4 w-4" />
              Copiar Link
            </Button>
            <Button
              onClick={() => router.push(`/dashboard/galleries/${id}/edit`)}
              className="gap-2"
            >
              <Edit className="h-4 w-4" />
              Editar Galeria
            </Button>
          </div>
        </div>

        <Tabs defaultValue="images">
          <TabsList className="grid w-full grid-cols-2 sm:w-[400px]">
            <TabsTrigger value="images" className="flex items-center gap-2">
              <Grid className="h-4 w-4" />
              Imagenes
            </TabsTrigger>
            <TabsTrigger value="details" className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              Detalles
            </TabsTrigger>
          </TabsList>

          <TabsContent value="images" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Galeria de Imagenes</CardTitle>
                <CardDescription>
                  {gallery.imageCount > 0
                    ? `Esta galeria contiene ${gallery.imageCount} imagenes`
                    : "Sube imagenes a esta galeria"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <Label htmlFor="file-upload" className="block mb-2">
                      Subir desde tu dispositivo
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="file-upload"
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileUpload}
                        disabled={uploading}
                        className="flex-1"
                      />
                      <Button
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
                      </Button>
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

                {gallery.images && gallery.images.length > 0 ? (
                  <ImageGrid
                    images={gallery.images}
                    onDelete={(index) => setDeleteImageIndex(index)}
                    selectedImages={selectedImages}
                    setSelectedImages={setSelectedImages}
                  />
                ) : (
                  <div className="text-center py-12 border rounded-lg">
                    <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-medium">
                      No hay imagenes
                    </h3>
                    <p className="text-muted-foreground">
                      Sube imagenes para comenzar
                    </p>
                  </div>
                )}
              </CardContent>
              {gallery.images && gallery.images.length > 0 && (
                <CardFooter className="flex justify-between">
                  {selectedImages.length > 0 ? (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="text-red-600"
                        onClick={() => setDeleteImageIndex(selectedImages[0])}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Borrar Seleccionados
                      </Button>
                      <Button
                        variant="outline"
                        onClick={async () => {
                          for (const index of selectedImages) {
                            await handleDownloadImage(gallery.images[index]);
                          }
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Descargar Seleccionados
                      </Button>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      Selecciona imagenes para borrar o descargar
                    </p>
                  )}
                </CardFooter>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="details" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Informacion de la Galeria</CardTitle>
                <CardDescription>
                  Ver y administrar detalles de la galeria
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">
                      Nombre
                    </h3>
                    <p className="text-lg">{gallery.name}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">
                      Fecha de Creacion
                    </h3>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <p>
                        {gallery.createdAt
                          ? new Date(
                              gallery.createdAt.seconds * 1000
                            ).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">
                      Descripcion
                    </h3>
                    <p>{gallery.description || "No description provided"}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">
                      Proteccion con contraseña
                    </h3>
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                      <p>{gallery.password ? "Habilitada" : "Deshabilitada"}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t">
                  <h3 className="text-lg font-medium mb-2">
                    Imagenes con Me Gusta
                  </h3>
                  {gallery.images &&
                  gallery.images.some((img) => img.likes > 0) ? (
                    <>
                      <div className="space-y-2 mb-4">
                        {gallery.images
                          .filter((img) => img.likes > 0)
                          .map((img, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between gap-2 p-2 border rounded-lg"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-sm">{img.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  ({img.likes} likes)
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {img.likedBy
                                    .map((likedBy) => likedBy)
                                    .join(", ")}
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  navigator.clipboard.writeText(img.name);
                                }}
                              >
                                Copiar
                              </Button>
                            </div>
                          ))}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            const likedImages = gallery.images
                              .filter((img) => img.likes > 0)
                              .map((img) => img.name)
                              .join(", ");
                            navigator.clipboard.writeText(likedImages);
                          }}
                        >
                          Copiar Todos los Nombres
                        </Button>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No hay imagenes con Me Gusta todavia
                    </p>
                  )}
                </div>

                <div className="mt-6 pt-6 border-t">
                  <h3 className="text-lg font-medium mb-2">
                    Enlace de la galeria
                  </h3>
                  <div className="flex gap-2">
                    <Input
                      value={`${window.location.origin}/g/${id}`}
                      readOnly
                      className="flex-1"
                    />
                    <Button variant="outline" onClick={copyGalleryLink}>
                      Copiar
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Comparte este enlace con tu cliente
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => router.push("/dashboard/galleries")}
                >
                  Regresar a las galerias
                </Button>
                <Button
                  onClick={() => router.push(`/dashboard/galleries/${id}/edit`)}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar galeria
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
            <AlertDialogTitle>¿Estas seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion sera permanente y no podra ser deshecha.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
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
