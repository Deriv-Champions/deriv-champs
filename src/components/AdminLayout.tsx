import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, MessageSquare, Users, Settings, LogOut, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/admin" },
  { label: "Conversations", icon: MessageSquare, path: "/admin/conversations" },
  { label: "Leads", icon: Users, path: "/admin/leads" },
  { label: "Agent Config", icon: Settings, path: "/admin/config" },
];

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card hidden md:flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-lg font-bold tracking-tight">Deriv Champions</h2>
          <p className="text-xs text-muted-foreground">WhatsApp Bot Admin</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
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
        <div className="p-4 border-t space-y-1">
          <Button variant="ghost" onClick={toggleTheme} className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground">
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            {theme === "light" ? "Dark Mode" : "Light Mode"}
          </Button>
          <Button variant="ghost" onClick={handleLogout} className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      <div className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-card z-50">
        <nav className="flex justify-around p-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-xs",
                location.pathname === item.path
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Main content */}
      <main className="flex-1 p-6 md:p-8 pb-20 md:pb-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
