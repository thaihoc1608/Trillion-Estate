import classNames from 'classnames/bind';
import styles from './Header.module.scss';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../../assets/images/logo.svg';
import { Dropdown, Menu, Avatar, Space } from 'antd';
import { UserOutlined, LogoutOutlined, ProfileOutlined, SearchOutlined } from '@ant-design/icons';

import { useStore } from '../../hooks/useStore';
import { useState } from 'react';
import { requestLogout } from '../../config/request';
import { useSocket } from '../../hooks/useSocket';

const cx = classNames.bind(styles);

function Header() {
    const { dataUser, dataSearch, setValueSearch } = useStore();
    const { dataMessagersUser } = useSocket();

    const navigate = useNavigate();

    const [isSearchFocused, setIsSearchFocused] = useState(false);

    const handleLogout = async () => {
        try {
            await requestLogout();
            setTimeout(() => {
                window.location.reload();
            }, 1000);
            navigate('/');
        } catch (error) {
            console.log(error);
        }
    };

    const menu = (
        <Menu
            items={[
                {
                    key: 'profile',
                    icon: <ProfileOutlined />,
                    label: <Link to="/trang-ca-nhan">Trang cá nhân</Link>,
                },
                {
                    key: 'logout',
                    icon: <LogoutOutlined />,
                    label: 'Đăng xuất',
                    onClick: handleLogout,
                },
            ]}
        />
    );

    const handleNavigateSearch = (value) => {
        navigate(`/search/${value}`);
    };

    return (
        <div className={cx('wrapper')}>
            <div className={cx('inner')}>
                <Link to="/">
                    <div>
                        <img src={logo} alt="Logo PhongTro123" />
                    </div>
                </Link>

                <div className={cx('search')}>
                    <input
                        type="text"
                        placeholder="Tìm kiếm...."
                        onChange={(e) => setValueSearch(e.target.value)}
                        onFocus={() => setIsSearchFocused(true)}
                        onBlur={() => {
                            setTimeout(() => setIsSearchFocused(false), 200);
                        }}
                    />
                    {isSearchFocused && (
                        <div className={cx('result-search')}>
                            <ul>
                                {dataSearch.map((item, index) => (
                                    <li onClick={() => handleNavigateSearch(item.title)} key={index}>
                                        <span>
                                            <SearchOutlined /> {item.title}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
                <div className={cx('actions')}>
                    {dataUser._id ? (
                        <>
                            <Dropdown overlay={menu} placement="bottomRight">
                                <a onClick={(e) => e.preventDefault()} className={cx('user-menu-link')}>
                                    <Space>
                                        <Avatar
                                            size="large"
                                            src={dataUser.avatar || null}
                                            icon={!dataUser.avatar ? <UserOutlined /> : null}
                                        />
                                        <span className={cx('user-name')}>{dataUser.fullName || 'User'}</span>
                                    </Space>
                                </a>
                            </Dropdown>
                        </>
                    ) : (
                        <>
                            <Link to="/login">
                                <button className={cx('btn-login')}>Đăng nhập</button>
                            </Link>
                            <Link to="/register">
                                <button className={cx('btn-register')}>Đăng ký</button>
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Header;
