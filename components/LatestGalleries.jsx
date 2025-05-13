"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  where,
} from "firebase/firestore";
import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/firebase";
import getImageUrl from "@/hooks/useImageUrl";
import {
  ApertureIcon,
  ImageIcon,
  CalendarIcon,
  HeartIcon,
  EyeIcon,
  ChevronRightIcon,
  FilterIcon,
  Clock,
  User,
  Camera,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

const LatestGalleries = ({ limit: galleryLimit = 9, showFilters = true }) => {
  const [galleries, setGalleries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("recent"); // recent, popular, featured
  const [viewAll, setViewAll] = useState(false);

  useEffect(() => {
    const fetchGalleries = async () => {
      setLoading(true);
      setError(null);
      try {
        const galleriesRef = collection(db, "galleries");

        // Create query based on filter
        let q;
        if (filter === "popular") {
          // Order by views for popular galleries
          q = query(
            galleriesRef,
            where("isPublic", "==", true),
            orderBy("views", "desc"),
            limit(galleryLimit)
          );
        } else if (filter === "featured") {
          // Featured galleries (could be a specific field or tag)
          q = query(
            galleriesRef,
            where("isPublic", "==", true),
            where("featured", "==", true),
            orderBy("updatedAt", "desc"),
            limit(galleryLimit)
          );
        } else {
          // Default: recent galleries
          q = query(
            galleriesRef,
            where("isPublic", "==", true),
            orderBy("updatedAt", "desc"),
            limit(galleryLimit)
          );
        }

        const querySnapshot = await getDocs(q);
        const fetchedGalleries = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setGalleries(fetchedGalleries);
      } catch (err) {
        console.error("Error fetching latest galleries:", err);
        setError("No se pudieron cargar las galerías.");
      } finally {
        setLoading(false);
      }
    };

    fetchGalleries();
  }, [filter, galleryLimit]);

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return "Sin fecha";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return new Intl.DateTimeFormat("es-ES", {
        day: "numeric",
        month: "short",
      }).format(date);
    } catch (e) {
      return "Fecha inválida";
    }
  };

  // Get image count for a gallery
  const getImageCount = (gallery) => {
    if (gallery.imageCount) return gallery.imageCount;
    if (gallery.images) return gallery.images.length;
    return 0;
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-4">
        {showFilters && (
          <div className="flex justify-between items-center mb-4">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-8 w-32" />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: galleryLimit }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-video w-full" />
              <CardContent className="p-4">
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex justify-between mt-3">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center border rounded-lg">
        <div className="text-destructive mb-2">
          <ApertureIcon className="w-10 h-10 mx-auto mb-2 opacity-70" />
          <p>{error}</p>
        </div>
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
          className="mt-2"
        >
          Reintentar
        </Button>
      </div>
    );
  }

  if (galleries.length === 0) {
    return (
      <div className="p-8 text-center border rounded-lg">
        <ImageIcon className="w-10 h-10 mx-auto mb-2 text-muted-foreground opacity-70" />
        <p className="text-muted-foreground">
          No se encontraron galerías públicas.
        </p>
      </div>
    );
  }

  // Determine how many galleries to show
  const displayGalleries = viewAll
    ? galleries
    : galleries.slice(0, galleryLimit);

  return (
    <div className="space-y-2">
      {showFilters && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-2">
          <div>
            <h2 className="text-xl font-bold">
              {filter === "popular"
                ? "Galerías Populares"
                : filter === "featured"
                ? "Galerías Destacadas"
                : "Galerías Recientes"}
            </h2>
            <p className="text-sm text-muted-foreground">
              Explora nuestras colecciones de fotografía
            </p>
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  <FilterIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Filtrar</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => setFilter("recent")}
                  className="gap-2"
                >
                  <Clock className="h-4 w-4" />
                  Más recientes
                  {filter === "recent" && <span className="ml-auto">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setFilter("popular")}
                  className="gap-2"
                >
                  <EyeIcon className="h-4 w-4" />
                  Más populares
                  {filter === "popular" && <span className="ml-auto">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setFilter("featured")}
                  className="gap-2"
                >
                  <HeartIcon className="h-4 w-4" />
                  Destacadas
                  {filter === "featured" && <span className="ml-auto">✓</span>}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Link href="/galleries" passHref>
              <Button variant="ghost" size="sm" className="gap-1">
                <span>Ver todas</span>
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 p-2">
        {displayGalleries.map((gallery) => (
          <Link key={gallery.id} href={`/g/${gallery.id}`} passHref>
            <Card className="overflow-hidden h-full hover:shadow-md transition-shadow duration-300 cursor-pointer group">
              <div className="aspect-video relative overflow-hidden bg-muted">
                {gallery.images && gallery.images[0] ? (
                  <>
                    <Image
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      src={getImageUrl(gallery.images[0]) || "/placeholder.svg"}
                      alt={gallery.name || "Gallery Image"}
                      className="object-cover group-hover:scale-105 transition-transform duration-500 ease-in-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </>
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-900/20 to-black/30 flex flex-col items-center justify-center p-4">
                    <Camera className="w-10 h-10 text-purple-500 mb-2" />
                    <span className="text-sm text-center font-medium">
                      {gallery.name || "Galería sin título"}
                    </span>
                  </div>
                )}

                {/* Badges */}
                <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                  {gallery.featured && (
                    <Badge
                      variant="secondary"
                      className="bg-purple-600 text-white border-none"
                    >
                      Destacada
                    </Badge>
                  )}
                  {gallery.password && (
                    <Badge
                      variant="outline"
                      className="bg-black/50 text-white border-none"
                    >
                      Protegida
                    </Badge>
                  )}
                </div>
              </div>

              <CardContent className="p-4">
                <h3 className="font-medium text-lg group-hover:text-purple-600 transition-colors line-clamp-1">
                  {gallery.name || "Galería sin título"}
                </h3>

                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                  {gallery.photographer && (
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span className="truncate max-w-[100px]">
                        {gallery.photographer}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-1">
                    <ImageIcon className="h-3 w-3" />
                    <span>{getImageCount(gallery)} imágenes</span>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-3">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <CalendarIcon className="h-3 w-3" />
                    <span>
                      {formatDate(gallery.updatedAt || gallery.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {gallery.views > 0 && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <EyeIcon className="h-3 w-3" />
                        <span>{gallery.views}</span>
                      </div>
                    )}

                    {gallery.likes > 0 && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <HeartIcon className="h-3 w-3" />
                        <span>{gallery.likes}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}

        {/* Fill remaining grid cells if fewer than limit */}
        {displayGalleries.length < galleryLimit &&
          !viewAll &&
          Array.from({
            length: Math.max(0, galleryLimit - displayGalleries.length),
          }).map((_, i) => (
            <Card
              key={`placeholder-${i}`}
              className="overflow-hidden h-full opacity-50"
            >
              <div className="aspect-video bg-muted flex items-center justify-center">
                <ApertureIcon className="w-8 h-8 text-muted-foreground/40" />
              </div>
              <CardContent className="p-4">
                <div className="h-5 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
      </div>

      {galleries.length > galleryLimit && !viewAll && (
        <div className="flex justify-center mt-6">
          <Button
            onClick={() => setViewAll(true)}
            variant="outline"
            className="gap-2"
          >
            <span>Ver más galerías</span>
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default LatestGalleries;
