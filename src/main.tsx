import "./index.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./features/auth";
import App from "./App";

const queryClient = new QueryClient();

async function enableMocks() {
  if (import.meta.env.VITE_USE_MOCKS !== "true") return;
  try {
    const { worker } = await import("./mocks/browser");
    await worker.start({ onUnhandledFrame: "bypass" });
  } catch (error) {
    console.error(
      "[MSW] No arrancó. Corre `npx msw init public/ --save` y reinicia el servidor.",
      error,
    );
  }
}

enableMocks().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </StrictMode>,
  );
});
