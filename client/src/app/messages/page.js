'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  MessageCircle,
  Send,
  Image as ImageIcon,
  Download,
  Plus,
  Users,
  Search,
  MoreHorizontal
} from 'lucide-react';
import ChatInterface from '@/components/ChatInterface';
import ConversationsList from '@/components/ConversationsList';
import NewChatModal from '@/components/NewChatModal';
import { useMessagePolling } from '@/hooks/useMessagePolling';

const API_BASE_URL = 'http://localhost:8080';

const MessagesPage = () => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [connections, setConnections] = useState([]);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messagingLoading, setMessagingLoading] = useState(false);
  const [pollingTrigger, setPollingTrigger] = useState(0);

  // Polling hook for checking new messages
  const {
    isPolling,
    startPolling,
    stopPolling,
    checkForNewConversations,
    checkForNewMessages
  } = useMessagePolling(user?.email, 3000);

  useEffect(() => {
    async function initializePage() {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }

        const profileRes = await fetch(`${API_BASE_URL}/api/profile/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!profileRes.ok) {
          throw new Error('Failed to fetch profile');
        }

        const profile = await profileRes.json();
        setUser(profile);

        await fetchConversations(token);
        await fetchConnections(token);
      } catch (err) {
        console.error('Error initializing page:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    initializePage();
  }, [router]);

  // Start polling when user is available
  useEffect(() => {
    if (user?.email) {
      startPolling();
      return () => stopPolling();
    }
  }, [user?.email, startPolling, stopPolling]);

  // Poll for new conversations every 3 seconds
  useEffect(() => {
    if (!user?.email) return;

    const pollConversations = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          await fetchConversations(token);
        }
      } catch (error) {
        console.error('Error polling conversations:', error);
      }
    };

    const interval = setInterval(pollConversations, 3000);
    return () => clearInterval(interval);
  }, [user?.email]);

  // Poll for new messages in selected conversation every 2 seconds
  useEffect(() => {
    if (!selectedConversation?.id || !user?.email) return;

    const pollMessages = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch(
          `${API_BASE_URL}/api/messages/conversations/${selectedConversation.id}/messages`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.ok) {
          const messages = await response.json();
          setSelectedConversation(prev => ({
            ...prev,
            messages: messages
          }));
        }
      } catch (error) {
        console.error('Error polling messages:', error);
      }
    };

    const interval = setInterval(pollMessages, 2000);
    return () => clearInterval(interval);
  }, [selectedConversation?.id, user?.email]);

  const fetchConversations = async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/messages/conversations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      } else {
        console.error('Failed to fetch conversations');
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    }
  };

  const fetchConnections = async (token) => {
    try {
      console.log('Fetching connections with token:', token ? 'Token exists' : 'No token');
      const response = await fetch(`${API_BASE_URL}/api/connections/accepted`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Connections response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Connections data:', data);
        setConnections(data);
      } else {
        console.error('Failed to fetch connections, status:', response.status);
        const errorText = await response.text();
        console.error('Error response:', errorText);
      }
    } catch (err) {
      console.error('Error fetching connections:', err);
    }
  };

  const handleSelectConversation = async (conversation) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/messages/conversations/${conversation.id}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const messages = await response.json();
        const conversationWithMessages = {
          ...conversation,
          messages: messages
        };
        setSelectedConversation(conversationWithMessages);
      }
    } catch (err) {
      console.error('Error fetching conversation messages:', err);
    }
  };

  const handleSendMessage = async (messageData) => {
    try {
      setMessagingLoading(true);
      const token = localStorage.getItem('token');

      console.log('Sending message:', messageData);

      const response = await fetch(`${API_BASE_URL}/api/messages/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          conversationId: selectedConversation.id,
          type: messageData.type,
          content: messageData.content,
          imageData: messageData.imageData,
          imageName: messageData.imageName,
          imageType: messageData.imageType
        })
      });

      if (response.ok) {
        const newMessage = await response.json();
        console.log('Message sent successfully:', newMessage);

        // Update the selected conversation with the new message
        setSelectedConversation(prev => ({
          ...prev,
          messages: [...(prev.messages || []), newMessage]
        }));

        // Update conversations list
        setConversations(prev =>
          prev.map(conv =>
            conv.id === selectedConversation.id
              ? { ...conv, lastMessageAt: newMessage.timestamp }
              : conv
          )
        );
      } else {
        throw new Error('Failed to send message');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    } finally {
      setMessagingLoading(false);
    }
  };

  const handleStartNewChat = async (connection) => {
    try {
      const token = localStorage.getItem('token');

      // Get the other user's email from the connection
      const otherUser = connection.requesterId === user.id
        ? {
          id: connection.receiverId,
          name: connection.receiverName,
          email: connection.receiverEmail
        }
        : {
          id: connection.requesterId,
          name: connection.requesterName,
          email: connection.requesterEmail
        };

      console.log('Starting new chat with:', otherUser);

      const response = await fetch(`${API_BASE_URL}/api/messages/conversations/create?otherUserEmail=${otherUser.email}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const newConversation = await response.json();
        console.log('New conversation created:', newConversation);

        // Add the new conversation to the list
        setConversations(prev => [newConversation, ...prev]);

        // Select the new conversation
        await handleSelectConversation(newConversation);
      } else {
        throw new Error('Failed to create conversation');
      }
    } catch (err) {
      console.error('Error creating conversation:', err);
      setError('Failed to create conversation');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading messages...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500 mb-4">Error: {error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Left Sidebar - Conversations */}
      <div className="w-80 border-r bg-card">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold">Messages</h1>
            <Button
              size="sm"
              onClick={() => setIsNewChatModalOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Chat
            </Button>
          </div>

          {/* Polling Status Indicator */}
          <div className="flex items-center gap-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${isPolling ? 'bg-green-500' : 'bg-gray-500'}`}></div>
            <span className={isPolling ? 'text-green-600' : 'text-gray-600'}>
              {isPolling ? 'Auto-refreshing' : 'Paused'}
            </span>
          </div>
        </div>

        <ConversationsList
          conversations={conversations}
          selectedConversation={selectedConversation}
          onSelectConversation={handleSelectConversation}
        />
      </div>

      {/* Right Side - Chat Interface */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <ChatInterface
            conversation={selectedConversation}
            onSendMessage={handleSendMessage}
            loading={messagingLoading}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No conversation selected</h3>
              <p>Choose a conversation from the list or start a new chat</p>
            </div>
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      <NewChatModal
        isOpen={isNewChatModalOpen}
        onClose={() => setIsNewChatModalOpen(false)}
        connections={connections}
        onStartChat={handleStartNewChat}
        currentUserId={user?.id}
      />
    </div>
  );
};

export default MessagesPage;
