import React, { useState, useEffect, useRef } from 'react';
import { Send, X, Loader2 } from 'lucide-react';
import sharedService from '../services/sharedService';
import { useAuth } from '../context/AuthContext';

export default function ChatModal({ isOpen, onClose, requestId, opponentId, opponentName }) {
  const { user } = useAuth();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen && requestId && opponentId) {
      initializeChat();
    }
    return () => {
      setConversation(null);
      setMessages([]);
    };
  }, [isOpen, requestId, opponentId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Poll conversation details every 3 seconds for simulated live chat
  useEffect(() => {
    if (conversation) {
      const interval = setInterval(async () => {
        try {
          const response = await sharedService.getConversationDetails(conversation.id);
          setMessages(response.data.messages || []);
        } catch (err) {
          console.error("Error polling chat", err);
        }
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [conversation]);

  const initializeChat = async () => {
    setLoading(true);
    try {
      // For starting a chat, if current user is PATIENT, opponentId is the DONOR.
      // If current user is DONOR, opponentId is the PATIENT (the endpoint handles it).
      const response = await sharedService.startChat(requestId, opponentId);
      setConversation(response.data);
      setMessages(response.data.messages || []);
    } catch (err) {
      console.error("Failed to start conversation", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversation) return;

    setSending(true);
    try {
      const response = await sharedService.sendMessage({
        conversationId: conversation.id,
        content: newMessage.trim()
      });
      setMessages((prev) => [...prev, response.data]);
      setNewMessage("");
    } catch (err) {
      console.error("Could not send message", err);
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white max-w-lg w-full h-[550px] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up border border-slate-100">
        
        {/* Chat Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
          <div className="flex flex-col">
            <span className="font-extrabold text-sm tracking-wide">Live Website Chat</span>
            <span className="text-[10px] text-slate-400 font-bold mt-0.5">Chatting with {opponentName}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages Feed */}
        <div className="flex-1 p-6 overflow-y-auto bg-slate-50 space-y-4">
          {loading ? (
            <div className="h-full flex items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-red-500" />
              <span className="text-xs font-bold">Connecting chat lines...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 gap-1.5">
              <div className="text-2xl font-bold">👋 Say Hello!</div>
              <p className="text-[10px] text-slate-400 font-semibold max-w-[200px]">Send a message to start coordinating location or arrival details.</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.sender_id === user.id;
              return (
                <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                  <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm text-xs font-semibold leading-relaxed ${
                    isMine 
                      ? 'bg-red-500 text-white rounded-tr-none' 
                      : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                  }`}>
                    <p>{msg.content}</p>
                    <span className={`text-[8px] font-bold block mt-1 text-right ${isMine ? 'text-white/80' : 'text-slate-450'}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Send Area */}
        <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-100 flex items-center gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message here..."
            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 font-semibold text-xs transition-all placeholder-slate-400 bg-slate-50/50"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim() || loading}
            className="btn-primary p-3 rounded-xl shadow-none hover:shadow-none bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:scale-100 flex items-center justify-center cursor-pointer"
          >
            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </form>

      </div>
    </div>
  );
}
