import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import About from "./pages/About";
import HelpDesk from "./pages/HelpDesk";
import AIAssistant from "./pages/AIAssistant";
import Security from "./pages/Security";
import AuthCallback from "./pages/AuthCallback";
import NotFound from "./pages/NotFound";
import AppErrorBoundary from "./components/AppErrorBoundary";
import { SecurityProvider } from "./security/SecurityContext";

const queryClient = new QueryClient();

const App = () => (
  <AppErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="campus-theme">
        <SecurityProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/security" element={<Security />} />
                <Route path="/about" element={<About />} />
                <Route path="/help-desk" element={<HelpDesk />} />
                <Route path="/ai-assistant" element={<AIAssistant />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </SecurityProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </AppErrorBoundary>
);

export default App;
