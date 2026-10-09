/**
 * Centralized Role-Based Access Control (RBAC) Route Registry
 * SINGLE SOURCE OF TRUTH for protected route permission definitions.
 * Both ProtectedRoute components and post-login redirection resolvers consume this table.
 */
export const PROTECTED_ROUTE_REGISTRY = [
  // Admin Operations Center (Admin only)
  {
    id: 'admin_routes',
    pattern: /^\/admin(\/.*)?$/i,
    allowedRoles: ['admin'],
  },

  // Public Seller Registration / Onboarding overrides (must precede /seller/*)
  {
    id: 'seller_register_public',
    pattern: /^\/seller\/(register|login)$/i,
    allowedRoles: null, // null = public / accessible by all roles
  },
  {
    id: 'seller_register_legacy_aliases',
    pattern: /^\/(seller-register|become-a-seller)$/i,
    allowedRoles: null,
  },

  // Seller Hub & Vendor Operations (Vendor, Seller)
  {
    id: 'seller_hub_routes',
    pattern: /^\/seller(\/.*)?$/i,
    allowedRoles: ['vendor', 'seller'],
  },
  {
    id: 'seller_dashboard_alias',
    pattern: /^\/seller-dashboard$/i,
    allowedRoles: ['vendor', 'seller'],
  },
];

/**
 * Retrieves the allowed roles array for a given pathname from PROTECTED_ROUTE_REGISTRY.
 *
 * @param {string} targetPath - Pathname (e.g. '/seller/dashboard', '/admin')
 * @returns {Array<string>|null} Allowed roles array or null if public
 */
export function getAllowedRolesForRoute(targetPath) {
  if (!targetPath || typeof targetPath !== 'string') return null;
  const path = targetPath.split('?')[0].split('#')[0].trim();
  const matchingRule = PROTECTED_ROUTE_REGISTRY.find((rule) => rule.pattern.test(path));
  return matchingRule ? matchingRule.allowedRoles : null;
}

/**
 * Helper lookup to get full registry rule definition for a target pathname.
 *
 * @param {string} targetPath - Pathname (e.g. '/admin')
 * @returns {object|null} Registry rule object or null
 */
export function getRouteRule(targetPath) {
  if (!targetPath || typeof targetPath !== 'string') return null;
  const path = targetPath.split('?')[0].split('#')[0].trim();
  return PROTECTED_ROUTE_REGISTRY.find((rule) => rule.pattern.test(path)) || null;
}

/**
 * Centralized role-based home route resolver.
 * Single source of truth for "where does this role belong."
 * 
 * @param {string} role - The user's role (e.g. 'customer', 'vendor', 'seller', 'admin')
 * @returns {string} The target home route path for the role
 */
export function getHomeRouteForRole(role) {
  const normalizedRole = String(role || 'customer').trim().toLowerCase();
  
  if (normalizedRole === 'vendor' || normalizedRole === 'seller') {
    return '/seller/dashboard';
  }
  
  if (normalizedRole === 'admin') {
    return '/admin';
  }
  
  return '/';
}

/**
 * Checks if a given target path is allowed for a user's role.
 * Derived directly from PROTECTED_ROUTE_REGISTRY (Single Source of Truth).
 *
 * @param {string} targetPath - The path (e.g., location.state?.from)
 * @param {string} role - The user's role (e.g., 'customer', 'vendor', 'admin')
 * @returns {boolean} True if the role is allowed on targetPath
 */
export function isRouteAllowedForRole(targetPath, role) {
  if (!targetPath || typeof targetPath !== 'string') return false;
  
  const path = targetPath.split('?')[0].split('#')[0].trim();
  const normalizedRole = String(role || 'customer').trim().toLowerCase();

  // Match against single source of truth registry
  const matchingRule = PROTECTED_ROUTE_REGISTRY.find((rule) => rule.pattern.test(path));

  // If no protected rule matches, or matching rule specifies allowedRoles = null, it is public
  if (!matchingRule || matchingRule.allowedRoles === null) {
    return true;
  }

  // Check if user's role is permitted by the matching rule
  const normalizedAllowed = matchingRule.allowedRoles.map((r) => r.toLowerCase());
  return normalizedAllowed.some((allowed) => {
    if (allowed === normalizedRole) return true;
    if (
      (allowed === 'vendor' || allowed === 'seller') &&
      (normalizedRole === 'vendor' || normalizedRole === 'seller')
    ) {
      return true;
    }
    return false;
  });
}

/**
 * Resolves the final destination path after successful login.
 * Prefers targetFrom if allowed for role; otherwise falls back to role's default home route.
 *
 * @param {string|object} targetFrom - location.state?.from (string or object)
 * @param {string} role - The user's role
 * @returns {string} The safe target route
 */
export function resolvePostLoginRedirect(targetFrom, role) {
  const fromPath = typeof targetFrom === 'object' && targetFrom !== null ? targetFrom.pathname : targetFrom;
  
  if (fromPath && isRouteAllowedForRole(fromPath, role)) {
    return fromPath;
  }
  
  return getHomeRouteForRole(role);
}
