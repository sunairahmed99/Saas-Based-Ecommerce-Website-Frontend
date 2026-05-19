import React, { useEffect, useState } from "react";
import { Table, Button, Form } from "react-bootstrap";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import ReusablePagination from "../ReusablePagination";
import "./Users.css";

function Users() {
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState("");
  const [verifyFilter, setVerifyFilter] = useState("all");
  const [activeFilter, setActiveFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const CustomSelect = ({ value, options, onChange, label, style }) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectedOption = options.find(o => o.value === value) || options[0];

    return (
      <div className="custom-select-container" style={{ width: '100%', ...style }}>
        <div 
          className="custom-select-trigger"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span>{selectedOption?.label || label}</span>
          <span>{isOpen ? '▲' : '▼'}</span>
        </div>
        {isOpen && (
          <div className="custom-select-options">
            {options.map(opt => (
              <div 
                key={opt.value}
                className={`custom-select-option ${opt.value === value ? 'selected' : ''}`}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
              >
                {opt.label}
              </div>
            ))}
          </div>
        )}
        {isOpen && <div style={{ position: 'fixed', inset: 0, zIndex: 999 }} onClick={() => setIsOpen(false)} />}
      </div>
    );
  };

  const { data: user = [], isLoading: loading, isError: error } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const token = localStorage.getItem("token")?.replace(/^Bearer\s+/i, "");
      const res = await axios.get(`${API_BASE_URL}/user/getall`, {
        headers: { auth_token: token }
      });
      return res.data?.data || [];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  useEffect(() => {
    if (user && Array.isArray(user)) {
      const mapped = user.map((u) => ({
        id: u._id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        gender: u.gender,
        role: u.role,
        verifyStatus: u.verifiedstatus ? "Verified" : "Pending",
        activeStatus: u.active,
      }));

      setUsers(mapped);
    }
  }, [user]);

  const handleSort = () => {
    const sorted = [...users].sort((a, b) =>
      sortOrder === "asc"
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name)
    );
    setUsers(sorted);
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  const handleToggleActive = (id) => {
    const updated = users.map((u) =>
      u.id === id ? { ...u, activeStatus: !u.activeStatus } : u
    );
    setUsers(updated);
  };

  const filteredUsers = users.filter((u) => {
    const textMatch =
      (u.name?.toLowerCase() || "").includes(filter) ||
      (u.email?.toLowerCase() || "").includes(filter) ||
      (u.phone?.toLowerCase() || "").includes(filter) ||
      (u.role?.toLowerCase() || "").includes(filter) ||
      (u.gender?.toLowerCase() || "").includes(filter);

    const verifyMatch =
      verifyFilter === "all" || u.verifyStatus.toLowerCase() === verifyFilter;

    const activeMatch =
      activeFilter === "all" ||
      (activeFilter === "active" && u.activeStatus) ||
      (activeFilter === "inactive" && !u.activeStatus);

    return textMatch && verifyMatch && activeMatch;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const currentUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, verifyFilter, activeFilter, sortOrder]);

  if (loading) return <h4 className="loadingText">Loading...</h4>;
  if (error) return <h4>Error loading users</h4>;

  return (
    <>

      {/* MAIN UI */}
      <motion.div
        className="animated-container"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          className="admin-users-title"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          Users 👥
        </motion.div>

        <motion.div
          className="filter-section-card"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <div className="search-wrapper">
            <Form.Control
              className="search-input"
              type="text"
              placeholder="🔍 Search users by name, email, phone..."
              value={filter}
              onChange={(e) => setFilter(e.target.value.toLowerCase())}
            />
          </div>

          <div className="filters-row">
            <div className="filter-group">
              <label>Verification</label>
              <CustomSelect
                value={verifyFilter}
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'verified', label: 'Verified' },
                  { value: 'pending', label: 'Pending' }
                ]}
                onChange={(val) => setVerifyFilter(val)}
              />
            </div>

            <div className="filter-group">
              <label>Account Status</label>
              <CustomSelect
                value={activeFilter}
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' }
                ]}
                onChange={(val) => setActiveFilter(val)}
              />
            </div>

            <div className="filter-group action-group">
              <label>&nbsp;</label>
              <motion.button
                className="sort-btn"
                onClick={handleSort}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {sortOrder === "asc" ? "Sort A-Z ↑" : "Sort Z-A ↓"}
              </motion.button>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="table-responsive">
            <Table bordered hover variant="dark" className="glass-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Gender</th>
                <th>Role</th>
                <th>Verify</th>
                <th>Active</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {currentUsers.map((u, i) => {
                const globalIdx = (currentPage - 1) * itemsPerPage + i + 1;
                return (
                <motion.tr
                  key={u.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  whileHover={{ scale: 1.02, backgroundColor: "#2c2c2c" }}
                >
                  <td>{globalIdx}</td>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.phone}</td>
                  <td>{u.gender}</td>
                  <td>{u.role}</td>
                  <td className={u.verifyStatus === "Verified" ? "text-success" : "text-warning"}>
                    {u.verifyStatus}
                  </td>
                  <td className={u.activeStatus ? "text-success" : "text-danger"}>
                    {u.activeStatus ? "Active" : "Inactive"}
                  </td>

                  <td>
                    <motion.button
                      className={u.activeStatus ? "btn-active" : "btn-inactive"}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleToggleActive(u.id)}
                    >
                      {u.activeStatus ? "Active" : "Inactive"}
                    </motion.button>
                  </td>
                </motion.tr>
              );
            })}
            </tbody>
          </Table>
          </div>
        </motion.div>


      </motion.div>
    </>
  );
}

export default Users;
