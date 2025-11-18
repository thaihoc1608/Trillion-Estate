const usersMap = new Map();

global.usersMap = usersMap;

const cookie = require('cookie');

const { verifyToken } = require('./tokenSevices');
class SocketServices {
    connection(socket) {
        try {
            const { token } = cookie.parse(socket.handshake.headers.cookie || '');

            if (!token) {
                return socket.disconnect();
            }

            verifyToken(token)
                .then((dataDecode) => {
                    if (dataDecode) {
                        // Lưu thông tin người dùng vào map khi kết nối thành công
                        usersMap.set(dataDecode.id.toString(), socket);
                        console.log(`User connected: ${dataDecode.id}`);

                        // Xử lý khi người dùng ngắt kết nối
                        socket.on('disconnect', () => {
                            console.log(`User disconnected: ${dataDecode.id}`);
                            usersMap.delete(dataDecode.id.toString());
                        });
                    } else {
                        socket.disconnect();
                    }
                })
                .catch((error) => {
                    console.error('Socket authentication error:', error);
                    socket.disconnect();
                });
        } catch (error) {
            console.error('Socket connection error:', error);
            return socket.disconnect();
        }
    }
}

module.exports = new SocketServices();
