import { useState, useEffect } from 'react'
import { ref as dbRef, get, remove, set } from 'firebase/database'
import { db } from '../firebase'
import NavBar from './NavBar'
import PublicResultsContent from './PublicResultsContent'
import { useAuth } from "../contexts/AuthContext"
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { logActivity } from '../utils/logActivity';
import { getAuth, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth"

function ViewResults() {
  const { userData, loading: authLoading } = useAuth()
  const [votes, setVotes] = useState([])
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('voters')
  const [deletingVotes, setDeletingVotes] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [expandedVotes, setExpandedVotes] = useState({})
  const [publicVisible, setPublicVisible] = useState(false)
  const [savingPublish, setSavingPublish] = useState(false)
  const [voterFilter, setVoterFilter] = useState('All')
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [adminPassword, setAdminPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const sscPosition = [
    'President','Vice President','General Secretary','Internal Secretary','External Secretary','Finance Officer','Audit Officer','Student Welfare and Rights Officer','Multimedia Officers','Editorial Officer','Logistics Officer'
  ]
  const iscPosition = ['Governor','Vice Governor','Board Member on Records','Board Member on Finance','Board Member on Audit','Board Member on Publication','Board Member on Public Relation','Board Member on Resources']

  const institutes = [
    'Institute of Arts and Sciences',
    'Institute of Business and Computing Education',
    'Institute of Teacher Education',
    'Institute of Hospitality and Tourism Management'
  ]

  const instituteMap = {
  IAS: 'Institute of Arts and Sciences',
  IBCE: 'Institute of Business and Computing Education',
  IHTM: 'Institute of Hospitality and Tourism Management',
  ITE: 'Institute of Teacher Education'
}

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load all votes
        const votesRef = dbRef(db, 'electionVotes')
        const votesSnapshot = await get(votesRef)
        if (votesSnapshot.exists()) {
          const votesData = votesSnapshot.val()
          const votesList = Object.keys(votesData).map(uid => ({
            uid,
            ...votesData[uid]
          }))
          setVotes(votesList)
        }

        // Load all candidates
        const candidatesRef = dbRef(db, 'candidates')
        const candidatesSnapshot = await get(candidatesRef)
        if (candidatesSnapshot.exists()) {
          const candidatesData = candidatesSnapshot.val()
          const candidatesList = Object.keys(candidatesData).map(id => ({
            id,
            ...candidatesData[id]
          }))
          setCandidates(candidatesList)
        }

        // Load public visibility flag
        const pubRef = dbRef(db, 'publicResultsVisible')
        const pubSnap = await get(pubRef)
        if (pubSnap.exists()) {
          setPublicVisible(!!pubSnap.val())
        }

        // No bar data computation here; the public content component will handle it
      } catch (error) {
        console.error('Failed to load results:', error)
      } finally {
        setLoading(false)
      }
    }

  if (userData?.role === 'admin' || userData?.role === 'superadmin') {
      loadData()
    } else {
      setLoading(false)
    }
  }, [userData])

  const getCandidateName = (candidateId) => {
  const candidate = candidates.find(c => c.id === candidateId)
  if (!candidate) return `Unknown Candidate (ID: ${candidateId})`

  const last = candidate.lastName || ''
    const first = candidate.firstName || ''
    return `${last.toUpperCase()}, ${first.toUpperCase()}`.trim()
  }


  const getCandidatePosition = (candidateId) => {
    const candidate = candidates.find(c => c.id === candidateId)
    return candidate ? candidate.position : 'Unknown Position'
  }

  const getCandidateInstitute = (candidateId) => {
    const candidate = candidates.find(c => c.id === candidateId)
    return candidate ? candidate.institute : 'Unknown Institute'
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString()
  }

  const getFilteredVotes = () => {
    if (voterFilter === 'All') return votes
    const instituteFullName = instituteMap[voterFilter]
    return votes.filter(v => v.voterInstitute === instituteFullName)
  }

  /* const handleDeleteAllVotes = async () => {
    try {
      setDeleteError('')
      setDeletingVotes(true)
      const votesRef = dbRef(db, 'electionVotes')
      await remove(votesRef)
      setVotes([])
      setShowDeleteModal(false)
      logActivity(userData.fullName, "Deleted all votes")
    } catch (error) {
      console.error('Failed to delete all votes:', error)
      setDeleteError('Failed to delete votes. Please try again.')
    } finally {
      setDeletingVotes(false)
    }
  } */


