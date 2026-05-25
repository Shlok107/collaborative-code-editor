import { useEffect, useState, useRef } from "react";
import Editor from "@monaco-editor/react";

function App() {
  const [socket, setSocket] = useState(null);
  const [code, setCode] = useState("");
  const [users, setUsers] = useState([]);
  const [cursors, setCursors] = useState({});

  const [username, setUsername] = useState("");
  const [roomId, setRoomId] = useState("");
  const [joined, setJoined] = useState(false);

  const clientId = Math.random().toString(36).substring(2);

  // Important refs
  const socketRef = useRef(null);
  const isRemoteUpdate = useRef(false);

  // WebSocket connection
  useEffect(() => {
    if (!joined) return;

    const ws = new WebSocket(
      `ws://127.0.0.1:8001/ws/${roomId}?username=${username}`
    );

    ws.onopen = () => {
      console.log("Connected:", username);
    };

    ws.onmessage = (event) => {
      let data;

      try {
        data = JSON.parse(event.data);
      } catch {
        setCode(event.data);
        return;
      }

      // User updates
      if (data.type === "users") {
        setUsers(data.users);

        // Initialize default cursor positions
        setCursors((prev) => {
          const updated = { ...prev };

          data.users.forEach((user) => {
            if (!updated[user]) {
              updated[user] = {
                username: user,
                position: {
                  line: 0,
                  column: 0,
                },
              };
            }
          });

          return updated;
        });

        return;
      }

      // Cursor updates
      if (data.type === "cursor") {
        setCursors((prev) => ({
          ...prev,
          [data.username]: data,
        }));

        return;
      }

      // Code updates
      if (data.type === "code") {

        // Ignore own updates
        if (data.sender === clientId) return;

        // Mark as remote update
        isRemoteUpdate.current = true;

        setCode(data.code);

        // Reset flag after render cycle
        setTimeout(() => {
          isRemoteUpdate.current = false;
        }, 0);

        return;
      }
    };

    ws.onclose = () => {
      console.log("Disconnected");
    };

    setSocket(ws);
    socketRef.current = ws;

    return () => ws.close();
  }, [joined]);

  // Code sync
  const handleChange = (value) => {
    setCode(value);

    if (socketRef.current) {
      socketRef.current.send(
        JSON.stringify({
          type: "code",
          code: value,
          sender: clientId,
        })
      );
    }
  };

  // Join room
  const handleJoin = () => {
    if (!username || !roomId) {
      alert("Enter username and room ID");
      return;
    }

    setJoined(true);
  };

  // Join screen
  if (!joined) {
    return (
      <div style={{ padding: "50px" }}>
        <h2>Join Room</h2>

        <input
          type="text"
          placeholder="Enter username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <br /><br />

        <input
          type="text"
          placeholder="Enter room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
        />

        <br /><br />

        <button onClick={handleJoin}>Join</button>
      </div>
    );
  }

  // Editor screen
  return (
    <div style={{ display: "flex", height: "100vh" }}>
      
      {/* Sidebar */}
      <div
        style={{
          width: "200px",
          padding: "10px",
          background: "#f4f4f4",
        }}
      >
        <h3>Users</h3>

        {users.map((user, index) => (
          <div key={index}>{user}</div>
        ))}
      </div>

      {/* Editor + Cursor Panel */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <h2 style={{ margin: "10px" }}>
          Room: {roomId}
        </h2>

        {/* Editor */}
        <div style={{ flex: 1 }}>
          <Editor
            height="100%"
            defaultLanguage="javascript"
            value={code}
            onChange={handleChange}
            onMount={(editor) => {

              editor.onDidChangeCursorPosition((e) => {

                // Ignore fake cursor movements
                if (isRemoteUpdate.current) return;

                if (!socketRef.current) return;

                socketRef.current.send(
                  JSON.stringify({
                    type: "cursor",
                    sender: clientId,
                    username: username,
                    position: {
                      line: e.position.lineNumber,
                      column: e.position.column,
                    },
                  })
                );
              });
            }}
          />
        </div>

        {/* Cursor Panel */}
        <div
          style={{
            height: "120px",
            overflowY: "auto",
            borderTop: "1px solid #ccc",
            padding: "10px",
            background: "#fafafa",
          }}
        >
          <h4>Active Cursors:</h4>

          {Object.values(cursors).map((c, index) => {
            if (!c.position) return null;

            return (
              <div key={index}>
                {c.username}: Line {c.position.line}, Col {c.position.column}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default App;