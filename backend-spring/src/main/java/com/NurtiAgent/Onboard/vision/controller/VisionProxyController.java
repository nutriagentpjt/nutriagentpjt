package com.NurtiAgent.Onboard.vision.controller;

import com.NurtiAgent.Onboard.common.annotation.GuestId;
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

@Slf4j
@RestController
@RequestMapping("/api/v1/vision")
public class VisionProxyController {

    private static final String REQUEST_ID_HEADER = "X-Request-ID";

    private final RestTemplate restTemplate;

    @Value("${fastapi.vision.url}")
    private String fastapiVisionUrl;

    @Value("${fastapi.internal-key}")
    private String internalApiKey;

    public VisionProxyController(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    @PostMapping(value = "/analyze", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> analyze(
            @GuestId String guestId,
            @RequestPart("file") MultipartFile file,
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
            filePart = buildFilePart(file);
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
            return restTemplate.exchange(url, HttpMethod.POST, requestEntity, String.class);
        } catch (HttpStatusCodeException e) {
            return ResponseEntity.status(e.getStatusCode())
                    .body(e.getResponseBodyAsString());
        } catch (Exception e) {
            log.error("Vision API 호출 오류", e);
            return ResponseEntity.internalServerError()
                    .body("{\"detail\":\"upstream 호출 실패\"}");
        }
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
