import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import { ThemeProvider } from "@/context/theme-provider.tsx"
import App from "./App.tsx"
import { TooltipProvider } from "./components/ui/tooltip.tsx"
import { AuthProvider } from "./context/AuthContext.tsx"
import "./index.css"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <TooltipProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </StrictMode>
)
