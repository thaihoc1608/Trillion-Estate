import { useState, useRef, useEffect } from 'react';
import { io } from 'socket.io-client';
import { requestGetMessagesByUserId } from '../config/request';
import { useStore } from './useStore';

export const useSocket = () => {
    const [dataPayment, setDataPayment] = useState(null);
    const [dataFavourite, setDataFavourite] = useState(null);
    const [dataMessagersUser, setDataMessagersUser] = useState([]);
    const { globalUsersMessage, setGlobalUsersMessage } = useStore();
    const [newMessage, setNewMessage] = useState(null);
    const [newUserMessage, setNewUserMessage] = useState(null);
    const [messagesRead, setMessagesRead] = useState(null);

    const socketRef = useRef();

    useEffect(() => {
        socketRef.current = io(import.meta.env.VITE_SOCKET_URL, {
            transports: ['websocket'],
            withCredentials: true,
        });

        const socket = socketRef.current;

        socket.on('connect', () => {
            console.log('connected to socket');
        });

        socket.on('new-payment', async (data) => {
            setDataPayment(data);
        });

        socket.on('new-favourite', async (data) => {
            setDataFavourite(data?.content);
        });

        socket.on('new-message', async (data) => {
            setNewMessage(data.message);
        });

        socket.on('new-user-message', async (data) => {
            setNewUserMessage(data.message);
        });

        socket.on('messages-read', async (data) => {
            setMessagesRead(data);
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    useEffect(() => {
        const fetchMessages = async () => {
            const res = await requestGetMessagesByUserId();
            setDataMessagersUser(res.metadata);
        };
        fetchMessages();
    }, [newUserMessage]);

    // Khi có tin nhắn mới, cập nhật nội dung chat
    useEffect(() => {
        if (newMessage) {
            // Tìm xem người gửi tin nhắn đã có trong danh sách usersMessage chưa
            const userIndex = globalUsersMessage.findIndex((user) => user.id === newMessage.senderId);
            if (userIndex !== -1) {
                // Nếu đã có, thêm tin nhắn mới vào
                setGlobalUsersMessage((prevUsers) => {
                    const updatedUsers = [...prevUsers];
                    const updatedMessages = [...updatedUsers[userIndex]?.messages, newMessage];
                    updatedUsers[userIndex] = { ...updatedUsers[userIndex], messages: updatedMessages };
                    return updatedUsers;
                });
            }
        }
        console.log('Current usersMessage:', globalUsersMessage);
    }, [newMessage, globalUsersMessage]);

    // Khi có thông báo tin nhắn đã đọc, cập nhật trạng thái tin nhắn
    useEffect(() => {
        if (messagesRead) {
            const { readerId, count } = messagesRead;
            // Tìm xem người đọc tin nhắn có trong danh sách usersMessage không
            const userIndex = globalUsersMessage.findIndex((user) => user.id === readerId);
            if (userIndex !== -1 && count > 0) {
                // Nếu có, cập nhật trạng thái các tin nhắn gửi cho người đó thành đã đọc
                setGlobalUsersMessage((prevUsers) => {
                    const updatedUsers = [...prevUsers];
                    const updatedMessages = updatedUsers[userIndex]?.messages?.map((msg) => {
                        if (msg.receiverId === readerId && !msg.isRead) {
                            return { ...msg, isRead: true };
                        }
                        return msg;
                    });
                    updatedUsers[userIndex] = { ...updatedUsers[userIndex], messages: updatedMessages };
                    return updatedUsers;
                });
            }
        }
    }, [messagesRead, globalUsersMessage]);

    // Khi có người dùng mới nhắn tin, thêm vào danh sách
    useEffect(() => {
        if (newUserMessage && dataMessagersUser.length > 0) {
            const senderInfo = dataMessagersUser.find((messager) => messager.sender.id === newUserMessage.senderId);
            if (senderInfo && !globalUsersMessage.find((user) => user.id === senderInfo.sender.id)) {
                const newUser = {
                    id: senderInfo.sender.id,
                    username: senderInfo.sender.username,
                    avatar: senderInfo.sender.avatar,
                    status: senderInfo.sender.status,
                    messages: [newUserMessage],
                };
                setGlobalUsersMessage((prev) => [...prev, newUser]);
            }
        }
    }, [newUserMessage, dataMessagersUser, globalUsersMessage]);

    return {
        dataPayment,
        dataFavourite,
        dataMessagersUser,
        usersMessage: globalUsersMessage,
        setUsersMessage: setGlobalUsersMessage,
        socketRef,
        newMessage,
        messagesRead,
    };
};
