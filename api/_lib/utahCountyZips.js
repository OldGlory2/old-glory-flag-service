const UTAH_COUNTY_ZIPS = new Set([
  "84003", "84004", "84005", "84013", "84042", "84043", "84045", "84057",
  "84058", "84059", "84062", "84097", "84601", "84602", "84604", "84606",
  "84626", "84628", "84633", "84651", "84653", "84655", "84660", "84663",
  "84664"
]);

function isUtahCountyZip(zip) {
  return UTAH_COUNTY_ZIPS.has(String(zip || "").trim());
}

module.exports = {
  UTAH_COUNTY_ZIPS,
  isUtahCountyZip
};
