import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, MessageSquare } from "lucide-react";

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
    const fetchConvs = async () => {
      const { data } = await supabase
        .from("conversations")
        .select("*")
        .order("updated_at", { ascending: false });
      setConversations((data as Conversation[]) || []);
    };
    fetchConvs();
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

  const selectedConv = conversations.find((c) => c.id === selected);

  // Mobile: show thread when selected, list when not
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Conversations</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
        {/* Conversation list — hidden on mobile when a chat is selected */}
        <Card className={`lg:col-span-1 ${selected ? "hidden lg:block" : ""}`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Chats ({conversations.length})
            </CardTitle>
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

        {/* Messages thread */}
        <Card className={`lg:col-span-2 ${!selected ? "hidden lg:block" : ""}`}>
          <CardHeader className="pb-3 flex flex-row items-center gap-3">
            {selected && (
              <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSelected(null)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <div>
              <CardTitle className="text-lg">
                {selectedConv ? selectedConv.whatsapp_name || selectedConv.whatsapp_phone : "Select a conversation"}
              </CardTitle>
              {selectedConv && (
                <p className="text-xs text-muted-foreground">{selectedConv.whatsapp_phone}</p>
              )}
            </div>
          </CardHeader>
          <ScrollArea className="h-[calc(100vh-16rem)]">
            <CardContent className="space-y-3 pt-0">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "assistant" ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                      msg.role === "assistant"
                        ? "bg-muted text-foreground rounded-bl-sm"
                        : "bg-primary text-primary-foreground rounded-br-sm"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <p className="text-[10px] opacity-60 mt-1">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              {!selected && (
                <div className="text-center py-16">
                  <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Select a conversation to view the thread</p>
                </div>
              )}
              {selected && messages.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">No messages in this conversation</p>
              )}
            </CardContent>
          </ScrollArea>
        </Card>
      </div>
    </div>
  );
};

export default Conversations;
