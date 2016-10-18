export function elMap(callback) {
  return el => el.map(currEl => callback([currEl]));
}
