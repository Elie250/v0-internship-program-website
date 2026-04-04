"use client";

import { useEffect, useState } from "react";

export default function AdminAnnouncements() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadAnnouncements = async () => {
    try {
      const res = await fetch("/api/admin-announcements");
      const data = await res.json();

      if (data.success) {
        setAnnouncements(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const postAnnouncement = async () => {
    if (!title || !message) {
      alert("Please fill all fields");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/admin-announcements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title,
          message
        })
      });

      const data = await res.json();

      if (data.success) {
        setTitle("");
        setMessage("");
        loadAnnouncements();
      } else {
        alert("Failed to post announcement");
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    }

    setLoading(false);
  };

  return (
    <div className="p-8 space-y-8">

      <h1 className="text-3xl font-bold">
        Announcements
      </h1>

      <div className="bg-white p-6 rounded shadow space-y-4">

        <input
          className="border w-full p-2 rounded"
          placeholder="Announcement title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <textarea
          className="border w-full p-2 rounded"
          rows={4}
          placeholder="Announcement message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        <button
          onClick={postAnnouncement}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {loading ? "Posting..." : "Post Announcement"}
        </button>

      </div>

      <div className="space-y-4">

        {announcements.map((a) => (
          <div
            key={a.id}
            className="bg-white p-4 rounded shadow"
          >
            <h2 className="font-bold text-lg">
              {a.title}
            </h2>

            <p className="text-gray-600 mt-2">
              {a.message}
            </p>

            <p className="text-xs text-gray-400 mt-2">
              {new Date(a.created_at).toLocaleString()}
            </p>
          </div>
        ))}

      </div>

    </div>
  );
}