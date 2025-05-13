import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HeroSection } from "@/components/hero-section";
import Image from "next/image";
import Footer from "@/components/Footer";
import {
  Camera,
  Upload,
  Lock,
  Heart,
  Share2,
  Users,
  Shield,
  Star,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
      {/* Header */}
      <header className="container mx-auto py-4 px-4 flex items-center justify-between sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/40 w-full rounded-b-lg">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="size-12 sm:size-12 rounded-full flex items-center justify-center shadow-sm p-1 transition-transform group-hover:scale-105">
            <Image
              src="/luxmagius.png"
              alt="Luxmagius Logo"
              width={100}
              height={100}
              className="w-full h-full"
            />
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-white">
            Luxmagius
          </h1>
        </Link>
        <div className="flex items-center gap-2 sm:gap-4">
          <Link href="/login">
            <Button variant="ghost" className="text-sm sm:text-base">
              Ingresar
            </Button>
          </Link>
          <Link href="/signup">
            <Button className="bg-purple-600 hover:bg-purple-700 text-sm sm:text-base">
              Registrarse
            </Button>
          </Link>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <HeroSection />

        {/* How It Works Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Cómo funciona
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Compartir tus fotografías nunca ha sido tan fácil. Sigue estos
                simples pasos para comenzar.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="flex flex-col items-center text-center">
                <div className="rounded-full bg-purple-600 text-white w-12 h-12 flex items-center justify-center text-xl font-bold mb-4">
                  1
                </div>
                <h3 className="text-xl font-semibold mb-2">Crea tu cuenta</h3>
                <p className="text-muted-foreground">
                  Regístrate en nuestra plataforma en menos de un minuto y
                  configura tu perfil de fotógrafo.
                </p>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center text-center">
                <div className="rounded-full bg-purple-600 text-white w-12 h-12 flex items-center justify-center text-xl font-bold mb-4">
                  2
                </div>
                <h3 className="text-xl font-semibold mb-2">Sube tus fotos</h3>
                <p className="text-muted-foreground">
                  Crea galerías y sube tus imágenes desde tu dispositivo o
                  directamente desde Google Drive.
                </p>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center text-center">
                <div className="rounded-full bg-purple-600 text-white w-12 h-12 flex items-center justify-center text-xl font-bold mb-4">
                  3
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  Comparte con clientes
                </h3>
                <p className="text-muted-foreground">
                  Genera un enlace único para compartir con tus clientes, con o
                  sin protección por contraseña.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Todo lo que necesitas para compartir tus fotos
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Nuestra plataforma está diseñada específicamente para fotógrafos
                profesionales que quieren compartir su trabajo con clientes de
                manera elegante y segura.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-card rounded-xl p-6 shadow-sm border border-border/50 hover:shadow-md transition-shadow">
                <div className="rounded-full bg-purple-100 p-3 w-fit mb-4">
                  <Camera className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  Galerías Ilimitadas
                </h3>
                <p className="text-muted-foreground">
                  Crea tantas galerías como necesites para organizar tus
                  sesiones fotográficas y proyectos.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-card rounded-xl p-6 shadow-sm border border-border/50 hover:shadow-md transition-shadow">
                <div className="rounded-full bg-purple-100 p-3 w-fit mb-4">
                  <Upload className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  Integración con Google Drive
                </h3>
                <p className="text-muted-foreground">
                  Importa imágenes directamente desde Google Drive sin necesidad
                  de descargarlas primero.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-card rounded-xl p-6 shadow-sm border border-border/50 hover:shadow-md transition-shadow">
                <div className="rounded-full bg-purple-100 p-3 w-fit mb-4">
                  <Lock className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  Galerías Protegidas
                </h3>
                <p className="text-muted-foreground">
                  Protege tus galerías con contraseñas para que solo tus
                  clientes puedan acceder a ellas.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="bg-card rounded-xl p-6 shadow-sm border border-border/50 hover:shadow-md transition-shadow">
                <div className="rounded-full bg-purple-100 p-3 w-fit mb-4">
                  <Heart className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  Selección de Favoritos
                </h3>
                <p className="text-muted-foreground">
                  Permite que tus clientes marquen sus fotos favoritas para
                  facilitar la selección final.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="bg-card rounded-xl p-6 shadow-sm border border-border/50 hover:shadow-md transition-shadow">
                <div className="rounded-full bg-purple-100 p-3 w-fit mb-4">
                  <Share2 className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  Compartir Fácilmente
                </h3>
                <p className="text-muted-foreground">
                  Comparte tus galerías con un solo clic mediante enlaces
                  directos o redes sociales.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="bg-card rounded-xl p-6 shadow-sm border border-border/50 hover:shadow-md transition-shadow">
                <div className="rounded-full bg-purple-100 p-3 w-fit mb-4">
                  <Shield className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  Seguridad Avanzada
                </h3>
                <p className="text-muted-foreground">
                  Tus imágenes están seguras con nosotros gracias a nuestro
                  almacenamiento cifrado y protegido.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="container mx-auto py-6 px-4">
        <Footer />
      </footer>
    </div>
  );
}
