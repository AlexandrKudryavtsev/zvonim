package v1

import (
	"github.com/AlexandrKudryavtsev/zvonim/internal/usecase"
	"github.com/AlexandrKudryavtsev/zvonim/pkg/logger"
	"github.com/gin-gonic/gin"
)

func NewRouter(handler *gin.Engine, logger logger.Interface, roomUC usecase.RoomUseCase, wsUC usecase.WebSocketUseCase) {
	handler.Use(gin.Logger())
	handler.Use(gin.Recovery())

	roomHandler := newRoomHandler(roomUC, logger)
	wsHandler := newWSHandler(wsUC, logger)

	api := handler.Group("/api")
	{
		rooms := api.Group("/room")
		{
			rooms.POST("/join", roomHandler.JoinRoom)
			rooms.GET("/:room_id/info", roomHandler.GetRoomInfo)
			rooms.POST("/leave", roomHandler.LeaveRoom)
			rooms.GET("/:room_id/ws", wsHandler.HandleWebSocket)
		}
	}

	newCommonRoutes(api)
}
