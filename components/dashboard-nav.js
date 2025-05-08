"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  LayoutGrid,
  ImageIcon,
  Settings,
  LogOut,
  Menu,
  Aperture,
} from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Image from "next/image";

export function DashboardNav({ user, onLogout }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const routes = [
    {
      href: "/dashboard",
      label: "Panel de Control",
      icon: LayoutGrid,
      active: pathname === "/dashboard",
    },
    {
      href: "/dashboard/galleries",
      label: "Galerias",
      icon: ImageIcon,
      active:
        pathname === "/dashboard/galleries" ||
        pathname.startsWith("/dashboard/galleries/"),
    },
    {
      href: "/dashboard/settings",
      label: "Ajustes",
      icon: Settings,
      active: pathname === "/dashboard/settings",
    },
  ];

  const NavLinks = () => (
    <>
      <div className="flex items-center gap-3 px-4 py-2">
        <Avatar className="h-9 w-9">
          <AvatarImage
            src={user?.photoURL || "/placeholder.svg"}
            alt={user?.displayName || user?.email}
          />
          <AvatarFallback className="bg-purple-600 text-white">
            {user?.displayName?.[0] || user?.email?.[0] || "U"}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="font-medium">{user?.displayName || "User"}</span>
          <span className="text-xs text-muted-foreground">{user?.email}</span>
        </div>
      </div>
      <div className="space-y-1 px-2 py-4">
        {routes.map((route) => (
          <Link key={route.href} href={route.href}>
            <Button
              variant={route.active ? "secondary" : "ghost"}
              className="w-full justify-start"
            >
              <route.icon className="mr-2 h-4 w-4" />
              {route.label}
            </Button>
          </Link>
        ))}
      </div>
      <div className="px-2 mt-auto">
        <Button
          variant="ghost"
          className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-100/10"
          onClick={onLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar Sesion
        </Button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Navigation */}
      <div className="md:hidden flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <div className="size-12 rounded-full">
            {/* <Aperture className="w-full h-full text-white border-2 rounded-full" /> */}
            <Image src="/mismagiusLogo.png" alt="Logo" width={50} height={50} />
          </div>
          <h1 className="text-xl font-bold">Mismagius</h1>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="flex flex-col p-0"
            title="Menu"
            description="Menu"
          >
            <div className="flex flex-col h-full py-4">
              <NavLinks />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Navigation */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r">
        <div className="flex flex-col h-full py-4">
          <div className="px-4 py-2 flex items-center gap-2 mb-6">
            <div className="size-14 rounded-full">
              {/* <Aperture className="w-full h-full text-white border-2 rounded-full" /> */}
              <Image
                src="/mismagiusLogo.png"
                alt="Logo"
                width={80}
                height={80}
              />
            </div>
            <h1 className="text-xl font-bold">Mismagius</h1>
          </div>
          <NavLinks />
        </div>
      </div>
    </>
  );
}
