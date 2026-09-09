import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import UnauthorizedPage from '../../pages/UnauthorizedPage';
import { Loader2, ShieldCheck } from 'lucide-react';
import { isRouteAllowedForRole, getAllowedRolesForRoute } from '../../utils/authRouting';

function ProtectedRouteLoadingState() {
  return (
    <div 
      data-testid="protected-route-loader"
      className="min-h-screen bg-[#FFFFFF] flex flex-col items-center justify-center p-4 font-sans selection:bg-[#FF811A]/30 selection:text-[#FA661C]"
    >
      <div className="flex flex-col items-center space-y-4 p-8 rounded-3xl bg-white border border-[#EAE3DC] shadow-lg animate-reveal">
        <div className="w-12 h-12 rounded-2xl bg-[#FFF3EC] text-[#FA661C] flex items-center justify-center relative">
          <ShieldCheck className="w-6 h-6 text-[#FA661C]" />
          <Loader2 className="w-10 h-10 text-[#FF811A] animate-spin absolute inset-0 m-auto" />
        </div>
        <div className="text-center space-y-1">
          <h3 className="font-['Outfit'] font-bold text-base text-[#FA661C]">
            Verifying Authorization...
          </h3>
          <p className="text-xs text-[#6B6058]">
            Securing marketplace workspace session
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ProtectedRoute({ allowedRoles, children }) {
  const { isLoggedIn, currentUser, isLoading, isResolving } = useAuth();
  const location = useLocation();

  // 1. Loading/Resolving state: auth state or token refresh is currently in flight.
  if (isResolving || isLoading) {
    return <ProtectedRouteLoadingState />;
  }

  // 2. Unauthenticated state: redirect to login preserving originally intended destination
  if (!isLoggedIn || !currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Derive effective allowed roles from single source of truth registry if not passed as prop
  const effectiveAllowedRoles = allowedRoles !== undefined
    ? allowedRoles
    : getAllowedRolesForRoute(location.pathname);

  // Check role permission against single source of truth registry (PROTECTED_ROUTE_REGISTRY)
  const isAllowed = isRouteAllowedForRole(location.pathname, currentUser.role);

  // 4. Authenticated but wrong role: explicit unauthorized screen (NOT login redirect)
  if (!isAllowed) {
    return <UnauthorizedPage allowedRoles={effectiveAllowedRoles || ['vendor', 'seller', 'admin']} />;
  }

  // 5. Authorized: render children or Outlet
  return children ? children : <Outlet />;
}
