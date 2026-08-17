# Entity & Field Mapping Transformation Engine

## 1. Overview
The field mapping engine transforms incoming external payloads into normalized domain input schemas without executing unsafe dynamic code.

## 2. Transformation Capabilities
- **Field Renaming**: Maps source property paths (e.g. `first_name` or `customer.name`) to target schema fields (`firstName`).
- **Value Transformers**: Supports `UPPERCASE`, `LOWERCASE`, `TRIM`, `TO_NUMBER`, `TO_BOOLEAN`.
- **Default Fallbacks**: Applies default values when source fields are missing or null.
- **Nested Path Extraction**: Evaluates dot-separated paths (`contact.address.city`).
