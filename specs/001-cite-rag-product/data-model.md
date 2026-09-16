# Data Model: cite-rag

## users

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK | |
| email | text unique | |
| password_hash | text | bcrypt |
| created_at | timestamptz | |

## documents

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK | |
| owner_user_id | uuid nullable FK | null = shared corpus |
| title | text | |
| source_type | text | `corpus` \| `upload` |
| source_uri | text unique | idempotent ingest key |
| mime | text | `text/plain` \| `application/pdf` |
| byte_size | int | |
| status | text | `pending` \| `ready` \| `failed` |
| created_at | timestamptz | |

## chunks

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK | |
| document_id | uuid FK | |
| chunk_index | int | |
| page_or_section | text nullable | |
| content | text | |
| token_count | int | |
| embedding | vector(1536) | HNSW cosine index |

## conversations

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK | |
| user_id | uuid FK | |
| created_at | timestamptz | |

## messages

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK | |
| conversation_id | uuid FK | |
| role | text | `user` \| `assistant` \| `system` |
| content | text | |
| refused | boolean | default false |
| created_at | timestamptz | |

## message_citations

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK | |
| message_id | uuid FK | |
| chunk_id | uuid FK | |
| rank | int | |
| score | float | cosine distance or similarity |

## Indexes

- `CREATE EXTENSION IF NOT EXISTS vector;`
- HNSW on `chunks.embedding` with `vector_cosine_ops`
- Unique on `documents.source_uri`
- Unique on `users.email`
