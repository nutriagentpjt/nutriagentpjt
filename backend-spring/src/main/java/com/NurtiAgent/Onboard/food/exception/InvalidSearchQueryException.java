package com.NurtiAgent.Onboard.food.exception;

/**
 * Exception thrown when search query parameters are invalid.
 */
public class InvalidSearchQueryException extends RuntimeException {

    public InvalidSearchQueryException(String message) {
        super(message);
    }

    public InvalidSearchQueryException(String message, Throwable cause) {
        super(message, cause);
    }
}
