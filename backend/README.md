# Документация для фронтенда

### 1 Создание/вход в встречу

**POST** `/meeting/join`

**Тело запроса:**
```json
{
  "meeting_id": "необязательно", 
  "user_name": "Имя пользователя"
}
```

**Успешный ответ (200):**
```json
{
  "meeting_id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "550e8400-e29b-41d4-a716-446655440001", 
  "users_in_meeting": ["Алиса", "Боб"]
}
```

**Ошибки:**
- `400` - неверные данные
- `404` - встреча не найдена (если указан meeting_id)
- `500` - внутренняя ошибка сервера

---

### 2. Получение информации о встрече

**GET** `/meeting/{meeting_id}/info`

**Успешный ответ (200):**
```json
{
  "meeting_id": "550e8400-e29b-41d4-a716-446655440000",
  "users": [
    {
      "user_id": "id1",
      "user_name": "Алиса",
      "is_online": true
    },
    {
      "user_id": "id2", 
      "user_name": "Боб",
      "is_online": false
    }
  ],
  "created_at": "2024-01-15T10:30:00Z"
}
```

---

### 3. Выход из встречи

**POST** `/meeting/leave`

**Тело запроса:**
```json
{
  "meeting_id": "id встречи",
  "user_id": "id пользователя"
}
```

**Успешный ответ:** `200 OK`

---

## WebSocket соединение

### Подключение к WebSocket

**URL:** `ws://your-domain.com/api/meeting/{meeting_id}/ws?user_id={user_id}`

**Параметры:**
- `meeting_id` - ID встречи (из пути)
- `user_id` - ID пользователя (query параметр)

**Пример:**
```javascript
const ws = new WebSocket(
  `ws://your-domain.com/api/meeting/meeting-123/ws?user_id=user-456`
);
```

---

## WebSocket сообщения

### Формат всех сообщений:
```typescript
interface WSMessage {
  type: string;           // тип сообщения
  data: any;             // данные сообщения
  from: string;          // ID отправителя
  to?: string;           // ID получателя (опционально)
}
```

---

### 1. Системные сообщения

#### **user_joined** - новый пользователь присоединился
```json
{
  "type": "user_joined",
  "data": {
    "user_id": "новый-user-id",
    "user_name": "имя"
  },
  "from": "новый-user-id"
}
```

#### **user_left** - пользователь покинул встречу
```json
{
  "type": "user_left", 
  "data": {
    "user_id": "user-id-который-вышел"
  },
  "from": "user-id-который-вышел"
}
```

---

### 2. WebRTC сигнальные сообщения

#### **offer** - предложение соединения
```json
{
  "type": "offer",
  "data": {
    "sdp": "v=0\r\no=- 123456 2 IN IP4 127.0.0.1..."
  },
  "from": "отправитель-id",
  "to": "получатель-id"
}
```

#### **answer** - ответ на предложение
```json
{
  "type": "answer", 
  "data": {
    "sdp": "v=0\r\no=- 789012 2 IN IP4 127.0.0.1..."
  },
  "from": "отправитель-id",
  "to": "получатель-id"
}
```

#### **ice_candidate** - ICE кандидат
```json
{
  "type": "ice_candidate",
  "data": {
    "candidate": "candidate:123456 1 udp 12345 192.168.1.1 44345 typ host"
  },
  "from": "отправитель-id", 
  "to": "получатель-id"
}
```
