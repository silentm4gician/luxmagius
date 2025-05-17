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
  deleteDoc,
  doc,
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Plus,
  ImageIcon,
  LinkIcon,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Loader2,
  Search,
  Lock,
  CheckCircle,
  Filter,
  SortAsc,
  SortDesc,
  Calendar,
  Grid,
  List,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import getImageUrl from "@/hooks/useImageUrl";

export default function Galleries() {
  const { user } = useAuth();
  const router = useRouter();
  const [galleries, setGalleries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteGalleryId, setDeleteGalleryId] = useState(null);
  const [viewMode, setViewMode] = useState("grid"); // grid or list
  const [sortBy, setSortBy] = useState("newest"); // newest, oldest, name
  const [filterProtected, setFilterProtected] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    const fetchGalleries = async () => {
      if (!user) return;

      try {
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
      } catch (error) {
        console.error("Error fetching galleries:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGalleries();
  }, [user]);

  const handleDeleteGallery = async () => {
    if (!deleteGalleryId) return;

    try {
      await deleteDoc(doc(db, "galleries", deleteGalleryId));
      setGalleries(
        galleries.filter((gallery) => gallery.id !== deleteGalleryId)
      );
    } catch (error) {
      console.error("Error deleting gallery:", error);
    } finally {
      setDeleteGalleryId(null);
    }
  };

  const handleCopyLink = (galleryId) => {
    const galleryUrl = `${window.location.origin}/g/${galleryId}`;
    navigator.clipboard.writeText(galleryUrl);
    setCopiedId(galleryId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter and sort galleries
  let filteredGalleries = galleries.filter((gallery) =>
    gallery.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (filterProtected) {
    filteredGalleries = filteredGalleries.filter((gallery) => gallery.password);
  }

  // Sort galleries
  filteredGalleries = [...filteredGalleries].sort((a, b) => {
    if (sortBy === "newest") {
      return (
        new Date(b.createdAt?.toDate?.() || b.createdAt || 0) -
        new Date(a.createdAt?.toDate?.() || a.createdAt || 0)
      );
    } else if (sortBy === "oldest") {
      return (
        new Date(a.createdAt?.toDate?.() || a.createdAt || 0) -
        new Date(b.createdAt?.toDate?.() || b.createdAt || 0)
      );
    } else if (sortBy === "name") {
      return a.name.localeCompare(b.name);
    }
    return 0;
  });

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return "Sin fecha";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat("es-ES", { dateStyle: "medium" }).format(
      date
    );
  };

  return (
    <div className="md:ml-64 p-6">
      <div className="flex flex-col gap-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Galerías</h1>
            <p className="text-muted-foreground mt-1">
              Administra tus galerías de fotos para compartir con clientes
            </p>
          </div>
          <Button
            onClick={() => router.push("/dashboard/galleries/new")}
            className="bg-purple-600 hover:bg-purple-700 whitespace-nowrap"
          >
            <Plus className="mr-2 h-4 w-4" /> Nueva Galería
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar galerías..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className={
                      filterProtected
                        ? "bg-purple-100 text-purple-700 border-purple-200"
                        : ""
                    }
                    onClick={() => setFilterProtected(!filterProtected)}
                  >
                    <Lock className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {filterProtected
                    ? "Mostrar todas las galerías"
                    : "Mostrar solo galerías protegidas"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <DropdownMenu>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon">
                        {sortBy === "newest" ? (
                          <SortDesc className="h-4 w-4" />
                        ) : sortBy === "oldest" ? (
                          <SortAsc className="h-4 w-4" />
                        ) : (
                          <Filter className="h-4 w-4" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Ordenar galerías</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSortBy("newest")}>
                  <SortDesc className="mr-2 h-4 w-4" />
                  Más recientes primero
                  {sortBy === "newest" && (
                    <CheckCircle className="ml-2 h-4 w-4 text-green-500" />
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("oldest")}>
                  <SortAsc className="mr-2 h-4 w-4" />
                  Más antiguas primero
                  {sortBy === "oldest" && (
                    <CheckCircle className="ml-2 h-4 w-4 text-green-500" />
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("name")}>
                  <Filter className="mr-2 h-4 w-4" />
                  Ordenar por nombre
                  {sortBy === "name" && (
                    <CheckCircle className="ml-2 h-4 w-4 text-green-500" />
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className={
                      viewMode === "grid"
                        ? "bg-purple-100 text-purple-700 border-purple-200"
                        : ""
                    }
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
                    variant="outline"
                    size="icon"
                    className={
                      viewMode === "list"
                        ? "bg-purple-100 text-purple-700 border-purple-200"
                        : ""
                    }
                    onClick={() => setViewMode("list")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Vista de lista</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-purple-600 mb-4" />
            <p className="text-muted-foreground">Cargando galerías...</p>
          </div>
        ) : filteredGalleries.length > 0 ? (
          <>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div>
                {filteredGalleries.length}{" "}
                {filteredGalleries.length === 1 ? "galería" : "galerías"}{" "}
                encontradas
              </div>
              {filterProtected && (
                <Badge variant="outline">
                  Mostrando solo galerías protegidas
                </Badge>
              )}
            </div>

            {viewMode === "grid" ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredGalleries.map((gallery) => (
                  <Card
                    key={gallery.id}
                    className="overflow-hidden flex flex-col hover:shadow-md transition-shadow duration-200"
                  >
                    <CardHeader className="p-0 flex-shrink-0">
                      <div className="h-[180px] bg-muted relative cursor-pointer">
                        {gallery.images && gallery.images.length > 0 ? (
                          <img
                            src={
                              getImageUrl(gallery.images[0]) ||
                              "/placeholder.svg"
                            }
                            alt={gallery.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-purple-900/10">
                            <ImageIcon className="h-12 w-12 text-purple-600/50" />
                          </div>
                        )}
                        <div
                          className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity"
                          onClick={() =>
                            router.push(`/dashboard/galleries/${gallery.id}`)
                          }
                        />
                        <div className="absolute top-2 right-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 bg-black/20 hover:bg-black/40 text-white rounded-full"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  router.push(
                                    `/dashboard/galleries/${gallery.id}`
                                  )
                                }
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                Ver Galería
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  router.push(
                                    `/dashboard/galleries/${gallery.id}/edit`
                                  )
                                }
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Editar Galería
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onClick={() => setDeleteGalleryId(gallery.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Borrar Galería
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        {gallery.password && (
                          <div className="absolute top-2 left-2">
                            <Badge
                              variant="secondary"
                              className="bg-black/50 text-white border-none"
                            >
                              <Lock className="h-3 w-3 mr-1" /> Protegida
                            </Badge>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">
                            {gallery.name}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                            <ImageIcon className="h-4 w-4" />
                            <span>
                              {gallery.images?.length ||
                                gallery.imageCount ||
                                0}{" "}
                              imágenes
                            </span>
                          </div>
                        </div>
                        {gallery.createdAt && (
                          <div className="text-xs text-muted-foreground flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(gallery.createdAt)}
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="p-4 pt-0 flex justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          router.push(`/dashboard/galleries/${gallery.id}`)
                        }
                      >
                        <Eye className="h-4 w-4 mr-1" /> Ver Detalles
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-purple-600"
                        onClick={() => handleCopyLink(gallery.id)}
                      >
                        {copiedId === gallery.id ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-1" /> Copiado
                          </>
                        ) : (
                          <>
                            <LinkIcon className="h-4 w-4 mr-1" /> Copiar Link
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredGalleries.map((gallery) => (
                  <Card
                    key={gallery.id}
                    className="overflow-hidden hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex flex-col sm:flex-row">
                      <div
                        className="sm:w-48 h-32 sm:h-auto bg-muted relative cursor-pointer"
                        onClick={() =>
                          router.push(`/dashboard/galleries/${gallery.id}`)
                        }
                      >
                        {gallery.images && gallery.images.length > 0 ? (
                          <img
                            src={
                              getImageUrl(gallery.images[0]) ||
                              "/placeholder.svg"
                            }
                            alt={gallery.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-purple-900/10">
                            <ImageIcon className="h-12 w-12 text-purple-600/50" />
                          </div>
                        )}
                        {gallery.password && (
                          <div className="absolute top-2 left-2">
                            <Badge
                              variant="secondary"
                              className="bg-black/50 text-white border-none"
                            >
                              <Lock className="h-3 w-3 mr-1" /> Protegida
                            </Badge>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-lg">
                              {gallery.name}
                            </h3>
                            <div className="flex items-center gap-4 mt-1">
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <ImageIcon className="h-4 w-4" />
                                <span>
                                  {gallery.images?.length ||
                                    gallery.imageCount ||
                                    0}{" "}
                                  imágenes
                                </span>
                              </div>
                              {gallery.createdAt && (
                                <div className="text-sm text-muted-foreground flex items-center">
                                  <Calendar className="h-4 w-4 mr-1" />
                                  {formatDate(gallery.createdAt)}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-purple-600"
                              onClick={() => handleCopyLink(gallery.id)}
                            >
                              {copiedId === gallery.id ? (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-1" />{" "}
                                  Copiado
                                </>
                              ) : (
                                <>
                                  <LinkIcon className="h-4 w-4 mr-1" /> Copiar
                                  Link
                                </>
                              )}
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() =>
                                    router.push(
                                      `/dashboard/galleries/${gallery.id}`
                                    )
                                  }
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  Ver Galería
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    router.push(
                                      `/dashboard/galleries/${gallery.id}/edit`
                                    )
                                  }
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Editar Galería
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-red-600 focus:text-red-600"
                                  onClick={() => setDeleteGalleryId(gallery.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Borrar Galería
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        <Separator className="my-3" />
                        <div className="flex justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              router.push(`/dashboard/galleries/${gallery.id}`)
                            }
                          >
                            <Eye className="h-4 w-4 mr-1" /> Ver Detalles
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        ) : (
          <Card className="p-8 text-center">
            <div className="flex flex-col items-center gap-2 max-w-md mx-auto">
              <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900">
                <ImageIcon className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-medium mt-2">
                No se encontraron galerías
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || filterProtected
                  ? "No se encontraron galerías que coincidan con su búsqueda. Intente con otros criterios."
                  : "Crea tu primera galería para compartir con clientes."}
              </p>
              {!searchTerm && !filterProtected && (
                <Button
                  onClick={() => router.push("/dashboard/galleries/new")}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Plus className="mr-2 h-4 w-4" /> Crear Galería
                </Button>
              )}
              {(searchTerm || filterProtected) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setFilterProtected(false);
                  }}
                >
                  Limpiar filtros
                </Button>
              )}
            </div>
          </Card>
        )}
      </div>

      <AlertDialog
        open={!!deleteGalleryId}
        onOpenChange={(open) => !open && setDeleteGalleryId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente la galería y no se puede
              deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGallery}
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
