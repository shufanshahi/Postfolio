'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import withAuth from '@/components/withAuth';
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

// Design tokens for cohesive theming (mirrors dashboard/myfeed)
const gradientPanel = 'bg-gradient-to-br from-teal-50/70 via-white/50 to-indigo-50/70 dark:from-slate-800/60 dark:via-slate-800/50 dark:to-slate-800/60 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 shadow-sm';
const subtleCard = 'bg-gradient-to-br from-teal-50/65 via-white/55 to-indigo-50/60 dark:from-slate-800/70 dark:via-slate-800/60 dark:to-slate-800/70 backdrop-blur-md border border-teal-900/5 dark:border-slate-700/60 hover:border-teal-500/30 dark:hover:border-teal-400/30 transition-colors';

function ConnectionsPage() {
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

            console.log('Starting chat with:', otherUser);

            // First, check if a conversation already exists with this user
            const existingConversation = conversations.find(conv => {
                // Check if this conversation involves the other user by comparing emails
                return conv.otherUserEmail === otherUser.email;
            });

            if (existingConversation) {
                console.log('Found existing conversation:', existingConversation);
                // Select the existing conversation
                await handleSelectConversation(existingConversation);
                setIsNewChatModalOpen(false);
                return;
            }

            // If no existing conversation, create a new one
            console.log('Creating new conversation with:', otherUser.email);

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
                setIsNewChatModalOpen(false);
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
            <div className="min-h-screen relative overflow-hidden">
                <div className="pointer-events-none select-none absolute inset-0 -z-10">
                    <div className="absolute -top-24 -left-10 h-[36rem] w-[36rem] bg-gradient-to-br from-teal-200 via-teal-100 to-white dark:from-teal-600/30 dark:via-indigo-600/20 dark:to-transparent blur-3xl opacity-70" />
                    <div className="absolute top-1/3 -right-32 h-[34rem] w-[34rem] bg-gradient-to-tr from-indigo-200 via-white to-amber-100 dark:from-indigo-700/30 dark:via-transparent dark:to-teal-700/20 blur-3xl opacity-60" />
                </div>
                <div className="max-w-6xl mx-auto px-6 py-10">

                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-10">
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-teal-500 via-indigo-500 to-amber-400 flex items-center justify-center text-white shadow-sm ring-1 ring-white/40">
                                    <Users className="h-5 w-5" />
                                </div>
                                <h1 className="text-3xl font-semibold tracking-tight text-slate-800 dark:text-slate-100">Connections Hub</h1>
                            </div>
                            <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base flex items-center gap-2">
                                <span className="inline-flex h-2 w-2 rounded-full bg-teal-500 animate-pulse" /> Manage your network & conversations
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button variant="outline" size="sm" onClick={() => router.push('/dashboard')} className="rounded-full border-slate-300/60 bg-white/60 backdrop-blur hover:bg-white shadow-sm text-slate-700 text-xs md:text-sm">
                                <ArrowLeft className="h-4 w-4 mr-1" /> Dashboard
                            </Button>
                        </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex mb-10 rounded-2xl p-1 bg-gradient-to-r from-teal-50/70 via-white/70 to-indigo-50/70 dark:from-slate-800/60 dark:via-slate-800/50 dark:to-slate-800/60 backdrop-blur border border-teal-900/10 dark:border-slate-700/60 shadow-sm overflow-x-auto">
                        {[
                            { key: 'connections', label: 'Connections', icon: Users },
                            { key: 'pending', label: 'Pending', icon: Clock },
                            { key: 'sent', label: 'Sent', icon: UserPlus },
                            { key: 'search', label: 'Search', icon: Search },
                            { key: 'messages', label: 'Messages', icon: MessageCircle }
                        ].map(tab => {
                            const Icon = tab.icon;
                            const active = activeTab === tab.key;
                            return (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`flex-1 min-w-[140px] px-5 py-2 rounded-xl text-sm font-medium tracking-wide flex items-center justify-center gap-2 transition-all ring-1 ring-transparent ${active ? 'bg-white/70 dark:bg-slate-900/50 text-teal-700 dark:text-teal-300 shadow-sm ring-teal-500/30' : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-900/30'}`}
                                >
                                    <Icon className="h-4 w-4" /> {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Content */}
                    <div className="space-y-6">
                        {activeTab === 'connections' && (
                            <Card className={`rounded-2xl ${subtleCard}`}>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-100 text-base font-semibold">
                                        <Users className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                                        My Connections
                                    </CardTitle>
                                    <CardDescription className="text-slate-600 dark:text-slate-400">
                                        People you're connected with
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ConnectionsList />
                                </CardContent>
                            </Card>
                        )}

                        {activeTab === 'pending' && (
                            <Card className={`rounded-2xl ${subtleCard}`}>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-100 text-base font-semibold">
                                        <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                        Pending Requests
                                    </CardTitle>
                                    <CardDescription className="text-slate-600 dark:text-slate-400">
                                        Incoming connection requests
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <PendingRequests />
                                </CardContent>
                            </Card>
                        )}

                        {activeTab === 'sent' && (
                            <Card className={`rounded-2xl ${subtleCard}`}>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-100 text-base font-semibold">
                                        <UserPlus className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                                        Sent Requests
                                    </CardTitle>
                                    <CardDescription className="text-slate-600 dark:text-slate-400">
                                        Your outgoing connection requests
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <SentRequests />
                                </CardContent>
                            </Card>
                        )}

                        {activeTab === 'search' && (
                            <Card className={`rounded-2xl ${subtleCard}`}>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-100 text-base font-semibold">
                                        <Search className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                                        Search People
                                    </CardTitle>
                                    <CardDescription className="text-slate-600 dark:text-slate-400">
                                        Find and connect with others
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <UserSearch />
                                </CardContent>
                            </Card>
                        )}

                        {activeTab === 'messages' && (
                            <Card className={`rounded-2xl ${subtleCard}`}>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-100 text-base font-semibold">
                                        <MessageCircle className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                                        Messages
                                    </CardTitle>
                                    <CardDescription className="text-slate-600 dark:text-slate-400">
                                        Chat with your connections
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="h-[600px] flex bg-white/60 dark:bg-slate-900/40 backdrop-blur-sm overflow-hidden rounded-b-2xl border-t border-teal-900/5 dark:border-slate-700/50">
                                        {/* Left Sidebar - Conversations */}
                                        <div className="w-80 border-r border-teal-900/10 dark:border-slate-700/60 bg-white/50 dark:bg-slate-900/30 backdrop-blur">
                                            <div className="p-4 border-b border-teal-900/10 dark:border-slate-700/60">
                                                <div className="flex items-center justify-between mb-3">
                                                    <h3 className="text-sm font-semibold tracking-wide uppercase text-slate-600 dark:text-slate-400">Conversations</h3>
                                                    <Button size="sm" onClick={() => setIsNewChatModalOpen(true)} className="h-8 px-3 rounded-full bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium gap-1">
                                                        <Plus className="w-4 h-4" /> New
                                                    </Button>
                                                </div>
                                                <div className="flex items-center gap-2 text-[11px] font-medium tracking-wide uppercase">
                                                    <div className={`h-2 w-2 rounded-full ${isPolling ? 'bg-emerald-500' : 'bg-slate-400'} animate-pulse`} />
                                                    <span className={isPolling ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}>
                                                        {isPolling ? 'Live' : 'Paused'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="h-[536px] overflow-y-auto custom-scrollbar">
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
                                                        currentUser={user}
                                                    />
                                                </div>
                                            ) : (
                                                <div className="flex-1 flex items-center justify-center p-10">
                                                    <div className="text-center max-w-xs">
                                                        <MessageCircle className="w-14 h-14 mx-auto mb-4 text-teal-500/60" />
                                                        <h3 className="text-sm font-semibold tracking-wide uppercase text-slate-600 dark:text-slate-400 mb-2">No conversation selected</h3>
                                                        <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">Choose a conversation or start a new chat to begin messaging.</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
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
            </div>
        </>
    );
}

// Local component for listing sent connection requests with themed styling
function SentRequests() {
    const [sentRequests, setSentRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSentRequests = async () => {
            try {
                const token = localStorage.getItem('token');
                console.log('Fetching sent requests with token:', token?.slice(0, 15) + '...');
                const response = await fetch(`${API_BASE_URL}/api/connections/pending/sent`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                console.log('Sent requests response status:', response.status);

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Sent requests error:', errorText);
                    throw new Error(`Failed to fetch sent requests: ${response.status} ${errorText}`);
                }
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
            <div className="flex items-center justify-center py-8 text-slate-500 dark:text-slate-400 text-sm">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-teal-500"></div>
                <span className="ml-2">Loading...</span>
            </div>
        );
    }

    if (error) {
        return <div className="text-red-600 text-center py-4 text-sm">Error: {error}</div>;
    }

    if (sentRequests.length === 0) {
        return (
            <div className="text-center py-10 text-slate-500 dark:text-slate-400">
                <UserPlus className="h-10 w-10 mx-auto mb-3 text-teal-500/60" />
                <p className="text-sm font-medium">No sent requests</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {sentRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-4 rounded-xl bg-white/60 dark:bg-slate-900/40 border border-teal-900/10 dark:border-slate-700/60 hover:border-teal-500/40 transition-colors">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 ring-2 ring-white/60 dark:ring-slate-800/60 rounded-xl overflow-hidden">
                            <AvatarFallback className="bg-gradient-to-br from-teal-500 via-indigo-500 to-amber-500 text-white text-sm font-semibold">
                                {request.receiverName?.charAt(0)?.toUpperCase() || 'U'}
                            </AvatarFallback>
                        </Avatar>
                        <div className="space-y-0.5">
                            <p className="font-medium text-slate-800 dark:text-slate-100 text-sm">{request.receiverName}</p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">{request.receiverEmail}</p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide">Sent {new Date(request.createdAt).toLocaleDateString()}</p>
                        </div>
                    </div>
                    <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 rounded-full px-3 py-1 h-6 text-[11px] font-medium">Pending</Badge>
                </div>
            ))}
        </div>
    );
}

export default withAuth(ConnectionsPage);
