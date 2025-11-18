import { useEffect } from 'react';
import './App.css';
import Header from './Components/Header/Header';
import HomePage from './Components/HomePage/HomePage';
import Chatbot from './utils/Chatbot/Chatbot';
import Messager from './utils/Messager/Messager';
import { message } from 'antd';
import { useSocket } from './hooks/useSocket';

function App() {
    const { dataMessagersUser, usersMessage, setUsersMessage, dataFavourite } = useSocket();

    useEffect(() => {
        if (dataFavourite !== null) {
            return message.success(dataFavourite);
        }
    }, [dataFavourite]);

    return (
        <div className="wrapper">
            <header>
                <Header
                    dataMessagersUser={dataMessagersUser}
                    usersMessage={usersMessage}
                    setUsersMessage={setUsersMessage}
                />
            </header>

            <main style={{ width: '60%', margin: '0 auto' }} className="main">
                <HomePage />
            </main>

            <Chatbot />
            <div className="messager">
                {usersMessage.map((user) => (
                    <Messager key={user.id} user={user} setUsersMessage={setUsersMessage} usersMessage={usersMessage} />
                ))}
            </div>
        </div>
    );
}

export default App;
