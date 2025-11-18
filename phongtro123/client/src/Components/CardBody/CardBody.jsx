import classNames from 'classnames/bind';
import styles from './CardBody.module.scss';

import { DollarOutlined, HomeOutlined, EnvironmentOutlined } from '@ant-design/icons';

import imgDefault from '../../assets/images/img_default.svg';

import { Link } from 'react-router-dom';

import dayjs from 'dayjs';

const cx = classNames.bind(styles);

function CardBody({ post }) {
    return (
        <div className={cx('list-item')}>
            <Link to={`/chi-tiet-tin-dang/${post._id}`}>
                <div className={cx('parent')}>
                    <div className={cx('div1')}>
                        <img src={post.images[0] || imgDefault} alt="" />
                    </div>
                    <div className={cx('div2')}>
                        <img src={post.images[1] || imgDefault} alt="" />
                    </div>
                    <div className={cx('div3')}>
                        <img src={post.images[2] || imgDefault} alt="" />
                    </div>
                    <div className={cx('div4')}>
                        <img src={post.images[3] || imgDefault} alt="" />
                    </div>
                </div>
            </Link>
            <div className={cx('room-info')}>
                <h2 className={cx('room-title')}>
                    <HomeOutlined className={cx('icon')} />
                    {post.title}
                </h2>
                <div className={cx('room-meta')}>
                    <span className={cx('price')}>
                        <DollarOutlined className={cx('icon')} />
                        {post.price.toLocaleString()} VNĐ/tháng
                    </span>
                    <span className={cx('area')}>
                        <HomeOutlined className={cx('icon')} />
                        {post.area} m²
                    </span>
                    <span className={cx('location')}>
                        <EnvironmentOutlined className={cx('icon')} />
                        {post.location}
                    </span>
                </div>
            </div>
            <div className={cx('user-info')}>
                <img src={post.user?.avatar || imgDefault} alt="" />
                <div className={cx('info-container')}>
                    <div className={cx('user-header')}>
                        <h4>{post.user?.fullName}</h4>
                        <span>{dayjs(post.createdAt).format('HH:MM DD/MM/YYYY')}</span>
                    </div>
                    <div className={cx('user-actions')}>
                        <span>{post.phone}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CardBody;
