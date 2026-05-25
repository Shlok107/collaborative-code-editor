class ConnectionManager:
    def __init__(self):
        self.rooms = {}  # { room_id: [(websocket, username)] }

    async def connect(self, websocket, room_id, username):
        await websocket.accept()

        if room_id not in self.rooms:
            self.rooms[room_id] = []

        self.rooms[room_id].append((websocket, username))

        print(f"{username} joined room {room_id}")

    def disconnect(self, websocket, room_id):
        self.rooms[room_id] = [
            (ws, user)
            for ws, user in self.rooms[room_id]
            if ws != websocket
        ]

    async def broadcast(self, message, room_id):
        for connection, _ in self.rooms.get(room_id, []):
            await connection.send_text(message)

    def get_users(self, room_id):
        return [
            user
            for _, user in self.rooms.get(room_id, [])
        ]