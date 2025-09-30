import React, { useEffect, useState } from "react";

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [ipInfo, setIpInfo] = useState({});
  const [showCreate, setShowCreate] = useState(false);
  const [newUser, setNewUser] = useState({ username: "", password: "", email: "" });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    // Fetch users
    fetch('/api/admin/users', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    .then(res => res.json())
    .then(data => setUsers(data))
    .catch(err => setError('Failed to load users'));
  }, []);

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
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setUsers([...users, { username: newUser.username, email: newUser.email || '', is_verified: true, is_approved: true, role: 'user' }]);
      setShowCreate(false);
      setNewUser({ username: "", password: "", email: "" });
    } catch (err) {
      setError(err.message);
    }
    setCreating(false);
  }

  const deleteUser = async (username) => {
    try {
      const res = await fetch(`/api/admin/users/${username}/delete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!res.ok) throw new Error(await res.text());
      setUsers(users.filter(u => u.username !== username));
    } catch (err) {
      setError(err.message);
    }
  }

  const banUser = async (username) => {
    try {
      const res = await fetch(`/api/admin/users/${username}/ban`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!res.ok) throw new Error(await res.text());
      setUsers(users.map(u => u.username === username ? {...u, is_approved: false} : u));
    } catch (err) {
      setError(err.message);
    }
  }

  const verifyUser = async (username) => {
    try {
      const res = await fetch(`/api/admin/users/${username}/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!res.ok) throw new Error(await res.text());
      setUsers(users.map(u => u.username === username ? {...u, is_verified: true} : u));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
  <div className="bg-black border border-gold p-4 rounded text-gold w-full" style={{margin: 0, position: 'relative', top: '-8rem', fontSize: '0.95rem', overflow: 'auto', maxHeight: '500px', textAlign: 'center', borderRadius: 0, width: '100%', maxWidth: '100vw', left: 0, alignSelf: 'flex-start'}}>
      <h3 className="text-xl mb-2 border-b border-gold pb-2">User Management</h3>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <table className="w-full text-gold border-separate border-spacing-0 mb-4" style={{borderCollapse: 'separate', fontSize: '0.95rem', tableLayout: 'fixed', textAlign: 'center', minWidth: '700px'}}>
        <colgroup>
          <col style={{width: '20%'}} />
          <col style={{width: '25%'}} />
          <col style={{width: '15%'}} />
          <col style={{width: '15%'}} />
          <col style={{width: '25%'}} />
        </colgroup>
        <thead>
          <tr>
            <th className="border border-gold p-2 truncate">Username</th>
            <th className="border border-gold p-2 truncate">Email</th>
            <th className="border border-gold p-2 truncate">Verified</th>
            <th className="border border-gold p-2 truncate">Approved</th>
            <th className="border border-gold p-2 truncate">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.username}>
              <td className="border border-gold p-2 truncate" title={u.username}>{u.username}</td>
              <td className="border border-gold p-2 truncate" title={u.email}>{u.email}</td>
              <td className="border border-gold p-2 truncate">{u.is_verified ? 'Yes' : 'No'}</td>
              <td className="border border-gold p-2 truncate">{u.is_approved ? 'Yes' : 'No'}</td>
                            <td className="border border-gold p-2">
                <button className="header-btn mr-2" onClick={() => deleteUser(u.username)}>Delete</button>
                <button className="header-btn mr-2" onClick={() => banUser(u.username)}>Ban</button>
                {!u.is_verified && <button className="header-btn mr-2" onClick={() => verifyUser(u.username)}>Verify</button>}
                <button className="header-btn mr-2">Reset PW</button>
                <button className="header-btn">Edit</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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
