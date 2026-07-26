export function readStorageValue(key, fallback = '') {
  if (typeof window === 'undefined') {
    return fallback;
  }

  return window.localStorage.getItem(key) ?? fallback;
}

export function writeStorageValue(key, value) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(key, value);
}

export function readStorageJson(key, fallback = {}) {
  const value = readStorageValue(key, '');

  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function writeStorageJson(key, value) {
  writeStorageValue(key, JSON.stringify(value));
}
