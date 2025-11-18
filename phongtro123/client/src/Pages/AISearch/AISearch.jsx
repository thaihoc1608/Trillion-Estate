import classNames from 'classnames/bind';
import styles from './AISearch.module.scss';
import { useEffect, useState } from 'react';
import Header from '../../Components/Header/Header';
import { Link, useParams } from 'react-router-dom';
import { requestAddSearch, requestAISearch } from '../../config/request';
import { Spin } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

import { DollarOutlined, HomeOutlined, EnvironmentOutlined } from '@ant-design/icons';

import imgDefault from '../../assets/images/img_default.svg';

const cx = classNames.bind(styles);

function AISearch() {
    const [loading, setLoading] = useState(true);

    const { value } = useParams();

    const [dataSearch, setDataSearch] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            document.title = `Tìm kiếm cho "${value}"`;
            try {
                const res = await requestAISearch(value);
                setDataSearch(res);
                document.title = `Tìm thấy ${res.length} kết quả cho "${value}"`;
                const data = {
                    title: value,
                };
                await requestAddSearch(data);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [value]);

    const handleOpenTab = async (id) => {
        window.open(`http://localhost:5173/chi-tiet-tin-dang/${id}`);
    };

    return (
        <div>
            <header>
                <Header />
            </header>

            <main className={cx('main')}>
                {loading ? (
                    <div className={cx('loading-container')}>
                        <div className={cx('spin-icon')}>
                            <SearchOutlined className={cx('search-icon')} />
                            <Spin size="large" />
                        </div>
                        <p className={cx('loading-text')}>Đang tìm kiếm kết quả phù hợp cho "{value}"</p>
                        <p className={cx('loading-subtext')}>Vui lòng đợi trong giây lát...</p>
                    </div>
                ) : (
                    <div className={cx('new-posts')}>
                        {dataSearch.map((item) => (
                            <div onClick={() => handleOpenTab(item._id)} className={cx('list-item')}>
                                <div className={cx('parent')}>
                                    <div className={cx('div1')}>
                                        <img src={item.images[0] || imgDefault} alt="" />
                                    </div>
                                    <div className={cx('div2')}>
                                        <img src={item.images[1] || imgDefault} alt="" />
                                    </div>
                                    <div className={cx('div3')}>
                                        <img src={item.images[2] || imgDefault} alt="" />
                                    </div>
                                    <div className={cx('div4')}>
                                        <img src={item.images[3] || imgDefault} alt="" />
                                    </div>
                                </div>
                                <div className={cx('room-info')}>
                                    <h2 className={cx('room-title')}>
                                        <HomeOutlined className={cx('icon')} />
                                        {item.title}
                                    </h2>
                                    <div className={cx('room-meta')}>
                                        <span className={cx('price')}>
                                            <DollarOutlined className={cx('icon')} />
                                            {item.price.toLocaleString()} VNĐ/tháng
                                        </span>
                                        <span className={cx('area')}>
                                            <HomeOutlined className={cx('icon')} />
                                            {item.area} m²
                                        </span>
                                        <span className={cx('location')}>
                                            <EnvironmentOutlined className={cx('icon')} />
                                            {item.location}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

export default AISearch;
