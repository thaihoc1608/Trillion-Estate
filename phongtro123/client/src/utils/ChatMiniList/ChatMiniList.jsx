import { useState, useEffect } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { useStore } from '../../hooks/useStore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComments, faTimes, faChevronUp, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { requestGetMessages } from '../../config/request';
import userDefault from '../../assets/images/user-default.svg';
import dayjs from 'dayjs';
import './ChatMiniList.css';

function ChatMiniList() {
    const [isOpen, setIsOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { dataUser } = useStore();
    const { dataMessagersUser, usersMessage, setUsersMessage } = useSocket();

    const toggleOpen = () => {
        if (!dataUser._id) return; // Không mở nếu chưa đăng nhập
        setIsOpen(!isOpen);
    };

    const toggleCollapse = (e) => {
        e.stopPropagation();
        setIsCollapsed(!isCollapsed);
    };

    const handleOpenMessager = async (user) => {
        console.log('Trying to open chat from mini list:', user.sender.username, 'ID:', user.sender.id);

        // Kiểm tra xem người dùng đã có trong danh sách chat chưa
        console.log('Current usersMessage:', usersMessage);

        const existingUser = usersMessage.find((existingUser) => String(existingUser.id) === String(user.sender.id));

        if (existingUser) {
            console.log('User already has chat window open:', existingUser);
            setIsOpen(false);
            return; // Nếu đã có, không thêm lại
        }

        // Lấy lịch sử tin nhắn
        try {
            const data = {
                receiverId: user.sender.id,
            };
            console.log('Fetching messages for:', user.sender.id);
            const res = await requestGetMessages(data);

            // Tạo thông tin người dùng để thêm vào danh sách chat
            const newUserMessage = {
                id: user.sender.id,
                username: user.sender.username,
                avatar: user.sender.avatar,
                status: user.sender.status,
                messages: res.metadata || [],
            };

            // Sử dụng hàm cập nhật state để đảm bảo state luôn được cập nhật đúng
            setUsersMessage((prevMessages) => {
                console.log('Adding chat from mini list for:', user.sender.username);
                const updatedMessages = [...prevMessages, newUserMessage];
                console.log('Updated messages list:', updatedMessages);
                return updatedMessages;
            });

            setIsOpen(false);
        } catch (error) {
            console.error('Lỗi khi lấy tin nhắn:', error);
        }
    };

    // Tính tổng tin nhắn chưa đọc
    const unreadCount = dataMessagersUser
        ? dataMessagersUser.reduce((total, user) => total + (user.unreadCount || 0), 0)
        : 0;

    // Chỉ hiển thị khi người dùng đã đăng nhập
    if (!dataUser._id) return null;

    return (
        <div className={`chat-mini-list ${isCollapsed ? 'collapsed' : ''}`}>
            <div className="chat-mini-toggle" onClick={toggleOpen}>
                <FontAwesomeIcon icon={faComments} className="chat-icon" />
                {unreadCount > 0 && <span className="chat-badge">{unreadCount}</span>}
                <span className="chat-label">Chat</span>
                <button className="collapse-btn" onClick={toggleCollapse}>
                    <FontAwesomeIcon icon={isCollapsed ? faChevronUp : faChevronDown} />
                </button>
            </div>

            {isOpen && (
                <div className="chat-mini-dropdown">
                    <div className="chat-mini-header">
                        <h4>Trò chuyện gần đây</h4>
                        <button onClick={toggleOpen}>
                            <FontAwesomeIcon icon={faTimes} />
                        </button>
                    </div>
                    <div className="chat-mini-content">
                        {dataMessagersUser && dataMessagersUser.length > 0 ? (
                            dataMessagersUser.map((user, index) => (
                                <div
                                    key={index}
                                    onClick={() => handleOpenMessager(user)}
                                    className={`chat-mini-item ${user.unreadCount > 0 ? 'has-unread' : ''}`}
                                >
                                    <div className="chat-mini-avatar">
                                        <img src={user.sender.avatar || userDefault} alt="" />
                                        <span
                                            className={`status-dot ${
                                                user.sender.status === 'Đang hoạt động' ? 'online' : 'offline'
                                            }`}
                                        ></span>
                                    </div>
                                    <div className="chat-mini-info">
                                        <h3>{user.sender.username}</h3>
                                        <p>{user.lastMessage.message}</p>
                                    </div>
                                    <div className="chat-mini-meta">
                                        {user.unreadCount > 0 && (
                                            <span className="unread-count">{user.unreadCount}</span>
                                        )}
                                        <span className="time-ago">
                                            {dayjs(user.lastMessage.createdAt).format('HH:mm')}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="no-messages">Bạn chưa có tin nhắn nào</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default ChatMiniList;
