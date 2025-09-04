package main

import (
	"fmt"
	"os"
	"regexp"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type AuthClaims struct {
	UserID string `json:"userId"`
	jwt.RegisteredClaims
}

func getJWTSecret() []byte {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "dev-secret-change-me"
	}
	return []byte(secret)
}

func generateToken(userID string) (string, error) {
	ttlStr := os.Getenv("JWT_EXPIRES_IN") // e.g., 24h
	var ttl time.Duration
	if ttlStr == "" {
		ttl = 24 * time.Hour
	} else {
		if d, err := time.ParseDuration(ttlStr); err == nil {
			ttl = d
		} else {
			ttl = 24 * time.Hour
		}
	}
	now := time.Now()
	claims := &AuthClaims{
		UserID: userID,
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    "project-go",
			Subject:   userID,
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(ttl)),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(getJWTSecret())
}

func parseToken(tokenStr string) (*AuthClaims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &AuthClaims{}, func(token *jwt.Token) (interface{}, error) {
		return getJWTSecret(), nil
	})
	if err != nil {
		return nil, err
	}
	if claims, ok := token.Claims.(*AuthClaims); ok && token.Valid {
		return claims, nil
	}
	return nil, fmt.Errorf("invalid token")
}

func authMiddleware(c *fiber.Ctx) error {
	auth := c.Get("Authorization")
	if auth == "" {
		return c.Status(401).JSON(fiber.Map{"error": "Missing Authorization header"})
	}
	parts := strings.SplitN(auth, " ", 2)
	if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
		return c.Status(401).JSON(fiber.Map{"error": "Invalid Authorization header"})
	}
	claims, err := parseToken(parts[1])
	if err != nil {
		return c.Status(401).JSON(fiber.Map{"error": "Invalid token"})
	}
	c.Locals("userId", claims.UserID)
	return c.Next()
}

var emailRegex = regexp.MustCompile(`^[\w\.-]+@[\w\.-]+\.[a-zA-Z]{2,}$`)

func validateRegister(name, email, password string) string {
	if strings.TrimSpace(name) == "" || len(name) < 2 {
		return "Name must be at least 2 characters"
	}
	if !emailRegex.MatchString(email) {
		return "Invalid email"
	}
	if len(password) < 6 {
		return "Password must be at least 6 characters"
	}
	return ""
}

func registerHandler(c *fiber.Ctx) error {
	var payload struct {
		Name     string `json:"name"`
		Username string `json:"username"`
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := c.BodyParser(&payload); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid body"})
	}
	if msg := validateRegister(payload.Name, payload.Email, payload.Password); msg != "" {
		return c.Status(400).JSON(fiber.Map{"error": msg})
	}
	// Check exists
	count, err := usersCollection.CountDocuments(c.Context(), bson.M{"email": strings.ToLower(payload.Email)})
	if err != nil {
		return err
	}
	if count > 0 {
		return c.Status(409).JSON(fiber.Map{"error": "Email already registered"})
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(payload.Password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	now := time.Now().UTC()
	user := &User{
		Name:         payload.Name,
		Username:     strings.TrimSpace(payload.Username),
		Email:        strings.ToLower(payload.Email),
		PasswordHash: string(hash),
		CreatedAt:    now,
		UpdatedAt:    now,
	}
	if user.Username == "" { user.Username = strings.TrimSpace(payload.Name) }
	res, err := usersCollection.InsertOne(c.Context(), user)
	if err != nil {
		if writeErr, ok := err.(mongo.WriteException); ok {
			for _, we := range writeErr.WriteErrors {
				if we.Code == 11000 {
					return c.Status(409).JSON(fiber.Map{"error": "Email already registered"})
				}
			}
		}
		return err
	}
	user.ID = res.InsertedID.(primitive.ObjectID)
	token, err := generateToken(user.ID.Hex())
	if err != nil {
		return err
	}
	return c.Status(201).JSON(fiber.Map{
		"token": token,
		"user": fiber.Map{
			"_id":       user.ID.Hex(),
			"name":      user.Name,
			"username":  user.Username,
			"email":     user.Email,
			"createdAt": user.CreatedAt,
			"updatedAt": user.UpdatedAt,
		},
	})
}

func loginHandler(c *fiber.Ctx) error {
	var payload struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := c.BodyParser(&payload); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid body"})
	}
	var user User
	if err := usersCollection.FindOne(c.Context(), bson.M{"email": strings.ToLower(payload.Email)}).Decode(&user); err != nil {
		if err == mongo.ErrNoDocuments {
			return c.Status(401).JSON(fiber.Map{"error": "Invalid credentials"})
		}
		return err
	}
	if bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(payload.Password)) != nil {
		return c.Status(401).JSON(fiber.Map{"error": "Invalid credentials"})
	}
	token, err := generateToken(user.ID.Hex())
	if err != nil {
		return err
	}
	return c.JSON(fiber.Map{
		"token": token,
		"user": fiber.Map{
			"_id":       user.ID.Hex(),
			"name":      user.Name,
			"username":  user.Username,
			"email":     user.Email,
			"createdAt": user.CreatedAt,
			"updatedAt": user.UpdatedAt,
		},
	})
}

func meHandler(c *fiber.Ctx) error {
	userID := c.Locals("userId").(string)
	oid, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid user id"})
	}
	var user User
	if err := usersCollection.FindOne(c.Context(), bson.M{"_id": oid}).Decode(&user); err != nil {
		if err == mongo.ErrNoDocuments {
			return c.Status(404).JSON(fiber.Map{"error": "User not found"})
		}
		return err
	}
	return c.JSON(fiber.Map{
		"_id":       user.ID.Hex(),
		"name":      user.Name,
		"username":  user.Username,
		"email":     user.Email,
		"createdAt": user.CreatedAt,
		"updatedAt": user.UpdatedAt,
	})
}

// update current user profile
func updateMeHandler(c *fiber.Ctx) error {
	userID := c.Locals("userId").(string)
	oid, err := primitive.ObjectIDFromHex(userID)
	if err != nil { return c.Status(400).JSON(fiber.Map{"error": "Invalid user id"}) }
	var payload struct{
		Name string `json:"name"`
		Username string `json:"username"`
	}
	if err := c.BodyParser(&payload); err != nil { return c.Status(400).JSON(fiber.Map{"error":"Invalid body"}) }
	toSet := bson.M{"updatedAt": time.Now().UTC()}
	if strings.TrimSpace(payload.Name) != "" { toSet["name"] = strings.TrimSpace(payload.Name) }
	if strings.TrimSpace(payload.Username) != "" { toSet["username"] = strings.TrimSpace(payload.Username) }
	if len(toSet) == 1 { // only updatedAt
		return c.Status(400).JSON(fiber.Map{"error":"No changes"})
	}
	res := usersCollection.FindOneAndUpdate(c.Context(), bson.M{"_id": oid}, bson.M{"$set": toSet},)
	if res.Err() != nil { if res.Err() == mongo.ErrNoDocuments { return c.Status(404).JSON(fiber.Map{"error":"User not found"}) } ; return res.Err() }
	var user User
	if err := usersCollection.FindOne(c.Context(), bson.M{"_id": oid}).Decode(&user); err != nil { return err }
	return c.JSON(fiber.Map{
		"_id": user.ID.Hex(),
		"name": user.Name,
		"username": user.Username,
		"email": user.Email,
		"createdAt": user.CreatedAt,
		"updatedAt": user.UpdatedAt,
	})
}
