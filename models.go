package main

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Todo struct {
	ID          primitive.ObjectID  `json:"_id" bson:"_id,omitempty"`
	Body        string              `json:"body" bson:"body"`
	Completed   bool                `json:"completed" bson:"completed"`
	Starred     bool                `json:"starred,omitempty" bson:"starred,omitempty"`
	StarredBy   []primitive.ObjectID `json:"starredBy,omitempty" bson:"starredBy,omitempty"`
	Priority    string              `json:"priority,omitempty" bson:"priority,omitempty"`
	DueDate     *time.Time          `json:"dueDate,omitempty" bson:"dueDate,omitempty"`
	CreatedAt   time.Time           `json:"createdAt" bson:"createdAt"`
	UpdatedAt   time.Time           `json:"updatedAt" bson:"updatedAt"`
	CompletedAt *time.Time          `json:"completedAt,omitempty" bson:"completedAt,omitempty"`
	OwnerID     *primitive.ObjectID `json:"ownerId,omitempty" bson:"ownerId,omitempty"`
}

type User struct {
	ID           primitive.ObjectID `json:"_id" bson:"_id,omitempty"`
	Name         string             `json:"name" bson:"name"`
	Username     string             `json:"username,omitempty" bson:"username,omitempty"`
	Avatar       string             `json:"avatar,omitempty" bson:"avatar,omitempty"`
	Email        string             `json:"email" bson:"email"`
	PasswordHash string             `json:"-" bson:"passwordHash"`
	CreatedAt    time.Time          `json:"createdAt" bson:"createdAt"`
	UpdatedAt    time.Time          `json:"updatedAt" bson:"updatedAt"`
}
