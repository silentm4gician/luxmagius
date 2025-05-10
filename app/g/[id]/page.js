"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Lock, ArrowLeft, Briefcase } from "lucide-react";
import { ClientGalleryView } from "@/components/client-gallery-view";
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
import Link from "next/link";

export default function PublicGallery({ params }) {
  const { id } = React.use(params);
  const router = useRouter();
  const [gallery, setGallery] = useState(null);
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [likedImages, setLikedImages] = useState([]);
  const [email, setEmail] = useState("");
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [tempImageIndex, setTempImageIndex] = useState(null);

  useEffect(() => {
    const fetchGalleryAndPortfolio = async () => {
      if (!id) return;

      try {
        const galleryDoc = await getDoc(doc(db, "galleries", id));

        if (!galleryDoc.exists()) {
          console.error(`Gallery with ID ${id} does not exist`);
          setError("Gallery not found");
          return;
        }

        const galleryData = { id: galleryDoc.id, ...galleryDoc.data() };
        
        // Debug logging for gallery data
        console.log("Gallery data:", {
          id: galleryData.id,
          isPublic: galleryData.isPublic,
          userId: galleryData.userId,
          name: galleryData.name || 'No name',
          images: galleryData.images ? galleryData.images.length : 'No images'
        });

        // Validate gallery data
        if (!galleryData.isPublic) {
          console.warn(`Gallery ${id} is not public`);
        }

        if (!galleryData.userId) {
          console.error(`Gallery ${id} is missing userId`);
        }

        setGallery(galleryData);

        // Fetch photographer's portfolio
        const portfolioQuery = query(
          collection(db, "portfolios"),
          where("userId", "==", galleryData.userId),
          where("isPublic", "==", true)
        );
        const portfolioSnapshot = await getDocs(portfolioQuery);

        if (!portfolioSnapshot.empty) {
          const portfolioData = {
            id: portfolioSnapshot.docs[0].id,
            ...portfolioSnapshot.docs[0].data(),
          };
          console.log("Portfolio data:", {
            id: portfolioData.id,
            userId: portfolioData.userId,
            isPublic: portfolioData.isPublic,
            name: portfolioData.name || 'No name'
          });
          setPortfolio(portfolioData);
        } else {
          console.log(`No public portfolio found for user ${galleryData.userId}`);
        }

        // If no password is required, set authenticated to true
        if (!galleryData.password) {
          setAuthenticated(true);
        }

        // Get stored email from localStorage
        const storedEmail = localStorage.getItem("gallery_email");
        if (storedEmail) {
          setEmail(storedEmail);
        }

        // Initialize liked images from localStorage
        const storedLikes = localStorage.getItem(`gallery_${id}_likes`);
        if (storedLikes) {
          setLikedImages(JSON.parse(storedLikes));
        }
      } catch (error) {
        console.error("Error fetching gallery:", error);
        console.error("Error details:", {
          code: error.code,
          message: error.message,
          stack: error.stack,
        });
        setError(`Failed to load gallery: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchGalleryAndPortfolio();
  }, [id]);

  const handlePasswordSubmit = (e) => {
    e.preventDefault();

    if (password === gallery.password) {
      setAuthenticated(true);
    } else {
      setError("Incorrect password");
    }
  };

  const handleToggleLike = async (imageIndex) => {
    // Validate gallery and image existence
    if (!gallery || !gallery.images || imageIndex < 0 || imageIndex >= gallery.images.length) {
      console.error('Invalid gallery or image index');
      return;
    }

    // Ensure gallery is public
    if (!gallery.isPublic) {
      alert('Esta galería no está disponible para Me Gusta.');
      return;
    }

    if (!email) {
      setTempImageIndex(imageIndex);
      setShowEmailDialog(true);
      return;
    }

    const newLikedImages = [...likedImages];
    const imageId = gallery.images[imageIndex].id || `image_${imageIndex}`;

    if (newLikedImages.includes(imageId)) {
      // Unlike
      const index = newLikedImages.indexOf(imageId);
      newLikedImages.splice(index, 1);

      try {
        const updatedImage = { ...gallery.images[imageIndex] };
        updatedImage.likes = Math.max((updatedImage.likes || 0) - 1, 0);

        // Remove email from likedBy array
        updatedImage.likedBy = (updatedImage.likedBy || []).filter(
          (e) => e !== email
        );

        const updatedImages = [...gallery.images];
        updatedImages[imageIndex] = updatedImage;

        await updateDoc(doc(db, "galleries", id), {
          images: updatedImages,
          updatedAt: serverTimestamp()
        });

        const updatedGallery = { ...gallery, images: updatedImages };
        setGallery(updatedGallery);
      } catch (error) {
        console.error("Error updating likes:", error);
        
        // Provide more user-friendly error handling
        if (error.code === 'permission-denied') {
          alert('No se puede actualizar los Me Gusta. Verifica que la galería sea pública.');
        } else {
          alert('Hubo un error al actualizar los Me Gusta. Por favor, intenta de nuevo.');
        }
        
        // Revert the like state
        setLikedImages(likedImages);
      }
    } else {
      // Like
      newLikedImages.push(imageId);

      try {
        const updatedImage = { ...gallery.images[imageIndex] };
        updatedImage.likes = (updatedImage.likes || 0) + 1;

        // Add email to likedBy array, preventing duplicates
        const likedBySet = new Set(updatedImage.likedBy || []);
        likedBySet.add(email);
        updatedImage.likedBy = Array.from(likedBySet);

        const updatedImages = [...gallery.images];
        updatedImages[imageIndex] = updatedImage;

        await updateDoc(doc(db, "galleries", id), {
          images: updatedImages,
          updatedAt: serverTimestamp()
        });

        const updatedGallery = { ...gallery, images: updatedImages };
        setGallery(updatedGallery);
      } catch (error) {
        console.error("Error updating likes:", error);
        
        // Provide more user-friendly error handling
        if (error.code === 'permission-denied') {
          alert('No se puede actualizar los Me Gusta. Verifica que la galería sea pública.');
        } else {
          alert('Hubo un error al actualizar los Me Gusta. Por favor, intenta de nuevo.');
        }
        
        // Revert the like state
        setLikedImages(likedImages);
      }
    }

    setLikedImages(newLikedImages);
    localStorage.setItem(`gallery_${id}_likes`, JSON.stringify(newLikedImages));
  };

  const handleEmailSubmit = (e) => {
    e.preventDefault();

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError("Por favor ingresa un email válido");
      return;
    }

    // Store email in localStorage
    localStorage.setItem("gallery_email", email);
    setEmailError("");
    setShowEmailDialog(false);

    // If there's a pending like, process it
    if (tempImageIndex !== null) {
      handleToggleLike(tempImageIndex);
      setTempImageIndex(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-background/80">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error && error === "Gallery not found") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-background/80">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Galería No Encontrada</CardTitle>
            <CardDescription>
              La galería que estás buscando no existe o ha sido eliminada.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.push("/")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Inicio
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-background/80 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Galería Protegida con Contraseña</CardTitle>
            <CardDescription>
              Ingresa la contraseña para ver esta galería
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Lock className="h-4 w-4" />
                  <span>Esta galería está protegida con contraseña</span>
                </div>
                <Input
                  type="password"
                  placeholder="Ingresa la contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                {error && <p className="text-sm text-red-500">{error}</p>}
              </div>
              <Button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                Desbloquear Galería
              </Button>
            </form>
          </CardContent>
          {portfolio && (
            <CardFooter className="flex flex-col items-center gap-4">
              <div className="w-full border-t pt-4">
                <p className="text-sm text-center text-muted-foreground mb-2">
                  Mientras tanto, puedes ver más trabajos del fotógrafo
                </p>
                <Link href={`/p/${portfolio.id}`}>
                  <Button variant="outline" className="w-full">
                    <Briefcase className="h-4 w-4 mr-2" />
                    Ver Portafolio
                  </Button>
                </Link>
              </div>
            </CardFooter>
          )}
        </Card>
      </div>
    );
  }

  return (
    <>
      <ClientGalleryView
        gallery={gallery}
        likedImages={likedImages}
        onToggleLike={handleToggleLike}
        userEmail={email}
        portfolio={portfolio}
      />
      <AlertDialog
        open={showEmailDialog}
        onOpenChange={(open) => !open && setShowEmailDialog(false)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ingresa tu Email</AlertDialogTitle>
            <AlertDialogDescription>
              Para dar Me Gusta necesitamos tu email. Esto nos ayuda a recordar
              tus Me Gusta cuando vuelvas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <form onSubmit={handleEmailSubmit}>
            <div className="space-y-4 py-4">
              <Input
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {emailError && (
                <p className="text-sm text-red-500">{emailError}</p>
              )}
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel type="button">Cancelar</AlertDialogCancel>
              <AlertDialogAction type="submit">Continuar</AlertDialogAction>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
