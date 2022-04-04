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

const httpServer = http.createServer(app);
const wsServer = new Server(httpServer);

wsServer.on("connection", socket => {
    socket.on("join_room", (roomName) => {
        socket.join(roomName);
        socket.to(roomName).emit("welcome");
    }) 
    socket.on("offer", (offer, roomName) => {
        socket.to(roomName).emit("offer", offer);
    });
    socket.on("answer", (answer, roomName) => {
        socket.to(roomName).emit("answer", answer);
    })
    socket.on("ice", (ice, roomName) => {
        socket.to(roomName).emit("ice", ice);
    })
})


const handleListen = () => console.log(`Listening on http://localhost:3000`)
//app.listen(3000, handleListen);
httpServer.listen(3000, handleListen);
