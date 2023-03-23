/**
 * Flatten a multidimensional object
 *
 * For example:
 *   flattenObject{ a: 1, b: { c: 2 } }
 * Returns:
 *   { a: 1, c: 2}
 */

// https://stackoverflow.com/questions/33036487/one-liner-to-flatten-nested-object

export const flattenObject = (obj) => {
  const flattened = {};

  Object.keys(obj).forEach((key) => {
    const value = obj[key];

    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      Object.assign(flattened, flattenObject(value));
    } else {
      flattened[key] = value;
    }
  });

  return flattened;
};

// apply preset:category:key:values to global:category:key:values

export const mergeCategoryKeyValues = (obj, objToMerge) => {
  for (const categoryKey in objToMerge) {
    const category = objToMerge[categoryKey];
    for (const key in category) {
      obj[categoryKey][key] = category[key];
    }
  }
};
