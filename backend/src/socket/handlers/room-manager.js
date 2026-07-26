import { ROOM_ROLES, ROOM_STATUSES } from '../constants/socket-events.constants.js';

export class RoomManagerError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'RoomManagerError';
    this.code = code;
  }
}

// RoomManager is intentionally independent from ChessService. It tracks socket
// membership only: who is in which room, whether a room is full, and which rooms
// should be deleted when the last socket leaves.
export class RoomManager {
  constructor({ maxPlayersPerRoom = 2 } = {}) {
    if (!Number.isInteger(maxPlayersPerRoom) || maxPlayersPerRoom < 1) {
      throw new RoomManagerError(
        'INVALID_ROOM_CAPACITY',
        'Room capacity must be a positive integer.',
      );
    }

    this.maxPlayersPerRoom = maxPlayersPerRoom;
    this.rooms = new Map();
    this.socketRooms = new Map();
  }

  createRoom({ roomId, socketId, player }) {
    this.assertIdentifier(roomId, 'ROOM_ID_REQUIRED', 'roomId is required.');
    this.assertIdentifier(socketId, 'SOCKET_ID_REQUIRED', 'socketId is required.');

    if (this.rooms.has(roomId)) {
      throw new RoomManagerError('ROOM_ALREADY_EXISTS', 'Room already exists.');
    }

    const now = new Date();
    const room = {
      roomId,
      members: new Map(),
      spectators: new Map(),
      createdAt: now,
      updatedAt: now,
      status: ROOM_STATUSES.WAITING,
    };

    this.rooms.set(roomId, room);
    return this.addMember(roomId, { socketId, player, role: ROOM_ROLES.PLAYER });
  }

  getRoom(roomId) {
    return this.rooms.get(roomId) ?? null;
  }

  assertRoomExists(roomId) {
    this.assertIdentifier(roomId, 'ROOM_ID_REQUIRED', 'roomId is required.');

    const room = this.getRoom(roomId);

    if (!room) {
      throw new RoomManagerError('ROOM_NOT_FOUND', 'Room was not found.');
    }

    return room;
  }

  assertCanJoinRoom(roomId, { socketId, playerId, role = ROOM_ROLES.PLAYER } = {}) {
    this.assertIdentifier(socketId, 'SOCKET_ID_REQUIRED', 'socketId is required.');

    const room = this.assertRoomExists(roomId);

    if (room.members.has(socketId) || room.spectators.has(socketId)) {
      throw new RoomManagerError('DUPLICATE_JOIN', 'Socket has already joined this room.');
    }

    if (playerId && this.hasPlayer(room, playerId)) {
      throw new RoomManagerError('DUPLICATE_JOIN', 'Player has already joined this room.');
    }

    if (role === ROOM_ROLES.PLAYER && this.countPlayers(room) >= this.maxPlayersPerRoom) {
      throw new RoomManagerError('ROOM_FULL', 'Room already contains two players.');
    }

    return room;
  }

  joinRoom({ roomId, socketId, player, role = ROOM_ROLES.PLAYER }) {
    this.assertCanJoinRoom(roomId, { socketId, playerId: player?.id, role });
    return this.addMember(roomId, { socketId, player, role });
  }

  joinSpectator({ roomId, socketId, spectator }) {
    return this.joinRoom({
      roomId,
      socketId,
      player: spectator,
      role: ROOM_ROLES.SPECTATOR,
    });
  }

  leaveRoom({ roomId, socketId }) {
    this.assertIdentifier(socketId, 'SOCKET_ID_REQUIRED', 'socketId is required.');

    const room = this.assertRoomExists(roomId);
    const member = room.members.get(socketId) ?? room.spectators.get(socketId) ?? null;

    if (!member) {
      throw new RoomManagerError('ROOM_MEMBER_NOT_FOUND', 'Socket is not a member of this room.');
    }

    room.members.delete(socketId);
    room.spectators.delete(socketId);
    this.removeSocketRoom(socketId, roomId);
    room.updatedAt = new Date();
    room.status = this.getRoomStatus(room);

    const deleted = this.deleteRoomIfEmpty(roomId);

    return {
      room: deleted ? null : this.serializeRoom(room),
      roomId,
      member,
      deleted,
    };
  }

  leaveAllRooms(socketId) {
    const roomIds = [...(this.socketRooms.get(socketId) ?? [])];
    return roomIds.map((roomId) => this.leaveRoom({ roomId, socketId }));
  }

  markSocketDisconnected(socketId) {
    const roomIds = [...(this.socketRooms.get(socketId) ?? [])];
    const results = [];

    for (const roomId of roomIds) {
      const room = this.getRoom(roomId);

      if (!room) {
        this.removeSocketRoom(socketId, roomId);
        continue;
      }

      const member = room.members.get(socketId) ?? room.spectators.get(socketId) ?? null;

      if (!member) {
        this.removeSocketRoom(socketId, roomId);
        continue;
      }

      member.connected = false;
      member.disconnectedAt = new Date();
      this.removeSocketRoom(socketId, roomId);
      room.updatedAt = new Date();

      results.push({
        roomId,
        room: this.serializeRoom(room),
        member: this.serializeMember(member),
      });
    }

    return results;
  }

