package main

import (
	"encoding/json"
	"os"
	"sync"
	"time"
)

type KahootQuiz struct {
	ID        string     `json:"id"`
	Title     string     `json:"title"`
	Questions []Question `json:"questions"`
}

type GameStat struct {
	GameID      string                 `json:"game_id"`
	Date        time.Time              `json:"date"`
	Leaderboard []interface{}          `json:"leaderboard"`
}

var (
	Library []KahootQuiz
	Stats   []GameStat
	libMu   sync.RWMutex
	statMu  sync.RWMutex
)

func loadLibrary() {
	b, err := os.ReadFile("library.json")
	if err == nil {
		json.Unmarshal(b, &Library)
	} else {
		Library = []KahootQuiz{}
	}
}

func saveLibrary() {
	b, _ := json.MarshalIndent(Library, "", "  ")
	os.WriteFile("library.json", b, 0644)
}

func loadStats() {
	b, err := os.ReadFile("stats.json")
	if err == nil {
		json.Unmarshal(b, &Stats)
	} else {
		Stats = []GameStat{}
	}
}

func saveStats() {
	b, _ := json.MarshalIndent(Stats, "", "  ")
	os.WriteFile("stats.json", b, 0644)
}

func AddQuizToLibrary(quiz KahootQuiz) {
	libMu.Lock()
	defer libMu.Unlock()
	Library = append(Library, quiz)
	saveLibrary()
}

func GetLibrary() []KahootQuiz {
	libMu.RLock()
	defer libMu.RUnlock()
	return Library
}

func AddGameStat(stat GameStat) {
	statMu.Lock()
	defer statMu.Unlock()
	Stats = append(Stats, stat)
	saveStats()
}

func GetStats() []GameStat {
	statMu.RLock()
	defer statMu.RUnlock()
	return Stats
}
