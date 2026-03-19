package com.NurtiAgent.Onboard.food.repository;

import com.NurtiAgent.Onboard.food.entity.Food;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FoodRepository extends JpaRepository<Food, Integer> {

    /**
     * 음식 검색 (그룹화 + 평균)
     * FastAPI /search 엔드포인트와 동일한 로직
     */
    @Query(value = """
        SELECT
            f.name AS name,
            AVG(f.calories) AS calories,
            AVG(f.protein) AS protein,
            AVG(f.carbs) AS carbs,
            AVG(f.fat) AS fat,
            AVG(f.sodium) AS sodium,
            AVG(f.sugar) AS sugars,
            AVG(f.dietary_fiber) AS fiber,
            AVG(f.cholesterol) AS cholesterol,
            AVG(f.saturated_fat) AS saturatedFat,
            AVG(f.trans_fat) AS transFat,
            COUNT(f.id) AS variants
        FROM foods f
        WHERE LOWER(f.name) LIKE LOWER(CONCAT('%', :query, '%'))
        GROUP BY f.name
        ORDER BY f.name ASC
        """, nativeQuery = true)
    List<FoodSearchProjection> searchFoods(@Param("query") String query, Pageable pageable);

    /**
     * 음식 상세 조회 (정확한 이름 매칭 + 평균)
     * FastAPI /detail 엔드포인트와 동일한 로직
     */
    @Query(value = """
        SELECT
            f.name AS name,
            AVG(f.calories) AS calories,
            AVG(f.protein) AS protein,
            AVG(f.carbs) AS carbs,
            AVG(f.fat) AS fat,
            AVG(f.sodium) AS sodium,
            AVG(f.sugar) AS sugars,
            AVG(f.dietary_fiber) AS fiber,
            AVG(f.cholesterol) AS cholesterol,
            AVG(f.saturated_fat) AS saturatedFat,
            AVG(f.trans_fat) AS transFat,
            COUNT(f.id) AS variants
        FROM foods f
        WHERE f.name = :name
        GROUP BY f.name
        """, nativeQuery = true)
    Optional<FoodSearchProjection> findByNameExact(@Param("name") String name);

    /**
     * 자동완성용 (중복 제거된 이름만)
     * Prefix search로 인덱스 활용 최적화
     */
    @Query(value = """
        SELECT DISTINCT f.name
        FROM foods f
        WHERE LOWER(f.name) LIKE LOWER(CONCAT(:query, '%'))
        ORDER BY f.name ASC
        LIMIT :limit
        """, nativeQuery = true)
    List<String> findNamesForAutocomplete(@Param("query") String query, @Param("limit") int limit);

    /**
     * Projection 인터페이스
     * 검색 결과를 담는 DTO 역할
     */
    interface FoodSearchProjection {
        String getName();
        Double getCalories();
        Double getProtein();
        Double getCarbs();
        Double getFat();
        Double getSodium();
        Double getSugars();
        Double getFiber();
        Double getCholesterol();
        Double getSaturatedFat();
        Double getTransFat();
        Integer getVariants();
    }
}
