// return a NEW object with ONLY the properties of "a" that are undefined in "b".
export default function pickDefaults(a, b) {
  if (!b) return a;

  const result = {};
  for (const prop of Object.keys(a)) {
    if (typeof b[prop] === 'undefined') {
      result[prop] = a[prop];
    }
  }
  return result;
}
