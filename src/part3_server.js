import express from 'express';
import http from "http"
import path, { parse } from 'path';
import { instrument } from '@socket.io/admin-ui';
import { Server } from "socket.io"
//express는 http프로토콜이다

const __dirname = path.resolve();

const app = express()

app.set("view engine", "pug");
app.set("views", __dirname + "/src/views");
app.use("/public", express.static(__dirname + "/src/public"));

app.get("/", (req, res) => res.render("home"));
app.get("/*", (req, res) => res.redirect("/"));

const handleListen = () => console.log(`Listening on http://localhost:3000`)
//app.listen(3000, handleListen);

const httpServer = http.createServer(app); //http 서버
const wsServer = new Server(httpServer, {
    cors: {
        origin: ["https://admin.socket.io"],
        credentials: true,
    },
});

instrument(wsServer, {
    auth: false
});

function publicRooms() {
    const {
        sockets: {
            adapter: {sids, rooms},
        },
    } = wsServer;
    const publicRooms = [];
    rooms.forEach((_, key) => {
        if(sids.get(key) === undefined) {
            publicRooms.push(key);
        }
    })
    return publicRooms;
}

function countRoom(roomName) {
    return wsServer.sockets.adapter.rooms.get(roomName)?.size;
}

wsServer.on("connection", socket => { //어디에 있는 console.log 가능
    socket["nickname"] = "Anon";
    socket.onAny((event) => {
        console.log(wsServer.sockets.adapter);
        console.log(`Socket Event : ${event}`);
    });

    socket.on("enter_room", (roomName, done) => {
        socket.join(roomName)
        done();
        socket.to(roomName).emit("welcome", socket.nickname, countRoom(roomName));
        wsServer.sockets.emit("room_change", publicRooms());
    });

    socket.on("disconnecting",() => {
        socket.rooms.forEach(room => socket.to(room).emit("bye", socket.nickname, countRoom(room) - 1));
    });

    socket.on("disconnect", () => {
        wsServer.sockets.emit("room_change", publicRooms());
    })

    socket.on("new_message", (msg, room, done) => {
        socket.to(room).emit("new_message", `${socket.nickname}: ${msg}`);
        done();
    });
    socket.on("nickname", nickname => socket["nickname"] = nickname);
})

/*
const wss = new WebSocketServer({server});//ws 서버
//둘다 작동시킴, 필수사항은 아님, 두개가 같은 포트에 있길 원해서 이러는것

const sockets = [];


//없어도 클라이언트에서는 작동함
//버튼이 있어도 서버가 응답을 안하는것 뿐임 

wss.on("connection", (socket) => {
    sockets.push(socket);
    socket["nickname"] = "Anon";
    console.log("Connected to Brwoser ❤️");
    socket.on("close", () => console.log("Disconnected from the Browser 😢"));
    socket.on("message", (msg) => {
       const message = JSON.parse(msg.toString('utf-8'));
       switch(message.type) {
            case "new_message":
                sockets.forEach((aSocket) => aSocket.send(`${socket.nickname}: ${message.payload}`));
            case "nickname":
                socket["nickname"] = message.payload
       }
    })
})
*/

httpServer.listen(3000, handleListen);
//http로 서버를 열고 그 위에 ws을 쓰기 위함

