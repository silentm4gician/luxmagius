"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { updateProfile } from "firebase/auth";
import { auth, storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
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
import { AlertCircle, Loader2, Camera } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Settings() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    displayName: user?.displayName || "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const isGoogleUser = user?.providerData?.[0]?.providerId === "google.com";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingPhoto(true);
    setError("");

    try {
      const storageRef = ref(storage, `profile_photos/${user.uid}`);
      await uploadBytes(storageRef, file);
      const photoURL = await getDownloadURL(storageRef);

      await updateProfile(auth.currentUser, { photoURL });
      setSuccess("Foto de perfil actualizada correctamente");
    } catch (error) {
      console.error("Error uploading photo:", error);
      setError("Error al actualizar la foto de perfil");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (formData.displayName !== user.displayName) {
        await updateProfile(auth.currentUser, {
          displayName: formData.displayName,
        });
      }

      setSuccess("Perfil actualizado correctamente");
    } catch (error) {
      console.error("Error updating profile:", error);
      setError("Error al actualizar el perfil");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="md:ml-64">
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold">Ajustes</h1>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Perfil</CardTitle>
            <CardDescription>
              Administra tu información personal
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert className="mb-4 bg-green-500/10 text-green-500">
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <div className="flex items-center gap-4 mb-6">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  <AvatarImage
                    src={user?.photoURL || "/placeholder-user.jpg"}
                    alt={user?.displayName || "User"}
                  />
                  <AvatarFallback className="text-2xl">
                    {user?.displayName?.[0] || user?.email?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-2 -right-2">
                  <Input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="photo-upload"
                    onChange={handlePhotoUpload}
                    disabled={uploadingPhoto}
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    className="rounded-full h-8 w-8"
                    onClick={() =>
                      document.getElementById("photo-upload").click()
                    }
                    disabled={uploadingPhoto}
                  >
                    {uploadingPhoto ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div>
                <h3 className="font-medium">
                  {user?.displayName || "Usuario"}
                </h3>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                {isGoogleUser && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Cuenta de Google
                  </p>
                )}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Nombre</Label>
                <Input
                  id="displayName"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleChange}
                  placeholder="Tu nombre"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={user?.email}
                  disabled
                  className="bg-muted"
                />
                {isGoogleUser && (
                  <p className="text-xs text-muted-foreground">
                    El email no se puede cambiar en cuentas de Google
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="bg-purple-600 hover:bg-purple-700"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar Cambios"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
