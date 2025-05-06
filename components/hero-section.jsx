import Link from "next/link";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <div className="container mx-auto px-4 py-20 flex flex-col items-center text-center">
      <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
        Comparte <span className="text-purple-500">Fotografías</span> con tus
        clientes
      </h1>
      <p className="text-xl text-muted-foreground max-w-2xl mb-10">
        Crea hermosas galerias, sube imagenes directamente desde Google Drive y
        compartelas directamente con tus clientes en un par de clicks.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Link href="/signup">
          <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
            Comenzar
          </Button>
        </Link>
        <Link href="/login">
          <Button size="lg" variant="outline">
            Iniciar Sesion
          </Button>
        </Link>
      </div>
      <div className="mt-20 relative w-full max-w-4xl">
        <div className="aspect-video rounded-lg overflow-hidden border border-border/50 shadow-xl bg-card">
          <div className="grid grid-cols-3 gap-1 p-1 h-full">
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className="bg-muted rounded aspect-square"
                style={{
                  backgroundColor:
                    i % 2 === 0 ? "hsl(270, 20%, 15%)" : "hsl(270, 20%, 20%)",
                }}
              />
            ))}
          </div>
        </div>
        <div className="absolute -bottom-4 -right-4 bg-purple-600 text-white px-6 py-3 rounded-lg shadow-lg">
          Galerias Hermosas
        </div>
      </div>
    </div>
  );
}
