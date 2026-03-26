import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MessageSquare, Users, TrendingUp, Settings, Plus,
  Download, RefreshCw, Clock, CalendarDays
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import { format } from "date-fns";

interface Stats {
  conversations: number;
  leads: number;
  qualified: number;
  hotLeads: number;
  nurturing: number;
  converted: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<Stats>({
    conversations: 0, leads: 0, qualified: 0, hotLeads: 0, nurturing: 0, converted: 0,
  });
  const [recentLeads, setRecentLeads] = useState<any[]>([]);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      const [convRes, leadRes, qualRes, hotRes, nurRes, convtRes] = await Promise.all([
        supabase.from("conversations").select("id", { count: "exact", head: true }),
        supabase.from("leads").select("id", { count: "exact", head: true }),
        supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "qualified"),
        supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "qualified"),
        supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "contacted"),
        supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "converted"),
      ]);
      setStats({
        conversations: convRes.count || 0,
        leads: leadRes.count || 0,
        qualified: qualRes.count || 0,
        hotLeads: hotRes.count || 0,
        nurturing: nurRes.count || 0,
        converted: convtRes.count || 0,
      });
    };

    const fetchRecent = async () => {
      const { data } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);
      setRecentLeads(data || []);
    };

    fetchStats();
    fetchRecent();
  }, []);

  const greeting = () => {
    const h = now.getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const statCards = [
    { title: "Total Conversations", value: stats.conversations, icon: MessageSquare, color: "bg-primary/10 text-primary" },
    { title: "Total Leads", value: stats.leads, icon: Users, color: "bg-info/10 text-info" },
    { title: "Qualified Leads", value: stats.qualified, icon: TrendingUp, color: "bg-success/10 text-success" },
    { title: "Converted", value: stats.converted, icon: TrendingUp, color: "bg-warning/10 text-warning" },
    { title: "Nurturing", value: stats.nurturing, icon: Users, color: "bg-accent text-accent-foreground" },
    { title: "Agent Config", value: "→", icon: Settings, color: "bg-muted text-muted-foreground", link: "/admin/config" },
  ];

  const pieData = [
    { name: "New", value: Math.max(stats.leads - stats.qualified - stats.nurturing - stats.converted, 0), color: "hsl(25, 95%, 53%)" },
    { name: "Nurturing", value: stats.nurturing, color: "hsl(210, 80%, 55%)" },
    { name: "Qualified", value: stats.qualified, color: "hsl(142, 71%, 45%)" },
    { name: "Converted", value: stats.converted, color: "hsl(38, 92%, 50%)" },
  ].filter(d => d.value > 0);

  const barData = [
    { name: "Conversations", count: stats.conversations },
    { name: "Leads", count: stats.leads },
    { name: "Qualified", count: stats.qualified },
    { name: "Converted", count: stats.converted },
  ];

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{greeting()}, Admin 👋</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
            <span className="flex items-center gap-1"><CalendarDays className="h-4 w-4" />{format(now, "EEEE, MMMM do yyyy")}</span>
            <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{format(now, "hh:mm a")}</span>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button asChild size="sm"><Link to="/admin/conversations"><MessageSquare className="mr-1 h-4 w-4" />View Chats</Link></Button>
          <Button asChild size="sm" variant="outline"><Link to="/admin/leads"><Users className="mr-1 h-4 w-4" />View Leads</Link></Button>
          <Button asChild size="sm" variant="outline"><Link to="/admin/config"><Settings className="mr-1 h-4 w-4" />Configure Bot</Link></Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((card) => {
          const inner = (
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg ${card.color}`}>
                    <card.icon className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-2xl font-bold">{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.title}</p>
              </CardContent>
            </Card>
          );
          return card.link ? <Link to={card.link} key={card.title}>{inner}</Link> : <div key={card.title}>{inner}</div>;
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Overview</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(25, 95%, 53%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Lead Distribution</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm py-12">No lead data yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Leads */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Leads</CardTitle>
          <Button asChild size="sm" variant="ghost"><Link to="/admin/leads">View All →</Link></Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentLeads.map((lead) => (
              <div key={lead.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium text-sm">{lead.name || lead.whatsapp_phone}</p>
                  <p className="text-xs text-muted-foreground">{lead.training_interest || "No interest specified"}</p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">{lead.status}</span>
                  <p className="text-xs text-muted-foreground mt-1">Score: {lead.lead_score || 0}</p>
                </div>
              </div>
            ))}
            {recentLeads.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No leads yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
