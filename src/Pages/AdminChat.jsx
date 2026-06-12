import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { createAppSocket } from '../utils/socket';
import { useAdminQuery, adminQueryKeys, useQueryClient } from "../hooks/useAdminApi";
import { FaUser, FaPaperPlane, FaSearch, FaCircle, FaArrowLeft, FaPaperclip, FaSmile, FaEllipsisV, FaComments } from 'react-icons/fa';
import { API_BASE_URL } from '../config';
import './AdminChat.css';

const API_BASE = `${API_BASE_URL}`;

const AdminChat = () => {
    const queryClient = useQueryClient();
    
    const [selectedUser, setSelectedUser] = useState(null);
    const [newMessage, setNewMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    
    const messagesEndRef = useRef(null);
    const socketRef = useRef(null);
    const selectedUserRef = useRef(null);

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    };

    // Keep selectedUserRef in sync so socket callback can access the latest value
    useEffect(() => {
        selectedUserRef.current = selectedUser;
    }, [selectedUser]);

    // Initialize socket connection
    useEffect(() => {
        const newSocket = createAppSocket(API_BASE);
        if (newSocket) {
            socketRef.current = newSocket;
            setSocket(newSocket);
            setIsConnected(newSocket.connected);

            newSocket.on('connect', () => {
                setIsConnected(true);
            });

            newSocket.on('disconnect', () => {
                setIsConnected(false);
            });

            newSocket.on('receive_message', (message) => {
                const currentSelected = selectedUserRef.current;
                if (currentSelected) {
                    const userId = currentSelected._id;
                    // If message is related to currently open chat
                    if (message.sender === userId || message.receiver === userId) {
                        queryClient.invalidateQueries({ queryKey: adminQueryKeys.chatMessages(userId) });
                    }
                }
                // Also update user list to show last message in sidebar
                queryClient.invalidateQueries({ queryKey: adminQueryKeys.chatUsers });
            });

            newSocket.on('new_chat_notification', (data) => {
                queryClient.invalidateQueries({ queryKey: adminQueryKeys.chatUsers });
            });
        }

        return () => {
            if (newSocket) {
                newSocket.close();
            }
        };
    }, [queryClient]);

    // Join room when selectedUser changes
    useEffect(() => {
        if (socket && selectedUser?._id) {
            socket.emit('admin_join_user', selectedUser._id);
        }
    }, [selectedUser, socket]);

    // Users list - refresh every 10 seconds (with socket fallback)
    const { data: users = [] } = useAdminQuery({
        queryKey: adminQueryKeys.chatUsers,
        queryFn: async () => {
            const res = await axios.get(`${API_BASE}/api/chat/admin/users`);
            return res.data?.data || [];
        },
        refetchInterval: 10000,
    });

    // Messages - auto-refresh every 10 seconds (with socket fallback)
    const { data: messages = [] } = useAdminQuery({
        queryKey: adminQueryKeys.chatMessages(selectedUser?._id),
        queryFn: async () => {
            if (!selectedUser?._id) return [];
            const res = await axios.get(`${API_BASE}/api/chat/messages/${selectedUser._id}`);
            return res.data?.data || [];
        },
        enabled: !!selectedUser?._id,
        refetchInterval: 10000,
    });

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSelectUser = (user) => {
        setSelectedUser(user);
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedUser || !socket) return;

        const msgText = newMessage.trim();
        setNewMessage('');

        const messageData = {
            sender: 'admin_id_placeholder',
            receiver: selectedUser._id,
            message: msgText,
            isAdmin: true,
            createdAt: new Date().toISOString()
        };

        // Emit message over socket
        socket.emit('send_message', messageData);
    };

    const filteredUsers = users.filter(u => 
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="admin-chat-page">
            <div className={`admin-chat-container ${selectedUser ? 'user-selected' : ''}`}>
                {/* Users Sidebar */}
                <div className="chat-sidebar">
                    <div className="sidebar-header">
                        <div className="sidebar-top-row">
                            <div className="admin-profile-pic">
                                <FaUser />
                            </div>
                            <div className="sidebar-actions">
                                <FaCircle className={`action-icon ${isConnected ? 'connected' : 'disconnected'}`} style={{ color: isConnected ? '#4caf50' : '#f44336' }} />
                                <FaComments className="action-icon" />
                                <FaEllipsisV className="action-icon" />
                            </div>
                        </div>
                        <div className="search-box">
                            <FaSearch />
                            <input 
                                type="text" 
                                placeholder="Search or start new chat" 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="user-list">
                        {filteredUsers.length > 0 ? (
                            filteredUsers.map(user => (
                                <div 
                                    key={user._id} 
                                    className={`user-item ${selectedUser?._id === user._id ? 'active' : ''}`}
                                    onClick={() => handleSelectUser(user)}
                                >
                                    <div className="user-avatar">
                                        {user.profileImage ? (
                                            <img src={user.profileImage} alt={user.name} />
                                        ) : (
                                            <FaUser />
                                        )}
                                    </div>
                                    <div className="user-info">
                                        <div className="user-name-row">
                                            <h4>{user.name}</h4>
                                            <span className="last-time">
                                                {user.lastMessageTime ? new Date(user.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                            </span>
                                        </div>
                                        <p className="last-msg">{user.lastMessage || 'Start a conversation'}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="no-users">No conversations found</div>
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="chat-area">
                    {selectedUser ? (
                        <>
                            <div className="chat-area-header">
                                <div className="header-left">
                                    <button 
                                        className="back-btn" 
                                        onClick={() => setSelectedUser(null)}
                                    >
                                        <FaArrowLeft />
                                    </button>
                                    <div className="user-avatar-small">
                                        {selectedUser.profileImage ? (
                                            <img src={selectedUser.profileImage} alt={selectedUser.name} />
                                        ) : (
                                            <FaUser />
                                        )}
                                    </div>
                                    <div className="selected-user-info">
                                        <h4>{selectedUser.name}</h4>
                                        <div className="status-indicator">
                                            <span className="online-dot"></span>
                                            <span>Online</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{ fontSize: '0.85rem', color: isConnected ? '#4caf50' : '#f44336', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isConnected ? '#4caf50' : '#f44336', display: 'inline-block' }}></span>
                                        {isConnected ? 'Connected' : 'Connecting...'}
                                    </span>
                                    <FaEllipsisV className="header-menu-icon" />
                                </div>
                            </div>

                            <div className="admin-chat-messages">
                                {messages.map((msg, index) => (
                                    <div 
                                        key={msg._id || index} 
                                        className={`admin-msg-bubble ${msg.isAdmin ? 'sent' : 'received'}`}
                                    >
                                        <div className="bubble-content">{msg.message}</div>
                                        <div className="bubble-time">
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            <form className="admin-chat-input" onSubmit={handleSendMessage}>
                                <button type="button" className="input-icon-btn"><FaSmile /></button>
                                <button type="button" className="input-icon-btn"><FaPaperclip /></button>
                                <input 
                                    type="text" 
                                    placeholder={isConnected ? "Type a message..." : "Connecting..."} 
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    disabled={!socket}
                                />
                                <button type="submit" className="send-btn" disabled={!newMessage.trim() || !socket}>
                                    <FaPaperPlane />
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="empty-chat-state">
                            <div className="empty-icon">💬</div>
                            <h3>Select a user to start chatting</h3>
                            <p>Real-time customer support session</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminChat;
