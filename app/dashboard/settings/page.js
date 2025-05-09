"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  updateProfile,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { auth, storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  AlertCircle,
  Loader2,
  Camera,
  User,
  Mail,
  Globe,
  Trash2,
  Check,
  Info,
  Shield,
  Eye,
  EyeOff,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export default function Settings() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    displayName: user?.displayName || "",
    bio: user?.bio || "",
    location: user?.location || "",
    website: user?.website || "",
  });
  const [emailData, setEmailData] = useState({
    newEmail: "",
    currentPassword: "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    newGalleryComments: true,
    newLikes: true,
    marketingEmails: false,
  });
  const [privacySettings, setPrivacySettings] = useState({
    showEmail: false,
    publicProfile: true,
    allowIndexing: true,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const isGoogleUser = user?.providerData?.[0]?.providerId === "google.com";
  const accountCreationDate = user?.metadata?.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Desconocido";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEmailChange = (e) => {
    const { name, value } = e.target;
    setEmailData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNotificationChange = (name, checked) => {
    setNotificationSettings((prev) => ({ ...prev, [name]: checked }));
  };

  const handlePrivacyChange = (name, checked) => {
    setPrivacySettings((prev) => ({ ...prev, [name]: checked }));
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

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Error uploading photo:", error);
      setError("Error al actualizar la foto de perfil");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      // Update display name if changed
      if (formData.displayName !== user.displayName) {
        await updateProfile(auth.currentUser, {
          displayName: formData.displayName,
        });
      }

      // Here you would typically update other profile fields in your database
      // For example, using Firestore to store the bio, location, and website

      setSuccess("Perfil actualizado correctamente");

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
      setError("Error al actualizar el perfil");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (isGoogleUser) {
        setError("No puedes cambiar el email en cuentas de Google");
        return;
      }

      if (!emailData.newEmail || !emailData.currentPassword) {
        setError("Por favor completa todos los campos");
        return;
      }

      // Re-authenticate user
      const credential = EmailAuthProvider.credential(
        user.email,
        emailData.currentPassword
      );
      await reauthenticateWithCredential(user, credential);

      // Update email
      await updateEmail(auth.currentUser, emailData.newEmail);

      setSuccess("Email actualizado correctamente");
      setEmailData({ newEmail: "", currentPassword: "" });

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Error updating email:", error);
      if (error.code === "auth/wrong-password") {
        setError("Contraseña incorrecta");
      } else if (error.code === "auth/email-already-in-use") {
        setError("Este email ya está en uso");
      } else {
        setError("Error al actualizar el email");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (isGoogleUser) {
        setError("No puedes cambiar la contraseña en cuentas de Google");
        return;
      }

      if (
        !passwordData.currentPassword ||
        !passwordData.newPassword ||
        !passwordData.confirmPassword
      ) {
        setError("Por favor completa todos los campos");
        return;
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setError("Las contraseñas no coinciden");
        return;
      }

      if (passwordData.newPassword.length < 6) {
        setError("La contraseña debe tener al menos 6 caracteres");
        return;
      }

      // Re-authenticate user
      const credential = EmailAuthProvider.credential(
        user.email,
        passwordData.currentPassword
      );
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(auth.currentUser, passwordData.newPassword);

      setSuccess("Contraseña actualizada correctamente");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Error updating password:", error);
      if (error.code === "auth/wrong-password") {
        setError("Contraseña actual incorrecta");
      } else {
        setError("Error al actualizar la contraseña");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationsSubmit = (e) => {
    e.preventDefault();
    setSuccess("Preferencias de notificaciones actualizadas");

    // Clear success message after 3 seconds
    setTimeout(() => setSuccess(""), 3000);
  };

  const handlePrivacySubmit = (e) => {
    e.preventDefault();
    setSuccess("Configuración de privacidad actualizada");

    // Clear success message after 3 seconds
    setTimeout(() => setSuccess(""), 3000);
  };

  const handleDeleteAccount = () => {
    // This would typically delete the user account
    // For now, we'll just close the dialog
    setShowDeleteDialog(false);
    setDeleteConfirmation("");
  };

  return (
    <div className="md:ml-64 p-6">
      <div className="flex flex-col gap-6 max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Ajustes</h1>
            <p className="text-muted-foreground mt-1">
              Administra tu cuenta y preferencias
            </p>
          </div>
          <Badge
            variant="outline"
            className="bg-purple-50 text-purple-700 border-purple-200"
          >
            {isGoogleUser ? "Cuenta de Google" : "Cuenta con Email"}
          </Badge>
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

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid grid-cols-4 mb-6">
            <TabsTrigger value="profile">Perfil</TabsTrigger>
            <TabsTrigger value="account">Cuenta</TabsTrigger>
            <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
            <TabsTrigger value="privacy">Privacidad</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Información de Perfil</CardTitle>
                <CardDescription>
                  Actualiza tu información personal y foto de perfil
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-6 mb-6">
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-24 w-24 border-4 border-background">
                        <AvatarImage
                          src={user?.photoURL || "/placeholder.svg"}
                          alt={user?.displayName || "Usuario"}
                        />
                        <AvatarFallback className="text-3xl bg-purple-100 text-purple-700">
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
                          className="rounded-full h-8 w-8 bg-white shadow-sm"
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
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">
                        JPG, GIF o PNG. Máximo 1MB.
                      </p>
                    </div>
                  </div>

                  <div className="flex-1">
                    <form onSubmit={handleProfileSubmit} className="space-y-4">
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
                        <Label htmlFor="bio">Biografía</Label>
                        <Textarea
                          id="bio"
                          name="bio"
                          value={formData.bio}
                          onChange={handleChange}
                          placeholder="Cuéntanos sobre ti"
                          rows={3}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="location">Ubicación</Label>
                          <Input
                            id="location"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            placeholder="Ciudad, País"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="website">Sitio Web</Label>
                          <Input
                            id="website"
                            name="website"
                            value={formData.website}
                            onChange={handleChange}
                            placeholder="https://tusitio.com"
                          />
                        </div>
                      </div>

                      <div className="pt-2">
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
                      </div>
                    </form>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Información de la Cuenta</CardTitle>
                  <CardDescription>
                    Gestiona tu email y contraseña
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div>
                      <h3 className="font-medium">Email</h3>
                      <p className="text-sm text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                    <Badge variant={isGoogleUser ? "secondary" : "outline"}>
                      {isGoogleUser ? "Google" : "Email"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div>
                      <h3 className="font-medium">Fecha de Creación</h3>
                      <p className="text-sm text-muted-foreground">
                        {accountCreationDate}
                      </p>
                    </div>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </div>

                  {!isGoogleUser && (
                    <>
                      <Separator />

                      <div>
                        <h3 className="font-medium mb-4">Cambiar Email</h3>
                        <form
                          onSubmit={handleEmailSubmit}
                          className="space-y-4"
                        >
                          <div className="space-y-2">
                            <Label htmlFor="newEmail">Nuevo Email</Label>
                            <Input
                              id="newEmail"
                              name="newEmail"
                              type="email"
                              value={emailData.newEmail}
                              onChange={handleEmailChange}
                              placeholder="nuevo@email.com"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="currentPassword">
                              Contraseña Actual
                            </Label>
                            <div className="relative">
                              <Input
                                id="currentPassword"
                                name="currentPassword"
                                type={showPassword ? "text" : "password"}
                                value={emailData.currentPassword}
                                onChange={handleEmailChange}
                                placeholder="Ingresa tu contraseña actual"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>

                          <Button
                            type="submit"
                            variant="outline"
                            className="text-purple-600 border-purple-600"
                            disabled={loading}
                          >
                            {loading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Actualizando...
                              </>
                            ) : (
                              "Cambiar Email"
                            )}
                          </Button>
                        </form>
                      </div>

                      <Separator />

                      <div>
                        <h3 className="font-medium mb-4">Cambiar Contraseña</h3>
                        <form
                          onSubmit={handlePasswordSubmit}
                          className="space-y-4"
                        >
                          <div className="space-y-2">
                            <Label htmlFor="currentPasswordForPw">
                              Contraseña Actual
                            </Label>
                            <div className="relative">
                              <Input
                                id="currentPasswordForPw"
                                name="currentPassword"
                                type={showPassword ? "text" : "password"}
                                value={passwordData.currentPassword}
                                onChange={handlePasswordChange}
                                placeholder="Ingresa tu contraseña actual"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="newPassword">
                              Nueva Contraseña
                            </Label>
                            <Input
                              id="newPassword"
                              name="newPassword"
                              type={showPassword ? "text" : "password"}
                              value={passwordData.newPassword}
                              onChange={handlePasswordChange}
                              placeholder="Ingresa tu nueva contraseña"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="confirmPassword">
                              Confirmar Contraseña
                            </Label>
                            <Input
                              id="confirmPassword"
                              name="confirmPassword"
                              type={showPassword ? "text" : "password"}
                              value={passwordData.confirmPassword}
                              onChange={handlePasswordChange}
                              placeholder="Confirma tu nueva contraseña"
                            />
                          </div>

                          <Button
                            type="submit"
                            variant="outline"
                            className="text-purple-600 border-purple-600"
                            disabled={loading}
                          >
                            {loading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Actualizando...
                              </>
                            ) : (
                              "Cambiar Contraseña"
                            )}
                          </Button>
                        </form>
                      </div>
                    </>
                  )}
                </CardContent>
                <CardFooter className="flex flex-col items-start">
                  <div className="space-y-2 w-full">
                    <Separator />
                    <div className="pt-4">
                      <h3 className="font-medium text-red-600 mb-2">
                        Zona de Peligro
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Una vez que elimines tu cuenta, no hay vuelta atrás. Por
                        favor, ten cuidado.
                      </p>
                      <Dialog
                        open={showDeleteDialog}
                        onOpenChange={setShowDeleteDialog}
                      >
                        <DialogTrigger asChild>
                          <Button variant="destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar Cuenta
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>¿Estás seguro?</DialogTitle>
                            <DialogDescription>
                              Esta acción no se puede deshacer. Esto eliminará
                              permanentemente tu cuenta y todas tus galerías.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-red-800 text-sm">
                              <p>
                                <strong>Advertencia:</strong> Al eliminar tu
                                cuenta, perderás:
                              </p>
                              <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li>Todas tus galerías y fotos</li>
                                <li>Acceso a tu cuenta</li>
                                <li>Historial de actividad</li>
                              </ul>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="confirmDelete">
                                Escribe "ELIMINAR" para confirmar
                              </Label>
                              <Input
                                id="confirmDelete"
                                value={deleteConfirmation}
                                onChange={(e) =>
                                  setDeleteConfirmation(e.target.value)
                                }
                                placeholder="ELIMINAR"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => setShowDeleteDialog(false)}
                            >
                              Cancelar
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={handleDeleteAccount}
                              disabled={deleteConfirmation !== "ELIMINAR"}
                            >
                              Eliminar Permanentemente
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Preferencias de Notificaciones</CardTitle>
                <CardDescription>
                  Decide qué notificaciones quieres recibir
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={handleNotificationsSubmit}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="emailNotifications">
                          Notificaciones por Email
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Recibe notificaciones por email
                        </p>
                      </div>
                      <Switch
                        id="emailNotifications"
                        checked={notificationSettings.emailNotifications}
                        onCheckedChange={(checked) =>
                          handleNotificationChange(
                            "emailNotifications",
                            checked
                          )
                        }
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="newGalleryComments">
                          Comentarios en Galerías
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Notificaciones cuando alguien comenta en tus galerías
                        </p>
                      </div>
                      <Switch
                        id="newGalleryComments"
                        checked={notificationSettings.newGalleryComments}
                        onCheckedChange={(checked) =>
                          handleNotificationChange(
                            "newGalleryComments",
                            checked
                          )
                        }
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="newLikes">Nuevos Me Gusta</Label>
                        <p className="text-sm text-muted-foreground">
                          Notificaciones cuando alguien da me gusta a tus fotos
                        </p>
                      </div>
                      <Switch
                        id="newLikes"
                        checked={notificationSettings.newLikes}
                        onCheckedChange={(checked) =>
                          handleNotificationChange("newLikes", checked)
                        }
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="marketingEmails">
                          Emails de Marketing
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Recibe emails sobre nuevas funciones y promociones
                        </p>
                      </div>
                      <Switch
                        id="marketingEmails"
                        checked={notificationSettings.marketingEmails}
                        onCheckedChange={(checked) =>
                          handleNotificationChange("marketingEmails", checked)
                        }
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    Guardar Preferencias
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy">
            <Card>
              <CardHeader>
                <CardTitle>Configuración de Privacidad</CardTitle>
                <CardDescription>
                  Controla quién puede ver tu información
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePrivacySubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label
                          htmlFor="showEmail"
                          className="flex items-center"
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          Mostrar Email
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Permitir que otros usuarios vean tu email
                        </p>
                      </div>
                      <Switch
                        id="showEmail"
                        checked={privacySettings.showEmail}
                        onCheckedChange={(checked) =>
                          handlePrivacyChange("showEmail", checked)
                        }
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label
                          htmlFor="publicProfile"
                          className="flex items-center"
                        >
                          <User className="h-4 w-4 mr-2" />
                          Perfil Público
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Hacer tu perfil visible para todos
                        </p>
                      </div>
                      <Switch
                        id="publicProfile"
                        checked={privacySettings.publicProfile}
                        onCheckedChange={(checked) =>
                          handlePrivacyChange("publicProfile", checked)
                        }
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label
                          htmlFor="allowIndexing"
                          className="flex items-center"
                        >
                          <Globe className="h-4 w-4 mr-2" />
                          Indexación en Buscadores
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Permitir que tu perfil aparezca en resultados de
                          búsqueda
                        </p>
                      </div>
                      <Switch
                        id="allowIndexing"
                        checked={privacySettings.allowIndexing}
                        onCheckedChange={(checked) =>
                          handlePrivacyChange("allowIndexing", checked)
                        }
                      />
                    </div>
                  </div>

                  <div className="bg-muted p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Shield className="h-5 w-5 text-purple-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium">Seguridad de la Cuenta</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Tu información personal está protegida y nunca será
                          compartida con terceros sin tu consentimiento.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    Guardar Configuración
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
