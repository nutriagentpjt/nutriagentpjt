from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI

from app.api.routes import recommend_router
from app.chatbot.router import router as chat_router
from app.core.database import engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    await engine.dispose()


app = FastAPI(title="Nutriagent Recommendation API", lifespan=lifespan)

app.include_router(recommend_router, prefix="/api/v1")
app.include_router(chat_router)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
