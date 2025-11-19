import { Table, Card, Row, Col, Statistic } from 'antd';
import { UserOutlined, UserAddOutlined, UserDeleteOutlined, DollarOutlined } from '@ant-design/icons';
import classNames from 'classnames/bind';
import styles from './ManagerUser.module.scss';
import { useEffect, useMemo, useState } from 'react';
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

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await requestGetUsers();
                const data = Array.isArray(res?.metadata) ? res.metadata : [];
                setUserData(data);
            } catch (error) {
                console.error('Error fetching users:', error);
                setUserData([]);
            }
        };
        fetchData();
    }, []);

    const stats = useMemo(() => {
        if (!Array.isArray(userData) || userData.length === 0) {
            return {
                totalUsers: 0,
                newUsers: 0,
                activeUsers: 0,
                inactiveUsers: 0,
                totalRevenue: 0,
            };
        }

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const totalUsers = userData.length;
        const newUsers = userData.filter((item) => new Date(item.user.createdAt) > thirtyDaysAgo).length;
        const activeUsers = userData.filter((item) => item.totalPost > 0).length;
        const inactiveUsers = totalUsers - activeUsers;
        const totalRevenue = userData.reduce((sum, item) => sum + Number(item.totalSpent || 0), 0);

        return {
            totalUsers,
            newUsers,
            activeUsers,
            inactiveUsers,
            totalRevenue,
        };
    }, [userData]);

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
