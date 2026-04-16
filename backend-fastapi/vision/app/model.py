from __future__ import annotations

from dataclasses import dataclass
from io import BytesIO
from threading import Lock
from typing import Any

import numpy as np
from PIL import Image, UnidentifiedImageError

import torch
import torch.nn.functional as F
from transformers import AutoImageProcessor, AutoModel, CLIPProcessor, CLIPVisionModelWithProjection

from app.config import settings


class ModelError(RuntimeError):
    """Raised when model loading or image encoding fails."""


@dataclass(frozen=True)
class ModelMetadata:
    model_name: str
    embedding_dim: int
    device: str
    l2_normalize: bool


class HybridImageEncoder:
    """
    Service-time DINOv3 + CLIP encoder for query images.
    FastAPI 서버에서 실시간으로 들어오는 이미지 1장을 1536차원 벡터로 변환.
    """

    def __init__(
        self,
        model_name: str = "hybrid_dinov3_clip",
        device: str = settings.MODEL_DEVICE,
        weight_dino: float = 0.7,
        weight_clip: float = 0.3,
        l2_normalize: bool = True,
        dino_path: str = "facebook/dinov3-vitb16-pretrain-lvd1689m",
        clip_path: str = "openai/clip-vit-base-patch32",
    ) -> None:
        self.model_name = model_name
        self.requested_device = device
        self.weight_dino = weight_dino
        self.weight_clip = weight_clip
        self.l2_normalize = l2_normalize
        self.dino_path = dino_path
        self.clip_path = clip_path

        self.device = self._resolve_device(device)
        self._load_hybrid_models()

    def _resolve_device(self, device: str) -> torch.device:
        if device == "cuda" and torch.cuda.is_available():
            return torch.device("cuda")
        if device == "mps" and torch.backends.mps.is_available():
            return torch.device("mps")
        return torch.device("cpu")

    def _load_hybrid_models(self) -> None:
        try:
            print(f"🚀 Hybrid 모델 적재 중... (Device: {self.device})")
            # CLIP 로드
            self.clip_processor = CLIPProcessor.from_pretrained(self.clip_path)
            self.clip_model = CLIPVisionModelWithProjection.from_pretrained(self.clip_path).to(self.device)
            self.clip_model.eval()

            # DINOv3 로드
            self.dino_processor = AutoImageProcessor.from_pretrained(self.dino_path)
            self.dino_model = AutoModel.from_pretrained(self.dino_path).to(self.device)
            self.dino_model.eval()
            print("✅ Hybrid 모델 적재 완료!")
        except Exception as e:
            raise ModelError(f"Failed to load hybrid models: {e}") from e

    def _postprocess_embeddings(self, embeddings: np.ndarray) -> np.ndarray:
        embeddings = embeddings.astype(np.float32)

        if embeddings.ndim != 2:
            raise ModelError(f"Embeddings must be 2D, got shape={embeddings.shape}")

        if self.l2_normalize:
            norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
            norms = np.maximum(norms, 1e-12)
            embeddings = embeddings / norms

        if not np.isfinite(embeddings).all():
            raise ModelError("Embeddings contain NaN or inf values.")

        return embeddings

    @torch.no_grad()
    def encode_pil_image(self, image: Image.Image) -> np.ndarray:
        """
        Returns:
            np.ndarray with shape (1536,), dtype=float32
        """
        try:
            img_rgb = image.convert("RGB")
            
            # DINOv3 추출
            inputs_dino = self.dino_processor(images=img_rgb, return_tensors="pt").to(self.device)
            outputs_dino = self.dino_model(**inputs_dino)
            vec_dino = F.normalize(outputs_dino.last_hidden_state[:, 0, :], p=2, dim=1)

            # CLIP 추출
            inputs_clip = self.clip_processor(images=img_rgb, return_tensors="pt").to(self.device)
            outputs_clip = self.clip_model(**inputs_clip)
            vec_clip = F.normalize(outputs_clip.image_embeds, p=2, dim=1)

            # 결합
            hybrid_vec = torch.cat([self.weight_dino * vec_dino, self.weight_clip * vec_clip], dim=1)
            embeddings = hybrid_vec.cpu().numpy()
            
            embeddings = self._postprocess_embeddings(embeddings)
            
        except Exception as e:
            raise ModelError(f"Model forward failed: {e}") from e

        if embeddings.shape[0] != 1:
            raise ModelError(f"Expected batch output of size 1, got embeddings shape={embeddings.shape}")

        # 🔥 차원 검증 (app/config.py 에 EMBEDDING_DIM 이 1536 으로 설정되어 있어야 함)
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
            l2_normalize=self.l2_normalize,
        )


_model_instance: HybridImageEncoder | None = None
_model_lock = Lock()


def get_model() -> HybridImageEncoder:
    global _model_instance

    if _model_instance is None:
        with _model_lock:
            if _model_instance is None:
                _model_instance = HybridImageEncoder()

    return _model_instance


def encode_query_image(image_bytes: bytes) -> np.ndarray:
    """
    Returns:
        np.ndarray of shape (1536,), dtype=float32
    """
    model = get_model()
    return model.encode_image_bytes(image_bytes)