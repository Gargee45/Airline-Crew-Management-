
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Send, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export function GeminiAssistant({ context }: { context: string }) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          { role: 'user', parts: [{ text: `You are an expert in airline crew optimization. Use the following context about the current schedule and optimization results to answer the user's question.\n\nContext: ${context}\n\nUser Question: ${userMsg}` }] }
        ],
      });

      const aiMsg = response.text || "I'm sorry, I couldn't generate a response.";
      setMessages(prev => [...prev, { role: 'ai', content: aiMsg }]);
    } catch (error) {
      console.error("Gemini Error:", error);
      setMessages(prev => [...prev, { role: 'ai', content: "Error connecting to AI assistant." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-none shadow-sm rounded-3xl overflow-hidden h-full flex flex-col">
      <CardHeader className="bg-blue-600 text-white py-4">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Sparkles size={16} />
          Optimization Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1 flex flex-col bg-gray-50/50">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <p className="text-xs text-gray-400 italic">Ask me about the schedule, constraints, or optimization results.</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-none'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 rounded-tl-none">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="p-4 bg-white border-t border-gray-100 flex gap-2">
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask a question..."
            className="flex-1 bg-gray-50 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <Button size="icon" onClick={handleSend} disabled={isLoading} className="rounded-xl bg-blue-600 hover:bg-blue-700">
            <Send size={16} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
