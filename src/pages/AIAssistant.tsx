import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Bot, Send, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PublicPageLayout from "@/components/PublicPageLayout";

const prompts = [
  "How do I start navigation?",
  "Why is my account pending?",
  "What if a route looks approximate?",
  "Can I watch live CCTV here?",
];

function campusAnswer(question: string): string {
  const q = question.toLowerCase();
  if (q.includes("navigate") || q.includes("route") || q.includes("direction") || q.includes("start")) {
    return "Sign in first, open Directions, choose the starting room and destination from the search suggestions, then press Start Navigation. If the app marks part of a path as approximate, confirm that section with reception or campus staff before following it.";
  }
  if (q.includes("pending") || q.includes("role") || q.includes("approval") || q.includes("account")) {
    return "New campus accounts can remain Pending until an Admin assigns the correct role. Please contact the campus administrator or reception for approval help. Never share your password in chat.";
  }
  if (q.includes("cctv") || q.includes("camera") || q.includes("video") || q.includes("live feed")) {
    return "The CCTV area is currently a configuration and simulation interface. A camera IP alone does not provide live video; the campus administrator must configure a supported NVR/VMS or browser-accessible stream. This guide cannot access or display live feeds.";
  }
  if (q.includes("room") || q.includes("floor") || q.includes("find")) {
    return "Use the campus search to look for a room name or number. Select a result to open its mapped floor, or open Directions to plan a route between two mapped rooms. If a room is missing, ask reception to verify it.";
  }
  if (q.includes("help") || q.includes("contact") || q.includes("support")) {
    return "Open Help Desk for sign-in, route, account-approval, and map troubleshooting steps. For account access or physical directions, contact college reception or the campus administrator.";
  }
  return "I can help with sign-in, account approval, room search, mapped directions, and what the CCTV demo currently supports. Try one of the suggested questions below, or open Help Desk for more troubleshooting.";
}

export default function AIAssistant() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; text: string }>>([
    { role: "assistant", text: "Hi! I’m the Campus Guide Assistant preview. I can answer common questions about signing in, finding rooms, directions, and campus-navigation features." },
  ]);

  const ask = (raw: string) => {
    const clean = raw.trim();
    if (!clean) return;
    setMessages((previous) => [...previous, { role: "user", text: clean }, { role: "assistant", text: campusAnswer(clean) }]);
    setQuestion("");
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    ask(question);
  };

  return (
    <PublicPageLayout activePage="assistant">
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary"><Sparkles className="h-4 w-4" /> Campus Guide · Preview</div>
          <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">Ask the Campus Assistant</h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">Get quick guidance for sign-in, account approvals, rooms, and route planning.</p>
        </div>

        <section className="mt-8 overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
          <div className="flex items-center gap-3 border-b border-border p-4 sm:p-5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><Bot className="h-5 w-5" /></span>
            <div>
              <h2 className="font-semibold">Campus Guide Assistant</h2>
              <p className="text-xs text-muted-foreground">Local help preview · no account or CCTV access</p>
            </div>
            <span className="ml-auto rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">Ready</span>
          </div>

          <div aria-live="polite" className="grid max-h-[480px] gap-3 overflow-y-auto bg-secondary/20 p-4 sm:p-6">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === "user" ? "bg-primary text-primary-foreground" : "border border-border bg-card text-foreground"}`}>
                  {message.text}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-border p-4 sm:p-5">
            <div className="mb-3 flex flex-wrap gap-2">
              {prompts.map((prompt) => (
                <button key={prompt} type="button" onClick={() => ask(prompt)} className="rounded-xl border border-border px-3 py-2 text-xs font-medium hover:bg-accent">{prompt}</button>
              ))}
            </div>
            <form onSubmit={submit} className="flex gap-2">
              <Input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask about routes, rooms, sign-in…" aria-label="Ask the Campus Assistant" />
              <Button type="submit" disabled={!question.trim()} aria-label="Send question"><Send className="h-4 w-4" /></Button>
            </form>
            <p className="mt-3 flex items-start gap-2 text-[11px] leading-5 text-muted-foreground"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Preview assistant uses built-in guidance only. It is not connected to a live AI service, campus database, facial recognition, or CCTV stream.</p>
          </div>
        </section>
        <p className="mt-6 text-sm text-muted-foreground">Need step-by-step help? <Link to="/help-desk" className="font-semibold text-primary hover:underline">Open the Help Desk</Link>.</p>
      </main>
    </PublicPageLayout>
  );
}
