package com.NurtiAgent.Onboard.vision.controller;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * MealImageUploadController 슬라이스 테스트 (@WebMvcTest)
 *
 * 테스트 대상:
 *   - POST /meals/upload/image  (multipart/form-data, field name "image")
 *
 * 검증 항목:
 *   - 세션 없으면 401
 *   - X-Guest-Id, X-Internal-Key 가 FastAPI로 전달
 *   - X-Request-ID 헤더가 있으면 forward
 *   - top_k, min_similarity 쿼리파라미터가 업스트림 URL에 반영
 *   - 업스트림 4xx/5xx 응답 시 status/body 그대로 반환
 *   - 업스트림 경로가 /v1/meals/upload/image 인지
 *   - 업스트림 multipart 필드명은 "file"
 *   - vision raw 응답을 FE 계약 MealImageUploadResponse 로 매핑
 */
@WebMvcTest(MealImageUploadController.class)
@Import(MealImageUploadControllerTest.MockConfig.class)
@TestPropertySource(properties = {
        "fastapi.vision.url=http://mock-vision:8001",
        "fastapi.internal-key=test-internal-key"
})
class MealImageUploadControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired RestTemplate restTemplate;

    private static final String GUEST_ID = "guest_test-001";
    private static final String INTERNAL_KEY = "test-internal-key";
    private static final String VISION_BASE = "http://mock-vision:8001";
    private static final String ENDPOINT = "/meals/upload/image";

    private MockHttpSession authSession;

    @TestConfiguration
    static class MockConfig {
        @Bean
        @Primary
        public RestTemplate restTemplate() {
            return mock(RestTemplate.class);
        }
    }

    @BeforeEach
    void setUp() {
        authSession = new MockHttpSession();
        authSession.setAttribute("GUEST_ID", GUEST_ID);
        reset(restTemplate);
    }

    private MockMultipartFile sampleImage() {
        return new MockMultipartFile(
                "image", "meal.jpg", MediaType.IMAGE_JPEG_VALUE, new byte[]{1, 2, 3, 4});
    }

    private static String matchedUpstreamBody() {
        return "{"
                + "\"matched\":true,"
                + "\"prediction\":{\"top1_food_name\":\"김치찌개\",\"top1_similarity\":0.91},"
                + "\"candidates\":["
                + "  {\"rank\":1,\"food_id\":42,\"food_name\":\"김치찌개\",\"similarity\":0.91,"
                + "   \"nutrition\":{\"serving_basis\":250.0,\"calories_kcal\":320.5,"
                + "                  \"protein_g\":18.2,\"fat_g\":12.0,\"carbs_g\":24.0}}"
                + "],"
                + "\"top_k_used\":5,\"returned_candidates\":1,"
                + "\"model_name\":\"dinov2\",\"distance_metric\":\"cosine\""
                + "}";
    }

    private static String unmatchedUpstreamBody() {
        return "{"
                + "\"matched\":false,"
                + "\"prediction\":null,"
                + "\"candidates\":[],"
                + "\"top_k_used\":5,\"returned_candidates\":0,"
                + "\"model_name\":\"dinov2\",\"distance_metric\":\"cosine\""
                + "}";
    }

    @Nested
    @DisplayName("POST /meals/upload/image")
    class Upload {

        @Test
        @DisplayName("세션 없음: 401 UNAUTHORIZED")
        void withoutSession_returns401() throws Exception {
            mockMvc.perform(multipart(ENDPOINT).file(sampleImage()))
                    .andExpect(status().isUnauthorized());

            verify(restTemplate, never()).exchange(anyString(), any(), any(HttpEntity.class), eq(String.class));
        }

        @Test
        @DisplayName("정상 응답: vision raw → MealImageUploadResponse 매핑")
        void normal_mapsToMealImageUploadResponse() throws Exception {
            when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
                    .thenReturn(ResponseEntity.ok(matchedUpstreamBody()));

            mockMvc.perform(multipart(ENDPOINT)
                            .file(sampleImage())
                            .session(authSession))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.confidence").value(0.91))
                    .andExpect(jsonPath("$.message").doesNotExist())
                    .andExpect(jsonPath("$.imageUrl").doesNotExist())
                    .andExpect(jsonPath("$.recognizedFoods.length()").value(1))
                    .andExpect(jsonPath("$.recognizedFoods[0].id").value(42))
                    .andExpect(jsonPath("$.recognizedFoods[0].name").value("김치찌개"))
                    .andExpect(jsonPath("$.recognizedFoods[0].confidence").value(0.91))
                    .andExpect(jsonPath("$.recognizedFoods[0].calories").value(320.5))
                    .andExpect(jsonPath("$.recognizedFoods[0].protein").value(18.2))
                    .andExpect(jsonPath("$.recognizedFoods[0].fat").value(12.0))
                    .andExpect(jsonPath("$.recognizedFoods[0].carbs").value(24.0))
                    .andExpect(jsonPath("$.recognizedFoods[0].servingSize").value(250.0))
                    .andExpect(jsonPath("$.recognizedFoods[0].brand").doesNotExist())
                    .andExpect(jsonPath("$.recognizedFoods[0].servingUnit").doesNotExist());
        }

        @Test
        @DisplayName("matched=false: message 채움, recognizedFoods 빈 배열")
        void unmatched_setsMessageAndEmptyList() throws Exception {
            when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
                    .thenReturn(ResponseEntity.ok(unmatchedUpstreamBody()));

            mockMvc.perform(multipart(ENDPOINT)
                            .file(sampleImage())
                            .session(authSession))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.message").value("유사 항목 없음"))
                    .andExpect(jsonPath("$.confidence").doesNotExist())
                    .andExpect(jsonPath("$.recognizedFoods.length()").value(0));
        }

        @Test
        @DisplayName("X-Guest-Id, X-Internal-Key 헤더와 multipart 본문이 업스트림으로 전달")
        void headers_andBody_forwarded() throws Exception {
            when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
                    .thenReturn(ResponseEntity.ok(unmatchedUpstreamBody()));

            mockMvc.perform(multipart(ENDPOINT)
                            .file(sampleImage())
                            .session(authSession))
                    .andExpect(status().isOk());

            @SuppressWarnings({"unchecked", "rawtypes"})
            ArgumentCaptor<HttpEntity> captor = ArgumentCaptor.forClass(HttpEntity.class);
            verify(restTemplate).exchange(anyString(), eq(HttpMethod.POST), captor.capture(), eq(String.class));

            HttpHeaders headers = captor.getValue().getHeaders();
            assertThat(headers.getFirst("X-Guest-Id")).isEqualTo(GUEST_ID);
            assertThat(headers.getFirst("X-Internal-Key")).isEqualTo(INTERNAL_KEY);
            assertThat(headers.getContentType()).isNotNull();
            assertThat(headers.getContentType().toString()).contains(MediaType.MULTIPART_FORM_DATA_VALUE);

            Object body = captor.getValue().getBody();
            assertThat(body).isInstanceOf(MultiValueMap.class);
            @SuppressWarnings("unchecked")
            MultiValueMap<String, Object> form = (MultiValueMap<String, Object>) body;
            Object filePart = form.getFirst("file");
            assertThat(filePart)
                    .as("업스트림에는 'file' 필드명으로 재포장")
                    .isInstanceOf(HttpEntity.class);
            HttpEntity<?> filePartEntity = (HttpEntity<?>) filePart;
            assertThat(filePartEntity.getHeaders().getContentType())
                    .isEqualTo(MediaType.IMAGE_JPEG);
        }

        @Test
        @DisplayName("파일 Content-Type이 없으면 application/octet-stream 으로 전송")
        void filePart_defaultContentType_whenAbsent() throws Exception {
            when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
                    .thenReturn(ResponseEntity.ok(unmatchedUpstreamBody()));

            MockMultipartFile noTypeFile = new MockMultipartFile(
                    "image", "raw.bin", null, new byte[]{9, 9, 9});

            mockMvc.perform(multipart(ENDPOINT)
                            .file(noTypeFile)
                            .session(authSession))
                    .andExpect(status().isOk());

            @SuppressWarnings({"unchecked", "rawtypes"})
            ArgumentCaptor<HttpEntity> captor = ArgumentCaptor.forClass(HttpEntity.class);
            verify(restTemplate).exchange(anyString(), eq(HttpMethod.POST), captor.capture(), eq(String.class));

            @SuppressWarnings("unchecked")
            MultiValueMap<String, Object> form = (MultiValueMap<String, Object>) captor.getValue().getBody();
            HttpEntity<?> filePartEntity = (HttpEntity<?>) form.getFirst("file");
            assertThat(filePartEntity.getHeaders().getContentType())
                    .isEqualTo(MediaType.APPLICATION_OCTET_STREAM);
        }

        @Test
        @DisplayName("파일 읽기 실패: 500 + detail 본문, 업스트림 호출 안 함")
        void fileReadError_returns500() throws Exception {
            MockMultipartFile failingFile = new MockMultipartFile(
                    "image", "bad.jpg", MediaType.IMAGE_JPEG_VALUE, new byte[]{1, 2}) {
                @Override
                public byte[] getBytes() throws java.io.IOException {
                    throw new java.io.IOException("simulated read failure");
                }
            };

            mockMvc.perform(multipart(ENDPOINT)
                            .file(failingFile)
                            .session(authSession))
                    .andExpect(status().isInternalServerError())
                    .andExpect(content().string(containsString("failed to read uploaded file")));

            verify(restTemplate, never()).exchange(anyString(), any(), any(HttpEntity.class), eq(String.class));
        }

        @Test
        @DisplayName("X-Request-ID 헤더가 있으면 업스트림으로 forward")
        void requestId_forwarded() throws Exception {
            when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
                    .thenReturn(ResponseEntity.ok(unmatchedUpstreamBody()));

            mockMvc.perform(multipart(ENDPOINT)
                            .file(sampleImage())
                            .header("X-Request-ID", "req-abc-123")
                            .session(authSession))
                    .andExpect(status().isOk());

            @SuppressWarnings({"unchecked", "rawtypes"})
            ArgumentCaptor<HttpEntity> captor = ArgumentCaptor.forClass(HttpEntity.class);
            verify(restTemplate).exchange(anyString(), eq(HttpMethod.POST), captor.capture(), eq(String.class));

            assertThat(captor.getValue().getHeaders().getFirst("X-Request-ID")).isEqualTo("req-abc-123");
        }

        @Test
        @DisplayName("X-Request-ID 헤더가 없으면 업스트림에 설정 안 됨")
        void requestId_absent_notForwarded() throws Exception {
            when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
                    .thenReturn(ResponseEntity.ok(unmatchedUpstreamBody()));

            mockMvc.perform(multipart(ENDPOINT)
                            .file(sampleImage())
                            .session(authSession))
                    .andExpect(status().isOk());

            @SuppressWarnings({"unchecked", "rawtypes"})
            ArgumentCaptor<HttpEntity> captor = ArgumentCaptor.forClass(HttpEntity.class);
            verify(restTemplate).exchange(anyString(), eq(HttpMethod.POST), captor.capture(), eq(String.class));

            assertThat(captor.getValue().getHeaders().getFirst("X-Request-ID")).isNull();
        }

        @Test
        @DisplayName("업스트림 URL이 /v1/meals/upload/image 로 라우팅")
        void upstream_path_isMealsUploadImage() throws Exception {
            when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
                    .thenReturn(ResponseEntity.ok(unmatchedUpstreamBody()));

            mockMvc.perform(multipart(ENDPOINT)
                            .file(sampleImage())
                            .session(authSession));

            ArgumentCaptor<String> urlCaptor = ArgumentCaptor.forClass(String.class);
            verify(restTemplate).exchange(urlCaptor.capture(), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class));

            assertThat(urlCaptor.getValue()).startsWith(VISION_BASE + "/v1/meals/upload/image");
        }

        @Test
        @DisplayName("top_k, min_similarity 쿼리파라미터가 업스트림 URL에 반영")
        void queryParams_appendedToUpstream() throws Exception {
            when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
                    .thenReturn(ResponseEntity.ok(unmatchedUpstreamBody()));

            mockMvc.perform(multipart(ENDPOINT)
                            .file(sampleImage())
                            .param("top_k", "10")
                            .param("min_similarity", "0.7")
                            .session(authSession))
                    .andExpect(status().isOk());

            ArgumentCaptor<String> urlCaptor = ArgumentCaptor.forClass(String.class);
            verify(restTemplate).exchange(urlCaptor.capture(), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class));

            String url = urlCaptor.getValue();
            assertThat(url).contains("top_k=10");
            assertThat(url).contains("min_similarity=0.7");
        }

        @Test
        @DisplayName("쿼리파라미터 없으면 업스트림 URL에도 쿼리 없음")
        void queryParams_omitted_whenAbsent() throws Exception {
            when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
                    .thenReturn(ResponseEntity.ok(unmatchedUpstreamBody()));

            mockMvc.perform(multipart(ENDPOINT)
                            .file(sampleImage())
                            .session(authSession));

            ArgumentCaptor<String> urlCaptor = ArgumentCaptor.forClass(String.class);
            verify(restTemplate).exchange(urlCaptor.capture(), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class));

            String url = urlCaptor.getValue();
            assertThat(url).doesNotContain("top_k");
            assertThat(url).doesNotContain("min_similarity");
        }

        @Test
        @DisplayName("업스트림 4xx 응답: 동일 status/body 패스스루")
        void upstream4xx_passedThrough() throws Exception {
            String errorBody = "{\"detail\":\"Unsupported file type.\"}";
            when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
                    .thenThrow(HttpClientErrorException.create(
                            HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Unsupported Media Type",
                            HttpHeaders.EMPTY, errorBody.getBytes(), null));

            mockMvc.perform(multipart(ENDPOINT)
                            .file(sampleImage())
                            .session(authSession))
                    .andExpect(status().isUnsupportedMediaType())
                    .andExpect(content().string(errorBody));
        }

        @Test
        @DisplayName("업스트림 연결 실패: 500 + detail 본문")
        void upstreamConnectionError_returns500() throws Exception {
            when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
                    .thenThrow(new RuntimeException("connection refused"));

            mockMvc.perform(multipart(ENDPOINT)
                            .file(sampleImage())
                            .session(authSession))
                    .andExpect(status().isInternalServerError())
                    .andExpect(content().string(containsString("upstream 호출 실패")));
        }

        @Test
        @DisplayName("업스트림 응답 파싱 실패(잘못된 JSON): 500 + detail 본문")
        void upstreamParseError_returns500() throws Exception {
            when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
                    .thenReturn(ResponseEntity.ok("not a json"));

            mockMvc.perform(multipart(ENDPOINT)
                            .file(sampleImage())
                            .session(authSession))
                    .andExpect(status().isInternalServerError())
                    .andExpect(content().string(containsString("upstream 응답 파싱 실패")));
        }
    }
}
