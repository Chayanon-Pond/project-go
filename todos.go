package main

import (
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func getTodos(c *fiber.Ctx) error {
	var todos []Todo
	filter := bson.M{}
	search := c.Query("search")
	status := c.Query("status")
	priority := c.Query("priority")
	// If a valid token is provided, show user's todos plus ownerless ones (created before auth)
	if auth := c.Get("Authorization"); auth != "" {
		parts := strings.SplitN(auth, " ", 2)
		if len(parts) == 2 && strings.EqualFold(parts[0], "Bearer") {
			if claims, err := parseToken(parts[1]); err == nil {
				if oid, err := primitive.ObjectIDFromHex(claims.UserID); err == nil {
					filter["$or"] = bson.A{
						bson.M{"ownerId": oid},
						bson.M{"ownerId": bson.M{"$exists": false}},
						bson.M{"ownerId": nil},
					}
				}
			}
		}
	}
	if search != "" {
		filter["body"] = bson.M{"$regex": search, "$options": "i"}
	}
	if status == "active" {
		filter["completed"] = false
	} else if status == "completed" {
		filter["completed"] = true
	}
	if priority != "" {
		filter["priority"] = priority
	}
	findOpts := options.Find().SetSort(bson.D{{Key: "createdAt", Value: -1}})
	cursor, err := collection.Find(c.Context(), filter, findOpts)
	if err != nil {
		return err
	}
	defer cursor.Close(c.Context())
	for cursor.Next(c.Context()) {
		var todo Todo
		if err := cursor.Decode(&todo); err != nil {
			return err
		}
		todos = append(todos, todo)
	}
	return c.JSON(todos)
}

func createTodo(c *fiber.Ctx) error {
	var payload struct {
		Body     string     `json:"body"`
	Starred  bool       `json:"starred"`
		Priority string     `json:"priority"`
		DueDate  *time.Time `json:"dueDate"`
	}
	if err := c.BodyParser(&payload); err != nil {
		return err
	}
	if payload.Body == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Todo Body cannot be empty"})
	}
	now := time.Now().UTC()
	var ownerID *primitive.ObjectID
	if userID, ok := c.Locals("userId").(string); ok && userID != "" {
		if oid, err := primitive.ObjectIDFromHex(userID); err == nil {
			ownerID = &oid
		}
	}
	todo := &Todo{
		Body:      payload.Body,
		Completed: false,
	Starred:   payload.Starred,
		Priority:  payload.Priority,
		DueDate:   payload.DueDate,
		CreatedAt: now,
		UpdatedAt: now,
		OwnerID:   ownerID,
	}
	res, err := collection.InsertOne(c.Context(), todo)
	if err != nil {
		return err
	}
	todo.ID = res.InsertedID.(primitive.ObjectID)
	return c.Status(201).JSON(todo)
}

