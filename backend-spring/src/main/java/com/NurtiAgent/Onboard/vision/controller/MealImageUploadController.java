package com.NurtiAgent.Onboard.vision.controller;

import com.NurtiAgent.Onboard.common.annotation.GuestId;
import com.NurtiAgent.Onboard.vision.dto.MealImageRecognitionCandidate;
import com.NurtiAgent.Onboard.vision.dto.MealImageUploadResponse;
import com.NurtiAgent.Onboard.vision.dto.upstream.VisionCandidate;
import com.NurtiAgent.Onboard.vision.dto.upstream.VisionNutrition;
import com.NurtiAgent.Onboard.vision.dto.upstream.VisionSearchResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/meals")
public class MealImageUploadController {

    private static final String REQUEST_ID_HEADER = "X-Request-ID";
    private static final String NO_MATCH_MESSAGE = "유사 항목 없음";

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${fastapi.vision.url}")
    private String fastapiVisionUrl;

    @Value("${fastapi.internal-key}")
    private String internalApiKey;

    public MealImageUploadController(RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    @PostMapping(value = "/upload/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadImage(
            @GuestId String guestId,
            @RequestPart("image") MultipartFile image,
            @RequestParam(value = "top_k", required = false) Integer topK,
            @RequestParam(value = "min_similarity", required = false) Double minSimilarity,
            HttpServletRequest servletRequest) {

        UriComponentsBuilder builder = UriComponentsBuilder
                .fromUriString(fastapiVisionUrl)
                .path("/v1/meals/upload/image");
        if (topK != null) {
            builder.queryParam("top_k", topK);
        }
        if (minSimilarity != null) {
            builder.queryParam("min_similarity", minSimilarity);
        }
        String url = builder.toUriString();

        HttpEntity<ByteArrayResource> filePart;
        try {
            filePart = buildFilePart(image);
        } catch (IOException e) {
            log.error("업로드 파일 읽기 실패", e);
            return ResponseEntity.internalServerError()
                    .body("{\"detail\":\"failed to read uploaded file\"}");
        }

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", filePart);

        HttpHeaders headers = buildHeaders(guestId, servletRequest);
        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<String> upstream = restTemplate.exchange(
                    url, HttpMethod.POST, requestEntity, String.class);
            VisionSearchResponse parsed = objectMapper.readValue(
                    upstream.getBody(), VisionSearchResponse.class);
            return ResponseEntity.ok(toMealImageUploadResponse(parsed));
        } catch (HttpStatusCodeException e) {
            return ResponseEntity.status(e.getStatusCode())
                    .body(e.getResponseBodyAsString());
        } catch (IOException e) {
            log.error("Vision API 응답 파싱 실패", e);
            return ResponseEntity.internalServerError()
                    .body("{\"detail\":\"upstream 응답 파싱 실패\"}");
        } catch (Exception e) {
            log.error("Vision API 호출 오류", e);
            return ResponseEntity.internalServerError()
                    .body("{\"detail\":\"upstream 호출 실패\"}");
        }
    }

    private MealImageUploadResponse toMealImageUploadResponse(VisionSearchResponse upstream) {
        Double confidence = upstream.prediction() != null
                ? upstream.prediction().top1Similarity()
                : null;
        List<MealImageRecognitionCandidate> recognizedFoods = upstream.candidates() == null
                ? List.of()
                : upstream.candidates().stream().map(this::toCandidate).toList();
        String message = upstream.matched() ? null : NO_MATCH_MESSAGE;
        return new MealImageUploadResponse(null, message, confidence, recognizedFoods);
    }

    private MealImageRecognitionCandidate toCandidate(VisionCandidate c) {
        VisionNutrition n = c.nutrition();
        return new MealImageRecognitionCandidate(
                c.foodId(),
                c.foodName(),
                null,
                c.similarity(),
                n != null ? n.caloriesKcal() : null,
                n != null ? n.carbsG() : null,
                n != null ? n.proteinG() : null,
                n != null ? n.fatG() : null,
                n != null ? n.servingBasis() : null,
                null
        );
    }

    private HttpEntity<ByteArrayResource> buildFilePart(MultipartFile file) throws IOException {
        byte[] bytes = file.getBytes();
        String filename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "upload";
        ByteArrayResource resource = new ByteArrayResource(bytes) {
            @Override
            public String getFilename() {
                return filename;
            }

            @Override
            public long contentLength() {
                return bytes.length;
            }
        };
        HttpHeaders partHeaders = new HttpHeaders();
        String contentType = file.getContentType();
        partHeaders.setContentType(contentType != null
                ? MediaType.parseMediaType(contentType)
                : MediaType.APPLICATION_OCTET_STREAM);
        return new HttpEntity<>(resource, partHeaders);
    }

    private HttpHeaders buildHeaders(String guestId, HttpServletRequest servletRequest) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        headers.set("X-Guest-Id", guestId);
        headers.set("X-Internal-Key", internalApiKey);

        String requestId = servletRequest.getHeader(REQUEST_ID_HEADER);
        if (requestId != null && !requestId.isBlank()) {
            headers.set(REQUEST_ID_HEADER, requestId);
        }
        return headers;
    }
}
