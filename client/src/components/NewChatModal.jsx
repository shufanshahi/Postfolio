import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Search, UserPlus, MessageCircle } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';

const NewChatModal = ({ 
  isOpen, 
  onClose, 
  connections, 
  onStartChat,
  currentUserId 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredConnections, setFilteredConnections] = useState([]);

  useEffect(() => {
    if (connections) {
      const filtered = connections.filter(connection => {
        // Determine which user is the other user (not the current user)
        const otherUser = connection.requesterId === currentUserId 
          ? {
              id: connection.receiverId,
              name: connection.receiverName,
              email: connection.receiverEmail,
              profilePicture: connection.receiverPictureBase64
            }
          : {
              id: connection.requesterId,
              name: connection.requesterName,
              email: connection.requesterEmail,
              profilePicture: connection.requesterPictureBase64
            };
        
        return otherUser.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
               otherUser.email.toLowerCase().includes(searchTerm.toLowerCase());
      });
      setFilteredConnections(filtered);
    }
  }, [connections, searchTerm, currentUserId]);

  const handleStartChat = (connection) => {
    onStartChat(connection);
    onClose();
  };

  const getOtherUser = (connection) => {
    return connection.requesterId === currentUserId 
      ? {
          id: connection.receiverId,
          name: connection.receiverName,
          email: connection.receiverEmail,
          profilePicture: connection.receiverPictureBase64
        }
      : {
          id: connection.requesterId,
          name: connection.requesterName,
          email: connection.requesterEmail,
          profilePicture: connection.requesterPictureBase64
        };
  };

  if (!connections) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MessageCircle className="w-5 h-5" />
            <span>Start New Chat</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search connections..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Connections List */}
          <ScrollArea className="max-h-[400px]">
            {filteredConnections.length === 0 ? (
              <div className="text-center py-8">
                <UserPlus className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm ? 'No connections found matching your search' : 'No connections available'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredConnections.map((connection) => {
                  const otherUser = getOtherUser(connection);
                  return (
                    <div
                      key={connection.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={otherUser.profilePicture} />
                          <AvatarFallback>
                            {otherUser.name?.charAt(0)?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div>
                          <h4 className="font-medium">{otherUser.name}</h4>
                          <p className="text-sm text-muted-foreground">{otherUser.email}</p>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => handleStartChat(connection)}
                        className="ml-4"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Chat
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewChatModal; 