import React from "react"
import ReactDOM from "react-dom/client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter } from "react-router-dom"
import App from "./App"
import { StudyDataProvider } from "./state/study-data"
import "./index.css"

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <StudyDataProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </StudyDataProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)
