import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";

interface Conversation {
  id: string;
  whatsapp_phone: string;
  whatsapp_name: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

interface Message {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

const Conversations = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("conversations")
        .select("*")
        .order("updated_at", { ascending: false });
      setConversations((data as Conversation[]) || []);
    };
    fetch();
  }, []);

  useEffect(() => {
    if (!selected) return;
    const fetchMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", selected)
        .order("created_at", { ascending: true });
      setMessages((data as Message[]) || []);
    };
    fetchMessages();
  }, [selected]);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Conversations</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
        {/* Conversation list */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Chats ({conversations.length})</CardTitle>
          </CardHeader>
          <ScrollArea className="h-[calc(100vh-16rem)]">
            <CardContent className="space-y-2 pt-0">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => setSelected(conv.id)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selected === conv.id ? "bg-primary/10 border border-primary/20" : "hover:bg-muted"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-sm">{conv.whatsapp_name || conv.whatsapp_phone}</p>
                      <p className="text-xs text-muted-foreground">{conv.whatsapp_phone}</p>
                    </div>
                    <Badge variant={conv.status === "active" ? "default" : "secondary"} className="text-xs">
                      {conv.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true })}
                  </p>
                </div>
              ))}
              {conversations.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">No conversations yet</p>
              )}
            </CardContent>
          </ScrollArea>
        </Card>

        {/* Messages */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              {selected ? conversations.find((c) => c.id === selected)?.whatsapp_name || "Chat" : "Select a conversation"}
            </CardTitle>
          </CardHeader>
          <ScrollArea className="h-[calc(100vh-16rem)]">
            <CardContent className="space-y-3 pt-0">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "assistant" ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 text-sm ${
                      msg.role === "assistant"
                        ? "bg-muted text-foreground"
                        : "bg-primary text-primary-foreground"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <p className="text-[10px] opacity-60 mt-1">
                      {new Date(msg.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              {!selected && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Select a conversation to view messages
                </p>
              )}
            </CardContent>
          </ScrollArea>
        </Card>
      </div>
    </div>
  );
};

export default Conversations;
