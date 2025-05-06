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

export default function Galleries() {
  const { user } = useAuth();
  const router = useRouter();
  const [galleries, setGalleries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteGalleryId, setDeleteGalleryId] = useState(null);

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
        console.log(galleriesData);
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

  const filteredGalleries = galleries.filter((gallery) =>
    gallery.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="md:ml-64">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-3xl font-bold">Galerias</h1>
          <div className="flex gap-2">
            <div className="relative flex-1 sm:w-64">
              <Input
                placeholder="Buscar Galerias..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Button
              onClick={() => router.push("/dashboard/galleries/new")}
              className="bg-purple-600 hover:bg-purple-700 whitespace-nowrap"
            >
              <Plus className="mr-2 h-4 w-4" /> Nueva Galeria
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        ) : filteredGalleries.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredGalleries.map((gallery) => (
              <Card key={gallery.id} className="overflow-hidden">
                <CardHeader className="p-0">
                  <div className="aspect-video bg-muted relative">
                    {gallery.coverImage ? (
                      <img
                        src={gallery.coverImage || "/placeholder.svg"}
                        alt={gallery.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-purple-900/10">
                        <ImageIcon className="h-12 w-12 text-purple-600/50" />
                      </div>
                    )}
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
                              router.push(`/dashboard/galleries/${gallery.id}`)
                            }
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Galeria
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(
                                `/dashboard/galleries/${gallery.id}/edit`
                              )
                            }
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Editar Galeria
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onClick={() => setDeleteGalleryId(gallery.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Borrar Galeria
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <CardTitle className="text-lg">{gallery.name}</CardTitle>
                  <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                    <ImageIcon className="h-4 w-4" />
                    <span>{gallery.imageCount || 0} imagenes</span>
                  </div>
                  {gallery.password && (
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <span>🔒 Protejida por contraseña</span>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="p-4 pt-0 flex justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      router.push(`/dashboard/galleries/${gallery.id}`)
                    }
                  >
                    Ver Detalles
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-purple-600"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${window.location.origin}/g/${gallery.id}`
                      );
                    }}
                  >
                    <LinkIcon className="h-4 w-4 mr-1" /> Copiar Link
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <div className="flex flex-col items-center gap-2 max-w-md mx-auto">
              <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900">
                <ImageIcon className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-medium mt-2">
                No se encontraron galerias
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm
                  ? "No se encontraron galerias que coincidan con su busqueda. Intente con un término diferente."
                  : "Crea tu primera galeria para compartir con clientes."}
              </p>
              {!searchTerm && (
                <Button
                  onClick={() => router.push("/dashboard/galleries/new")}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Plus className="mr-2 h-4 w-4" /> Crear Galeria
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
            <AlertDialogTitle>¿Estas seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion no se puede deshacer.
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
