package v1

import (
	"github.com/gin-gonic/gin"
)

type response struct {
	Message string `json:"message,omitempty"`
	Error   string `json:"error,omitempty"`
}

func errorResponse(c *gin.Context, code int, msg string) {
	c.AbortWithStatusJSON(code, response{Error: msg})
}

func successResponse(c *gin.Context, code int, msg string) {
	c.JSON(code, response{Message: msg})
}
