export const PLAYER_NAME_MAX_LENGTH = 20;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function normalizePlayerName(value) {
  return value.trim().slice(0, PLAYER_NAME_MAX_LENGTH);
}

export function validatePlayerName(value) {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return 'Display name is required.';
  }

  if (normalizedValue.length > PLAYER_NAME_MAX_LENGTH) {
    return `Display name must be ${PLAYER_NAME_MAX_LENGTH} characters or fewer.`;
  }

  return '';
}

export function normalizeGameId(value) {
  return value.trim();
}

export function validateGameId(value) {
  const normalizedValue = normalizeGameId(value);

  if (!normalizedValue) {
    return 'Game ID is required.';
  }

  if (!UUID_PATTERN.test(normalizedValue)) {
    return 'Enter a valid game ID.';
  }

  return '';
}
