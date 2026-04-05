'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

type TeamMember = {
  id: number;
  staffId: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  phone: string | null;
  department: string | null;
  isActive: boolean;
  createdAt: string;
};

type AvailableStaff = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
};

const emptyNewStaff = {
  firstName: '',
  lastName: '',
  email: '',
  username: '',
  password: '',
  role: 'nurse' as string,
  phone: '',
  department: '',
};

export default function TeamPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role || '';
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [availableStaff, setAvailableStaff] = useState<AvailableStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Add existing modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState('');

  // Create new staff modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newStaff, setNewStaff] = useState(emptyNewStaff);
  const [creating, setCreating] = useState(false);

  // Edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState<TeamMember | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchTeam = async () => {
    try {
      const res = await fetch('/api/team');
      const json = await res.json();
      if (json.success) setTeam(json.data || []);
    } catch {
      setError('Failed to load team');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableStaff = async () => {
    try {
      const [nursesRes, secRes] = await Promise.all([
        fetch('/api/users?role=nurse'),
        fetch('/api/users?role=secretariat'),
      ]);
      const [nursesJson, secJson] = await Promise.all([nursesRes.json(), secRes.json()]);
      const all = [...(nursesJson.data || []), ...(secJson.data || [])];
      const teamStaffIds = team.map((t) => t.staffId);
      setAvailableStaff(all.filter((s: AvailableStaff) => !teamStaffIds.includes(s.id)));
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  useEffect(() => {
    if (showAddModal) fetchAvailableStaff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAddModal, team]);

  const clearMessages = () => { setError(''); setSuccess(''); };

  const handleAdd = async () => {
    if (!selectedStaffId) return;
    clearMessages();
    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId: parseInt(selectedStaffId) }),
      });
      const json = await res.json();
      if (json.success) {
        setShowAddModal(false);
        setSelectedStaffId('');
        setSuccess('Staff member added to your team');
        fetchTeam();
      } else {
        setError(json.message || json.error || 'Failed to add member');
      }
    } catch {
      setError('Network error');
    }
  };

  const handleCreate = async () => {
    clearMessages();
    if (!newStaff.firstName || !newStaff.lastName || !newStaff.email || !newStaff.username || !newStaff.password) {
      setError('Please fill in all required fields');
      return;
    }
    setCreating(true);
    try {
      const res = await fetch('/api/team/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStaff),
      });
      const json = await res.json();
      if (json.success) {
        setShowCreateModal(false);
        setNewStaff(emptyNewStaff);
        setSuccess('Staff member created and added to your team');
        fetchTeam();
      } else {
        setError(json.message || json.error || 'Failed to create staff member');
      }
    } catch {
      setError('Network error');
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = (member: TeamMember) => {
    clearMessages();
    setEditData({ ...member });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editData) return;
    clearMessages();
    setSaving(true);
    try {
      const res = await fetch('/api/team/staff', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffId: editData.staffId,
          firstName: editData.firstName,
          lastName: editData.lastName,
          email: editData.email,
          phone: editData.phone || '',
          department: editData.department || '',
          isActive: editData.isActive,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setShowEditModal(false);
        setEditData(null);
        setSuccess('Staff member updated');
        fetchTeam();
      } else {
        setError(json.message || json.error || 'Failed to update staff member');
      }
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (member: TeamMember) => {
    clearMessages();
    const action = member.isActive ? 'deactivate' : 'activate';
    if (!confirm(`${member.isActive ? 'Deactivate' : 'Activate'} ${member.firstName} ${member.lastName}?`)) return;
    try {
      const res = await fetch('/api/team/staff', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId: member.staffId, isActive: !member.isActive }),
      });
      const json = await res.json();
      if (json.success) {
        setSuccess(`Staff member ${action}d`);
        fetchTeam();
      } else {
        setError(json.message || `Failed to ${action} staff member`);
      }
    } catch {
      setError('Network error');
    }
  };

  const handleRemove = async (staffId: number, name: string) => {
    clearMessages();
    if (!confirm(`Remove ${name} from your team?`)) return;
    try {
      const res = await fetch('/api/team', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId }),
      });
      const json = await res.json();
      if (json.success) {
        setSuccess(`${name} removed from your team`);
        fetchTeam();
      } else setError(json.message || 'Failed to remove member');
    } catch {
      setError('Network error');
    }
  };

  if (role !== 'doctor') {
    return (
      <div className="p-8 text-center text-slate-500">
        Team management is only available for doctors.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-900">My Team</h1>
        <div className="flex gap-3">
          <button onClick={() => { clearMessages(); setShowCreateModal(true); }} className="btn-primary">
            + Create Staff Member
          </button>
          <button onClick={() => { clearMessages(); setShowAddModal(true); }} className="btn-secondary">
            + Add Existing Staff
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">{success}</div>}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading team...</div>
        ) : team.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No team members yet. Create new staff or add existing ones to your team.
          </div>
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {team.map((member) => (
                  <tr key={member.id}>
                    <td className="font-medium">{member.firstName} {member.lastName}</td>
                    <td>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        member.role === 'nurse' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {member.role}
                      </span>
                    </td>
                    <td>{member.email}</td>
                    <td>{member.phone || '—'}</td>
                    <td>{member.department || '—'}</td>
                    <td>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        member.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {member.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(member)}
                          className="text-blue-600 hover:underline text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleActive(member)}
                          className={`text-sm hover:underline ${member.isActive ? 'text-orange-600' : 'text-green-600'}`}
                        >
                          {member.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleRemove(member.staffId, `${member.firstName} ${member.lastName}`)}
                          className="text-red-600 hover:underline text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Existing Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Add Existing Staff Member</h2>
            <p className="text-sm text-gray-500 mb-4">
              Select a nurse or secretariat staff member to add to your team.
            </p>
            {availableStaff.length === 0 ? (
              <p className="text-gray-500">No available staff members to add.</p>
            ) : (
              <select
                className="form-input mb-4"
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
              >
                <option value="">Select staff member...</option>
                {availableStaff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.firstName} {s.lastName} ({s.role})
                  </option>
                ))}
              </select>
            )}
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowAddModal(false)} className="btn-secondary">Cancel</button>
              <button
                onClick={handleAdd}
                disabled={!selectedStaffId}
                className="btn-primary disabled:opacity-50"
              >
                Add to Team
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create New Staff Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Create New Staff Member</h2>
            <p className="text-sm text-gray-500 mb-4">
              Create a new account and automatically add them to your team.
            </p>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newStaff.firstName}
                    onChange={(e) => setNewStaff({ ...newStaff, firstName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newStaff.lastName}
                    onChange={(e) => setNewStaff({ ...newStaff, lastName: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  className="form-input"
                  value={newStaff.email}
                  onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                <input
                  type="text"
                  className="form-input"
                  value={newStaff.username}
                  onChange={(e) => setNewStaff({ ...newStaff, username: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <input
                  type="password"
                  className="form-input"
                  value={newStaff.password}
                  onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                <select
                  className="form-input"
                  value={newStaff.role}
                  onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                >
                  <option value="nurse">Nurse</option>
                  <option value="secretariat">Secretariat</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newStaff.phone}
                    onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newStaff.department}
                    onChange={(e) => setNewStaff({ ...newStaff, department: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowCreateModal(false)} className="btn-secondary">Cancel</button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="btn-primary disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create & Add to Team'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {showEditModal && editData && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowEditModal(false)}>
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Edit Staff Member</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editData.firstName}
                    onChange={(e) => setEditData({ ...editData, firstName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editData.lastName}
                    onChange={(e) => setEditData({ ...editData, lastName: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={editData.email}
                  onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="text"
                  className="form-input"
                  value={editData.phone || ''}
                  onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <input
                  type="text"
                  className="form-input"
                  value={editData.department || ''}
                  onChange={(e) => setEditData({ ...editData, department: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={editData.isActive}
                  onChange={(e) => setEditData({ ...editData, isActive: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="editIsActive" className="text-sm font-medium text-gray-700">Active</label>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowEditModal(false)} className="btn-secondary">Cancel</button>
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="btn-primary disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
