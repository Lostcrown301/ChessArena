// Small class name helper used by foundational UI components.
export function classNames(...values) {
  return values.filter(Boolean).join(' ');
}
