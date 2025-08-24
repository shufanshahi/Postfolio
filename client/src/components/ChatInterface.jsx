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
  loading = false
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

    // This assumes the conversation has otherUserEmail or similar field
    // You might need to adjust based on your actual data structure
    return {
      name: conversation.otherUserName || 'User',
      email: conversation.otherUserEmail || 'user@example.com',
      profilePicture: conversation.otherUserProfilePicture
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
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="p-4 border-b bg-card">
        <div className="flex items-center space-x-3">
          <Avatar>
            <AvatarImage src={otherUser?.profilePicture} />
            <AvatarFallback>
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
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {conversation.messages?.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.senderId === conversation.otherUserId ? 'justify-start' : 'justify-end'}`}
            >
              <div className={`max-w-xs lg:max-w-md ${msg.senderId === conversation.otherUserId ? 'order-1' : 'order-2'}`}>
                {msg.senderId === conversation.otherUserId && (
                  <Avatar className="w-6 h-6 mb-1">
                    <AvatarImage src={msg.senderAvatar} />
                    <AvatarFallback className="text-xs">
                      {msg.senderName?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}

                <div className={`rounded-lg p-3 ${msg.senderId === conversation.otherUserId
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

                  <div className={`text-xs mt-2 ${msg.senderId === conversation.otherUserId
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
          ))}
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="p-4 border-t bg-card">
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
