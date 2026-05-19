import express from "express";
import { createServer } from "http";
import path from "path";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import { GameState, Player, Move, PLAYER_COLORS, Cell, COLOR_MAP, ChatMessage } from "./src/types";

const PORT = 3000;

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Mock Stripe API for monetization
  app.post("/api/create-checkout-session", (req, res) => {
    // In a real app, you would use stripe.checkout.sessions.create
    res.json({ url: "/checkout-mock-success" });
  });

  // In-memory games storage
  const games: Record<string, GameState> = {};
  const socketData: Record<string, { roomId: string; isSpectator: boolean }> = {};

  function createBoard(width: number, height: number): Cell[][] {
    const board: Cell[][] = [];
    for (let y = 0; y < height; y++) {
      const row: Cell[] = [];
      for (let x = 0; x < width; x++) {
        let capacity = 4;
        const isEdgeX = x === 0 || x === width - 1;
        const isEdgeY = y === 0 || y === height - 1;
        
        if (isEdgeX && isEdgeY) capacity = 2; // Corners
        else if (isEdgeX || isEdgeY) capacity = 3; // Edges

        row.push({ x, y, playerId: null, count: 0, capacity });
      }
      board.push(row);
    }
    return board;
  }

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join_game", ({ roomId, playerName, isSpectator, userId, avatar }: { roomId: string; playerName: string; isSpectator?: boolean; userId?: string; avatar?: { icon: string; color: string } }) => {
      socket.join(roomId);

      if (!games[roomId]) {
        games[roomId] = {
          id: roomId,
          gridWidth: 6,
          gridHeight: 9,
          players: [],
          status: 'lobby',
          currentTurnIndex: 0,
          board: createBoard(6, 9),
          winnerId: null,
          lastMoveTimestamp: Date.now(),
          spectatorCount: 0,
          lastExplosions: [],
          maxPlayers: 8,
          moveHistory: []
        };
      }

      const game = games[roomId];
      socketData[socket.id] = { roomId, isSpectator: !!isSpectator };
      
      if (isSpectator) {
        game.spectatorCount++;
      } else {
        // Check if player already in game (reconnection)
        let player = game.players.find(p => p.id === socket.id);
        if (!player) {
           if (game.status !== 'lobby') {
             socket.emit("error", { message: "Game already in progress. Join as spectator?" });
             return;
           }
           if (game.players.length >= game.maxPlayers) {
             socket.emit("error", { message: "Arena capacity reached. Syncing as spectator." });
             // Force spectator mode if full
             socketData[socket.id].isSpectator = true;
             game.spectatorCount++;
             io.to(roomId).emit("game_updated", game);
             return;
           }
           player = {
             id: socket.id,
             name: playerName || `Player ${game.players.length + 1}`,
             color: PLAYER_COLORS[game.players.length % PLAYER_COLORS.length],
             isReady: false,
             isHost: game.players.length === 0,
             isEliminated: false,
             isAI: false,
             userId: userId,
             avatar: avatar,
             stats: { explosionsTriggered: 0, cellsCaptured: 0, movesMade: 0 }
           };
           game.players.push(player);
        } else {
          // Update avatar if rejoining lobby
          if (game.status === 'lobby' && avatar) {
            player.avatar = avatar;
          }
        }
      }

      io.to(roomId).emit("game_updated", game);
    });

    socket.on("send_room_chat", ({ roomId, text, senderId, senderName, avatar }: any) => {
      const msg: ChatMessage = {
        id: Math.random().toString(36).substr(2, 9),
        senderId,
        senderName,
        text,
        timestamp: Date.now(),
        type: 'room',
        avatar
      };
      io.to(roomId).emit("room_chat_message", msg);
    });

    socket.on("leave_game", (roomId: string) => {
      const game = games[roomId];
      if (game) {
        game.players = game.players.filter(p => p.id !== socket.id);
        if (game.players.length === 0) {
          delete games[roomId];
        } else {
          // If host left, assign new host
          if (!game.players.find(p => p.isHost)) {
            const newHost = game.players.find(p => !p.isAI);
            if (newHost) newHost.isHost = true;
          }
          io.to(roomId).emit("game_updated", game);
        }
      }
      socket.leave(roomId);
      delete socketData[socket.id];
    });

    socket.on("play_again", (roomId: string) => {
      const game = games[roomId];
      if (!game || game.status !== 'gameover') return;
      const player = game.players.find(p => p.id === socket.id);
      if (player?.isHost) {
        game.status = 'lobby';
        game.winnerId = null;
        game.moveHistory = [];
        game.board = createBoard(game.gridWidth, game.gridHeight);
        game.players.forEach(p => {
          p.isReady = p.isAI ? true : false;
          p.isEliminated = false;
          p.stats = { explosionsTriggered: 0, cellsCaptured: 0, movesMade: 0 };
        });
        io.to(roomId).emit("game_updated", game);
      }
    });

    socket.on("update_settings", ({ roomId, gridWidth, gridHeight, maxPlayers }: any) => {
      const game = games[roomId];
      if (!game || game.status !== 'lobby') return;
      const player = game.players.find(p => p.id === socket.id);
      if (player?.isHost) {
        if (gridWidth) game.gridWidth = Math.min(15, Math.max(4, gridWidth));
        if (gridHeight) game.gridHeight = Math.min(20, Math.max(4, gridHeight));
        if (maxPlayers) game.maxPlayers = Math.min(8, Math.max(2, maxPlayers));
        
        // Ensure maxPlayers doesn't kick existing players
        game.maxPlayers = Math.max(game.maxPlayers, game.players.length);

        // Re-generate board for everyone in lobby
        game.board = createBoard(game.gridWidth, game.gridHeight);
        io.to(roomId).emit("game_updated", game);
      }
    });

    socket.on("add_ai", (roomId: string) => {
      const game = games[roomId];
      if (!game || game.status !== 'lobby') return;
      const host = game.players.find(p => p.id === socket.id);
      if (!host?.isHost || game.players.length >= game.maxPlayers) return;

      const aiId = `ai_${Math.random().toString(36).substr(2, 9)}`;
      const aiPlayer: Player = {
        id: aiId,
        name: `AI Alpha ${game.players.length}`,
        color: PLAYER_COLORS[game.players.length % PLAYER_COLORS.length],
        isReady: true,
        isHost: false,
        isEliminated: false,
        isAI: true,
        avatar: { icon: 'cpu', color: COLOR_MAP[PLAYER_COLORS[game.players.length % PLAYER_COLORS.length]] },
        stats: { explosionsTriggered: 0, cellsCaptured: 0, movesMade: 0 }
      };
      game.players.push(aiPlayer);
      io.to(roomId).emit("game_updated", game);
    });

    socket.on("toggle_ready", (roomId: string) => {
      const game = games[roomId];
      if (!game) return;
      const player = game.players.find(p => p.id === socket.id);
      if (player) {
        player.isReady = !player.isReady;
        io.to(roomId).emit("game_updated", game);
      }
    });

    socket.on("start_game", (roomId: string) => {
      const game = games[roomId];
      if (!game || game.status !== 'lobby') return;
      const player = game.players.find(p => p.id === socket.id);
      if (player?.isHost && game.players.length >= 2) {
        game.status = 'playing';
        game.board = createBoard(game.gridWidth, game.gridHeight);
        game.currentTurnIndex = 0;
        io.to(roomId).emit("game_updated", game);

        // If host started and it's AI turn (unlikely but possible)
        checkAndTriggerAI(game, roomId);
      }
    });

    socket.on("make_move", ({ roomId, x, y }: { roomId: string; x: number; y: number }) => {
      const game = games[roomId];
      if (!game || game.status !== 'playing') return;

      const currentPlayer = game.players[game.currentTurnIndex];
      if (currentPlayer.id !== socket.id) return;

      const cell = game.board[y][x];
      if (cell.playerId !== null && cell.playerId !== currentPlayer.id) return;

      handleMove(game, roomId, x, y);
    });

    function handleMove(game: GameState, roomId: string, x: number, y: number) {
      const currentPlayer = game.players[game.currentTurnIndex];
      if (currentPlayer.stats) currentPlayer.stats.movesMade++;
      
      // Record move
      game.moveHistory.push({
        x,
        y,
        playerId: currentPlayer.id,
        timestamp: Date.now()
      });

      game.lastExplosions = []; // Reset on new move
      processMove(game, x, y, currentPlayer.id);
      checkWinCondition(game);

      if (game.status === 'playing') {
        findNextPlayer(game);
      }

      game.lastMoveTimestamp = Date.now();
      io.to(roomId).emit("game_updated", game);

      if (game.status === 'playing') {
        checkAndTriggerAI(game, roomId);
      }
    }

    function checkAndTriggerAI(game: GameState, roomId: string) {
      const nextPlayer = game.players[game.currentTurnIndex];
      if (nextPlayer.isAI && !nextPlayer.isEliminated && game.status === 'playing') {
        setTimeout(() => {
          const move = calculateBestMove(game);
          if (move) {
            handleMove(game, roomId, move.x, move.y);
          }
        }, 1000); // Delayed for better UX
      }
    }

    socket.on("get_active_rooms", () => {
      const activeRooms = Object.values(games)
        .filter(g => g.status === 'lobby' && g.players.length < g.maxPlayers)
        .map(g => ({
          id: g.id,
          playerCount: g.players.length,
          maxPlayers: g.maxPlayers,
          hostName: g.players.find(p => p.isHost)?.name || 'Unknown'
        }));
      socket.emit("active_rooms_list", activeRooms);
    });

    socket.on("kick_player", ({ roomId, targetId }: { roomId: string, targetId: string }) => {
      const game = games[roomId];
      if (!game || game.status !== 'lobby') return;
      
      const host = game.players.find(p => p.id === socket.id);
      if (host?.isHost) {
        const targetIndex = game.players.findIndex(p => p.id === targetId);
        if (targetIndex !== -1 && targetId !== socket.id) {
          game.players.splice(targetIndex, 1);
          io.to(targetId).emit("kicked");
          io.to(roomId).emit("game_updated", game);
        }
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      const data = socketData[socket.id];
      if (data) {
        const { roomId, isSpectator } = data;
        const game = games[roomId];
        if (game) {
          if (isSpectator) {
            game.spectatorCount = Math.max(0, game.spectatorCount - 1);
          }
          io.to(roomId).emit("game_updated", game);
        }
        delete socketData[socket.id];
      }
    });
  });

  function processMove(game: GameState, startX: number, startY: number, playerId: string) {
    const queue: { x: number; y: number }[] = [{ x: startX, y: startY }];
    const board = game.board;

    // First orb addition
    const firstCell = board[startY][startX];
    firstCell.count++;
    firstCell.playerId = playerId;

    // Chain reaction
    while (queue.length > 0) {
      const { x, y } = queue.shift()!;
      const cell = board[y][x];

      if (cell.count >= cell.capacity) {
        // Track explosion
        const p = game.players.find(pl => pl.id === playerId);
        const color = p?.avatar?.color || (p ? COLOR_MAP[p.color] : '#fff');
        game.lastExplosions.push({ x, y, color });
        if (p?.stats) p.stats.explosionsTriggered++;

        const excess = cell.count - cell.capacity;
        cell.count = excess;
        if (cell.count === 0) cell.playerId = null;

        const neighbors = [
          { nx: x + 1, ny: y },
          { nx: x - 1, ny: y },
          { nx: x, ny: y + 1 },
          { nx: x, ny: y - 1 },
        ];

        for (const { nx, ny } of neighbors) {
          if (nx >= 0 && nx < game.gridWidth && ny >= 0 && ny < game.gridHeight) {
            const nCell = board[ny][nx];
            if (nCell.playerId !== playerId) {
              if (p?.stats) p.stats.cellsCaptured++;
            }
            nCell.count++;
            nCell.playerId = playerId;
            if (nCell.count >= nCell.capacity) {
              queue.push({ x: nx, y: ny });
            }
          }
        }
      }
    }
  }

  function checkWinCondition(game: GameState) {
    const activePlayers = game.players.filter(p => !p.isEliminated);
    
    // A player is eliminated if they have 0 orbs AND at least one move has been made globally
    // But usually in Chain Reaction, elimination starts after everyone has made at least one move.
    // Or simpler: check if any orbs exist for each player.
    
    const orbsByPlayer: Record<string, number> = {};
    let totalOrbs = 0;
    
    game.board.forEach(row => {
      row.forEach(cell => {
        if (cell.playerId) {
          orbsByPlayer[cell.playerId] = (orbsByPlayer[cell.playerId] || 0) + cell.count;
          totalOrbs += cell.count;
        }
      });
    });

    // Strategy: Only eliminate players who have HAD a chance to move (totalOrbs > players.count is a rough proxy)
    // Better: Keep track of which players have moved.
    // For now, let's just check if totalOrbs is sufficient to trigger elimination logic.
    if (totalOrbs < game.players.length) return;

    game.players.forEach(p => {
      if (!orbsByPlayer[p.id]) {
        p.isEliminated = true;
      }
    });

    const remainingPlayers = game.players.filter(p => !p.isEliminated);
    if (remainingPlayers.length === 1 && totalOrbs > 0) {
      game.status = 'gameover';
      game.winnerId = remainingPlayers[0].id;
    }
  }

  function findNextPlayer(game: GameState) {
    let nextIndex = (game.currentTurnIndex + 1) % game.players.length;
    let attempts = 0;
    while (game.players[nextIndex].isEliminated && attempts < game.players.length) {
      nextIndex = (nextIndex + 1) % game.players.length;
      attempts++;
    }
    game.currentTurnIndex = nextIndex;
  }

  function calculateBestMove(game: GameState): { x: number; y: number } | null {
    const aiId = game.players[game.currentTurnIndex].id;
    const validMoves: { x: number; y: number; score: number }[] = [];

    for (let y = 0; y < game.gridHeight; y++) {
      for (let x = 0; x < game.gridWidth; x++) {
        const cell = game.board[y][x];
        if (cell.playerId === null || cell.playerId === aiId) {
          const score = evaluateMove(game, x, y, aiId);
          validMoves.push({ x, y, score });
        }
      }
    }

    if (validMoves.length === 0) return null;

    // Pick highest score
    validMoves.sort((a, b) => b.score - a.score);
    
    // Add a bit of randomness among top moves for variety
    const topMoves = validMoves.filter(m => m.score === validMoves[0].score);
    return topMoves[Math.floor(Math.random() * topMoves.length)];
  }

  function evaluateMove(game: GameState, x: number, y: number, playerId: string): number {
    // Clone board state
    const boardClone: Cell[][] = JSON.parse(JSON.stringify(game.board));
    const gameClone: GameState = { ...game, board: boardClone };
    
    processMove(gameClone, x, y, playerId);
    
    let score = 0;
    let myOrbs = 0;
    let enemyOrbs = 0;
    let myCells = 0;
    let enemyCells = 0;
    let myCritical = 0;
    let enemyCritical = 0;

    for (let r = 0; r < gameClone.gridHeight; r++) {
      for (let c = 0; c < gameClone.gridWidth; c++) {
        const cell = boardClone[r][c];
        if (cell.playerId === playerId) {
          myOrbs += cell.count;
          myCells++;
          if (cell.count === cell.capacity - 1) myCritical++;
        } else if (cell.playerId !== null) {
          enemyOrbs += cell.count;
          enemyCells++;
          if (cell.count === cell.capacity - 1) enemyCritical++;
        }
      }
    }

    // Heuristic
    if (enemyCells === 0 && myCells > 0) return 10000; // Winning move
    
    score += myCells * 5;
    score += myOrbs * 2;
    score -= enemyCells * 10;
    score -= enemyOrbs * 1;
    score += myCritical * 3;
    score -= enemyCritical * 5;

    // Corner/Edge bonuses
    const isCorner = (x === 0 || x === game.gridWidth - 1) && (y === 0 || y === game.gridHeight - 1);
    const isEdge = (x === 0 || x === game.gridWidth - 1) || (y === 0 || y === game.gridHeight - 1);
    
    if (isCorner) score += 15;
    else if (isEdge) score += 5;

    return score;
  }

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
