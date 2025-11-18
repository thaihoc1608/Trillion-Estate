import { UploadOutlined } from '@ant-design/icons';
import {
    AutoComplete,
    Button,
    Checkbox,
    Col,
    Divider,
    Form,
    Input,
    InputNumber,
    message,
    Row,
    Select,
    Statistic,
    Table,
    Typography,
    Upload,
} from 'antd';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { useEffect, useState } from 'react';
dayjs.extend(utc);

import { Editor } from '@tinymce/tinymce-react';
import { requestCreatePost, requestUploadImages } from '../../../../config/request';

const { Option } = Select;
const { Title } = Typography;

import axios from 'axios';
import useDebounce from '../../../../hooks/useDebounce';

// Helper function for Upload component
const normFile = (e) => {
    if (Array.isArray(e)) {
        return e;
    }
    return e && e.fileList;
};

const dataSource = [
    {
        key: '1',
        typeNews: 'Tin VIP',
        '3 ngày': 50000,
        '7 ngày': 315000,
        '30 ngày': 1200000,
    },
    {
        key: '2',
        typeNews: 'Tin thường',
        '3 ngày': 10000,
        '7 ngày': 50000,
        '30 ngày': 1000000,
    },
];

const columns = [
    {
        title: 'Loại Tin',
        dataIndex: 'typeNews',
        key: 'typeNews',
    },
    {
        title: '3 ngày',
        dataIndex: '3 ngày',
        key: '3 ngày',
        render: (price) => (typeof price === 'number' ? `${price.toLocaleString('vi-VN')} VNĐ` : price),
    },
    {
        title: '7 ngày',
        dataIndex: '7 ngày',
        key: '7 ngày',
        render: (price) => (typeof price === 'number' ? `${price.toLocaleString('vi-VN')} VNĐ` : price),
    },
    {
        title: '30 ngày',
        dataIndex: '30 ngày',
        key: '30 ngày',
        render: (price) => (typeof price === 'number' ? `${price.toLocaleString('vi-VN')} VNĐ` : price),
    },
];

// Checkbox options list (from ManagerPost.jsx for consistency, or define here)
const optionLabels = [
    'Đầy đủ nội thất',
    'Có gác',
    'Có kệ bếp',
    'Có máy lạnh',
    'Có máy giặt',
    'Có tủ lạnh',
    'Có thang máy',
    'Không chung chủ',
    'Giờ giấc tự do',
    'Có bảo vệ 24/24',
    'Có hầm để xe',
];

// Example suggestions for AutoComplete

const durationOptions = [
    { label: '3 ngày', value: 3 },
    { label: '7 ngày', value: 7 },
    { label: '30 ngày', value: 30 },
];

