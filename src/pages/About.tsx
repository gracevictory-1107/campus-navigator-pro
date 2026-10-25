import { Link } from "react-router-dom";
import { Compass, MapPin, Route, ShieldCheck } from "lucide-react";
import PublicPageLayout from "@/components/PublicPageLayout";

const features = [
  { Icon: MapPin, title: "Find a room", text: "Search mapped room names and open the related floor plan." },
  { Icon: Route, title: "Plan a path", text: "Select a starting room and destination to request indoor directions." },
  { Icon: ShieldCheck, title: "Respect access rules", text: "Where visitor access checks are enabled, follow the permissions and instructions shown." },
];

export default function About() {
  return (
    <PublicPageLayout activePage="about">
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary"><Compass className="h-4 w-4" /> About the project</div>
          <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">Know where to go.</h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
            AWDC Campus Navigator brings campus maps, room discovery, and indoor route planning together for students, faculty, staff, and visitors.
          </p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {features.map(({ Icon, title, text }) => (
            <article key={title} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span>
              <h2 className="mt-4 font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
            </article>
          ))}
        </div>
        <div className="mt-7 rounded-2xl border border-border bg-card p-5">
          <h2 className="font-semibold">Route guidance</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Directions follow the available campus room and corridor maps. Confirm any unclear segment with reception or campus staff, and follow campus signage and access instructions.
          </p>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/" className="rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90">Sign in / Create account</Link>
          <Link to="/help-desk" className="rounded-xl border border-border px-4 py-3 text-sm font-semibold hover:bg-accent">Visit Help Desk</Link>
        </div>
      </main>
    </PublicPageLayout>
  );
}
