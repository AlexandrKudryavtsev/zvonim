package v1

import (
	"context"
	"net/http"

	"github.com/AlexandrKudryavtsev/zvonim/internal/usecase"
	"github.com/AlexandrKudryavtsev/zvonim/pkg/logger"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

type WSHandler struct {
	wsUC   usecase.WebSocketUseCase
	logger logger.Interface
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // TODO: в production настроить
	},
}

func newWSHandler(wsUC usecase.WebSocketUseCase, logger logger.Interface) *WSHandler {
	return &WSHandler{
		wsUC:   wsUC,
		logger: logger,
	}
}

// HandleWebSocket обрабатывает WebSocket соединения для сигналинга
// @Summary     WebSocket для сигналинга
// @Description WebSocket endpoint для обмена WebRTC сигналами
// @Tags        websocket
// @Param       room_id path string true "Room ID"
// @Param       user_id query string true "User ID"
// @Router      /room/{room_id}/ws [get]
func (h *WSHandler) HandleWebSocket(c *gin.Context) {
	roomID := c.Param("room_id")
	userID := c.Query("user_id")

	if roomID == "" || userID == "" {
		errorResponse(c, http.StatusBadRequest, "room_id and user_id are required")
		return
	}

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		h.logger.Error("failed to upgrade websocket connection", "error", err)
		errorResponse(c, http.StatusInternalServerError, "failed to establish websocket connection")
		return
	}

	h.logger.Info("websocket connection established", "room_id", roomID, "user_id", userID)

	ctx := context.Background()

	wsConn := newWSConnection(conn)

	go h.wsUC.HandleConnection(ctx, wsConn, roomID, userID)
}
