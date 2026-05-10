package main

import (
	"math/rand"
	"strconv"
	"sync"
	"time"
)

// Hub maintains the set of active games.
type Hub struct {
	games map[string]*Game
	mu    sync.RWMutex
}

func NewHub() *Hub {
	return &Hub{
		games: make(map[string]*Game),
	}
}

// CreateGame creates a new game and returns the PIN.
func (h *Hub) CreateGame(host *Client) *Game {
	h.mu.Lock()
	defer h.mu.Unlock()

	// Generate a 4-6 digit PIN
	rand.Seed(time.Now().UnixNano())
	pin := strconv.Itoa(rand.Intn(900000) + 100000)

	// Ensure PIN is unique
	for h.games[pin] != nil {
		pin = strconv.Itoa(rand.Intn(900000) + 100000)
	}

	game := NewGame(pin, host)
	h.games[pin] = game

	return game
}

// GetGame retrieves a game by PIN.
func (h *Hub) GetGame(pin string) *Game {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return h.games[pin]
}

// RemoveGame deletes a game from the hub.
func (h *Hub) RemoveGame(pin string) {
	h.mu.Lock()
	defer h.mu.Unlock()
	delete(h.games, pin)
}
