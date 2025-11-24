# Detailed Implementation Plan for Coding Agent

## Context & Scope
**Target Tech Stack:** [e.g., Python/Django, Node/TypeScript, Go, React, etc.]
**Feature to Implement:**
## Objective
From the attached information, create a comprehensive, step-by-step plan for a coding agent to implement the requested feature.
The agent must **not** write the complete code for each file but instead list all required files/directories and clearly explain the responsibility of each.

## General Guidelines
- **Strictly follow the target tech stack** defined in the project context.
- **Respect existing project conventions:** Analyze current code style (indentation, quotes), naming conventions (camelCase vs snake_case), folder structure, and architectural patterns before creating new files.
- **Separation of Concerns:** Split logic into appropriate layers (Controllers, Services, Utils, Components, Hooks) to improve readability and maintainability.
- **Resilient Error Handling:** Handle failure states gracefully (timeouts, network issues, invalid payloads, auth errors). Use language-appropriate error handling (try/catch, Result types, panic/recover, etc.).
- **Testing:** Write meaningful tests using the project's established testing framework.
- **Ambiguity Resolution:** Prefer explicit over implicit. If a requirement is ambiguous, list assumptions or request clarification in the plan.

## Required Files & Responsibilities
(List every file or new directory the agent needs to create/modify)

| File/Path | Type | Purpose & Key Responsibilities |
|-----------|------|--------------------------------|
| ...       | ...  | ...                            |

*(Agent: Fill this table with all necessary files. Examples: Controllers/Handlers, Models/Schemas, Services/UseCases, DTOs/Types, Components/Views, Routes, Config, Migrations, Test Files)*

## Step-by-Step Implementation Plan
1. [Step 1: Setup/Configuration]
2. [Step 2: Core Logic Implementation]
   - Sub-task A
   - Sub-task B
3. [Step 3: Interface/API Layer]
4. ...

## Architecture & Business Logic Recommendations
*(If the feature benefits from separation of logic)*
- **Module/Service 1:** Description + Public Interface/Methods
- **Module/Service 2:** ...
- **State Management/Database:** (If applicable, describe schema changes or state updates)

## Error Handling Requirements
- Wrap all external/volatile calls in appropriate exception handling blocks.
- Normalize error responses (e.g., return standard HTTP status codes or consistent error objects).
- Ensure proper logging of stack traces or error details.
- Implement retry logic for network requests if applicable.

## Testing Requirements
- **Test Framework:** [e.g., Jest, Pytest, RSpec, JUnit, Go Test]
- **Files to Create/Modify:**
  - Unit tests for business logic/utilities.
  - Integration/Request tests for API endpoints or Components.
- **Mocking:** Stub external dependencies/APIs (using mocks, spies, or fixtures).
- **Coverage Goals:** Verify happy paths, error handling, and edge cases (e.g., null inputs, empty lists).

## Additional Tips for the Agent
- Run the project's linter/formatter (e.g., ESLint, Black, Prettier, Checkstyle) after implementation.
- Review existing similar features in the codebase and mirror their structure.
- Keep functions/methods small and focused (Single Responsibility Principle).
- Validate inputs early (sanitize data, check types).

**Proceed only with the files and logic described above. Do not add unrequested functionality.**