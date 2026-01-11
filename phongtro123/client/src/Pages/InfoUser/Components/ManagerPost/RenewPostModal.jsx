import React, { useState } from 'react';
import { Modal, Radio, Typography, Space, Tag, message, Spin } from 'antd';
import { ClockCircleOutlined, DollarOutlined, CalendarOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

// Pricing theo typeNews
const PRICING = {
    vip: [
        { days: 3, price: 50000, label: '3 ngày' },
        { days: 7, price: 315000, label: '7 ngày' },
        { days: 30, price: 1200000, label: '30 ngày' },
    ],
    normal: [
        { days: 3, price: 10000, label: '3 ngày' },
        { days: 7, price: 60000, label: '7 ngày' },
        { days: 30, price: 1000000, label: '30 ngày' },
    ],
};

function RenewPostModal({ visible, post, userBalance, onCancel, onRenew }) {
    const [selectedDays, setSelectedDays] = useState(3);
    const [loading, setLoading] = useState(false);

    if (!post) return null;

    const pricing = PRICING[post.typeNews] || PRICING.normal;
    const selectedPackage = pricing.find((p) => p.days === selectedDays);

    // Tính endDate mới
    const calculateNewEndDate = () => {
        const now = new Date();
        const currentEndDate = new Date(post.endDate);
        const baseDate = currentEndDate > now ? currentEndDate : now;
        const newDate = new Date(baseDate);
        newDate.setDate(newDate.getDate() + selectedDays);
        return newDate;
    };

    const newEndDate = calculateNewEndDate();
    const isExpired = new Date(post.endDate) < new Date();
    const canAfford = userBalance >= selectedPackage.price;

    const handleRenew = async () => {
        if (!canAfford) {
            message.error('Số dư không đủ! Vui lòng nạp thêm tiền.');
            return;
        }

        setLoading(true);
        try {
            await onRenew(post._id, selectedDays);
            message.success(`Gia hạn thành công ${selectedDays} ngày!`);
            setSelectedDays(3); // Reset
            onCancel();
        } catch (error) {
            message.error(error.response?.data?.message || 'Gia hạn thất bại');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title={
                <Space>
                    <CalendarOutlined />
                    <span>Gia hạn bài đăng</span>
                </Space>
            }
            open={visible}
            onCancel={onCancel}
            onOk={handleRenew}
            okText={loading ? 'Đang xử lý...' : 'Xác nhận gia hạn'}
            cancelText="Hủy"
            okButtonProps={{ disabled: !canAfford || loading }}
            width={600}
        >
            <Spin spinning={loading}>
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    {/* Thông tin bài đăng */}
                    <div>
                        <Text strong>Bài đăng:</Text>
                        <div style={{ marginTop: 8, padding: 12, background: '#f5f5f5', borderRadius: 8 }}>
                            <Text>{post.title}</Text>
                            <div style={{ marginTop: 4 }}>
                                <Tag color={post.typeNews === 'vip' ? 'gold' : 'blue'}>
                                    {post.typeNews === 'vip' ? 'VIP' : 'Thường'}
                                </Tag>
                                <Tag color={isExpired ? 'red' : 'green'}>
                                    {isExpired ? 'Đã hết hạn' : 'Còn hiệu lực'}
                                </Tag>
                            </div>
                        </div>
                    </div>

                    {/* Hạn hiện tại */}
                    <div>
                        <Space>
                            <ClockCircleOutlined />
                            <Text strong>Hạn hiện tại:</Text>
                        </Space>
                        <div style={{ marginTop: 8 }}>
                            <Tag color={isExpired ? 'red' : 'green'}>
                                {new Date(post.endDate).toLocaleDateString('vi-VN')}
                            </Tag>
                        </div>
                    </div>

                    {/* Chọn gói gia hạn */}
                    <div>
                        <Text strong>Chọn gói gia hạn:</Text>
                        <Radio.Group
                            value={selectedDays}
                            onChange={(e) => setSelectedDays(e.target.value)}
                            style={{ width: '100%', marginTop: 12 }}
                        >
                            <Space direction="vertical" style={{ width: '100%' }}>
                                {pricing.map((pkg) => {
                                    const affordable = userBalance >= pkg.price;
                                    return (
                                        <Radio.Button
                                            key={pkg.days}
                                            value={pkg.days}
                                            style={{
                                                width: '100%',
                                                height: 'auto',
                                                padding: '12px 16px',
                                                textAlign: 'left',
                                                opacity: affordable ? 1 : 0.5,
                                            }}
                                            disabled={!affordable}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Space direction="vertical" size={0}>
                                                    <Text strong>{pkg.label}</Text>
                                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                                        {pkg.price.toLocaleString('vi-VN')}đ
                                                    </Text>
                                                </Space>
                                                {!affordable && <Tag color="red">Không đủ tiền</Tag>}
                                            </div>
                                        </Radio.Button>
                                    );
                                })}
                            </Space>
                        </Radio.Group>
                    </div>

                    {/* Hạn mới sau gia hạn */}
                    <div
                        style={{
                            padding: 16,
                            background: '#e6f7ff',
                            border: '1px solid #91d5ff',
                            borderRadius: 8,
                        }}
                    >
                        <Space direction="vertical" size={8} style={{ width: '100%' }}>
                            <Text strong>Hạn mới sau khi gia hạn:</Text>
                            <Tag color="blue" style={{ fontSize: 14 }}>
                                {newEndDate.toLocaleDateString('vi-VN')}
                            </Tag>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                (+{selectedDays} ngày từ {isExpired ? 'hôm nay' : 'ngày hết hạn'})
                            </Text>
                        </Space>
                    </div>

                    {/* Thông tin thanh toán */}
                    <div
                        style={{
                            padding: 16,
                            background: canAfford ? '#f6ffed' : '#fff2e8',
                            border: `1px solid ${canAfford ? '#b7eb8f' : '#ffd591'}`,
                            borderRadius: 8,
                        }}
                    >
                        <Space direction="vertical" size={8} style={{ width: '100%' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text>Số dư hiện tại:</Text>
                                <Text strong>{userBalance.toLocaleString('vi-VN')}đ</Text>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text>Giá gia hạn:</Text>
                                <Text strong style={{ color: '#ff4d4f' }}>
                                    -{selectedPackage.price.toLocaleString('vi-VN')}đ
                                </Text>
                            </div>
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    paddingTop: 8,
                                    borderTop: '1px dashed #d9d9d9',
                                }}
                            >
                                <Text strong>Số dư còn lại:</Text>
                                <Text
                                    strong
                                    style={{
                                        fontSize: 16,
                                        color: canAfford ? '#52c41a' : '#ff4d4f',
                                    }}
                                >
                                    {(userBalance - selectedPackage.price).toLocaleString('vi-VN')}đ
                                </Text>
                            </div>
                        </Space>
                    </div>

                    {!canAfford && (
                        <div
                            style={{
                                padding: 12,
                                background: '#fff1f0',
                                border: '1px solid #ffa39e',
                                borderRadius: 8,
                            }}
                        >
                            <Text type="danger">
                                ⚠️ Số dư không đủ! Vui lòng nạp thêm{' '}
                                {(selectedPackage.price - userBalance).toLocaleString('vi-VN')}đ
                            </Text>
                        </div>
                    )}
                </Space>
            </Spin>
        </Modal>
    );
}

export default RenewPostModal;
