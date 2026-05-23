var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_http = require("http");
var import_path = __toESM(require("path"), 1);
var import_socket = require("socket.io");
var import_vite = require("vite");

// src/types.ts
var PLAYER_COLORS = [
  "red",
  "blue",
  "green",
  "yellow",
  "purple",
  "orange",
  "cyan",
  "pink"
];
var COLOR_MAP = {
  red: "#ff2e63",
  blue: "#08f7fe",
  green: "#22c55e",
  yellow: "#f5d300",
  purple: "#a855f7",
  orange: "#f97316",
  cyan: "#08f7fe",
  pink: "#ff2e63"
};

// server.ts
var PORT = 3e3;
async function startServer() {
  const app = (0, import_express.default)();
  const httpServer = (0, import_http.createServer)(app);
  const io = new import_socket.Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });
  app.post("/api/create-checkout-session", (req, res) => {
    res.json({ url: "/checkout-mock-success" });
  });
  const games = {};
  const socketData = {};
  function createBoard(width, height) {
    const board = [];
    for (let y = 0; y < height; y++) {
      const row = [];
      for (let x = 0; x < width; x++) {
        let capacity = 4;
        const isEdgeX = x === 0 || x === width - 1;
        const isEdgeY = y === 0 || y === height - 1;
        if (isEdgeX && isEdgeY) capacity = 2;
        else if (isEdgeX || isEdgeY) capacity = 3;
        row.push({ x, y, playerId: null, count: 0, capacity });
      }
      board.push(row);
    }
    return board;
  }
  const TURN_DURATION = 6e3;
  function findNextPlayer(game) {
    if (game.players.length === 0) return;
    let nextIndex = (game.currentTurnIndex + 1) % game.players.length;
    let attempts = 0;
    while (game.players[nextIndex]?.isEliminated && attempts < game.players.length) {
      nextIndex = (nextIndex + 1) % game.players.length;
      attempts++;
    }
    game.currentTurnIndex = nextIndex;
  }
  function checkAndTriggerAI(game, roomId) {
    const nextPlayer = game.players[game.currentTurnIndex];
    if (nextPlayer && nextPlayer.isAI && !nextPlayer.isEliminated && game.status === "playing") {
      setTimeout(() => {
        const move = calculateBestMove(game);
        if (move) {
          handleMove(game, roomId, move.x, move.y);
        } else {
          console.log(`AI ${nextPlayer.name} could not find a move, skipping...`);
          findNextPlayer(game);
          game.turnEndTime = Date.now() + TURN_DURATION;
          game.lastMoveTimestamp = Date.now();
          io.to(roomId).emit("game_updated", game);
          checkAndTriggerAI(game, roomId);
        }
      }, 1e3);
    }
  }
  function handleMove(game, roomId, x, y) {
    const currentPlayer = game.players[game.currentTurnIndex];
    if (!currentPlayer) return;
    game.previousState = {
      board: JSON.parse(JSON.stringify(game.board)),
      turnIndex: game.currentTurnIndex,
      players: JSON.parse(JSON.stringify(game.players))
    };
    if (currentPlayer.stats) currentPlayer.stats.movesMade++;
    currentPlayer.hasMoved = true;
    game.moveHistory.push({
      x,
      y,
      playerId: currentPlayer.id,
      timestamp: Date.now()
    });
    game.lastExplosions = [];
    processMove(game, x, y, currentPlayer.id);
    game.players.forEach((p) => {
      if (!p.stats) return;
      let controlledCount = 0;
      game.board.forEach((row) => row.forEach((cell) => {
        if (cell.playerId === p.id) controlledCount++;
      }));
      p.stats.peakCellsControlled = Math.max(p.stats.peakCellsControlled || 0, controlledCount);
    });
    checkWinCondition(game);
    if (game.status === "playing") {
      findNextPlayer(game);
      game.turnEndTime = Date.now() + TURN_DURATION;
    } else {
      game.turnEndTime = void 0;
    }
    game.lastMoveTimestamp = Date.now();
    io.to(roomId).emit("game_updated", game);
    if (game.status === "playing") {
      checkAndTriggerAI(game, roomId);
    }
  }
  setInterval(() => {
    const now = Date.now();
    for (const roomId in games) {
      const game = games[roomId];
      if (game.status === "playing" && game.turnEndTime && now > game.turnEndTime) {
        console.log(`Turn timeout for room ${roomId}, player index ${game.currentTurnIndex}`);
        findNextPlayer(game);
        game.turnEndTime = Date.now() + TURN_DURATION;
        game.lastMoveTimestamp = Date.now();
        io.to(roomId).emit("game_updated", game);
        checkAndTriggerAI(game, roomId);
      }
    }
  }, 500);
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);
    socket.on("skip_turn", (roomId) => {
      const game = games[roomId];
      if (!game || game.status !== "playing") return;
      const host = game.players.find((p) => p.id === socket.id);
      if (host?.isHost) {
        console.log(`Manual skip in room ${roomId} by host`);
        findNextPlayer(game);
        game.turnEndTime = Date.now() + TURN_DURATION;
        game.lastMoveTimestamp = Date.now();
        io.to(roomId).emit("game_updated", game);
        checkAndTriggerAI(game, roomId);
      }
    });
    socket.on("join_game", ({ roomId, playerName, isSpectator, userId, avatar }) => {
      socket.join(roomId);
      if (!games[roomId]) {
        games[roomId] = {
          id: roomId,
          gridWidth: 6,
          gridHeight: 9,
          players: [],
          status: "lobby",
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
        let player = game.players.find((p) => p.id === socket.id);
        if (!player) {
          if (game.status !== "lobby") {
            socket.emit("error", { message: "Game already in progress. Join as spectator?" });
            return;
          }
          if (game.players.length >= game.maxPlayers) {
            socket.emit("error", { message: "Arena capacity reached. Syncing as spectator." });
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
            hasMoved: false,
            userId,
            avatar,
            undoChances: 0,
            totalUndosUsed: 0,
            stats: {
              explosionsTriggered: 0,
              cellsCaptured: 0,
              movesMade: 0,
              maxExplosionsInTurn: 0,
              maxChainReaction: 0,
              peakCellsControlled: 0
            }
          };
          game.players.push(player);
        } else {
          if (game.status === "lobby" && avatar) {
            player.avatar = avatar;
          }
        }
      }
      io.to(roomId).emit("game_updated", game);
    });
    socket.on("send_room_chat", ({ roomId, text, senderId, senderName, avatar }) => {
      const msg = {
        id: Math.random().toString(36).substr(2, 9),
        senderId,
        senderName,
        text,
        timestamp: Date.now(),
        type: "room",
        avatar
      };
      io.to(roomId).emit("room_chat_message", msg);
    });
    socket.on("leave_game", (roomId) => {
      const game = games[roomId];
      if (game) {
        const playerIndex = game.players.findIndex((p) => p.id === socket.id);
        if (playerIndex !== -1) {
          const player = game.players[playerIndex];
          if (game.status === "playing") {
            const playerToRemove = game.players[playerIndex];
            game.players.splice(playerIndex, 1);
            game.board.forEach((row) => row.forEach((cell) => {
              if (cell.playerId === socket.id) {
                cell.playerId = null;
                cell.count = 0;
              }
            }));
            if (playerIndex < game.currentTurnIndex) {
              game.currentTurnIndex--;
            } else if (playerIndex === game.currentTurnIndex) {
              if (game.currentTurnIndex >= game.players.length) {
                game.currentTurnIndex = 0;
              }
              game.turnEndTime = Date.now() + TURN_DURATION;
            }
            if (game.players.length <= 1) {
              game.status = "gameover";
              game.winnerId = game.players[0]?.id || null;
              game.turnEndTime = void 0;
            } else {
              if (playerIndex === game.currentTurnIndex) {
                checkWinCondition(game);
                if (game.status === "playing") {
                  checkAndTriggerAI(game, roomId);
                }
              }
            }
          } else {
            game.players.splice(playerIndex, 1);
            if (game.players.length === 0) {
              delete games[roomId];
              socket.leave(roomId);
              delete socketData[socket.id];
              return;
            }
            if (player.isHost) {
              const newHost = game.players.find((p) => !p.isAI);
              if (newHost) newHost.isHost = true;
            }
          }
          io.to(roomId).emit("game_updated", game);
        }
      }
      socket.leave(roomId);
      delete socketData[socket.id];
    });
    socket.on("play_again", (roomId) => {
      const game = games[roomId];
      if (!game || game.status !== "gameover") return;
      const player = game.players.find((p) => p.id === socket.id);
      if (player?.isHost) {
        game.status = "lobby";
        game.winnerId = null;
        game.turnEndTime = void 0;
        game.moveHistory = [];
        game.board = createBoard(game.gridWidth, game.gridHeight);
        game.players.forEach((p) => {
          p.isReady = p.isAI ? true : false;
          p.isEliminated = false;
          p.undoChances = 0;
          p.totalUndosUsed = 0;
          p.stats = { explosionsTriggered: 0, cellsCaptured: 0, movesMade: 0, maxExplosionsInTurn: 0, maxChainReaction: 0, peakCellsControlled: 0 };
        });
        io.to(roomId).emit("game_updated", game);
      }
    });
    socket.on("update_settings", ({ roomId, gridWidth, gridHeight, maxPlayers }) => {
      const game = games[roomId];
      if (!game || game.status !== "lobby") return;
      const player = game.players.find((p) => p.id === socket.id);
      if (player?.isHost) {
        if (gridWidth) game.gridWidth = Math.min(15, Math.max(4, gridWidth));
        if (gridHeight) game.gridHeight = Math.min(20, Math.max(4, gridHeight));
        if (maxPlayers) game.maxPlayers = Math.min(8, Math.max(2, maxPlayers));
        game.maxPlayers = Math.max(game.maxPlayers, game.players.length);
        game.board = createBoard(game.gridWidth, game.gridHeight);
        io.to(roomId).emit("game_updated", game);
      }
    });
    socket.on("add_ai", (roomId) => {
      const game = games[roomId];
      if (!game || game.status !== "lobby") return;
      const host = game.players.find((p) => p.id === socket.id);
      if (!host?.isHost || game.players.length >= game.maxPlayers) return;
      const aiId = `ai_${Math.random().toString(36).substr(2, 9)}`;
      const aiPlayer = {
        id: aiId,
        name: `AI Alpha ${game.players.length}`,
        color: PLAYER_COLORS[game.players.length % PLAYER_COLORS.length],
        isReady: true,
        isHost: false,
        isEliminated: false,
        isAI: true,
        hasMoved: false,
        avatar: { icon: "cpu", color: COLOR_MAP[PLAYER_COLORS[game.players.length % PLAYER_COLORS.length]] },
        undoChances: 0,
        totalUndosUsed: 0,
        stats: { explosionsTriggered: 0, cellsCaptured: 0, movesMade: 0, maxExplosionsInTurn: 0, maxChainReaction: 0, peakCellsControlled: 0 }
      };
      game.players.push(aiPlayer);
      io.to(roomId).emit("game_updated", game);
    });
    socket.on("toggle_ready", (roomId) => {
      const game = games[roomId];
      if (!game) return;
      const player = game.players.find((p) => p.id === socket.id);
      if (player) {
        player.isReady = !player.isReady;
        io.to(roomId).emit("game_updated", game);
      }
    });
    socket.on("start_game", (roomId) => {
      const game = games[roomId];
      if (!game || game.status !== "lobby") return;
      const player = game.players.find((p) => p.id === socket.id);
      if (player?.isHost && game.players.length >= 2) {
        game.status = "playing";
        game.board = createBoard(game.gridWidth, game.gridHeight);
        game.currentTurnIndex = 0;
        game.turnEndTime = Date.now() + TURN_DURATION;
        io.to(roomId).emit("game_updated", game);
        checkAndTriggerAI(game, roomId);
      }
    });
    socket.on("make_move", ({ roomId, x, y }) => {
      const game = games[roomId];
      if (!game || game.status !== "playing") return;
      const currentPlayer = game.players[game.currentTurnIndex];
      if (currentPlayer.id !== socket.id) return;
      const cell = game.board[y][x];
      if (cell.playerId !== null && cell.playerId !== currentPlayer.id) return;
      handleMove(game, roomId, x, y);
    });
    socket.on("watch_ad", (roomId) => {
      const game = games[roomId];
      if (!game) return;
      const player = game.players.find((p) => p.id === socket.id);
      if (player && player.totalUndosUsed < 3) {
        player.undoChances = 1;
        io.to(roomId).emit("game_updated", game);
      }
    });
    socket.on("undo_move", (roomId) => {
      const game = games[roomId];
      if (!game || !game.previousState || game.status !== "playing") return;
      const player = game.players.find((p) => p.id === socket.id);
      const playerIndex = game.players.findIndex((p) => p.id === socket.id);
      if (!player || player.undoChances <= 0) return;
      if (playerIndex !== game.previousState.turnIndex) return;
      game.board = game.previousState.board;
      game.currentTurnIndex = game.previousState.turnIndex;
      game.previousState.players.forEach((prevP) => {
        const currentP = game.players.find((cp) => cp.id === prevP.id);
        if (currentP) {
          currentP.isEliminated = prevP.isEliminated;
          currentP.hasMoved = prevP.hasMoved;
          currentP.stats = prevP.stats;
        }
      });
      game.previousState = void 0;
      player.undoChances = 0;
      player.totalUndosUsed++;
      game.turnEndTime = Date.now() + TURN_DURATION;
      game.lastMoveTimestamp = Date.now();
      io.to(roomId).emit("game_updated", game);
      checkAndTriggerAI(game, roomId);
    });
    socket.on("get_active_rooms", () => {
      const activeRooms = Object.values(games).filter((g) => g.status === "lobby" && g.players.length < g.maxPlayers).map((g) => ({
        id: g.id,
        playerCount: g.players.length,
        maxPlayers: g.maxPlayers,
        hostName: g.players.find((p) => p.isHost)?.name || "Unknown"
      }));
      socket.emit("active_rooms_list", activeRooms);
    });
    socket.on("kick_player", ({ roomId, targetId }) => {
      const game = games[roomId];
      if (!game || game.status !== "lobby") return;
      const host = game.players.find((p) => p.id === socket.id);
      if (host?.isHost) {
        const targetIndex = game.players.findIndex((p) => p.id === targetId);
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
          } else {
            const playerIndex = game.players.findIndex((p) => p.id === socket.id);
            if (playerIndex !== -1) {
              const player = game.players[playerIndex];
              if (game.status === "playing") {
                const playerToRemove = game.players[playerIndex];
                game.players.splice(playerIndex, 1);
                game.board.forEach((row) => row.forEach((cell) => {
                  if (cell.playerId === socket.id) {
                    cell.playerId = null;
                    cell.count = 0;
                  }
                }));
                if (playerIndex < game.currentTurnIndex) {
                  game.currentTurnIndex--;
                } else if (playerIndex === game.currentTurnIndex) {
                  if (game.currentTurnIndex >= game.players.length) {
                    game.currentTurnIndex = 0;
                  }
                  game.turnEndTime = Date.now() + TURN_DURATION;
                }
                if (game.players.length <= 1) {
                  game.status = "gameover";
                  game.winnerId = game.players[0]?.id || null;
                  game.turnEndTime = void 0;
                } else {
                  if (playerIndex === game.currentTurnIndex) {
                    checkWinCondition(game);
                    if (game.status === "playing") {
                      checkAndTriggerAI(game, roomId);
                    }
                  }
                }
              } else {
                game.players.splice(playerIndex, 1);
                if (game.players.length === 0) {
                  delete games[roomId];
                  return;
                }
                if (player.isHost) {
                  const newHost = game.players.find((p) => !p.isAI);
                  if (newHost) newHost.isHost = true;
                }
              }
            }
          }
          io.to(roomId).emit("game_updated", game);
        }
        delete socketData[socket.id];
      }
    });
  });
  function processMove(game, startX, startY, playerId) {
    const queue = [{ x: startX, y: startY, depth: 0 }];
    const board = game.board;
    let explosionsInThisTurn = 0;
    let maxTurnDepth = 0;
    const firstCell = board[startY][startX];
    firstCell.count++;
    firstCell.playerId = playerId;
    while (queue.length > 0) {
      const { x, y, depth } = queue.shift();
      maxTurnDepth = Math.max(maxTurnDepth, depth);
      const cell = board[y][x];
      if (cell.count >= cell.capacity) {
        explosionsInThisTurn++;
        const p2 = game.players.find((pl) => pl.id === playerId);
        const color = p2?.avatar?.color || (p2 ? COLOR_MAP[p2.color] : "#fff");
        game.lastExplosions.push({ x, y, color });
        if (p2?.stats) p2.stats.explosionsTriggered++;
        const excess = cell.count - cell.capacity;
        cell.count = excess;
        if (cell.count === 0) cell.playerId = null;
        const neighbors = [
          { nx: x + 1, ny: y },
          { nx: x - 1, ny: y },
          { nx: x, ny: y + 1 },
          { nx: x, ny: y - 1 }
        ];
        for (const { nx, ny } of neighbors) {
          if (nx >= 0 && nx < game.gridWidth && ny >= 0 && ny < game.gridHeight) {
            const nCell = board[ny][nx];
            if (nCell.playerId !== playerId) {
              if (p2?.stats) p2.stats.cellsCaptured++;
            }
            nCell.count++;
            nCell.playerId = playerId;
            if (nCell.count >= nCell.capacity) {
              queue.push({ x: nx, y: ny, depth: depth + 1 });
            }
          }
        }
      }
    }
    const p = game.players.find((pl) => pl.id === playerId);
    if (p?.stats) {
      p.stats.maxExplosionsInTurn = Math.max(p.stats.maxExplosionsInTurn || 0, explosionsInThisTurn);
      p.stats.maxChainReaction = Math.max(p.stats.maxChainReaction || 0, maxTurnDepth);
    }
  }
  function checkWinCondition(game) {
    const activePlayers = game.players.filter((p) => !p.isEliminated);
    const orbsByPlayer = {};
    let totalOrbs = 0;
    let occupiedCells = 0;
    game.board.forEach((row) => {
      row.forEach((cell) => {
        if (cell.playerId) {
          orbsByPlayer[cell.playerId] = (orbsByPlayer[cell.playerId] || 0) + cell.count;
          totalOrbs += cell.count;
          occupiedCells++;
        }
      });
    });
    game.players.forEach((p) => {
      if (!p.isEliminated && p.hasMoved && !orbsByPlayer[p.id]) {
        p.isEliminated = true;
      }
    });
    const remainingPlayers = game.players.filter((p) => !p.isEliminated);
    if (remainingPlayers.length === 1 && totalOrbs > 0) {
      game.status = "gameover";
      game.winnerId = remainingPlayers[0].id;
      game.turnEndTime = void 0;
    }
  }
  function copyGameState(game) {
    return {
      ...game,
      board: game.board.map((row) => row.map((cell) => ({ ...cell }))),
      players: game.players.map((p) => ({ ...p, stats: p.stats ? { ...p.stats } : void 0 })),
      lastExplosions: [...game.lastExplosions],
      moveHistory: [...game.moveHistory]
    };
  }
  function evaluateBoard(game, aiPlayerId) {
    if (game.status === "gameover") {
      return game.winnerId === aiPlayerId ? 1e6 : -1e6;
    }
    const aiPlayer = game.players.find((p) => p.id === aiPlayerId);
    if (!aiPlayer || aiPlayer.isEliminated) return -1e6;
    let score = 0;
    const gridHeight = game.gridHeight;
    const gridWidth = game.gridWidth;
    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        const cell = game.board[y][x];
        if (!cell.playerId) {
          const isCorner = (x === 0 || x === gridWidth - 1) && (y === 0 || y === gridHeight - 1);
          const isEdge = x === 0 || x === gridWidth - 1 || (y === 0 || y === gridHeight - 1);
          if (isCorner) score += 2;
          else if (isEdge) score += 1;
          continue;
        }
        const isMine = cell.playerId === aiPlayerId;
        const multiplier = isMine ? 1 : -1;
        score += multiplier * 15;
        score += multiplier * cell.count * 2;
        if (isMine) {
          const isCorner = (x === 0 || x === gridWidth - 1) && (y === 0 || y === gridHeight - 1);
          const isEdge = x === 0 || x === gridWidth - 1 || (y === 0 || y === gridHeight - 1);
          if (isCorner) score += 40;
          else if (isEdge) score += 15;
          if (cell.count === cell.capacity - 1) {
            score += 20;
            const neighbors2 = [
              { nx: x + 1, ny: y },
              { nx: x - 1, ny: y },
              { nx: x, ny: y + 1 },
              { nx: x, ny: y - 1 }
            ];
            for (const { nx, ny } of neighbors2) {
              if (nx >= 0 && nx < gridWidth && ny >= 0 && ny < gridHeight) {
                const nCell = game.board[ny][nx];
                if (nCell.playerId && nCell.playerId !== aiPlayerId) {
                  score += 15;
                }
              }
            }
          }
          const neighbors = [
            { nx: x + 1, ny: y },
            { nx: x - 1, ny: y },
            { nx: x, ny: y + 1 },
            { nx: x, ny: y - 1 }
          ];
          for (const { nx, ny } of neighbors) {
            if (nx >= 0 && nx < gridWidth && ny >= 0 && ny < gridHeight) {
              const nCell = game.board[ny][nx];
              if (nCell.playerId && nCell.playerId !== aiPlayerId) {
                if (nCell.count === nCell.capacity - 1) {
                  score -= 50;
                }
              }
            }
          }
        } else {
          if (cell.count === cell.capacity - 1) {
            score -= 30;
          }
        }
      }
    }
    return score;
  }
  function minimax(game, depth, alpha, beta, isMaximizing, aiPlayerId) {
    if (depth === 0 || game.status === "gameover") {
      return evaluateBoard(game, aiPlayerId);
    }
    const currentPlayer = game.players[game.currentTurnIndex];
    if (!currentPlayer || currentPlayer.isEliminated) {
      const nextGame = copyGameState(game);
      findNextPlayer(nextGame);
      return minimax(nextGame, depth, alpha, beta, nextGame.players[nextGame.currentTurnIndex]?.id === aiPlayerId, aiPlayerId);
    }
    const moves = [];
    for (let y = 0; y < game.gridHeight; y++) {
      for (let x = 0; x < game.gridWidth; x++) {
        const cell = game.board[y][x];
        if (cell.playerId === null || cell.playerId === currentPlayer.id) {
          moves.push({ x, y });
        }
      }
    }
    moves.sort((a, b) => {
      const cellA = game.board[a.y][a.x];
      const cellB = game.board[b.y][b.x];
      const scoreA = (cellA.count === cellA.capacity - 1 ? 10 : 0) + (cellA.capacity <= 3 ? 5 : 0);
      const scoreB = (cellB.count === cellB.capacity - 1 ? 10 : 0) + (cellB.capacity <= 3 ? 5 : 0);
      return scoreB - scoreA;
    });
    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const move of moves) {
        const nextGame = copyGameState(game);
        processMove(nextGame, move.x, move.y, currentPlayer.id);
        checkWinCondition(nextGame);
        if (nextGame.status === "playing") findNextPlayer(nextGame);
        const evalScore = minimax(nextGame, depth - 1, alpha, beta, nextGame.players[nextGame.currentTurnIndex]?.id === aiPlayerId, aiPlayerId);
        maxEval = Math.max(maxEval, evalScore);
        alpha = Math.max(alpha, evalScore);
        if (beta <= alpha) break;
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of moves) {
        const nextGame = copyGameState(game);
        processMove(nextGame, move.x, move.y, currentPlayer.id);
        checkWinCondition(nextGame);
        if (nextGame.status === "playing") findNextPlayer(nextGame);
        const evalScore = minimax(nextGame, depth - 1, alpha, beta, nextGame.players[nextGame.currentTurnIndex]?.id === aiPlayerId, aiPlayerId);
        minEval = Math.min(minEval, evalScore);
        beta = Math.min(beta, evalScore);
        if (beta <= alpha) break;
      }
      return minEval;
    }
  }
  function calculateBestMove(game) {
    const currentPlayer = game.players[game.currentTurnIndex];
    if (!currentPlayer) return null;
    const aiId = currentPlayer.id;
    const possibleMoves = [];
    for (let y = 0; y < game.gridHeight; y++) {
      for (let x = 0; x < game.gridWidth; x++) {
        const cell = game.board[y][x];
        if (cell.playerId === null || cell.playerId === aiId) {
          possibleMoves.push({ x, y });
        }
      }
    }
    if (possibleMoves.length === 0) return null;
    let bestMove = null;
    let bestScore = -Infinity;
    const DEPTH = 2;
    for (const move of possibleMoves) {
      const simulation = copyGameState(game);
      processMove(simulation, move.x, move.y, aiId);
      checkWinCondition(simulation);
      if (simulation.status === "playing") findNextPlayer(simulation);
      const score = minimax(simulation, DEPTH - 1, -Infinity, Infinity, simulation.players[simulation.currentTurnIndex]?.id === aiId, aiId);
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      } else if (score === bestScore && Math.random() > 0.5) {
        bestMove = move;
      }
    }
    return bestMove;
  }
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
