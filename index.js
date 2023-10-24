import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
});

app.get('/', (req, res) => {
    res.status(200);
});

const rooms = {};
const roomParts = {};

io.on('connection', (socket) => {
    console.log('a user connected');
    console.log(socket.id);
    socket.on('roomJoined', roomId=>{
        console.log("joined",roomId,socket.id);
        if(!roomId) return;
        if(rooms[roomId]?.find(({socketId})=>socketId==socket.id)) return;
        roomParts[roomId] = roomParts[roomId] ? [...roomParts[roomId], {
            socketId: socket.id
        }] : [{
            socketId: socket.id
        }];
        if(roomParts[roomId].length-1){
            console.log(`Asking for ${roomParts[roomId].length-1} offers`);
            socket.emit('createOffers', {
                sockets: roomParts[roomId].filter(({socketId})=>socketId!=socket.id).map(({socketId})=>socketId),
                roomId
            });
        }
        console.log(roomParts);
    });
    socket.on('offersCreated', (roomId, offers)=>{
        console.log(`Offers created for ${roomId}`,offers);
        if(!roomId) return;
        offers.forEach(({offer,to})=>{
            socket.to(to).emit('acceptOffer', {
                offer,
                sender: socket.id,
                roomId
            });
        });
    });
    socket.on('answerCreated', ({roomId, answer, receiver})=>{
        console.log(`Answer created for ${roomId} from ${socket.id} to ${receiver}`);
        if(!roomId) return;
        socket.to(receiver).emit('saveAnswer', {
            answer,
            sender: socket.id,
        });
    })
    socket.on('negoOffer', ({offer, to})=>{
        console.log(`Nego offer from ${socket.id} to ${to}`);
        socket.to(to).emit('negoOfferAccept', {
            offer,
            sender: socket.id,
        });
    })
    socket.on('negoAnswerCreated', ({answer, to})=>{
        console.log(`Nego answer from ${socket.id} to ${to}`);
        socket.to(to).emit('negoSaveAnswer', {
            answer,
            sender: socket.id,
        });
    });
    socket.on('iceCandidate', ({candidate, to})=>{
        console.log(`Ice candidate from ${socket.id} to ${to}`);
        socket.to(to).emit('saveIceCandidate', {
            candidate,
            sender: socket.id,
        });
    });
    socket.on('streamStopped', (to, type)=>{
        console.log(`${type} stream stopped from ${socket.id} to ${to}`);
        socket.to(to).emit('clearTracks', socket.id, type);
    })
    socket.on('roomLeft', roomId=>{
        socket.leave(roomId);
        console.log('room left');
    })
    socket.on('chatSend', (to, message)=>{
        console.log(`Chat message from ${socket.id} to ${to}`,message);
        socket.to(to).emit('receiveChat', {
            message,
            sender: socket.id,
        });
    });
    socket.on('disconnect', () => {
        for(let key in roomParts){
            if(roomParts[key].find(({socketId})=>socketId==socket.id)){
                roomParts[key] = roomParts[key].filter(({socketId})=>socketId!=socket.id);
                roomParts[key].forEach(({socketId})=>{
                    socket.to(socketId).emit('socketDisconnected', socket.id);
                });
            }
        }
        console.log('A client disconnected.');
    });
});

const PORT = process.env.PORT || 8000;

server.listen(PORT, () => {
  console.log('server running at http://localhost:8000');
});