import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, ChevronDown, ChevronUp, Send } from "lucide-react";

const AIAssistant = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      text: "Hello! How can I assist you with the complaint management system today?",
      isBot: true,
    },
    {
      text: "How do I check the status of my complaint?",
      isBot: false,
    },
  ]);

  const handleSend = () => {
    if (!message.trim()) return;
    
    setMessages([...messages, { text: message, isBot: false }]);
    setMessage("");
    
    // Simulate bot response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          text: "Thank you for your question. You can check your complaint status in the 'My Complaints' section or right here on your dashboard.",
          isBot: true,
        },
      ]);
    }, 1000);
  };

  return (
    <Card className="fixed bottom-24 right-6 w-96 shadow-xl">
      <div
        className="flex items-center justify-between p-4 bg-primary text-primary-foreground rounded-t-lg cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          <span className="font-semibold">AI Assistant</span>
        </div>
        {isExpanded ? (
          <ChevronDown className="h-5 w-5" />
        ) : (
          <ChevronUp className="h-5 w-5" />
        )}
      </div>

      {isExpanded && (
        <div className="bg-card">
          <div className="h-64 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.isBot ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    msg.isBot
                      ? "bg-muted text-foreground"
                      : "bg-primary text-primary-foreground"
                  }`}
                >
                  <p className="text-sm">{msg.text}</p>
                  <p className="text-xs mt-1 opacity-70">
                    {msg.isBot ? "10:30 AM" : "10:33 AM"}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-border">
            <div className="flex gap-2">
              <Input
                placeholder="Type your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSend()}
              />
              <Button size="icon" onClick={handleSend}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default AIAssistant;