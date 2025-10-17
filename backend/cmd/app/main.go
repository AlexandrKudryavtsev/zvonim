// @title           Zvonim App
// @version         1.0
// @description     zvonim backend

// @BasePath  /api
// @schemes https http
package main

import (
	"log"

	"github.com/AlexandrKudryavtsev/zvonim/config"
	"github.com/AlexandrKudryavtsev/zvonim/internal/app"
)

func main() {
	cfg, err := config.NewConfig()
	if err != nil {
		log.Fatalf("can't init config: %s", err)
	}

	app.Run(cfg)
}
