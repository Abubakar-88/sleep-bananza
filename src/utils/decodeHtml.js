// WooCommerce sends product names/titles with HTML entities encoded
// (e.g. a straight quote becomes &#8243;, an ampersand becomes &amp;).
// React escapes text by default, so without this they'd show up literally
// on the page instead of as the actual character.
export function decodeHtml(html) {
  if (!html) return "";
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
}