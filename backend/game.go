package main

import (
	"encoding/json"
	"log"
	"sync"
	"time"
)

// Player represents a connected user in a game.
type Player struct {
	ID    string
	Name  string
	Score int
}

// Game represents a single game instance.
type Game struct {
	Pin              string
	Host             *Client
	Players          map[string]*Client
	Scores           map[string]int
	Names            map[string]string
	Questions        []Question
	CurrentQuestion  int
	AcceptingAnswers bool
	QuestionStartTime time.Time
	HasAnswered      map[string]bool
	mu               sync.RWMutex
}

func NewGame(pin string, host *Client) *Game {
	return &Game{
		Pin:              pin,
		Host:             host,
		Players:          make(map[string]*Client),
		Scores:           make(map[string]int),
		Names:            make(map[string]string),
		Questions:        QuizQuestions, // Defaults to the loaded quiz.json
		CurrentQuestion:  -1,
		AcceptingAnswers: false,
		HasAnswered:      make(map[string]bool),
	}
}

// AddPlayer adds a player to the game.
func (g *Game) AddPlayer(client *Client, name string) {
	g.mu.Lock()
	g.Players[client.ID] = client
	if _, exists := g.Scores[client.ID]; !exists {
		g.Scores[client.ID] = 0
	}
	g.Names[client.ID] = name
	g.mu.Unlock()

	// Notify host of new player
	g.BroadcastToHost(Message{
		Type: "player_joined",
		Data: map[string]interface{}{
			"id":   client.ID,
			"name": name,
		},
	})
}

// RemovePlayer removes a player from the game.
func (g *Game) RemovePlayer(clientID string) {
	g.mu.Lock()
	delete(g.Players, clientID)
	// Optionally keep score and name to display later
	g.mu.Unlock()

	g.BroadcastToHost(Message{
		Type: "player_left",
		Data: map[string]interface{}{
			"id": clientID,
		},
	})
}

// BroadcastToHost sends a message to the host.
func (g *Game) BroadcastToHost(msg Message) {
	b, err := json.Marshal(msg)
	if err != nil {
		log.Println("Error marshalling to host:", err)
		return
	}
	if g.Host != nil {
		select {
		case g.Host.send <- b:
		default:
			close(g.Host.send)
			g.Host = nil
		}
	}
}

// BroadcastToPlayers sends a message to all players.
func (g *Game) BroadcastToPlayers(msg Message) {
	b, err := json.Marshal(msg)
	if err != nil {
		log.Println("Error marshalling to players:", err)
		return
	}
	g.mu.RLock()
	defer g.mu.RUnlock()
	for _, p := range g.Players {
		select {
		case p.send <- b:
		default:
			close(p.send)
			delete(g.Players, p.ID)
		}
	}
}

func (g *Game) SendToPlayer(clientID string, msg Message) {
	g.mu.RLock()
	defer g.mu.RUnlock()
	if p, ok := g.Players[clientID]; ok {
		b, err := json.Marshal(msg)
		if err == nil {
			select {
			case p.send <- b:
			default:
			}
		}
	}
}

var ColorToIndex = map[string]int{
	"red":    0,
	"blue":   1,
	"yellow": 2,
	"green":  3,
}

// HandleAnswer processes an answer from a player.
func (g *Game) HandleAnswer(clientID string, color string) {
	g.mu.Lock()
	defer g.mu.Unlock()

	if !g.AcceptingAnswers || g.CurrentQuestion < 0 || g.CurrentQuestion >= len(g.Questions) {
		return
	}

	if g.HasAnswered[clientID] {
		return // Ignore multiple answers from same player
	}
	g.HasAnswered[clientID] = true

	colorIndex, ok := ColorToIndex[color]
	if !ok {
		return
	}

	question := g.Questions[g.CurrentQuestion]
	elapsed := time.Since(g.QuestionStartTime).Seconds()
	timeLimit := float64(question.TimeLimitSec)

	score := 0
	isCorrect := false

	if colorIndex == question.CorrectIndex {
		isCorrect = true
		rawScore := ((timeLimit - elapsed) / timeLimit) * 1000
		if rawScore < 0 {
			rawScore = 0
		}
		score = int(rawScore)
		g.Scores[clientID] += score
	}

	g.BroadcastToHost(Message{
		Type: "answer_received",
		Data: map[string]interface{}{
			"id":        clientID,
			"isCorrect": isCorrect,
		},
	})

	// Check if all active players have answered
	allAnswered := len(g.HasAnswered) >= len(g.Players)
	if allAnswered {
		// Run EndQuestion asynchronously to not block HandleAnswer mutex
		go g.EndQuestion()
	}
}

