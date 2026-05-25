from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from app.websocket.manager import ConnectionManager
import json

app = FastAPI()
manager = ConnectionManager()


@app.get("/")
def read_root():
    return {"message": "Backend running"}


@app.websocket("/ws/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str):

    username = websocket.query_params.get("username", "Anonymous")

    await manager.connect(websocket, room_id, username)

    # 👥 Send updated users
    users = manager.get_users(room_id)

    await manager.broadcast(
        json.dumps({
            "type": "users",
            "users": users
        }),
        room_id
    )

    try:
        while True:
            data = await websocket.receive_text()

            print("RAW DATA:", data)

            #Broadcast everything
            await manager.broadcast(data, room_id)

    except WebSocketDisconnect:

        manager.disconnect(websocket, room_id)

        users = manager.get_users(room_id)

        await manager.broadcast(
            json.dumps({
                "type": "users",
                "users": users
            }),
            room_id
        )