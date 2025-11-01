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
// @Param       meeting_id path string true "Meeting ID"
// @Param       user_id query string true "User ID"
// @Router      /meeting/{meeting_id}/ws [get]
func (h *WSHandler) HandleWebSocket(c *gin.Context) {
	meetingID := c.Param("meeting_id")
	userID := c.Query("user_id")

	if meetingID == "" || userID == "" {
		errorResponse(c, http.StatusBadRequest, "meeting_id and user_id are required")
		return
	}

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		h.logger.Error("failed to upgrade websocket connection", "error", err)
		errorResponse(c, http.StatusInternalServerError, "failed to establish websocket connection")
		return
	}

	h.logger.Info("websocket connection established", "meeting_id", meetingID, "user_id", userID)

	ctx := context.Background()

	wsConn := newWSConnection(conn)

	go h.wsUC.HandleConnection(ctx, wsConn, meetingID, userID)
}
