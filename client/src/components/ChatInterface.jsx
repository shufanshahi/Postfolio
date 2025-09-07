import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Card, CardContent } from './ui/card';
import {
  Send,
  Image as ImageIcon,
  Download,
  Smile,
  Loader2
} from 'lucide-react';

const ChatInterface = ({
  conversation,
  onSendMessage,
  loading = false,
  currentUser = null
}) => {
  const [message, setMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef(null);
  const scrollRef = useRef(null);

  const commonEmojis = ['😊', '😂', '❤️', '👍', '🎉', '🔥', '😎', '🤔', '👏', '💯'];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation?.messages]);

  const handleSendMessage = () => {
    if ((!message.trim() && !selectedImage) || loading) return;

    const messageData = {
      type: selectedImage ? 'IMAGE' : 'TEXT',
      content: message.trim(),
      imageData: selectedImage,
      imageName: selectedImage ? fileInputRef.current?.files[0]?.name : null,
      imageType: selectedImage ? fileInputRef.current?.files[0]?.type : null
    };

    onSendMessage(messageData);

    // Clear form
    setMessage('');
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target.result);
        setImagePreview(URL.createObjectURL(file));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEmojiClick = (emoji) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleMessageChange = (e) => {
    setMessage(e.target.value);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getOtherUser = () => {
    if (!conversation) return null;

    return {
      name: conversation.otherUserName || 'User',
      email: conversation.otherUserEmail || '',
      profilePicture: conversation.otherUserAvatar
    };
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <p>Select a conversation to start chatting</p>
        </div>
      </div>
    );
  }

  const otherUser = getOtherUser();

  return (
    <div className="flex flex-col h-full max-h-[600px]">
      {/* Chat Header */}
      <div className="p-4 border-b bg-card flex-shrink-0">
        <div className="flex items-center space-x-3">
          <Avatar>
            <AvatarImage src={otherUser?.profilePicture ? `data:image/jpeg;base64,${otherUser.profilePicture}` : undefined} />
            <AvatarFallback className="bg-gradient-to-br from-teal-500 via-indigo-500 to-amber-500 text-white">
              {otherUser?.name?.charAt(0)?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold">{otherUser?.name}</h3>
            <p className="text-sm text-muted-foreground">{otherUser?.email}</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full p-4" ref={scrollRef}>
          <div className="space-y-4">
            {conversation.messages?.map((msg) => {
              const isOtherUser = msg.senderId === conversation.otherUserId;
              const isCurrentUser = !isOtherUser;

              return (
                <div
                  key={msg.id}
                  className={`flex ${isOtherUser ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`max-w-xs lg:max-w-md flex items-end space-x-2 ${isOtherUser ? 'flex-row' : 'flex-row-reverse space-x-reverse'}`}>
                    {/* Profile Picture */}
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      {isOtherUser ? (
                        <>
                          <AvatarImage src={conversation.otherUserAvatar ? `data:image/jpeg;base64,${conversation.otherUserAvatar}` : undefined} />
                          <AvatarFallback className="text-xs bg-gradient-to-br from-teal-500 via-indigo-500 to-amber-500 text-white">
                            {conversation.otherUserName?.charAt(0)?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </>
                      ) : (
                        <>
                          <AvatarImage src={currentUser?.pictureBase64 ? `data:image/jpeg;base64,${currentUser.pictureBase64}` : undefined} />
                          <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-white">
                            {currentUser?.name?.charAt(0)?.toUpperCase() || 'M'}
                          </AvatarFallback>
                        </>
                      )}
                    </Avatar>

                    {/* Message Bubble */}
                    <div className={`rounded-lg p-3 ${isOtherUser
                      ? 'bg-muted'
                      : 'bg-primary text-primary-foreground'
                      }`}>
                      {msg.type === 'IMAGE' && msg.imageData ? (
                        <div className="space-y-2">
                          <img
                            src={msg.imageData}
                            alt="Shared image"
                            className="max-w-full rounded"
                          />
                          {msg.content && (
                            <p className="text-sm">{msg.content}</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm">{msg.content}</p>
                      )}

                      <div className={`text-xs mt-2 ${isOtherUser
                        ? 'text-muted-foreground'
                        : 'text-primary-foreground/70'
                        }`}>
                        {formatTimestamp(msg.timestamp)}
                        {msg.isRead && (
                          <span className="ml-2">✓✓</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Message Input */}
      <div className="p-4 border-t bg-card flex-shrink-0">
        {/* Image Preview */}
        {imagePreview && (
          <div className="mb-3 p-3 border rounded-lg bg-muted/50">
            <div className="flex items-center justify-between">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-16 h-16 object-cover rounded"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedImage(null);
                  setImagePreview(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
              >
                Remove
              </Button>
            </div>
          </div>
        )}

        <div className="flex items-end space-x-2">
          {/* Image Upload */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            type="button"
          >
            <ImageIcon className="w-4 h-4" />
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />

          {/* Emoji Picker */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            type="button"
          >
            <Smile className="w-4 h-4" />
          </Button>

          {/* Message Input */}
          <div className="flex-1 relative">
            <Input
              value={message}
              onChange={handleMessageChange}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={loading}
              className="pr-20"
            />

            {/* Emoji Picker Dropdown */}
            {showEmojiPicker && (
              <div className="absolute bottom-full left-0 mb-2 p-2 bg-background border rounded-lg shadow-lg">
                <div className="grid grid-cols-5 gap-1">
                  {commonEmojis.map((emoji, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEmojiClick(emoji)}
                      className="w-8 h-8 p-0 text-lg hover:bg-muted"
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Send Button */}
          <Button
            onClick={handleSendMessage}
            disabled={(!message.trim() && !selectedImage) || loading}
            className="px-6"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
