import React, { useState, useEffect } from "react";
import { ref, get, set, remove } from "firebase/database";
import { db } from "../firebase";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import NavBar from "./NavBar";
import { useAuth } from '../contexts/AuthContext'
import { getAuth, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth"
import { logActivity } from "../utils/logActivity";

export default function ElectionArchives() {
  const { userData } = useAuth();
  const [isArchiving, setIsArchiving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [archiveTitle, setArchiveTitle] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [archives, setArchives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [archivePassword, setArchivePassword] = useState("");
  const [archivePasswordError, setArchivePasswordError] = useState("");
  const [showArchivePassword, setShowArchivePassword] = useState(false);
  const [downloadPassword, setDownloadPassword] = useState("");
  const [downloadPasswordError, setDownloadPasswordError] = useState("");
  const [showDownloadPassword, setShowDownloadPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [selectedArchive, setSelectedArchive] = useState(null);

  // ----- IMPORTANT: define loadArchives before useEffect so it can be called -----
  const loadArchives = async () => {
    setLoading(true);
    try {
      const snap = await get(ref(db, "electionArchives"));
      const tree = snap.val() || {};
      const list = [];

      for (const yearKey of Object.keys(tree)) {
        const yearNode = tree[yearKey] || {};
        for (const tsKey of Object.keys(yearNode)) {
          const entry = yearNode[tsKey];
          const meta = entry?.metadata || {};
          list.push({
            tableId: `${yearKey}_${tsKey}`,
            year: yearKey,
            ts: tsKey,
            title: meta.title || "Untitled",
            archivedAt: meta.archivedAt || "",
            archivedBy: meta.archivedBy || "",
            fullData: entry,
          });
        }
      }

      list.sort((a, b) => {
        const ta = a.archivedAt ? Date.parse(a.archivedAt) : Number(a.ts || 0);
        const tb = b.archivedAt ? Date.parse(b.archivedAt) : Number(b.ts || 0);
        return tb - ta;
      });

      setArchives(list);
    } catch (err) {
      console.error("loadArchives error:", err);
      setArchives([]);
    } finally {
      setLoading(false);
    }
  };

  // Wait for userData and only load if superadmin
  useEffect(() => {
    if (!userData) {
      // still waiting for auth context
      return;
    }
    if (userData.role !== "superadmin") {
      // non-superadmin: don't attempt to load archives
      setLoading(false);
      return;
    }
    // superadmin -> load archives
    loadArchives();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData]);

  // Access control + loading UI order:
  // 1) if no userData yet -> spinner
  if (!userData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-900"></div>
      </div>
    );
  }

  // 2) userData present but not superadmin -> Access Denied
  if (userData.role !== "superadmin") {
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
    );
  }

  // 3) superadmin but archives are still loading -> spinner
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-900"></div>
      </div>
    );
  }

  // ---------- Helpers ----------
  const flattenCandidacyApplications = (nestedObj) => {
    const rows = [];
    for (const userId of Object.keys(nestedObj || {})) {
      const apps = nestedObj[userId] || {};
      for (const appId of Object.keys(apps)) {
        const item = apps[appId] || {};
        const applicant = item.applicant || {};
        const appointment = item.appointment || item.screeningAppointment || {};
        const statusObj = item.status || {};
        const candidacyStatus =
          statusObj.status ||
          statusObj.decision ||
          item.status ||
          item.applicationStatus ||
          "";

        rows.push({
          "Application ID": appId,
          "Applicant UID": userId,
          "Applicant Name":
            applicant.fullName ||
            `${applicant.firstName || ""} ${applicant.lastName || ""}`.trim() ||
            "",
          "Student ID": applicant.studentId || "",
          Email: applicant.email || "",
          Institute: applicant.institute || applicant.department || "",
          "Appointment Date":
            appointment.dateTime ||
            appointment.date ||
            appointment.scheduledAt ||
            "",
          "Appointment Status":
            appointment.status || appointment.decision || "",
          "Candidacy Status": candidacyStatus,
          "Created At": item.createdAt || item.submittedAt || "",
          "_raw": JSON.stringify(item),
        });
      }
    }
    return rows;
  };

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

  const electionVotesToTableRows = (votesObj) => {
    if (!votesObj) return { rows: [], positions: [] };

    const positions = [
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
      "Governor",
      "Vice Governor",
      "Board Member on Records",
      "Board Member on Finance",
      "Board Member on Audit",
      "Board Member on Publication",
      "Board Member on Public Relation",
      "Board Member on Resources",
    ];

    const rows = [];

    for (const voterName of Object.keys(votesObj)) {
      const r = votesObj[voterName] || {};
      const row = {
        "Voter Name": r["Voter Name"] || voterName,
        "Student ID": r["Student ID"] || "",
        Email: r["Email"] || "",
        Institute: r["Institute"] || "",
        "Submitted At": r["Submitted At"] || "",
      };

      // ensure fixed columns exist even if empty
      for (const pos of positions) row[pos] = r[pos] || "";

      rows.push(row);
    }

    return {
      rows,
      positions: [
        "Voter Name",
        "Student ID",
        "Email",
        "Institute",
        "Submitted At",
        ...positions,
      ],
    };
  };

  // ---------- Archive operation ----------
  const handleArchiveElection = async () => {
    if (!archiveTitle.trim()) {
      setMessage("Please enter an archive title before proceeding.");
      setMessageType("error");
      return;
    }

    setShowConfirm(false);
    setIsArchiving(true);
    setMessage("");
    setMessageType("");

    try {
      const year = new Date().getFullYear();
      const ts = Date.now();
      const archivePathRef = ref(db, `electionArchives/${year}/${ts}`);

      const [
        candidacySnap,
        appointmentSnap,
        usersSnap,
        logsSnap,
        votingStatusSnap,
        candidacyStatusSnap,
        campaignStatusSnap,
        announcementsSnap,
        newsSnap,
        candidatesSnap,
        votesSnap,
      ] = await Promise.all([
        get(ref(db, "candidacyApplications")),
        get(ref(db, "screeningAppointments")),
        get(ref(db, "users")),
        get(ref(db, "activityLogs")),
        get(ref(db, "votingStatus")),
        get(ref(db, "candidacyStatus")),
        get(ref(db, "campaignStatus")),
        get(ref(db, "announcements")),
        get(ref(db, "news")),
        get(ref(db, "candidates")),
        get(ref(db, "electionVotes")),
      ]);

      const candidacyRaw = candidacySnap.val() || {};
      const usersData = usersSnap.val() || {};
      const votesRaw = votesSnap.val() || {};
      const candidatesData = candidatesSnap.val() || {};

      // build uid->name and candidateInfo maps
      const uidToName = {};
      const candidateInfo = {};

      for (const uid of Object.keys(usersData)) {
        const u = usersData[uid] || {};
        const first = (u.firstName || "").trim();
        const last = (u.lastName || "").trim();

        const formattedName = u.fullName
          ? u.fullName.trim()
          : (first && last ? `${first} ${last}` : uid);

        uidToName[uid] = formattedName;
      }

      for (const cid of Object.keys(candidatesData)) {
        const c = candidatesData[cid] || {};
        const first = (c.firstName || "").trim().toUpperCase();
        const last = (c.lastName || "").trim().toUpperCase();

        const formattedName = last && first
          ? `${last}, ${first}`
          : (c.fullName ? c.fullName.toUpperCase() : cid);

        uidToName[cid] = formattedName;
        candidateInfo[cid] = {
          name: formattedName,
          position: c.position || "Unknown Position",
          institute: c.institute || "",
        };
      }          

      // build readable votes keyed by voter name (convert ids to readable names)
      const readableVotes = {};
      for (const voterUid of Object.keys(votesRaw)) {
        const voterNode = usersData[voterUid] || {};
        const voterName = uidToName[voterUid] || voterUid;
        const voterRecord = votesRaw[voterUid] || {};
        const submittedAt = voterRecord.submittedAt || "";
        const positionsObj = voterRecord.votes || {};
        const voterInstitute = (voterNode.institute || voterNode.voterInstitute || "").trim();

        const row = {
          "Voter Name": voterName,
          "Student ID": voterNode.studentId || voterNode.voterstudentId || "",
          Email: voterNode.email || voterNode.voterEmail || "",
          Institute: voterInstitute,
          "Submitted At": submittedAt,
        };

        for (const [rawPositionKey, candidateIdOrIds] of Object.entries(positionsObj)) {
          // raw keys can be "Institute of ... - Position" or just "Position"
          let position = rawPositionKey;
          if (rawPositionKey.includes("-")) {
            const parts = rawPositionKey.split("-");
            position = parts[parts.length - 1].trim();
          }

          const idsArr = Array.isArray(candidateIdOrIds)
            ? candidateIdOrIds
            : [candidateIdOrIds];

          // Map candidate IDs to names (if candidateInfo present)
          const candidateNames = idsArr
            .filter(Boolean)
            .map((cid) => uidToName[cid] || "Unknown Candidate");

          // place under normalized position column
          row[position] = candidateNames.join(", ");
        }

        readableVotes[voterName] = row;
      }

      const readableData = {
        candidacyApplications: candidacyRaw,
        screeningAppointments: appointmentSnap.val() || {}, 
        users: usersData,
        activityLogs: logsSnap.val() || {},
        votingStatus: votingStatusSnap.val() || {},
        candidacyStatus: candidacyStatusSnap.val() || {},
        campaignStatus: campaignStatusSnap.val() || {},
        announcements: announcementsSnap.val() || {},
        news: newsSnap.val() || {},
        candidates: candidatesData,
        electionVotes: readableVotes,
      };

      const archiveObject = {
        metadata: {
          title: archiveTitle,
          archivedAt: new Date().toISOString(),
          archivedBy: userData.fullName || "superadmin",
        },
        readableData,
        rawData: {
          candidacyApplications: candidacyRaw,
          screeningAppointments: appointmentSnap.val() || {}, 
          users: usersData,
          activityLogs: logsSnap.val() || {},
          votingStatus: votingStatusSnap.val() || {},
          candidacyStatus: candidacyStatusSnap.val() || {},
          campaignStatus: campaignStatusSnap.val() || {},
          announcements: announcementsSnap.val() || {},
          news: newsSnap.val() || {},
          candidates: candidatesData,
          electionVotes: votesRaw,
        },
      };

      // revert candidate roles -> voter (if you want)
      const updatedUsers = {};
      for (const uid of Object.keys(usersData)) {
        const u = usersData[uid];
        if (u && u.role === "candidate") updatedUsers[uid] = { ...u, role: "voter" };
        else updatedUsers[uid] = u;
      }

      await set(archivePathRef, archiveObject);
      await set(ref(db, "users"), updatedUsers);

      // clear live election data (use your current DB keys)
      await Promise.all([
        remove(ref(db, "candidacyApplications")),
        remove(ref(db, "screeningAppointments")),
        remove(ref(db, "activityLogs")),
        remove(ref(db, "votingStatus")),
        remove(ref(db, "candidacyStatus")),
        remove(ref(db, "campaignStatus")),
        remove(ref(db, "campaignSubmissions")),
        remove(ref(db, "announcements")),
        remove(ref(db, "news")),
        remove(ref(db, "candidates")),
        remove(ref(db, "electionVotes")),
      ]);

      try {
        await logActivity(
          userData.fullName,
          `Archived election "${archiveTitle}"`
        );
      } catch (err) {
        console.error("Could not write archive log:", err);
      }

      setMessage(`Election archived successfully: "${archiveTitle}"`);
      setMessageType("success");
      setArchiveTitle("");
      await loadArchives();
    } catch (err) {
      console.error("archive error:", err);
      setMessage("Failed to archive election. Check console for details.");
      setMessageType("error");
    } finally {
      setIsArchiving(false);
    }
  };

  // ---------- Build and download Excel ----------
  const handleDownloadArchive = (archiveRow) => {
    const readableData = archiveRow.fullData?.readableData;
    if (!readableData) {
      console.warn("No readableData found in archive");
      return;
    }

    const wb = XLSX.utils.book_new();

    // 1) CANDIDACY APPLICATIONS flattened
    const nestedCandidacy = readableData.candidacyApplications || {};
    const candidacyFlattenedRows = flattenCandidacyApplications(nestedCandidacy);
    const wsCand = XLSX.utils.json_to_sheet(candidacyFlattenedRows);
    autoFitColumns(wsCand);
    wsCand['!protect'] = {
      password: "readonly",
      selectLockedCells: true,
      selectUnlockedCells: true
    };
    XLSX.utils.book_append_sheet(wb, wsCand, "CandidacyApplications");

    // 2) ELECTION VOTES — rows have fixed position columns
    const votesObj = readableData.electionVotes || {};
    const { rows: voteRows } = electionVotesToTableRows(votesObj);
    const wsVotes = XLSX.utils.json_to_sheet(voteRows);
    autoFitColumns(wsVotes);
    wsVotes['!protect'] = {
      password: "readonly",
      selectLockedCells: true,
      selectUnlockedCells: true
    };
    XLSX.utils.book_append_sheet(wb, wsVotes, "ElectionVotes");

     // 3) SCREENING APPOINTMENTS – formatted with slot + availability
    const appointmentsObj = readableData.screeningAppointments || {};
    const slots = appointmentsObj.slots || {};

    const slotRows = Object.keys(slots).map((slotKey) => ({
      "Slot Date/Time": slotKey,
      "Available": slots[slotKey]?.available === true ? "true" : "false",
      "Venue": slots[slotKey]?.venue || "No venue set",
    }));

    const wsAppointments = XLSX.utils.json_to_sheet(slotRows);
    autoFitColumns(wsAppointments);
    wsAppointments['!protect'] = {
      password: "readonly",
      selectLockedCells: true,
      selectUnlockedCells: true
    };
    XLSX.utils.book_append_sheet(wb, wsAppointments, "ScreeningAppointments");

    // 4) Other collections — use exact keys from readableData
    const otherKeys = [
      "screeningAppointments",
      "activityLogs",
      "votingStatus",
      "candidacyStatus",
      "campaignStatus",
      "announcements",
      "news",
      "candidates",
      "users",
    ];

    const prettySheetName = (k) => {
      // Make a friendly sheet name
      return k
        .replace(/([A-Z])/g, " $1")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (s) => s.toUpperCase())
        .trim();
    };

    for (const key of otherKeys) {
      const obj = readableData[key];
      const rows = obj
        ? Object.keys(obj).map((id) =>
            typeof obj[id] === "object" ? { id, ...obj[id] } : { id, value: obj[id] }
          )
        : [];
      const ws = XLSX.utils.json_to_sheet(rows);
      autoFitColumns(ws);
      ws['!protect'] = {
        password: "readonly",
        selectLockedCells: true,
        selectUnlockedCells: true
      };
      XLSX.utils.book_append_sheet(wb, ws, prettySheetName(key).slice(0, 31)); // Excel sheet name limit
    }

    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const filename =
      (archiveRow.title || "election_archive").replace(/\s+/g, "_") + ".xlsx";
    saveAs(new Blob([wbout], { type: "application/octet-stream" }), filename);
  };

  // ---------- Render ----------
  return (
    <>
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="pt-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Archive creation */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-red-900">Election Archives</h1>
            <p className="text-gray-600 mt-1">Archive all election data and reset the system for the next cycle.</p>
          </div>

          <div className="mb-6">
              <div className="mb-2">
                <label className="block text-base font-medium text-gray-900 mb-1">Archive Title</label>
                <input
                  type="text"
                  value={archiveTitle}
                  onChange={(e) => setArchiveTitle(e.target.value)}
                  placeholder="e.g., MaCipanyulungCa2025"
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              

              {message && (
                <div className={`mb-4 p-3 rounded text-sm ${messageType === "success" ? "bg-green-100 text-green-800 border border-green-300" : "bg-red-100 text-red-800 border border-red-300"}`}>
                  {message}
                </div>
              )}

              <div className="flex gap-3 justify-end">
                <button
                  className={`${archiveTitle.trim() ? "bg-red-800 hover:bg-red-900" : "bg-gray-400 cursor-not-allowed"} text-white px-5 py-2 rounded-lg font-medium transition`}
                  onClick={() => archiveTitle.trim() && setShowConfirm(true)}
                  disabled={!archiveTitle.trim() || isArchiving}
                >
                  {isArchiving ? "Archiving..." : "Archive Election"}
                </button>
              </div>
          </div>

        {/* Archive list */}
        <div className="bg-white shadow-md border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Archived Elections</h2>
          <div className="overflow-x-auto rounded-lg shadow border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Archived At</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {archives.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center text-gray-500 py-6">No archives available.</td>
                  </tr>
                ) : (
                  archives.map((arc) => (
                    <tr key={arc.tableId} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{arc.year}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{arc.title}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{arc.archivedAt ? new Date(arc.archivedAt).toLocaleString() : ""}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          className="px-3 py-1 rounded-lg font-medium text-white text-sm bg-green-600 hover:bg-green-700 transition"
                          onClick={() => {
                            setSelectedArchive(arc);
                            setShowPasswordConfirm(true);
                          }}
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
      </div>
      </div>
      
        {/* Confirm modal */}
        {/* {showConfirm && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Confirm Archive</h3>
              <p className="text-gray-600 mb-4 text-sm">
                You are about to archive:
                <div className="my-2">
                  <span className="font-semibold text-2xl text-gray-900">
                    {archiveTitle || "Untitled Election"}
                  </span>
                </div>
                This will move all election data into archives and reset the system for the next election. 
                <span className="font-semibold text-red-700"> This action cannot be undone.</span>
              </p> */}

              {/* ✅ Confirmation input */}
              {/* <div className="mb-5">
                <label className="block text-sm text-gray-700 mb-1">
                  Please type <span className="font-bold text-red-700">CONFIRM</span> to proceed:
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Type CONFIRM"
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-700"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  className="px-4 py-2 rounded-lg font-medium border hover:bg-gray-600 bg-gray-500 text-white"
                  onClick={() => {
                    setShowConfirm(false);
                    setConfirmText("");
                  }}
                >
                  Cancel
                </button>
                <button
                  className={`px-4 py-2 rounded-md text-white font-medium ${
                    confirmText === "CONFIRM"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-gray-400 cursor-not-allowed"
                  }`}
                  onClick={handleArchiveElection}
                  disabled={confirmText !== "CONFIRM"}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )} */}

        {showConfirm && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Confirm Archive</h3>
              <p className="text-gray-600 mb-4 text-sm">
                Please enter your admin password to archive:
                <div className="my-2">
                  <span className="font-semibold text-2xl text-gray-900">
                    {archiveTitle || "Untitled Election"}
                  </span>
                </div>
              </p>

              {/* Password input */}
              <div className="mb-5">
                <label className="block text-sm text-gray-700 mb-1">Password:</label>
                <div className="relative">
                  <input
                    type={showArchivePassword ? "text" : "password"}
                    placeholder="Enter password"
                    value={archivePassword}
                    onChange={(e) => setArchivePassword(e.target.value)}
                    className="block w-full pl-3 pr-10 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900"
                  />

                  <button
                    type="button"
                    onClick={() => setShowArchivePassword(!showArchivePassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      {showArchivePassword ? (
                        // Eye OFF icon (hide password)
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                        />
                      ) : (
                        // Eye ON icon (show password)
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

                {archivePasswordError && (
                  <p className="text-red-600 text-sm mt-2">{archivePasswordError}</p>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <button
                  className="px-4 py-2 rounded-lg font-medium border bg-gray-500 hover:bg-gray-600 text-white"
                  onClick={() => {
                    setShowConfirm(false);
                    setArchivePassword("");
                    setArchivePasswordError("");
                  }}
                >
                  Cancel
                </button>

                <button
                  className={`px-4 py-2 rounded-md text-white font-medium ${
                    archivePassword ? "bg-emerald-600 hover:bg-emerald-700" : "bg-gray-400 cursor-not-allowed"
                  }`}
                  onClick={async () => {
                    if (!archivePassword) return;
                    try {
                      setIsVerifying(true);
                      setArchivePasswordError("");

                      const auth = getAuth();
                      await reauthenticateWithCredential(
                        auth.currentUser,
                        EmailAuthProvider.credential(auth.currentUser.email, archivePassword)
                      );

                      setShowConfirm(false);
                      await handleArchiveElection();

                      setArchivePassword(""); 
                      setArchivePasswordError(""); 
                    } catch (error) {
                      console.error(error);
                      setArchivePasswordError("Incorrect password. Please try again.");
                    } finally {
                      setIsVerifying(false);
                    }
                  }}
                  disabled={!archivePassword || isVerifying}
                >
                  {isVerifying ? "Verifying…" : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {showPasswordConfirm && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Confirm Download</h3>
              <p className="text-gray-600 mb-4 text-sm">
                Please enter your admin password to download the archive file.
              </p>

              <div className="mb-5">
                <label className="block text-sm text-gray-700 mb-1">Password:</label>
                <div className="relative">
                  <input
                    type={showDownloadPassword ? "text" : "password"}
                    placeholder="Enter password"
                    value={downloadPassword}
                    onChange={(e) => setDownloadPassword(e.target.value)}
                    className="block w-full pl-3 pr-10 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900"
                  />

                  <button
                    type="button"
                    onClick={() => setShowDownloadPassword(!showDownloadPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      {showDownloadPassword ? (
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

                {downloadPasswordError && (
                  <p className="text-red-600 text-sm mt-2">{downloadPasswordError}</p>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <button
                  className="px-4 py-2 rounded-lg font-medium border bg-gray-500 hover:bg-gray-600 text-white"
                  onClick={() => {
                    setShowPasswordConfirm(false);
                    setDownloadPassword("");
                    setDownloadPasswordError("");
                    setSelectedArchive(null);
                  }}
                >
                  Cancel
                </button>

                <button
                  className={`px-4 py-2 rounded-lg text-white font-medium ${
                    downloadPassword ? "bg-emerald-600 hover:bg-emerald-700" : "bg-gray-400 cursor-not-allowed"
                  }`}
                  onClick={async () => {
                    if (!downloadPassword) return;
                    try {
                      setIsVerifying(true);
                      setDownloadPasswordError("");

                      const auth = getAuth();
                      await reauthenticateWithCredential(
                        auth.currentUser,
                        EmailAuthProvider.credential(auth.currentUser.email, downloadPassword)
                      );

                      await logActivity(
                        auth.currentUser.uid,
                        `${userData.fullName || "Unknown User"} downloaded archive "${selectedArchive.title}"`
                      );

                      setShowPasswordConfirm(false);
                      await handleDownloadArchive(selectedArchive);

                      setSelectedArchive(null);
                      setDownloadPassword(""); 
                      setDownloadPasswordError(""); 
                    } catch (error) {
                      console.error(error);
                      setDownloadPasswordError("Incorrect password. Please try again.");
                    } finally {
                      setIsVerifying(false);
                    }
                  }}
                  disabled={!downloadPassword || isVerifying}
                >
                  {isVerifying ? "Verifying…" : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
