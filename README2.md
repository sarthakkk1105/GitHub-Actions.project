# InterviewIQ.AI — Detailed Design Notes (Payment & Interview Step 2)

This document expands the existing README with focused, developer-facing explanations of the payment flow and the Step 2 (voice interview) logic.

**Files referenced**
- **Razorpay service:** [server/services/Razorpay.service.js](server/services/Razorpay.service.js#L1)
- **Payment controller:** [server/controller/payment.controller.js](server/controller/payment.controller.js#L1)
- **Payment routes:** [server/route/payment.route.js](server/route/payment.route.js#L1)
- **Payment model:** [server/models/payment.model.js](server/models/payment.model.js#L1)
- **Interview controller:** [server/controller/interview.controller.js](server/controller/interview.controller.js#L1)
- **Interview routes:** [server/route/interview.route.js](server/route/interview.route.js#L1)
- **Step 1 (setup):** [client/src/components/Step1setup.jsx](client/src/components/Step1setup.jsx#L1)
- **Step 2 (voice interview):** [client/src/components/Step2interview.jsx](client/src/components/Step2interview.jsx#L1)
- **Interview page orchestration:** [client/src/pages/InterviewPage.jsx](client/src/pages/InterviewPage.jsx#L1)
- **Redux user state:** [client/src/redux/userSlice.js](client/src/redux/userSlice.js#L1)

**How to use this doc**
- Use the file links above to jump to implementation specifics.
- This file explains the end-to-end flow, important validations, and implementation notes useful for debugging and extending payments and the voice interview.

---

**1) Payment flow — overview**

- **Purpose:** Sell credit packs to users; record purchases; increment user `credits` after successful payment.
- **High-level steps:**
  - Client requests an order via POST `/api/payment/order` (authenticated).
  - Server calls Razorpay SDK to create an order and saves a `Payment` document (status "created").
  - Client completes payment in the Razorpay checkout and sends the payment callback to server POST `/api/payment/verify` (authenticated).
  - Server verifies the Razorpay signature (HMAC SHA256), updates the `Payment` document status to "paid", stores the Razorpay payment id, and increments the user's `credits`.

**Files and responsibilities**
- [server/services/Razorpay.service.js](server/services/Razorpay.service.js#L1): exports a configured `razorpay` instance constructed from `process.env.RAZORPAY_KEY_ID` and `process.env.RAZORPAY_SECRET`.
- [server/controller/payment.controller.js](server/controller/payment.controller.js#L1): two exported handlers:
  - `createOrder(req, res)`:
    - Validates `amount` and `credits` in the request body.
    - Calls `razorpay.orders.create` with `amount * 100` (Razorpay expects paise) and currency `INR`.
    - Persists a `Payment` document with fields: `userId`, `planId`, `amount`, `credits`, `razorpayOrderId`, `status: 'created'`.
    - Returns the Razorpay `order` object to the client.
  - `verifyPayment(req, res)`:
    - Receives `razorpay_order_id`, `razorpay_payment_id`, and `razorpay_signature` from the client.
    - Recomputes the expected signature using `crypto.createHmac('sha256', RAZORPAY_SECRET).update(orderId + '|' + paymentId).digest('hex')`.
    - If signatures mismatch -> returns 400.
    - Finds the `Payment` document by `razorpayOrderId`.
    - If not found -> 404. If already `paid`, returns message "Already processed".
    - Marks `status = 'paid'`, stores `razorpayPaymentId`, saves document.
    - Increments `User.credits` by `payment.credits` via `findByIdAndUpdate` with `$inc` and returns updated user object.
- [server/route/payment.route.js](server/route/payment.route.js#L1): registers `POST /order` and `POST /verify` protected by `isAuth` middleware.
- [server/models/payment.model.js](server/models/payment.model.js#L1): `Payment` schema fields: `userId`, `planId`, `amount`, `credits`, `razorpayOrderId`, `razorpayPaymentId`, `status` (enum `created|paid|failed`).

**Important implementation notes & security**
- Amount handling: server expects `amount` in rupees and multiplies by 100 before sending to Razorpay (paise). Ensure the client uses the same unit.
- Signature verification: server uses the secret to calculate HMAC SHA256 and compares to Razorpay's signature. This must be done server-side and the secret must never be exposed to the client.
- Idempotency: The controller guards against double-processing by returning early if the `Payment` status is already `paid`.
- Failure cases: If verification fails, controller returns 400; if DB write fails, returns 500. Consider adding retry/monitoring and logging for production.
- Webhooks: Current implementation uses the client to POST verification. You may optionally add a server webhook endpoint (Razorpay webhooks) for stronger guarantees, but signature verification and order lookup must remain.

---

**2) Interview Step 2 (voice interview) — overview**

- **Purpose:** Conduct the voice-driven interview: speak questions, record the candidate answer (speech recognition or typed), send to the server for AI evaluation, collect feedback and per-question scoring, and finish the interview with aggregated metrics.

**How the flow starts (Step 1 -> Step 2)**
- [client/src/components/Step1setup.jsx](client/src/components/Step1setup.jsx#L1) constructs the interview setup and calls POST `/api/interview/generate-questions` with `{ role, experience, mode, resumeText, projects, skills }`.
- The server [server/controller/interview.controller.js](server/controller/interview.controller.js#L1) `generateQuestion`:
  - Validates the request and user credits (requires at least 50 credits).
  - Builds a prompt and calls the AI service to generate exactly five interview questions.
  - Deducts 50 credits from the user and saves an `Interview` document with `questions[]` containing question text, difficulty, and per-question `timeLimit`.
  - Returns `interviewId`, `creditsLeft`, `userName`, and `questions` to the client.

**Step 2 client: `Step2interview` responsibilities**
- [client/src/components/Step2interview.jsx](client/src/components/Step2interview.jsx#L1): main points:
  - Receives `interviewData` from Step 1: `{ interviewId, questions, userName }`.
  - Text-to-speech (TTS): uses `window.speechSynthesis` and `SpeechSynthesisUtterance` to speak prompts and questions.
  - Voice selection: picks a local browser voice (Zira/Samantha/David) when available and sets speaking rate/pitch.
  - Microphone capture: uses `webkitSpeechRecognition` to continuously capture speech and append recognized text to the `answer` state.
  - Timer management: per-question `timeLimit` is displayed and counted down. When time expires, the client auto-submits the current answer.
  - Submit flow: `submitAnswer()` POSTs to `/api/interview/submit-answer` with `{ interviewId, questionIndex, answer, timetaken }`.
    - On success the server returns human-like feedback which the client speaks out and shows visually.
  - Navigation: `handleNext()` moves to the next question (or calls `/api/interview/finish` to complete the interview), resets timers and saved state.
  - Persistence: `InterviewPage.jsx` and `Step2interview` use `localStorage` keys (`interviewData`, `interviewStep`, `interviewProgress`) to survive page reloads.
  - Exit: `handleExitInterview()` performs cleanup, stops TTS and recognition, and removes saved progress.

**Server-side evaluation & scoring (submitAnswer)**
- `submitAnswer` in [server/controller/interview.controller.js](server/controller/interview.controller.js#L1):
  - Accepts `interviewId`, `questionIndex`, `answer`, `timetaken`.
  - Performs quick validation (no answer or time exceeded -> score=0 with predefined feedback).
  - Otherwise, sends a system+user prompt to the AI evaluation service to compute three metrics (confidence, communication, correctness) and a `finalScore` (average) and short human feedback.
  - Saves `answer`, individual scores, `feedback` onto the `Interview.questions[questionIndex]` and persists the interview document.

**Finishing the interview**
- `finishInterview` in controller:
  - Aggregates per-question scores and computes averages and final total.
  - Marks interview status completed and returns a report object with `finalScore`, `confidence`, `communication`, `correctness`, and `questionWiseScore` array with feedback.
  - The client `Step2interview` receives this report in `onFinish()` and navigates/display Step 3 report UI.

**UX/edge-case notes**
- Speech recognition: code checks for `webkitSpeechRecognition` and gracefully degrades if not available — consider adding a fallback UI to type answers if the browser doesn't support it.
- Auto-submission: when timer hits 0, client auto-submits (if not already submitted) — ensure network errors are surfaced to the user.
- Credits: `generateQuestion` deducts 50 credits server-side. The client also updates the local Redux `user.userData.credits` from the server response to keep UI consistent.
- Local voice selection and cross-browser behavior: `speechSynthesis.getVoices()` may return asynchronously; the component attaches `onvoiceschanged` to populate voices.

---

**3) Quick extension ideas**
- Add server-side Razorpay webhooks to reconcile orders and handle out-of-band events.
- Add payment receipts emails and transactional logs for audit.
- Persist TTS/recording audio or offer a manual audio upload for better evaluations.
- Add a retry queue for AI evaluation when the AI service is rate-limited.

---

If you want, I can also:
- Add inline code comments in the controller files to document the HMAC verification and DB updates.
- Add a small sequence diagram or Mermaid flow to visualize the payment verification or Step 2 lifecycle.

End of README2
