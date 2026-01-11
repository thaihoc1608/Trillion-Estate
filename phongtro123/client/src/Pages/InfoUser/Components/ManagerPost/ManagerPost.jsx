import React, { useState, useMemo, useEffect } from 'react';
import { Card, Typography, Button, Table, Space, Popconfirm, message, Row, Col, Statistic, Tag } from 'antd';
import { FileTextOutlined, PlusOutlined, EditOutlined, DeleteOutlined, CalendarOutlined } from '@ant-design/icons';
import classNames from 'classnames/bind';
import styles from './ManagerPost.module.scss';
import AddPostForm from './AddPostForm';
import RenewPostModal from './RenewPostModal'; // ✅ Import Renewal Modal
import { requestDeletePost, requestGetPostByUserId, requestRenewPost } from '../../../../config/request';
import { useStore } from '../../../../hooks/useStore';

const cx = classNames.bind(styles);
const { Title, Text } = Typography;

// Category mapping for display
const categoryMap = {
    'phong-tro': 'Phòng trọ',
    'nha-nguyen-can': 'Nhà nguyên căn',
    'can-ho-chung-cu': 'Căn hộ chung cư',
    'can-ho-mini': 'Căn hộ mini',
};

// NEW Checkbox options list (used for consistency)

function ManagerPost() {
    const [posts, setPosts] = useState([]);
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [editingPost, setEditingPost] = useState(null);

    // ✅ Renewal modal state
    const [renewModalVisible, setRenewModalVisible] = useState(false);
    const [renewingPost, setRenewingPost] = useState(null);

    const { fetchAuth, dataUser } = useStore();

    const fetchPosts = async () => {
        const res = await requestGetPostByUserId();
        setPosts(res.metadata);
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    // Calculate statistics using useMemo for efficiency
    const postStats = useMemo(() => {
        const stats = {
            total: posts.length,
            byCategory: {
                'phong-tro': 0,
                'nha-nguyen-can': 0,
                'can-ho-chung-cu': 0,
                'can-ho-mini': 0,
            },
        };
        posts.forEach((post) => {
            if (post.category && stats.byCategory[post.category] !== undefined) {
                stats.byCategory[post.category]++;
            }
        });
        return stats;
    }, [posts]);

    const handleAddPost = () => {
        setEditingPost(null); // Ensure we are in "add" mode
        setIsFormVisible(true);
    };

    const handleDeletePost = async (postId) => {
        try {
            const data = {
                id: postId,
            };
            const res = await requestDeletePost(data);
            message.success(res.message);
            fetchPosts();
            fetchAuth();
        } catch (error) {
            message.error(error.response.data.message);
        }
    };

    // ✅ Renewal handlers
    const handleRenewClick = (post) => {
        setRenewingPost(post);
        setRenewModalVisible(true);
    };

    const handleRenewPost = async (postId, days) => {
        const data = { postId, days };
        const res = await requestRenewPost(data);

        // Refresh data
        await fetchPosts();
        await fetchAuth(); // Update balance

        return res;
    };

    const handleFormFinish = (formData) => {
        if (editingPost) {
            console.log('Updating Post:', editingPost.id, formData);
            setPosts(
                posts.map((post) =>
                    post.id === editingPost.id ? { ...post, ...formData } : post,
                ),
            );
            message.success('Post updated successfully! (Check Console)');
        } else {
            const newPost = { ...formData, id: Date.now() };
            setPosts([...posts, newPost]);
            message.success('Post added successfully! (Check Console)');
        }
        setIsFormVisible(false);
        setEditingPost(null);
    };

    const handleFormCancel = () => {
        setIsFormVisible(false);
        setEditingPost(null);
    };

    // Define columns for the posts table
    const columns = [
        {
            title: 'Tiêu đề',
            dataIndex: 'title',
            key: 'title',
            ellipsis: true,
        },
        {
            title: 'Giá (VNĐ)',
            dataIndex: 'price',
            key: 'price',
            render: (price) => price?.toLocaleString('vi-VN'),
        },
        {
            title: 'Loại hình',
            dataIndex: 'category',
            key: 'category',
            render: (category) => categoryMap[category] || category, // Use display name
        },
        {
            title: 'Diện tích (m²)',
            dataIndex: 'area',
            key: 'area',
        },
        {
            title: 'Địa chỉ',
            dataIndex: 'location',
            key: 'location',
            ellipsis: true,
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                let color = 'green';
                let text = 'Đã duyệt';
                if (status === 'inactive') {
                    color = 'red';
                    text = 'Chưa duyệt';
                } else if (status === 'active') {
                    color = 'green';
                    text = 'Đã duyệt';
                } else if (status === 'cancel') {
                    color = 'gray';
                    text = 'Đã hủy';
                }
                return <Tag color={color}>{text}</Tag>;
            },
        },
        {
            // ✅ Thêm column Hạn sử dụng
            title: 'Hạn sử dụng',
            dataIndex: 'endDate',
            key: 'endDate',
            render: (endDate) => {
                if (!endDate) return <Tag>Vô thời hạn</Tag>;

                const expiryDate = new Date(endDate);
                const now = new Date();
                const isExpired = expiryDate < now;
                const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

                let color = 'green';
                let text = expiryDate.toLocaleDateString('vi-VN');

                if (isExpired) {
                    color = 'red';
                    text = 'Đã hết hạn';
                } else if (daysLeft <= 3) {
                    color = 'orange';
                    text = `Còn ${daysLeft} ngày`;
                }

                return (
                    <Space direction="vertical" size={0}>
                        <Tag color={color}>{text}</Tag>
                        {!isExpired && <div style={{ fontSize: 11, color: '#8c8c8c' }}>{expiryDate.toLocaleDateString('vi-VN')}</div>}
                    </Space>
                );
            },
        },
        {
            title: 'Hành động',
            key: 'action',
            render: (_, record) => (
                <Space size="middle">
                    {/* ✅ Button Gia hạn */}
                    <Button
                        icon={<CalendarOutlined />}
                        onClick={() => handleRenewClick(record)}
                        type="primary"
                        ghost
                    >
                        Gia hạn
                    </Button>

                    {/* Delete button */}
                    {record.status === 'pending' && (
                        <Popconfirm
                            title="Bạn chắc chắn muốn xóa?"
                            onConfirm={() => handleDeletePost(record._id)}
                            okText="Xóa"
                            cancelText="Hủy"
                        >
                            <Button icon={<DeleteOutlined />} danger>
                                Xóa
                            </Button>
                        </Popconfirm>
                    )}
                </Space>
            ),
        },
    ];

    return (
        <div>
            {isFormVisible ? (
                // Show Add/Edit Form
                <AddPostForm
                    onFinish={handleFormFinish}
                    onCancel={handleFormCancel}
                    initialValues={editingPost} // Pass initialValues for editing
                />
            ) : (
                // Show Post List View
                <div>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 24, // Increased margin
                        }}
                    >
                        <Title level={4} style={{ margin: 0 }}>
                            Thống kê bài viết
                        </Title>
                        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddPost}>
                            Thêm bài viết mới
                        </Button>
                    </div>

                    {/* Statistics Section */}
                    {posts.length > 0 && (
                        <Row gutter={16} style={{ marginBottom: 24 }}>
                            <Col span={6}>
                                <Card bordered={false}>
                                    <Statistic title="Tổng số bài viết" value={postStats.total} />
                                </Card>
                            </Col>
                            {Object.entries(postStats.byCategory).map(([key, value]) => (
                                <Col span={4} key={key}>
                                    <Card bordered={false}>
                                        <Statistic title={categoryMap[key]} value={value} />
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    )}

                    {posts.length > 0 ? (
                        <>
                            <Title level={5} style={{ marginBottom: 16 }}>
                                Danh sách chi tiết
                            </Title>
                            <Table columns={columns} dataSource={posts} rowKey="_id" bordered pagination={false} />
                        </>
                    ) : (
                        // Placeholder when no posts exist
                        <Card className={cx('content-card')}>
                            <FileTextOutlined className={cx('content-icon')} />
                            <Title level={4}>Chưa có bài viết nào</Title>
                            <Text>Nhấn "Thêm bài viết mới" để bắt đầu đăng tin.</Text>
                        </Card>
                    )}
                </div>
            )}

            {/* ✅ Renewal Modal */}
            <RenewPostModal
                visible={renewModalVisible}
                post={renewingPost}
                userBalance={dataUser?.balance || 0}
                onCancel={() => {
                    setRenewModalVisible(false);
                    setRenewingPost(null);
                }}
                onRenew={handleRenewPost}
            />
        </div>
    );
}

export default ManagerPost;
