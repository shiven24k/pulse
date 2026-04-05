import { useState, useEffect } from "react";
import axios from "axios";
import { Users, Mail, Loader2 } from "lucide-react"; // Cleaned up unused imports
import { motion } from "framer-motion";


export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get("http://localhost:5000/auth/users", {
        headers: { 
          Authorization: `Bearer ${localStorage.getItem("token")}` 
        }
      });
      setUsers(res.data);
    } catch (err) {
      console.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async (userId, newRole) => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `http://localhost:5000/auth/users/${userId}/role`, 
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Optimistic UI update
      setUsers(users.map(u => u._id === userId ? { ...u, role: newRole } : u));
    } catch (err) {
      alert("Failed to update role. Admin access required.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="space-y-6"
    >
      <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-lg shadow-indigo-100">
            <Users size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">System User Management</h3>
            <p className="text-sm text-slate-400">Control system-wide permissions and roles.</p>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-100">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
              <tr>
                <th className="p-5 text-center sm:text-left">User Identity</th>
                <th className="p-5">Current Permission</th>
                <th className="p-5 text-right">Assign New Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                        <Mail size={16} />
                      </div>
                      <span className="text-sm font-semibold text-slate-700">{u.email}</span>
                    </div>
                  </td>
                  <td className="p-5">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${
                      u.role === 'admin' ? 'bg-indigo-100 text-indigo-600' : 
                      u.role === 'editor' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-5 text-right">
                    <select 
                      value={u.role} 
                      onChange={(e) => updateRole(u._id, e.target.value)}
                      className="bg-slate-100 border-none rounded-xl px-4 py-2 text-xs font-bold focus:ring-4 focus:ring-indigo-100 outline-none cursor-pointer hover:bg-slate-200 transition-all"
                    >
                      <option value="viewer">Viewer</option>
                      <option value="editor">Editor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}