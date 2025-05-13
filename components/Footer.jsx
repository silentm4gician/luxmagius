import Link from "next/link";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Send,
  GithubIcon,
} from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-background pt-12 pb-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {/* Company Info */}
          <div>
            <Link href="/">
              <div className="flex items-center gap-2 mb-4">
                <div className="size-10 rounded-full flex items-center justify-center shadow-sm p-1">
                  <Image
                    src="/luxmagius.png"
                    alt="Luxmagius Logo"
                    width={100}
                    height={100}
                    className="w-full h-full"
                  />
                </div>
                <h3 className="text-xl font-bold bg-clip-text text-transparent text-white">
                  Luxmagius
                </h3>
              </div>
            </Link>
            <p className="text-muted-foreground mb-4">
              Plataforma para fotógrafos profesionales que desean compartir su
              trabajo con clientes de manera elegante y segura.
            </p>
            <Link
              href="https://github.com/silentm4gician"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full hover:bg-purple-100 hover:text-purple-600"
              >
                <GithubIcon className="h-5 w-5" />
                <span className="sr-only">Github</span>
              </Button>
            </Link>
            {/* <div className="flex space-x-3">
              <Link
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full hover:bg-purple-100 hover:text-purple-600"
                >
                  <Facebook className="h-5 w-5" />
                  <span className="sr-only">Facebook</span>
                </Button>
              </Link>
              <Link
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full hover:bg-purple-100 hover:text-purple-600"
                >
                  <Instagram className="h-5 w-5" />
                  <span className="sr-only">Instagram</span>
                </Button>
              </Link>
              <Link
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full hover:bg-purple-100 hover:text-purple-600"
                >
                  <Twitter className="h-5 w-5" />
                  <span className="sr-only">Twitter</span>
                </Button>
              </Link>
              <Link
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full hover:bg-purple-100 hover:text-purple-600"
                >
                  <Linkedin className="h-5 w-5" />
                  <span className="sr-only">LinkedIn</span>
                </Button>
              </Link>
            </div> */}
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Enlaces Rápidos</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="https://github.com/silentm4gician"
                  className="text-muted-foreground hover:text-purple-600 transition-colors"
                  target="_blank"
                >
                  Sobre Nosotros
                </Link>
              </li>
              {/* <li>
                <Link
                  href="/pricing"
                  className="text-muted-foreground hover:text-purple-600 transition-colors"
                >
                  Precios
                </Link>
              </li> */}
              <li>
                <Link
                  href="https://mail.google.com/mail/?view=cm&fs=1&to=leandroGonzalezMat@gmail.com"
                  className="text-muted-foreground hover:text-purple-600 transition-colors"
                  target="_blank"
                >
                  Contacto
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Contacto</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 text-purple-600" />
                <span>Ushuaia, Argentina</span>
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4 text-purple-600" />
                <span>+54 3858 506372</span>
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4 text-purple-600" />
                <span>leandroGonzalezMat@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="mb-6" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {currentYear} Luxmagius. Todos los derechos reservados.
          </p>
          {/* <div className="flex gap-4 text-sm">
            <Link
              href="/privacy"
              className="text-muted-foreground hover:text-purple-600 transition-colors"
            >
              Política de Privacidad
            </Link>
            <Link
              href="/terms"
              className="text-muted-foreground hover:text-purple-600 transition-colors"
            >
              Términos de Servicio
            </Link>
            <Link
              href="/cookies"
              className="text-muted-foreground hover:text-purple-600 transition-colors"
            >
              Política de Cookies
            </Link>
          </div> */}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
