package main

import (
	"encoding/json"
	"testing"
	"time"
)

// Soru sonu istatistiği: herkes cevaplayınca oyun kurucuya şık başına sayı ve oyuncu sayısı gider; ikinci cevap sayılmaz.
func TestSoruSonuIstatistigi(t *testing.T) {
	host := &Client{ID: "host", send: make(chan []byte, 64)}
	g := NewGame("111111", host)
	g.Questions = []Question{{Question: "Kan grubu?", Options: []string{"A", "B", "C", "D"}, CorrectIndex: 1, TimeLimitSec: 20}}
	for _, id := range []string{"o1", "o2", "o3"} {
		g.Players[id] = &Client{ID: id, send: make(chan []byte, 64)}
	}
	g.NextQuestion()
	g.HandleAnswer("o1", "blue")
	g.HandleAnswer("o1", "red") // ikinci cevap: yok sayılmalı
	g.HandleAnswer("o2", "blue")
	g.HandleAnswer("o3", "red") // son oyuncu: soruyu bitirir

	zaman := time.After(2 * time.Second)
	for {
		select {
		case b := <-host.send:
			var m struct {
				Type string `json:"type"`
				Data struct {
					AnswerCounts []int `json:"answerCounts"`
					PlayerCount  int   `json:"playerCount"`
					CorrectIndex int   `json:"correctIndex"`
				} `json:"data"`
			}
			json.Unmarshal(b, &m)
			if m.Type != "question_ended" {
				continue
			}
			if got := m.Data.AnswerCounts; len(got) != 4 || got[0] != 1 || got[1] != 2 || got[2] != 0 || got[3] != 0 {
				t.Fatalf("şık sayıları [1 2 0 0] olmalı, gelen %v", got)
			}
			if m.Data.PlayerCount != 3 || m.Data.CorrectIndex != 1 {
				t.Fatalf("oyuncu 3 ve doğru şık 1 olmalı, gelen %d / %d", m.Data.PlayerCount, m.Data.CorrectIndex)
			}
			return
		case <-zaman:
			t.Fatal("question_ended gelmedi")
		}
	}
}
