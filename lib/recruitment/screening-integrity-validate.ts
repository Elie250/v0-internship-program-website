/**
 * Talent screening integrity validation — shared engine.
 */
export {
  INTEGRITY_EVENT_MAX_PAYLOAD_BYTES,
  INTEGRITY_EVENT_SESSION_WINDOW_MS,
  INTEGRITY_EVENT_SESSION_LIMIT,
  INTEGRITY_EVENT_BURST_WINDOW_MS,
  INTEGRITY_EVENT_BURST_LIMIT,
  rejectClientControlledIntegrityFields,
  sanitizePayload,
  sanitizeMetadata,
  normalizeEventType,
  normalizeClientEventAt,
  parseUuid,
  validateIntegrityEventInput,
  checkEventRateLimit,
  candidateMayReadIntegrityBand,
  studentMayReadIntegrityBand,
  integrityApiMayModifyTechnicalScore,
  clientMaySetIntegrityBand,
  integrityEventsAreImmutable,
  type SanitizedIntegrityEvent,
  type EventRateSample,
} from '@/lib/integrity/validate'
