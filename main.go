package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"slices"
	"strings"

	"github.com/joho/godotenv"
)

var (
	apiToken string
	apiURI             = "https://api.github.com"
	client             = http.DefaultClient
	out      io.Writer = os.Stdout
)

func request(method, url string) (*http.Response, error) {
	req, err := http.NewRequest(method, url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Accept", "application/vnd.github+json")
	req.Header.Set("Authorization", "Bearer "+apiToken)

	response, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	if response.StatusCode >= http.StatusBadRequest {
		defer response.Body.Close()
		var body struct {
			Message string `json:"message"`
		}
		json.NewDecoder(response.Body).Decode(&body)
		if body.Message != "" {
			return nil, fmt.Errorf("GitHub API: %s (%s)", body.Message, response.Status)
		}
		return nil, fmt.Errorf("GitHub API: %s", response.Status)
	}
	return response, nil
}

func getUsers(path string) ([]string, error) {
	logins := []string{}
	for page := 1; ; page++ {
		url := fmt.Sprintf("%s/%s?page=%d&per_page=100", apiURI, path, page)
		response, err := request(http.MethodGet, url)
		if err != nil {
			return nil, err
		}

		var users []struct {
			Login string `json:"login"`
		}
		err = json.NewDecoder(response.Body).Decode(&users)
		response.Body.Close()
		if err != nil {
			return nil, err
		}
		for _, user := range users {
			logins = append(logins, user.Login)
		}

		if !strings.Contains(response.Header.Get("Link"), `rel="next"`) {
			return logins, nil
		}
	}
}

func getFollowers() ([]string, error) {
	return getUsers("user/followers")
}

func getFollowees() ([]string, error) {
	return getUsers("user/following")
}

// difference returns the elements of a that are not present in b.
func difference(a, b []string) []string {
	result := []string{}
	for _, e := range a {
		if !slices.Contains(b, e) {
			result = append(result, e)
		}
	}
	return result
}

func followUser(user string) error {
	if _, err := request(http.MethodPut, fmt.Sprintf("%s/user/following/%s", apiURI, user)); err != nil {
		return err
	}
	fmt.Fprintf(out, "Followed: %s\n", user)
	return nil
}

func unfollowUser(user string) error {
	if _, err := request(http.MethodDelete, fmt.Sprintf("%s/user/following/%s", apiURI, user)); err != nil {
		return err
	}
	fmt.Fprintf(out, "Unfollowed: %s\n", user)
	return nil
}

func fatal(err error) {
	fmt.Fprintf(os.Stderr, "%s\n", err)
	os.Exit(1)
}

func main() {
	_ = godotenv.Load()
	apiToken = os.Getenv("GITHUB_API_TOKEN")
	if uri := os.Getenv("GITHUB_API_URI"); uri != "" {
		apiURI = uri
	}

	followees, err := getFollowees()
	if err != nil {
		fatal(err)
	}
	followers, err := getFollowers()
	if err != nil {
		fatal(err)
	}

	for _, user := range difference(followers, followees) {
		if err := followUser(user); err != nil {
			fatal(err)
		}
	}

	for _, user := range difference(followees, followers) {
		if err := unfollowUser(user); err != nil {
			fatal(err)
		}
	}
}
