import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import BackButton from "../components/BackButton";
import { BASE_URL } from "../App";

const ProfilePage: React.FC = () => {
  const { user, token } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [username, setUsername] = useState(user?.username || user?.name || "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Keep local form state in sync when user changes
  React.useEffect(() => {
    if (user) {
      setName(user.name || "");
      setUsername(user.username || user.name || "");
    }
  }, [user]);

  const handleSave = async () => {
    if (!token) {
      window.dispatchEvent(new CustomEvent("open-login-modal"));
      return;
    }
    if (name.trim().length < 2) {
      setMsg("Name must be at least 2 characters");
      return;
    }
    try {
      setSaving(true);
      setMsg(null);
      const res = await fetch(`${BASE_URL}/auth/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, username }),
      });
      const updated = await res.json();
      if (!res.ok) throw new Error(updated?.error || "Failed to save");
      // Update local auth user
  localStorage.setItem("auth_user", JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent("auth-updated"));
      setMsg("Saved");
    } catch (e: any) {
      setMsg(e?.message || "Failed to save");
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(null), 2000);
    }
  };
  return (
    <div className="container mx-auto p-6">
      <div className="max-w-xl mx-auto mb-2">
        <BackButton to="/" />
      </div>
      {!user ? (
        <div className="max-w-xl mx-auto bg-base-100 border border-base-300 rounded-xl p-6">
          <h2 className="text-2xl font-bold mb-2">Profile</h2>
          <p className="opacity-80">Please login to edit your profile.</p>
          <button
            className="btn btn-primary mt-4"
            onClick={() => window.dispatchEvent(new CustomEvent("open-login-modal"))}
          >
            Login
          </button>
        </div>
      ) : (
        <div className="max-w-xl mx-auto bg-base-100 border border-base-300 rounded-xl p-6">
          <h2 className="text-2xl font-bold mb-6">Profile</h2>
          <div className="space-y-4">
            <div className="form-control">
              <label className="label"><span className="label-text">Name</span></label>
              <input className="input input-bordered" value={name} onChange={(e)=>setName(e.target.value)} />
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text">Username</span></label>
              <input className="input input-bordered" value={username} onChange={(e)=>setUsername(e.target.value)} />
            </div>
            <div className="form-control opacity-70">
              <label className="label"><span className="label-text">Email</span></label>
              <input className="input input-bordered" value={user.email} disabled />
            </div>
            <button className={`btn btn-primary mt-2 ${saving?"loading" : ""}`} onClick={handleSave} disabled={saving}>
              {saving ? "Saving" : "Save"}
            </button>
            {msg && <div className="mt-2 text-sm opacity-80">{msg}</div>}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
