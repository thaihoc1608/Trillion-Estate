import Context from './Context';
import CryptoJS from 'crypto-js';

import cookies from 'js-cookie';

import { useEffect, useState } from 'react';
import { requestAuth, requestSearch } from '../config/request';

import useDebounce from '../hooks/useDebounce';

export function Provider({ children }) {
    const [dataUser, setDataUser] = useState({});
    const [dataPayment, setDataPayment] = useState(null);
    const [dataMessages, setDataMessages] = useState([]);
    // State cho các cửa sổ chat đang mở
    const [globalUsersMessage, setGlobalUsersMessage] = useState([]);

    const fetchAuth = async () => {
        const res = await requestAuth();
        const bytes = CryptoJS.AES.decrypt(res.metadata.auth, import.meta.env.VITE_SECRET_CRYPTO);
        const originalText = bytes.toString(CryptoJS.enc.Utf8);
        const user = JSON.parse(originalText);
        setDataUser(user);
    };

    useEffect(() => {
        const token = cookies.get('logged');

        if (!token) {
            return;
        }
        fetchAuth();
    }, []);

    const [valueSearch, setValueSearch] = useState('');
    const debouncedSearch = useDebounce(valueSearch, 500);

    const [dataSearch, setDataSearch] = useState([]);
    useEffect(() => {
        const fetchData = async () => {
            const res = await requestSearch(debouncedSearch);
            setDataSearch(res.metadata);
        };
        fetchData();
    }, [debouncedSearch]);

    return (
        <Context.Provider
            value={{
                dataUser,
                dataPayment,
                setDataPayment,
                fetchAuth,
                dataSearch,
                setValueSearch,
                dataMessages,
                setDataMessages,
                globalUsersMessage,
                setGlobalUsersMessage,
            }}
        >
            {children}
        </Context.Provider>
    );
}
