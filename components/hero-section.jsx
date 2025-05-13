"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Camera,
  ArrowRight,
  CheckCircle,
  Upload,
  Share2,
  Lock,
} from "lucide-react";
import { motion } from "framer-motion";
import LatestGalleries from "./LatestGalleries";
import Image from "next/image";

export function HeroSection() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  const staggerFeatures = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const featureItem = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.5 },
    },
  };

  const features = [
    { icon: <Camera className="h-4 w-4" />, text: "Galerías ilimitadas" },
    {
      icon: <Upload className="h-4 w-4" />,
      text: "Integración con Google Drive",
    },
    {
      icon: <Lock className="h-4 w-4" />,
      text: "Galerías protegidas con contraseña",
    },
    {
      icon: <Share2 className="h-4 w-4" />,
      text: "Compartir con un solo clic",
    },
  ];

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-background to-background/95">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-purple-700/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left column: Text content */}
          <motion.div
            className="flex flex-col items-start text-left"
            initial="hidden"
            animate={isVisible ? "visible" : "hidden"}
            variants={fadeIn}
          >
            <Badge className="mb-4 bg-purple-100 text-purple-800 hover:bg-purple-200 px-3 py-1">
              Plataforma para fotógrafos
            </Badge>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-tight">
              Comparte{" "}
              <span className="text-transparent bg-clip-text bg-purple-600">
                Fotografías
              </span>{" "}
              con tus clientes
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-8">
              Crea hermosas galerías, sube imágenes directamente desde Google
              Drive y compártelas con tus clientes en un par de clics.
            </p>

            <motion.div
              className="flex flex-wrap gap-3 mb-10"
              variants={staggerFeatures}
              initial="hidden"
              animate={isVisible ? "visible" : "hidden"}
            >
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  className="flex items-center gap-2 bg-muted/50 rounded-full px-3 py-1 text-sm"
                  variants={featureItem}
                >
                  <CheckCircle className="h-4 w-4 text-purple-500" />
                  <span>{feature.text}</span>
                </motion.div>
              ))}
            </motion.div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/signup">
                <Button
                  size="lg"
                  className="bg-purple-600 hover:bg-purple-700 shadow-lg hover:shadow-xl transition-all group"
                >
                  Comenzar Gratis
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-purple-200 hover:border-purple-300 hover:bg-purple-50/50"
                >
                  Iniciar Sesión
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Right column: Galleries showcase */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={
              isVisible ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }
            }
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            <div className="relative rounded-xl overflow-hidden border border-purple-200/30 shadow-2xl bg-card">
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-900/10 via-transparent to-transparent pointer-events-none z-10" />

              <div className="aspect-[4/3] md:aspect-[16/10] overflow-hidden">
                <LatestGalleries limit={6} showFilters={false} />
              </div>

              <div className="absolute top-0 left-0 w-full h-12 bg-gradient-to-b from-background/80 to-transparent pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-background/80 to-transparent pointer-events-none" />
            </div>

            <div className="absolute -bottom-4 -right-4 bg-gradient-to-r from-purple-700 to-purple-500 text-white px-6 py-3 rounded-lg shadow-lg">
              <span className="font-medium">Últimas Galerías</span>
            </div>

            {/* Decorative camera icon */}
            <div className="absolute -top-6 -left-6 bg-white/90 p-3 rounded-full shadow-lg hidden md:block">
              {/* <Camera className="h-8 w-8 text-purple-600" /> */}
              <Image src="/luxmagius.png" alt="Camera" width={60} height={60} />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
