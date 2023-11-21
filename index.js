import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { firestore } from './firebase';
import { collection, getDocs, query as firebaseQuery, where } from 'firebase/firestore'
import { randomUUID } from 'crypto'

// Instantiate express
const app = express();

// Create http server and wrap the express app
const server = http.createServer(app);

// Instantiate socket.io
const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
});

/**
 * Handle GET request to the root URL
 */
app.get('/', (req, res) => {
    res.status(200);
});

/**
 * Store room participants and temporary secrets
 */
const roomParts = {};
const tempSecrets = new Map();

/**
 * Handle socket connection
 */
io.on('connection', (socket) => {
    console.log('a user connected');
    console.log(socket.id);

    /**
     * Handle request to join a room
     * @param {string} roomId - The ID of the room
     * @param {object} user - The user object
     */
    socket.on('requestJoinRoom', (roomId, user)=>{
        try {
            if(!roomId) return;
            console.log("requesting",roomId,socket.id);
            roomParts[roomId]?.forEach(({socketId})=>{
                socket.to(socketId).emit('userRequestJoinRoom', {
                    user,
                    socketId: socket.id
                })
            });
        } catch (error) {
            console.log(error);
        }
    });

    /**
     * Handle room joined event
     * @param {string} roomId - The ID of the room
     * @param {string} secret - The secret for room authentication
     */
    socket.on('roomJoined', async (roomId, secret)=>{
        try {
            console.log("joined",roomId,socket.id);
            if(!roomId) return;
            const roomsRef = collection(firestore, 'rooms');
            const roomQuery =  firebaseQuery(roomsRef, where('roomId', '==', roomId));
            const result = await getDocs(roomQuery);
            if(result.docs[0].data().secret!=secret){
                const tempSecret = tempSecrets.get(roomId).find(({secret: tempSecret})=>tempSecret==secret)
                if(!tempSecret)
                    return;
                else if(tempSecret.expiry<Date.now()){
                    tempSecrets.set(roomId, tempSecrets.get(roomId).filter(({secret: tempSecret})=>tempSecret!=secret));
                    return;
                }
            }
            if(roomParts[roomId]?.find(({socketId})=>socketId==socket.id)) return;
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
        } catch (error) {
            console.log(error);
        }
    });

    /**
     * Handle user accepted event
     * @param {string} roomId - The ID of the room
     * @param {string} socketId - The ID of the socket
     */
    socket.on('userAccepted', (roomId, socketId)=>{
        console.log(`Accepted from ${socket.id} to ${socketId} on ${roomId}`);
        if(!roomId) return;
        const tempSecret = randomUUID();
        tempSecrets.set(roomId, [
            ...tempSecrets.get(roomId) || [],
            {
                secret: tempSecret,
                socketId,
                expiry : Date.now()+1000*60*5
            }
        ]
        );
        socket.to(socketId).emit('joinRequestAccepted',
            roomId,
            tempSecret
        );
    });

    /**
     * Handle offers created event
     * @param {string} roomId - The ID of the room
     * @param {Array} offers - Array of offers
     */
    socket.on('offersCreated', (roomId, offers)=>{
        console.log(`Offers created for ${roomId}`,offers);
        if(!roomId) return;
        offers.forEach(({offer,to,senderDetails})=>{
            socket.to(to).emit('acceptOffer', {
                offer,
                sender: socket.id,
                senderDetails,
                roomId
            });
        });
    });

    /**
     * Handle answer created event
     * @param {object} data - The answer data
     * @param {string} data.roomId - The ID of the room
     * @param {string} data.answer - The answer
     * @param {string} data.receiver - The ID of the receiver socket
     * @param {object} data.senderDetails - The details of the sender
     */
    socket.on('answerCreated', ({roomId, answer, receiver, senderDetails})=>{
        console.log(`Answer created for ${roomId} from ${socket.id} to ${receiver}`);
        if(!roomId) return;
        socket.to(receiver).emit('saveAnswer', {
            answer,
            sender: socket.id,
            senderDetails
        });
    })

    /**
     * Handle negotiation offer event
     * @param {object} data - The negotiation offer data
     * @param {string} data.offer - The offer
     * @param {string} data.to - The ID of the receiver socket
     */
    socket.on('negoOffer', ({offer, to})=>{
        console.log(`Nego offer from ${socket.id} to ${to}`);
        socket.to(to).emit('negoOfferAccept', {
            offer,
            sender: socket.id,
        });
    })

    /**
     * Handle negotiation answer created event
     * @param {object} data - The negotiation answer data
     * @param {string} data.answer - The answer
     * @param {string} data.to - The ID of the receiver socket
     */
    socket.on('negoAnswerCreated', ({answer, to})=>{
        console.log(`Nego answer from ${socket.id} to ${to}`);
        socket.to(to).emit('negoSaveAnswer', {
            answer,
            sender: socket.id,
        });
    });

    /**
     * Handle ICE candidate event
     * @param {object} data - The ICE candidate data
     * @param {string} data.candidate - The ICE candidate
     * @param {string} data.to - The ID of the receiver socket
     */
    socket.on('iceCandidate', ({candidate, to})=>{
        console.log(`Ice candidate from ${socket.id} to ${to}`);
        socket.to(to).emit('saveIceCandidate', {
            candidate,
            sender: socket.id,
        });
    });

    /**
     * Handle stream stopped event
     * @param {string} to - The ID of the receiver socket
     * @param {string} type - The type of stream
     */
    socket.on('streamStopped', (to, type)=>{
        console.log(`${type} stream stopped from ${socket.id} to ${to}`);
        socket.to(to).emit('clearTracks', socket.id, type);
    })

    /**
     * Handle chat send event
     * @param {string} to - The ID of the receiver socket
     * @param {string} message - The chat message
     */
    socket.on('chatSend', (to, message)=>{
        console.log(`Chat message from ${socket.id} to ${to}`);
        socket.to(to).emit('receiveChat', {
            message,
            sender: socket.id,
        });
    });

    /**
     * Handle socket disconnect event
     */
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

// Listen for connections on PORT
const PORT = process.env.PORT || 8000;

// Start server
server.listen(PORT, () => {
  console.log('server running at http://localhost:8000');
});