function AddPostForm({ onFinish, onCancel, initialValues }) {
    const [form] = Form.useForm();
    const [fileList, setFileList] = useState([]);
    const [description, setDescription] = useState(initialValues?.description || '');
    const [valueSearch, setValueSearch] = useState('');
    const [dataSearch, setDataSearch] = useState([]);
    const debouncedSearch = useDebounce(valueSearch, 500);
    const [mapQuery, setMapQuery] = useState(initialValues?.address || 'Lăng Chủ tịch Hồ Chí Minh');
    const [dateEnd, setDateEnd] = useState(null);

    // State for calculated cost
    const [estimatedCost, setEstimatedCost] = useState(0);

    // Get form values to watch for changes
    const selectedDuration = Form.useWatch('duration', form);
    const selectedTypeNews = Form.useWatch('typeNews', form);

    // Effect to recalculate cost based on duration and typeNews
    useEffect(() => {
        let calculatedCost = 0;
        if (selectedDuration && selectedTypeNews) {
            // Corrected Find Logic:
            const selectedTier = dataSource.find((item) => {
                // Check if the item matches the selected type ('vip' or 'normal')
                const itemTypeKey = item.typeNews === 'Tin VIP' ? 'vip' : 'normal';
                return itemTypeKey === selectedTypeNews;
            });

            if (selectedTier) {
                const durationKey = `${selectedDuration} ngày`;
                setDateEnd(selectedDuration);
                calculatedCost = selectedTier[durationKey] || 0;
            }
        }
        setEstimatedCost(calculatedCost);
    }, [selectedDuration, selectedTypeNews]);

    useEffect(() => {
        const fetchData = async () => {
            if (debouncedSearch) {
                const res = await axios.get(`https://rsapi.goong.io/Place/AutoComplete`, {
                    params: {
                        input: debouncedSearch,
                        api_key: import.meta.env.VITE_API_KEY,
                    },
                });
                setDataSearch(res.data.predictions);
            }
        };
        fetchData();
    }, [debouncedSearch]);

    useEffect(() => {
        if (initialValues) {
            const initialData = {
                ...initialValues,
                location: initialValues.address,
                options: Array.isArray(initialValues.options) ? initialValues.options : [],
            };
            form.setFieldsValue(initialData);
            if (initialValues.description) {
                setDescription(initialValues.description);
            }
            setMapQuery(initialValues.address || 'Lăng Chủ tịch Hồ Chí Minh');

            if (initialValues.images && Array.isArray(initialValues.images)) {
                setFileList(
                    initialValues.images.map((img, index) => {
                        if (img && typeof img === 'object' && img.uid) {
                            return img;
                        }
                        const name =
                            typeof img === 'string'
                                ? img.substring(img.lastIndexOf('/') + 1)
                                : `image-${index + 1}.png`;
                        return {
                            uid: `-${index + 1}`,
                            name: name,
                            status: 'done',
                            url: typeof img === 'string' ? img : undefined,
                            thumbUrl: typeof img === 'string' ? img : undefined,
                        };
                    }),
                );
            } else {
                setFileList([]);
            }
        } else {
            form.resetFields();
            setFileList([]);
            setDescription('');
            setMapQuery('Lăng Chủ tịch Hồ Chí Minh');
            setEstimatedCost(0);
        }
    }, [initialValues, form]);

    const handleFinish = async (values) => {
        try {
            const formData = new FormData();
            fileList.forEach((file) => {
                formData.append('images', file.originFileObj);
            });
            // Calculate endDate based on selected duration
            const today = dayjs();
            const endDate = values.duration ? today.add(values.duration, 'day').utc().toISOString() : null;
            const resImages = await requestUploadImages(formData);
            const data = {
                title: values.title,
                price: values.price,
                description: description,
                category: values.category,
                area: values.area,
                phone: values.phone,
                username: values.username,
                options: values.options,
                location: values.location,
                typeNews: values.typeNews,
                endDate: endDate,
                images: resImages.images,
                dateEnd,
            };

            await requestCreatePost(data);
            message.success(initialValues ? 'cập nhật bài viết thành công' : 'tạo bài viết thành công');
            form.resetFields();
            setFileList([]);
            setDescription('');
            setEstimatedCost(0);
            onFinish(data);
        } catch (error) {
            message.error(error.response.data.message || 'Có lỗi xảy ra khi tạo/cập nhật bài viết.');
        }
    };

    const handleCancel = () => {
        form.resetFields();
        setFileList([]);
        setDescription('');
        setEstimatedCost(0);
        onCancel();
    };

    const handleUploadChange = ({ fileList: newFileList }) => {
        setFileList(newFileList);
    };

    // Handler for AutoComplete search input change
    const handleLocationSearch = (searchText) => {
        setValueSearch(searchText);
    };

    // Handler for selecting an item from AutoComplete
    const handleLocationSelect = (selectedValue) => {
        form.setFieldsValue({ location: selectedValue });
        setMapQuery(selectedValue);
    };

    return (
        <Form form={form} layout="vertical" onFinish={handleFinish}>
            <Title level={5}>Thông tin cơ bản</Title>
            <Row gutter={24}>
                <Col span={12}>
                    <Form.Item
                        name="title"
                        label="Tiêu đề"
                        rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}
                    >
                        <Input placeholder="Ví dụ: Phòng trọ giá rẻ gần DH Bách Khoa" />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item
                        name="price"
                        label="Giá (VNĐ/tháng)"
                        rules={[{ required: true, message: 'Vui lòng nhập giá' }]}
                    >
                        <InputNumber
                            style={{ width: '100%' }}
                            min={0}
                            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                            placeholder="Ví dụ: 2,500,000"
                        />
                    </Form.Item>
                </Col>
            </Row>

            <div style={{ width: '100%' }}>
                <Editor
                    apiKey="hfm046cu8943idr5fja0r5l2vzk9l8vkj5cp3hx2ka26l84x"
                    init={{
                        plugins:
                            'anchor autolink charmap codesample emoticons image link lists media searchreplace table visualblocks wordcount',
                        toolbar:
                            'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table | align lineheight | numlist bullist indent outdent | emoticons charmap | removeformat',
                    }}
                    initialValue="Mô tả phòng trọ"
                    onEditorChange={(content, editor) => setDescription(content)}
                />
            </div>

            <Divider />

            <Title level={5}>Thông tin chi tiết</Title>
            <Row gutter={24}>
                <Col span={12}>
                    <Form.Item
                        name="category"
                        label="Loại hình"
                        rules={[{ required: true, message: 'Vui lòng chọn loại hình' }]}
                    >
                        <Select placeholder="Chọn loại hình">
                            <Option value="phong-tro">Phòng trọ</Option>
                            <Option value="nha-nguyen-can">Nhà nguyên căn</Option>
                            <Option value="can-ho-chung-cu">Căn hộ chung cư</Option>
                            <Option value="can-ho-mini">Căn hộ mini</Option>
                        </Select>
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item
                        name="area"
                        label="Diện tích (m²)"
                        rules={[{ required: true, message: 'Vui lòng nhập diện tích' }]}
                    >
                        <InputNumber style={{ width: '100%' }} min={1} placeholder="Ví dụ: 25" />
                    </Form.Item>
                </Col>
            </Row>

            <Divider />

            <Title level={5}>Thông tin liên hệ</Title>
            <Row gutter={24}>
                <Col span={12}>
                    <Form.Item
                        name="username"
                        label="Tên người đăng"
                        rules={[{ required: true, message: 'Vui lòng nhập tên người đăng' }]}
                    >
                        <Input placeholder="Tên người cho thuê" />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item
                        name="phone"
                        label="Số điện thoại liên hệ"
                        rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
                    >
                        <Input placeholder="Số điện thoại người đăng" />
                    </Form.Item>
                </Col>
            </Row>

            <Form.Item
                name="location"
                label="Địa chỉ"
                rules={[{ required: true, message: 'Vui lòng nhập hoặc chọn địa chỉ' }]}
            >
                <AutoComplete
                    options={dataSearch?.map((item) => ({ value: item.description }))}
                    onSearch={handleLocationSearch}
                    onSelect={handleLocationSelect}
                    placeholder="Nhập địa chỉ hoặc chọn từ gợi ý..."
                >
                    <Input />
                </AutoComplete>
            </Form.Item>

            <div>
                <h4 style={{ marginBottom: 16 }}>Vị trí & bản đồ</h4>
                <iframe
                    src={`https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`}
                    width="100%" // Dùng width 100% thay vì cố định
                    height="450"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Property Location"
                />
            </div>

            <Divider />

            <Title level={5}>Hình ảnh</Title>
            <Form.Item name="images" valuePropName="fileList" getValueFromEvent={normFile}>
                <Upload
                    listType="picture-card"
                    multiple
                    beforeUpload={() => false}
                    fileList={fileList}
                    onChange={handleUploadChange}
                    accept="image/*"
                >
                    {fileList.length >= 8 ? null : (
                        <div>
                            <UploadOutlined />
                            <div style={{ marginTop: 8 }}>Tải ảnh lên</div>
                        </div>
                    )}
                </Upload>
            </Form.Item>

            <Divider />

            <Title level={5}>Tiện nghi & Tùy chọn</Title>
            <Form.Item name="options">
                <Checkbox.Group style={{ width: '100%' }}>
                    <Row gutter={[16, 16]}>
                        {optionLabels.map((label) => (
                            <Col xs={24} sm={12} md={8} key={label}>
                                <Checkbox value={label}>{label}</Checkbox>
                            </Col>
                        ))}
                    </Row>
                </Checkbox.Group>
            </Form.Item>

            <Divider />

            <Row gutter={24} align="bottom">
                <Col xs={24} md={8}>
                    <Form.Item
                        name="typeNews"
                        label="Loại tin"
                        rules={[{ required: true, message: 'Vui lòng chọn loại tin' }]}
                    >
                        <Select placeholder="Chọn loại tin">
                            <Option value="vip">Tin VIP</Option>
                            <Option value="normal">Tin thường</Option>
                        </Select>
                    </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                    <Form.Item
                        name="duration"
                        label="Thời gian đăng"
                        rules={[{ required: true, message: 'Vui lòng chọn thời gian đăng' }]}
                    >
                        <Select placeholder="Chọn số ngày">
                            {durationOptions.map((opt) => (
                                <Option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                </Col>
                <Col xs={24} md={8} style={{ paddingBottom: '24px' }}>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Statistic
                                title="Tạm tính (VNĐ)"
                                value={estimatedCost > 0 ? estimatedCost : '-'}
                                precision={0}
                                formatter={(value) =>
                                    typeof value === 'number' ? value.toLocaleString('vi-VN') : value
                                }
                            />
                        </Col>
                    </Row>
                </Col>
            </Row>

            <div style={{ marginBottom: 24 }}>
                <h4 style={{ marginBottom: 16 }}>Bảng giá dịch vụ</h4>
                <Table dataSource={dataSource} columns={columns} pagination={false} size="small" bordered />
            </div>

            <Form.Item style={{ marginTop: 24, textAlign: 'right' }}>
                <Button onClick={handleCancel} style={{ marginRight: 8 }}>
                    Hủy
                </Button>
                <Button type="primary" htmlType="submit">
                    {initialValues ? 'Cập nhật bài viết' : 'Thêm bài viết'}
                </Button>
            </Form.Item>
        </Form>
    );
}

export default AddPostForm;
