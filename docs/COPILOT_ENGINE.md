# AI Executive Co-Pilot & RAG Context Engine

## RAG Pipeline Flow
1. **User Prompt Submission**: User sends natural language prompt via `/ai/chat` or Server Action `submitAiPromptAction`.
2. **Sanitization**: Input filtered through `sanitizeAiInput()` to mask sensitive credentials.
3. **Quota Verification**: `verifyAndConsumeQuota()` verifies daily prompt limit and tracks token consumption.
4. **Domain Fact Gathering**: Gathers real-time facts from `User`, `NetworkMember`, `DigitalClient`, `DigitalProject`, and `CrmLead`.
5. **LLM Response Generation**: Synthesizes structured markdown response with domain citation links.
6. **Audit & Event Bus**: Logs audit record and publishes `AiResponseGenerated` on `EventBus`.
