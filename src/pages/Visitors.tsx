import SecurityHeader from "@/components/security/SecurityHeader";
import VisitorRegistrationForm from "@/components/security/VisitorRegistrationForm";
import CctvSimulator from "@/components/security/CctvSimulator";
import FaceVerification from "@/components/security/FaceVerification";
import VisitorList from "@/components/security/VisitorList";
import { Panel } from "@/components/security/common";
import { UserPlus, Video, ScanFace, Users } from "lucide-react";

export default function Visitors() {
  return (
    <div className="h-screen flex flex-col bg-background">
      <SecurityHeader title="Visitor Management" />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Panel title="Register visitor" icon={<UserPlus className="h-4 w-4 text-primary" />}>
            <VisitorRegistrationForm />
          </Panel>
          <Panel title="Face verification" icon={<ScanFace className="h-4 w-4 text-primary" />}>
            <FaceVerification />
          </Panel>
        </div>

        <Panel title="CCTV detection simulator" icon={<Video className="h-4 w-4 text-primary" />}>
          <CctvSimulator />
        </Panel>

        <Panel title="All visitors" icon={<Users className="h-4 w-4 text-primary" />}>
          <VisitorList />
        </Panel>
      </div>
    </div>
  );
}
