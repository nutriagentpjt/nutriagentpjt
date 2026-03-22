"""add chat_sessions and chat_messages tables

Revision ID: 1f4c8072c12f
Revises:
Create Date: 2026-03-22 21:27:15.343419

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '1f4c8072c12f'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('chat_sessions',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('guest_id', sa.String(), nullable=False),
    sa.Column('persona', sa.String(), nullable=False, comment='페르소나 식별자'),
    sa.Column('title', sa.String(), nullable=True, comment='대화 요약 제목'),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_chat_sessions_guest_id'), 'chat_sessions', ['guest_id'], unique=False)
    op.create_table('chat_messages',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('session_id', sa.Integer(), nullable=False),
    sa.Column('role', sa.String(), nullable=False, comment='user | assistant'),
    sa.Column('content', sa.Text(), nullable=True),
    sa.Column('tool_calls', postgresql.JSONB(astext_type=sa.Text()), nullable=True, comment='tool_use 요청 내역'),
    sa.Column('tool_results', postgresql.JSONB(astext_type=sa.Text()), nullable=True, comment='tool 실행 결과'),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['session_id'], ['chat_sessions.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_chat_messages_session_id'), 'chat_messages', ['session_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_chat_messages_session_id'), table_name='chat_messages')
    op.drop_table('chat_messages')
    op.drop_index(op.f('ix_chat_sessions_guest_id'), table_name='chat_sessions')
    op.drop_table('chat_sessions')
