import {
    CheckCircleOutlined,
    ClockCircleOutlined,
    CloseCircleOutlined,
    EnvironmentOutlined,
    EyeOutlined,
    FileTextOutlined,
    PhoneOutlined,
} from '@ant-design/icons';
import { Button, Card, Col, Descriptions, Divider, Image, Input, Modal, Row, Space, Statistic, Table, Tag } from 'antd';
import classNames from 'classnames/bind';
import { useEffect, useMemo, useState } from 'react';
import { requestApprovePost, requestGetAllPosts, requestRejectPost } from '../../../../config/request';
import styles from './ManagerPost.module.scss';

const cx = classNames.bind(styles);

function ManagerPost() {
    const [selectedPost, setSelectedPost] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [approvalReason, setApprovalReason] = useState('');
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(false);
    const handleViewDetails = (post) => {
        setSelectedPost(post);
        setIsModalVisible(true);
    };

    const handleReject = async (postId) => {
        try {
            await requestRejectPost({ id: postId, reason: approvalReason });
            fetchData();
        } catch (error) {
            console.log(error);
        }
    };

    const handleCloseModal = () => {
        setIsModalVisible(false);
        setSelectedPost(null);
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await requestGetAllPosts();
            if (!Array.isArray(res?.metadata)) {
                throw new Error('Invalid posts payload');
            }

            setPosts(res.metadata);
        } catch (error) {
            console.error('Error fetching posts:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const stats = useMemo(() => {
        if (!Array.isArray(posts) || posts.length === 0) {
            return {
                totalPosts: 0,
                activePosts: 0,
                inactivePosts: 0,
                totalRevenue: 0,
            };
        }

        const totalPosts = posts.length;
        const activePosts = posts.filter((post) => post.status?.toLowerCase() === 'active').length;
        const inactivePosts = posts.filter((post) => post.status?.toLowerCase() === 'inactive').length;
        const totalRevenue = posts.reduce((sum, post) => sum + Number(post.price || 0), 0);

        return {
            totalPosts,
            activePosts,
            inactivePosts,
            totalRevenue,
        };
    }, [posts]);

    const handleApprove = async (postId) => {
        try {
            await requestApprovePost({ id: postId, reason: approvalReason });
            setApprovalReason('');
            fetchData();
        } catch (error) {
            console.log(error);
        }
    };

    const getCategoryName = (category) => {
        const categoryMap = {
            'phong-tro': 'Phòng trọ',
            'nha-nguyen-can': 'Nhà nguyên căn',
            'can-ho-chung-cu': 'Căn hộ chung cư',
            'can-ho-mini': 'Căn hộ mini',
        };
        return categoryMap[category] || category;
    };

    // Table columns configuration
    const columns = [
        {
            title: 'Tiêu đề',
            dataIndex: 'title',
            key: 'title',
        },
        {
            title: 'Người đăng',
            dataIndex: 'username',
            key: 'username',
        },
        {
            title: 'Loại phòng',
            dataIndex: 'category',
            key: 'category',
            render: (category) => getCategoryName(category),
        },
        {
            title: 'Giá',
            dataIndex: 'price',
            key: 'price',
            render: (price) => `${price.toLocaleString('vi-VN')} VNĐ`,
        },
        {
            title: 'Diện tích',
            dataIndex: 'area',
            key: 'area',
            render: (area) => `${area}m²`,
        },
        {
            title: 'Địa chỉ',
            dataIndex: 'location',
            key: 'location',
        },
        {
            title: 'Loại tin',
            dataIndex: 'typeNews',
            key: 'typeNews',
            render: (type) => <Tag color={type === 'vip' ? 'gold' : 'blue'}>{type === 'vip' ? 'VIP' : 'Thường'}</Tag>,
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                const statusConfig = {
                    active: { color: 'green', text: 'Đã duyệt' },
                    inactive: { color: 'orange', text: 'Chờ duyệt' },
                    cancel: { color: 'red', text: 'Đã từ chối' },
                };
                const { color, text } = statusConfig[status] || { color: 'default', text: status };
                return <Tag color={color}>{text}</Tag>;
            },
        },
        {
            title: 'Ngày đăng',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date) => new Date(date).toLocaleDateString('vi-VN'),
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_, record) => (
                <Space size="middle">
                    <Button type="default" icon={<EyeOutlined />} onClick={() => handleViewDetails(record)}>
                        Chi tiết
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <div className={cx('manager-post')}>
            <Row gutter={[16, 16]}>
                <Col span={8}>
                    <Card>
                        <Statistic title="Tổng số bài viết" value={stats.totalPosts} prefix={<FileTextOutlined />} />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card>
                        <Statistic
                            title="Bài viết đã duyệt"
                            value={stats.activePosts}
                            prefix={<CheckCircleOutlined />}
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card>
                        <Statistic
                            title="Bài viết chờ duyệt"
                            value={stats.inactivePosts}
                            prefix={<CloseCircleOutlined />}
                            valueStyle={{ color: '#faad14' }}
                        />
                    </Card>
                </Col>
            </Row>

            <Card style={{ marginTop: 16 }}>
                <Table
                    columns={columns}
                    dataSource={posts}
                    pagination={{ pageSize: 10 }}
                    scroll={{ x: 1500 }}
                    loading={loading}
                    rowKey="_id"
                />
            </Card>

            <Modal
                title="Chi tiết bài viết"
                open={isModalVisible}
                onCancel={handleCloseModal}
                footer={[
                    <Button key="close" onClick={handleCloseModal}>
                        Đóng
                    </Button>,
                    selectedPost?.status === 'inactive' && (
                        <Space size="middle" style={{ width: '100%', justifyContent: 'flex-end' }}>
                            <Button
                                key="approve"
                                type="primary"
                                icon={<CheckCircleOutlined />}
                                onClick={() => {
                                    handleApprove(selectedPost._id);
                                    handleCloseModal();
                                }}
                            >
                                Duyệt
                            </Button>
                            <Space.Compact style={{ width: '300px' }}>
                                <Input.TextArea
                                    key="reason"
                                    placeholder="Nhập lý do từ chối"
                                    value={approvalReason}
                                    onChange={(e) => setApprovalReason(e.target.value)}
                                    autoSize={{ minRows: 1, maxRows: 3 }}
                                    style={{ borderRadius: '6px 0 0 6px' }}
                                />
                                <Button
                                    key="reject"
                                    danger
                                    icon={<CloseCircleOutlined />}
                                    onClick={() => {
                                        handleReject(selectedPost._id);
                                        handleCloseModal();
                                    }}
                                    style={{ borderRadius: '0 6px 6px 0' }}
                                >
                                    Từ chối
                                </Button>
                            </Space.Compact>
                        </Space>
                    ),
                ]}
                width={1000}
            >
                {selectedPost && (
                    <div>
                        <div style={{ marginBottom: 16 }}>
                            <Image.PreviewGroup>
                                <Row gutter={[8, 8]}>
                                    {selectedPost.images?.map((image, index) => (
                                        <Col span={8} key={index}>
                                            <Image
                                                src={image}
                                                alt={`Ảnh ${index + 1}`}
                                                style={{ width: '100%', height: 200, objectFit: 'cover' }}
                                            />
                                        </Col>
                                    ))}
                                </Row>
                            </Image.PreviewGroup>
                        </div>

                        <Descriptions bordered column={2}>
                            <Descriptions.Item label="Tiêu đề" span={2}>
                                {selectedPost.title}
                            </Descriptions.Item>
                            <Descriptions.Item label="Người đăng">{selectedPost.username}</Descriptions.Item>
                            <Descriptions.Item label="Số điện thoại">
                                <Space>
                                    <PhoneOutlined />
                                    {selectedPost.phone}
                                </Space>
                            </Descriptions.Item>
                            <Descriptions.Item label="Loại phòng">
                                {getCategoryName(selectedPost.category)}
                            </Descriptions.Item>
                            <Descriptions.Item label="Giá">
                                {selectedPost.price.toLocaleString('vi-VN')} VNĐ
                            </Descriptions.Item>
                            <Descriptions.Item label="Diện tích">{selectedPost.area}m²</Descriptions.Item>
                            <Descriptions.Item label="Địa chỉ" span={2}>
                                <Space>
                                    <EnvironmentOutlined />
                                    {selectedPost.location}
                                </Space>
                            </Descriptions.Item>
                            <Descriptions.Item label="Loại tin">
                                <Tag color={selectedPost.typeNews === 'vip' ? 'gold' : 'blue'}>
                                    {selectedPost.typeNews === 'vip' ? 'VIP' : 'Thường'}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Trạng thái">
                                <Tag color={selectedPost.status === 'active' ? 'green' : 'orange'}>
                                    {selectedPost.status === 'active' ? 'Đã duyệt' : 'Chờ duyệt'}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Ngày đăng">
                                <Space>
                                    <ClockCircleOutlined />
                                    {new Date(selectedPost.createdAt).toLocaleDateString('vi-VN')}
                                </Space>
                            </Descriptions.Item>
                            <Descriptions.Item label="Ngày hết hạn">
                                <Space>
                                    <ClockCircleOutlined />
                                    {new Date(selectedPost.endDate).toLocaleDateString('vi-VN')}
                                </Space>
                            </Descriptions.Item>
                        </Descriptions>

                        <Divider orientation="left">Mô tả chi tiết</Divider>
                        <div
                            style={{ marginBottom: 16 }}
                            dangerouslySetInnerHTML={{ __html: selectedPost.description }}
                        />

                        <Divider orientation="left">Tiện ích</Divider>
                        <Row gutter={[16, 16]}>
                            {selectedPost.options &&
                                selectedPost.options.map((option, index) => (
                                    <Col span={8} key={index}>
                                        <Tag color="green">{option}</Tag>
                                    </Col>
                                ))}
                        </Row>
                    </div>
                )}
            </Modal>
        </div>
    );
}

export default ManagerPost;
