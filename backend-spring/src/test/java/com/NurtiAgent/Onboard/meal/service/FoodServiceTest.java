package com.NurtiAgent.Onboard.meal.service;

import com.NurtiAgent.Onboard.food.exception.FoodNotFoundException;
import com.NurtiAgent.Onboard.food.exception.InvalidSearchQueryException;
import com.NurtiAgent.Onboard.food.repository.FoodRepository;
import com.NurtiAgent.Onboard.food.repository.FoodRepository.FoodSearchProjection;
import com.NurtiAgent.Onboard.meal.dto.FoodResponse;
import com.NurtiAgent.Onboard.meal.dto.FoodSearchResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * FoodService 단위 테스트
 *
 * 테스트 대상:
 *   - searchFoods(String)
 *   - searchFoods(String, int, int)
 *   - getFoodByName(String)
 *   - autocomplete(String, int)
 *
 * 의존성: FoodRepository (mock)
 */
@ExtendWith(MockitoExtension.class)
class FoodServiceTest {

    @Mock
    private FoodRepository foodRepository;

    @InjectMocks
    private FoodService foodService;

    // -------------------- 테스트 헬퍼 --------------------

    private FoodSearchProjection mockProjection(String name, double calories, double protein,
                                                double carbs, double fat) {
        FoodSearchProjection proj = mock(FoodSearchProjection.class);
        when(proj.getName()).thenReturn(name);
        when(proj.getCalories()).thenReturn(calories);
        when(proj.getProtein()).thenReturn(protein);
        when(proj.getCarbs()).thenReturn(carbs);
        when(proj.getFat()).thenReturn(fat);
        when(proj.getSodium()).thenReturn(100.0);
        when(proj.getSugars()).thenReturn(5.0);
        when(proj.getFiber()).thenReturn(2.0);
        when(proj.getSaturatedFat()).thenReturn(1.5);
        when(proj.getVariants()).thenReturn(2);
        return proj;
    }

    // ==================== searchFoods ====================

    @Nested
    @DisplayName("searchFoods")
    class SearchFoods {

        @Test
        @DisplayName("정상 검색: 결과 리스트 반환")
        void normalSearch_returnsResults() {
            FoodSearchProjection proj = mockProjection("닭가슴살", 165.0, 31.0, 0.0, 3.6);
            when(foodRepository.searchFoods(eq("닭"), any())).thenReturn(List.of(proj));

            FoodSearchResponse response = foodService.searchFoods("닭");

            assertThat(response.getFoods()).hasSize(1);
            assertThat(response.getFoods().get(0).getName()).isEqualTo("닭가슴살");
            assertThat(response.getTotal()).isEqualTo(1);
        }

        @Test
        @DisplayName("키워드 공백: InvalidSearchQueryException 발생")
        void blankKeyword_throwsInvalidSearchQuery() {
            assertThatThrownBy(() -> foodService.searchFoods("   "))
                    .isInstanceOf(InvalidSearchQueryException.class);
            assertThatThrownBy(() -> foodService.searchFoods(""))
                    .isInstanceOf(InvalidSearchQueryException.class);
        }

        @Test
        @DisplayName("null 키워드: InvalidSearchQueryException 발생")
        void nullKeyword_throwsInvalidSearchQuery() {
            assertThatThrownBy(() -> foodService.searchFoods(null))
                    .isInstanceOf(InvalidSearchQueryException.class);
        }

        @Test
        @DisplayName("검색 결과 없음: 빈 리스트 반환")
        void emptyResult_returnsEmptyList() {
            when(foodRepository.searchFoods(any(), any())).thenReturn(List.of());

            FoodSearchResponse response = foodService.searchFoods("xyz존재하지않음");

            assertThat(response.getFoods()).isEmpty();
            assertThat(response.getTotal()).isEqualTo(0);
        }

        @Test
        @DisplayName("pagination: limit/offset 기반 PageRequest 생성")
        void withPagination_createsCorrectPageRequest() {
            when(foodRepository.searchFoods(any(), any())).thenReturn(List.of());

            foodService.searchFoods("닭", 10, 20);

            // offset=20, limit=10 → page=2
            verify(foodRepository).searchFoods(eq("닭"), eq(PageRequest.of(2, 10)));
        }

        @Test
        @DisplayName("키워드 앞뒤 공백은 trim되어 검색됨")
        void keywordIsTrimmed() {
            when(foodRepository.searchFoods(eq("닭"), any())).thenReturn(List.of());

            foodService.searchFoods("  닭  ");

            verify(foodRepository).searchFoods(eq("닭"), any());
        }