const handleExport = async () => {
  // if you already have getCandidateName or candidates map in scope, this will use them.
  if (!Array.isArray(votes) || votes.length === 0) {
    alert("No votes to export.");
    return;
  }

  // helper: format date nicely (fallback)
  const formatDateSafe = (d) => {
    if (!d) return "";
    try {
      const dt = new Date(d);
      return isNaN(dt.getTime()) ? String(d) : dt.toLocaleString();
    } catch {
      return String(d);
    }
  };

  // sanitize to avoid Excel interpreting text as formula
  const sanitizeCell = (val) => {
    if (val === null || val === undefined) return "";
    let s = String(val);
    // If begins with = + - @, prefix with apostrophe so Excel treats it as text
    if (/^[=+\-@]/.test(s)) s = "'" + s;
    return s;
  };

  // Positions lists (same as your archives format)
  const sscPositions = [
    "President",
    "Vice President",
    "General Secretary",
    "Internal Secretary",
    "External Secretary",
    "Finance Officer",
    "Audit Officer",
    "Student Welfare and Rights Officer",
    "Multimedia Officers",
    "Editorial Officer",
    "Logistics Officer",
  ];

  const iscPositions = [
    "Governor",
    "Vice Governor",
    "Board Member on Records",
    "Board Member on Finance",
    "Board Member on Audit",
    "Board Member on Publication",
    "Board Member on Public Relation",
    "Board Member on Resources",
  ];

  const autoFitColumns = (ws) => {
    if (!ws || !ws["!ref"]) return;
    const range = XLSX.utils.decode_range(ws["!ref"]);
    const colWidths = [];
    for (let C = range.s.c; C <= range.e.c; ++C) {
      let maxWidth = 10;
      for (let R = range.s.r; R <= range.e.r; ++R) {
        const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
        if (cell && cell.v != null) {
          const len = String(cell.v).length;
          if (len + 2 > maxWidth) maxWidth = len + 2;
        }
      }
      colWidths.push({ wch: maxWidth });
    }
    ws["!cols"] = colWidths;
  };


  const allPositions = [...sscPositions, ...iscPositions];

  // Build candidateInfo map if possible (candidates variable or candidatesMap)
  const candidateInfo = {};
    for (const c of candidates || []) {
      candidateInfo[c.id] = {
        name:
          c.fullName ||
          `${c.lastName?.toUpperCase() || ""}, ${c.firstName?.toUpperCase() || ""}`.trim(),
        position: c.position || "",
        institute: (c.institute || c.institution || "").trim(),
      };
    }


  // candidate name resolver: prefer getCandidateName if available, else candidateInfo, else id
  const candidateNameForId = (id) => {
    if (!id) return "";
    if (typeof getCandidateName === "function") {
      try {
        const n = getCandidateName(id);
        if (n) return n;
      } catch {
        // ignore
      }
    }
    if (candidateInfo[id]) return candidateInfo[id].name || id;
    return id;
  };

  // Build rows with fixed columns per position
  const rows = votes.map((vote) => {
    // support several vote object shapes:
    const voterName = vote.voterName || vote.voter || vote.name || vote.fullName || "";
    const voterStudentId = vote.voterstudentId || vote.voterStudentId || vote.studentId || "";
    const voterEmail = vote.voterEmail || vote.voter_email || vote.email || "";
    const voterInstitute = (vote.voterInstitute || vote.voter_institute || vote.institute || "").trim();
    const submittedAt = formatDateSafe(vote.submittedAt || vote.submitted_at || vote.timestamp || "");

    // normalise the incoming votes object (keys may be "Institute of X - Governor")
    const positionsObj = vote.votes || vote.vote || {};
    const normalized = {}; // normalized[position] = [id,...]
    for (const [rawPosKey, candidateIdOrIds] of Object.entries(positionsObj || {})) {
      let pos = rawPosKey;
      if (typeof rawPosKey === "string" && rawPosKey.includes("-")) {
        const parts = rawPosKey.split("-");
        pos = parts[parts.length - 1].trim();
      }
      if (!pos) continue;
      const arr = Array.isArray(candidateIdOrIds) ? candidateIdOrIds : [candidateIdOrIds];
      normalized[pos] = (normalized[pos] || []).concat(arr.filter(Boolean));
    }

    const row = {
      "Voter Name": sanitizeCell(voterName),
      "Student ID": sanitizeCell(voterStudentId),
      Email: sanitizeCell(voterEmail),
      Institute: sanitizeCell(voterInstitute),
      "Submitted At": sanitizeCell(submittedAt),
    };

    for (const pos of allPositions) {
      const ids = normalized[pos] || [];
      let validIds = [];

      // SSC positions accept any candidate IDs present
      if (sscPositions.includes(pos)) {
        validIds = ids;
      } else {
        // ISC positions: only include candidate if candidate's institute matches voter's institute
        validIds = ids.filter((cid) => {
          const info = candidateInfo[cid];
          // If we don't have candidate info, include (fallback) — you can change to exclude if needed
          if (!info || !info.institute) return false;
          return (String(info.institute).trim() === String(voterInstitute).trim());
        });
      }

      const names = validIds.map((cid) => sanitizeCell(candidateNameForId(cid))).filter(Boolean);
      row[pos] = names.join(", ");
    }

    return row;
  });

  // Build workbook & sheet
  const wb = XLSX.utils.book_new();

  // Ensure header order
  const header = ["Voter Name", "Student ID", "Email", "Institute", "Submitted At", ...allPositions];

  const ws = XLSX.utils.json_to_sheet(rows, { header });

  // Auto-fit columns (uses your helper)
  try {
    autoFitColumns(ws);
  } catch (e) {
    // if autoFit fails for any reason, ignore — sheet will still be fine
    console.warn("autoFitColumns failed:", e);
  }

  // Make worksheet view-only
  ws['!protect'] = {
    password: "readonly",
    selectLockedCells: true,
    selectUnlockedCells: true
  };

  XLSX.utils.book_append_sheet(wb, ws, `election_results_${new Date().toISOString().slice(0,10)}`);

  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const filename = `election_results_${new Date().toISOString().slice(0,10)}.xlsx`;
  saveAs(new Blob([wbout], { type: "application/octet-stream" }), filename);

  // Optional logging
  if (typeof logActivity === "function" && userData?.fullName) {
    logActivity(userData.fullName, `Exported election results`);
  }
};

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-900"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!userData || userData.role !== 'admin' && userData?.role !== 'superadmin') {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <div className="pt-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="bg-white rounded-xl shadow border border-gray-200 p-8 text-center">
              <h1 className="text-xl font-bold text-red-900 mb-4">Access Denied</h1>
              <p className="text-gray-600">You don't have permission to access this page.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="pt-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-red-900">Election Results</h1>
                <p className="text-gray-600 mt-1">View detailed voting results and voter information</p>
              </div>
              <div className="flex gap-2">
                {/* {userData.role === 'superadmin' && (
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    disabled={deletingVotes || votes.length === 0}
                    className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium border ${deletingVotes || votes.length === 0 ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-red-700 text-white border-red-700 hover:bg-red-600'}`}
                    title={votes.length === 0 ? 'No votes to delete' : 'Delete all votes'}
                  >
                    {deletingVotes ? 'Deleting…' : 'Delete All Votes'}
                  </button>
                )} */}

                {userData.role === 'superadmin' && (
                  <button
                    onClick={() => setShowPasswordConfirm(true)}
                    disabled={votes.length === 0}
                    className={`ml-2 inline-flex items-center px-4 py-2 rounded-lg font-medium ${
                      votes.length === 0
                        ? 'bg-gray-100 text-gray-400 font-medium rounded-lg border-gray-200 cursor-not-allowed'
                        : 'bg-green-600 text-white font-medium rounded-lg border-green-700 hover:bg-green-600 transition'
                    }`}
                    title="Export votes"
                  >
                    Export 
                  </button>
                )}
                
                
              </div>
            </div>

            {/* Delete All Votes Modal */}
            {/* {showDeleteModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="absolute inset-0 bg-black bg-opacity-40" onClick={() => !deletingVotes && setShowDeleteModal(false)}></div>
                <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                  <div className="px-6 py-5">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Delete all votes?</h3>
                    <p className="text-sm text-gray-600 mb-4">This action cannot be undone. All voter submissions will be permanently removed.</p>
                    {deleteError && (
                      <div className="mb-3 text-sm text-red-600">{deleteError}</div>
                    )}
                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => setShowDeleteModal(false)}
                        disabled={deletingVotes}
                        className={`px-4 py-2 rounded-md text-sm font-medium border ${deletingVotes ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleDeleteAllVotes}
                        disabled={deletingVotes}
                        className={`px-4 py-2 rounded-md text-sm font-medium ${deletingVotes ? 'bg-red-300 text-white cursor-not-allowed' : 'bg-red-600 text-white hover:bg-red-700'}`}
                      >
                        {deletingVotes ? 'Deleting…' : 'Delete Votes'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )} */}


            {/* Tabs */}
            <div className="mb-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setActiveTab('voters')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'voters'
                        ? 'border-red-500 text-red-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Voter Details ({getFilteredVotes().length})
                  </button>
                  <button
                    onClick={() => setActiveTab('summary')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'summary'
                        ? 'border-red-500 text-red-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Vote Summary
                  </button>
                  <button
                    onClick={() => setActiveTab('settings')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'settings'
                        ? 'border-red-500 text-red-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Settings
                  </button>
                </nav>
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'voters' && (
              <div className="space-y-6">

                {/* Filter Dropdown */}
                <div className="flex justify-start mb-6">
                  <div className="flex-1 sm:flex-none">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Filter by Institute
                    </label>
                    <select
                      value={voterFilter}
                      onChange={(e) => setVoterFilter(e.target.value)}
                      className="w-full sm:w-[180px] rounded-lg border border-gray-300 bg-white py-2 px-3 text-sm shadow-sm focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all"
                    >
                      <option value="All">All</option>
                      <option value="IAS">IAS</option>
                      <option value="IBCE">IBCE</option>
                      <option value="IHTM">IHTM</option>
                      <option value="ITE">ITE</option>
                    </select>
                  </div>
                </div>

                {getFilteredVotes().length === 0 ? (
                  <div className="bg-white rounded-lg shadow p-6 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No votes recorded yet</h3>
                    <p className="text-gray-500">Voting results will appear here once users start voting.</p>
                  </div>
                ) : (
                  getFilteredVotes().map((vote, index) => (
                    <div key={vote.uid} className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{vote.voterName}</h3>
                          <p className="text-gray-600">{vote.voterstudentId}</p>
                          <p className="text-gray-600">{vote.voterEmail}</p>
                          <p className="text-gray-600">{vote.voterInstitute}</p>
                          <p className="text-sm text-gray-500">Voted on: {formatDate(vote.submittedAt)}</p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <button
                            type="button"
                            onClick={() => setExpandedVotes(prev => ({ ...prev, [vote.uid]: !prev[vote.uid] }))}
                            className="px-3 py-1 rounded-md text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
                            aria-expanded={!!expandedVotes[vote.uid]}
                            aria-controls={`votes-${vote.uid}`}
                          >
                            {expandedVotes[vote.uid] ? 'Hide Votes' : 'Show Votes'}
                          </button>
                          {/* <div className="flex-shrink-0">
                            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium break-words max-w-[90px] sm:max-w-none text-center truncate">
                              Vote #{index + 1}
                            </span>
                          </div> */}
                        </div>
                      </div>

                      <div className="border-t pt-4" id={`votes-${vote.uid}`}> 
                        {expandedVotes[vote.uid] && (
                        <div className="space-y-4">
                          <h4 className="font-medium text-gray-900 mb-3">Votes Cast:</h4>

                          {/* SSC Votes */}
                          <div>
                            <h5 className="text-lg font-semibold text-red-900 mb-3">Supreme Student Council Votes</h5>
                            <div className="space-y-3">
                              {sscPosition.map(position => {
                                const selectedCandidates = vote.votes[position]
                                const candidatesArray = Array.isArray(selectedCandidates) ? selectedCandidates : [selectedCandidates]
                                const validCandidates = candidatesArray.filter(Boolean)
                                
                                return (
                                  <div key={position} className="bg-gray-50 rounded-lg p-3">
                                    <h6 className="font-medium text-gray-800 mb-2">{position}</h6>
                                    {validCandidates.length > 0 ? (
                                      <div className="space-y-2">
                                        {validCandidates.map((candidateId, idx) => (
                                          <div key={idx} className="flex items-center justify-between bg-white rounded-lg p-3 border border-green-200">
                                            <div className="flex items-center">
                                              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                                                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                              </div>
                                              <div>
                                                <div className="text-xs text-green-600 font-medium">VOTED FOR</div>
                                                <span className="font-semibold text-gray-900">{getCandidateName(candidateId)}</span>
                                                {/* <span className="text-gray-500 ml-2">({getCandidateRole(candidateId)})</span> */}
                                              </div>
                                            </div>
                                            <div className="text-right">
                                              <span className="text-sm text-gray-500">{getCandidateInstitute(candidateId)}</span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                                        <div className="flex items-center">
                                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                          </div>
                                          <span className="text-gray-500 italic">No candidate selected</span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>

                          {/* ISC Votes */}
                          <div>
                            <h5 className="text-lg font-semibold text-red-900 mb-3">Institute Student Council Votes</h5>
                            <div className="space-y-3">
                              {(() => {
                                // Determine voter's institute from their votes
                                let voterInstitute = null
                                for (const [voteKey, candidateId] of Object.entries(vote.votes)) {
                                  if (!candidateId) continue
                                  const matchedPosition = iscPosition.find(position => voteKey.endsWith(`-${position}`))
                                  if (matchedPosition) {
                                    const candidate = candidates.find(c => c.id === candidateId)
                                    if (candidate) {
                                      voterInstitute = candidate.institute
                                      break
                                    }
                                  }
                                }

                                return (
                                  <div className="mb-4">
                                    <h6 className="font-semibold text-gray-700 mb-2">{voterInstitute}</h6>
                                    <div className="space-y-2">
                                      {iscPosition.map(position => {
                                        const voteKey = `${voterInstitute}-${position}`
                                        const selectedCandidates = vote.votes[voteKey]
                                        const candidatesArray = Array.isArray(selectedCandidates) ? selectedCandidates : [selectedCandidates]
                                        const validCandidates = candidatesArray.filter(Boolean)

                                        return (
                                          <div key={position} className="bg-gray-50 rounded-lg p-3">
                                            <h6 className="font-medium text-gray-800 mb-2">{position}</h6>

                                            {validCandidates.length > 0 ? (
                                              <div className="space-y-2">
                                                {validCandidates.map((candidateId, idx) => (
                                                  <div key={idx} className="flex items-center justify-between bg-white rounded-lg p-3 border border-green-200">
                                                    <div className="flex items-center">
                                                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                                                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                      </div>
                                                      <div>
                                                        <div className="text-xs text-green-600 font-medium">VOTED FOR</div>
                                                        <span className="font-semibold text-gray-900">{getCandidateName(candidateId)}</span>
                                                        {/* <span className="text-gray-500 ml-2">({getCandidateRole(candidateId)})</span> */}
                                                      </div>
                                                    </div>
                                                    {/* <div className="text-right">
                                                      <span className="text-sm text-gray-500">{getCandidateInstitute(candidateId)}</span>
                                                    </div> */}
                                                  </div>
                                                ))}
                                              </div>
                                            ) : (
                                              <div className="bg-white rounded-lg p-3 border border-gray-200">
                                                <div className="flex items-center">
                                                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                  </div>
                                                  <span className="text-gray-500 italic">No candidate selected</span>
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        )
                                      })}
                                    </div>
                                  </div>
                                )
                              })()}
                            </div>
                          </div>

                        </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'summary' && (
              <div className="space-y-6">
                {/* <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Voting Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total Voters</p>
                          <p className="text-2xl font-bold text-gray-900">{getFilteredVotes().length}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div> */}

                {/* Candidate Vote Counts */}
                <>
                  {/* <div className="space-y-8">
                    <div>
                      <h2 className="text-xl font-semibold text-red-900 mb-6">Supreme Student Council Candidates</h2>
                        {sscPosition.map(position => {
                        const positionCandidates = candidates.filter(c => c.position === position)
                        return (
                          <div key={position} className="mb-8">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">{position}</h3>
                            {positionCandidates.length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {positionCandidates.map(candidate => {
                                  let voteCount = 0
                                  votes.forEach(vote => {
                                    Object.values(vote.votes).forEach(selectedCandidates => {
                                      const candidatesArray = Array.isArray(selectedCandidates) ? selectedCandidates : [selectedCandidates]
                                      if (candidatesArray.includes(candidate.id)) {
                                        voteCount++
                                      }
                                    })
                                  })

                                  return (
                                    <div key={candidate.id} className="bg-white rounded-lg shadow-md p-4">
                                      <h4 className="font-semibold">{candidate.fullName}</h4>
                                      <p className="text-sm text-gray-600">{candidate.email}</p>
                                      <p className="text-sm text-gray-600">{candidate.studentId}</p>
                                      <p className="text-sm text-gray-600">{candidate.institute}</p>
                                      {candidate.team && (
                                        <p className="text-sm text-purple-600">Party: {candidate.team}</p>
                                      )}
                                      <div className="mt-3">
                                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                                          {voteCount} votes
                                        </span>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            ) : (
                              <p className="text-red-800 italic text-sm ">No candidate/s for this position yet.</p>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    <div>
                      <h2 className="text-xl font-semibold text-red-900 mb-6">Institute Student Council Candidates</h2>
                      {institutes.map(institute => {
                        const instituteCandidates = candidates.filter(c => iscPosition.includes(c.position) && c.institute === institute)
                        return (
                          <div key={institute} className="mb-8">
                            <h3 className="text-lg font-semibold text-gray-800 mb-6">{institute}</h3>

                            <div className="space-y-8">
                              {iscPosition.map(position => {
                                const positionCandidates = instituteCandidates.filter(c => c.position === position)

                                return (
                                  <div key={position}>
                                    <h4 className="text-lg font-semibold text-gray-700 mb-3">{position}</h4>
                                    
                                    {positionCandidates.length > 0 ? (
                                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {positionCandidates.map(candidate => {
                                          let voteCount = 0
                                          votes.forEach(vote => {
                                            Object.values(vote.votes).forEach(selectedCandidates => {
                                              const candidatesArray = Array.isArray(selectedCandidates) ? selectedCandidates : [selectedCandidates]
                                              if (candidatesArray.includes(candidate.id)) {
                                                voteCount++
                                              }
                                            })
                                          })

                                          return (
                                            <div key={candidate.id} className="bg-white rounded-lg shadow-md p-4">
                                              <h5 className="font-semibold">{candidate.fullName}</h5>
                                              <p className="text-sm text-gray-600">{candidate.email}</p>
                                              <p className="text-sm text-gray-600">{candidate.studentId}</p>
                                              {candidate.team && (
                                                <p className="text-sm text-purple-600">Party: {candidate.team}</p>
                                              )}
                                              <div className="mt-3">
                                                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                                                  {voteCount} votes
                                                </span>
                                              </div>
                                            </div>
                                          )
                                        })}
                                      </div>
                                    ) : (
                                      <p className="text-red-800 italic text-sm">No candidate/s for this position yet.</p>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                  </div> */}
                </>

                {/* Public results content reused */}
                <PublicResultsContent forceVisible={true} />

              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Publish Results to Public Page</h3>
                      <p className="text-sm text-gray-600">Controls visibility of the result page.</p>
                    </div>
                    <label className="inline-flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={publicVisible}
                        onChange={async (e) => {
                          try {
                            setSavingPublish(true)
                            const value = e.target.checked
                            await set(dbRef(db, 'publicResultsVisible'), value)
                            setPublicVisible(value)
                            logActivity(
                            userData.fullName,
                            value ? "Published election results to public" : "Hid election results from public"
                          )
                          } catch (err) {
                            console.error('Failed to update public visibility', err)
                          } finally {
                            setSavingPublish(false)
                          }
                        }}
                      />
                      <div
                        className="relative w-14 h-8 rounded-full bg-gray-200 transition-colors peer-checked:bg-green-500 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-offset-2 peer-focus:ring-red-500 after:content-[''] after:absolute after:top-1 after:left-1 after:w-6 after:h-6 after:bg-white after:rounded-full after:shadow after:transition-transform peer-checked:after:translate-x-6"
                      ></div>
                      <span className="ml-3 text-sm font-medium text-gray-700">
                        {savingPublish ? 'Saving…' : (publicVisible ? 'Visible' : 'Hidden')}
                      </span>
                    </label>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>
      {showPasswordConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Confirm Export</h3>
            <p className="text-gray-600 mb-4 text-sm">
              Please enter your admin password to confirm exporting the results.
            </p>

            {/* Password Input with Eye Toggle */}
            <div className="mb-5">
              <label className="block text-sm text-gray-700 mb-1">Password:</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="block w-full pl-3 pr-10 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {showPassword ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    )}
                  </svg>
                </button>
              </div>
              {passwordError && (
                <p className="text-red-600 text-sm mt-2">{passwordError}</p>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 rounded-lg font-medium border bg-gray-500 hover:bg-gray-600 text-white"
                onClick={() => {
                  setShowPasswordConfirm(false)
                  setAdminPassword('')
                  setPasswordError('')
                }}
              >
                Cancel
              </button>
              <button
                className={`px-4 py-2 rounded-lg text-white font-medium ${
                  adminPassword ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-gray-400 cursor-not-allowed'
                }`}
                onClick={async () => {
                  if (!adminPassword) return
                  try {
                    setIsExporting(true)
                    setPasswordError('')
                    // Verify admin password (just like ManageUsers)
                    const auth = getAuth()
                    await reauthenticateWithCredential(
                      auth.currentUser,
                      EmailAuthProvider.credential(auth.currentUser.email, adminPassword)
                    )
                    setShowPasswordConfirm(false)
                    await handleExport()
                    setAdminPassword("");
                    setShowPassword(false);
                    setPasswordError("");
                  } catch (error) {
                    console.error(error)
                    setPasswordError('Incorrect password. Please try again.')
                  } finally {
                    setIsExporting(false)
                  }
                }}
                disabled={!adminPassword || isExporting}
              >
                {isExporting ? 'Verifying…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ViewResults
