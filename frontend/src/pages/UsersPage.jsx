import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Search, Edit3, KeyRound, 
  Trash2, ShieldCheck, UserX, UserCheck, CheckCircle2, X, Save, Shield
} from 'lucide-react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { formatBytes, formatDate } from '../utils/formatters';
import ConfirmDialog from '../components/common/ConfirmDialog';

export default function UsersPage() {
  const { user: currentUser, isAdmin, isHOD } = useAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([
    { id: 1, name: 'admin', label: 'Administrator' },
    { id: 2, name: 'hod', label: 'Head of Department (HOD)' },
    { id: 3, name: 'faculty', label: 'Faculty Member' }
  ]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  // Modals state
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);
  const [userToResetPass, setUserToResetPass] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [message, setMessage] = useState('');

  // Form states
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState(3); // Faculty default
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [accountStatus, setAccountStatus] = useState('active');
  const [newPassword, setNewPassword] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    loadUsers();
    loadMeta();
  }, [roleFilter, deptFilter]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await api.get('/users', {
        role: roleFilter,
        department_id: deptFilter,
        search: searchQuery
      });
      setUsers(data.users || []);
    } catch (err) {
      console.warn('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMeta = async () => {
    try {
      const [rData, dData] = await Promise.all([
        api.get('/users/roles'),
        api.get('/departments')
      ]);
      if (rData && rData.roles && rData.roles.length > 0) {
        setRoles(rData.roles.map(r => ({
          ...r,
          label: r.name === 'admin' ? 'Administrator' : r.name === 'hod' ? 'Head of Department (HOD)' : 'Faculty Member'
        })));
      }
      setDepartments(dData.departments || []);
    } catch (e) {
      console.warn('Failed to load meta:', e);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadUsers();
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      setFormError('Only Administrator can create accounts.');
      return;
    }

    setFormLoading(true);
    setFormError('');

    try {
      await api.post('/users', {
        full_name: fullName.trim(),
        username: username.trim(),
        email: email.trim(),
        password: password,
        role_id: Number(selectedRoleId),
        department_id: selectedDeptId ? Number(selectedDeptId) : null,
        status: accountStatus
      });

      setMessage(`User account "${fullName}" created successfully.`);
      setShowAddUserModal(false);
      resetForm();
      loadUsers();
    } catch (err) {
      setFormError(err.message || 'Failed to create user.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!userToEdit) return;

    if (!isAdmin) {
      setFormError('Only Administrator can edit user details and change roles.');
      return;
    }

    setFormLoading(true);
    setFormError('');

    try {
      await api.put(`/users/${userToEdit.id}`, {
        full_name: fullName.trim(),
        username: username.trim(),
        email: email.trim(),
        role_id: Number(selectedRoleId),
        department_id: selectedDeptId ? Number(selectedDeptId) : null,
        status: accountStatus
      });

      setMessage(`User account "${fullName}" updated successfully.`);
      setUserToEdit(null);
      resetForm();
      loadUsers();
    } catch (err) {
      setFormError(err.message || 'Failed to update user.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      const res = await api.patch(`/users/${user.id}/toggle-status`);
      setUsers(prev =>
        prev.map(u => (u.id === user.id ? { ...u, status: res.status } : u))
      );
      setMessage(res.message || 'Status updated.');
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!userToResetPass || !newPassword) return;

    setFormLoading(true);
    setFormError('');

    try {
      const res = await api.post(`/users/${userToResetPass.id}/reset-password`, {
        new_password: newPassword
      });

      setMessage(res.message || 'Password reset successfully.');
      setUserToResetPass(null);
      setNewPassword('');
    } catch (err) {
      setFormError(err.message || 'Failed to reset password.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    try {
      await api.delete(`/users/${userToDelete.id}`);
      setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
      setUserToDelete(null);
      setMessage('User deleted successfully.');
    } catch (err) {
      alert('Failed to delete user: ' + err.message);
    }
  };

  const openEditModal = (u) => {
    setUserToEdit(u);
    setFullName(u.full_name || '');
    setUsername(u.username || '');
    setEmail(u.email || '');
    setSelectedRoleId(u.role_id || 3);
    setSelectedDeptId(u.department_id || '');
    setAccountStatus(u.status || 'active');
    setFormError('');
  };

  const resetForm = () => {
    setFullName('');
    setUsername('');
    setEmail('');
    setPassword('');
    setSelectedRoleId(3);
    setSelectedDeptId('');
    setAccountStatus('active');
    setFormError('');
  };

  return (
    <div className="space-y-5 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Users className="h-5 w-5 text-brand-600" />
            Faculty & HOD User Accounts
          </h2>
          <p className="text-xs text-slate-400">
            {isAdmin 
              ? 'Administrator privilege: Full access to add, edit user profiles, assign roles, and manage credentials.' 
              : 'Viewing department faculty directory and active members.'}
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => { resetForm(); setShowAddUserModal(true); }}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-500/20 hover:from-blue-800 hover:to-indigo-700 transition active:scale-95 cursor-pointer"
          >
            <UserPlus className="h-4 w-4 stroke-[2.5]" />
            <span>Add Faculty / HOD</span>
          </button>
        )}
      </div>

      {message && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-2.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          {message}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center gap-2.5">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, username, email..."
            className="w-full rounded-xl border border-slate-200 bg-white py-1.5 pl-9 pr-3 text-xs text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </form>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          <option value="">All Roles</option>
          <option value="admin">Administrator</option>
          <option value="hod">Head of Department (HOD)</option>
          <option value="faculty">Faculty Member</option>
        </select>

        {isAdmin && (
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.code} - {d.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400 animate-pulse">
          Loading faculty accounts...
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-xs text-slate-400 dark:border-slate-800 dark:bg-slate-900">
          No faculty accounts match the current search filters.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-850 dark:text-slate-400">
              <tr>
                <th className="py-3.5 pl-4 pr-2">User Details</th>
                <th className="px-3 py-3.5">Role</th>
                <th className="px-3 py-3.5">Department</th>
                <th className="px-3 py-3.5">Files & Storage</th>
                <th className="px-3 py-3.5">Status</th>
                <th className="px-3 py-3.5">Joined</th>
                <th className="py-3.5 pl-3 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {users.map((u) => (
                <tr key={u.id} className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="py-3 pl-4 pr-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 text-xs font-bold text-white uppercase shadow-sm">
                        {u.full_name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          {u.full_name}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          @{u.username} • {u.email}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-3 py-3">
                    <span className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                      u.role_name === 'admin'
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        : u.role_name === 'hod'
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                        : 'bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-300'
                    }`}>
                      {u.role_name}
                    </span>
                  </td>

                  <td className="px-3 py-3">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {u.department_code || u.department_name || '—'}
                    </span>
                  </td>

                  <td className="px-3 py-3 text-slate-600 dark:text-slate-400">
                    <span className="font-medium">{u.file_count || 0} files</span>
                    <span className="text-[10px] text-slate-400 block">{formatBytes(u.storage_used || 0)}</span>
                  </td>

                  <td className="px-3 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      u.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${u.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      {u.status}
                    </span>
                  </td>

                  <td className="px-3 py-3 text-slate-500">
                    {formatDate(u.created_at)}
                  </td>

                  <td className="py-3 pl-3 pr-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {isAdmin ? (
                        <>
                          <button
                            onClick={() => openEditModal(u)}
                            className="flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-brand-50 hover:text-brand-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                            title="Edit User Details & Role"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            Edit
                          </button>
                          <button
                            onClick={() => { setUserToResetPass(u); setNewPassword(''); setFormError(''); }}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                            title="Reset Password"
                          >
                            <KeyRound className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(u)}
                            className={`rounded-lg p-1.5 ${
                              u.status === 'active' 
                                ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50'
                                : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50'
                            }`}
                            title={u.status === 'active' ? 'Disable Account' : 'Enable Account'}
                          >
                            {u.status === 'active' ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                          </button>
                          {u.id !== currentUser.id && (
                            <button
                              onClick={() => setUserToDelete(u)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50 dark:hover:text-rose-400"
                              title="Delete User"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </>
                      ) : (
                        <button
                          onClick={() => openEditModal(u)}
                          className="rounded-lg px-2.5 py-1 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          View
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit User Modal */}
      {(showAddUserModal || userToEdit) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100 text-brand-600 dark:bg-brand-950 dark:text-brand-400">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                    {userToEdit ? (isAdmin ? 'Edit User Account' : 'User Account Details') : 'Create New Faculty / HOD Account'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {isAdmin ? 'Admin can configure user details, department, and role permissions.' : 'Read-only user profile.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setShowAddUserModal(false); setUserToEdit(null); }}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 rounded-xl bg-rose-50 p-2.5 text-xs text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                {formError}
              </div>
            )}

            <form onSubmit={userToEdit ? handleUpdateUser : handleCreateUser} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Full Name</label>
                  <input
                    type="text"
                    required
                    disabled={!isAdmin}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Dr. Ravi Kumar"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Username</label>
                  <input
                    type="text"
                    required
                    disabled={!isAdmin}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. dr.ravi"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Email Address</label>
                  <input
                    type="email"
                    required
                    disabled={!isAdmin}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ravi.kumar@abc.edu"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 disabled:opacity-60"
                  />
                </div>
                {!userToEdit && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Temporary Password</label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    System Role {isAdmin ? '(Admin Only: Change Role)' : '(Assigned Role)'}
                  </label>
                  <select
                    value={selectedRoleId}
                    disabled={!isAdmin}
                    onChange={(e) => setSelectedRoleId(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 disabled:opacity-60"
                  >
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.label || r.name.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Assigned Department</label>
                  <select
                    value={selectedDeptId}
                    disabled={!isAdmin}
                    onChange={(e) => setSelectedDeptId(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 disabled:opacity-60"
                  >
                    <option value="">No Department (Admin)</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.code} - {d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Account Status</label>
                <select
                  value={accountStatus}
                  disabled={!isAdmin}
                  onChange={(e) => setAccountStatus(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 disabled:opacity-60"
                >
                  <option value="active">Active (Can Log In)</option>
                  <option value="disabled">Disabled (Access Blocked)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => { setShowAddUserModal(false); setUserToEdit(null); }}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                {isAdmin ? (
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-brand-500/25 hover:from-brand-700 hover:to-indigo-700 disabled:opacity-50"
                  >
                    <Save className="h-3.5 w-3.5" />
                    {formLoading ? 'Saving...' : userToEdit ? 'Save Changes' : 'Create Account'}
                  </button>
                ) : (
                  <span className="text-xs text-slate-400 italic">Only Administrator can save user edits</span>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {userToResetPass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                Reset Password for {userToResetPass.full_name}
              </h3>
              <button onClick={() => setUserToResetPass(null)} className="rounded-full p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 rounded-xl bg-rose-50 p-2.5 text-xs text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                {formError}
              </div>
            )}

            <form onSubmit={handleResetPassword} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  New Temporary Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter at least 6 characters"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setUserToResetPass(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading || !newPassword}
                  className="rounded-xl bg-brand-600 px-5 py-2 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
                >
                  {formLoading ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(userToDelete)}
        title="Delete User Account"
        message={`Are you sure you want to delete user "${userToDelete?.full_name}" (@${userToDelete?.username})?`}
        confirmText="Delete User"
        isDanger={true}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
