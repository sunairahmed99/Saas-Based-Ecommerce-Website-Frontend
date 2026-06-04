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
    const [socket, setSocket] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const messagesEndRef = useRef(null);
    const socketRef = useRef(null);
    const selectedUserRef = useRef(null);

    // Keep the ref updated with the latest selectedUser
    useEffect(() => {
        selectedUserRef.current = selectedUser;
    }, [selectedUser]);

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    };

    const { data: users = [] } = useAdminQuery({
        queryKey: adminQueryKeys.chatUsers,
        queryFn: async () => {
            const res = await axios.get(`${API_BASE}/api/chat/admin/users`);
            return res.data?.data || [];
        },
    });

    const { data: messages = [] } = useAdminQuery({
        queryKey: adminQueryKeys.chatMessages(selectedUser?._id),
        queryFn: async () => {
            if (!selectedUser?._id) return [];
            const res = await axios.get(`${API_BASE}/api/chat/messages/${selectedUser._id}`);
            return res.data?.data || [];
        },
        enabled: !!selectedUser?._id,
    });

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        const newSocket = createAppSocket(API_BASE);
        if (!newSocket) {
            socketRef.current = null;
            setSocket(null);
            return;
        }

        socketRef.current = newSocket;
        setSocket(newSocket);

        newSocket.on('connect_error', () => {
            newSocket.close();
            socketRef.current = null;
            setSocket(null);
        });

        newSocket.on('receive_message', (message) => {
            // Check if message belongs to current conversation using the ref
            const currentSelected = selectedUserRef.current;
            if (currentSelected && (message.sender == currentSelected._id || message.receiver == currentSelected._id)) {
                queryClient.setQueryData(adminQueryKeys.chatMessages(currentSelected._id), (oldData) => {
                    return [...(oldData || []), message];
                });
            }
            // Refresh user list for last message updates
            queryClient.invalidateQueries({ queryKey: adminQueryKeys.chatUsers });
        });

        newSocket.on('new_chat_notification', () => {
            queryClient.invalidateQueries({ queryKey: adminQueryKeys.chatUsers });
        });

        return () => newSocket.close();
    }, [queryClient]);

    const handleSelectUser = (user) => {
        setSelectedUser(user);
        if (socketRef.current) {
            socketRef.current.emit('admin_join_user', user._id);
        }
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedUser || !socketRef.current) return;

        const messageData = {
            sender: "admin_id_placeholder", 
            receiver: selectedUser._id,
            message: newMessage,
            isAdmin: true
        };

        socketRef.current.emit('send_message', messageData);
        setNewMessage('');
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
                                <FaCircle className="action-icon" />
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
                                <div className="header-right">
                                    <FaEllipsisV className="header-menu-icon" />
                                </div>
                            </div>

                            <div className="admin-chat-messages">
                                {messages.map((msg, index) => (
                                    <div 
                                        key={index} 
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
                                    placeholder="Type a message..." 
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                />
                                <button type="submit" className="send-btn" disabled={!newMessage.trim()}>
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