func updateTodo(c *fiber.Ctx) error {
	id := c.Params("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid todo ID"})
	}
	var payload struct {
		Body      *string     `json:"body"`
		Completed *bool       `json:"completed"`
	Starred   *bool       `json:"starred"`
		Priority  *string     `json:"priority"`
		DueDate   **time.Time `json:"dueDate"`
	}
	_ = c.BodyParser(&payload)
	toSet := bson.M{"updatedAt": time.Now().UTC()}
	if payload.Body != nil {
		toSet["body"] = *payload.Body
	}
	if payload.Starred != nil {
		// Require auth and ownership to star/unstar
		uid, _ := c.Locals("userId").(string)
		if uid == "" {
			return c.Status(401).JSON(fiber.Map{"error": "Authentication required"})
		}
		// verify ownership
		var existing Todo
		if err := collection.FindOne(c.Context(), bson.M{"_id": objectID}).Decode(&existing); err != nil {
			if err == mongo.ErrNoDocuments {
				return c.Status(404).JSON(fiber.Map{"error": "Todo not found"})
			}
			return err
		}
		// If the todo has no owner yet, claim ownership for the current user when starring
		if existing.OwnerID == nil {
			if oid, err := primitive.ObjectIDFromHex(uid); err == nil {
				toSet["ownerId"] = oid
			}
		} else if existing.OwnerID.Hex() != uid {
			return c.Status(403).JSON(fiber.Map{"error": "Forbidden"})
		}
		toSet["starred"] = *payload.Starred
	}
	if payload.Priority != nil {
		toSet["priority"] = *payload.Priority
	}
	if payload.DueDate != nil {
		if *payload.DueDate == nil {
			toSet["dueDate"] = nil
		} else {
			// validate not in the past
			candidate := (**payload.DueDate).Truncate(24 * time.Hour)
			today := time.Now().UTC().Truncate(24 * time.Hour)
			if candidate.Before(today) {
				return c.Status(400).JSON(fiber.Map{"error": "Due date cannot be in the past"})
			}
			toSet["dueDate"] = **payload.DueDate
		}
	}
	if payload.Completed != nil {
		toSet["completed"] = *payload.Completed
		if *payload.Completed {
			t := time.Now().UTC()
			toSet["completedAt"] = t
		} else {
			toSet["completedAt"] = nil
		}
	} else if payload.Body == nil && payload.Priority == nil && payload.DueDate == nil {
		var existing Todo
		if err := collection.FindOne(c.Context(), bson.M{"_id": objectID}).Decode(&existing); err != nil {
			if err == mongo.ErrNoDocuments {
				return c.Status(404).JSON(fiber.Map{"error": "Todo not found"})
			}
			return err
		}
		newCompleted := !existing.Completed
		toSet["completed"] = newCompleted
		if newCompleted {
			t := time.Now().UTC()
			toSet["completedAt"] = t
		} else {
			toSet["completedAt"] = nil
		}
	}
	update := bson.M{"$set": toSet}
	if _, err := collection.UpdateOne(c.Context(), bson.M{"_id": objectID}, update); err != nil {
		return err
	}
	return c.Status(200).JSON(fiber.Map{"success": true})
}

func deleteTodos(c *fiber.Ctx) error {
	id := c.Params("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid todo ID"})
	}
	// Require auth (enforced by route middleware) and verify ownership if present
	uid, _ := c.Locals("userId").(string)
	var existing Todo
	if err := collection.FindOne(c.Context(), bson.M{"_id": objectID}).Decode(&existing); err != nil {
		if err == mongo.ErrNoDocuments {
			return c.Status(404).JSON(fiber.Map{"error": "Todo not found"})
		}
		return err
	}
	if existing.OwnerID != nil {
		if uid == "" || existing.OwnerID.Hex() != uid {
			return c.Status(403).JSON(fiber.Map{"error": "Forbidden"})
		}
	}
	if _, err := collection.DeleteOne(c.Context(), bson.M{"_id": objectID}); err != nil {
		return err
	}
	return c.Status(200).JSON(fiber.Map{"success": true})
}

// toggleStarred sets starred state; requires auth and ownership
func toggleStarred(c *fiber.Ctx) error {
	id := c.Params("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid todo ID"})
	}
	uid, _ := c.Locals("userId").(string)
	if uid == "" {
		return c.Status(401).JSON(fiber.Map{"error": "Authentication required"})
	}
	var payload struct{ Starred bool `json:"starred"` }
	_ = c.BodyParser(&payload)
	var existing Todo
	if err := collection.FindOne(c.Context(), bson.M{"_id": objectID}).Decode(&existing); err != nil {
		if err == mongo.ErrNoDocuments {
			return c.Status(404).JSON(fiber.Map{"error": "Todo not found"})
		}
		return err
	}
	// If no owner, claim it for current user when starring via this endpoint; otherwise require ownership
	set := bson.M{"starred": payload.Starred, "updatedAt": time.Now().UTC()}
	if existing.OwnerID == nil {
		if oid, err := primitive.ObjectIDFromHex(uid); err == nil {
			set["ownerId"] = oid
		}
	} else if existing.OwnerID.Hex() != uid {
		return c.Status(403).JSON(fiber.Map{"error": "Forbidden"})
	}
	update := bson.M{"$set": set}
	if _, err := collection.UpdateOne(c.Context(), bson.M{"_id": objectID}, update); err != nil {
		return err
	}
	return c.Status(200).JSON(fiber.Map{"success": true})
}
