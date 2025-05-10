"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function NewGallery() {
  const { user } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    password: "",
    isPasswordProtected: false,
    isPublic: false,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (checked) => {
    setFormData((prev) => ({
      ...prev,
      isPasswordProtected: checked,
      password: checked ? prev.password : "",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.name.trim()) {
      return setError("Gallery name is required");
    }

    if (formData.isPasswordProtected && !formData.password.trim()) {
      return setError("Password is required when protection is enabled");
    }

    setLoading(true);

    try {
      const galleryData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        password: formData.isPasswordProtected
          ? formData.password.trim()
          : null,
        isPublic: formData.isPublic,
        userId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        imageCount: 0,
        images: [],
      };

      const docRef = await addDoc(collection(db, "galleries"), galleryData);
      router.push(`/dashboard/galleries/${docRef.id}`);
    } catch (error) {
      console.error("Error creating gallery:", error);
      setError("Failed to create gallery. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="md:ml-64">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Crear Nueva Galería</h1>
        </div>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Detalles de la Galería</CardTitle>
            <CardDescription>
              Crea una nueva galería para compartir con tus clientes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre de la Galería</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="p. ej., Boda Smith"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción (Opcional)</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Agrega detalles sobre esta galería"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="isPasswordProtected">
                    Protección con Contraseña
                  </Label>
                  <Switch
                    id="isPasswordProtected"
                    checked={formData.isPasswordProtected}
                    onCheckedChange={handleSwitchChange}
                  />
                </div>

                {formData.isPasswordProtected && (
                  <div className="space-y-2">
                    <Label htmlFor="password">Contraseña de la Galería</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="Introduce una contraseña"
                      value={formData.password}
                      onChange={handleChange}
                    />
                    <p className="text-xs text-muted-foreground">
                      Los clientes necesitarán esta contraseña para ver la
                      galería
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Label htmlFor="isPublic">
                    Galería Pública
                  </Label>
                  <Switch
                    id="isPublic"
                    checked={formData.isPublic}
                    onCheckedChange={(checked) => {
                      setFormData((prev) => ({ ...prev, isPublic: checked }));
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Las galerías públicas pueden ser accedidas por cualquiera con el enlace
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => router.back()}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    "Crear Galería"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
