package com.NurtiAgent.Onboard;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * ApplicationContext 전체 부팅 검증.
 *
 * 슬라이스 테스트(@WebMvcTest)는 컨트롤러를 하나씩만 로드하므로,
 * 서로 다른 컨트롤러 간 요청 매핑 충돌(예: 동일 URL+HTTP 메서드 ambiguous mapping)을
 * 감지하지 못한다. 이 테스트는 전체 컨텍스트를 한 번 부팅해 그런 빈 등록 단계의
 * 충돌을 CI에서 차단한다.
 *
 * 배경: PR #38이 PR #46까지 ambiguous mapping을 들고 운영에 도달해 spring 부팅
 * 실패를 일으킨 사례 — 슬라이스 테스트는 통과했지만 전체 부팅은 폭발했다.
 */
@SpringBootTest
class ApplicationContextBootTest {

    @Autowired ApplicationContext applicationContext;

    @Test
    @DisplayName("ApplicationContext가 부팅된다 (ambiguous mapping 등 빈 등록 충돌 없음)")
    void contextLoads() {
        assertThat(applicationContext).isNotNull();
    }
}
