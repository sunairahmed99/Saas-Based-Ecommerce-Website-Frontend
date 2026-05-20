import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_BASE_URL as BASE_URL } from '../config';
import './SellerChat.css';

const SellerChat = () => {
    const queryClient = useQueryClient();
    const token = localStorage.getItem('token');
    
    const [inputMessage, setInputMessage] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);

    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const prevMessagesLengthRef = useRef(0);

    const CHAT_API_URL = `${BASE_URL}/api`;

    const { data: messages = [], isLoading: loadingMessages, error: queryError } = useQuery({
        queryKey: ['seller-chat-messages'],
        queryFn: async () => {
            if (!token) throw new Error('Please login to access chat');
            const res = await axios.get(`${CHAT_API_URL}/chat/seller/messages`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                return res.data.data || [];
            }
            throw new Error('Failed to load messages');
        },
        enabled: !!token,
        refetchInterval: 3000, // Poll every 3s
        staleTime: 5 * 60 * 1000,
    });

    const error = queryError?.message || queryError?.response?.data?.message;
    const isLoading = loadingMessages;

    useEffect(() => {
        if (messages.length > prevMessagesLengthRef.current) {
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
        prevMessagesLengthRef.current = messages.length;
    }, [messages]);

    const sendMessageMutation = useMutation({
        mutationFn: async (payload) => {
            const res = await axios.post(`${CHAT_API_URL}/chat/message`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.data.success) throw new Error(res.data.message || 'Failed to send message');
            return res.data;
        },
        onSuccess: () => {
            setInputMessage('');
            queryClient.invalidateQueries({ queryKey: ['seller-chat-messages'] });
        },
        onError: (err) => {
            alert(`Failed to send message: ${err?.response?.data?.message || err.message || 'Please try again.'}`);
        }
    });

    const sendMessage = async () => {
        if (!inputMessage.trim() || sendMessageMutation.isPending) return;

        sendMessageMutation.mutate({
            message: inputMessage.trim(),
            messageType: 'text',
            receiver: {
                id: 'admin',
                name: 'Admin',
                type: 'admin'
            }
        });
    };

    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert('Image size should be less than 5MB');
            return;
        }

        setSelectedImage(file);
    };

    const sendImageMutation = useMutation({
        mutationFn: async (formData) => {
            const uploadResponse = await axios.post(`${CHAT_API_URL}/chat/image`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                }
            });

            if (!uploadResponse.data.success) throw new Error("Upload failed");

            const response = await axios.post(`${CHAT_API_URL}/chat/message`, {
                message: 'Image',
                messageType: 'image',
                receiver: {
                    id: 'admin',
                    name: 'Admin',
                    type: 'admin'
                },
                image: uploadResponse.data.data
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        },
        onSuccess: () => {
            setSelectedImage(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            queryClient.invalidateQueries({ queryKey: ['seller-chat-messages'] });
        },
        onError: (err) => {
            alert('Failed to upload image. Please try again.');
        }
    });

    const isUploading = sendImageMutation.isPending;

    const sendImage = async () => {
        if (!selectedImage) return;

        const formData = new FormData();
        formData.append('image', selectedImage);
        sendImageMutation.mutate(formData);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (selectedImage) {
                sendImage();
            } else {
                sendMessage();
            }
        }
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="seller-chat-container">
            {/* Header */}
            <div className="seller-chat-header">
                <h2>💬 Chat with Admin</h2>
                <div className="connection-status">
                    🟢 Connected
                </div>
            </div>

            <div className="seller-chat-main">
                {/* Error Message */}
                {error && (
                    <div className="error-message">
                        <div className="error-content">
                            <p>{error}</p>
                            <button onClick={() => queryClient.invalidateQueries({ queryKey: ['seller-chat-messages'] })} className="retry-button">
                                Retry
                            </button>
                        </div>
                    </div>
                )}

                {/* Messages */}
                <div className="messages-container">
                    {messages.map((msg, index) => (
                        <div
                            key={msg._id || index}
                            className={`message ${msg.sender.type === 'seller' ? 'seller' : 'admin'}`}
                        >
                            <div className="message-content">
                                {msg.messageType === 'image' ? (
                                    <div className="image-message">
                                        <img
                                            src={msg.image.url}
                                            alt={msg.message}
                                            className="chat-image"
                                            onClick={() => window.open(msg.image.url, '_blank')}
                                        />
                                        {msg.message && msg.message !== 'Image' && (
                                            <div className="image-caption">{msg.message}</div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-message">{msg.message}</div>
                                )}
                                <div className="message-time">
                                    {formatTime(msg.createdAt)}
                                </div>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Image Preview */}
                {selectedImage && (
                    <div className="image-preview">
                        <div className="preview-content">
                            <img
                                src={URL.createObjectURL(selectedImage)}
                                alt="Preview"
                                className="preview-image"
                            />
                            <div className="preview-actions">
                                <button onClick={sendImage} disabled={isUploading}>
                                    {isUploading ? 'Uploading...' : 'Send Image'}
                                </button>
                                <button onClick={() => {
                                    setSelectedImage(null);
                                    if (fileInputRef.current) fileInputRef.current.value = '';
                                }}>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Input */}
                <div className="chat-input">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        accept="image/*"
                        style={{ display: 'none' }}
                    />
                    <button
                        className="image-button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={selectedImage !== null}
                    >
                        📎
                    </button>
                    <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type your message to admin..."
                        disabled={selectedImage !== null || isUploading}
                    />
                    <button
                        onClick={selectedImage ? sendImage : sendMessage}
                        disabled={(!inputMessage.trim() && !selectedImage) || sendMessageMutation.isPending || sendImageMutation.isPending}
                    >
                        {sendMessageMutation.isPending || sendImageMutation.isPending ? '...' : '➤'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SellerChat;
