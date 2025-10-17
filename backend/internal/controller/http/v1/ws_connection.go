package v1

import (
	"sync"

	"github.com/gorilla/websocket"
)

type wsConnection struct {
	conn *websocket.Conn
	mu   sync.Mutex
}

func newWSConnection(conn *websocket.Conn) *wsConnection {
	return &wsConnection{
		conn: conn,
	}
}

func (w *wsConnection) ReadMessage() ([]byte, error) {
	_, message, err := w.conn.ReadMessage()
	return message, err
}

func (w *wsConnection) WriteMessage(messageType int, data []byte) error {
	w.mu.Lock()
	defer w.mu.Unlock()
	return w.conn.WriteMessage(messageType, data)
}

func (w *wsConnection) Close() error {
	return w.conn.Close()
}
