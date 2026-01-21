
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { UPDATE_TYPES, MUNICIPALITIES } from '../constants';

interface Message {
  role: 'user' | 'model';
  text: string;
}

export const AIChat: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Hello! I am your BDM Data Assistant. How can I help you with tracking updates today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatSessionRef = useRef<Chat | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const initChat = async () => {
    // Initializing the GenAI client using the correct named parameter from environment variables.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: `You are the BDM Special Updates Assistant. 
        Your job is to help staff from various municipalities (${MUNICIPALITIES.join(', ')}) track special member updates in the Special Updates Tracker.
        The system tracks these update types: ${UPDATE_TYPES.join(', ')}.
        If users ask about 'Code 12', explain it refers to Moved-Out Members or Households.
        Always be professional, concise, and helpful. You are an expert in special updates tracker management.`,
      },
    });
    chatSessionRef.current = chat;
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      if (!chatSessionRef.current) await initChat();
      
      const result = await chatSessionRef.current!.sendMessageStream({ message: userMsg });
      
      let fullText = '';
      setMessages(prev => [...prev, { role: 'model', text: '' }]);

      for await (const chunk of result) {
        // Correctly extracting generated text using the .text property from GenerateContentResponse chunks.
        const c = chunk as GenerateContentResponse;
        fullText += c.text;
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'model', text: fullText };
          return updated;
        });
      }
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: 'Sorry, I encountered an error connecting to the central brain. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col z-[200] overflow-hidden animate-in slide-in-from-bottom-6 duration-300">
      <div className="bg-indigo-600 p-4 text-white flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <i className="fa-solid fa-robot"></i>
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest leading-none">BDM Assistant</h3>
            <p className="text-[9px] text-indigo-200 font-bold uppercase mt-1">Special Updates Tracking Intelligence</p>
          </div>
        </div>
        <button onClick={onClose} className="hover:rotate-90 transition-transform"><i className="fa-solid fa-xmark"></i></button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
              m.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-none' 
                : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none shadow-sm'
            }`}>
              {m.text || <span className="animate-pulse">...</span>}
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length-1].role === 'user' && (
          <div className="flex justify-start">
             <div className="bg-white border p-3 rounded-2xl rounded-tl-none"><i className="fa-solid fa-ellipsis animate-bounce"></i></div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t flex space-x-2">
        <input 
          type="text" 
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && handleSend()}
          placeholder="Ask about update codes..."
          className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
        />
        <button 
          onClick={handleSend}
          disabled={isLoading}
          className="bg-indigo-600 text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100 active:scale-95 transition-all"
        >
          <i className="fa-solid fa-paper-plane"></i>
        </button>
      </div>
    </div>
  );
};
