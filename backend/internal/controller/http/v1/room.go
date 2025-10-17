package v1

import (
	"net/http"

	"github.com/AlexandrKudryavtsev/zvonim/internal/entity"
	"github.com/AlexandrKudryavtsev/zvonim/internal/usecase"
	"github.com/AlexandrKudryavtsev/zvonim/pkg/logger"
	"github.com/gin-gonic/gin"
)

type RoomHandler struct {
	roomUC usecase.RoomUseCase
	logger logger.Interface
}

func newRoomHandler(roomUC usecase.RoomUseCase, logger logger.Interface) *RoomHandler {
	return &RoomHandler{
		roomUC: roomUC,
		logger: logger,
	}
}

// JoinRoom создает комнату или присоединяет к существующей
// @Summary     Join or create room
// @Description Create a new room or join existing one
// @Tags        rooms
// @Accept      json
// @Produce     json
// @Param       request body entity.JoinRoomRequest true "Join room request"
// @Success     200 {object} entity.JoinRoomResponse
// @Failure     400 {object} response
// @Failure     500 {object} response
// @Router      /room/join [post]
func (h *RoomHandler) JoinRoom(c *gin.Context) {
	var req entity.JoinRoomRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.logger.Error("invalid request body", "error", err)
		errorResponse(c, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.UserName == "" {
		errorResponse(c, http.StatusBadRequest, "user_name is required")
		return
	}

	resp, err := h.roomUC.JoinRoom(c.Request.Context(), &req)
	if err != nil {
		h.logger.Error("failed to join room", "error", err)
		errorResponse(c, http.StatusInternalServerError, "failed to join room")
		return
	}

	c.JSON(http.StatusOK, resp)
}

// GetRoomInfo возвращает информацию о комнате
// @Summary     Get room info
// @Description Get room information and users list
// @Tags        rooms
// @Produce     json
// @Param       room_id path string true "Room ID"
// @Success     200 {object} entity.Room
// @Failure     400 {object} response
// @Failure     404 {object} response
// @Failure     500 {object} response
// @Router      /room/{room_id}/info [get]
func (h *RoomHandler) GetRoomInfo(c *gin.Context) {
	roomID := c.Param("room_id")
	if roomID == "" {
		errorResponse(c, http.StatusBadRequest, "room_id is required")
		return
	}

	room, err := h.roomUC.GetRoomInfo(c.Request.Context(), roomID)
	if err != nil {
		h.logger.Error("failed to get room info", "room_id", roomID, "error", err)
		errorResponse(c, http.StatusInternalServerError, "failed to get room info")
		return
	}

	if room == nil {
		errorResponse(c, http.StatusNotFound, "room not found")
		return
	}

	c.JSON(http.StatusOK, room)
}

// LeaveRoom покинуть комнату
// @Summary     Leave room
// @Description Leave the room
// @Tags        rooms
// @Accept      json
// @Produce     json
// @Param       request body entity.LeaveRoomRequest true "Leave room request"
// @Success     200 {object} response
// @Failure     400 {object} response
// @Failure     500 {object} response
// @Router      /room/leave [post]
func (h *RoomHandler) LeaveRoom(c *gin.Context) {
	var req entity.LeaveRoomRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.logger.Error("invalid request body", "error", err)
		errorResponse(c, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.RoomID == "" || req.UserID == "" {
		errorResponse(c, http.StatusBadRequest, "room_id and user_id are required")
		return
	}

	err := h.roomUC.LeaveRoom(c.Request.Context(), &req)
	if err != nil {
		h.logger.Error("failed to leave room", "room_id", req.RoomID, "user_id", req.UserID, "error", err)
		errorResponse(c, http.StatusInternalServerError, "failed to leave room")
		return
	}

	c.JSON(http.StatusOK, response{Message: "success"})
}
