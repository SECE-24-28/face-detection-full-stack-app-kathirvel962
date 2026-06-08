// components/FaceRecordCard.tsx
// Displays a single face detection record in a card.

// Shape of one face record from GraphQL
export interface FaceRecord {
  id:         number;
  personName: string;
  imageUrl:   string;
  confidence: number;
  detectedAt: string;
  status:     string;
}

interface Props {
  record:   FaceRecord;
  onDelete: (id: number) => void;
}

export default function FaceRecordCard({ record, onDelete }: Props) {
  // Format the stored date into a readable string
  const date = new Date(record.detectedAt).toLocaleString();

  const isDetected = record.status === "detected";

  return (
    <div className="bg-white rounded-2xl shadow p-4 flex flex-col gap-3">
      {/* Snapshot image */}
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={record.imageUrl}
          alt={record.personName}
          className="w-full h-40 object-cover rounded-xl border"
          onError={(e) => {
            // Fallback placeholder if image fails to load
            (e.target as HTMLImageElement).src =
              "https://placehold.co/400x160?text=No+Image";
          }}
        />
        {/* Status badge */}
        <span
          className={`absolute top-2 right-2 text-xs font-bold px-2 py-1 rounded-full ${
            isDetected ? "bg-green-500 text-white" : "bg-red-500 text-white"
          }`}
        >
          {isDetected ? "✔ Detected" : "✘ Failed"}
        </span>
      </div>

      {/* Record details */}
      <div>
        <h2 className="font-semibold text-lg">{record.personName}</h2>
        <p className="text-sm text-gray-500">{date}</p>
      </div>

      {/* Confidence bar */}
      <div>
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Confidence</span>
          <span className="font-medium">{record.confidence}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              isDetected ? "bg-green-500" : "bg-red-400"
            }`}
            style={{ width: `${record.confidence}%` }}
          />
        </div>
      </div>

      {/* Delete button */}
      <button
        onClick={() => onDelete(record.id)}
        className="w-full bg-red-500 hover:bg-red-600 text-white text-sm py-1.5 rounded-lg transition"
      >
        Delete
      </button>
    </div>
  );
}
