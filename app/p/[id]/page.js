"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Loader2,
  ImageIcon,
  ArrowLeft,
  Camera,
  User,
  Calendar,
  Instagram,
  Mail,
  Globe,
  MapPin,
  ChevronRight,
  Clock,
  Phone,
  MessageCircleMore,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import getImageUrl from "@/hooks/useImageUrl";
import { cn } from "@/lib/utils";

export default function PublicPortfolio({ params }) {
  const { id } = React.use(params);
  const router = useRouter();
  const [portfolio, setPortfolio] = useState(null);
  const [galleries, setGalleries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const fetchPortfolioAndGalleries = async () => {
      if (!id) return;

      try {
        const portfolioDoc = await getDoc(doc(db, "portfolios", id));

        if (!portfolioDoc.exists() || !portfolioDoc.data().isPublic) {
          setError("Portfolio not found or not public");
          return;
        }

        const portfolioData = { id: portfolioDoc.id, ...portfolioDoc.data() };
        setPortfolio(portfolioData);

        // Fetch galleries included in the portfolio
        if (portfolioData.galleries && portfolioData.galleries.length > 0) {
          const galleriesData = await Promise.all(
            portfolioData.galleries.map((galleryId) =>
              getDoc(doc(db, "galleries", galleryId))
            )
          );

          const validGalleries = galleriesData
            .filter((doc) => doc.exists())
            .map((doc) => ({ id: doc.id, ...doc.data() }));

          setGalleries(validGalleries);
        }
      } catch (error) {
        console.error("Error fetching portfolio:", error);
        setError("Failed to load portfolio");
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolioAndGalleries();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-black via-black/50 to-purple-900/20">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-purple-300 animate-pulse">
            Cargando portafolio...
          </p>
        </div>
      </div>
    );
  }

  if (error || !portfolio) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-black to-gray-900 p-4">
        <Card className="w-full max-w-md bg-black border border-purple-800">
          <CardHeader>
            <CardTitle className="text-white">
              Portafolio No Encontrado
            </CardTitle>
            <CardDescription className="text-gray-400">
              El portafolio que estás buscando no existe o no está disponible.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => router.push("/")}
              className="w-full bg-purple-700 hover:bg-purple-600 text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Format date if available
  const formatDate = (timestamp) => {
    if (!timestamp) return null;

    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return new Intl.DateTimeFormat("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(date);
    } catch (e) {
      return null;
    }
  };

  const createdDate = formatDate(portfolio.createdAt);
  const updatedDate = formatDate(portfolio.updatedAt);

  // Calculate total images across all galleries
  const totalImages = galleries.reduce((total, gallery) => {
    return total + (gallery.images?.length || gallery.imageCount || 0);
  }, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-black/50 to-purple-900/20">
      {/* Hero Section with Cover Image */}
      <div className="relative w-full h-[50vh] md:h-[60vh] overflow-hidden">
        {portfolio.coverImage ? (
          <>
            <div className="absolute inset-0 bg-black/60 z-10"></div>
            <img
              src={portfolio.coverImage || "/placeholder.svg"}
              alt={portfolio.title}
              className="w-full h-full object-cover object-center"
            />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-purple-900"></div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10"></div>

        {/* Portfolio Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 z-20">
          <div className="container mx-auto">
            <div className="max-w-4xl">
              <div className="flex items-center mb-3">
                <div className="bg-purple-600 p-2 rounded-full mr-3">
                  <Camera className="h-5 w-5 text-white" />
                </div>
                <Badge className="bg-black/50 text-white border-purple-500 backdrop-blur-sm">
                  Portafolio
                </Badge>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                {portfolio.title}
              </h1>

              {portfolio.description && (
                <p className="text-gray-200 max-w-2xl text-sm md:text-base mb-4">
                  {portfolio.description}
                </p>
              )}

              <div className="flex flex-wrap gap-3 mt-4">
                {portfolio.photographer && (
                  <div className="flex items-center text-sm text-gray-300">
                    <User className="h-4 w-4 mr-1 text-purple-400" />
                    <span>{portfolio.photographer}</span>
                  </div>
                )}

                {createdDate && (
                  <div className="flex items-center text-sm text-gray-300">
                    <Calendar className="h-4 w-4 mr-1 text-purple-400" />
                    <span>{createdDate}</span>
                  </div>
                )}

                <div className="flex items-center text-sm text-gray-300">
                  <ImageIcon className="h-4 w-4 mr-1 text-purple-400" />
                  <span>
                    {totalImages} {totalImages === 1 ? "imagen" : "imágenes"} en{" "}
                    {galleries.length}{" "}
                    {galleries.length === 1 ? "galería" : "galerías"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Header */}
      <header
        className={cn(
          "sticky top-0 z-10 backdrop-blur-md transition-all duration-300",
          isScrolled ? "bg-black/90 shadow-md py-3" : "bg-black/70 py-3"
        )}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {/* <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/")}
                className="mr-2 text-white hover:bg-purple-900/20"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button> */}

              {isScrolled && (
                <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-purple-300">
                  {portfolio.title}
                </h2>
              )}
            </div>

            {portfolio.website && (
              <Button
                variant="outline"
                size="sm"
                className="border-purple-700 text-purple-400 hover:border-purple-600 hover:bg-black/50"
                onClick={() => window.open(portfolio.website, "_blank")}
              >
                <Globe className="h-4 w-4 mr-2" />
                Sitio Web
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Photographer Info Card */}
          <Card className="mb-10 bg-black border border-purple-800 overflow-hidden">
            <div className="md:flex">
              <div className="md:w-1/3 bg-gradient-to-br from-purple-900 to-black p-6 flex items-center justify-center">
                <div className="text-center">
                  {portfolio.pfp ? (
                    <div className="w-24 h-24 mx-auto mb-4 rounded-full border-2 border-purple-500 overflow-hidden">
                      <img
                        src={portfolio.pfp || "/placeholder.svg"}
                        alt={portfolio.photographer || "Fotógrafo"}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-24 bg-black/40 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-purple-500">
                      <User className="h-12 w-12 text-purple-300" />
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-white">
                    {portfolio.photographer || "Fotógrafo"}
                  </h3>
                  {portfolio.title && (
                    <p className="text-purple-300 mt-1">{portfolio.title}</p>
                  )}

                  {portfolio.location && (
                    <div className="flex items-center justify-center mt-3 text-sm text-gray-300">
                      <MapPin className="h-4 w-4 mr-1 text-purple-400" />
                      <span>{portfolio.location}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="md:w-2/3 p-6">
                <h3 className="text-xl font-bold text-white mb-4">
                  Información de Contacto
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {portfolio.email && (
                    <div className="flex items-center">
                      <Mail className="h-5 w-5 text-purple-500 mr-3" />
                      <div>
                        <p className="text-gray-400 text-sm">Email</p>
                        <a
                          href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
                            portfolio.email.trim()
                          )}`}
                          className="text-gray-400 hover:text-purple-400 transition-colors"
                          aria-label="Email"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {portfolio.email}
                        </a>
                      </div>
                    </div>
                  )}

                  {portfolio.instagram && (
                    <div className="flex items-center">
                      <Instagram className="h-5 w-5 text-purple-500 mr-3" />
                      <div>
                        <p className="text-gray-400 text-sm">Instagram</p>
                        <a
                          href={`https://instagram.com/${portfolio.instagram.replace(
                            "@",
                            ""
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white hover:text-purple-300 transition-colors"
                        >
                          {portfolio.instagram}
                        </a>
                      </div>
                    </div>
                  )}

                  {portfolio.website && (
                    <div className="flex items-center">
                      <Globe className="h-5 w-5 text-purple-500 mr-3" />
                      <div>
                        <p className="text-gray-400 text-sm">Sitio Web</p>
                        <a
                          href={portfolio.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white hover:text-purple-300 transition-colors"
                        >
                          {portfolio.website
                            .replace(/(^\w+:|^)\/\//, "")
                            .replace(/\/$/, "")}
                        </a>
                      </div>
                    </div>
                  )}

                  {updatedDate && (
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 text-purple-500 mr-3" />
                      <div>
                        <p className="text-gray-400 text-sm">
                          Última actualización
                        </p>
                        <p className="text-white">{updatedDate}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-2 border-t border-purple-900/30">
                  <div className="flex space-x-2">
                    {portfolio.phone && (
                      <Button
                        variant="outline"
                        className="bg-gray-900/60 hover:bg-green-700/60 text-white"
                        onClick={() => {
                          // Remove all non-digit characters
                          const sanitizedPhone = portfolio.phone.replace(
                            /\D/g,
                            ""
                          );

                          // Attempt to handle different phone number formats
                          const formattedPhone = sanitizedPhone.startsWith("0")
                            ? sanitizedPhone.substring(1)
                            : sanitizedPhone.startsWith("54")
                            ? sanitizedPhone
                            : `54${sanitizedPhone}`;

                          // WhatsApp Web URL with pre-filled message
                          const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(
                            "Hola, vi tu portafolio y me gustaría contactarte."
                          )}`;

                          window.open(
                            whatsappUrl,
                            "_blank",
                            "noopener,noreferrer"
                          );
                        }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          x="0px"
                          y="0px"
                          width="100"
                          height="100"
                          viewBox="0,0,256,256"
                        >
                          <g
                            fill="#7c3aed"
                            fillRule="nonzero"
                            stroke="none"
                            strokeWidth="1"
                            strokeLinecap="butt"
                            strokeLinejoin="miter"
                            strokeMiterlimit="10"
                            strokeDasharray=""
                            strokeDashoffset="0"
                            fontFamily="none"
                            fontWeight="none"
                            fontSize="none"
                            textAnchor="none"
                            style={{ mixBlendMode: "normal" }}
                          >
                            <g transform="scale(5.12,5.12)">
                              <path d="M25,2c-12.682,0 -23,10.318 -23,23c0,3.96 1.023,7.854 2.963,11.29l-2.926,10.44c-0.096,0.343 -0.003,0.711 0.245,0.966c0.191,0.197 0.451,0.304 0.718,0.304c0.08,0 0.161,-0.01 0.24,-0.029l10.896,-2.699c3.327,1.786 7.074,2.728 10.864,2.728c12.682,0 23,-10.318 23,-23c0,-12.682 -10.318,-23 -23,-23zM36.57,33.116c-0.492,1.362 -2.852,2.605 -3.986,2.772c-1.018,0.149 -2.306,0.213 -3.72,-0.231c-0.857,-0.27 -1.957,-0.628 -3.366,-1.229c-5.923,-2.526 -9.791,-8.415 -10.087,-8.804c-0.295,-0.389 -2.411,-3.161 -2.411,-6.03c0,-2.869 1.525,-4.28 2.067,-4.864c0.542,-0.584 1.181,-0.73 1.575,-0.73c0.394,0 0.787,0.005 1.132,0.021c0.363,0.018 0.85,-0.137 1.329,1.001c0.492,1.168 1.673,4.037 1.819,4.33c0.148,0.292 0.246,0.633 0.05,1.022c-0.196,0.389 -0.294,0.632 -0.59,0.973c-0.296,0.341 -0.62,0.76 -0.886,1.022c-0.296,0.291 -0.603,0.606 -0.259,1.19c0.344,0.584 1.529,2.493 3.285,4.039c2.255,1.986 4.158,2.602 4.748,2.894c0.59,0.292 0.935,0.243 1.279,-0.146c0.344,-0.39 1.476,-1.703 1.869,-2.286c0.393,-0.583 0.787,-0.487 1.329,-0.292c0.542,0.194 3.445,1.604 4.035,1.896c0.59,0.292 0.984,0.438 1.132,0.681c0.148,0.242 0.148,1.41 -0.344,2.771z"></path>
                            </g>
                          </g>
                        </svg>
                        WhatsApp
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Galleries Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Galerías</h2>
              <div className="flex items-center gap-2">
                <Badge className="bg-purple-900 text-purple-100">
                  {galleries.length}{" "}
                  {galleries.length === 1 ? "galería" : "galerías"}
                </Badge>
                <Badge className="bg-black border border-purple-700 text-purple-100">
                  {totalImages} {totalImages === 1 ? "imagen" : "imágenes"}
                </Badge>
              </div>
            </div>

            {galleries.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {galleries.map((gallery) => (
                  <Link key={gallery.id} href={`/g/${gallery.id}`}>
                    <Card className="h-full cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-purple-900/20 hover:translate-y-[-5px] bg-black border border-purple-900/50 overflow-hidden group">
                      <div className="aspect-video bg-gray-900 overflow-hidden relative">
                        {gallery.images && gallery.images[0] ? (
                          <>
                            <img
                              src={
                                getImageUrl(gallery.images[0]) ||
                                "/placeholder.svg"
                              }
                              alt={gallery.name}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
                            <ImageIcon className="h-12 w-12 text-purple-700" />
                          </div>
                        )}
                      </div>

                      <CardContent className="p-5">
                        <h3 className="font-medium text-lg text-white mb-2 group-hover:text-purple-300 transition-colors">
                          {gallery.name}
                        </h3>

                        {gallery.description && (
                          <p className="text-sm text-gray-400 line-clamp-2 mb-3">
                            {gallery.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <ImageIcon className="h-4 w-4 text-purple-500" />
                            <span>
                              {gallery.images?.length ||
                                gallery.imageCount ||
                                0}{" "}
                              imágenes
                            </span>
                          </div>

                          <ChevronRight className="h-4 w-4 text-purple-500 opacity-0 group-hover:opacity-100  transform translate-x-0 group-hover:translate-x-1 transition-transform duration-300" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center bg-black border border-purple-800">
                <div className="flex flex-col items-center gap-2">
                  <div className="rounded-full bg-purple-900/30 p-4">
                    <ImageIcon className="h-12 w-12 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-medium mt-2 text-white">
                    No hay galerías disponibles
                  </h3>
                  <p className="text-gray-400">
                    Este portafolio aún no tiene galerías publicadas
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-black/80 border-t border-purple-900/30 py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-gray-400 text-sm">
                {new Date().getFullYear()}{" "}
                {portfolio.photographer || "Fotógrafo"}. Todos los derechos
                reservados.
              </p>
              {portfolio.location && (
                <p className="text-gray-500 text-xs mt-1">
                  {portfolio.location}
                </p>
              )}
            </div>

            <div className="flex items-center gap-4">
              {portfolio.instagram && (
                <a
                  href={`https://instagram.com/${portfolio.instagram.replace(
                    "@",
                    ""
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-purple-400 transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="h-5 w-5" />
                </a>
              )}

              {portfolio.website && (
                <a
                  href={portfolio.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-purple-400 transition-colors"
                  aria-label="Website"
                >
                  <Globe className="h-5 w-5" />
                </a>
              )}

              {portfolio.email && (
                <a
                  href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
                    portfolio.email.trim()
                  )}`}
                  className="text-gray-400 hover:text-purple-400 transition-colors"
                  aria-label="Email"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Mail className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
