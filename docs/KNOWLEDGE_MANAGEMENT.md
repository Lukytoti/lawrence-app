# Knowledge Base, Collections & SOP Management (Module 21)

## 1. Domain Overview
Module 21 includes an enterprise Knowledge Base designed for Standard Operating Procedures (SOPs), leadership playbooks, training materials, and organizational FAQs.

## 2. Entity Hierarchy
- **KnowledgeCollection**: Categorical container for related articles (e.g. "Sales SOPs", "Leadership Playbooks", "Compliance Standards").
- **KnowledgeEntry**: Article entity with markdown content, sequential versions, author attribution, and publication workflow states (`DRAFT`, `UNDER_REVIEW`, `PUBLISHED`, `ARCHIVED`).
- **KnowledgeChunk**: Sub-article chunking entity optimized for semantic search and Retrieval-Augmented Generation (RAG) by the Prompt 15 AI Executive Co-Pilot.

## 3. Publication Workflow
1. Author creates draft article (`createKnowledgeEntry()`).
2. Author or reviewer submits for review (`submitKnowledgeForReview()`).
3. Authorized editor publishes article (`publishKnowledgeEntry()`).
4. System segments content into indexed `KnowledgeChunk` records with token length approximations and SHA-256 integrity hashes.
5. Emits `KnowledgePublished` event for system-wide indexing.
