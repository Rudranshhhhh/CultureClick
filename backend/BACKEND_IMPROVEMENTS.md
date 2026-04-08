# CultureClick Backend Improvements: A Deep-Dive Guide

This comprehensive guide outlines the strategic and architectural improvements necessary to evolve CultureClick from a hackathon MVP to a robust, production-ready platform.

---

## 1. LLM Improvements

### Enhanced Context Window (5-Layer Context System)
Currently, `buddy_service.py` is naive in its context passing. We propose a 5-layer context framework:
1. **User Persona Layer:** High-level details (City, age group, etc.).
2. **Taste Profile Layer:** Top liked/skipped categories and recent interactions.
3. **Environment Layer:** Time of day, OpenWeatherMap data, day of the week.
4. **Historical Session Layer:** A sliding window of the last 10 activities suggested and their outcomes (to prevent duplicate suggestions).
5. **Real-time Constraint Layer:** The user's immediate message (e.g., "I have 30 minutes and no money").

### Improved Prompt Engineering (Structured Templates)
Transition from hardcoded f-strings to a templating engine (like Jinja2) for prompts.
* **Why:** Easier to iterate on persona and tone.
* **Implementation:** Load prompt skeletons from dedicated `/prompts` files, allowing non-developers to tweak the "Buddy" persona without modifying `buddy_service.py`.

### Multi-Turn Conversations (Stateful Chat)
Currently Buddy forgets immediately.
* **Implementation:**
  * Create a MongoDB collection: `chat_history`.
  * Store entries as `{"session_id": UUID, "user_id": UUID, "role": "user"|"assistant", "content": "..."}`.
  * Retrieve the last N messages ordered by timestamp and append them to the LLM `messages` array payload.

### Smart Fallback Generation
When the Groq AI API rate-limits or fails, Buddy should not break character.
* **Implementation:** Use a local rule-based fallback decision tree that analyzes the user's top categories and pulls from a pre-curated JSON pool of 100 activities.

---

## 2. Recommendation Algorithm

### Diversity-Aware Ranking
Prevent the algorithm from showing the same category consecutively.
* **Concept:** Implement a local exhaustion penalty. If the user just swiped on "Outdoor / Physical", the next card's score for those categories incurs a -50% penalty multiplier.
* **Code Logic:** Track the `last_seen_category` on the backend and dynamically adjust the `taste_score` calculation before sorting the available hobbies array.

### Similarity-Based Recommendations
Move beyond simple category matching to conceptual similarity.
* **Concept:** If a user superlikes "Rock Climbing", they might also like "Bouldering" or "Obstacle Courses".
* **Implementation:**
  * Add a `tags` array to every hobby (e.g., `["adrenaline", "strength", "outdoor"]`).
  * Use Jaccard Object Similarity between the user's liked tags pool and the unswiped hobbies tags pool to calculate a highly localized relevancy score.

### Trending / Popular Hobbies
Incorporate global trends to break the user out of filter bubbles.
* **Implementation:** Run a nightly script that aggregates the most liked hobbies across ALL users in the past 48 hours. Give these a +10% "popular" boost in the ranking algorithm.

---

## 3. Backend Infrastructure

### Error Handling & Logging
Currently, crashes result in nasty 500 HTML responses (Flask default).
* **Fix:** Implement `@app.errorhandler(Exception)` to gracefully catch, log (using Python's `logging` module), and return a standardized JSON structure: `{"status": "error", "message": "...", "code": 500}`.

### Input Validation with Marshmallow
* **Why:** Blindly accepting `request.json` opens you up to injection and TypeErrors.
* **Action:** Define strong Marshmallow schemas.
```python
from marshmallow import Schema, fields, validate

class SwipeSchema(Schema):
    user_id = fields.Str(required=True)
    hobby_id = fields.Str(required=True)
    action = fields.Str(validate=validate.OneOf(["like", "skip", "superlike"]))
```

### Rate Limiting
* **Action:** Install `Flask-Limiter` to protect `/api/buddy/suggest` (preventing expensive LLM abuse) and `/api/auth/register` (preventing bot farm creation).
* Limit buddy to `10 per minute per IP`.

### Database Indexing
Speed up Mongo query times by indexing frequently accessed fields:
* `{"user_id": 1, "action": 1}` on `swipes` collection.
* `{"user_id": 1}` on `memories`.
* `{"category": 1}` and `{"tags": 1}` on `hobbies`.

### Response Caching
* **Action:** Use local memory caching (`cachetools` or `Flask-Caching`) for the 60 seed hobbies, as they rarely change but are queried endlessly when calculating the `available` list in `get_next_hobby`.

---

## 4. Implementation Roadmap (4-Week Phased Approach)

* **Week 1: Hardening & Sanity**
  * Implement unified Error Logging.
  * Deploy Marshmallow validation for `/api/*` POST endpoints.
  * Add basic Database Indexes.
* **Week 2: Advanced Recommendations**
  * Rework the Taste script in `hobbies.py` to include the Diversity-Aware penalty and Similarity tags logic.
* **Week 3: The Conversational Upgrades**
  * Integrate conversational state into `buddy_service.py` via the `chat_history` collection.
  * Extract prompts to external templated files.
* **Week 4: Optimization & Scale**
  * Deploy Response Caching for hobbies.
  * Integrate Rate Limiting on public/expensive endpoints.
  * Implement Cost Monitoring.

---

## 5. Monitoring & Observability
We need to know what breaks before users do.
* **Action:** Add a `/health` endpoint that pings MongoDB and OpenWeatherMap, returning a 200 OK only if dependencies are alive.
* **Action:** Instrument the `/api/buddy/suggest` route with a simple timer to log Groq latency to standard output.

---

## 6. Cost Optimization Strategies
* **Token Pruning:** Truncate Buddy Context History aggressively. LLMs charge by the token. Only send the *most relevant* past 5 messages rather than the entire session log.
* **Weather Caching Matrix:** Extend the TTL of OpenWeatherMap cache from 30 minutes to 60 minutes for free tiers, mapping requests to coordinates rather than exact city strings to improve cache hit rates.

---

## 7. Testing Checklist
- [ ] **Unit Tests:** `pytest` the `taste_score` mathematical logic in isolation.
- [ ] **Integration Tests:** Verify that submitting a `superlike` updates the user's `liked_categories` correctly.
- [ ] **Schema Tests:** Purposely submit invalid JSON to `/api/swipe` to assert that Marshmallow blocks it with a 400.
- [ ] **E2E Prompt Output Test:** Verify that Buddy's JSON output strictly conforms to the expected activity/reason/timing/tip payload.
