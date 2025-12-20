import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*', // 開発用。本番では適切なオリジンを設定する
        methods: ['GET', 'POST']
    }
});

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // 疎通確認用イベント
    socket.on('ping', () => {
        console.log('Ping received from:', socket.id);
        socket.emit('pong', { message: 'Pong from server!' });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