// GetLeaderboard returns current scores sorted or as map.
func (g *Game) GetLeaderboard() map[string]interface{} {
	g.mu.RLock()
	defer g.mu.RUnlock()
	
	leaderboard := make([]map[string]interface{}, 0)
	for id, score := range g.Scores {
		leaderboard = append(leaderboard, map[string]interface{}{
			"id":    id,
			"name":  g.Names[id],
			"score": score,
		})
	}
	
	return map[string]interface{}{
		"leaderboard": leaderboard,
	}
}

func (g *Game) NextQuestion() {
	g.mu.Lock()
	g.CurrentQuestion++
	if g.CurrentQuestion >= len(g.Questions) {
		g.mu.Unlock()
		g.EndGame()
		return
	}
	
	g.AcceptingAnswers = true
	g.QuestionStartTime = time.Now()
	g.HasAnswered = make(map[string]bool)
	
	q := g.Questions[g.CurrentQuestion]
	g.mu.Unlock()

	g.BroadcastToHost(Message{
		Type: "question_started",
		Data: map[string]interface{}{
			"question":   q.Question,
			"options":    q.Options,
			"timeLimit":  q.TimeLimitSec,
			"current":    g.CurrentQuestion + 1,
			"total":      len(g.Questions),
		},
	})
	
	g.BroadcastToPlayers(Message{
		Type: "question_started",
		Data: map[string]interface{}{
			"optionCount": len(q.Options),
		},
	})
}

func (g *Game) EndQuestion() {
	g.mu.Lock()
	if !g.AcceptingAnswers {
		g.mu.Unlock()
		return
	}
	g.AcceptingAnswers = false
	qIndex := g.CurrentQuestion
	if qIndex < 0 || qIndex >= len(g.Questions) {
		g.mu.Unlock()
		return
	}
	correctIndex := g.Questions[qIndex].CorrectIndex
	g.mu.Unlock()

	// Calculate ranks
	g.mu.RLock()
	type playerRank struct {
		id    string
		score int
	}
	var ranks []playerRank
	for id, score := range g.Scores {
		ranks = append(ranks, playerRank{id, score})
	}
	g.mu.RUnlock()

	// We can sort them here but frontend can also sort. Let's let frontend sort for leaderboard.
	
	g.BroadcastToHost(Message{
		Type: "question_ended",
		Data: map[string]interface{}{
			"correctIndex": correctIndex,
			"leaderboard":  g.GetLeaderboard()["leaderboard"],
		},
	})

	// Inform players individually
	g.mu.RLock()
	playerSnapshots := make(map[string]int)
	for id, score := range g.Scores {
		playerSnapshots[id] = score
	}
	g.mu.RUnlock()

	for id, score := range playerSnapshots {
		g.SendToPlayer(id, Message{
			Type: "question_ended",
			Data: map[string]interface{}{
				"score": score,
			},
		})
	}
}

func (g *Game) EndGame() {
	lb := g.GetLeaderboard()
	g.BroadcastToHost(Message{
		Type: "game_ended",
		Data: lb,
	})
	g.BroadcastToPlayers(Message{
		Type: "game_ended",
	})

	// Save stats
	if lbArray, ok := lb["leaderboard"].([]map[string]interface{}); ok {
		var arr []interface{}
		for _, item := range lbArray {
			arr = append(arr, item)
		}
		AddGameStat(GameStat{
			GameID:      g.Pin,
			Date:        time.Now(),
			Leaderboard: arr,
		})
	} else if lbArray, ok := lb["leaderboard"].([]interface{}); ok {
		AddGameStat(GameStat{
			GameID:      g.Pin,
			Date:        time.Now(),
			Leaderboard: lbArray,
		})
	}
}
