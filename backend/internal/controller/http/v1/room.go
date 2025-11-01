package v1

import (
	"net/http"

	"github.com/AlexandrKudryavtsev/zvonim/internal/entity"
	"github.com/AlexandrKudryavtsev/zvonim/internal/usecase"
	"github.com/AlexandrKudryavtsev/zvonim/pkg/logger"
	"github.com/gin-gonic/gin"
)

type MeetingHandler struct {
	meetingUC usecase.MeetingUseCase
	logger    logger.Interface
}

func newMeetingHandler(meetingUC usecase.MeetingUseCase, logger logger.Interface) *MeetingHandler {
	return &MeetingHandler{
		meetingUC: meetingUC,
		logger:    logger,
	}
}

// JoinMeeting создает встречу или присоединяет к существующей
// @Summary     Join or create meeting
// @Description Create a new meeting or join existing one
// @Tags        meetings
// @Accept      json
// @Produce     json
// @Param       request body entity.JoinMeetingRequest true "Join meeting request"
// @Success     200 {object} entity.JoinMeetingResponse
// @Failure     400 {object} response
// @Failure     500 {object} response
// @Router      /meeting/join [post]
func (h *MeetingHandler) JoinMeeting(c *gin.Context) {
	var req entity.JoinMeetingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.logger.Error("invalid request body", "error", err)
		errorResponse(c, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.UserName == "" {
		errorResponse(c, http.StatusBadRequest, "user_name is required")
		return
	}

	resp, err := h.meetingUC.JoinMeeting(c.Request.Context(), &req)
	if err != nil {
		h.logger.Error("failed to join meeting", "error", err)
		errorResponse(c, http.StatusInternalServerError, "failed to join meeting")
		return
	}

	c.JSON(http.StatusOK, resp)
}

// GetMeetingInfo возвращает информацию о встречи
// @Summary     Get meeting info
// @Description Get meeting information and users list
// @Tags        meetings
// @Produce     json
// @Param       meeting_id path string true "Meeting ID"
// @Success     200 {object} entity.Meeting
// @Failure     400 {object} response
// @Failure     404 {object} response
// @Failure     500 {object} response
// @Router      /meeting/{meeting_id}/info [get]
func (h *MeetingHandler) GetMeetingInfo(c *gin.Context) {
	meetingID := c.Param("meeting_id")
	if meetingID == "" {
		errorResponse(c, http.StatusBadRequest, "meeting_id is required")
		return
	}

	meeting, err := h.meetingUC.GetMeetingInfo(c.Request.Context(), meetingID)
	if err != nil {
		h.logger.Error("failed to get meeting info", "meeting_id", meetingID, "error", err)
		errorResponse(c, http.StatusInternalServerError, "failed to get meeting info")
		return
	}

	if meeting == nil {
		errorResponse(c, http.StatusNotFound, "meeting not found")
		return
	}

	c.JSON(http.StatusOK, meeting)
}

// LeaveMeeting покинуть встречу
// @Summary     Leave meeting
// @Description Leave the meeting
// @Tags        meetings
// @Accept      json
// @Produce     json
// @Param       request body entity.LeaveMeetingRequest true "Leave meeting request"
// @Success     200 {object} response
// @Failure     400 {object} response
// @Failure     500 {object} response
// @Router      /meeting/leave [post]
func (h *MeetingHandler) LeaveMeeting(c *gin.Context) {
	var req entity.LeaveMeetingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.logger.Error("invalid request body", "error", err)
		errorResponse(c, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.MeetingID == "" || req.UserID == "" {
		errorResponse(c, http.StatusBadRequest, "meeting_id and user_id are required")
		return
	}

	err := h.meetingUC.LeaveMeeting(c.Request.Context(), &req)
	if err != nil {
		h.logger.Error("failed to leave meeting", "meeting_id", req.MeetingID, "user_id", req.UserID, "error", err)
		errorResponse(c, http.StatusInternalServerError, "failed to leave meeting")
		return
	}

	c.JSON(http.StatusOK, response{Message: "success"})
}
