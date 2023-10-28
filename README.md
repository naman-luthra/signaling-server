# WebRTC Signaling Server

Welcome to the WebRTC Signaling Server for the P2P WebRTC Video Call application. This server is built using plain JavaScript, Node.js, and Express.js, with Socket.io for real-time communication. It plays a crucial role in establishing and managing peer-to-peer WebRTC video calls.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Getting Started](#getting-started)
- [Real-Time Signaling](#real-time-signaling)
- [Contributing](#contributing)
- [License](#license)

## Overview

This signaling server is an integral part of the P2P WebRTC Video Call application, responsible for facilitating the exchange of WebRTC signaling data between clients. It allows users to discover and connect to each other for real-time video communication.

## Features

- **WebRTC Signaling:** Handles the signaling process for establishing WebRTC connections between clients.
- **Socket.io:** Utilizes Socket.io for real-time communication and event-based interactions.
- **Simple and Lightweight:** Built with simplicity and performance in mind, making it a robust foundation for WebRTC applications.

## Getting Started

To run this signaling server locally, follow these steps:

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/webrtc-signaling-server.git
   cd webrtc-signaling-server

2. Install the dependencies:
   
   ```bash
   npm install

3. Start the application:

    ```bash
    npm run start

## Real-Time Signaling

This signaling server plays a critical role in WebRTC communication:

- **Offer/Answer Exchange:** Handles the exchange of SDP (Session Description Protocol) offers and answers between clients.
- **ICE Candidate Exchange:** Facilitates the exchange of ICE (Interactive Connectivity Establishment) candidates, necessary for establishing peer-to-peer connections.
- **Room Management:** Manages rooms where clients can join and communicate, ensuring privacy and scalability.

Integrate this server with your WebRTC application to enable real-time video calls.

## Contributing

We welcome contributions from the open-source community. If you have ideas for improvements or new features, please open an issue or submit a pull request. Check out our [Contribution Guidelines](CONTRIBUTING.md) for more details.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
