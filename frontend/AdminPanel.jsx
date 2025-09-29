import React, { useEffect, useState } from "react";

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [ipInfo, setIpInfo] = useState({});
  const [showCreate, setShowCreate] = useState(false);
  const [newUser, setNewUser] = useState({ username: "", password: "" });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    // Fetch users (placeholder, replace with real API call)
    setUsers([
      { username: "admin", ip: "1.2.3.4" },
      { username: "gallo", ip: "5.6.7.8" },
      { username: "verylongusernameexample", ip: "123.123.123.123" },
    ]);
    // Fetch IP info for each user (placeholder, replace with real API call)
    setIpInfo({
      "1.2.3.4": { country: "Estonia", city: "Tallinn" },
      "5.6.7.8": { country: "Finland", city: "Helsinki" },
      "123.123.123.123": { country: "USA", city: "New York" },
    });
  }, []);

  async function handleCreateUser(e) {
    e.preventDefault();
    setCreating(true);
    setError("");
    // Placeholder: replace with real API call
    if (!newUser.username || !newUser.password) {
      setError("Username and password required");
      setCreating(false);
      return;
    }
    setUsers([...users, { username: newUser.username, ip: "0.0.0.0" }]);
    setIpInfo({ ...ipInfo, "0.0.0.0": { country: "Unknown", city: "Unknown" } });
    setShowCreate(false);
    setNewUser({ username: "", password: "" });
    setCreating(false);
  }

  return (
  <div className="bg-black border border-gold p-4 rounded text-gold w-full" style={{margin: 0, position: 'relative', top: '-7rem', fontSize: '0.95rem', overflowX: 'auto', textAlign: 'center', borderRadius: 0, width: '100%', maxWidth: '100vw', left: 0, alignSelf: 'flex-start'}}>
      <h3 className="text-xl mb-2 border-b border-gold pb-2">User Management</h3>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <table className="w-full text-gold border-separate border-spacing-0 mb-4" style={{borderCollapse: 'separate', fontSize: '0.95rem', tableLayout: 'fixed', textAlign: 'center', minWidth: '700px'}}>
        <colgroup>
          <col style={{width: '28%'}} />
          <col style={{width: '22%'}} />
          <col style={{width: '30%'}} />
          <col style={{width: '20%'}} />
        </colgroup>
        <thead>
          <tr>
            <th className="border border-gold p-2 truncate">Username</th>
            <th className="border border-gold p-2 truncate">IP</th>
            <th className="border border-gold p-2 truncate">Location</th>
            <th className="border border-gold p-2 truncate">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.username}>
              <td className="border border-gold p-2 truncate" title={u.username}>{u.username}</td>
              <td className="border border-gold p-2 truncate" title={u.ip}>{u.ip}</td>
              <td className="border border-gold p-2 truncate" title={ipInfo[u.ip]?.country + ', ' + ipInfo[u.ip]?.city}>{ipInfo[u.ip]?.country}, {ipInfo[u.ip]?.city}</td>
              <td className="border border-gold p-2">
                <button className="header-btn mr-2">Delete</button>
                <button className="header-btn mr-2">Ban</button>
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
