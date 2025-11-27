import { useState } from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AIAssistantInput from "./AIAssistantInput";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AIChatUI() {
  const [messages, setMessages] = useState<Message[]>([]);

  const handleUserMessage = (message: string) => {
    setMessages(prev => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        role: 'user',
        content: message,
        timestamp: new Date()
      }
    ]);
  };

  const handleResponse = (response: string) => {
    setMessages(prev => [
      ...prev,
      {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: new Date()
      }
    ]);
  };

  return (
    <Card className="overflow-hidden">
      <div className="p-4 border-b bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Assistente de Saúde</h3>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Organize sua rotina, tire dúvidas e encontre o que precisa
        </p>
      </div>

      {messages.length > 0 && (
        <ScrollArea className="h-[300px] p-4">
          <div className="space-y-4">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="p-2 bg-primary/10 rounded-full h-fit">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString('pt-BR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>

                  {message.role === 'user' && (
                    <div className="p-2 bg-primary rounded-full h-fit">
                      <User className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </ScrollArea>
      )}

      <div className="p-4 border-t">
        <AIAssistantInput 
          onResponse={handleResponse}
          onUserMessage={handleUserMessage}
        />
      </div>
    </Card>
  );
}
