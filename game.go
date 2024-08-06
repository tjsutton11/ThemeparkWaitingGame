package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
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
	// Fetch theme parks
	data, err := getDestinations()

	if err != nil {
		fmt.Println("An error has occurred when fetching destinations.")
	}

	fmt.Println(`Welcome to the Wait Time Guessing Game. Please choose which park you'd like to guess wait times for:`)
	fmt.Println("----------------------------------------------------------------------------------------------------")
	// Print the theme park choices
	println(len(data))
	for _, park := range data {
		println(park.Name)
	}
	fmt.Println("----------------------------------------------------------------------------------------------------")

	// Take in user choice of theme park
	var playerParkChoice string
	scanner := bufio.NewScanner(os.Stdin)

	for playerParkChoice == "" {
		scanner.Scan()
		playerParkChoice = scanner.Text()
		if playerParkChoice == "" {
			println("Park choice cannot be blank. Please select a park.")
		}
	}

	selectedPark := data[playerParkChoice]
	println(selectedPark.ID)

	// Fetch live data for park
	// parkData, err := getLiveParkData(selectedPark.ID)

}

func getDestinations() (map[string]Destination, error) {
	resp, err := http.Get("https://api.themeparks.wiki/v1/destinations")

	if err != nil {
		panic(err)
	}

	defer resp.Body.Close()
	fmt.Println("Response status: ", resp.Status)
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		fmt.Println("Error reading response body: ", err)
	}

	var response DestinationsResponse
	err = json.Unmarshal(body, &response)
	if err != nil {
		fmt.Println("Error parsing JSON:", err)
	}

	// Print the result
	//fmt.Println("API Response as map:", response)

	var parks = make(map[string]Destination)

	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		for _, park := range response.Destinations {
			parks[park.Name] = park
		}

		return parks, nil
	}

	return parks, err
}

func getLiveParkData(parkId string) {

}
