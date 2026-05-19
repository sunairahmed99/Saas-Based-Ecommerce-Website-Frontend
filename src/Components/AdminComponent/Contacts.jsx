import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import ReusablePagination from "../ReusablePagination";

const Contacts = () => {
  const token = localStorage.getItem("token")?.replace(/^Bearer\s+/i, "");

  const { data: contacts = [], isLoading: loading, error: queryError } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE_URL}/contact/getall`, {
        headers: { auth_token: token }
      });
      return res.data?.data || res.data || [];
    },
    staleTime: 10 * 60 * 1000,
  });

  const error = queryError?.response?.data?.message || queryError?.message || null;
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredContacts = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return contacts || [];
    return (contacts || []).filter((c) => {
      return (
        (c.name || "").toLowerCase().includes(q) ||
        (c.email || "").toLowerCase().includes(q) ||
        (c.subject || "").toLowerCase().includes(q) ||
        (c.message || "").toLowerCase().includes(q)
      );
    });
  }, [contacts, search]);

  const totalPages = Math.ceil(filteredContacts.length / itemsPerPage);
  const currentContacts = filteredContacts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  return (
    <div className="admin-card">
      <style>{`
        .admin-card {
          padding: 0;
          background: transparent;
          max-width: 100%;
        }
        .contacts-title {
          font-size: 1.1rem !important; font-weight: 800; color: #00eaff;
          text-shadow: 0 3px 24px #00eaff11; letter-spacing: 1.2px;
          margin-bottom: 20px;
        }
        @media (max-width: 768px) {
          .contacts-title { font-size: 1.1rem !important; }
        }
        .admin-toolbar {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
          align-items: center;
          margin-bottom: 16px;
        }
        .admin-input {
          background: #1c263a;
          color: #e6f0fd;
          border: 1px solid #334155;
          border-radius: 10px;
          padding: 9px 12px;
          min-width: 220px;
          font-weight: 600;
          outline: none;
        }
        .contacts-table {
          width: 100%;
          border-collapse: collapse;
          color: #dbeafe;
          table-layout: auto;
          min-width: 1000px;
        }
        .contacts-table th,
        .contacts-table td {
          padding: 12px 18px;
          border-bottom: 1px solid #223042;
          text-align: left;
          white-space: nowrap;
        }
        .contacts-table th {
          background: #0f1e38;
          color: #53e5ff;
          text-transform: uppercase;
          font-size: 0.85rem;
        }
        .contacts-table tr:hover {
          background: rgba(59, 130, 246, 0.08);
        }
        .tag {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 8px;
          background: #1d4ed8;
          color: #e0f2fe;
          font-size: 0.86rem;
        }
        .table-responsive-container {
          overflow-x: auto;
          background: rgba(15, 23, 42, 0.8);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .glass-table {
          min-width: 1000px;
        }
        .empty {
          text-align: center; padding: 1rem; color: #9ca3af; }
        .error {
          color: #fca5a5; margin-bottom: 10px; }
      `}</style>
      <h3 className="contacts-title">Contact Queries</h3>
      <div className="admin-toolbar">
        <input
          className="admin-input"
          type="text"
          placeholder="Search name, email, subject, message..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {error && <div className="error">{error}</div>}
      {loading ? (
        <div>Loading...</div>
      ) : filteredContacts.length === 0 ? (
        <div className="empty">No contact queries yet.</div>
      ) : (
        <div className="table-responsive-container">
          <table className="glass-table contacts-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Subject</th>
                <th>Message</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {currentContacts.map((c) => (
                <tr key={c._id || c.id || c.email + c.createdAt}>
                  <td style={{ fontWeight: 600 }}>{c.name || "-"}</td>
                  <td style={{ color: '#94a3b8' }}>{c.email || "-"}</td>
                  <td><span className="tag">{c.subject || "General"}</span></td>
                  <td style={{ fontSize: '0.85rem', opacity: 0.8 }}>{c.message || "-"}</td>
                  <td style={{ fontSize: '0.85rem' }}>{c.createdAt ? new Date(c.createdAt).toLocaleString() : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <ReusablePagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
};

export default Contacts;

