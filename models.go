package main

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Todo struct {
	ID          primitive.ObjectID  `json:"_id" bson:"_id,omitempty"`
	Body        string              `json:"body" bson:"body"`
	Completed   bool                `json:"completed" bson:"completed"`
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
	Email        string             `json:"email" bson:"email"`
	PasswordHash string             `json:"-" bson:"passwordHash"`
	CreatedAt    time.Time          `json:"createdAt" bson:"createdAt"`
	UpdatedAt    time.Time          `json:"updatedAt" bson:"updatedAt"`
}
