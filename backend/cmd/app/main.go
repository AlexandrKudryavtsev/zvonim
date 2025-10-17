// @title           github.com/AlexandrKudryavtsev/zvonim
// @version         1.0
// @description     zvonim backend

// @BasePath  /api
// @schemes https http

package main

import (
	"fmt"
	"log"

	"github.com/AlexandrKudryavtsev/zvonim/config"
)

func main() {
	cfg, err := config.NewConfig()
	if err != nil {
		log.Fatalf("can't init config: %s", err)
	}

	fmt.Println(cfg)
}
