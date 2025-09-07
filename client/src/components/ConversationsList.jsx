import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { MessageCircle, UserPlus } from 'lucide-react';

const ConversationsList = ({
  conversations,
  onSelectConversation,
  selectedConversationId,
  onStartNewChat,
  showNewChatButton = true
}) => {
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const truncateMessage = (message, maxLength = 30) => {
    if (!message) return '';
    return message.length > maxLength ? message.substring(0, maxLength) + '...' : message;
  };

  const getMessagePreview = (conversation) => {
    if (conversation.lastMessageType === 'IMAGE') {
      return '📷 Image';
    } else if (conversation.lastMessageType === 'EMOJI') {
      return conversation.lastMessage;
    } else {
      return truncateMessage(conversation.lastMessage);
    }
  };

  if (conversations.length === 0) {
    return (
      <Card className="w-full h-[600px] flex flex-col items-center justify-center">
        <CardContent className="text-center space-y-4">
          <MessageCircle className="w-12 h-12 text-muted-foreground" />
          <div>
            <h3 className="text-lg font-semibold">No conversations yet</h3>
            <p className="text-muted-foreground">
              Start chatting with your connections to see conversations here
            </p>
          </div>
          {showNewChatButton && (
            <Button onClick={onStartNewChat} className="mt-4">
              <UserPlus className="w-4 h-4 mr-2" />
              Start New Chat
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full h-[600px] flex flex-col">
      {showNewChatButton && (
        <div className="p-4 border-b">
          <Button onClick={onStartNewChat} className="w-full">
            <UserPlus className="w-4 h-4 mr-2" />
            New Chat
          </Button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {conversations.map((conversation) => (
          <div
            key={conversation.id}
            className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${selectedConversationId === conversation.id ? 'bg-muted' : ''
              }`}
            onClick={() => onSelectConversation(conversation)}
          >
            <div className="flex items-center space-x-3">
              <Avatar className="w-12 h-12">
                <AvatarImage src={conversation.otherUserAvatar ? `data:image/jpeg;base64,${conversation.otherUserAvatar}` : undefined} />
                <AvatarFallback className="bg-gradient-to-br from-teal-500 via-indigo-500 to-amber-500 text-white">
                  {conversation.otherUserName?.charAt(0)?.toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold truncate">
                    {conversation.otherUserName}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {formatTime(conversation.lastMessageAt)}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-1">
                  <p className="text-sm text-muted-foreground truncate">
                    {getMessagePreview(conversation)}
                  </p>

                  {conversation.unreadCount > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {conversation.unreadCount}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConversationsList;
