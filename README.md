# Zvonim

Zvonim - сервис для групповых видеозвонков

## API

### 1. Создание/вход в комнату
```
POST /api/room/join
Content-Type: application/json

{
  "room_id": "string", // опционально - если не указать, создаст новую
  "user_name": "string"
}

Response:
{
  "room_id": "string",
  "user_id": "string",
  "users_in_room": ["user1", "user2"]
}
```

### 2. Получение информации о комнате
```
GET /api/room/{room_id}/info

Response:
{
  "room_id": "string",
  "users": [
    {
      "user_id": "string",
      "user_name": "string",
      "is_online": boolean
    }
  ],
  "created_at": "timestamp"
}
```

### 3. WebSocket соединение для сигналинга
```
WS /ws?room_id={room_id}&user_id={user_id}
```

### 4. WebSocket сообщения

#### Вход в комнату
```json
{
  "type": "join",
  "user_id": "string",
  "user_name": "string"
}
```

#### WebRTC оффер
```json
{
  "type": "offer",
  "from": "user_id",
  "to": "user_id", // или "all" для всех
  "sdp": "string"
}
```

#### WebRTC ответ
```json
{
  "type": "answer", 
  "from": "user_id",
  "to": "user_id",
  "sdp": "string"
}
```

#### ICE кандидаты
```json
{
  "type": "ice-candidate",
  "from": "user_id",
  "to": "user_id",
  "candidate": "string"
}
```

#### Пользователь присоединился
```json
{
  "type": "user-joined",
  "user_id": "string",
  "user_name": "string"
}
```

#### Пользователь вышел
```json
{
  "type": "user-left", 
  "user_id": "string"
}
```

### 5. Выход из комнаты
```
POST /api/room/leave
Content-Type: application/json

{
  "room_id": "string",
  "user_id": "string"
}

Response: {"success": true}
```

## Модели данных (Go)

```go
package models

import "time"

type JoinRoomRequest struct {
    RoomID   string `json:"room_id"`
    UserName string `json:"user_name"`
}

type JoinRoomResponse struct {
    RoomID      string   `json:"room_id"`
    UserID      string   `json:"user_id"`
    UsersInRoom []string `json:"users_in_room"`
}

type RoomInfo struct {
    RoomID    string    `json:"room_id"`
    Users     []User    `json:"users"`
    CreatedAt time.Time `json:"created_at"`
}

type User struct {
    UserID   string `json:"user_id"`
    UserName string `json:"user_name"`
    IsOnline bool   `json:"is_online"`
}

type LeaveRoomRequest struct {
    RoomID string `json:"room_id"`
    UserID string `json:"user_id"`
}

// WebSocket сообщения
type WSMessage struct {
    Type string      `json:"type"`
    Data interface{} `json:"data,omitempty"`
    From string      `json:"from,omitempty"`
    To   string      `json:"to,omitempty"`
}

type WebRTCOffer struct {
    SDP string `json:"sdp"`
}

type WebRTCAnswer struct {
    SDP string `json:"sdp"`
}

type ICECandidate struct {
    Candidate string `json:"candidate"`
}
```
