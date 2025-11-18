import { useState } from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { MailOutlined, LockOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import classNames from 'classnames/bind';
import styles from './ForgotPassword.module.scss';
import Header from '../../Components/Header/Header';
import { requestForgotPassword, requestResetPassword } from '../../config/request';
import { useNavigate } from 'react-router-dom';

const cx = classNames.bind(styles);
const { Title, Text } = Typography;

function ForgotPassword() {
    const [form] = Form.useForm();
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleSendOTP = async (values) => {
        try {
            setLoading(true);
            // TODO: Call API to send OTP
            await requestForgotPassword({ email: values.email });
            message.success('Mã xác thực đã được gửi đến email của bạn');
            setEmail(values.email);
            setStep(2);
            setLoading(false);
        } catch (error) {
            message.error(error.response.data.message);
            setLoading(false);
        }
    };

    const handleVerifyAndReset = async (values) => {
        try {
            setLoading(true);
            const data = {
                email,
                otp: values.otp,
                password: values.password,
                confirmPassword: values.confirmPassword,
            };

            await requestResetPassword(data);
            navigate('/login');
            // Simulate API call
            setTimeout(() => {
                message.success('Đặt lại mật khẩu thành công');
                // TODO: Redirect to login page
                setLoading(false);
            }, 1000);
        } catch (error) {
            message.error(error.response.data.message);
            setLoading(false);
        }
    };

    const renderStep1 = () => (
        <Form form={form} onFinish={handleSendOTP}>
            <Form.Item
                name="email"
                rules={[
                    { required: true, message: 'Vui lòng nhập email' },
                    { type: 'email', message: 'Email không hợp lệ' },
                ]}
            >
                <Input prefix={<MailOutlined />} placeholder="Nhập email của bạn" size="large" />
            </Form.Item>
            <Form.Item>
                <Button type="primary" htmlType="submit" block size="large" loading={loading}>
                    Gửi mã xác thực
                </Button>
            </Form.Item>
        </Form>
    );

    const renderStep2 = () => (
        <Form form={form} onFinish={handleVerifyAndReset}>
            <Form.Item
                name="otp"
                rules={[
                    { required: true, message: 'Vui lòng nhập mã OTP' },
                    { len: 6, message: 'Mã OTP phải có 6 số' },
                ]}
            >
                <Input prefix={<SafetyCertificateOutlined />} placeholder="Nhập mã OTP" size="large" />
            </Form.Item>
            <Form.Item
                name="password"
                rules={[
                    { required: true, message: 'Vui lòng nhập mật khẩu mới' },
                    { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' },
                ]}
            >
                <Input.Password prefix={<LockOutlined />} placeholder="Nhập mật khẩu mới" size="large" />
            </Form.Item>
            <Form.Item
                name="confirmPassword"
                dependencies={['password']}
                rules={[
                    { required: true, message: 'Vui lòng xác nhận mật khẩu' },
                    ({ getFieldValue }) => ({
                        validator(_, value) {
                            if (!value || getFieldValue('password') === value) {
                                return Promise.resolve();
                            }
                            return Promise.reject(new Error('Mật khẩu không khớp'));
                        },
                    }),
                ]}
            >
                <Input.Password prefix={<LockOutlined />} placeholder="Xác nhận mật khẩu mới" size="large" />
            </Form.Item>
            <Form.Item>
                <Button type="primary" htmlType="submit" block size="large" loading={loading}>
                    Đặt lại mật khẩu
                </Button>
            </Form.Item>
        </Form>
    );

    return (
        <div className={cx('wrapper')}>
            <header>
                <Header />
            </header>
            <div className={cx('content')}>
                <Card className={cx('card')}>
                    <Title level={2} className={cx('title')}>
                        Quên mật khẩu
                    </Title>
                    <Text className={cx('description')}>
                        {step === 1 && 'Nhập email của bạn để nhận mã xác thực'}
                        {step === 2 && 'Nhập mã OTP và mật khẩu mới cho tài khoản của bạn'}
                    </Text>
                    {step === 1 && renderStep1()}
                    {step === 2 && renderStep2()}
                </Card>
            </div>
        </div>
    );
}

export default ForgotPassword;
