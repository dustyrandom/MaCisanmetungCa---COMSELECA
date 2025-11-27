import { useState, useEffect } from "react";
import { ref, get, push, remove } from "firebase/database";
import { db } from "../firebase";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import NavBar from "./NavBar";
import { useAuth } from "../contexts/AuthContext";
import { logActivity } from "../utils/logActivity";

const CLASSIFICATIONS = ["Requirements", "Memorandums", "Resolutions"];

function ManageDocuments() {
  const { userData } = useAuth();
  const storage = getStorage();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [documentModal, setDocumentModal] = useState(false);
  const [classification, setClassification] = useState("");
  const [pdfFile, setPdfFile] = useState(null);
  const [title, setTitle] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [formError, setFormError] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingDocument, setDeletingDocument] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (userData?.role === "admin" || userData?.role === "superadmin") {
      fetchDocuments();
    } else {
      setLoading(false);
    }
  }, [userData]);

  const fetchDocuments = async () => {
    try {
      const docRef = ref(db, "documents");
      const snapshot = await get(docRef);

      if (snapshot.exists()) {
        const data = snapshot.val();
        const list = Object.entries(data).map(([id, entry]) => ({ id, ...entry }));
        setDocuments(list);
      }

      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const openAdd = () => {
    setClassification("");
    setPdfFile(null);
    setTitle("");      
    setDocumentModal(true);
  };

  const handleUpload = async () => {
    if (!classification) {
      setFormError("Please select a classification.");
      return;
    }
    if (!title.trim()) {
      setFormError("Please enter a document title.");
      return;
    }
    if (!pdfFile) {
      setFormError("Please select a PDF file to upload.");
      return;
    }

    setFormError(""); // Clear previous errors
    setIsProcessing(true);

    try {
      const filePath = `documents/${classification}/${pdfFile.name}`;
      const fileRef = storageRef(storage, filePath);

      await uploadBytes(fileRef, pdfFile);
      const downloadURL = await getDownloadURL(fileRef);

      await push(ref(db, "documents"), {
        classification,
        title,
        fileName: pdfFile.name,
        fileUrl: downloadURL,
        uploadedAt: Date.now(),
      });

      await logActivity(userData.fullName, `Uploaded PDF "${title}" in ${classification}`);

      fetchDocuments();
      setDocumentModal(false);
    } catch (err) {
      console.error(err);
      setFormError("An error occurred while uploading the PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Access Denied Screen
  if (userData?.role !== "admin" && userData?.role !== "superadmin") {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <div className="pt-24 px-4 sm:px-6 lg:px-8 flex justify-center">
          <div className="max-w-lg w-full bg-white rounded-2xl shadow-lg p-10 text-center">
            <h1 className="text-2xl font-bold text-red-700 mb-3">Access Denied</h1>
            <p className="text-gray-600">You don’t have permission to access this page.</p>
          </div>
        </div>
      </div>
    );
  }

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <div className="max-w-4xl mx-auto pt-24 px-6 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  const groupedDocuments = {
    Requirements: documents.filter(d => d.classification === "Requirements"),
    Memorandums: documents.filter(d => d.classification === "Memorandums"),
    Resolutions: documents.filter(d => d.classification === "Resolutions"),
  };

  const ORDER = ["Requirements", "Memorandums", "Resolutions"];

  const renderDocuments = (groupedDocs, showActions = true) => {
    return ORDER.map((category) => (
      <div key={category} className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden mb-6">
        <div className="bg-gray-100 px-6 py-2 font-semibold text-gray-700">{category}</div>
        <div className="overflow-x-auto">
          <table className="min-w-full table-fixed divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 w-1/4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 w-1/4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File Name</th>
                <th className="px-6 py-3 w-1/4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded At</th>
                {showActions && (
                  <th className="px-6 py-3 w-1/4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {groupedDocs[category].length === 0 ? (
                <tr>
                  <td colSpan={showActions ? 4 : 3} className="px-6 py-4 text-gray-500 italic text-center">
                    No documents uploaded under {category}.
                  </td>
                </tr>
              ) : (
                groupedDocs[category].map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 w-1/4 whitespace-nowrap text-sm text-gray-900 uppercase">{item.title || "Untitled Document"}</td>
                    <td className="px-6 py-4 w-1/4 whitespace-nowrap text-sm">
                      <a href={item.fileUrl} target="_blank" className="text-blue-600 underline">{item.fileName}</a>
                    </td>
                    <td className="px-6 py-4 w-1/4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(item.uploadedAt).toLocaleDateString()}
                    </td>
                    {showActions && (
                      <td className="px-6 py-4 w-1/4 whitespace-nowrap flex gap-2">
                        <button
                          onClick={() => {
                            setDeletingDocument(item);
                            setShowDeleteModal(true);
                          }}
                          className="px-3 py-1 rounded-lg font-medium text-white text-sm bg-red-600 hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <div className="pt-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto p-8">

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-red-900">Manage Documents</h1>
              <p className="text-gray-600 mt-1">
                Upload and manage official PDF documents by classification.
              </p>
            </div>

            <button
              onClick={openAdd}
              className="w-full sm:w-auto px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
            >
              Upload
            </button>
          </div>


          {/* Document Table */}
          <div className="mt-6">
            {renderDocuments(groupedDocuments)}
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {documentModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">

            <h2 className="text-xl font-bold mb-4">Upload PDF Document</h2>

            <label className="block mb-2 font-medium">Classification</label>
            <select
              value={classification}
              onChange={(e) => setClassification(e.target.value)}
              className="w-full border rounded px-3 py-2 mb-4"
            >
              <option value="">Select Classification</option>
              {CLASSIFICATIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <label className="block mb-2 font-medium">Document Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border rounded px-3 py-2 mb-4 uppercase"
              placeholder="e.g., SSC Requirements 2024"
            />

            <label className="block mb-2 font-medium">PDF File</label>
            <input
              type="file"
              accept="application/pdf"
              className="w-full mb-4 text-sm text-gray-500 file:cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-red-50 file:text-red-700 hover:file:bg-red-10"
              onChange={(e) => setPdfFile(e.target.files[0])}
            />

            {formError && (
              <p className="text-red-600 text-sm mb-3">{formError}</p>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDocumentModal(false)}
                className="bg-gray-500 text-white px-4 py-2 font-medium rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>

              <button
                onClick={handleUpload}
                className={`px-4 py-2 rounded-lg font-medium text-white ${
                  isProcessing ? "bg-green-300" : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {isProcessing ? "Uploading..." : "Upload"}
              </button>
            </div>

          </div>
        </div>
      )}

      {showDeleteModal && deletingDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Delete Document</h2>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeletingDocument(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-6 flex items-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-900 font-medium">
                    Are you sure you want to delete <strong>{deletingDocument.title}</strong>?
                  </p>
                  <p className="text-sm text-gray-500">This action cannot be undone.</p>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeletingDocument(null);
                  }}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    setDeleting(true);
                    try {
                      await deleteObject(storageRef(storage, `documents/${deletingDocument.classification}/${deletingDocument.fileName}`));
                      await remove(ref(db, `documents/${deletingDocument.id}`));
                      await logActivity(userData.fullName, `Deleted PDF "${deletingDocument.title}" from ${deletingDocument.classification}`);
                      await fetchDocuments();
                      setShowDeleteModal(false);
                      setDeletingDocument(null);
                    } catch (err) {
                      console.error(err);
                      alert("Error deleting file.");
                    } finally {
                      setDeleting(false);
                    }
                  }}
                  disabled={deleting}
                  className={`px-4 py-2 rounded-lg font-medium text-white ${deleting ? 'bg-red-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
                >
                  {deleting ? 'Deleting...' : 'Delete Document'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default ManageDocuments;
