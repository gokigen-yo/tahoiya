"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var http_1 = require("http");
var socket_io_1 = require("socket.io");
var cors_1 = require("cors");
var app = (0, express_1.default)();
app.use((0, cors_1.default)());
var server = http_1.default.createServer(app);
var io = new socket_io_1.Server(server, {
    cors: {
        origin: '*', // 開発用。本番では適切なオリジンを設定する
        methods: ['GET', 'POST']
    }
});
io.on('connection', function (socket) {
    console.log('A user connected:', socket.id);
    // 疎通確認用イベント
    socket.on('ping', function () {
        console.log('Ping received from:', socket.id);
        socket.emit('pong', { message: 'Pong from server!' });
    });
    socket.on('disconnect', function () {
        console.log('User disconnected:', socket.id);
    });
});
var PORT = process.env.PORT || 3001;
server.listen(PORT, function () {
    console.log("Server is running on port ".concat(PORT));
});
