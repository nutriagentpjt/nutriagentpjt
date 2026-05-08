from __future__ import annotations

from dataclasses import dataclass
from io import BytesIO
from threading import Lock
from typing import Any

import numpy as np
from PIL import Image, UnidentifiedImageError

import torch
from torchvision import transforms

from app.config import settings


class ModelError(RuntimeError):
    """Raised when model loading or image encoding fails."""


@dataclass(frozen=True)
class ModelMetadata:
    model_name: str
    embedding_dim: int
    device: str
    image_size: int
    resize_size: int
    l2_normalize: bool


class DINOv2ImageEncoder:
    """
    Service-time DINOv2 encoder for query images.

    Design goals:
    - Match offline preprocessing exactly
    - Fail loudly on invalid input
    - Return a single embedding as np.ndarray(shape=(768,), dtype=float32)
    """

    def __init__(
        self,
        model_name: str = settings.MODEL_NAME,
        device: str = settings.MODEL_DEVICE,
        image_size: int = 224,
        resize_size: int = 256,
        l2_normalize: bool = True,
        hub_repo: str = "facebookresearch/dinov2",
    ) -> None:
        self.model_name = model_name
        self.requested_device = device
        self.image_size = image_size
        self.resize_size = resize_size
        self.l2_normalize = l2_normalize
        self.hub_repo = hub_repo

        self.device = self._resolve_device(device)
        self.model = self._load_model()
        self.transform = self._build_transform()

    def _resolve_device(self, device: str) -> torch.device:
        if device == "cuda" and torch.cuda.is_available():
            return torch.device("cuda")
        if device == "mps" and torch.backends.mps.is_available():
            return torch.device("mps")
        return torch.device("cpu")

    def _load_model(self) -> torch.nn.Module:
        """
        Load model weights.

        If MODEL_WEIGHTS_PATH is set, loads a local state_dict file.
        This allows offline deployment without internet access.

        Otherwise, downloads from torch.hub (facebookresearch/dinov2).
        """
        try:
            # facebookresearch/dinov2 hubconf.py 는 버전에 따라 pretrained 인자를
            # 지원하지 않을 수 있다. torch.hub.load 로 아키텍처를 로드한 뒤
            # load_state_dict 로 가중치를 덮어쓰는 방식이 안전하다.
            # trust_repo=True: Docker/CI 환경에서 인터랙티브 프롬프트 방지
            # verbose=False: 불필요한 torch.hub 다운로드 로그 억제
            # force_reload=False(기본값): ~/.cache/torch/hub 캐시 우선 사용
            #   → docker-compose의 vision_model_cache 볼륨이 있으면 재시작 시 네트워크 불필요
            model = torch.hub.load(
                self.hub_repo,
                self.model_name,
                trust_repo=True,
                verbose=False,
            )

            if settings.MODEL_WEIGHTS_PATH:
                checkpoint = torch.load(
                    settings.MODEL_WEIGHTS_PATH,
                    map_location="cpu",
                    weights_only=True,  # arbitrary code execution 방지 (pickle RCE)
                )
                # Support both raw state_dict and checkpoint dicts (e.g. {"model": ...})
                state_dict = (
                    checkpoint.get("model", checkpoint)
                    if isinstance(checkpoint, dict) and "model" in checkpoint
                    else checkpoint
                )
                model.load_state_dict(state_dict)

            model.eval()
            model.to(self.device)
            return model
        except Exception as e:
            source = settings.MODEL_WEIGHTS_PATH or self.hub_repo
            raise ModelError(
                f"Failed to load model '{self.model_name}' from '{source}': {e}"
            ) from e

    def _build_transform(self) -> transforms.Compose:
        """
        Matches offline transform:
        RGB -> Resize(256) -> CenterCrop(224) -> ToTensor -> Normalize
        """
        return transforms.Compose(
            [
                transforms.Lambda(lambda img: img.convert("RGB")),
                transforms.Resize(self.resize_size),
                transforms.CenterCrop(self.image_size),
                transforms.ToTensor(),
                transforms.Normalize(
                    mean=(0.485, 0.456, 0.406),
                    std=(0.229, 0.224, 0.225),
                ),
            ]
        )

    def _postprocess_embeddings(self, embeddings: np.ndarray) -> np.ndarray:
        embeddings = embeddings.astype(np.float32)

        # shape 검증을 정규화 이전에 수행한다.
        # 순서가 바뀌면 ndim != 2 인 텐서에 axis=1 norm 계산이 먼저 실행되어
        # 잘못된 결과를 만든 뒤 에러가 나는 논리적 오류가 발생한다.
        if embeddings.ndim != 2:
            raise ModelError(f"Embeddings must be 2D, got shape={embeddings.shape}")

        if self.l2_normalize:
            norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
            norms = np.maximum(norms, 1e-12)
            embeddings = embeddings / norms

        if not np.isfinite(embeddings).all():
            raise ModelError("Embeddings contain NaN or inf values.")

        return embeddings

    def _pil_to_tensor(self, image: Image.Image) -> torch.Tensor:
        try:
            return self.transform(image)
        except Exception as e:
            raise ModelError(f"Failed during image transform: {e}") from e

    @torch.no_grad()
    def encode_pil_image(self, image: Image.Image) -> np.ndarray:
        """
        Returns:
            np.ndarray with shape (embedding_dim,), dtype=float32
        """
        tensor = self._pil_to_tensor(image)
        batch = torch.stack([tensor], dim=0).to(self.device)

        try:
            outputs = self.model(batch)
        except Exception as e:
            raise ModelError(f"Model forward failed: {e}") from e

        if not isinstance(outputs, torch.Tensor):
            raise ModelError(f"Unexpected model output type: {type(outputs)}")

        embeddings = outputs.detach().cpu().numpy()
        embeddings = self._postprocess_embeddings(embeddings)

        if embeddings.shape[0] != 1:
            raise ModelError(
                f"Expected batch output of size 1, got embeddings shape={embeddings.shape}"
            )

        if embeddings.shape[1] != settings.EMBEDDING_DIM:
            raise ModelError(
                f"Embedding dim mismatch: expected {settings.EMBEDDING_DIM}, got {embeddings.shape[1]}"
            )

        return embeddings[0]

    def encode_image_bytes(self, image_bytes: bytes) -> np.ndarray:
        if not image_bytes:
            raise ModelError("image_bytes is empty")

        try:
            with Image.open(BytesIO(image_bytes)) as image:
                return self.encode_pil_image(image)
        except UnidentifiedImageError as e:
            raise ModelError("Uploaded file is not a valid image.") from e
        except OSError as e:
            raise ModelError(f"Failed to open image bytes: {e}") from e

    def get_metadata(self) -> ModelMetadata:
        return ModelMetadata(
            model_name=self.model_name,
            embedding_dim=settings.EMBEDDING_DIM,
            device=str(self.device),
            image_size=self.image_size,
            resize_size=self.resize_size,
            l2_normalize=self.l2_normalize,
        )


_model_instance: DINOv2ImageEncoder | None = None
_model_lock = Lock()


def get_model() -> DINOv2ImageEncoder:
    """
    Lazy singleton loader.
    FastAPI app startup or first request can call this safely.
    """
    global _model_instance

    if _model_instance is None:
        with _model_lock:
            if _model_instance is None:
                _model_instance = DINOv2ImageEncoder()

    return _model_instance


def encode_query_image(image_bytes: bytes) -> np.ndarray:
    """
    Convenience wrapper for inference.py

    Returns:
        np.ndarray of shape (768,), dtype=float32
    """
    model = get_model()
    return model.encode_image_bytes(image_bytes)
