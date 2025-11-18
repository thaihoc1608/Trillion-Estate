import classNames from 'classnames/bind';
import styles from './RegisterUser.module.scss';
import Header from '../../Components/Header/Header';
import { Form, Input, Button, Tabs, Typography, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined, HeatMapOutlined } from '@ant-design/icons';

import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

const cx = classNames.bind(styles);
const { TabPane } = Tabs;
const { Text } = Typography;

import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { requestRegister } from '../../config/request';

function RegisterUser() {
    const [form] = Form.useForm();

    const navigate = useNavigate();

    const onFinish = async (values) => {
        const data = {
            fullName: values.name,
            email: values.email,
            password: values.password,
            phone: values.phone,
            address: values.address,
        };
        try {
            const res = await requestRegister(data);
            message.success(res.metadata.message);
            setTimeout(() => {
                window.location.reload();
            }, 1000);
            navigate('/');
        } catch (error) {
            message.error(error.response.data.message);
        }
    };

    const handleSuccess = async (response) => {
        const { credential } = response; // Nhận ID Token từ Google
        try {
            const res = await requestLoginGoogle(credential);
            message.success(res.message);
            setTimeout(() => {
                window.location.reload();
            }, 1000);
            navigate('/');
        } catch (error) {
            message.error(error.response.data.message);
        }
    };

    useEffect(() => {
        document.title = 'Đăng ký';
    }, []);

    return (
        <div className={cx('wrapper')}>
            <header>
                <Header />
            </header>

            <main className={cx('main')}>
                <div className={cx('login-container')}>
                    <Tabs defaultActiveKey="1" centered className={cx('login-tabs')}>
                        <TabPane tab="Tạo tài khoản mới" key="1">
                            <Form form={form} name="register" className={cx('login-form')} onFinish={onFinish}>
                                <Form.Item name="name" rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}>
                                    <Input prefix={<UserOutlined />} placeholder="Họ tên" size="large" />
                                </Form.Item>

                                <Form.Item name="email" rules={[{ required: true, message: 'Vui lòng nhập email!' }]}>
                                    <Input prefix={<MailOutlined />} placeholder="Email" size="large" />
                                </Form.Item>

                                <Form.Item
                                    name="phone"
                                    rules={[{ required: true, message: 'Vui lòng nhập số điện thoại!' }]}
                                >
                                    <Input prefix={<PhoneOutlined />} placeholder="Số điện thoại" size="large" />
                                </Form.Item>

                                <Form.Item
                                    name="address"
                                    rules={[{ required: true, message: 'Vui lòng nhập địa chỉ!' }]}
                                >
                                    <Input prefix={<HeatMapOutlined />} placeholder="Địa chỉ" size="large" />
                                </Form.Item>

                                <Form.Item
                                    name="password"
                                    rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
                                >
                                    <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" size="large" />
                                </Form.Item>

                                <div className={cx('footer')}>
                                    <Form.Item>
                                        <Link className={cx('forgot-password')} to="/login">
                                            Bạn đã có tài khoản
                                        </Link>
                                    </Form.Item>

                                    <Form.Item>
                                        <Link className={cx('forgot-password')} to="/forgot-password">
                                            Bạn quên mật khẩu?
                                        </Link>
                                    </Form.Item>
                                </div>

                                <Form.Item>
                                    <GoogleOAuthProvider clientId={import.meta.env.VITE_CLIENT_ID}>
                                        <GoogleLogin
                                            onSuccess={handleSuccess}
                                            onError={() => console.log('Login Failed')}
                                        />
                                    </GoogleOAuthProvider>
                                </Form.Item>

                                <Form.Item>
                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        className={cx('login-button')}
                                        block
                                        size="large"
                                    >
                                        Đăng ký
                                    </Button>
                                </Form.Item>

                                <div className={cx('terms')}>
                                    <Text>
                                        Qua việc đăng nhập hoặc tạo tài khoản, bạn đồng ý với các{' '}
                                        <Link href="#">quy định sử dụng</Link> cũng như{' '}
                                        <Link href="#">chính sách bảo mật</Link> của chúng tôi
                                    </Text>
                                </div>
                            </Form>
                        </TabPane>
                    </Tabs>
                </div>
            </main>
        </div>
    );
}

export default RegisterUser;
