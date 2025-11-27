import { useState, useEffect } from "react";
import { ref, get } from "firebase/database";
import { db } from "../firebase";
import NavBar from "./NavBar";
import { useAuth } from "../contexts/AuthContext";

const CLASSIFICATIONS = ["Requirements", "Memorandums", "Resolutions"];

function Documents() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDocuments();
    } else {
      setLoading(false);
    }
  }, [user]);

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

  // Access Denied for not logged-in users
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <div className="pt-24 px-4 sm:px-6 lg:px-8 flex justify-center">
          <div className="max-w-lg w-full bg-white rounded-2xl shadow-lg p-10 text-center">
            <h1 className="text-2xl font-bold text-red-700 mb-3">Access Denied</h1>
            <p className="text-gray-600">You must be logged in to view documents.</p>
          </div>
        </div>
      </div>
    );
  }

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

  const renderDocuments = (groupedDocs) => {
    return ORDER.map((category) => (
      <div key={category} className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden mb-6">
        <div className="bg-gray-100 px-6 py-2 font-semibold text-gray-700">{category}</div>
        <div className="overflow-x-auto">
          <table className="min-w-full table-fixed divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 w-1/2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 w-1/4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded At</th>
                <th className="px-6 py-3 w-1/4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {groupedDocs[category].length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-gray-500 italic text-center">
                    No documents uploaded under {category}.
                  </td>
                </tr>
              ) : (
                groupedDocs[category].map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 uppercase">{item.title || "Untitled Document"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{new Date(item.uploadedAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => window.open(item.fileUrl, "_blank")}
                        className="bg-green-600 text-white font-medium px-3 py-1 rounded-lg hover:bg-green-700 transition"
                      >
                        Download
                      </button>
                    </td>
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
          <h1 className="text-3xl font-bold text-red-900 mb-4">Documents</h1>
          <p className="text-gray-600 mb-6">
            Browse and download official documents by classification.
          </p>

          <div className="mt-6">{renderDocuments(groupedDocuments)}</div>
        </div>
      </div>
    </div>
  );
}

export default Documents;
