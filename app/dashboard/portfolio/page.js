"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
  addDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
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
import {
  AlertCircle,
  Loader2,
  ImageIcon,
  Copy,
  Check,
  UserIcon,
  Mail,
  Phone,
  Instagram,
  Globe,
  MapPin,
  Camera,
  Eye,
  EyeOff,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import getImageUrl from "@/hooks/useImageUrl";

export default function Portfolio() {
  const { user } = useAuth();
  const router = useRouter();
  const [portfolio, setPortfolio] = useState({
    title: "",
    description: "",
    photographer: "",
    email: "",
    phone: "",
    instagram: "",
    website: "",
    location: "",
    isPublic: false,
    galleries: [],
    pfp: "",
    coverImage: "",
  });
  const [galleries, setGalleries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copied, setCopied] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({
    pfp: 0,
    coverImage: 0,
  });

  useEffect(() => {
    const fetchPortfolioAndGalleries = async () => {
      if (!user) return;

      setLoading(true);
      setError("");

      try {
        // Fetch user's galleries first (this should always work)
        const galleriesQuery = query(
          collection(db, "galleries"),
          where("userId", "==", user.uid)
        );
        const galleriesSnapshot = await getDocs(galleriesQuery);
        const galleriesData = [];

        galleriesSnapshot.forEach((doc) => {
          galleriesData.push({ id: doc.id, ...doc.data() });
        });

        setGalleries(galleriesData);

        // Then try to fetch the portfolio
        try {
          const portfolioQuery = query(
            collection(db, "portfolios"),
            where("userId", "==", user.uid)
          );
          const portfolioSnapshot = await getDocs(portfolioQuery);

          if (!portfolioSnapshot.empty) {
            const portfolioData = portfolioSnapshot.docs[0].data();
            setPortfolio({
              id: portfolioSnapshot.docs[0].id,
              ...portfolioData,
            });
          }
          // If portfolio doesn't exist, we'll use the default state
          // which is already set in the useState initialization
        } catch (portfolioError) {
          console.log(
            "No portfolio found, user can create one",
            portfolioError
          );
          // Don't set an error - this is an expected state for new users
        }
      } catch (error) {
        console.error("Error fetching galleries:", error);
        setError("Error al cargar las galerías");
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolioAndGalleries();
  }, [user]);

  const uploadImageToStorage = async (file, path) => {
    if (!file) return null;

    try {
      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, file);
      return await getDownloadURL(snapshot.ref);
    } catch (error) {
      console.error("Error uploading image:", error);
      return null;
    }
  };

  const handlePfpUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploadProgress((prev) => ({ ...prev, pfp: 0 }));
      const path = `portfolios/${user.uid}/pfp_${Date.now()}_${file.name}`;
      const downloadURL = await uploadImageToStorage(file, path);

      if (downloadURL) {
        setPortfolio((prev) => ({ ...prev, pfp: downloadURL }));
      }
    } catch (error) {
      console.error("PFP upload error:", error);
    }
  };

  const handleCoverImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploadProgress((prev) => ({ ...prev, coverImage: 0 }));
      const path = `portfolios/${user.uid}/cover_${Date.now()}_${file.name}`;
      const downloadURL = await uploadImageToStorage(file, path);

      if (downloadURL) {
        setPortfolio((prev) => ({ ...prev, coverImage: downloadURL }));
      }
    } catch (error) {
      console.error("Cover image upload error:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const portfolioData = {
        userId: user.uid,
        title: portfolio.title,
        description: portfolio.description,
        photographer: portfolio.photographer,
        email: portfolio.email,
        phone: portfolio.phone,
        instagram: portfolio.instagram,
        website: portfolio.website,
        location: portfolio.location,
        isPublic: portfolio.isPublic,
        galleries: portfolio.galleries,
        pfp: portfolio.pfp,
        coverImage: portfolio.coverImage,
        updatedAt: serverTimestamp(),
      };

      if (portfolio.id) {
        // Update existing portfolio
        await updateDoc(doc(db, "portfolios", portfolio.id), portfolioData);
      } else {
        // Create new portfolio
        const portfolioRef = collection(db, "portfolios");
        await addDoc(portfolioRef, {
          ...portfolioData,
          createdAt: serverTimestamp(),
        });
      }

      setSuccess("Portafolio actualizado correctamente");

      // Scroll to top to show success message
      window.scrollTo(0, 0);

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (error) {
      console.error("Error saving portfolio:", error);
      setError("Error al guardar el portafolio");
    } finally {
      setSaving(false);
    }
  };

  const toggleGallerySelection = (galleryId) => {
    setPortfolio((prev) => {
      const selectedGalleries = prev.galleries || [];
      if (selectedGalleries.includes(galleryId)) {
        return {
          ...prev,
          galleries: selectedGalleries.filter((id) => id !== galleryId),
        };
      } else {
        return {
          ...prev,
          galleries: [...selectedGalleries, galleryId],
        };
      }
    });
  };

  const handleCopyLink = () => {
    if (!portfolio.id) {
      setError("Guarda el portafolio primero para obtener un enlace");
      return;
    }

    const portfolioUrl = `${window.location.origin}/p/${portfolio.id}`;
    navigator.clipboard
      .writeText(portfolioUrl)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => {
        console.error("Error al copiar el enlace:", err);
        setError("No se pudo copiar el enlace");
      });
  };

  if (loading) {
    return (
      <div className="md:ml-64 flex justify-center items-center h-[calc(100vh-64px)]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="md:ml-64 p-6">
      <div className="flex flex-col gap-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Portafolio</h1>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-sm">
              <span>Estado:</span>
              {portfolio.isPublic ? (
                <span className="flex items-center text-green-500">
                  <Eye className="h-4 w-4 mr-1" />
                  Público
                </span>
              ) : (
                <span className="flex items-center text-gray-500">
                  <EyeOff className="h-4 w-4 mr-1" />
                  Privado
                </span>
              )}
            </div>

            {portfolio.id && portfolio.isPublic && (
              <Button
                type="button"
                variant="outline"
                onClick={handleCopyLink}
                className="text-purple-600 border-purple-600"
                size="sm"
              >
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copiar Link
                  </>
                )}
              </Button>
            )}
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

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="basic">Información Básica</TabsTrigger>
            <TabsTrigger value="contact">Contacto</TabsTrigger>
            <TabsTrigger value="galleries">Galerías</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit}>
            <TabsContent value="basic" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Información Básica</CardTitle>
                  <CardDescription>
                    Configura la información principal de tu portafolio
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Título del Portafolio</Label>
                    <Input
                      id="title"
                      value={portfolio.title}
                      onChange={(e) =>
                        setPortfolio({ ...portfolio, title: e.target.value })
                      }
                      placeholder="Mi Portafolio Fotográfico"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Descripción</Label>
                    <Textarea
                      id="description"
                      value={portfolio.description}
                      onChange={(e) =>
                        setPortfolio({
                          ...portfolio,
                          description: e.target.value,
                        })
                      }
                      placeholder="Describe tu trabajo y estilo fotográfico"
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="photographer">Nombre del Fotógrafo</Label>
                    <Input
                      id="photographer"
                      value={portfolio.photographer || ""}
                      onChange={(e) =>
                        setPortfolio({
                          ...portfolio,
                          photographer: e.target.value,
                        })
                      }
                      placeholder="Tu nombre artístico"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Ubicación</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                      <Input
                        id="location"
                        value={portfolio.location || ""}
                        onChange={(e) =>
                          setPortfolio({
                            ...portfolio,
                            location: e.target.value,
                          })
                        }
                        placeholder="Ciudad, País"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="pfp">Foto de Perfil</Label>
                      <div className="flex items-center space-x-4">
                        <div className="w-24 h-24 rounded-full overflow-hidden bg-muted flex items-center justify-center border">
                          {portfolio.pfp ? (
                            <img
                              src={portfolio.pfp || "/placeholder.svg"}
                              alt="Profile Picture"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <UserIcon className="h-12 w-12 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <Input
                            id="pfp"
                            type="file"
                            accept="image/*"
                            onChange={handlePfpUpload}
                            className="hidden"
                          />
                          <Label
                            htmlFor="pfp"
                            className="cursor-pointer bg-secondary text-secondary-foreground hover:bg-secondary/80 py-2 px-4 rounded-md inline-block"
                          >
                            Cambiar Foto
                          </Label>
                          {uploadProgress.pfp > 0 && (
                            <div className="text-sm text-muted-foreground mt-2">
                              Subiendo: {uploadProgress.pfp}%
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="coverImage">Imagen de Portada</Label>
                      <div className="aspect-[16/9] bg-muted rounded-lg overflow-hidden flex items-center justify-center relative border">
                        {portfolio.coverImage ? (
                          <img
                            src={portfolio.coverImage || "/placeholder.svg"}
                            alt="Cover Image"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="h-12 w-12 text-muted-foreground" />
                        )}
                        <Input
                          id="coverImage"
                          type="file"
                          accept="image/*"
                          onChange={handleCoverImageUpload}
                          className="hidden"
                        />
                        <Label
                          htmlFor="coverImage"
                          className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                        >
                          Cambiar Imagen
                        </Label>
                      </div>
                      {uploadProgress.coverImage > 0 && (
                        <div className="text-sm text-muted-foreground">
                          Subiendo: {uploadProgress.coverImage}%
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div className="space-y-0.5">
                      <Label htmlFor="public" className="text-base">
                        Visibilidad del Portafolio
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {portfolio.isPublic
                          ? "Tu portafolio es visible para el público"
                          : "Tu portafolio es privado"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Privado
                      </span>
                      <Switch
                        id="public"
                        checked={portfolio.isPublic}
                        onCheckedChange={(checked) =>
                          setPortfolio({ ...portfolio, isPublic: checked })
                        }
                      />
                      <span className="text-sm text-muted-foreground">
                        Público
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={() =>
                    document.querySelector('[data-value="contact"]').click()
                  }
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Siguiente: Información de Contacto
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="contact" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Información de Contacto</CardTitle>
                  <CardDescription>
                    Configura cómo los clientes pueden contactarte
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email de Contacto</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                      <Input
                        id="email"
                        type="email"
                        value={portfolio.email || ""}
                        onChange={(e) =>
                          setPortfolio({ ...portfolio, email: e.target.value })
                        }
                        placeholder="tu@email.com"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                      <Input
                        id="phone"
                        type="tel"
                        value={portfolio.phone || ""}
                        onChange={(e) =>
                          setPortfolio({ ...portfolio, phone: e.target.value })
                        }
                        placeholder="+54 9 11 1234-5678"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="instagram">Instagram</Label>
                    <div className="relative">
                      <Instagram className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                      <Input
                        id="instagram"
                        value={portfolio.instagram || ""}
                        onChange={(e) =>
                          setPortfolio({
                            ...portfolio,
                            instagram: e.target.value,
                          })
                        }
                        placeholder="@tuusuario"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">Sitio Web</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                      <Input
                        id="website"
                        value={portfolio.website || ""}
                        onChange={(e) =>
                          setPortfolio({
                            ...portfolio,
                            website: e.target.value,
                          })
                        }
                        placeholder="https://tusitio.com"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    document.querySelector('[data-value="basic"]').click()
                  }
                >
                  Anterior: Información Básica
                </Button>
                <Button
                  type="button"
                  onClick={() =>
                    document.querySelector('[data-value="galleries"]').click()
                  }
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Siguiente: Seleccionar Galerías
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="galleries" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Galerías del Portafolio</CardTitle>
                  <CardDescription>
                    Selecciona las galerías que quieres mostrar en tu portafolio
                    público
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-4">
                      <Label className="text-base font-medium">
                        Galerías Seleccionadas
                      </Label>
                      <span className="text-sm text-muted-foreground">
                        {portfolio.galleries?.length || 0} de {galleries.length}{" "}
                        galerías seleccionadas
                      </span>
                    </div>

                    {galleries.length > 0 ? (
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {galleries.map((gallery) => (
                          <Card
                            key={gallery.id}
                            className={`cursor-pointer transition-all hover:shadow-md ${
                              portfolio.galleries?.includes(gallery.id)
                                ? "ring-2 ring-purple-600 bg-purple-50/5"
                                : ""
                            }`}
                            onClick={() => toggleGallerySelection(gallery.id)}
                          >
                            <CardContent className="p-4">
                              <div className="aspect-video bg-muted rounded-lg mb-4 overflow-hidden">
                                {gallery.images && gallery.images[0] ? (
                                  <img
                                    src={
                                      getImageUrl(gallery.images[0]) ||
                                      "/placeholder.svg"
                                    }
                                    alt={gallery.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center justify-between">
                                <div>
                                  <h3 className="font-medium">
                                    {gallery.name}
                                  </h3>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {gallery.imageCount ||
                                      gallery.images?.length ||
                                      0}{" "}
                                    imágenes
                                  </p>
                                </div>
                                {portfolio.galleries?.includes(gallery.id) && (
                                  <div className="h-6 w-6 rounded-full bg-purple-600 flex items-center justify-center">
                                    <Check className="h-4 w-4 text-white" />
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 border-2 border-dashed rounded-lg">
                        <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">
                          No tienes galerías creadas
                        </h3>
                        <p className="text-muted-foreground mb-4">
                          Crea galerías para poder incluirlas en tu portafolio
                        </p>
                        <Button
                          type="button"
                          onClick={() =>
                            router.push("/dashboard/galleries/new")
                          }
                          variant="outline"
                        >
                          <Camera className="mr-2 h-4 w-4" />
                          Crear Nueva Galería
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    document.querySelector('[data-value="contact"]').click()
                  }
                >
                  Anterior: Información de Contacto
                </Button>
                <Button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    "Guardar Portafolio"
                  )}
                </Button>
              </div>
            </TabsContent>
          </form>
        </Tabs>
      </div>
    </div>
  );
}
