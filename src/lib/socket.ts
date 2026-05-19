import { io } from "socket.io-client";

// In AI Studio, the socket server runs on the same host as the app
export const socket = io();
