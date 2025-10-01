import React, { useEffect, useState } from "react";

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newUser, setNewUser] = useState({ username: "", password: "", email: "" });
  const [creating, setCreating] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ username: "", email: "", role: "", newPassword: "" });

  const fetchUsers = () => {
    fetch('/api/admin/users', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    .then(res => {
      if (!res.ok) throw new Error('Failed to fetch users');
      return res.json();
    })
    .then(data => {
      setUsers(data);
      setError('');
    })
    .catch(err => setError('Failed to load users: ' + err.message));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = (e) => {
    e.preventDefault();
    createUser();
  };

  const createUser = async () => {
    setCreating(true);
    setError('');
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newUser)
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText);
      }
      setShowCreate(false);
      setNewUser({ username: "", password: "", email: "" });
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
    setCreating(false);
  };

  const deleteUser = async (username) => {
    if (!confirm(`Delete user ${username}?`)) return;
    try {
      const res = await fetch(`/api/admin/users/${username}/delete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!res.ok) throw new Error(await res.text());
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const banUser = async (username) => {
    if (!confirm(`Ban user ${username}?`)) return;
    try {
      const res = await fetch(`/api/admin/users/${username}/ban`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!res.ok) throw new Error(await res.text());
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const verifyUser = async (username) => {
    try {
      const res = await fetch(`/api/admin/users/${username}/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!res.ok) throw new Error(await res.text());
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const startEdit = (user) => {
    setEditingUser(user.username);
    setEditForm({ username: user.username, email: user.email || "", role: user.role || "user", newPassword: "" });
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setEditForm({ username: "", email: "", role: "", newPassword: "" });
  };

  const saveUser = async (originalUsername) => {
    try {
      const res = await fetch(`/api/admin/users/${originalUsername}/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(editForm)
      });
      if (!res.ok) throw new Error(await res.text());
      setEditingUser(null);
      setEditForm({ username: "", email: "", newPassword: "" });
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="bg-black border border-gold p-4 rounded text-gold w-full" style={{marginTop: '2rem', fontSize: '0.95rem', overflow: 'auto', maxHeight: '600px', width: '100%', maxWidth: '100vw'}}>
      <h3 className="text-xl mb-4 border-b border-gold pb-2">User Management</h3>
      {error && <div className="text-red-500 mb-2 p-2 border border-red-500 rounded">{error}</div>}
      
      <div className="overflow-x-auto">
        <table className="w-full text-gold border-collapse mb-4" style={{fontSize: '0.95rem', minWidth: '800px'}}>
          <thead>
            <tr className="border-b-2 border-gold">
              <th className="p-3 text-left">Username</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-center">Role</th>
              <th className="p-3 text-center">Verified</th>
              <th className="p-3 text-center">Approved</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.username} className="border-b border-gold hover:bg-gold hover:bg-opacity-10">
                <td className="p-3 text-left">
                  {editingUser === u.username ? (
                    <input
                      className="bg-black border border-gold px-2 py-1 text-gold focus:outline-none w-full"
                      value={editForm.username}
                      onChange={e => setEditForm({ ...editForm, username: e.target.value })}
                    />
                  ) : (
                    u.username
                  )}
                </td>
                <td className="p-3 text-left">
                  {editingUser === u.username ? (
                    <input
                      className="bg-black border border-gold px-2 py-1 text-gold focus:outline-none w-full"
                      type="email"
                      value={editForm.email}
                      onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                      placeholder="Email"
                    />
                  ) : (
                    u.email || '-'
                  )}
                </td>
                <td className="p-3 text-center">
                  {editingUser === u.username ? (
                    <select
                      className="bg-black border border-gold px-2 py-1 text-gold focus:outline-none"
                      value={editForm.role}
                      onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                    >
                      <option value="user">User</option>
                      <option value="moderator">Moderator</option>
                      <option value="admin">Admin</option>
                    </select>
                  ) : (
                    <span className={u.role === 'admin' ? 'text-yellow-400 font-bold' : u.role === 'moderator' ? 'text-blue-400 font-semibold' : ''}>{u.role || 'user'}</span>
                  )}
                </td>
                <td className="p-3 text-center">
                  {u.is_verified ? (
                    <span className="text-green-400">✓ Yes</span>
                  ) : (
                    <span className="text-red-400">✗ No</span>
                  )}
                </td>
                <td className="p-3 text-center">
                  {u.is_approved ? (
                    <span className="text-green-400">✓ Yes</span>
                  ) : (
                    <span className="text-red-400">✗ No</span>
                  )}
                </td>
                <td className="p-3 text-center">
                  {editingUser === u.username ? (
                    <div className="flex flex-col gap-2">
                      <input
                        className="bg-black border border-gold px-2 py-1 text-gold focus:outline-none text-center text-sm"
                        type="password"
                        value={editForm.newPassword}
                        onChange={e => setEditForm({ ...editForm, newPassword: e.target.value })}
                        placeholder="New Password (optional)"
                      />
                      <div className="flex gap-2 justify-center">
                        <button 
                          className="header-btn px-3 py-1 text-sm bg-green-600"
                          onClick={() => saveUser(u.username)}
                        >
                          Save
                        </button>
                        <button 
                          className="header-btn px-3 py-1 text-sm bg-gray-600"
                          onClick={cancelEdit}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2 justify-center flex-wrap">
                      <button 
                        className="header-btn px-2 py-1 text-sm"
                        onClick={() => startEdit(u)}
                      >
                        Edit
                      </button>
                      {!u.is_verified && (
                        <button 
                          className="header-btn px-2 py-1 text-sm"
                          onClick={() => verifyUser(u.username)}
                        >
                          Verify Email
                        </button>
                      )}
                      <button 
                        className="header-btn px-2 py-1 text-sm"
                        onClick={() => banUser(u.username)}
                      >
                        Ban
                      </button>
                      <button 
                        className="header-btn px-2 py-1 text-sm"
                        onClick={() => deleteUser(u.username)}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <button className="header-btn w-full mb-2" onClick={() => setShowCreate(v => !v)}>
        {showCreate ? "Cancel" : "Create New User"}
      </button>
      {showCreate && (
        <form onSubmit={handleCreateUser} className="flex flex-col gap-2 border border-gold p-3 mt-2 rounded bg-black" style={{textAlign: 'center'}}>
          <input
            className="bg-black border-b border-gold px-2 py-1 text-gold focus:outline-none text-center"
            placeholder="Username"
            value={newUser.username}
            onChange={e => setNewUser({ ...newUser, username: e.target.value })}
            required
          />
          <input
            className="bg-black border-b border-gold px-2 py-1 text-gold focus:outline-none text-center"
            placeholder="Email"
            type="email"
            value={newUser.email}
            onChange={e => setNewUser({ ...newUser, email: e.target.value })}
          />
          <input
            className="bg-black border-b border-gold px-2 py-1 text-gold focus:outline-none text-center"
            placeholder="Password"
            type="password"
            value={newUser.password}
            onChange={e => setNewUser({ ...newUser, password: e.target.value })}
            required
          />
          <button className="header-btn mt-2" type="submit" disabled={creating}>
            {creating ? "Creating..." : "Create"}
          </button>
        </form>
      )}
    </div>
  );
}
