import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "./pages/NotFound.tsx";
import AdminLayout from "./components/AdminLayout.tsx";
import ProtectedRoute from "./components/ProtectedRoute.tsx";
import Dashboard from "./pages/admin/Dashboard.tsx";
import Conversations from "./pages/admin/Conversations.tsx";
import Leads from "./pages/admin/Leads.tsx";
import AgentConfig from "./pages/admin/AgentConfig.tsx";
import Bookings from "./pages/admin/Bookings.tsx";
import Contacts from "./pages/admin/Contacts.tsx";
import Programmes from "./pages/admin/Programmes.tsx";
import Availability from "./pages/admin/Availability.tsx";
import Users from "./pages/admin/Users.tsx";
import Profile from "./pages/admin/Profile.tsx";
import KnowledgeBase from "./pages/admin/KnowledgeBase.tsx";
import Reports from "./pages/admin/Reports.tsx";
import Login from "./pages/admin/Login.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="bookings" element={<Bookings />} />
            <Route path="contacts" element={<Contacts />} />
            <Route path="programmes" element={<Programmes />} />
            <Route path="availability" element={<Availability />} />
            <Route path="conversations" element={<Conversations />} />
            <Route path="leads" element={<Leads />} />
            <Route path="users" element={<Users />} />
            <Route path="reports" element={<Reports />} />
            <Route path="profile" element={<Profile />} />
            <Route path="knowledge" element={<KnowledgeBase />} />
            <Route path="config" element={<AgentConfig />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
