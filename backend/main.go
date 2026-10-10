package main

import (
	"crypto/subtle"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
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
	loadLibrary()
	loadStats()
	
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
		// Allow local development on any port
		if strings.HasPrefix(origin, "http://localhost:") {
			return true
		}
		// Kan Akademi alan adları (ön yüz kanhoot.kanakademi.com.tr'ye taşınınca da bağlanabilsin)
		switch origin {
		case "https://kanakademi.com.tr", "https://www.kanakademi.com.tr", "https://kanhoot.kanakademi.com.tr":
			return true
		}
		// Vercel önizleme/yayın adresleri
		return strings.HasSuffix(origin, ".vercel.app")
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
	id := r.URL.Query().Get("id")

	if pin == "" || name == "" {
		http.Error(w, "pin and name are required", http.StatusBadRequest)
		return
	}

	if id == "" {
		id = uuid.New().String()
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
		ID:   id,
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

	// Setup simple CORS wrapper for API
	cors := func(h http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-Admin-Key")
			if r.Method == "OPTIONS" {
				w.WriteHeader(http.StatusOK)
				return
			}
			h(w, r)
		}
	}

	// Yönetici anahtarı kodda değil, sunucudaki /etc/kahoot-backend.env dosyasında (KANHOOT_ADMIN_KEY).
	// Tanımlı değilse yönetim uçları tamamen kapalıdır.
	adminKey := os.Getenv("KANHOOT_ADMIN_KEY")
	if adminKey == "" {
		log.Println("UYARI: KANHOOT_ADMIN_KEY tanımlı değil, yönetim uçları kapalı")
	}
	yonetici := func(r *http.Request) bool {
		return adminKey != "" && subtle.ConstantTimeCompare([]byte(r.Header.Get("X-Admin-Key")), []byte(adminKey)) == 1
	}

	// GET ?id=… herkese açık (oyun kurmak için gerekir); liste ve kaydetme yalnızca yönetici
	http.HandleFunc("/api/kanhoots", cors(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		if id := r.URL.Query().Get("id"); r.Method == "GET" && id != "" {
			q, ok := GetQuiz(id)
			if !ok {
				http.Error(w, `{"error":"bulunamadı"}`, http.StatusNotFound)
				return
			}
			json.NewEncoder(w).Encode(q)
			return
		}
		if !yonetici(r) {
			http.Error(w, `{"error":"yetkisiz"}`, http.StatusUnauthorized)
			return
		}
		switch r.Method {
		case "GET":
			json.NewEncoder(w).Encode(GetLibrary())
		case "POST":
			r.Body = http.MaxBytesReader(w, r.Body, 1<<20)
			var quiz KanhootQuiz
			if err := json.NewDecoder(r.Body).Decode(&quiz); err != nil {
				http.Error(w, `{"error":"geçersiz istek"}`, http.StatusBadRequest)
				return
			}
			if hata := quizDogrula(quiz); hata != "" {
				http.Error(w, `{"error":"`+hata+`"}`, http.StatusBadRequest)
				return
			}
			kayit, err := UpsertQuiz(quiz)
			if err != nil {
				log.Println("library.json yazılamadı:", err)
				http.Error(w, `{"error":"kaydedilemedi"}`, http.StatusInternalServerError)
				return
			}
			json.NewEncoder(w).Encode(kayit)
		default:
			http.Error(w, `{"error":"desteklenmiyor"}`, http.StatusMethodNotAllowed)
		}
	}))

	http.HandleFunc("/api/stats", cors(func(w http.ResponseWriter, r *http.Request) {
		if !yonetici(r) {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(GetStats())
	}))

	serverAddr := ":8080"
	if p := os.Getenv("PORT"); p != "" {
		serverAddr = ":" + p // yerel denemelerde başka port
	}
	log.Printf("Starting server on %s", serverAddr)

	srv := &http.Server{
		Addr:              serverAddr,
		ReadHeaderTimeout: 3 * time.Second,
	}

	err := srv.ListenAndServe()
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}

// Bozuk bir set oyunu ortasında kilitlemesin: başlık, 1–200 soru, 2–4 seçenek, geçerli doğru cevap ve süre
func quizDogrula(q KanhootQuiz) string {
	if strings.TrimSpace(q.Title) == "" {
		return "başlık boş"
	}
	if len(q.Questions) == 0 || len(q.Questions) > 200 {
		return "soru sayısı 1 ile 200 arasında olmalı"
	}
	for i, s := range q.Questions {
		if strings.TrimSpace(s.Question) == "" || len(s.Options) < 2 || len(s.Options) > 4 ||
			s.CorrectIndex < 0 || s.CorrectIndex >= len(s.Options) || s.TimeLimitSec < 5 || s.TimeLimitSec > 300 {
			return fmt.Sprintf("%d. soru eksik ya da hatalı", i+1)
		}
	}
	return ""
}
