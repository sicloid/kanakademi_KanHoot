package main

import (
	"encoding/json"
	"os"
	"sort"
	"sync"
	"time"

	"github.com/google/uuid"
)

// Soru setleri VPS'te library.json'da tutulur (önceden Supabase'teydi; ücretsiz proje uyuyunca kütüphane erişilemez oluyordu).
type KanhootQuiz struct {
	ID        string     `json:"id"`
	Title     string     `json:"title"`
	Questions []Question `json:"questions"`
	CreatedAt time.Time  `json:"createdAt"`
	UpdatedAt time.Time  `json:"updatedAt"`
}

type GameStat struct {
	GameID      string        `json:"game_id"`
	Date        time.Time     `json:"date"`
	Leaderboard []interface{} `json:"leaderboard"`
}

var (
	Library []KanhootQuiz
	Stats   []GameStat
	libMu   sync.RWMutex
	statMu  sync.RWMutex
)

// Önce geçici dosyaya yazıp yeniden adlandırır: yazma yarıda kesilirse (elektrik, disk dolu) eski dosya bozulmaz.
func writeJSONAtomic(name string, v any) error {
	b, err := json.MarshalIndent(v, "", "  ")
	if err != nil {
		return err
	}
	tmp := name + ".tmp"
	if err := os.WriteFile(tmp, b, 0600); err != nil {
		return err
	}
	return os.Rename(tmp, name)
}

func loadLibrary() {
	b, err := os.ReadFile("library.json")
	if err == nil {
		json.Unmarshal(b, &Library)
	} else {
		Library = []KanhootQuiz{}
	}
}

func saveLibrary() error { return writeJSONAtomic("library.json", Library) }

func loadStats() {
	b, err := os.ReadFile("stats.json")
	if err == nil {
		json.Unmarshal(b, &Stats)
	} else {
		Stats = []GameStat{}
	}
}

func saveStats() error { return writeJSONAtomic("stats.json", Stats) }

// Kimliği varsa günceller (oluşturulma tarihi korunur), yoksa ekler.
func UpsertQuiz(q KanhootQuiz) (KanhootQuiz, error) {
	libMu.Lock()
	defer libMu.Unlock()
	simdi := time.Now().UTC()
	if q.ID == "" {
		q.ID = uuid.NewString()
	}
	q.UpdatedAt = simdi
	for i := range Library {
		if Library[i].ID == q.ID {
			q.CreatedAt = Library[i].CreatedAt
			Library[i] = q
			return q, saveLibrary()
		}
	}
	if q.CreatedAt.IsZero() {
		q.CreatedAt = simdi
	}
	Library = append(Library, q)
	return q, saveLibrary()
}

func GetQuiz(id string) (KanhootQuiz, bool) {
	libMu.RLock()
	defer libMu.RUnlock()
	for _, q := range Library {
		if q.ID == id {
			return q, true
		}
	}
	return KanhootQuiz{}, false
}

// En yeni önce (yönetim paneli listesi)
func GetLibrary() []KanhootQuiz {
	libMu.RLock()
	defer libMu.RUnlock()
	liste := append([]KanhootQuiz(nil), Library...)
	sort.SliceStable(liste, func(i, j int) bool { return liste[i].CreatedAt.After(liste[j].CreatedAt) })
	return liste
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
