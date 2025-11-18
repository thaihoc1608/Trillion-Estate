import { Layout, Menu, Avatar, Typography, Row, Col, Card, Divider, Button } from 'antd';
import { UserOutlined, FileTextOutlined, DollarCircleOutlined, LockOutlined } from '@ant-design/icons';
import Header from '../../Components/Header/Header';
import { useState } from 'react';
import PersonalInfo from './Components/PersonalInfo/PersonalInfo';
import ManagerPost from './Components/ManagerPost/ManagerPost';
import { useStore } from '../../hooks/useStore';
import RechargeUser from './Components/RechargeUser/RechargeUser';
import ChangePassword from './Components/ChangePassword/ChangePassword';

import userNotFound from '../../assets/images/img_default.svg';

const { Sider, Content } = Layout;
const { Title, Text } = Typography;

function InfoUser() {
    const [selectedMenu, setSelectedMenu] = useState('personal');

    const { dataUser } = useStore();

    const menuItems = [
        {
            key: 'personal',
            icon: <UserOutlined />,
            label: 'Thông tin cá nhân',
        },
        {
            key: 'change-password',
            icon: <LockOutlined />,
            label: 'Đổi mật khẩu',
        },
        {
            key: 'posts',
            icon: <FileTextOutlined />,
            label: 'Quản lý bài viết',
        },
        {
            key: 'recharge',
            icon: <DollarCircleOutlined />,
            label: 'Nạp tiền',
        },
    ];

    const handleMenuClick = (e) => {
        setSelectedMenu(e.key);
    };

    return (
        <Layout style={{ minHeight: '100vh', width: '80%', margin: '100px auto' }}>
            <Header />
            <Layout
                style={{
                    marginTop: '20px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                }}
            >
                <Sider
                    width={300}
                    theme="light"
                    style={{
                        padding: '20px 0',
                        borderRight: '1px solid #f0f0f0',
                        background: 'linear-gradient(to bottom, #f9f9f9, #ffffff)',
                    }}
                >
                    <div
                        style={{
                            textAlign: 'center',
                            padding: '0 20px 20px',
                            background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                            margin: '-20px -20px 20px -20px',
                            padding: '30px 20px',
                            color: 'white',
                            width: '107%',
                        }}
                    >
                        <Avatar
                            size={100}
                            src={dataUser?.avatar || userNotFound}
                            icon={<UserOutlined />}
                            style={{
                                border: '4px solid white',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                            }}
                        />
                        <Title level={4} style={{ marginTop: 16, marginBottom: 4, color: 'white' }}>
                            {dataUser.fullName}
                        </Title>
                        <Row>
                            <Col span={24}>
                                <Text style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
                                    Số điện thoại {dataUser.phone}
                                </Text>
                            </Col>
                            <Col span={24}>
                                <Text style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
                                    Số dư : {dataUser?.balance?.toLocaleString()} VNĐ
                                </Text>
                            </Col>
                        </Row>
                    </div>
                    <Menu
                        mode="inline"
                        selectedKeys={[selectedMenu]}
                        items={menuItems}
                        onClick={handleMenuClick}
                        style={{
                            borderRight: 0,
                            fontSize: '16px',
                        }}
                    />
                </Sider>
                <Content style={{ padding: '24px', background: '#fff' }}>
                    <Card
                        style={{
                            borderRadius: '8px',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                        }}
                        title={
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Title level={3} style={{ margin: 0 }}>
                                    {selectedMenu === 'personal' && 'Thông tin cá nhân'}
                                    {selectedMenu === 'posts' && 'Quản lý bài viết'}
                                    {selectedMenu === 'recharge' && 'Nạp tiền'}
                                    {selectedMenu === 'change-password' && 'Đổi mật khẩu'}
                                </Title>
                            </div>
                        }
                    >
                        {selectedMenu === 'personal' && <PersonalInfo />}
                        {selectedMenu === 'posts' && <ManagerPost />}
                        {selectedMenu === 'recharge' && <RechargeUser />}
                        {selectedMenu === 'change-password' && <ChangePassword />}
                    </Card>
                </Content>
            </Layout>
        </Layout>
    );
}

export default InfoUser;
