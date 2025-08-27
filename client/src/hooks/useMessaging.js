import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

const API_BASE_URL = 'http://localhost:8080';

export const useMessaging = (currentUserId) => {
  const { getToken } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const token = getToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  };

  // Fetch all conversations for the current user
  const fetchConversations = useCallback(async () => {
    if (!currentUserId) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/api/messages/conversations`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setConversations(data);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, [currentUserId, getToken]);

  // Fetch messages for a specific conversation
  const fetchConversationMessages = useCallback(async (conversationId) => {
    if (!conversationId) return;
    
    try {
      setError(null);
      const response = await fetch(`${API_BASE_URL}/api/messages/conversations/${conversationId}/messages`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Error fetching conversation messages:', err);
      setError('Failed to load conversation messages');
      return [];
    }
  }, [getToken]);

  // Select a conversation and load its messages
  const selectConversation = useCallback(async (conversation) => {
    try {
      const messages = await fetchConversationMessages(conversation.id);
      const conversationWithMessages = {
        ...conversation,
        messages: messages
      };
      setSelectedConversation(conversationWithMessages);
    } catch (err) {
      console.error('Error selecting conversation:', err);
    }
  }, [fetchConversationMessages]);

  // Send a message
  const sendMessage = useCallback(async (messageData) => {
    try {
      setError(null);
      const response = await fetch(`${API_BASE_URL}/api/messages/send`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(messageData)
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Update the selected conversation with the new message
      if (selectedConversation) {
        const updatedConversation = {
          ...selectedConversation,
          messages: [...selectedConversation.messages, data],
          lastMessage: messageData.content || '📷 Image',
          lastMessageType: messageData.type,
          lastMessageAt: new Date().toISOString(),
          unreadCount: 0
        };
        setSelectedConversation(updatedConversation);
        
        // Update conversations list
        setConversations(prev => 
          prev.map(conv => 
            conv.id === selectedConversation.id 
              ? { 
                  ...conv, 
                  lastMessage: messageData.content || '📷 Image', 
                  lastMessageType: messageData.type, 
                  lastMessageAt: new Date().toISOString() 
                }
              : conv
          )
        );
      }
      
      return data;
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
      throw err;
    }
  }, [selectedConversation, getToken]);

  // Create a new conversation
  const createConversation = useCallback(async (otherUserId) => {
    try {
      setError(null);
      const response = await fetch(`${API_BASE_URL}/api/messages/conversations/create?otherUserId=${otherUserId}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Add the new conversation to the list
      setConversations(prev => [data, ...prev]);
      
      // Select the new conversation
      await selectConversation(data);
      
      return data;
    } catch (err) {
      console.error('Error creating conversation:', err);
      setError('Failed to create conversation');
      throw err;
    }
  }, [selectConversation, getToken]);

  // Mark conversation as read
  const markConversationAsRead = useCallback(async (conversationId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/messages/conversations/${conversationId}/read`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Update unread count in conversations list
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, unreadCount: 0 }
            : conv
        )
      );
      
      // Update selected conversation if it's the same one
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(prev => ({ ...prev, unreadCount: 0 }));
      }
    } catch (err) {
      console.error('Error marking conversation as read:', err);
    }
  }, [selectedConversation, getToken]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Refresh conversations
  const refreshConversations = useCallback(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return {
    conversations,
    selectedConversation,
    loading,
    error,
    selectConversation,
    sendMessage,
    createConversation,
    markConversationAsRead,
    clearError,
    refreshConversations,
    setSelectedConversation
  };
}; 