  reconnectMember({ roomId, socketId, playerId }) {
    const room = this.assertRoomExists(roomId);
    const member = this.findMemberByPlayerId(room, playerId);

    if (!member) {
      throw new RoomManagerError('ROOM_MEMBER_NOT_FOUND', 'Player is not a member of this room.');
    }

    room.members.delete(member.socketId);
    room.spectators.delete(member.socketId);

    member.socketId = socketId;
    member.connected = true;
    member.disconnectedAt = null;
    member.reconnectedAt = new Date();

    if (member.role === ROOM_ROLES.SPECTATOR) {
      room.spectators.set(socketId, member);
    } else {
      room.members.set(socketId, member);
    }

    this.addSocketRoom(socketId, roomId);
    room.updatedAt = new Date();

    return this.serializeRoom(room);
  }

  restoreRoom({ roomId, players = [] }) {
    this.assertIdentifier(roomId, 'ROOM_ID_REQUIRED', 'roomId is required.');

    // Redis can restore game state after a server restart, but Socket.IO rooms
    // are process memory. This rebuilds room membership from persisted players
    // without introducing chess rules into RoomManager.
    const room = this.getRoom(roomId) ?? {
      roomId,
      members: new Map(),
      spectators: new Map(),
      createdAt: new Date(),
      updatedAt: new Date(),
      status: ROOM_STATUSES.WAITING,
    };

    for (const player of players.filter(Boolean)) {
      if (this.hasPlayer(room, player.id)) {
        continue;
      }

      const socketId = this.createDisconnectedSocketId(player.id);
      room.members.set(socketId, {
        socketId,
        role: ROOM_ROLES.PLAYER,
        player,
        joinedAt: new Date(),
        connected: false,
        disconnectedAt: new Date(),
        reconnectedAt: null,
      });
    }

    room.updatedAt = new Date();
    room.status = this.getRoomStatus(room);
    this.rooms.set(roomId, room);

    return this.serializeRoom(room);
  }

  deleteRoom(roomId) {
    const room = this.assertRoomExists(roomId);

    for (const socketId of [...room.members.keys(), ...room.spectators.keys()]) {
      this.removeSocketRoom(socketId, roomId);
    }

    this.rooms.delete(roomId);
    return this.serializeRoom(room);
  }

  addMember(roomId, { socketId, player, role }) {
    this.assertIdentifier(socketId, 'SOCKET_ID_REQUIRED', 'socketId is required.');

    const room = this.assertRoomExists(roomId);
    const now = new Date();
    const member = {
      socketId,
      role,
      player,
      joinedAt: now,
      connected: true,
      disconnectedAt: null,
      reconnectedAt: null,
    };

    if (role === ROOM_ROLES.SPECTATOR) {
      room.spectators.set(socketId, member);
    } else {
      room.members.set(socketId, member);
    }

    this.addSocketRoom(socketId, roomId);
    room.updatedAt = now;
    room.status = this.getRoomStatus(room);

    return this.serializeRoom(room);
  }

  addSocketRoom(socketId, roomId) {
    const roomIds = this.socketRooms.get(socketId) ?? new Set();
    roomIds.add(roomId);
    this.socketRooms.set(socketId, roomIds);
  }

  removeSocketRoom(socketId, roomId) {
    const roomIds = this.socketRooms.get(socketId);

    if (!roomIds) {
      return;
    }

    roomIds.delete(roomId);

    if (roomIds.size === 0) {
      this.socketRooms.delete(socketId);
    }
  }

  deleteRoomIfEmpty(roomId) {
    const room = this.getRoom(roomId);

    if (!room) {
      return false;
    }

    if (room.members.size > 0 || room.spectators.size > 0) {
      return false;
    }

    this.rooms.delete(roomId);
    return true;
  }

  countPlayers(room) {
    return room.members.size;
  }

  hasPlayer(room, playerId) {
    return this.findMemberByPlayerId(room, playerId) !== null;
  }

  findMemberByPlayerId(room, playerId) {
    if (!playerId) {
      return null;
    }

    return (
      [...room.members.values(), ...room.spectators.values()].find(
        (member) => member.player?.id === playerId,
      ) ?? null
    );
  }

  createDisconnectedSocketId(playerId) {
    return `disconnected:${playerId}`;
  }

  assertIdentifier(value, code, message) {
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new RoomManagerError(code, message);
    }
  }

  getRoomStatus(room) {
    return this.countPlayers(room) >= this.maxPlayersPerRoom
      ? ROOM_STATUSES.READY
      : ROOM_STATUSES.WAITING;
  }

  serializeMember(member) {
    return {
      socketId: member.socketId,
      role: member.role,
      player: member.player,
      joinedAt: member.joinedAt.toISOString(),
      connected: member.connected,
      disconnectedAt: member.disconnectedAt?.toISOString?.() ?? null,
      reconnectedAt: member.reconnectedAt?.toISOString?.() ?? null,
    };
  }

  serializeRoom(room) {
    return {
      roomId: room.roomId,
      status: room.status,
      players: [...room.members.values()].map((member) => this.serializeMember(member)),
      spectators: [...room.spectators.values()].map((member) => this.serializeMember(member)),
      maxPlayers: this.maxPlayersPerRoom,
      createdAt: room.createdAt.toISOString(),
      updatedAt: room.updatedAt.toISOString(),
    };
  }
}

export const roomManager = new RoomManager();
