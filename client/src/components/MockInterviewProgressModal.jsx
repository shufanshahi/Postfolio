import React, { useEffect, useState } from "react";

import { Dialog, DialogContent, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { AlertCircle, CheckCircle, TrendingUp, Sparkles } from "lucide-react";

export default function MockInterviewProgressModal({ open, onClose, mockInterviewId, profileId }) {
  const [progress, setProgress] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && mockInterviewId && profileId) {
      setLoading(true);
      setError("");
      fetch(
        `http://localhost:8080/api/interview-progress/profile/${profileId}/mock-interview/${mockInterviewId}`,
        {
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json"
          }
        }
      )
        .then((res) => res.json())
        .then((data) => {
          setProgress(data);
          setSelected(null);
        })
        .catch(() => setError("Failed to load progress."))
        .finally(() => setLoading(false));
    }
  }, [open, mockInterviewId, profileId]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogTitle>
        <div className="flex items-center gap-2 text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 via-indigo-600 to-blue-500">
          <TrendingUp className="w-6 h-6 text-teal-500" />
          Progress Over Time
        </div>
      </DialogTitle>
      <DialogContent className="rounded-2xl bg-gradient-to-br from-white/80 via-teal-50/80 to-indigo-50/80 dark:from-slate-900/80 dark:via-slate-800/80 dark:to-slate-900/80 shadow-xl border border-white/40 dark:border-slate-700/60 backdrop-blur-xl">
        {loading ? (
          <div className="text-center py-16 text-lg font-semibold text-slate-600 dark:text-slate-300">Loading...</div>
        ) : error ? (
          <div className="text-red-500 py-16 flex flex-col items-center"><AlertCircle className="w-8 h-8 mb-2" />{error}</div>
        ) : progress.length === 0 ? (
          <div className="py-16 text-center text-slate-500 dark:text-slate-400">No progress data found.</div>
        ) : (
          <div>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart
                data={progress.map((p) => ({
                  ...p,
                  date: new Date(p.time).toLocaleDateString(),
                }))}
                onClick={(e) => {
                  if (e && e.activePayload && e.activePayload[0]) {
                    setSelected(e.activePayload[0].payload);
                  }
                }}
                margin={{ top: 30, right: 30, left: 0, bottom: 10 }}
              >
                <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 13 }} />
                <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 13 }} />
                <Tooltip contentStyle={{ borderRadius: 12, background: '#fff', color: '#222' }} />
                <Line type="monotone" dataKey="score" stroke="#14b8a6" strokeWidth={3} dot={{ r: 6, fill: '#fff', stroke: '#14b8a6', strokeWidth: 2 }} activeDot={{ r: 8, fill: '#14b8a6', stroke: '#fff', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
            {selected && (
              <div className="mt-8 p-6 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-teal-200 dark:border-teal-700 shadow-lg backdrop-blur-xl">
                <div className="flex items-center gap-2 text-lg font-semibold text-teal-700 dark:text-teal-300">
                  <Sparkles className="w-5 h-5 text-indigo-500" />
                  {selected.date} — Score: <span className="ml-1 font-bold text-indigo-600 dark:text-indigo-300">{selected.score}</span>
                </div>
              </div>
            )}
          </div>
        )}
        <div className="mt-8 flex justify-end">
          <Button onClick={onClose} variant="outline" className="rounded-full px-6 py-2 font-semibold bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 shadow-sm hover:bg-teal-50 dark:hover:bg-slate-700 transition-all">Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
