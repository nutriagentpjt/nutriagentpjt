from enum import Enum


class Gender(str, Enum):
    MALE = "MALE"
    FEMALE = "FEMALE"


class HealthGoal(str, Enum):
    DIET = "DIET"
    LEAN_MASS_UP = "LEAN_MASS_UP"
    BULK_UP = "BULK_UP"
    MAINTAIN = "MAINTAIN"
    GENERAL_HEALTH = "GENERAL_HEALTH"


class ActivityLevel(str, Enum):
    SEDENTARY = "SEDENTARY"
    LIGHTLY_ACTIVE = "LIGHTLY_ACTIVE"
    MODERATELY_ACTIVE = "MODERATELY_ACTIVE"
    VERY_ACTIVE = "VERY_ACTIVE"


class MealPattern(str, Enum):
    THREE_MEALS = "THREE_MEALS"
    TWO_MEALS = "TWO_MEALS"
    INTERMITTENT_FASTING = "INTERMITTENT_FASTING"
    MULTIPLE_SMALL_MEALS = "MULTIPLE_SMALL_MEALS"


class MealType(str, Enum):
    BREAKFAST = "BREAKFAST"
    LUNCH = "LUNCH"
    DINNER = "DINNER"
    SNACK = "SNACK"


class Disease(str, Enum):
    NONE = "NONE"
    DIABETES = "DIABETES"
    HYPERTENSION = "HYPERTENSION"
    HYPERLIPIDEMIA = "HYPERLIPIDEMIA"
    KIDNEY_DISEASE = "KIDNEY_DISEASE"
    LIVER_DISEASE = "LIVER_DISEASE"
    THYROID_DISEASE = "THYROID_DISEASE"
    GOUT = "GOUT"
    ALLERGY = "ALLERGY"


class FeedbackType(str, Enum):
    LIKE = "like"
    DISLIKE = "dislike"
    SAVED = "saved"
    IGNORED = "ignored"


class DishRole(str, Enum):
    RICE = "RICE"
    SOUP = "SOUP"
    MAIN = "MAIN"
    SIDE = "SIDE"
    KIMCHI = "KIMCHI"
    ONE_DISH = "ONE_DISH"
    RAW = "RAW"
    SEASONING = "SEASONING"
    BEVERAGE = "BEVERAGE"
    SNACK = "SNACK"


class KoreanFoodGroup(str, Enum):
    GRAINS = "GRAINS"
    MEAT_FISH_EGG_BEAN = "MFEB"
    VEGETABLES = "VEGETABLES"
    FRUITS = "FRUITS"
    DAIRY = "DAIRY"
    FATS_SUGARS = "FATS_SUGARS"
