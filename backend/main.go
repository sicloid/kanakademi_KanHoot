package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

type Question struct {
	Question      string   `json:"question"`
	Options       []string `json:"options"`
	CorrectIndex  int      `json:"correct_index"`
	TimeLimitSec  int      `json:"time_limit_sec"`
}

var QuizQuestions []Question

func init() {
	b, err := os.ReadFile("quiz.json")
	if err != nil {
		log.Println("Could not read quiz.json, using empty questions list", err)
		return
	}
	if err := json.Unmarshal(b, &QuizQuestions); err != nil {
		log.Println("Could not parse quiz.json", err)
	}
}

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		origin := r.Header.Get("Origin")
		// Allow local development and Vercel domains
		if origin == "http://localhost:3000" || origin == "http://localhost:8080" {
			return true
		}
		// Allow kanakademi-quiz and related vercel app domains
		// To make it strict to the exact deployment domain, you can check strings.HasSuffix(origin, ".vercel.app")
		// For MVP security, we allow any vercel app or localhost
		// In prod, replace with exact domain e.g., origin == "https://hsd-quiz.vercel.app"
		if len(origin) > 11 && origin[len(origin)-11:] == ".vercel.app" {
			return true
		}
		return false
	},
}

func serveWsHost(hub *Hub, w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Upgrade error:", err)
		return
	}

	client := &Client{
		ID:   uuid.New().String(),
		Role: "host",
		Conn: conn,
		send: make(chan []byte, 256),
		Hub:  hub,
	}

	game := hub.CreateGame(client)
	client.Game = game

	// Send the game PIN to the host
	client.send <- []byte(`{"type":"game_created","data":{"pin":"` + game.Pin + `"}}`)

	go client.writePump()
	go client.readPump()
}

func serveWsPlayer(hub *Hub, w http.ResponseWriter, r *http.Request) {
	pin := r.URL.Query().Get("pin")
	name := r.URL.Query().Get("name")

	if pin == "" || name == "" {
		http.Error(w, "pin and name are required", http.StatusBadRequest)
		return
	}

	game := hub.GetGame(pin)
	if game == nil {
		http.Error(w, "game not found", http.StatusNotFound)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Upgrade error:", err)
		return
	}

	client := &Client{
		ID:   uuid.New().String(),
		Role: "player",
		Conn: conn,
		send: make(chan []byte, 256),
		Hub:  hub,
		Game: game,
	}

	game.AddPlayer(client, name)

	// Notify player they joined
	client.send <- []byte(`{"type":"joined_game","data":{"pin":"` + game.Pin + `"}}`)

	go client.writePump()
	go client.readPump()
}

func main() {
	hub := NewHub()
	// Create a test game
	host := &Client{ID: "test-host", Role: "host"}
	game := NewGame("123456", host)
	game.AcceptingAnswers = true
	hub.games["123456"] = game

	http.HandleFunc("/ws/host", func(w http.ResponseWriter, r *http.Request) {
		serveWsHost(hub, w, r)
	})

	http.HandleFunc("/ws/player", func(w http.ResponseWriter, r *http.Request) {
		serveWsPlayer(hub, w, r)
	})

	serverAddr := ":8080"
	log.Printf("Starting WebSocket server on %s", serverAddr)

	srv := &http.Server{
		Addr:              serverAddr,
		ReadHeaderTimeout: 3 * time.Second,
	}

	err := srv.ListenAndServe()
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}
