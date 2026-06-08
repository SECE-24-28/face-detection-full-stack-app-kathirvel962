"use client";
// app/dashboard/page.tsx
// Main dashboard — capture a face via webcam, save the record, view and delete records.

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import FaceCamera from "@/components/FaceCamera";
import FaceRecordCard, { FaceRecord } from "@/components/FaceRecordCard";

// GraphQL — fetch all records
const RECORDS_QUERY = `
  query {
    faceRecords {
      id personName imageUrl confidence detectedAt status
    }
  }
`;

// GraphQL — add a new record
const ADD_MUTATION = `
  mutation AddFaceRecord(
    $personName: String!
    $imageUrl:   String!
    $confidence: Float!
    $status:     String!
  ) {
    addFaceRecord(
      personName: $personName
      imageUrl:   $imageUrl
      confidence: $confidence
      status:     $status
    ) {
      id personName imageUrl confidence detectedAt status
    }
  }
`;

// GraphQL — delete a record
const DELETE_MUTATION = `
  mutation DeleteFaceRecord($id: Int!) {
    deleteFaceRecord(id: $id)
  }
`;

export default function DashboardPage() {
  const router = useRouter();
  const [records, setRecords]     = useState<FaceRecord[]>([]);
  const [loading, setLoading]     = useState(true);
  const [personName, setPersonName] = useState("");
  const [showCamera, setShowCamera] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState("");

  // Authenticated GraphQL helper
  const gql = useCallback(async (query: string, variables = {}) => {
    const token = localStorage.getItem("token");
    const res = await fetch("/api/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ query, variables }),
    });
    return res.json();
  }, []);

  // Load all records on mount; redirect if not logged in
  useEffect(() => {
    if (!localStorage.getItem("token")) { router.push("/login"); return; }
    gql(RECORDS_QUERY).then((json) => {
      if (json.errors) { router.push("/login"); return; }
      setRecords(json.data.faceRecords);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [gql, router]);

  // Called by FaceCamera when the user clicks "Save Record"
  async function handleDetected(result: {
    imageDataUrl: string;
    confidence: number;
    status: "detected" | "failed";
  }) {
    if (!personName.trim()) {
      setSaveError("Please enter a person name before capturing.");
      return;
    }
    setSaving(true);
    setSaveError("");
    setShowCamera(false);

    // Save the base64 image as the imageUrl for simplicity.
    // In production, upload the image to S3/Cloudinary and store the URL.
    const json = await gql(ADD_MUTATION, {
      personName: personName.trim(),
      imageUrl:   result.imageDataUrl,
      confidence: result.confidence,
      status:     result.status,
    });

    if (json.errors) {
      setSaveError(json.errors[0].message);
    } else {
      // Prepend new record to the list
      setRecords((prev) => [json.data.addFaceRecord, ...prev]);
      setPersonName("");
    }
    setSaving(false);
  }

  // Delete a record and remove it from state
  async function handleDelete(id: number) {
    if (!confirm("Delete this face record?")) return;
    const json = await gql(DELETE_MUTATION, { id });
    if (!json.errors) setRecords((prev) => prev.filter((r) => r.id !== id));
  }

  function handleLogout() {
    localStorage.removeItem("token");
    router.push("/login");
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <span className="text-3xl">👁️</span>
          <h1 className="text-2xl font-bold text-indigo-700">Face Detection</h1>
        </div>
        <button
          onClick={handleLogout}
          className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition text-sm"
        >
          Logout
        </button>
      </div>

      {/* ── Capture Section ── */}
      <div className="bg-white rounded-2xl shadow p-6 mb-8">
        <h2 className="text-lg font-semibold text-indigo-700 mb-4">
          New Detection
        </h2>

        {/* Person name input */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Person Name</label>
          <input
            value={personName}
            onChange={(e) => setPersonName(e.target.value)}
            placeholder="Enter the person's name"
            className="w-full max-w-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        {saveError && <p className="text-red-500 text-sm mb-3">{saveError}</p>}
        {saving    && <p className="text-indigo-500 text-sm mb-3">Saving record...</p>}

        {/* Toggle camera panel */}
        {!showCamera ? (
          <button
            onClick={() => { setSaveError(""); setShowCamera(true); }}
            className="bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700 transition"
          >
            📷 Open Camera
          </button>
        ) : (
          <div className="flex flex-col items-start gap-4">
            <FaceCamera onDetected={handleDetected} />
            <button
              onClick={() => setShowCamera(false)}
              className="text-sm text-gray-500 hover:underline"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* ── Records Section ── */}
      <h2 className="text-lg font-semibold text-indigo-700 mb-4">
        Detection Records
      </h2>

      {loading && <p className="text-gray-400">Loading records...</p>}

      {!loading && records.length === 0 && (
        <p className="text-gray-400 text-center mt-10">
          No records yet. Capture a face above to get started.
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {records.map((r) => (
          <FaceRecordCard key={r.id} record={r} onDelete={handleDelete} />
        ))}
      </div>
    </div>
  );
}
