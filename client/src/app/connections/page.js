'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Users, UserPlus, Clock, Search, MessageCircle, Send, Image as ImageIcon, Download, Plus, MoreHorizontal } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import PendingRequests from '@/components/PendingRequests';
import ConnectionsList from '@/components/ConnectionsList';
import UserSearch from '@/components/UserSearch';
import Navbar from '@/components/Navbar';
import ChatInterface from '@/components/ChatInterface';
import ConversationsList from '@/components/ConversationsList';
import NewChatModal from '@/components/NewChatModal';
import { useMessagePolling } from '@/hooks/useMessagePolling';

const API_BASE_URL = 'http://localhost:8080';

export default function ConnectionsPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('connections');

    // Check for tab query parameter on mount
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const tabParam = urlParams.get('tab');
        if (tabParam && ['connections', 'pending', 'sent', 'search', 'messages'].includes(tabParam)) {
            setActiveTab(tabParam);
        }
    }, []);

    // Messages related state
    const [user, setUser] = useState(null);
    const [connections, setConnections] = useState([]);
    const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messagingLoading, setMessagingLoading] = useState(false);
    const [pollingTrigger, setPollingTrigger] = useState(0);
    const [previousMessagesCount, setPreviousMessagesCount] = useState({});

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
                    const previousConversations = conversations;
                    await fetchConversations(token);

                    // Check for new messages in conversations
                    if (previousConversations.length > 0) {
                        conversations.forEach(conv => {
                            const prevConv = previousConversations.find(p => p.id === conv.id);
                            if (prevConv && conv.lastMessageAt !== prevConv.lastMessageAt) {
                                // New message detected - notifications are now handled by the backend
                                // when messages are sent, so we don't need to show toast notifications here
                                console.log('New message detected in conversation:', conv.id);
                            }
                        });
                    }
                }
            } catch (error) {
                console.error('Error polling conversations:', error);
            }
        };

        const interval = setInterval(pollConversations, 3000);
        return () => clearInterval(interval);
    }, [user?.email, conversations, selectedConversation?.id, activeTab]);

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

                    // Check for new messages in the selected conversation
                    const previousMessages = selectedConversation.messages || [];
                    const newMessages = messages.filter(msg =>
                        !previousMessages.some(prevMsg => prevMsg.id === msg.id) &&
                        msg.senderId !== user.id
                    );

                    // Log new messages (notifications are handled by backend)
                    if (newMessages.length > 0) {
                        console.log('New messages in selected conversation:', newMessages.length);
                    }

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
    }, [selectedConversation?.id, user?.email, selectedConversation?.messages, activeTab]);

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
            <>
                <Navbar />
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <p>Loading...</p>
                    </div>
                </div>
            </>
        );
    }

    if (error) {
        return (
            <>
                <Navbar />
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <p className="text-red-500 mb-4">Error: {error}</p>
                        <Button onClick={() => window.location.reload()}>Retry</Button>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">

                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push('/dashboard')}
                                className="gap-2 bg-white border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to Dashboard
                            </Button>
                            <h1 className="text-3xl font-bold text-gray-900">
                                Connections
                            </h1>
                        </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1 border border-gray-200">
                        <Button
                            variant={activeTab === 'connections' ? 'default' : 'ghost'}
                            onClick={() => setActiveTab('connections')}
                            className={`flex-1 gap-2 ${activeTab === 'connections' ? 'bg-gradient-to-r from-sky-300 to-sky-400 text-white' : 'text-gray-700 hover:bg-white'}`}
                        >
                            <Users className="h-4 w-4" />
                            My Connections
                        </Button>
                        <Button
                            variant={activeTab === 'pending' ? 'default' : 'ghost'}
                            onClick={() => setActiveTab('pending')}
                            className={`flex-1 gap-2 ${activeTab === 'pending' ? 'bg-gradient-to-r from-sky-300 to-sky-400 text-white' : 'text-gray-700 hover:bg-white'}`}
                        >
                            <Clock className="h-4 w-4" />
                            Pending
                        </Button>
                        <Button
                            variant={activeTab === 'sent' ? 'default' : 'ghost'}
                            onClick={() => setActiveTab('sent')}
                            className={`flex-1 gap-2 ${activeTab === 'sent' ? 'bg-gradient-to-r from-sky-300 to-sky-400 text-white' : 'text-gray-700 hover:bg-white'}`}
                        >
                            <UserPlus className="h-4 w-4" />
                            Sent
                        </Button>
                        <Button
                            variant={activeTab === 'search' ? 'default' : 'ghost'}
                            onClick={() => setActiveTab('search')}
                            className={`flex-1 gap-2 ${activeTab === 'search' ? 'bg-gradient-to-r from-sky-300 to-sky-400 text-white' : 'text-gray-700 hover:bg-white'}`}
                        >
                            <Search className="h-4 w-4" />
                            Search
                        </Button>
                        <Button
                            variant={activeTab === 'messages' ? 'default' : 'ghost'}
                            onClick={() => setActiveTab('messages')}
                            className={`flex-1 gap-2 ${activeTab === 'messages' ? 'bg-gradient-to-r from-sky-300 to-sky-400 text-white' : 'text-gray-700 hover:bg-white'}`}
                        >
                            <MessageCircle className="h-4 w-4" />
                            Messages
                        </Button>
                    </div>

                    {/* Content */}
                    <div className="space-y-6">
                        {activeTab === 'connections' && (
                            <Card className="bg-white border-gray-200">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-gray-900">
                                        <Users className="h-5 w-5 text-sky-500" />
                                        My Connections
                                    </CardTitle>
                                    <CardDescription className="text-gray-600">
                                        People you're connected with
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ConnectionsList />
                                </CardContent>
                            </Card>
                        )}

                        {activeTab === 'pending' && (
                            <Card className="bg-white border-gray-200">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-gray-900">
                                        <Clock className="h-5 w-5 text-purple-500" />
                                        Pending Requests
                                    </CardTitle>
                                    <CardDescription className="text-gray-600">
                                        Incoming connection requests
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <PendingRequests />
                                </CardContent>
                            </Card>
                        )}

                        {activeTab === 'sent' && (
                            <Card className="bg-white border-gray-200">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-gray-900">
                                        <UserPlus className="h-5 w-5 text-amber-500" />
                                        Sent Requests
                                    </CardTitle>
                                    <CardDescription className="text-gray-600">
                                        Your outgoing connection requests
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <SentRequests />
                                </CardContent>
                            </Card>
                        )}

                        {activeTab === 'search' && (
                            <Card className="bg-white border-gray-200">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-gray-900">
                                        <Search className="h-5 w-5 text-green-500" />
                                        Search People
                                    </CardTitle>
                                    <CardDescription className="text-gray-600">
                                        Find and connect with others
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <UserSearch />
                                </CardContent>
                            </Card>
                        )}

                        {activeTab === 'messages' && (
                            <Card className="bg-white border-gray-200">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-gray-900">
                                        <MessageCircle className="h-5 w-5 text-blue-500" />
                                        Messages
                                    </CardTitle>
                                    <CardDescription className="text-gray-600">
                                        Chat with your connections
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="h-[600px] flex bg-white overflow-hidden">
                                        {/* Left Sidebar - Conversations */}
                                        <div className="w-80 border-r bg-gray-50">
                                            <div className="p-4 border-b bg-white">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h3 className="text-lg font-semibold">Conversations</h3>
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

                                            <div className="h-[536px] overflow-y-auto">
                                                <ConversationsList
                                                    conversations={conversations}
                                                    selectedConversation={selectedConversation}
                                                    onSelectConversation={handleSelectConversation}
                                                />
                                            </div>
                                        </div>

                                        {/* Right Side - Chat Interface */}
                                        <div className="flex-1 flex flex-col">
                                            {selectedConversation ? (
                                                <div className="h-full flex flex-col">
                                                    <ChatInterface
                                                        conversation={selectedConversation}
                                                        onSendMessage={handleSendMessage}
                                                        loading={messagingLoading}
                                                    />
                                                </div>
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
                                    </div>

                                    {/* New Chat Modal */}
                                    <NewChatModal
                                        isOpen={isNewChatModalOpen}
                                        onClose={() => setIsNewChatModalOpen(false)}
                                        connections={connections}
                                        onStartChat={handleStartNewChat}
                                        currentUserId={user?.id}
                                    />
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

const SentRequests = () => {
    const [sentRequests, setSentRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Keep original data fetching logic
        const fetchSentRequests = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('http://localhost:8080/api/connections/pending/sent', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (!response.ok) throw new Error('Failed to fetch sent requests');
                const data = await response.json();
                setSentRequests(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchSentRequests();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-sky-500"></div>
                <span className="ml-2 text-gray-600">Loading...</span>
            </div>
        );
    }

    if (error) {
        return <div className="text-red-600 text-center py-4">Error: {error}</div>;
    }

    return (
        <>
            {sentRequests.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    <UserPlus className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No sent requests</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {sentRequests.map((request) => (
                        <div key={request.id} className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border border-gray-200 hover:border-sky-300 transition-colors">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                    <AvatarFallback className="bg-gradient-to-br from-sky-400 to-sky-500 text-white">
                                        {request.receiverName?.charAt(0)?.toUpperCase() || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium text-gray-900">{request.receiverName}</p>
                                    <p className="text-sm text-gray-600">{request.receiverEmail}</p>
                                    <p className="text-xs text-gray-500">
                                        Sent on {new Date(request.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <Badge className="bg-amber-100 text-amber-800 border-amber-300">
                                Pending
                            </Badge>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
};