import { Table, Card, Row, Col, Statistic } from 'antd';
import { UserOutlined, UserAddOutlined, UserDeleteOutlined, DollarOutlined } from '@ant-design/icons';
import classNames from 'classnames/bind';
import styles from './ManagerUser.module.scss';
import { useEffect, useState } from 'react';
import { requestGetUsers } from '../../../../config/request';

const cx = classNames.bind(styles);

// Table columns configuration
const columns = [
    {
        title: 'Họ và tên',
        dataIndex: ['user', 'fullName'],
        key: 'fullName',
    },
    {
        title: 'Email',
        dataIndex: ['user', 'email'],
        key: 'email',
    },
    {
        title: 'Số điện thoại',
        dataIndex: ['user', 'phone'],
        key: 'phone',
    },
    {
        title: 'Địa chỉ',
        dataIndex: ['user', 'address'],
        key: 'address',
    },
    {
        title: 'Ngày tham gia',
        dataIndex: ['user', 'createdAt'],
        key: 'joinDate',
        render: (date) => new Date(date).toLocaleDateString('vi-VN'),
    },
    {
        title: 'Số bài đăng',
        dataIndex: 'totalPost',
        key: 'totalPost',
    },
    {
        title: 'Tổng chi tiêu',
        dataIndex: 'totalSpent',
        key: 'totalSpent',
        render: (amount) => `${amount.toLocaleString('vi-VN')} VNĐ`,
    },
];

function ManagerUser() {
    const [userData, setUserData] = useState([]);
    const [stats, setStats] = useState({
        totalUsers: 0,
        newUsers: 0,
        activeUsers: 0,
        inactiveUsers: 0,
        totalRevenue: 0,
    });

    useEffect(() => {
        const fetchData = async () => {
            const res = await requestGetUsers();
            const data = res.metadata;
            setUserData(data);

            // Calculate statistics
            const now = new Date();
            const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));

            const newStats = {
                totalUsers: data.length,
                newUsers: data.filter((item) => new Date(item.user.createdAt) > thirtyDaysAgo).length,
                activeUsers: data.filter((item) => item.totalPost > 0).length,
                inactiveUsers: data.filter((item) => item.totalPost === 0).length,
                totalRevenue: data.reduce((sum, item) => sum + item.totalSpent, 0),
            };

            setStats(newStats);
        };
        fetchData();
    }, []);

    return (
        <div className={cx('manager-user')}>
            <Row gutter={[16, 16]}>
                <Col span={8}>
                    <Card>
                        <Statistic title="Tổng số người dùng" value={stats.totalUsers} prefix={<UserOutlined />} />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card>
                        <Statistic
                            title="Người dùng mới"
                            value={stats.newUsers}
                            prefix={<UserAddOutlined />}
                            valueStyle={{ color: '#3f8600' }}
                        />
                    </Card>
                </Col>

                <Col span={8}>
                    <Card>
                        <Statistic
                            title="Tổng doanh thu"
                            value={stats.totalRevenue}
                            prefix={<DollarOutlined />}
                            formatter={(value) => `${value.toLocaleString('vi-VN')} VNĐ`}
                            valueStyle={{ color: '#cf1322' }}
                        />
                    </Card>
                </Col>
            </Row>

            <Card style={{ marginTop: 16 }}>
                <Table
                    columns={columns}
                    dataSource={userData}
                    pagination={{ pageSize: 10 }}
                    scroll={{ x: 1300 }}
                    rowKey={(record) => record.user._id}
                />
            </Card>
        </div>
    );
}

export default ManagerUser;
