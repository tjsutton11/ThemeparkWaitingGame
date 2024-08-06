package main

import (
	"encoding/json"
	"fmt"
	"net/http"
)

type Park struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type Destination struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Slug  string `json:"slug"`
	Parks []Park `json:"parks"`
}

type DestinationsResponse struct {
	Destinations []Destination
}

func main() {
	data, err := getDestinations()

	if err != nil {
		fmt.Println("An error has occurred when fetching destinations.")
	}

	fmt.Println(`Welcome to the Wait Time Guessing Game. Please choose which park you'd like to guess wait times for:`)

	for name := range data {
		fmt.Println(name)
	}

}

func getDestinations() (map[string]Destination, error) {
	resp, err := http.Get("https://api.themeparks.wiki/v1/destinations")

	if err != nil {
		panic(err)
	}

	defer resp.Body.Close()

	fmt.Println("Response status: ", resp.Status)

	var response DestinationsResponse
	var parks = make(map[string]Destination)

	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		for _, park := range response.Destinations {
			parks[park.Name] = park
		}

		return parks, nil
	}

	return parks, err
}
