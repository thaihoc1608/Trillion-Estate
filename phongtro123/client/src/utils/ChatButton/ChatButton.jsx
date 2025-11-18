import { useSocket } from '../../hooks/useSocket';
import { useStore } from '../../hooks/useStore';
import { message } from 'antd';
import { requestGetMessages } from '../../config/request';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComment } from '@fortawesome/free-solid-svg-icons';
import './ChatButton.css';

function ChatButton({
    userId,
    username,
    avatar,
    status,
    buttonText = 'Nhắn tin',
    className = '',
    icon = true,
    fullWidth = false,
}) {
    const { dataUser } = useStore();
    const { usersMessage, setUsersMessage } = useSocket();

    const handleOpenMessager = async () => {
        console.log('Opening chat button for user:', username, 'ID:', userId);

        // Kiểm tra nếu người dùng chưa đăng nhập
        if (!dataUser._id) {
            return message.warning('Vui lòng đăng nhập để nhắn tin');
        }

        // Kiểm tra nếu người dùng đang nhắn tin với chính mình
        if (userId === dataUser._id) {
            return message.warning('Bạn không thể nhắn tin cho chính mình');
        }

        // Kiểm tra xem người dùng đã có trong danh sách chat chưa
        console.log('Current usersMessage:', usersMessage);

        const existingUser = usersMessage.find((item) => String(item.id) === String(userId));
        if (existingUser) {
            console.log('User already in chat list:', existingUser);
            return; // Nếu đã có, không thêm lại
        }

        try {
            // Lấy lịch sử tin nhắn
            const data = {
                receiverId: userId,
            };
            console.log('Fetching messages for user:', userId);
            const res = await requestGetMessages(data);

            // Tạo thông tin người dùng để thêm vào danh sách chat
            const newUserMessage = {
                id: userId,
                username: username,
                avatar: avatar,
                status: status || 'Đang hoạt động',
                messages: res.metadata || [],
            };

            // Quan trọng: Sử dụng hàm cập nhật state để đảm bảo state luôn được cập nhật
            setUsersMessage((prevMessages) => {
                console.log('Adding new chat window for:', username);
                const updatedMessages = [...prevMessages, newUserMessage];
                console.log('Updated messages list:', updatedMessages);
                return updatedMessages;
            });

            message.success('Đã mở cửa sổ chat');
        } catch (error) {
            console.error('Lỗi khi lấy tin nhắn:', error);
            message.error('Không thể kết nối để nhắn tin');
        }
    };

    return (
        <button
            className={`chat-button ${className}`}
            onClick={handleOpenMessager}
            style={{ width: fullWidth ? '100%' : 'auto' }}
        >
            {icon && <FontAwesomeIcon icon={faComment} className="chat-button-icon" />}
            {buttonText}
        </button>
    );
}

export default ChatButton;
