"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Plus,
  ImageIcon,
  Heart,
  Eye,
  Camera,
  Upload,
  Calendar,
  ArrowRight,
  Loader2,
  Lock,
  Share2,
  Globe,
} from "lucide-react";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import getImageUrl from "@/hooks/useImageUrl";

export default function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalGalleries: 0,
    totalImages: 0,
    totalLikes: 0,
    totalViews: 0,
    recentGalleries: [],
    popularGalleries: [],
    storageUsed: 0,
    storageLimit: 5000, // 5GB in MB
    protectedGalleries: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      try {
        // Fetch galleries
        const galleriesQuery = query(
          collection(db, "galleries"),
          where("userId", "==", user.uid)
        );
        const galleriesSnapshot = await getDocs(galleriesQuery);
        const galleries = [];
        let totalImages = 0;
        let totalLikes = 0;
        let totalViews = 0;
        let storageUsed = 0;
        let protectedGalleries = 0;

        galleriesSnapshot.forEach((doc) => {
          const gallery = { id: doc.id, ...doc.data() };
          galleries.push(gallery);

          // Count images
          totalImages += gallery.images?.length || gallery.imageCount || 0;

          // Count likes across all images
          if (gallery.images) {
            gallery.images.forEach((img) => {
              totalLikes += img.likes || 0;
              storageUsed += img.size ? img.size / (1024 * 1024) : 0; // Convert to MB
            });
          }

          // Count views
          totalViews += gallery.views || 0;

          // Count password protected galleries
          if (gallery.password) {
            protectedGalleries++;
          }
        });

        // Sort galleries by creation date (newest first)
        const recentGalleries = [...galleries]
          .sort((a, b) => {
            const dateA = a.createdAt?.toDate?.() || a.createdAt || 0;
            const dateB = b.createdAt?.toDate?.() || b.createdAt || 0;
            return new Date(dateB) - new Date(dateA);
          })
          .slice(0, 4);

        // Sort galleries by views (most viewed first)
        const popularGalleries = [...galleries]
          .sort((a, b) => (b.views || 0) - (a.views || 0))
          .slice(0, 3);

        setStats({
          totalGalleries: galleries.length,
          totalImages,
          totalLikes,
          totalViews,
          recentGalleries,
          popularGalleries,
          storageUsed: Math.round(storageUsed * 10) / 10, // Round to 1 decimal
          storageLimit: 5000,
          protectedGalleries,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

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
            <h1 className="text-3xl font-bold">Panel de Control</h1>
            <p className="text-muted-foreground mt-1">
              Bienvenido a tu espacio de fotografía
            </p>
          </div>
          <Button
            onClick={() => router.push("/dashboard/galleries/new")}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="mr-2 h-4 w-4" /> Nueva Galería
          </Button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-purple-600 mb-4" />
            <p className="text-muted-foreground">Cargando estadísticas...</p>
          </div>
        ) : (
          <>
            {/* Main Stats */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-purple-600/10 rounded-bl-full"></div>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Galerías
                  </CardTitle>
                  <div className="rounded-full bg-purple-100 p-2 dark:bg-purple-900/30">
                    <ImageIcon className="h-4 w-4 text-purple-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {stats.totalGalleries}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.totalGalleries === 0
                      ? "Crea tu primera galería"
                      : `${stats.protectedGalleries} con contraseña`}
                  </p>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-purple-600/10 rounded-bl-full"></div>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Imágenes
                  </CardTitle>
                  <div className="rounded-full bg-purple-100 p-2 dark:bg-purple-900/30">
                    <ImageIcon className="h-4 w-4 text-purple-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.totalImages}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.totalImages === 0
                      ? "Sube tu primera imagen"
                      : `En todas tus galerías`}
                  </p>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-purple-600/10 rounded-bl-full"></div>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Me gusta
                  </CardTitle>
                  <div className="rounded-full bg-purple-100 p-2 dark:bg-purple-900/30">
                    <Heart className="h-4 w-4 text-purple-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.totalLikes}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.totalLikes === 0
                      ? "Aún no tienes likes"
                      : `De tus clientes`}
                  </p>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-purple-600/10 rounded-bl-full"></div>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Vistas</CardTitle>
                  <div className="rounded-full bg-purple-100 p-2 dark:bg-purple-900/30">
                    <Eye className="h-4 w-4 text-purple-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.totalViews}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.totalViews === 0
                      ? "Comparte tus galerías"
                      : `Visitas a tus galerías`}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Storage Usage */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Uso de Almacenamiento</CardTitle>
                <CardDescription>
                  Has utilizado {stats.storageUsed} MB de {stats.storageLimit}{" "}
                  MB
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Progress
                  value={(stats.storageUsed / stats.storageLimit) * 100}
                  className="h-2"
                />
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>
                    {Math.round((stats.storageUsed / stats.storageLimit) * 100)}
                    % utilizado
                  </span>
                  <span>
                    {stats.storageLimit - stats.storageUsed} MB disponibles
                  </span>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Recent Galleries */}
              <Card className="lg:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Galerías Recientes</CardTitle>
                    <CardDescription>
                      Tus últimas galerías creadas
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/dashboard/galleries")}
                  >
                    Ver todas
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  {stats.recentGalleries.length > 0 ? (
                    <div className="space-y-4">
                      {stats.recentGalleries.map((gallery) => (
                        <div
                          key={gallery.id}
                          className="flex items-center gap-4"
                        >
                          <div className="h-12 w-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
                            {gallery.images && gallery.images[0] ? (
                              <img
                                src={
                                  getImageUrl(gallery.images[0]) ||
                                  "/placeholder.svg"
                                }
                                alt={gallery.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center bg-purple-100 dark:bg-purple-900/30">
                                <ImageIcon className="h-6 w-6 text-purple-600" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <Link
                              href={`/dashboard/galleries/${gallery.id}`}
                              className="font-medium hover:text-purple-600 transition-colors truncate block"
                            >
                              {gallery.name}
                            </Link>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                              <div className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {formatDate(gallery.createdAt)}
                              </div>
                              <div className="flex items-center">
                                <ImageIcon className="h-3 w-3 mr-1" />
                                {gallery.images?.length ||
                                  gallery.imageCount ||
                                  0}{" "}
                                imágenes
                              </div>
                              {gallery.password && (
                                <Badge
                                  variant="outline"
                                  className="text-xs py-0 h-5"
                                >
                                  <Lock className="h-3 w-3 mr-1" /> Protegida
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              router.push(`/dashboard/galleries/${gallery.id}`)
                            }
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <ImageIcon className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                      <p className="text-muted-foreground">
                        No has creado ninguna galería aún
                      </p>
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => router.push("/dashboard/galleries/new")}
                      >
                        <Plus className="mr-2 h-4 w-4" /> Crear Galería
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Popular Galleries */}
              <Card>
                <CardHeader>
                  <CardTitle>Galerías Populares</CardTitle>
                  <CardDescription>
                    Las más vistas por tus clientes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {stats.popularGalleries.length > 0 ? (
                    <div className="space-y-4">
                      {stats.popularGalleries.map((gallery, index) => (
                        <div
                          key={gallery.id}
                          className="flex items-center gap-3"
                        >
                          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 font-medium">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <Link
                              href={`/dashboard/galleries/${gallery.id}`}
                              className="font-medium hover:text-purple-600 transition-colors truncate block"
                            >
                              {gallery.name}
                            </Link>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                              <div className="flex items-center">
                                <Eye className="h-3 w-3 mr-1" />
                                {gallery.views || 0} vistas
                              </div>
                              <div className="flex items-center">
                                <Heart className="h-3 w-3 mr-1" />
                                {gallery.likes || 0} likes
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <Eye className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                      <p className="text-muted-foreground">
                        Aún no hay datos de popularidad
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Access */}
            <Card>
              <CardHeader>
                <CardTitle>Accesos Rápidos</CardTitle>
                <CardDescription>
                  Comienza a compartir tus creaciones
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div className="flex flex-col items-center gap-3 rounded-lg border p-4 text-center hover:border-purple-200 hover:bg-purple-50/50 transition-colors">
                  <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900/30">
                    <Camera className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="font-medium">Crear Galería</h3>
                  <p className="text-xs text-muted-foreground">
                    Crea una nueva galería para tus clientes
                  </p>
                  <Button
                    variant="link"
                    className="mt-auto text-purple-600"
                    onClick={() => router.push("/dashboard/galleries/new")}
                  >
                    Crear Galería
                  </Button>
                </div>

                <div className="flex flex-col items-center gap-3 rounded-lg border p-4 text-center hover:border-purple-200 hover:bg-purple-50/50 transition-colors">
                  <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900/30">
                    <Upload className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="font-medium">Subir Imágenes</h3>
                  <p className="text-xs text-muted-foreground">
                    Sube nuevas imágenes a tus galerías
                  </p>
                  <Button
                    variant="link"
                    className="mt-auto text-purple-600"
                    onClick={() => router.push("/dashboard/galleries")}
                  >
                    Gestionar Galerías
                  </Button>
                </div>

                <div className="flex flex-col items-center gap-3 rounded-lg border p-4 text-center hover:border-purple-200 hover:bg-purple-50/50 transition-colors">
                  <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900/30">
                    <Share2 className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="font-medium">Compartir</h3>
                  <p className="text-xs text-muted-foreground">
                    Comparte tus galerías con clientes
                  </p>
                  <Button
                    variant="link"
                    className="mt-auto text-purple-600"
                    onClick={() => router.push("/dashboard/galleries")}
                  >
                    Compartir Galerías
                  </Button>
                </div>

                <div className="flex flex-col items-center gap-3 rounded-lg border p-4 text-center hover:border-purple-200 hover:bg-purple-50/50 transition-colors">
                  <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900/30">
                    <Globe className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="font-medium">Portafolio</h3>
                  <p className="text-xs text-muted-foreground">
                    Gestiona tu portafolio público
                  </p>
                  <Button
                    variant="link"
                    className="mt-auto text-purple-600"
                    onClick={() => router.push("/dashboard/portfolio")}
                  >
                    Ver Portafolio
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
