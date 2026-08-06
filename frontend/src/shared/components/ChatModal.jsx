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
  const messagesContainerRef = useRef(null);

  useEffect(() => {
    if (isOpen && requestId && opponentId) {
      initializeChat();
    }
    return () => {
      setConversation(null);
      setMessages([]);
    };
  }, [isOpen, requestId, opponentId]);

  // Scroll to bottom on new messages without shifting layout
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Connect to WebSocket for real-time live chat
  useEffect(() => {
    if (conversation) {
      const token = localStorage.getItem('access_token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
      // Construct WebSocket URL by replacing http with ws
      const wsUrl = apiUrl.replace(/^http/, 'ws') + `/chat/ws/${conversation.id}?token=${token}`;
      
      const ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const newMsg = JSON.parse(event.data);
          setMessages((prev) => {
            // Prevent duplicate messages if we just sent it and already appended locally
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        } catch (err) {
          console.error("Error parsing websocket message", err);
        }
      };

      ws.onerror = (err) => {
        console.error("WebSocket error", err);
      };

      return () => {
        ws.close();
      };
    }
  }, [conversation]);

  // Fallback Polling (Auto Refresh every 1000ms)
  useEffect(() => {
    if (!conversation) return;
    const intervalId = setInterval(async () => {
      try {
        const response = await sharedService.getConversationDetails(conversation.id);
        if (response.data && response.data.messages) {
          setMessages(prev => {
            if (response.data.messages.length !== prev.length) {
              return response.data.messages;
            }
            return prev;
          });
        }
      } catch (err) {
        // Silent fail for polling
      }
    }, 1000);
    return () => clearInterval(intervalId);
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
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex drop-shadow-2xl">
      <div className="bg-white w-[350px] sm:w-[380px] h-[500px] sm:h-[550px] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        
        {/* Chat Header */}
        <div className="px-4 py-3 bg-red-600 text-white flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm border border-white/30">
              {opponentName?.charAt(0)?.toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-[14px] tracking-wide">{opponentName}</span>
              <span className="text-[10px] text-white/80 font-medium mt-0.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                Active Now
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages Feed */}
        <div 
          ref={messagesContainerRef}
          className="flex-1 p-5 overflow-y-auto overscroll-contain bg-slate-50 space-y-4"
        >
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
                  <div className={`max-w-[75%] px-4 py-2.5 text-[13px] font-medium leading-relaxed ${
                    isMine 
                      ? 'bg-red-500 text-white rounded-3xl rounded-br-sm' 
                      : 'bg-[#f0f2f5] text-slate-800 rounded-3xl rounded-bl-sm border border-slate-100'
                  }`}>
                    <p>{msg.content}</p>
                    <span className={`text-[9px] block mt-1 text-right font-bold ${isMine ? 'text-white/70' : 'text-slate-400'}`}>
                      {new Date(msg.created_at + (msg.created_at.endsWith('Z') ? '' : 'Z')).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input Send Area */}
        <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-100 flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2.5 rounded-full border border-slate-200 bg-slate-50 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 font-medium text-[13px] transition-all placeholder-slate-400"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim() || loading}
            className="p-2.5 rounded-full text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:scale-100 flex items-center justify-center cursor-pointer transition-colors shadow-sm"
          >
            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
          </button>
        </form>

      </div>
    </div>
  );
}
