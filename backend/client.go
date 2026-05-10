package main

import (
	"encoding/json"
	"io"
	"log"
	"net/http"
	"regexp"
	"strings"
	"time"

	"github.com/gorilla/websocket"
)

const (
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
	pingPeriod     = (pongWait * 9) / 10
	maxMessageSize = 512
)

// Client is a middleman between the websocket connection and the hub/game.
type Client struct {
	ID   string
	Role string // "host" or "player"
	Conn *websocket.Conn
	send chan []byte
	Hub  *Hub
	Game *Game
}

type Message struct {
	Type string                 `json:"type"`
	Data map[string]interface{} `json:"data,omitempty"`
}

// readPump pumps messages from the websocket connection to the hub.
func (c *Client) readPump() {
	defer func() {
		if c.Role == "host" && c.Game != nil {
			c.Hub.RemoveGame(c.Game.Pin)
			// Notify players game is over
			c.Game.BroadcastToPlayers(Message{Type: "game_ended"})
		} else if c.Role == "player" && c.Game != nil {
			c.Game.RemovePlayer(c.ID)
		}
		c.Conn.Close()
	}()

	c.Conn.SetReadLimit(maxMessageSize)
	c.Conn.SetReadDeadline(time.Now().Add(pongWait))
	c.Conn.SetPongHandler(func(string) error { c.Conn.SetReadDeadline(time.Now().Add(pongWait)); return nil })

	for {
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("error: %v", err)
			}
			break
		}

		var msg Message
		if err := json.Unmarshal(message, &msg); err != nil {
			continue
		}

		c.handleMessage(msg)
	}
}

// writePump pumps messages from the hub to the websocket connection.
func (c *Client) writePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				// The hub closed the channel.
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.Conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			if err := w.Close(); err != nil {
				return
			}
		case <-ticker.C:
			c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func (c *Client) handleMessage(msg Message) {
	if c.Role == "host" {
		switch msg.Type {
		case "import_kahoot":
			if c.Game != nil {
				urlStr, ok := msg.Data["url"].(string)
				if ok {
					go func() {
						// Extract UUID from URL
						parts := strings.Split(urlStr, "/")
						uuid := parts[len(parts)-1]
						
						resp, err := http.Get("https://create.kahoot.it/rest/kahoots/" + uuid)
						if err == nil && resp.StatusCode == 200 {
							body, _ := io.ReadAll(resp.Body)
							var kResp struct {
								Questions []struct {
									Question string `json:"question"`
									Time     int    `json:"time"`
									Choices  []struct {
										Answer  string `json:"answer"`
										Correct bool   `json:"correct"`
									} `json:"choices"`
								} `json:"questions"`
							}
							if err := json.Unmarshal(body, &kResp); err == nil {
								var newQuestions []Question
								re := regexp.MustCompile("<[^>]*>")
								for _, kq := range kResp.Questions {
									cleanQ := re.ReplaceAllString(kq.Question, "")
									q := Question{
										Question:     strings.TrimSpace(cleanQ),
										TimeLimitSec: kq.Time / 1000,
										Options:      []string{},
										CorrectIndex: 0,
									}
									for i, c := range kq.Choices {
										q.Options = append(q.Options, c.Answer)
										if c.Correct {
											q.CorrectIndex = i
										}
									}
									// Pad to 4 options if fewer
									for len(q.Options) < 4 {
										q.Options = append(q.Options, "")
									}
									newQuestions = append(newQuestions, q)
								}
								if len(newQuestions) > 0 {
									c.Game.mu.Lock()
									c.Game.Questions = newQuestions
									c.Game.mu.Unlock()
									c.send <- []byte(`{"type":"kahoot_imported"}`)
								}
							}
						}
					}()
				}
			}
		case "start_game":
			// start_game acts like next_question for the very first question
			if c.Game != nil {
				c.Game.NextQuestion()
			}
		case "next_question":
			if c.Game != nil {
				c.Game.NextQuestion()
			}
		case "end_question":
			if c.Game != nil {
				c.Game.EndQuestion()
			}
		}
	} else if c.Role == "player" {
		switch msg.Type {
		case "answer":
			if color, ok := msg.Data["color"].(string); ok && c.Game != nil {
				c.Game.HandleAnswer(c.ID, color)
			}
		}
	}
}
