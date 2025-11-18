import { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Table, Typography, Progress, Avatar, Tag, Tooltip } from 'antd';
import { Column } from '@ant-design/plots';
import {
    UserOutlined,
    HomeOutlined,
    DollarOutlined,
    ShoppingOutlined,
    ArrowUpOutlined,
    ArrowDownOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    CloseCircleOutlined,
} from '@ant-design/icons';
import classNames from 'classnames/bind';
import styles from './Dashborad.module.scss';
import { requestGetAdminStats } from '../../../../config/request';

const { Title, Text } = Typography;
const cx = classNames.bind(styles);

function Dashboard() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalPosts: 0,
        totalTransactions: 0,
        totalRevenue: 0,
        userGrowth: 0,
        postGrowth: 0,
        transactionGrowth: 0,
        revenueGrowth: 0,
    });
    const [postsData, setPostsData] = useState([]);
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [topUsers, setTopUsers] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const res = await requestGetAdminStats();
                if (res && res.metadata) {
                    // Update statistics
                    setStats({
                        totalUsers: res.metadata.totalUsers || 0,
                        totalPosts: res.metadata.totalPosts || 0,
                        totalTransactions: res.metadata.totalTransactions || 0,
                        totalRevenue: res.metadata.totalRevenue || 0,
                        userGrowth: res.metadata.userGrowth || 0,
                        postGrowth: res.metadata.postGrowth || 0,
                        transactionGrowth: res.metadata.transactionGrowth || 0,
                        revenueGrowth: res.metadata.revenueGrowth || 0,
                    });

                    // Update posts data for chart
                    setPostsData(res.metadata.postsData || []);

                    // Update recent transactions
                    setRecentTransactions(res.metadata.recentTransactions || []);

                    // Update top users
                    setTopUsers(res.metadata.topUsers || []);
                }
            } catch (error) {
                console.error('Error fetching admin stats:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Column chart config
    const columnConfig = {
        data: postsData,
        xField: 'date',
        yField: 'posts',
        color: '#1a237e',
        label: {
            position: 'middle',
            style: {
                fill: '#FFFFFF',
                opacity: 0.6,
            },
        },
        xAxis: {
            label: {
                autoHide: true,
                autoRotate: false,
            },
        },
        meta: {
            date: {
                alias: 'Ngày',
            },
            posts: {
                alias: 'Số tin',
            },
        },
    };

    const transactionColumns = [
        {
            title: 'Người dùng',
            dataIndex: 'username',
            key: 'username',
            render: (text, record) => (
                <div className={cx('user-cell')}>
                    <Avatar icon={<UserOutlined />} className={cx('user-avatar')} />
                    <div>
                        <div className={cx('user-name')}>{text}</div>
                        <div className={cx('user-id')}>{record.userId}</div>
                    </div>
                </div>
            ),
        },
        {
            title: 'Số tiền',
            dataIndex: 'amount',
            key: 'amount',
            render: (amount) => (
                <div className={cx('amount-cell')}>
                    <DollarOutlined className={cx('amount-icon')} />
                    <span>{(amount / 1000).toLocaleString()}k VND</span>
                </div>
            ),
        },
        {
            title: 'Phương thức',
            dataIndex: 'typePayment',
            key: 'typePayment',
            render: (type) => (
                <Tag color="blue" className={cx('payment-tag')}>
                    {type}
                </Tag>
            ),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                const statusConfig = {
                    completed: {
                        color: 'success',
                        icon: <CheckCircleOutlined />,
                        text: 'Thành công',
                    },
                    pending: {
                        color: 'warning',
                        icon: <ClockCircleOutlined />,
                        text: 'Đang xử lý',
                    },
                    failed: {
                        color: 'error',
                        icon: <CloseCircleOutlined />,
                        text: 'Thất bại',
                    },
                };

                const config = statusConfig[status] || {
                    color: 'default',
                    icon: <ClockCircleOutlined />,
                    text: status,
                };

                return (
                    <Tag icon={config.icon} color={config.color} className={cx('status-tag')}>
                        {config.text}
                    </Tag>
                );
            },
        },
        {
            title: 'Ngày',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date) => (
                <div className={cx('date-cell')}>
                    {new Date(date).toLocaleDateString('vi-VN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                    })}
                </div>
            ),
        },
    ];

    return (
        <div className={cx('wrapper')}>
            <div className={cx('header')}></div>

            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={6}>
                    <Card className={cx('stat-card')} bordered={false}>
                        <div className={cx('stat-icon', 'users')}>
                            <UserOutlined />
                        </div>
                        <Statistic
                            title="Tổng người dùng"
                            value={stats.totalUsers}
                            loading={loading}
                            suffix={
                                <span className={cx('growth', stats.userGrowth >= 0 ? 'positive' : 'negative')}>
                                    {stats.userGrowth >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                                    {Math.abs(stats.userGrowth)}%
                                </span>
                            }
                        />
                        <Progress percent={75} showInfo={false} strokeColor="#1a237e" />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card className={cx('stat-card')} bordered={false}>
                        <div className={cx('stat-icon', 'posts')}>
                            <HomeOutlined />
                        </div>
                        <Statistic
                            title="Tổng tin đăng"
                            value={stats.totalPosts}
                            loading={loading}
                            suffix={
                                <span className={cx('growth', stats.postGrowth >= 0 ? 'positive' : 'negative')}>
                                    {stats.postGrowth >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                                    {Math.abs(stats.postGrowth)}%
                                </span>
                            }
                        />
                        <Progress percent={60} showInfo={false} strokeColor="#0d47a1" />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card className={cx('stat-card')} bordered={false}>
                        <div className={cx('stat-icon', 'transactions')}>
                            <ShoppingOutlined />
                        </div>
                        <Statistic
                            title="Tổng giao dịch"
                            value={stats.totalTransactions}
                            loading={loading}
                            suffix={
                                <span className={cx('growth', stats.transactionGrowth >= 0 ? 'positive' : 'negative')}>
                                    {stats.transactionGrowth >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                                    {Math.abs(stats.transactionGrowth)}%
                                </span>
                            }
                        />
                        <Progress percent={45} showInfo={false} strokeColor="#1565c0" />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card className={cx('stat-card')} bordered={false}>
                        <div className={cx('stat-icon', 'revenue')}>
                            <DollarOutlined />
                        </div>
                        <Statistic
                            title="Tổng doanh thu"
                            value={stats.totalRevenue}
                            loading={loading}
                            formatter={(value) => `${(value / 1000).toLocaleString()}k `}
                            suffix={
                                <span className={cx('growth', stats.revenueGrowth >= 0 ? 'positive' : 'negative')}>
                                    {stats.revenueGrowth >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                                    {Math.abs(stats.revenueGrowth)}%
                                </span>
                            }
                        />
                        <Progress percent={90} showInfo={false} strokeColor="#1976d2" />
                    </Card>
                </Col>
            </Row>

            <Row gutter={[16, 16]} className={cx('content-row')}>
                <Col xs={24} lg={16}>
                    <Card title="Lịch sử nạp tiền" className={cx('table-card')} loading={loading} bordered={false}>
                        <Table
                            dataSource={recentTransactions}
                            columns={transactionColumns}
                            rowKey="_id"
                            pagination={{ pageSize: 5 }}
                            className={cx('transactions-table')}
                        />
                    </Card>
                </Col>
                <Col xs={24} lg={8}>
                    <Card title="Top người dùng" className={cx('users-card')} loading={loading} bordered={false}>
                        <div className={cx('top-users')}>
                            {topUsers.map((user, index) => (
                                <div key={user.id} className={cx('user-item')}>
                                    <div className={cx('user-rank')}>{index + 1}</div>
                                    <Avatar
                                        src={user.avatar}
                                        icon={!user.avatar && <UserOutlined />}
                                        className={cx('user-avatar')}
                                    />
                                    <div className={cx('user-info')}>
                                        <div className={cx('user-name')}>{user.name}</div>
                                        <div className={cx('user-posts')}>{user.posts} tin</div>
                                    </div>
                                    <Tooltip title="Xem hồ sơ">
                                        <div className={cx('user-action')}>
                                            <UserOutlined />
                                        </div>
                                    </Tooltip>
                                </div>
                            ))}
                        </div>
                    </Card>
                </Col>
            </Row>

            <Row gutter={[16, 16]} className={cx('content-row')}>
                <Col xs={24}>
                    <Card
                        title="Thống kê tin đăng 7 ngày gần đây"
                        className={cx('chart-card')}
                        loading={loading}
                        bordered={false}
                    >
                        <Column {...columnConfig} />
                    </Card>
                </Col>
            </Row>
        </div>
    );
}

export default Dashboard;
