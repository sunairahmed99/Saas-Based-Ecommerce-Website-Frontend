import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_BASE_URL as BASE_URL } from '../config';
import './SellerChat.css';

const SellerChat = () => {
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState(null);

    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const pollIntervalRef = useRef(null);

    const CHAT_API_URL = `${BASE_URL}/api`;

    useEffect(() => {
        loadMessages();

        // Start polling for new messages every 3 seconds
        pollIntervalRef.current = setInterval(() => {
            loadMessages(true); // Silent update
        }, 3000);

        return () => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
            }
        };
    }, []);

    const loadMessages = async (silent = false) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Please login to access chat');
                return;
            }

            const response = await axios.get(`${CHAT_API_URL}/chat/seller/messages`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setMessages(response.data.data || []);
                setError(null);
                if (!silent) {
                    setTimeout(() => {
                        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                }
            } else {
                setError('Failed to load messages');
            }
        } catch (error) {
            console.error('Error loading messages:', error);
            const errorMessage = error.response?.data?.message || 'Failed to load messages. Please try again.';
            setError(errorMessage);
        }
    };

    const sendMessage = async () => {
        if (!inputMessage.trim() || isLoading) return;

        setIsLoading(true);

        try {
            const response = await axios.post(`${CHAT_API_URL}/chat/message`, {
                message: inputMessage.trim(),
                messageType: 'text',
                receiver: {
                    id: 'admin',
                    name: 'Admin',
                    type: 'admin'
                }
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            if (response.data.success) {
                setInputMessage('');
                loadMessages();
            } else {
                console.error('API returned error:', response.data);
                alert(`Failed to send message: ${response.data.message || 'Please try again.'}`);
            }
        } catch (error) {
            console.error('Error sending message:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Network error';
            alert(`Failed to send message: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
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

    const sendImage = async () => {
        if (!selectedImage) return;

        setIsUploading(true);

        try {
            const formData = new FormData();
            formData.append('image', selectedImage);

            const uploadResponse = await axios.post(`${CHAT_API_URL}/chat/image`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (uploadResponse.data.success) {
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
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });

                setSelectedImage(null);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
                loadMessages();
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Failed to upload image. Please try again.');
        } finally {
            setIsUploading(false);
        }
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
                            <button onClick={() => loadMessages()} className="retry-button">
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
                        disabled={(!inputMessage.trim() && !selectedImage) || isLoading || isUploading}
                    >
                        {isLoading || isUploading ? '...' : '➤'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SellerChat;
