import React, { useRef, useState } from "react";
import { createMedia } from "../../../../api/mediaApi";

export default function Media({ ballId, matchId, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState(null);
  const [uploading, setUploading] = useState(false);

  const uploadFile = async (file) => {
    setUploading(true);
    try {
      console.log(
        "Uploading — matchId:",
        matchId,
        "ballId:",
        ballId,
        "file:",
        file,
      );
      await createMedia(matchId, ballId, file);
      alert("Upload Successful!");
      onClose();
    } catch (error) {
      console.error("Upload failed:", error);
      alert(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  // ✅ Gallery — dynamic input
  const openGallery = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = e.target.files[0];
      console.log("Gallery file selected:", file);
      if (file) await uploadFile(file);
    };
    input.click();
  };

  // ✅ Camera — dynamic input (capture attribute)
  const openCamera = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.capture = "environment"; // back camera
    input.onchange = async (e) => {
      const file = e.target.files[0];
      console.log("Camera file captured:", file);
      if (file) await uploadFile(file);
    };
    input.click();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.65)" }}
      onClick={onClose}
    >
      <canvas ref={canvasRef} className="hidden" />

      <div
        className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold text-gray-800 text-center mb-6">
          Select Image Source
        </h2>

        <div className="flex flex-col gap-3">
          <button
            className="flex items-center justify-center gap-3 w-full py-4 border-2 border-gray-100 rounded-xl hover:bg-gray-50 transition-colors"
            onClick={openCamera}
            disabled={uploading}
          >
            <span className="text-2xl">📷</span>
            <span className="font-medium text-gray-700">Open Camera</span>
          </button>

          <button
            className="flex items-center justify-center gap-3 w-full py-4 border-2 border-gray-100 rounded-xl hover:bg-gray-50 transition-colors"
            onClick={openGallery}
            disabled={uploading}
          >
            <span className="text-2xl">🖼️</span>
            <span className="font-medium text-gray-700">
              {uploading ? "Uploading..." : "From Gallery"}
            </span>
          </button>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full text-sm text-gray-400 hover:text-red-500 font-medium transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
