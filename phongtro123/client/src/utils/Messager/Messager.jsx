import { useEffect, useState, useRef } from 'react';
import classNames from 'classnames/bind';
import styles from './Messager.module.scss';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faPaperPlane } from '@fortawesome/free-solid-svg-icons';

import userDefault from '../../assets/images/user-default.svg';
import { requestCreateMessage, requestGetMessages, requestMarkAllMessagesRead } from '../../config/request';
import { useStore } from '../../hooks/useStore';
import { useSocket } from '../../hooks/useSocket';

const cx = classNames.bind(styles);

function Messager({ user, setUsersMessage, usersMessage }) {
    const { dataMessages, setDataMessages, dataUser } = useStore();
    const { socketRef, newMessage } = useSocket();
    const messagesEndRef = useRef(null);
    const [valueMessager, setValueMessager] = useState('');
    const [loading, setLoading] = useState(false);
    const [unreadMessages, setUnreadMessages] = useState([]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [dataMessages]);

    // Khi component được mount, lấy dữ liệu tin nhắn và đánh dấu đã đọc
    useEffect(() => {
        const fetchMessages = async () => {
            try {
                setLoading(true);
                const data = {
                    receiverId: user.id,
                };
                const res = await requestGetMessages(data);
                setDataMessages(res.metadata || []);

                // Kiểm tra xem có tin nhắn chưa đọc không
                const unread = res.metadata.filter(
                    (msg) => msg.senderId === user.id && msg.receiverId === dataUser._id && !msg.isRead,
                );

                if (unread.length > 0) {
                    setUnreadMessages(unread);
                    // Đánh dấu tất cả tin nhắn từ người này là đã đọc
                    await markAllAsRead();
                }
            } catch (error) {
                console.error('Lỗi khi lấy tin nhắn:', error);
            } finally {
                setLoading(false);
            }
        };

        if (user.id && dataUser._id) {
            fetchMessages();
        }

        // Thiết lập khi có tin nhắn mới
        if (user.messages && user.messages.length > 0) {
            setDataMessages(user.messages);

            // Kiểm tra tin nhắn chưa đọc
            const unread = user.messages.filter(
                (msg) => msg.senderId === user.id && msg.receiverId === dataUser._id && !msg.isRead,
            );

            if (unread.length > 0) {
                setUnreadMessages(unread);
                markAllAsRead();
            }
        }
    }, [user.id, dataUser._id]);

    // Hàm đánh dấu tất cả tin nhắn là đã đọc
    const markAllAsRead = async () => {
        try {
            await requestMarkAllMessagesRead({ senderId: user.id });
        } catch (error) {
            console.error('Lỗi khi đánh dấu tin nhắn đã đọc:', error);
        }
    };

    // Xử lý khi có tin nhắn mới thông qua socket
    useEffect(() => {
        if (newMessage && newMessage.senderId === user.id) {
            setDataMessages((prev) => [...prev, newMessage]);

            // Đánh dấu tin nhắn mới là đã đọc ngay lập tức
            if (newMessage.receiverId === dataUser._id && !newMessage.isRead) {
                markAllAsRead();
            }
        }
    }, [newMessage, user.id, dataUser._id]);

    const handleKeyPress = async (e) => {
        if (e.key === 'Enter' && valueMessager.trim() !== '') {
            await handleSendMessage();
        }
    };

    const handleSendMessage = async () => {
        if (valueMessager.trim() !== '') {
            try {
                const data = {
                    receiverId: user.id,
                    message: valueMessager,
                };
                const res = await requestCreateMessage(data);

                // Thêm tin nhắn mới vào danh sách tin nhắn
                if (res.metadata) {
                    setDataMessages((prev) => [...prev, res.metadata]);
                }
                setValueMessager('');
            } catch (error) {
                console.error('Lỗi khi gửi tin nhắn:', error);
            }
        }
    };

    useEffect(() => {
        console.log('Messager component mounted for user:', user.username, 'with ID:', user.id);
        return () => {
            console.log('Messager component unmounted for user:', user.username);
        };
    }, []);

    const handleCloseMessager = () => {
        console.log('Closing chat window for user:', user.username);
        console.log('Current user id:', user.id);
        console.log(
            'Current usersMessage list before removal:',
            usersMessage.map((u) => ({ id: u.id, name: u.username })),
        );

        const updated = usersMessage.filter((item) => String(item.id) !== String(user.id));
        console.log(
            'New usersMessage list after filtering:',
            updated.map((u) => ({ id: u.id, name: u.username })),
        );

        setUsersMessage(updated);
    };

    return (
        <div className={cx('wrapper')}>
            <div className={cx('header')}>
                <div className={cx('user')}>
                    <img src={user?.avatar || userDefault} alt="" />
                    <div className={cx('info')}>
                        <h3>{user?.username}</h3>
                        <span id={cx(user?.status === 'Đang hoạt động' ? 'online' : 'offline')}>
                            {user?.status === 'Đang hoạt động' ? 'Đang hoạt động' : 'Đang offline'}
                        </span>
                    </div>
                </div>

                <div className={cx('close')}>
                    <button onClick={handleCloseMessager}>
                        <FontAwesomeIcon icon={faXmark} />
                    </button>
                </div>
            </div>

            <div className={cx('content')}>
                {loading ? (
                    <div className={cx('loading')}>Đang tải tin nhắn...</div>
                ) : dataMessages && dataMessages.length > 0 ? (
                    dataMessages.map((msg, index) => (
                        <div
                            key={index}
                            className={cx('message', {
                                sender: msg.senderId === user.id ? false : true,
                                unread: msg.senderId === user.id && !msg.isRead,
                            })}
                        >
                            <p>{msg.message}</p>
                            {msg.senderId !== dataUser._id && (
                                <span className={cx('read-status')}>{msg.isRead ? 'Đã xem' : ''}</span>
                            )}
                        </div>
                    ))
                ) : (
                    <div className={cx('empty-message')}>Bắt đầu cuộc trò chuyện</div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <div className={cx('input')}>
                <input
                    type="text"
                    placeholder="Nhập tin nhắn..."
                    value={valueMessager}
                    onChange={(e) => setValueMessager(e.target.value)}
                    onKeyDown={handleKeyPress}
                />
                <button onClick={handleSendMessage}>
                    <FontAwesomeIcon icon={faPaperPlane} />
                </button>
            </div>
        </div>
    );
}

export default Messager;
