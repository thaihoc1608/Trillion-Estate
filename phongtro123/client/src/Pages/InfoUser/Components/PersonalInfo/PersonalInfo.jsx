import { Row, Col, Card, Typography, Table, Modal, Form, Input, Button, Upload, message, AutoComplete } from 'antd';
import {
    UserOutlined,
    PhoneOutlined,
    MailOutlined,
    EnvironmentOutlined,
    HeartOutlined,
    EditOutlined,
    UploadOutlined,
} from '@ant-design/icons';
import classNames from 'classnames/bind';
import styles from './PersonalInfo.module.scss';
import { useStore } from '../../../../hooks/useStore';
import { useState, useEffect } from 'react';
import {
    requestGetFavourite,
    requestUpdateUser,
    requestUploadImage,
    requestUploadImages,
} from '../../../../config/request';
import axios from 'axios';
import useDebounce from '../../../../hooks/useDebounce';

import userNotFound from '../../../../assets/images/img_default.svg';

const cx = classNames.bind(styles);
const { Text, Title } = Typography;

function PersonalInfo() {
    const { dataUser, fetchAuth } = useStore();
    const [favourite, setFavourite] = useState([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [avatarUrl, setAvatarUrl] = useState(dataUser?.avatar || '');
    const [valueSearch, setValueSearch] = useState('');
    const [dataSearch, setDataSearch] = useState([]);

    const debouncedSearch = useDebounce(valueSearch, 500);

    useEffect(() => {
        const fetchData = async () => {
            if (debouncedSearch) {
                const res = await axios.get(`https://rsapi.goong.io/Place/AutoComplete`, {
                    params: {
                        input: debouncedSearch,
                        api_key: '3HcKy9jen6utmzxno4HwpkN1fJYll5EM90k53N4K',
                    },
                });
                setDataSearch(res.data.predictions);
            } else {
                setDataSearch([]);
            }
        };
        fetchData();
    }, [debouncedSearch]);

    useEffect(() => {
        const fetchFavourite = async () => {
            const res = await requestGetFavourite();
            setFavourite(res.metadata);
        };
        fetchFavourite();
    }, []);

    const handleEdit = () => {
        form.setFieldsValue({
            fullName: dataUser.fullName,
            phone: dataUser.phone,
            email: dataUser.email,
            address: dataUser.address,
        });
        setAvatarUrl(dataUser?.avatar || '');
        setIsModalVisible(true);
    };

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            const data = {
                ...values,
                avatar: avatarUrl,
            };
            const res = await requestUpdateUser(data);
            message.success(res.message);
            setIsModalVisible(false);
            fetchAuth();
        } catch (error) {
            message.error(error.response.data.message);
        }
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        form.resetFields();
        setAvatarUrl(dataUser?.avatar || '');
    };

    const beforeUpload = (file) => {
        const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
        if (!isJpgOrPng) {
            message.error('Bạn chỉ có thể tải lên file JPG/PNG!');
        }
        const isLt2M = file.size / 1024 / 1024 < 2;
        if (!isLt2M) {
            message.error('Ảnh phải nhỏ hơn 2MB!');
        }
        return isJpgOrPng && isLt2M;
    };

    const handleAvatarChange = async (info) => {
        if (info.file.status === 'done') {
            setAvatarUrl(info.file.response.image);
            message.success('Tải ảnh lên thành công!');
        } else if (info.file.status === 'error') {
            message.error('Tải ảnh lên thất bại!');
        }
    };

    const favoriteColumns = [
        {
            title: 'Tiêu đề',
            dataIndex: 'title',
            key: 'title',
        },
        {
            title: 'Giá',
            dataIndex: 'price',
            key: 'price',
            render: (price) => `${price.toLocaleString('vi-VN')} VNĐ`,
        },
        {
            title: 'Ngày đăng',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date) => new Date(date).toLocaleDateString('vi-VN'),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'endDate',
            key: 'status',
            render: (endDate) => {
                const currentDate = new Date();
                const postEndDate = new Date(endDate);
                const isExpired = postEndDate < currentDate;
                return (
                    <span style={{ color: isExpired ? '#ff4d4f' : '#52c41a' }}>
                        {isExpired ? 'Đã hết hạn' : 'Đang đăng'}
                    </span>
                );
            },
        },
    ];

    // Mock data - replace with actual data from your API
    const favoritePosts = favourite.map((item) => ({
        key: item._id,
        title: item.title,
        price: item.price,
        createdAt: item.createdAt,
        endDate: item.endDate,
    }));

    const handleSelectAddress = (value, option) => {
        form.setFieldsValue({ address: value });
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                <Button type="primary" icon={<EditOutlined />} onClick={handleEdit}>
                    Chỉnh sửa thông tin
                </Button>
            </div>

            <Row gutter={[24, 24]}>
                <Col span={12}>
                    <Card size="small" className={cx('info-card')}>
                        <div className={cx('info-item')}>
                            <UserOutlined className={cx('info-icon')} />
                            <div>
                                <Text strong>Họ và tên</Text>
                                <div>{dataUser.fullName}</div>
                            </div>
                        </div>
                    </Card>
                </Col>
                <Col span={12}>
                    <Card size="small" className={cx('info-card')}>
                        <div className={cx('info-item')}>
                            <PhoneOutlined className={cx('info-icon')} />
                            <div>
                                <Text strong>Số điện thoại</Text>
                                <div>{dataUser.phone}</div>
                            </div>
                        </div>
                    </Card>
                </Col>
                <Col span={12}>
                    <Card size="small" className={cx('info-card')}>
                        <div className={cx('info-item')}>
                            <MailOutlined className={cx('info-icon')} />
                            <div>
                                <Text strong>Email</Text>
                                <div>{dataUser.email}</div>
                            </div>
                        </div>
                    </Card>
                </Col>
                <Col span={12}>
                    <Card size="small" className={cx('info-card')}>
                        <div className={cx('info-item')}>
                            <EnvironmentOutlined className={cx('info-icon')} />
                            <div>
                                <Text strong>Địa chỉ</Text>
                                <div>{dataUser.address}</div>
                            </div>
                        </div>
                    </Card>
                </Col>
            </Row>

            <div style={{ marginTop: '24px' }}>
                <Card>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                        <HeartOutlined style={{ fontSize: '20px', marginRight: '8px', color: '#ff4d4f' }} />
                        <Title level={4} style={{ margin: 0 }}>
                            Tin yêu thích
                        </Title>
                    </div>
                    <Table columns={favoriteColumns} dataSource={favoritePosts} pagination={{ pageSize: 5 }} />
                </Card>
            </div>

            <Modal
                title="Chỉnh sửa thông tin cá nhân"
                open={isModalVisible}
                onOk={handleOk}
                onCancel={handleCancel}
                okText="Lưu"
                cancelText="Hủy"
                width={600}
            >
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <div style={{ marginBottom: '16px' }}>
                        <img
                            src={avatarUrl || userNotFound}
                            alt="avatar"
                            style={{
                                width: '150px',
                                height: '150px',
                                borderRadius: '50%',
                                objectFit: 'cover',
                            }}
                        />
                    </div>
                    <Upload
                        name="avatar"
                        showUploadList={false}
                        beforeUpload={beforeUpload}
                        onChange={handleAvatarChange}
                        action="http://localhost:3000/api/upload-image"
                    >
                        <Button icon={<UploadOutlined />}>Tải ảnh lên</Button>
                    </Upload>
                </div>
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="fullName"
                        label="Họ và tên"
                        rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
                    >
                        <Input prefix={<UserOutlined />} />
                    </Form.Item>
                    <Form.Item
                        name="phone"
                        label="Số điện thoại"
                        rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
                    >
                        <Input prefix={<PhoneOutlined />} />
                    </Form.Item>
                    <Form.Item
                        name="email"
                        label="Email"
                        rules={[
                            { required: true, message: 'Vui lòng nhập email' },
                            { type: 'email', message: 'Email không hợp lệ' },
                        ]}
                    >
                        <Input prefix={<MailOutlined />} />
                    </Form.Item>
                    <Form.Item
                        name="address"
                        label="Địa chỉ"
                        rules={[{ required: true, message: 'Vui lòng nhập địa chỉ' }]}
                    >
                        <AutoComplete
                            options={dataSearch.map((item) => ({
                                value: item.description,
                                label: item.description,
                            }))}
                            onSelect={handleSelectAddress}
                            onSearch={setValueSearch}
                            notFoundContent={valueSearch ? 'Không tìm thấy địa chỉ' : null}
                        >
                            <Input prefix={<EnvironmentOutlined />} placeholder="Nhập địa chỉ của bạn" />
                        </AutoComplete>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}

export default PersonalInfo;
