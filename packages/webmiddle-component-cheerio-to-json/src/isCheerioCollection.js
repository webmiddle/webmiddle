export default target =>
  typeof target === "object" &&
  target !== null &&
  target.cheerio &&
  "length" in target;
