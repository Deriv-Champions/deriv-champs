import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Users, TrendingUp, Settings } from "lucide-react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const [stats, setStats] = useState({ conversations: 0, leads: 0, qualified: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const [convRes, leadRes, qualRes] = await Promise.all([
        supabase.from("conversations").select("id", { count: "exact", head: true }),
        supabase.from("leads").select("id", { count: "exact", head: true }),
        supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "qualified"),
      ]);
      setStats({
        conversations: convRes.count || 0,
        leads: leadRes.count || 0,
        qualified: qualRes.count || 0,
      });
    };
    fetchStats();
  }, []);

  const cards = [
    { title: "Conversations", value: stats.conversations, icon: MessageSquare, link: "/admin/conversations", color: "text-blue-500" },
    { title: "Total Leads", value: stats.leads, icon: Users, link: "/admin/leads", color: "text-emerald-500" },
    { title: "Qualified Leads", value: stats.qualified, icon: TrendingUp, link: "/admin/leads", color: "text-amber-500" },
    { title: "Agent Config", value: "→", icon: Settings, link: "/admin/config", color: "text-purple-500" },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => (
          <Link to={card.link} key={card.title}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{card.value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
