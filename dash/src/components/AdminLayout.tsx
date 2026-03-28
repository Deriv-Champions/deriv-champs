import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, Calendar, MessageSquare, GraduationCap, Clock, 
  MessageCircle, Users, Settings, LogOut, Sun, Moon, User, Book, Menu, FileText 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import { useQuery } from "@tanstack/react-query";
import { User as UserIcon } from "lucide-react";
import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/admin" },
  { label: "Bookings", icon: Calendar, path: "/admin/bookings" },
  { label: "Contacts", icon: MessageSquare, path: "/admin/contacts" },
  { label: "Programmes", icon: GraduationCap, path: "/admin/programmes" },
  { label: "Availability", icon: Clock, path: "/admin/availability" },
  { label: "Conversations", icon: MessageCircle, path: "/admin/conversations" },
  { label: "Leads", icon: UserIcon, path: "/admin/leads" },
  { label: "Reports", icon: FileText, path: "/admin/reports" },
  { label: "Users", icon: UserIcon, path: "/admin/users" },
  { label: "Profile", icon: UserIcon, path: "/admin/profile" },
  { label: "Knowledge Base", icon: Book, path: "/admin/knowledge" },
  { label: "Agent Config", icon: Settings, path: "/admin/config" },
];

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [session, setSession] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  const NavContent = () => (
    <>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setIsMobileMenuOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              location.pathname === item.path
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t space-y-4">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border">
            {session?.user?.id ? (
              <CurrentUserAvatar id={session.user.id} />
            ) : (
              <UserIcon className="h-5 w-5 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              <CurrentUserName id={session?.user?.id} fallback={session?.user?.email?.split('@')[0]} />
            </p>
            <p className="text-xs text-muted-foreground truncate">{session?.user?.email}</p>
          </div>
        </div>
        <div className="space-y-1">
          <Button variant="ghost" onClick={toggleTheme} className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground">
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            {theme === "light" ? "Dark Mode" : "Light Mode"}
          </Button>
          <Button variant="ghost" onClick={handleLogout} className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-background flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 border-b bg-card sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold tracking-tight">Deriv Champions</h2>
        </div>
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72 flex flex-col">
            <SheetHeader className="p-6 border-b text-left">
              <SheetTitle>Admin Menu</SheetTitle>
            </SheetHeader>
            <NavContent />
          </SheetContent>
        </Sheet>
      </header>

      {/* Sidebar for Desktop */}
      <aside className="w-64 border-r bg-card hidden md:flex flex-col sticky top-0 h-screen">
        <div className="p-6 border-b">
          <h2 className="text-lg font-bold tracking-tight">Deriv Champions</h2>
          <p className="text-xs text-muted-foreground">WhatsApp Bot Admin</p>
        </div>
        <NavContent />
      </aside>

      {/* Main content */}
      <main className="flex-1 p-4 md:p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};


const CurrentUserAvatar = ({ id }: { id: string }) => {
  const { data: profile } = useQuery({
    queryKey: ["profile", id],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("profiles").select("avatar_url").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });

  if (profile?.avatar_url) {
    return <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />;
  }
  return <UserIcon className="h-5 w-5 text-primary" />;
};

const CurrentUserName = ({ id, fallback }: { id?: string; fallback?: string }) => {
  const { data: profile } = useQuery({
    queryKey: ["profile", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("profiles").select("full_name").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });

  return <>{profile?.full_name || fallback || "Admin"}</>;
};

export default AdminLayout;
