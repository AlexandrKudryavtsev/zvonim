package app

import (
	"os"
	"os/signal"
	"syscall"

	"github.com/AlexandrKudryavtsev/zvonim/config"
	v1 "github.com/AlexandrKudryavtsev/zvonim/internal/controller/http/v1"
	"github.com/AlexandrKudryavtsev/zvonim/pkg/httpserver"
	"github.com/AlexandrKudryavtsev/zvonim/pkg/logger"
	"github.com/gin-gonic/gin"
)

func Run(cfg *config.Config) {
	log, err := logger.New(cfg.Log.Level, cfg.Log.Destination)
	if err != nil {
		log.Fatal("can't init logger: %s", err)
	}
	log.Info("logger initialized")

	handler := gin.New()
	handler.Use(gin.Recovery())

	v1.NewRouter(handler, log, nil)
	log.Info("HTTP routes registered")

	httpServer := httpserver.New(handler, httpserver.Port(cfg.HTTP.Port))
	log.Info("HTTP server started", "port", cfg.HTTP.Port)

	interrupt := make(chan os.Signal, 1)
	signal.Notify(interrupt, os.Interrupt, syscall.SIGTERM)

	log.Info("Application started successfully")

	select {
	case s := <-interrupt:
		log.Info("shutdown signal received: " + s.String())
	case err = <-httpServer.Notify():
		log.Error("http server error", "error", err)
	}

	log.Info("shutting down...")

	if err := httpServer.Shutdown(); err != nil {
		log.Error("http server shutdown error", "error", err)
	}

	log.Info("application stopped gracefully")
}
