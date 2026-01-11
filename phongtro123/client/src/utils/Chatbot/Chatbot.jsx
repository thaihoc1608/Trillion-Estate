import React, { useState, useRef, useEffect } from 'react';
import styles from './Chatbot.module.scss';
import { requestChatbot } from '../../config/request';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComments, faTimes } from '@fortawesome/free-solid-svg-icons';
import ReactMarkdown from 'react-markdown';

const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { text: 'Xin chào! Tôi là trợ lý bán hàng. Tôi có thể giúp gì cho bạn?', sender: 'bot' },
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (inputMessage.trim() && !isLoading) {
            const userMessage = inputMessage.trim();
            setMessages((prev) => [...prev, { text: userMessage, sender: 'user' }]);
            setInputMessage('');
            setIsLoading(true);

            try {
                // ✅ Fix: Lấy hoặc tạo userId ĐÚNG CÁCH
                let userId = localStorage.getItem('chatUserId');
                if (!userId) {
                    // Tạo mới CHỈ KHI chưa có
                    userId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)} `;
                    localStorage.setItem('chatUserId', userId);
                    console.log('🆔 Created new chat userId:', userId);
                } else {
                    console.log('🆔 Reusing chat userId:', userId);
                }

                const response = await requestChatbot({
                    question: userMessage,
                    userId
                });

                // Response format mới: { success, data, metadata }
                const botMessage = response.success ? response.data : response;

                setMessages((prev) => [...prev, { text: botMessage, sender: 'bot' }]);

                // Optional: Log metadata để debug
                if (response.metadata) {
                    console.log('📊 Chatbot metadata:', response.metadata);
                }
            } catch (error) {
                console.error('Chatbot error:', error);
                setMessages((prev) => [
                    ...prev,
                    {
                        text: 'Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau.',
                        sender: 'bot',
                    },
                ]);
            } finally {
                setIsLoading(false);
            }
        }
    };

    return (
        <>
            <button className={styles.chatButton} onClick={() => setIsOpen(true)} aria-label="Mở chat">
                <FontAwesomeIcon icon={faComments} />
            </button>

            {isOpen && (
                <div className={styles.chatbotContainer}>
                    <div className={styles.chatHeader}>
                        <h2>Hỗ trợ người dùng</h2>
                        <button className={styles.closeButton} onClick={() => setIsOpen(false)} aria-label="Đóng chat">
                            <FontAwesomeIcon icon={faTimes} />
                        </button>
                    </div>
                    <div className={styles.messageList}>
                        {messages.map((message, index) => (
                            <div
                                key={index}
                                className={`${styles.message} ${message.sender === 'user' ? styles.userMessage : styles.botMessage
                                    }`}
                            >
                                <div className={styles.messageContent}>
                                    {message.sender === 'bot' ? (
                                        <ReactMarkdown
                                            components={{
                                                // Custom components để style đẹp hơn
                                                p: ({ node, ...props }) => <p style={{ margin: '0.5em 0' }} {...props} />,
                                                strong: ({ node, ...props }) => <strong style={{ color: '#1890ff', fontWeight: 600 }} {...props} />,
                                                a: ({ node, ...props }) => <a style={{ color: '#52c41a' }} {...props} target="_blank" rel="noopener noreferrer" />,
                                            }}
                                        >
                                            {message.text}
                                        </ReactMarkdown>
                                    ) : (
                                        message.text
                                    )}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className={`${styles.message} ${styles.botMessage} `}>
                                <div className={styles.messageContent}>
                                    <span className={styles.typingIndicator}>Đang nhập...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                    <form onSubmit={handleSubmit} className={styles.inputForm}>
                        <input
                            type="text"
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            placeholder="Nhập tin nhắn của bạn..."
                            className={styles.input}
                            disabled={isLoading}
                        />
                        <button type="submit" className={styles.sendButton} disabled={isLoading}>
                            Gửi
                        </button>
                    </form>
                </div>
            )}
        </>
    );
};

export default Chatbot;
