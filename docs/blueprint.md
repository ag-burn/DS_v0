
## Core Features:

- Session Initiation: Create a session with user ID, document types, and a callback URL to receive verification results. Generates pre-signed upload URLs for necessary media files.
- Media Verification: Verifies user-submitted media, running checks to confirm integrity. Uses OCR to validate the full name, DoB, and ID number on the image of a photo ID, verifying the formatting with regex. InsightFace extracts and aligns the faces, computing embeddings for both and calculating the cosine similarity. Active liveness detection requests a sequence of actions (blinking, head turn, etc.) to ensure user is real, and passive liveness analyzes highlights, moire artifacts, and the user's eyes.
- Risk Scoring: Aggregates individual signal scores (face match, liveness, A/V sync, etc.) based on configured weights, computes a final risk score, and determines verification status (verified, review, or rejected). Includes AI-powered explanations for low-scoring signals.
- Continuous Monitoring: Ingests authentication events (user ID, IP, geo, device, etc.) to detect anomalies like impossible travel or new devices. Employs rule-based checks and placeholder hooks for more sophisticated anomaly detection algorithms (PyOD/River).
- Policy Enforcement: Enforces security policies using Open Policy Agent (OPA) to decide whether to allow, step-up (request additional verification), or deny access based on risk scores and anomaly detection results. This component acts as a 'tool' in a larger workflow, leveraging continuous identity assurance results to enhance security measures dynamically.
- Frontend Widget: An embeddable React widget for initiating the VKYC process, capturing user media, displaying verification results, and triggering step-up liveness challenges when required by the policy engine.
- Real-time notifications: Sends the data as payload, from the verify API to the frontend via a webhook call

