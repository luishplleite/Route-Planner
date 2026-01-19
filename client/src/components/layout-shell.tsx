import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Navigation, Calendar, DollarSign, Menu, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [open, setOpen] = useState(false);

  const navItems = [
    { href: "/app/plan", label: "Planejar", icon: Calendar },
    { href: "/app/drive", label: "Dirigir", icon: Navigation },
    { href: "/app/finance", label: "Financeiro", icon: DollarSign },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Mobile Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-primary text-primary-foreground shadow-md">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="bg-white/20 p-1.5 rounded-lg">
              <Navigation className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-display font-bold tracking-tight">ROTA<span className="text-white/80">CERTA</span></span>
          </div>

          <div className="flex items-center gap-2">
             <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-white/10">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-card w-[80%] sm:w-[350px]">
                <div className="flex flex-col h-full py-6">
                  <div className="flex items-center gap-4 mb-8 px-2">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary">
                      {user?.profileImageUrl ? (
                        <img src={user.profileImageUrl} alt="Usuário" className="h-full w-full rounded-full object-cover" />
                      ) : (
                        <User className="h-6 w-6 text-primary" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-lg">{user?.firstName || 'Entregador'}</p>
                      <p className="text-sm text-muted-foreground truncate max-w-[180px]">{user?.email}</p>
                    </div>
                  </div>

                  <nav className="flex flex-col gap-2 flex-1">
                    {navItems.map((item) => (
                      <Link key={item.href} href={item.href}>
                        <Button
                          variant={location === item.href ? "secondary" : "ghost"}
                          className="w-full justify-start gap-3 h-12 text-lg font-medium"
                          onClick={() => setOpen(false)}
                        >
                          <item.icon className="h-5 w-5" />
                          {item.label}
                        </Button>
                      </Link>
                    ))}
                  </nav>

                  <Button 
                    variant="destructive" 
                    className="mt-auto w-full gap-2"
                    onClick={() => {
                      logout();
                      setOpen(false);
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    Sair
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6 max-w-4xl pb-24 md:pb-6">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t shadow-[0_-5px_15px_rgba(0,0,0,0.05)] z-30 pb-safe-bottom">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const isActive = location.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}>
                <div className={`flex flex-col items-center justify-center w-20 h-full gap-1 cursor-pointer transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                  <item.icon className={`h-6 w-6 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                  <span className="text-[10px] font-medium uppercase tracking-wide">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