        @Test
        @DisplayName("영양소 값이 소수점 2자리로 반올림됨")
        void nutritionValuesAreRounded() {
            FoodSearchProjection proj = mock(FoodSearchProjection.class);
            when(proj.getName()).thenReturn("테스트 음식");
            when(proj.getCalories()).thenReturn(165.567);
            when(proj.getProtein()).thenReturn(31.123);
            when(proj.getCarbs()).thenReturn(null);
            when(proj.getFat()).thenReturn(3.645);
            when(proj.getSodium()).thenReturn(null);
            when(proj.getSugars()).thenReturn(null);
            when(proj.getFiber()).thenReturn(null);
            when(proj.getSaturatedFat()).thenReturn(null);
            when(proj.getVariants()).thenReturn(1);
            when(foodRepository.searchFoods(any(), any())).thenReturn(List.of(proj));

            FoodSearchResponse response = foodService.searchFoods("테스트");
            FoodResponse food = response.getFoods().get(0);

            assertThat(food.getCalories()).isEqualTo(165.57);
            assertThat(food.getProtein()).isEqualTo(31.12);
            assertThat(food.getFat()).isEqualTo(3.65);
            assertThat(food.getCarbs()).isNull(); // null-safe
        }
    }

    // ==================== getFoodByName ====================

    @Nested
    @DisplayName("getFoodByName")
    class GetFoodByName {

        @Test
        @DisplayName("정확한 이름으로 음식 조회 성공")
        void existingFood_returnsFoodResponse() {
            FoodSearchProjection proj = mockProjection("닭가슴살", 165.0, 31.0, 0.0, 3.6);
            when(foodRepository.findByNameExact("닭가슴살")).thenReturn(Optional.of(proj));

            FoodResponse response = foodService.getFoodByName("닭가슴살");

            assertThat(response.getName()).isEqualTo("닭가슴살");
            assertThat(response.getCalories()).isEqualTo(165.0);
            assertThat(response.getProtein()).isEqualTo(31.0);
        }

        @Test
        @DisplayName("존재하지 않는 음식: FoodNotFoundException 발생")
        void nonExistentFood_throwsFoodNotFoundException() {
            when(foodRepository.findByNameExact(any())).thenReturn(Optional.empty());

            assertThatThrownBy(() -> foodService.getFoodByName("존재하지않는음식"))
                    .isInstanceOf(FoodNotFoundException.class);
        }

        @Test
        @DisplayName("null 이름: InvalidSearchQueryException 발생")
        void nullName_throwsInvalidSearchQuery() {
            assertThatThrownBy(() -> foodService.getFoodByName(null))
                    .isInstanceOf(InvalidSearchQueryException.class);
        }

        @Test
        @DisplayName("공백 이름: InvalidSearchQueryException 발생")
        void blankName_throwsInvalidSearchQuery() {
            assertThatThrownBy(() -> foodService.getFoodByName("  "))
                    .isInstanceOf(InvalidSearchQueryException.class);
        }

        @Test
        @DisplayName("이름 앞뒤 공백 trim 후 조회")
        void nameIsTrimmedBeforeSearch() {
            FoodSearchProjection proj = mockProjection("닭가슴살", 165.0, 31.0, 0.0, 3.6);
            when(foodRepository.findByNameExact("닭가슴살")).thenReturn(Optional.of(proj));

            foodService.getFoodByName("  닭가슴살  ");

            verify(foodRepository).findByNameExact("닭가슴살");
        }
    }

    // ==================== autocomplete ====================

    @Nested
    @DisplayName("autocomplete")
    class Autocomplete {

        @Test
        @DisplayName("정상 자동완성 결과 반환")
        void normalQuery_returnsList() {
            when(foodRepository.findNamesForAutocomplete("닭", 5))
                    .thenReturn(List.of("닭가슴살", "닭갈비", "닭볶음탕"));

            List<String> result = foodService.autocomplete("닭", 5);

            assertThat(result).containsExactly("닭가슴살", "닭갈비", "닭볶음탕");
        }

        @Test
        @DisplayName("null 쿼리: InvalidSearchQueryException 발생")
        void nullQuery_throws() {
            assertThatThrownBy(() -> foodService.autocomplete(null, 10))
                    .isInstanceOf(InvalidSearchQueryException.class);
        }

        @Test
        @DisplayName("빈 쿼리: InvalidSearchQueryException 발생")
        void emptyQuery_throws() {
            assertThatThrownBy(() -> foodService.autocomplete("", 10))
                    .isInstanceOf(InvalidSearchQueryException.class);
        }

        @Test
        @DisplayName("limit=0: IllegalArgumentException 발생")
        void limitZero_throws() {
            assertThatThrownBy(() -> foodService.autocomplete("닭", 0))
                    .isInstanceOf(IllegalArgumentException.class);
        }

        @Test
        @DisplayName("limit=51: IllegalArgumentException 발생")
        void limitOver50_throws() {
            assertThatThrownBy(() -> foodService.autocomplete("닭", 51))
                    .isInstanceOf(IllegalArgumentException.class);
        }

        @Test
        @DisplayName("limit=1: 경계값 정상 처리")
        void limitOne_isValid() {
            when(foodRepository.findNamesForAutocomplete(any(), eq(1))).thenReturn(List.of("닭가슴살"));

            List<String> result = foodService.autocomplete("닭", 1);
            assertThat(result).hasSize(1);
        }

        @Test
        @DisplayName("limit=50: 경계값 정상 처리")
        void limitFifty_isValid() {
            when(foodRepository.findNamesForAutocomplete(any(), eq(50))).thenReturn(List.of());

            assertThat(foodService.autocomplete("닭", 50)).isEmpty();
        }
    }
}
