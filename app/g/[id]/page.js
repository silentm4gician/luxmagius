"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
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
import { Loader2, Lock, ArrowLeft } from "lucide-react";
import { ClientGalleryView } from "@/components/client-gallery-view";

export default function PublicGallery({ params }) {
  const { id } = React.use(params);
  const router = useRouter();
  const [gallery, setGallery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const fetchGallery = async () => {
      if (!id) return;

      try {
        const galleryDoc = await getDoc(doc(db, "galleries", id));

        if (!galleryDoc.exists()) {
          setError("Gallery not found");
          return;
        }

        const galleryData = { id: galleryDoc.id, ...galleryDoc.data() };
        setGallery(galleryData);

        // If no password is required, set authenticated to true
        if (!galleryData.password) {
          setAuthenticated(true);
        }
      } catch (error) {
        console.error("Error fetching gallery:", error);
        setError("Failed to load gallery");
      } finally {
        setLoading(false);
      }
    };

    fetchGallery();
  }, [id]);

  const handlePasswordSubmit = (e) => {
    e.preventDefault();

    if (password === gallery.password) {
      setAuthenticated(true);
    } else {
      setError("Incorrect password");
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
        </Card>
      </div>
    );
  }

  return <ClientGalleryView gallery={gallery} />;
}
