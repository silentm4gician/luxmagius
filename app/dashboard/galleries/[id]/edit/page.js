"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  AlertCircle,
  ArrowLeft,
  Loader2,
  CheckCircle,
  XCircle,
  Camera,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Info,
  Save,
  X,
  Globe,
  ShieldCheck,
  TextQuoteIcon,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { GoogleDrivePicker } from "@/components/google-drive-picker";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import getImageUrl from "@/hooks/useImageUrl";

export default function EditGallery() {
  const router = useRouter();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("");
  const [originalData, setOriginalData] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isPasswordProtected: false,
    coverImage: "",
    password: "",
    isPublic: false,
  });

  // Helper to show alert and clear after a delay
  const showAlert = (message, type = "info", duration = 4000) => {
    setAlertMessage(message);
    setAlertType(type);
    const timer = setTimeout(() => {
      setAlertMessage("");
      setAlertType("");
    }, duration);
    return timer;
  };

  // Fetch gallery data
  const fetchGallery = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    try {
      const galleryRef = doc(db, "galleries", id);
      const gallerySnap = await getDoc(galleryRef);

      if (gallerySnap.exists()) {
        const galleryData = gallerySnap.data();
        const formattedData = {
          name: galleryData.name || "",
          description: galleryData.description || "",
          isPasswordProtected: galleryData.isPasswordProtected || false,
          coverImage: galleryData.coverImage || "",
          password: "", // Don't pre-fill password for security
          isPublic: galleryData.isPublic || false,
        };

        setFormData(formattedData);
        setOriginalData(formattedData);
      } else {
        showAlert("Galería no encontrada.", "error");
        setTimeout(() => router.push("/dashboard/galleries"), 1500);
      }
    } catch (error) {
      console.error("Error fetching gallery:", error);
      showAlert("Error al cargar los datos de la galería.", "error");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchGallery();
  }, [fetchGallery]);

  // Check for unsaved changes
  useEffect(() => {
    if (originalData) {
      const hasUnsavedChanges =
        JSON.stringify(originalData) !== JSON.stringify(formData);
      setHasChanges(hasUnsavedChanges);
    }
  }, [formData, originalData]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasChanges]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordSwitchChange = (checked) => {
    setFormData((prev) => ({
      ...prev,
      isPasswordProtected: checked,
      password: checked ? prev.password : "",
    }));
  };

  const handlePublicSwitchChange = (checked) => {
    setFormData((prev) => ({ ...prev, isPublic: checked }));
  };

  const handleCoverImageSelect = (selectedFiles) => {
    if (!Array.isArray(selectedFiles) || selectedFiles.length === 0) {
      showAlert("No se seleccionó ningún archivo.", "info");
      return;
    }

    const file = selectedFiles[0];
    const fileId = file?.id;

    if (fileId) {
      setFormData((prev) => ({ ...prev, coverImage: fileId }));
      showAlert("Imagen de portada seleccionada correctamente.", "success");
    } else {
      showAlert(
        "No se pudo obtener el ID de la imagen seleccionada. Por favor, inténtalo de nuevo.",
        "error"
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      showAlert("El nombre de la galería es obligatorio.", "error");
      return;
    }

    if (formData.isPasswordProtected && !formData.password.trim()) {
      showAlert(
        "La contraseña es obligatoria cuando la protección está activada.",
        "error"
      );
      return;
    }

    setSaving(true);
    try {
      const galleryRef = doc(db, "galleries", id);

      // Prepare data for update
      const updateData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        isPasswordProtected: formData.isPasswordProtected,
        coverImage: formData.coverImage,
        password: formData.isPasswordProtected ? formData.password.trim() : "",
        isPublic: formData.isPublic,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(galleryRef, updateData);

      // Update original data to reflect saved state
      setOriginalData({ ...formData });
      setHasChanges(false);

      showAlert("Galería actualizada correctamente.", "success");
      setTimeout(() => router.push(`/dashboard/galleries/${id}`), 1500);
    } catch (error) {
      console.error("Error updating gallery:", error);
      showAlert(
        "Error al guardar los cambios. Por favor, inténtalo de nuevo.",
        "error"
      );
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      setShowDiscardDialog(true);
    } else {
      router.push(`/dashboard/galleries/${id}`);
    }
  };

  const discardChanges = () => {
    router.push(`/dashboard/galleries/${id}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-purple-600 mb-4" />
        <p className="text-lg text-muted-foreground">
          Cargando datos de la galería...
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto px-4 py-8 max-w-5xl md:ml-64">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold">Editar Galería</h1>
        </div>

        {hasChanges && (
          <Badge
            variant="outline"
            className="bg-yellow-50 text-yellow-700 border-yellow-200"
          >
            <Info className="h-3 w-3 mr-1" />
            Cambios sin guardar
          </Badge>
        )}
      </div>

      {/* Alert Messages */}
      {alertMessage && (
        <Alert
          variant={alertType === "error" ? "destructive" : "default"}
          className={`mb-6 ${
            alertType === "success"
              ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
              : alertType === "info"
              ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
              : ""
          }`}
        >
          {alertType === "success" && <CheckCircle className="h-4 w-4" />}
          {alertType === "error" && <XCircle className="h-4 w-4" />}
          {alertType === "info" && <AlertCircle className="h-4 w-4" />}
          <AlertTitle className="font-semibold">
            {alertType === "success"
              ? "Éxito"
              : alertType === "error"
              ? "Error"
              : "Información"}
          </AlertTitle>
          <AlertDescription>{alertMessage}</AlertDescription>
        </Alert>
      )}

      <div className="bg-card rounded-xl shadow-md border overflow-hidden">
        <div className="relative bg-gradient-to-r from-purple-700 to-purple-500 h-32 flex items-end">
          {formData.coverImage ? (
            <div className="absolute inset-0 opacity-40">
              <img
                src={getImageUrl({
                  driveId: formData.coverImage || "/placeholder.svg",
                })}
                alt="Portada de galería"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            </div>
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
          <div className="relative p-6 text-white">
            <h2 className="text-2xl font-bold">
              {formData.name || "Nueva Galería"}
            </h2>
            <div className="flex items-center gap-2 mt-1 text-white/80 text-sm">
              <TextQuoteIcon className="h-4 w-4" />
              <span>{formData.description || "No disponible"}</span>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="p-6">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Información Básica
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              Configuración de Acceso
            </TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit}>
            <TabsContent value="basic" className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gallery Name */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="name" className="text-base font-medium">
                    Nombre de la Galería <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="p. ej., Boda Smith & Jones"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    maxLength={100}
                    className="h-11"
                  />
                  <p className="text-xs text-muted-foreground">
                    Nombre visible para tus clientes. Máximo 100 caracteres.
                  </p>
                </div>
                {/* Gallery Description */}
                <div className="space-y-2 md:col-span-2">
                  <Label
                    htmlFor="description"
                    className="text-base font-medium"
                  >
                    Descripción
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Agrega detalles sobre esta galería..."
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    maxLength={500}
                    className="min-h-[120px] resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    Descripción visible para tus clientes. Máximo 500
                    caracteres.
                  </p>
                </div>

                {/* Cover Image Picker */}
                <div className="space-y-3 md:col-span-2">
                  <Label htmlFor="coverImage" className="text-base font-medium">
                    Imagen de Portada
                  </Label>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 justify-center items-center">
                    <div className="flex-1 min-w-0">
                      <GoogleDrivePicker
                        onSelect={handleCoverImageSelect}
                        buttonLabel="Seleccionar Imagen de Portada"
                        allowMultiple={false}
                        className="w-full h-11"
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        Selecciona una imagen de Google Drive para usarla como
                        portada de la galería.
                      </p>
                    </div>

                    {formData.coverImage && (
                      <div className="w-full h-48 rounded-lg overflow-hidden border bg-muted flex-shrink-0">
                        <img
                          src={getImageUrl({
                            driveId: formData.coverImage || "/placeholder.svg",
                          })}
                          alt="Vista previa de portada"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.classList.add("hidden");
                            e.target.nextSibling.classList.remove("hidden");
                          }}
                        />
                        <div className="w-full h-full flex items-center justify-center">
                          <p className="text-sm text-muted-foreground">
                            No se pudo cargar la vista previa
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              {/* Access Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">
                    Configuración de Acceso
                  </CardTitle>
                  <CardDescription>
                    Controla quién puede ver esta galería y cómo se accede a
                    ella.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Public Gallery */}
                  <div className="flex items-center justify-between rounded-lg border p-4 bg-card">
                    <div className="space-y-0.5">
                      <Label
                        htmlFor="isPublic"
                        className="text-base font-medium flex items-center gap-2"
                      >
                        <Globe className="h-5 w-5 text-purple-600" />
                        Galería Pública
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Cuando está activada, la galería aparecerá en la página
                        principal y será visible para todos.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {formData.isPublic ? "Pública" : "Privada"}
                      </span>
                      <Switch
                        id="isPublic"
                        checked={formData.isPublic}
                        onCheckedChange={handlePublicSwitchChange}
                      />
                    </div>
                  </div>

                  {/* Password Protection */}
                  <div className="flex items-center justify-between rounded-lg border p-4 bg-card">
                    <div className="space-y-0.5">
                      <Label
                        htmlFor="isPasswordProtected"
                        className="text-base font-medium flex items-center gap-2"
                      >
                        <Lock className="h-5 w-5 text-purple-600" />
                        Protección con Contraseña
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Cuando está activada, los visitantes necesitarán una
                        contraseña para ver las fotos.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {formData.isPasswordProtected
                          ? "Protegida"
                          : "Sin protección"}
                      </span>
                      <Switch
                        id="isPasswordProtected"
                        checked={formData.isPasswordProtected}
                        onCheckedChange={handlePasswordSwitchChange}
                      />
                    </div>
                  </div>

                  {/* Password Input (Conditional) */}
                  {formData.isPasswordProtected && (
                    <div className="space-y-2 p-4 rounded-lg border border-purple-200 bg-purple-50/50 dark:bg-purple-900/10">
                      <Label
                        htmlFor="password"
                        className="text-base font-medium"
                      >
                        Contraseña de la Galería{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          name="password"
                          type="password"
                          placeholder="Introduce una contraseña segura"
                          value={formData.password}
                          onChange={handleChange}
                          required={formData.isPasswordProtected}
                          className="pr-10 h-11"
                        />
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                <Info className="h-4 w-4" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                Usa una contraseña que puedas compartir
                                fácilmente con tus clientes.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <p className="text-sm text-purple-700 dark:text-purple-400 flex items-center gap-1.5">
                        <ShieldCheck className="h-4 w-4" />
                        Los visitantes necesitarán esta contraseña para acceder
                        a la galería.
                      </p>
                    </div>
                  )}

                  {/* Access Summary */}
                  <div className="mt-6 p-4 rounded-lg bg-muted/50">
                    <h3 className="font-medium mb-2 flex items-center gap-2">
                      <Info className="h-4 w-4 text-purple-600" />
                      Resumen de Acceso
                    </h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        {formData.isPublic ? (
                          <Globe className="h-4 w-4 text-green-600" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-amber-600" />
                        )}
                        <span>
                          Esta galería{" "}
                          {formData.isPublic ? "es pública" : "no es pública"} y{" "}
                          {formData.isPublic ? "aparecerá" : "no aparecerá"} en
                          la página principal.
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        {formData.isPasswordProtected ? (
                          <Lock className="h-4 w-4 text-amber-600" />
                        ) : (
                          <Unlock className="h-4 w-4 text-green-600" />
                        )}
                        <span>
                          El acceso a las fotos{" "}
                          {formData.isPasswordProtected
                            ? "está protegido con contraseña"
                            : "no requiere contraseña"}
                          .
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-purple-600" />
                        <span>
                          Cualquier persona con el enlace{" "}
                          {formData.isPasswordProtected
                            ? "y la contraseña "
                            : ""}
                          podrá ver esta galería.
                        </span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Action Buttons - Fixed at bottom */}
            <div className="sticky bottom-0 left-0 right-0 bg-background border-t p-4 mt-6 flex justify-between items-center">
              <div>
                {hasChanges && (
                  <span className="text-sm text-amber-600 flex items-center">
                    <Info className="h-4 w-4 mr-1" />
                    Tienes cambios sin guardar
                  </span>
                )}
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700 gap-2"
                  disabled={saving || !hasChanges}
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Guardar Cambios
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Tabs>
      </div>

      {/* Discard Changes Dialog */}
      {showDiscardDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-2">¿Descartar cambios?</h3>
            <p className="text-muted-foreground mb-4">
              Tienes cambios sin guardar. ¿Estás seguro de que quieres salir sin
              guardar?
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDiscardDialog(false)}
              >
                Cancelar
              </Button>
              <Button variant="destructive" onClick={discardChanges}>
                Descartar Cambios
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
