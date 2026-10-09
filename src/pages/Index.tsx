import CampusNavigator from "@/components/CampusNavigator";
import Welcome from "@/pages/Welcome";
import { useSecurity } from "@/security/SecurityContext";

const Index = () => {
  const { signedIn } = useSecurity();
  return signedIn ? <CampusNavigator /> : <Welcome />;
};

export default Index;
