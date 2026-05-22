import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { selectUser } from '../Features/Backend/UserSlice';
import axios from 'axios';
import { FaPaperPlane, FaUserShield, FaTimes, FaComments } from 'react-icons/fa';;
import { API_BASE_URL } from '../config';
import { getAuthToken } from '../utils/auth';
import { toast } from './Toast';
import './LiveChat.css';

const API_BASE = `${API_BASE_URL}`;

const LiveChat = () => {
    const user = useSelector(selectUser);
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [socket, setSocket] = useState(null);
    const [showLoginToast, setShowLoginToast] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    useEffect(() => {
        if (user) {
            const newSocket = io(API_BASE);
            setSocket(newSocket);

            const userId = user?.data?._id || user?._id;
            newSocket.emit('join_room', userId);

            // Fetch chat history
            fetchHistory(userId);

            newSocket.on('receive_message', (message) => {
                // Only add if it's from admin (because user messages are added optimistically)
                if (message.isAdmin) {
                    setMessages((prev) => [...prev, message]);
                }
            });

            return () => newSocket.close();
        }
    }, [user]);

    const fetchHistory = async (userId) => {
        try {
            const token = getAuthToken();
            const res = await axios.get(`${API_BASE}/api/chat/messages/${userId}`, {
                headers: { auth_token: token }
            });
            if (res.data.success) {
                setMessages(res.data.data);
            }
        } catch (error) {
            console.error('Error fetching chat history:', error);
        }
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !socket) return;

        const userId = user?.data?._id || user?._id;
        const messageData = {
            sender: userId,
            receiver: "admin_id_placeholder",
            message: newMessage,
            isAdmin: false,
            createdAt: new Date().toISOString()
        };

        // Add to state immediately for smooth UI
        setMessages((prev) => [...prev, messageData]);
        
        socket.emit('send_message', messageData);
        setNewMessage('');
    };

    const toggleChat = () => {
        if (!user) {
            setShowLoginToast(true);
            setTimeout(() => setShowLoginToast(false), 4000);
            return;
        }
        setIsOpen(!isOpen);
    };

    return (
        <div className="live-chat-wrapper">
            {/* Floating Icon */}
            <div className={`chat-icon-floating ${isOpen ? 'active' : ''}`} onClick={toggleChat}>
                {isOpen ? <FaTimes /> : <FaComments />}
                {!isOpen && <span className="online-dot"></span>}
            </div>

            {/* Chat Window */}
            {isOpen && (
                <div className="whatsapp-chat-window">
                    <div className="chat-header">
                        <div className="admin-info">
                            <div className="admin-avatar">
                                <FaUserShield />
                            </div>
                            <div className="admin-text">
                                <h4>Support Admin</h4>
                                <span>Online</span>
                            </div>
                        </div>
                        <button className="close-chat" onClick={() => setIsOpen(false)}>
                            <FaTimes />
                        </button>
                    </div>

                    <div className="chat-messages">
                        <div className="welcome-msg">
                            👋 Welcome to Support! How can we help you today?
                        </div>
                        {messages.map((msg, index) => (
                            <div 
                                key={index} 
                                className={`message-bubble ${msg.isAdmin ? 'admin-msg' : 'user-msg'}`}
                            >
                                <div className="msg-content">{msg.message}</div>
                                <div className="msg-time">
                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    <form className="chat-input-area" onSubmit={handleSendMessage}>
                        <input 
                            type="text" 
                            placeholder="Type a message..." 
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                        />
                        <button type="submit" disabled={!newMessage.trim()}>
                            <FaPaperPlane />
                        </button>
                    </form>
                </div>
            )}

            {/* Toast Login Notification */}
            {showLoginToast && (
                <div className="lc-login-toast">
                    <div className="lc-toast-icon">🔒</div>
                    <div className="lc-toast-body">
                        <div className="lc-toast-title">Login Required</div>
                        <div className="lc-toast-msg">Please login to chat with Admin</div>
                        <button
                            className="lc-toast-btn"
                            onClick={() => { setShowLoginToast(false); navigate('/login'); }}
                        >
                            Login Now →
                        </button>
                    </div>
                    <button className="lc-toast-close" onClick={() => setShowLoginToast(false)}>✕</button>
                    <div className="lc-toast-progress"></div>
                </div>
            )}
        </div>
    );
};

export default LiveChat;
