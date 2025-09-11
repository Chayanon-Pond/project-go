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
  const [avatar, setAvatar] = useState<string>(user?.avatar || "");
  const originalAvatarRef = React.useRef<string>(user?.avatar || "");
  const [avatarChanged, setAvatarChanged] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);

  // Keep local form state in sync when user changes
  React.useEffect(() => {
    if (user) {
      setName(user.name || "");
      setUsername(user.username || user.name || "");
      setAvatar(user.avatar || "");
      originalAvatarRef.current = user.avatar || "";
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
      // Only include avatar when it was changed or explicitly removed.
      const payload: any = { name, username };
      if (avatarChanged || avatar !== originalAvatarRef.current) {
        // send empty string to remove, or data URL to set
        payload.avatar = avatar;
      }
  const bodyStr = JSON.stringify(payload);
  // helpful debug: log the JSON payload length so we can see large base64 avatars
  console.debug("PATCH /auth/me payload (len):", bodyStr.length, payload);
      const res = await fetch(`${BASE_URL}/auth/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      let updated: any = null;
      try {
        const text = await res.text();
        console.debug(
          "PATCH /auth/me response status:",
          res.status,
          "body len:",
          text.length
        );
        try {
          updated = JSON.parse(text);
        } catch (e) {
          updated = text;
        }
        console.debug("PATCH /auth/me response parsed:", updated);
      } catch (e) {
        console.error("Failed to read response body", e);
      }
      if (!res.ok) throw new Error(updated?.error || "Failed to save");
      // Merge updated fields with existing local stored user to avoid
      // accidentally removing fields backend didn't return (like avatar)
      const storedRaw = localStorage.getItem("auth_user");
      const stored = storedRaw ? JSON.parse(storedRaw) : {};
      const merged = { ...stored, ...updated };
      localStorage.setItem("auth_user", JSON.stringify(merged));
      // reflect the new avatar locally
      if (merged.avatar !== undefined) setAvatar(merged.avatar || "");
      originalAvatarRef.current = merged.avatar || "";
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
            onClick={() =>
              window.dispatchEvent(new CustomEvent("open-login-modal"))
            }
          >
            Login
          </button>
        </div>
      ) : (
        <div className="max-w-xl mx-auto bg-base-100 border border-base-300 rounded-xl p-6">
          <h2 className="text-2xl font-bold mb-6">Profile</h2>
          <div className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Profile photo</span>
              </label>
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 rounded-full overflow-hidden border">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt="avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-base-200 text-sm opacity-70">
                      No photo
                    </div>
                  )}
                </div>
                <div className="flex flex-col">
                  <input
                    id="avatarInput"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      setAvatarLoading(true);
                      try {
                        const readFileAsDataURL = (file: File) =>
                          new Promise<string>((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onload = () => {
                              const result = reader.result as string | null;
                              if (result) resolve(result);
                              else reject(new Error("empty file result"));
                            };
                            reader.onerror = () => reject(reader.error);
                            reader.readAsDataURL(file);
                          });
                        const result = await readFileAsDataURL(f);
                        setAvatar(result);
                        setAvatarChanged(true);
                      } catch (err) {
                        console.error("Failed to read avatar file", err);
                      } finally {
                        setAvatarLoading(false);
                      }
                    }}
                  />
                  <label htmlFor="avatarInput" className="btn">
                    Upload profile picture
                  </label>
                  <button
                    className="btn btn-ghost btn-sm mt-2"
                    onClick={() => {
                      setAvatar("");
                      setAvatarChanged(true);
                    }}
                  >
                    Remove photo
                  </button>
                </div>
              </div>
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Name</span>
              </label>
              <input
                className="input input-bordered"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Username</span>
              </label>
              <input
                className="input input-bordered"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="form-control opacity-70">
              <label className="label">
                <span className="label-text">Email</span>
              </label>
              <input
                className="input input-bordered"
                value={user.email}
                disabled
              />
            </div>
            <button
              className={`btn btn-primary mt-2 ${saving ? "loading" : ""}`}
              onClick={handleSave}
              disabled={saving || avatarLoading}
            >
              {saving
                ? "Saving"
                : avatarLoading
                ? "Processing image..."
                : "Save"}
            </button>
            {msg && <div className="mt-2 text-sm opacity-80">{msg}</div>}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
