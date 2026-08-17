# Document & Knowledge Integration with AI Engine (Module 21 & Module 15)

## 1. Architectural Boundary
- **Module 15 Authority**: Prompt 15 remains the sole authority for AI LLM reasoning, prompt engineering, agent conversations, and coaching intelligence.
- **Module 21 Authority**: Prompt 21 is the authoritative provider of indexed knowledge chunks, document metadata, and access-controlled retrieval endpoints.

## 2. Retrieval-Augmented Generation (RAG) Endpoints
Module 21 exposes two purpose-built retrieval functions for AI integration in `src/modules/documents/knowledge.ts`:

### 2.1 `searchAuthorizedKnowledge(query, actorUserId)`
Returns published articles matching user queries that the requesting actor is authorized to view based on visibility and organizational permissions.

### 2.2 `getAuthorizedKnowledgeChunks(knowledgeEntryId, actorUserId)`
Returns segmented `KnowledgeChunk` records with token length estimates and sequential chunk index positions for dynamic inclusion into AI prompt context windows.
