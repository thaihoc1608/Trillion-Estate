import classNames from 'classnames/bind';
import styles from './RechargeUser.module.scss';
import { Form, Input, Radio, Button, Row, Col, InputNumber, Image, Modal, Result, Table, Tag, Typography } from 'antd';
import { useState, useEffect } from 'react';
import { requestGetRechargeUser, requestPayments } from '../../../../config/request';
import { useStore } from '../../../../hooks/useStore';

import dayjs from 'dayjs';

const { Title } = Typography;
const cx = classNames.bind(styles);

function RechargeUser() {
    const [form] = Form.useForm();
    const [paymentMethod, setPaymentMethod] = useState(null);
    const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
    const [paymentData, setPaymentData] = useState(null);
    const [paymentHistory, setPaymentHistory] = useState([]);
    const [loading, setLoading] = useState(false);

    const { dataPayment, setDataPayment } = useStore();

    useEffect(() => {
        fetchPaymentHistory();
    }, []);

    useEffect(() => {
        if (dataPayment) {
            setPaymentData(dataPayment);
            setIsSuccessModalVisible(true);
            setTimeout(() => {
                setDataPayment(null);
            }, 3000);
            // Refresh payment history after successful payment
            fetchPaymentHistory();
        }
    }, [dataPayment]);

    const fetchPaymentHistory = async () => {
        setLoading(true);
        try {
            const res = await requestGetRechargeUser();
            setPaymentHistory(res.metadata);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch payment history:', error);
            setLoading(false);
        }
    };

    const handlePaymentMethodChange = (e) => {
        setPaymentMethod(e.target.value);
    };

    const handleSubmit = async (values) => {
        const data = {
            typePayment: paymentMethod,
            amountUser: values.amount,
        };
        if (paymentMethod === 'MOMO') {
            const res = await requestPayments(data);
            window.open(res.metadata.payUrl, '_blank');
        }
        if (paymentMethod === 'VNPAY') {
            const res = await requestPayments(data);
            window.open(res.metadata, '_blank');
        }
    };

    const handleModalClose = () => {
        setIsSuccessModalVisible(false);
        form.resetFields();
    };

    const formatCurrency = (amount) => {
        return Number(amount).toLocaleString('vi-VN') + ' VND';
    };

    const columns = [
        {
            title: 'Mã giao dịch',
            dataIndex: '_id',
            key: '_id',
            width: 120,
        },
        {
            title: 'Số tiền',
            dataIndex: 'amount',
            key: 'amount',
            render: (amount) => formatCurrency(amount),
            width: 150,
        },
        {
            title: 'Phương thức',
            dataIndex: 'typePayment',
            key: 'typePayment',
            render: (type) => {
                let color = type === 'MOMO' ? 'pink' : 'blue';
                return <Tag color={color}>{type}</Tag>;
            },
            width: 120,
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                let color = 'green';
                let text = 'Thành công';

                if (status === 'pending') {
                    color = 'orange';
                    text = 'Đang xử lý';
                } else if (status === 'failed') {
                    color = 'red';
                    text = 'Thất bại';
                }

                return <Tag color={color}>{text}</Tag>;
            },
            width: 120,
        },
        {
            title: 'Ngày giao dịch',
            dataIndex: 'date',
            key: 'date',
            render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm'),
            width: 180,
        },
    ];

    return (
        <div className={cx('wrapper')}>
            <Row gutter={[0, 24]}>
                <Col span={24}>
                    <div className={cx('recharge-form')}>
                        <h2>Nạp tiền vào tài khoản</h2>
                        <Form form={form} layout="vertical" onFinish={handleSubmit}>
                            <Form.Item
                                label="Số tiền cần nạp"
                                name="amount"
                                rules={[
                                    {
                                        required: true,
                                        message: 'Vui lòng nhập số tiền cần nạp',
                                    },
                                ]}
                            >
                                <InputNumber
                                    className={cx('amount-input')}
                                    min={10000}
                                    step={10000}
                                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                                    addonAfter="VND"
                                    style={{ width: '100%' }}
                                />
                            </Form.Item>

                            <Form.Item
                                label="Phương thức thanh toán"
                                name="paymentMethod"
                                rules={[
                                    {
                                        required: true,
                                        message: 'Vui lòng chọn phương thức thanh toán',
                                    },
                                ]}
                            >
                                <Radio.Group onChange={handlePaymentMethodChange}>
                                    <Radio.Button value="VNPAY">VNPay</Radio.Button>
                                    <Radio.Button value="MOMO">MoMo</Radio.Button>
                                </Radio.Group>
                            </Form.Item>

                            <Form.Item>
                                <Button type="primary" htmlType="submit" className={cx('recharge-button')} block>
                                    Nạp tiền
                                </Button>
                            </Form.Item>
                        </Form>
                    </div>
                </Col>

                <Col span={24}>
                    <div className={cx('payment-history')}>
                        <Title level={4}>Lịch sử nạp tiền</Title>
                        <Table
                            dataSource={paymentHistory}
                            columns={columns}
                            rowKey="id"
                            loading={loading}
                            pagination={{ pageSize: 5 }}
                            className={cx('history-table')}
                            scroll={{ x: 'max-content' }}
                        />
                    </div>
                </Col>
            </Row>

            {/* Success Modal */}
            <Modal
                open={isSuccessModalVisible}
                footer={null}
                onCancel={handleModalClose}
                centered
                className={cx('success-modal')}
            >
                <Result
                    status="success"
                    title="Nạp tiền thành công!"
                    subTitle={
                        paymentData && (
                            <div className={cx('payment-details')}>
                                <p>
                                    Số tiền đã nạp: <strong>{formatCurrency(paymentData?.amount)}</strong>
                                </p>
                                <p>Tài khoản của bạn đã được cập nhật</p>
                                <p>Ngày nạp: {dayjs(paymentData?.date).format('DD/MM/YYYY')}</p>
                                <p>Phương thức thanh toán: {paymentData?.typePayment}</p>
                            </div>
                        )
                    }
                    extra={[
                        <Button type="primary" key="console" onClick={handleModalClose}>
                            Đóng
                        </Button>,
                    ]}
                />
            </Modal>
        </div>
    );
}

export default RechargeUser;
