import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { selectUser } from '../Features/Backend/UserSlice';;
import { API_BASE_URL } from '../config';
import { toast } from './Toast';
import { handleImageError } from '../constants/images';
import './ChatWidget.css';

const ChatWidget = () => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [showLoginAlert, setShowLoginAlert] = useState(false);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const pollIntervalRef = useRef(null);

    const user = useSelector(selectUser);
    const API_BASE = `${API_BASE_URL}/api`;

    // Check if user is seller (moved after hooks to avoid Rules of Hooks violation)
    const loginType = typeof window !== "undefined" ? localStorage.getItem("loginType") : null;
    const isSeller = loginType === 'seller';

    // Generate user data for chat
    const getUserData = () => {
        if (user && user.data && user.data._id) {
            const userData = {
                userId: user.data._id,
                name: user.data.name || 'Unknown User',
                email: user.data.email || '',
                isLoggedIn: true,
                type: 'user'
            };
            return userData;
        } else {
            // Guest user
            const guestId = localStorage.getItem('guestId') || `guest_${Date.now()}`;
            localStorage.setItem('guestId', guestId);
            const guestData = {
                userId: guestId,
                name: 'Guest User',
                email: '',
                isLoggedIn: false,
                type: 'guest'
            };
            return guestData;
        }
    };

    useEffect(() => {
        if (isOpen) {
            const userData = getUserData();
            loadChatHistory(userData.userId);

            // Start polling for new messages
            pollIntervalRef.current = setInterval(() => {
                loadChatHistory(userData.userId, true); // Silent update
            }, 3000); // Poll every 3 seconds
        } else {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
            }
        }

        return () => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
            }
        };
    }, [isOpen, user]);

    const loadChatHistory = async (userId, silent = false) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/chat/history/${userId}`);
            if (response.data.success) {
                const newMessages = response.data.data.messages;

                // Debug: Check for image messages
                const imageMessages = newMessages.filter(msg => msg.messageType === 'image');
                if (imageMessages.length > 0) {
                }

                setMessages(prev => {
                    // Only update if there are new messages
                    if (newMessages.length !== prev.length) {
                        if (!silent) {
                            setTimeout(() => {
                                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                            }, 100);
                        }
                        return newMessages;
                    }
                    return prev;
                });
            }
        } catch (error) {
            console.error('Error loading chat history:', error);
        }
    };

    const sendMessage = async () => {
        if (!inputMessage.trim()) return;

        setIsLoading(true);

        const userData = getUserData();

        const messageData = {
            message: inputMessage.trim(),
            sender: {
                id: userData.userId,
                name: userData.name,
                email: userData.email,
                type: userData.type,
                isLoggedIn: userData.isLoggedIn
            }
        };

        try {
            // Send message via HTTP POST to backend API
            const response = await axios.post(`${API_BASE_URL}/chat/message`, messageData);

            if (response.data.success) {
                setInputMessage('');
                // Immediately load updated chat history
                loadChatHistory(userData.userId);
            } else {
                toast.error('Failed to send message. Please try again.');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            toast.error('Failed to send message. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.warning('Please select an image file');
            return;
        }

        // Validate file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
            toast.warning('Image size should be less than 5MB');
            return;
        }

        setSelectedImage(file);
    };

    const sendImage = async () => {
        if (!selectedImage) return;

        setIsUploading(true);

        try {
            // Upload image to server first
            const formData = new FormData();
            formData.append('image', selectedImage);

            const uploadResponse = await axios.post(`${API_BASE_URL}/chat/image`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (uploadResponse.data.success) {
                const userData = getUserData();

                // Send image message via HTTP POST
                const imageMessageData = {
                    message: 'Image',
                    messageType: 'image',
                    sender: {
                        id: userData.userId,
                        name: userData.name,
                        email: userData.email,
                        type: userData.type,
                        isLoggedIn: userData.isLoggedIn
                    },
                    image: uploadResponse.data.data
                };


                await axios.post(`${API_BASE_URL}/chat/message`, imageMessageData);

                setSelectedImage(null);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }

                // Reload chat history
                loadChatHistory(userData.userId);
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            toast.error('Failed to upload image. Please try again.');
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

    const handleChatToggle = () => {
        const userData = getUserData();
        if (!userData.isLoggedIn) {
            setShowLoginAlert(true);
            // Auto-dismiss toast after 4 seconds
            setTimeout(() => {
                setShowLoginAlert(false);
            }, 4000);
            return;
        }
        setIsOpen(!isOpen);
    };

    const closeLoginAlert = () => {
        setShowLoginAlert(false);
    };

    // Hide chat widget for sellers (render nothing after hooks are called)
    if (isSeller) {
        return null;
    }

    return (
        <>
            {/* Chat Toggle Button */}
            <div className="chat-widget-toggle" onClick={handleChatToggle}>
                <div className="chat-icon">
                    💬
                </div>
                <div className="chat-label">Admin</div>
                {!isOpen && messages.length > 0 && (
                    <div className="chat-notification">
                        {messages.filter(m => m.status !== 'read' && m.sender.type !== 'user').length}
                    </div>
                )}
            </div>

            {/* Chat Window */}
            {isOpen && (
                <div className="chat-widget">
                    {/* Header */}
                    <div className="chat-header">
                        <div className="chat-title">
                            <h4>Chat with Admin</h4>
                        </div>
                        <button className="chat-close" onClick={() => setIsOpen(false)}>
                            ✕
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="chat-messages">
                        {messages.length === 0 && (
                            <div className="welcome-message">
                                👋 Hi! How can we help you today?
                            </div>
                        )}

                        {messages.map((msg, index) => (
                            <div
                                key={msg._id || index}
                                className={`message ${msg.sender.type === 'user' || msg.sender.type === 'guest' ? 'user' : 'admin'}`}
                            >
                                <div className="message-content">
                                    {msg.messageType === 'image' ? (
                                        <div className="image-message">
                                            <img
                                                src={msg.image.url || msg.image.imageUrl}
                                                alt={msg.message}
                                                className="chat-image"
                                                onClick={() => window.open(msg.image.url || msg.image.imageUrl, '_blank')}
                                                onError={handleImageError}
                                                onLoad={() => {}}
                                            />
                                            {msg.message && <div className="image-caption">{msg.message}</div>}
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

                        {/* Typing indicator removed for HTTP polling mode */}

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

                    {/* Input Area */}
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
                            placeholder="Type your message..."
                            disabled={selectedImage !== null || isUploading}
                        />
                        <button
                            onClick={selectedImage ? sendImage : sendMessage}
                            disabled={(!inputMessage.trim() && !selectedImage) || isUploading}
                        >
                            {isUploading ? '...' : 'Send'}
                        </button>
                    </div>
                </div>
            )}

            {/* Toast Login Notification */}
            {showLoginAlert && (
                <div className="login-toast">
                    <div className="login-toast-icon">🔒</div>
                    <div className="login-toast-body">
                        <div className="login-toast-title">Login Required</div>
                        <div className="login-toast-message">Please login to access the chat</div>
                        <button
                            className="login-toast-btn"
                            onClick={() => { closeLoginAlert(); navigate('/login'); }}
                        >
                            Login Now →
                        </button>
                    </div>
                    <button className="login-toast-close" onClick={closeLoginAlert}>✕</button>
                    <div className="login-toast-progress"></div>
                </div>
            )}
        </>
    );
};

export default ChatWidget;
