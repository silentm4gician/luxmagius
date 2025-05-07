import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HeroSection } from "@/components/hero-section";
import { Aperture } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
      <header className="container mx-auto py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-10 rounded-full flex items-center justify-center">
            <Aperture className="w-full h-full text-white border-2 rounded-full" />
          </div>
          <h1 className="text-xl font-bold">Mismagius</h1>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost">Ingresar</Button>
          </Link>
          <Link href="/signup">
            <Button>Registrarse</Button>
          </Link>
        </div>
      </header>
      <main>
        <HeroSection />
      </main>
    </div>
  );
}
