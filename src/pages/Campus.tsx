import { Navigate } from "react-router-dom";
import CampusNavigator from "@/components/CampusNavigator";
import { useSecurity } from "@/security/SecurityContext";

/** Keep the sign-in page as the public homepage; the map has its own route. */
export default function Campus() {
  const { signedIn } = useSecurity();
  return signedIn ? <CampusNavigator /> : <Navigate to="/" replace />;
}
