import { io } from "socket.io-client";

// Detect if running inside a packaged web view context or locally
const isPackagedApp = 
  typeof window !== 'undefined' && 
  (window.location.protocol === 'file:' || 
   window.location.hostname === 'localhost' || 
   window.location.hostname === '127.0.0.1') && 
  !window.location.port;

// Target the live deployed Express/Socket.io backend on Cloud Run for packaged mobile builds
const SERVER_URL = (isPackagedApp || (typeof window !== 'undefined' && window.location.protocol === 'file:'))
  ? "https://ais-pre-qe3to6iu2vbzr6c7fjamed-77707345604.asia-southeast1.run.app"
  : "";

export const socket = io(SERVER_URL, {
  transports: ["websocket", "polling"],
});

