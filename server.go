package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var collection *mongo.Collection
var usersCollection *mongo.Collection

func run() {
	fmt.Println("Hello, World!")

	if os.Getenv("ENV") != "production" {
		if err := godotenv.Load(".env"); err != nil {
			log.Fatal("Error loading .env file", err)
		}
	}

	MONGO_URI := os.Getenv("MONGO_URI")
	clientOptions := options.Client().ApplyURI(MONGO_URI)
	client, err := mongo.Connect(context.Background(), clientOptions)
	if err != nil {
		log.Fatal(err)
	}
	defer client.Disconnect(context.Background())

	if err := client.Ping(context.Background(), nil); err != nil {
		log.Fatal(err)
	}
	fmt.Println("Connected to MongoDB ATLAS")

	db := client.Database("golang_db")
	collection = db.Collection("todos")
	usersCollection = db.Collection("users")

	// Ensure unique index on email
	_, _ = usersCollection.Indexes().CreateOne(context.Background(), mongo.IndexModel{
		Keys:    bson.D{{Key: "email", Value: 1}},
		Options: options.Index().SetUnique(true),
	})

	app := fiber.New()
	// Configure CORS: allow multiple origins from env or default to permissive for header-based auth
	origins := os.Getenv("ALLOW_ORIGINS")
	if origins == "" {
		// Using Authorization header (no cookies), so wildcard is acceptable
		origins = "*"
	}
	app.Use(cors.New(cors.Config{
		AllowOrigins: origins,
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET, POST, PATCH, DELETE, OPTIONS",
	}))

	app.Get("/api/health", func(c *fiber.Ctx) error { return c.SendString("ok") })

	// Auth routes
	app.Post("/api/auth/register", registerHandler)
	app.Post("/api/auth/login", loginHandler)
	app.Get("/api/auth/me", authMiddleware, meHandler)

	// Todo routes
	app.Get("/api/todos", getTodos)
	app.Post("/api/todos", authMiddleware, createTodo)
	app.Patch("/api/todos/:id", updateTodo)
	app.Delete("/api/todos/:id", deleteTodos)

	port := os.Getenv("PORT")
	if port == "" {
		port = "4000"
	}
	if os.Getenv("ENV") == "production" {
		app.Static("/", "./client/dist")
	}
	log.Fatal(app.Listen("0.0.0.0:" + port))
}
