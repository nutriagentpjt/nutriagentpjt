"""_sanitize_tool_input 단위 테스트

Claude Sonnet 4가 structured tool use JSON 값 안에 XML 마크업을 섞는 버그를 방어하는
_sanitize_tool_input 함수의 정상 동작과 엣지 케이스를 검증한다.
"""

import pytest

from app.chatbot.engine import _sanitize_tool_input


class TestSanitizeToolInput:
    # ── 정상 케이스 ──────────────────────────────────────────────

    def test_clean_json_passthrough(self):
        raw = '{"meal_type": "LUNCH", "mode": "set", "top_n": 5}'
        result = _sanitize_tool_input(raw)
        assert result == {"meal_type": "LUNCH", "mode": "set", "top_n": 5}

    def test_xml_artifact_stripped_from_mode(self):
        """실제 에러 재현: mode 값에 XML 잔재가 붙어 있는 경우"""
        raw = (
            '{"meal_type": "LUNCH", "mode": "set</parameter>\\n'
            '<parameter name=\\"top_n\\">5</parameter>\\n</invoke>"}'
        )
        result = _sanitize_tool_input(raw)
        assert result["mode"] == "set"
        assert result["meal_type"] == "LUNCH"

    def test_xml_artifact_stripped_from_meal_type(self):
        raw = '{"meal_type": "DINNER</parameter>\\n</invoke>", "mode": "single"}'
        result = _sanitize_tool_input(raw)
        assert result["meal_type"] == "DINNER"
        assert result["mode"] == "single"

    def test_integer_value_unchanged(self):
        raw = '{"meal_type": "BREAKFAST", "top_n": 3}'
        result = _sanitize_tool_input(raw)
        assert result["top_n"] == 3

    def test_multiple_xml_contaminated_fields(self):
        raw = '{"meal_type": "LUNCH</p>", "mode": "set<br/>extra"}'
        result = _sanitize_tool_input(raw)
        assert result["meal_type"] == "LUNCH"
        assert result["mode"] == "set"

    # ── 엣지 케이스 ──────────────────────────────────────────────

    def test_empty_string_returns_empty_dict(self):
        assert _sanitize_tool_input("") == {}

    def test_broken_json_with_trailing_xml_recovered(self):
        """JSON 뒤에 XML이 붙어 JSONDecodeError가 나는 경우 재시도 로직 검증"""
        raw = '{"meal_type": "LUNCH", "mode": "set"}\n</parameter>\n</invoke>'
        result = _sanitize_tool_input(raw)
        assert result == {"meal_type": "LUNCH", "mode": "set"}

    def test_completely_invalid_json_returns_empty_dict(self):
        assert _sanitize_tool_input("not json at all") == {}

    def test_string_with_no_xml_but_angle_bracket_in_value(self):
        """< 가 포함되어 있지만 HTML 태그가 아닌 경우 (예: 수식)도 첫 < 기준으로 자름"""
        raw = '{"expr": "a<b", "mode": "set"}'
        result = _sanitize_tool_input(raw)
        assert result["expr"] == "a"
        assert result["mode"] == "set"
