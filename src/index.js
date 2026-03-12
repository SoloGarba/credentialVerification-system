import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { WalletProvider } from "./context/WalletContext";
import { UserRoleProvider } from "./context/UserRoleContext";
import { ContractProvider } from "./context/ContractContext";
import ErrorBoundary from "./components/Common/ErrorBoundary";
import "./index.css";

const container = document.getElementById("root");
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ErrorBoundary>
        <WalletProvider>
          <ContractProvider>
            <UserRoleProvider>
              <App />
            </UserRoleProvider>
          </ContractProvider>
        </WalletProvider>
      </ErrorBoundary>
    </BrowserRouter>
  </React.StrictMode>
);