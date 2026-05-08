"""
로컬에서 Vision API 추론을 테스트하는 스크립트.

두 가지 모드:
  encode  — DINOv2 모델 인코딩만 테스트. DB/서버 불필요.
            모델이 이미지를 올바르게 처리하는지, 임베딩 shape/norm이 정상인지 확인.

  api     — 실행 중인 FastAPI 서버에 실제 HTTP 요청 전송. DB + 서버 모두 필요.
            전체 파이프라인(인코딩 → 벡터 검색 → 후보 반환)을 end-to-end로 검증.

사용 예:
    # 모드 1: 모델만 테스트 (DB 없어도 됨)
    cd backend-fastapi/vision
    python scripts/test_inference.py --image /path/to/food.jpg

    # 모드 2: 실행 중인 서버에 전송
    python scripts/test_inference.py --image /path/to/food.jpg --mode api
    python scripts/test_inference.py --image /path/to/food.jpg --mode api --url http://localhost:8000
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request

# -----------------------------------------------------------------------
# encode 모드는 app.* 를 직접 임포트한다.
# config.py 가 모듈 로드 시 DATABASE_URL 을 검증하므로
# 더미 값을 먼저 설정해 DB 불필요한 encode 테스트가 실패하지 않도록 한다.
# -----------------------------------------------------------------------
os.environ.setdefault("DATABASE_URL", "postgresql://localhost/dummy_for_encode_test")


def _check_image_file(path: str) -> None:
    if not os.path.isfile(path):
        print(f"[오류] 이미지 파일을 찾을 수 없습니다: {path}")
        sys.exit(1)


# -----------------------------------------------------------------------
# 모드 1: encode
# -----------------------------------------------------------------------

def test_encode(image_path: str) -> None:
    """
    DINOv2 모델 로딩 + 이미지 인코딩만 테스트.
    DB, 서버 모두 불필요.

    확인 항목:
    - 모델이 정상적으로 로드되는가
    - 이미지 전처리 파이프라인이 작동하는가
    - 임베딩 shape 이 (768,) 인가
    - L2 정규화가 됐는가 (norm ≈ 1.0)
    - NaN / inf 가 없는가
    """
    import numpy as np

    # app 디렉토리가 PYTHONPATH에 없을 경우를 대비
    vision_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    if vision_root not in sys.path:
        sys.path.insert(0, vision_root)

    from app.model import encode_query_image

    print("=" * 55)
    print("[encode 테스트] DINOv2 모델 인코딩")
    print("=" * 55)
    print(f"이미지: {image_path}")
    print()
    print("모델 로딩 중... (첫 실행 시 torch.hub 다운로드로 수 분 소요)")

    t0 = time.time()
    with open(image_path, "rb") as f:
        image_bytes = f.read()

    print(f"이미지 크기: {len(image_bytes) / 1024:.1f} KB")

    try:
        embedding = encode_query_image(image_bytes)
    except Exception as e:
        print(f"\n[실패] 인코딩 에러: {e}")
        sys.exit(1)

    elapsed = time.time() - t0
    l2_norm = float(np.linalg.norm(embedding))
    has_nan = not bool(np.isfinite(embedding).all())

    print()
    print(f"[결과]")
    print(f"  소요 시간  : {elapsed:.2f}s")
    print(f"  shape      : {embedding.shape}  (기대값: (768,))")
    print(f"  dtype      : {embedding.dtype}   (기대값: float32)")
    print(f"  L2 norm    : {l2_norm:.6f}  (정규화됐으면 1.000000)")
    print(f"  NaN/Inf    : {'있음 ⚠' if has_nan else '없음'}")
    print(f"  값 범위    : [{embedding.min():.4f}, {embedding.max():.4f}]")
    print(f"  첫 5개 값  : {embedding[:5].tolist()}")
    print()

    # 검증
    ok = True
    if embedding.shape != (768,):
        print(f"  [경고] shape 이 (768,) 가 아닙니다: {embedding.shape}")
        ok = False
    if abs(l2_norm - 1.0) > 0.01:
        print(f"  [경고] L2 norm 이 1.0 에서 벗어납니다: {l2_norm:.6f}")
        ok = False
    if has_nan:
        print("  [경고] 임베딩에 NaN 또는 Inf 가 포함되어 있습니다.")
        ok = False

    if ok:
        print("  [OK] 모든 검증 통과 — 모델 인코딩 정상")
    else:
        print("  [실패] 검증 실패 항목 있음 — 위 경고를 확인하세요.")
        sys.exit(1)


# -----------------------------------------------------------------------
# 모드 2: api
# -----------------------------------------------------------------------

def _check_server_ready(server_url: str) -> None:
    ready_url = f"{server_url.rstrip('/')}/health/ready"
    try:
        with urllib.request.urlopen(ready_url, timeout=5) as resp:
            print(f"[OK] 서버 준비 완료 ({ready_url})")
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"[실패] 서버 준비 안 됨 (HTTP {e.code}): {body}")
        print("       uvicorn 이 실행 중인지, DB/모델이 초기화됐는지 확인하세요.")
        sys.exit(1)
    except Exception as e:
        print(f"[실패] 서버에 연결할 수 없습니다: {e}")
        print(f"       서버가 {server_url} 에서 실행 중인지 확인하세요.")
        sys.exit(1)


def _build_multipart_body(image_path: str) -> tuple[bytes, str]:
    """multipart/form-data 바디와 boundary 를 반환한다."""
    boundary = "VisionTestBoundary"
    filename = os.path.basename(image_path)
    ext = filename.rsplit(".", 1)[-1].lower()
    content_type_map = {
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "png": "image/png",
        "webp": "image/webp",
    }
    file_ct = content_type_map.get(ext, "image/jpeg")

    with open(image_path, "rb") as f:
        image_bytes = f.read()

    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="file"; filename="{filename}"\r\n'
        f"Content-Type: {file_ct}\r\n\r\n"
    ).encode() + image_bytes + f"\r\n--{boundary}--\r\n".encode()

    return body, boundary


def test_api(image_path: str, server_url: str) -> None:
    """
    실행 중인 FastAPI 서버에 이미지를 전송해 전체 파이프라인을 테스트한다.

    확인 항목:
    - /health/ready 가 200인가
    - /v1/meals/upload/image 가 정상 응답하는가
    - matched, candidates, food_id, similarity, nutrition 이 올바른 구조인가
    - X-Request-ID 헤더가 응답에 포함되는가
    """
    print("=" * 55)
    print("[api 테스트] FastAPI 서버 end-to-end")
    print("=" * 55)
    print(f"서버  : {server_url}")
    print(f"이미지: {image_path}")
    print()

    _check_server_ready(server_url)

    endpoint = f"{server_url.rstrip('/')}/v1/meals/upload/image"
    body, boundary = _build_multipart_body(image_path)
    request_id = f"local-test-{int(time.time())}"

    req = urllib.request.Request(
        endpoint,
        data=body,
        headers={
            "Content-Type": f"multipart/form-data; boundary={boundary}",
            "X-Request-ID": request_id,
        },
        method="POST",
    )

    print(f"요청 전송 중... (X-Request-ID: {request_id})")
    t0 = time.time()

    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            elapsed = time.time() - t0
            result = json.loads(resp.read())
            returned_request_id = resp.headers.get("X-Request-ID", "없음")

    except urllib.error.HTTPError as e:
        elapsed = time.time() - t0
        body_text = e.read().decode()
        print(f"\n[실패] HTTP {e.code} ({elapsed:.2f}s)")
        print(f"  응답: {body_text}")
        sys.exit(1)
    except Exception as e:
        print(f"\n[실패] 요청 에러: {e}")
        sys.exit(1)

    print(f"\n[결과] ({elapsed:.2f}s)")
    print(f"  matched            : {result.get('matched')}")
    print(f"  top_k_used         : {result.get('top_k_used')}")
    print(f"  returned_candidates: {result.get('returned_candidates')}")
    print(f"  model_name         : {result.get('model_name')}")
    print(f"  X-Request-ID       : {returned_request_id}")

    if result.get("matched"):
        pred = result.get("prediction", {})
        print(f"\n  [예측]")
        print(f"    top1_food_name  : {pred.get('top1_food_name')}")
        print(f"    top1_similarity : {pred.get('top1_similarity', 0):.4f}")

        print(f"\n  [후보 목록]")
        for c in result.get("candidates", []):
            nut = c.get("nutrition", {})
            kcal = nut.get("calories_kcal")
            print(
                f"    {c['rank']}. {c['food_name']}"
                f"  (food_id={c['food_id']}"
                f", sim={c.get('similarity', 0):.4f}"
                f", kcal={kcal})"
            )
        print()
        print("  [OK] 추론 성공")
    else:
        print()
        print("  [참고] matched=false — 유사한 음식을 찾지 못했습니다.")
        print("         다른 이미지를 시도하거나 --min-similarity 를 낮춰보세요.")


# -----------------------------------------------------------------------
# CLI
# -----------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Vision API 로컬 추론 테스트",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
예시:
  # 모델 인코딩만 테스트 (DB/서버 불필요)
  python scripts/test_inference.py --image ~/food.jpg

  # 실행 중인 서버에 실제 요청
  python scripts/test_inference.py --image ~/food.jpg --mode api
        """,
    )
    parser.add_argument(
        "--image",
        required=True,
        help="테스트할 이미지 파일 경로 (JPEG / PNG / WebP)",
    )
    parser.add_argument(
        "--mode",
        choices=["encode", "api"],
        default="encode",
        help=(
            "encode: DINOv2 인코딩만 테스트, DB 불필요 (기본값)\n"
            "api   : 실행 중인 서버에 HTTP 요청 전송, DB + 서버 필요"
        ),
    )
    parser.add_argument(
        "--url",
        default="http://localhost:8000",
        help="서버 URL (api 모드 전용, 기본값: http://localhost:8000)",
    )
    args = parser.parse_args()

    _check_image_file(args.image)

    if args.mode == "encode":
        test_encode(args.image)
    else:
        test_api(args.image, args.url)


if __name__ == "__main__":
    main()
