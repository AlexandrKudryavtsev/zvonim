package v1

import (
	"github.com/AlexandrKudryavtsev/zvonim/internal/usecase"
	"github.com/AlexandrKudryavtsev/zvonim/pkg/logger"
	"github.com/gin-gonic/gin"
)

func NewRouter(handler *gin.Engine, logger logger.Interface, meetingUC usecase.MeetingUseCase, wsUC usecase.WebSocketUseCase) {
	handler.Use(gin.Logger())
	handler.Use(gin.Recovery())

	meetingHandler := newMeetingHandler(meetingUC, logger)
	wsHandler := newWSHandler(wsUC, logger)

	api := handler.Group("/api")
	{
		meetings := api.Group("/meeting")
		{
			meetings.POST("/join", meetingHandler.JoinMeeting)
			meetings.GET("/:meeting_id/info", meetingHandler.GetMeetingInfo)
			meetings.POST("/leave", meetingHandler.LeaveMeeting)
			meetings.GET("/:meeting_id/ws", wsHandler.HandleWebSocket)
		}
	}

	newCommonRoutes(api)
}
