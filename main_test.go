package main

import (
	"bytes"
	"fmt"
	"net/http"
	"net/http/httptest"
	"reflect"
	"strings"
	"testing"
)

func withAPI(t *testing.T, handler http.HandlerFunc) {
	t.Helper()
	server := httptest.NewServer(handler)
	t.Cleanup(server.Close)

	prevURI, prevClient := apiURI, client
	apiURI, client = server.URL, server.Client()
	t.Cleanup(func() { apiURI, client = prevURI, prevClient })
}

func captureOut(t *testing.T) *bytes.Buffer {
	t.Helper()
	buf := &bytes.Buffer{}
	prev := out
	out = buf
	t.Cleanup(func() { out = prev })
	return buf
}

func TestDifference(t *testing.T) {
	cases := []struct {
		name string
		a, b []string
		want []string
	}{
		{"returns elements in a not in b", []string{"a", "b", "c"}, []string{"b"}, []string{"a", "c"}},
		{"returns all of a when b is empty", []string{"a", "b"}, []string{}, []string{"a", "b"}},
		{"returns empty when a is empty", []string{}, []string{"a", "b"}, []string{}},
		{"returns empty when a is a subset of b", []string{"a", "b"}, []string{"a", "b", "c"}, []string{}},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			if got := difference(c.a, c.b); !reflect.DeepEqual(got, c.want) {
				t.Errorf("difference(%v, %v) = %v, want %v", c.a, c.b, got, c.want)
			}
		})
	}
}

func TestGetUsersSinglePage(t *testing.T) {
	withAPI(t, func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprint(w, `[{"login":"alice"},{"login":"bob"}]`)
	})

	got, err := getFollowers()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if want := []string{"alice", "bob"}; !reflect.DeepEqual(got, want) {
		t.Errorf("got %v, want %v", got, want)
	}
}

func TestGetUsersRequestsCorrectEndpoint(t *testing.T) {
	var path, query string
	withAPI(t, func(w http.ResponseWriter, r *http.Request) {
		path, query = r.URL.Path, r.URL.RawQuery
		fmt.Fprint(w, `[]`)
	})

	if _, err := getFollowees(); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if path != "/user/following" || query != "page=1&per_page=100" {
		t.Errorf("requested %s?%s, want /user/following?page=1&per_page=100", path, query)
	}
}

func TestGetUsersPaginates(t *testing.T) {
	var calls int
	withAPI(t, func(w http.ResponseWriter, r *http.Request) {
		calls++
		if r.URL.Query().Get("page") == "1" {
			w.Header().Set("Link", `<`+apiURI+`/user/followers?page=2>; rel="next"`)
			fmt.Fprint(w, `[{"login":"alice"}]`)
			return
		}
		fmt.Fprint(w, `[{"login":"bob"}]`)
	})

	got, err := getFollowers()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if want := []string{"alice", "bob"}; !reflect.DeepEqual(got, want) {
		t.Errorf("got %v, want %v", got, want)
	}
	if calls != 2 {
		t.Errorf("made %d requests, want 2", calls)
	}
}

func TestGetUsersReturnsErrorOnFailure(t *testing.T) {
	server := httptest.NewServer(http.NotFoundHandler())
	server.Close() // closed server -> request fails

	prevURI, prevClient := apiURI, client
	apiURI, client = server.URL, server.Client()
	defer func() { apiURI, client = prevURI, prevClient }()

	if _, err := getFollowers(); err == nil {
		t.Error("expected an error, got nil")
	}
}

func TestGetUsersReturnsFriendlyAPIError(t *testing.T) {
	withAPI(t, func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusUnauthorized)
		fmt.Fprint(w, `{"message":"Bad credentials"}`)
	})

	_, err := getFollowers()
	if err == nil {
		t.Fatal("expected an error, got nil")
	}
	if got := err.Error(); !strings.Contains(got, "Bad credentials") || !strings.Contains(got, "401") {
		t.Errorf("error = %q, want it to mention %q and %q", got, "Bad credentials", "401")
	}
}

func TestFollowUser(t *testing.T) {
	var method, path string
	withAPI(t, func(w http.ResponseWriter, r *http.Request) {
		method, path = r.Method, r.URL.Path
	})
	buf := captureOut(t)

	if err := followUser("alice"); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if method != http.MethodPut || path != "/user/following/alice" {
		t.Errorf("made %s %s, want PUT /user/following/alice", method, path)
	}
	if got := buf.String(); got != "Followed: alice\n" {
		t.Errorf("wrote %q, want %q", got, "Followed: alice\n")
	}
}

func TestUnfollowUser(t *testing.T) {
	var method, path string
	withAPI(t, func(w http.ResponseWriter, r *http.Request) {
		method, path = r.Method, r.URL.Path
	})
	buf := captureOut(t)

	if err := unfollowUser("alice"); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if method != http.MethodDelete || path != "/user/following/alice" {
		t.Errorf("made %s %s, want DELETE /user/following/alice", method, path)
	}
	if got := buf.String(); got != "Unfollowed: alice\n" {
		t.Errorf("wrote %q, want %q", got, "Unfollowed: alice\n")
	}
}
