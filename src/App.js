import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Common/Navbar";
import HomePage from "./components/Common/HomePage";
import IssueCredential from "./components/Admin/IssueCredential";
import AdminPanel from "./components/Admin/AdminPanel";
import ManageCredentials from "./components/Admin/ManageCredential";
import StudentDashboard from "./components/Students/StudentDashboard";
import GenerateProof from './components/Students/GenerateProof';
import MyCredentials from "./components/Students/MyCredentials";
import VerifyCredentials from "./components/Verifier/VerifyCredentials";
import VerificationHistory from "./components/Verifier/VerificationHistory";
import AboutPage from "./components/Common/AboutPage";
import ViewCredentials from "./components/ViewCredentials";

export default function App() {
  return (
    <div>
      <Navbar />
      <div className="container" style={{ padding: "1rem 2rem" }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/admin/issue" element={<IssueCredential />} />
          <Route path="/admin/manage" element={<ManageCredentials />} />
          <Route path="/student" element={<StudentDashboard />} />
          <Route path="/student/credentials" element={<MyCredentials />} />
          <Route path="/student/generate-proof" element={<GenerateProof />} />
          <Route path="/student/history" element={<VerificationHistory />} />
          <Route path="/student/verify" element={<Navigate to="/verifier" replace />} />
          <Route path="/verifier" element={<VerifyCredentials />} />
          <Route path="/verifier/history" element={<VerificationHistory />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/view" element={<ViewCredentials />} />
        </Routes>
      </div>
    </div>
  );
}