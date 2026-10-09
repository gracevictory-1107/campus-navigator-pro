import { Link } from "react-router-dom";
import { ArrowRight, CircleHelp, MailCheck, MapPinned, ShieldCheck } from "lucide-react";
import PublicPageLayout from "@/components/PublicPageLayout";

const helpItems = [
  { Icon: MailCheck, title: "I can’t sign in", answer: "Check that your email and password are correct. If you just created an account, open the latest email verification link first. Expired links need a fresh verification email." },
  { Icon: MapPinned, title: "How do I start directions?", answer: "After signing in, open Directions, choose a From room and a To room from the search results, then select Start Navigation. Some routes are approximate because the floor plans are not physically calibrated." },
  { Icon: ShieldCheck, title: "My account says Pending", answer: "A campus Admin must assign the correct role before role-restricted features become available. Contact your campus administrator or reception for account-role help." },
  { Icon: CircleHelp, title: "A room or path looks wrong", answer: "Do not rely on a guessed path. Ask reception or campus staff to confirm the destination and safest route. The floor layout may need a mapping update." },
];

export default function HelpDesk() {
  return (
    <PublicPageLayout activePage="help">
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary"><CircleHelp className="h-4 w-4" /> Support</div>
          <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">Help Desk</h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">Quick answers for login, route planning, account approval, and campus-map issues.</p>
        </div>
        <div className="mt-8 grid gap-3">
          {helpItems.map(({ Icon, title, answer }) => (
            <article key={title} className="flex gap-4 rounded-2xl border border-border bg-card p-5">
              <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span>
              <div>
                <h2 className="font-semibold">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{answer}</p>
              </div>
            </article>
          ))}
        </div>
        <div className="mt-6 rounded-2xl border border-border bg-card p-5">
          <h2 className="font-semibold">Still need help?</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">For account approvals, campus access decisions, or a physical wayfinding question, contact college reception or the campus administrator. Do not send passwords or biometric data through chat.</p>
          <Link to="/ai-assistant" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">Ask the Campus Guide Assistant <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </main>
    </PublicPageLayout>
  );
}
