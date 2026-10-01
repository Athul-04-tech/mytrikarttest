/**
 * Recursively gather all category IDs for a given node and its descendants (children, grandchildren, etc.)
 * @param {Object} node - Category object with { id, slug, children, ... }
 * @returns {Array<number|string>} Array of category IDs contained in the subtree
 */
export function getDescendantCategoryIds(node) {
  if (!node) return [];
  let ids = [node.id];
  if (Array.isArray(node.children)) {
    node.children.forEach((child) => {
      ids = ids.concat(getDescendantCategoryIds(child));
    });
  }
  return ids;
}

/**
 * Recursively gather all category IDs, slugs, and names for a given node and its descendants
 * @param {Object} node - Category object with { id, slug, name, children, ... }
 * @returns {Object} { ids: Set<string>, slugs: Set<string>, names: Set<string> }
 */
export function getDescendantCategoryKeys(node) {
  const keys = {
    ids: new Set(),
    slugs: new Set(),
    names: new Set()
  };

  function traverse(n) {
    if (!n) return;
    if (n.id != null) keys.ids.add(String(n.id));
    if (n.slug) keys.slugs.add(String(n.slug).toLowerCase());
    if (n.name) keys.names.add(String(n.name).toLowerCase());

    if (Array.isArray(n.children)) {
      n.children.forEach(traverse);
    }
  }

  traverse(node);
  return keys;
}

/**
 * Find a category node in a tree by ID, slug, or name
 * @param {Array} tree - Array of category objects
 * @param {string|number} target - Category identifier to match against
 * @returns {Object|null} Matching category node or null
 */
export function findCategoryNode(tree, target) {
  if (!Array.isArray(tree) || target == null || target === '') return null;
  const targetStr = String(target).toLowerCase();

  for (const node of tree) {
    if (
      String(node.id) === targetStr ||
      (node.slug && String(node.slug).toLowerCase() === targetStr) ||
      (node.name && String(node.name).toLowerCase() === targetStr)
    ) {
      return node;
    }
    if (Array.isArray(node.children) && node.children.length > 0) {
      const match = findCategoryNode(node.children, target);
      if (match) return match;
    }
  }

  return null;
}
