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
import { Plus, ImageIcon, Users, Clock, Settings } from "lucide-react";
import Link from "next/link";

export default function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalGalleries: 0,
    totalImages: 0,
    recentActivity: [],
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

        galleriesSnapshot.forEach((doc) => {
          const gallery = { id: doc.id, ...doc.data() };
          galleries.push(gallery);
          totalImages += gallery.imageCount || 0;
        });

        setStats({
          totalGalleries: galleries.length,
          totalImages,
          recentActivity: galleries
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, 3),
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  return (
    <div className="md:ml-64">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Panel de Control</h1>
          <Button
            onClick={() => router.push("/dashboard/galleries/new")}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="mr-2 h-4 w-4" /> Nueva Galeria
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Cantidad de Galerias
              </CardTitle>
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "..." : stats.totalGalleries}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.totalGalleries === 0
                  ? "Crea tu primera galeria"
                  : "Entre todos tus proyectos"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Cantidad de Imagenes
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "..." : stats.totalImages}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.totalImages === 0
                  ? "Sube tu primera imagen"
                  : "Compartidas con tus clientes"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Actividad Reciente
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-muted-foreground">Cargando...</div>
              ) : stats.recentActivity.length > 0 ? (
                <div className="space-y-2">
                  {stats.recentActivity.map((gallery) => (
                    <div key={gallery.id} className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                      <Link
                        href={`/dashboard/galleries/${gallery.id}`}
                        className="text-sm hover:underline"
                      >
                        {gallery.name}
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  No hay actividad reciente
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Accesos Rapidos</CardTitle>
            <CardDescription>
              Comienza a compartir tus creaciones
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col items-center gap-2 rounded-lg border p-4 text-center">
              <div className="rounded-full bg-purple-100 p-2 dark:bg-purple-900">
                <ImageIcon className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-medium">Crear Galeria</h3>
              <p className="text-sm text-muted-foreground">
                Crea una nueva galeria
              </p>
              <Button
                variant="link"
                className="mt-auto text-purple-600"
                onClick={() => router.push("/dashboard/galleries/new")}
              >
                Crear Galeria
              </Button>
            </div>

            <div className="flex flex-col items-center gap-2 rounded-lg border p-4 text-center">
              <div className="rounded-full bg-purple-100 p-2 dark:bg-purple-900">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-medium">Invitar Clientes</h3>
              <p className="text-sm text-muted-foreground">
                Administra y comparte galerias con tus clientes
              </p>
              <Button
                variant="link"
                className="mt-auto text-purple-600"
                onClick={() => router.push("/dashboard/galleries")}
              >
                Administar Galerias
              </Button>
            </div>

            <div className="flex flex-col items-center gap-2 rounded-lg border p-4 text-center">
              <div className="rounded-full bg-purple-100 p-2 dark:bg-purple-900">
                <Settings className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-medium">Ajustes</h3>
              <p className="text-sm text-muted-foreground">
                Personaliza ajustes de tu cuenta
              </p>
              <Button
                variant="link"
                className="mt-auto text-purple-600"
                onClick={() => router.push("/dashboard/settings")}
              >
                Ir a Ajustes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
