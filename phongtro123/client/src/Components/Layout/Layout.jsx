import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../Header/Header';
import { useSocket } from '../../hooks/useSocket';
import { message } from 'antd';
import GlobalMessaging from '../../utils/GlobalMessaging/GlobalMessaging';
import Chatbot from '../../utils/Chatbot/Chatbot';
import ChatMiniList from '../../utils/ChatMiniList/ChatMiniList';

function Layout() {
    const { dataFavourite } = useSocket();

    useEffect(() => {
        if (dataFavourite !== null) {
            return message.success(dataFavourite);
        }
    }, [dataFavourite]);

    return (
        <div className="wrapper">
            <header>
                <Header />
            </header>

            <main className="main">
                <Outlet />
            </main>

            <Chatbot />
            <ChatMiniList />
            <GlobalMessaging />
        </div>
    );
}

export default Layout;
