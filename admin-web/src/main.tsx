import { StrictMode, useState, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import "./index.css";
import App from "./App.tsx";
import { AuthProvider } from "./auth/AuthProvider.tsx";
import { IntroSplash } from "./components/IntroSplash.tsx";

function Root() {
  const [showIntro, setShowIntro] = useState(() => {
    // Only show intro once per session
    if (sessionStorage.getItem("sc-intro-seen")) return false;
    return true;
  });

  const handleIntroComplete = useCallback(() => {
    sessionStorage.setItem("sc-intro-seen", "1");
    setShowIntro(false);
  }, []);

  return (
    <StrictMode>
      {showIntro && <IntroSplash onComplete={handleIntroComplete} />}
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </StrictMode>
  );
}

createRoot(document.getElementById("root")!).render(<Root />);
