"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  id: number;
  text: string;
  sender: "user" | "bot";
  intent?: string;
  isStreaming?: boolean;
}

export default function ChatWidget() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: "Hello! Welcome to ChatFusion.ai. How can I help you today?", sender: "bot" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { id: Date.now(), text: input, sender: "user" };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    const botMessageId = Date.now() + 1;
    // Add placeholder bot message
    setMessages((prev) => [...prev, { id: botMessageId, text: "", sender: "bot", isStreaming: true }]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: "user-1", channel: "web", text: userMessage.text }),
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let fullText = "";
      let intentStr = "";

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const messagesRaw = chunk.split("\n\n");

          for (const raw of messagesRaw) {
            if (raw.trim() === "data: [DONE]") {
              done = true;
              break;
            }
            if (raw.startsWith("data: ")) {
              try {
                const data = JSON.parse(raw.replace("data: ", ""));
                if (data.type === "content") {
                  fullText += data.value;
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === botMessageId ? { ...msg, text: fullText } : msg
                    )
                  );
                } else if (data.type === "intent") {
                  intentStr = data.value;
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === botMessageId ? { ...msg, intent: intentStr } : msg
                    )
                  );
                } else if (data.type === "error") {
                   fullText += data.value;
                   setMessages((prev) => prev.map((msg) => msg.id === botMessageId ? { ...msg, text: fullText } : msg));
                }
              } catch (e) {
                // Ignore incomplete JSON chunks matching splits
              }
            }
          }
        }
      }

      // Mark streaming as complete 
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === botMessageId ? { ...msg, isStreaming: false } : msg
        )
      );
      
    } catch (error) {
      console.error(error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === botMessageId
            ? { ...msg, text: "Unable to reach server. Please try again.", isStreaming: false }
            : msg
        )
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center font-sans p-4">
      {/* Dynamic Background Effect */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600 rounded-full mix-blend-multiply filter blur-[100px] opacity-20 animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-fuchsia-600 rounded-full mix-blend-multiply filter blur-[100px] opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] bg-blue-600 rounded-full mix-blend-multiply filter blur-[100px] opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative w-full max-w-lg h-[80vh] bg-slate-800/60 backdrop-blur-xl border border-slate-700 shadow-2xl rounded-3xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
            <div>
              <h1 className="text-lg font-semibold tracking-wide text-white">ChatFusion Support ⚡</h1>
              <p className="text-xs text-slate-400">Streaming Responses Powered by AI</p>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 scroll-smooth scrollbar-thin scrollbar-thumb-slate-700 relative text-sm">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[85%] p-4 rounded-2xl leading-relaxed shadow-lg transition-all flex flex-col ${
                  msg.sender === "user"
                    ? "bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white rounded-br-sm inline-block"
                    : "bg-slate-700/80 text-slate-200 border border-slate-600 rounded-bl-sm w-full"
                }`}
              >
                {/* Check Streaming blinker */}
                {msg.text || (msg.isStreaming ? "Thinking..." : "")}
                
                {/* Handover Agent Escalation Tag UI */}
                {msg.intent === "request_human" && !msg.isStreaming && (
                  <div className="mt-4 pt-3 border-t border-slate-500/50 flex space-x-2 items-center text-rose-400 text-xs font-semibold uppercase tracking-wider">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                    </svg>
                    <span>Escalated to Agent</span>
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && !messages.find(m => m.isStreaming) && (
             <div className="w-12 h-6 bg-slate-700/50 border border-slate-600 shadow-md rounded-xl rounded-bl-none flex items-center justify-center">
                 <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-ping"></div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-slate-900/50 border-t border-white/10 m-1 rounded-b-3xl">
          <div className="flex items-center gap-2 bg-slate-800 rounded-full p-2 border border-slate-700 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all shadow-inner">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask anything..."
              className="flex-1 bg-transparent border-none text-sm text-slate-200 px-4 focus:outline-none placeholder-slate-500"
            />
            <button
              onClick={handleSend}
              className="p-3 bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white rounded-full hover:shadow-lg hover:shadow-indigo-500/30 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50"
              disabled={loading || !input.trim()}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.125A59.769 59.769 0 0121.485 12 59.768 59.768 0 013.27 20.875L5.999 12Zm0 0h7.5" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
