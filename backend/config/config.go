package config

import (
	"fmt"
	"strings"
	"time"

	"github.com/ilyakaznacheev/cleanenv"
)

type (
	Config struct {
		HTTP HTTP `yaml:"http"`
		Log  Log  `yaml:"logger"`
		WS   WS   `yaml:"websocket"`
	}

	HTTP struct {
		Port string `yaml:"port"`
	}

	Log struct {
		Level       string `yaml:"level"`
		Destination string `yaml:"destination" env:"LOG_DESTINATION"`
	}

	WS struct {
		ReadBufferSize  int           `yaml:"read_buffer_size"`
		WriteBufferSize int           `yaml:"write_buffer_size"`
		PongWait        time.Duration `yaml:"pong_wait"`
		PingPeriod      time.Duration `yaml:"ping_period"`
		MaxMessageSize  int64         `yaml:"max_message_size"`
	}
)

func NewConfig() (*Config, error) {
	cfg := &Config{}

	err := cleanenv.ReadConfig("./config/config.yml", cfg)
	if err != nil {
		return nil, fmt.Errorf("can't read yml config: %w", err)
	}

	err = cleanenv.ReadEnv(cfg)
	if err != nil {
		return nil, fmt.Errorf("can't read env variables: %w", err)
	}

	if err := validateDestination(cfg.Log.Destination); err != nil {
		return nil, err
	}

	return cfg, nil
}

func validateDestination(destination string) error {
	destination = strings.ToLower(destination)
	if destination != "file" && destination != "console" {
		return fmt.Errorf("invalid log destination: %s. Use 'file' or 'console'", destination)
	}
	return nil
}
