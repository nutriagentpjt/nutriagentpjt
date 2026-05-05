package com.NurtiAgent.Onboard.food.exception;

/**
 * Exception thrown when a requested food item is not found in the database.
 */
public class FoodNotFoundException extends RuntimeException {

    public FoodNotFoundException(String message) {
        super(message);
    }

    public FoodNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}
