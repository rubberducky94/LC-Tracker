import React, { useEffect, useState } from "react";
import pb from "./api/pocketbaseClient";

/**
 * Minimal LC Tracker form + recent entries list.
 * Adjust field keys to match your PocketBase collection schema.
 *
 * See PocketBase binary at [`pocketbase`](pocketbase) and types at [`pb_data/types.d.ts`](pb_data/types.d.ts).
 */

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const PERIODS = [4,5,6,7,8];
const ZONES = ["Enrichment","Semi-Collaborative","Collaborative","Studio 2","Multipurpose Room","Focus","Other"];
const FOCUS_ZONES = ["F1","F2","B1","B2","B3","B4","C1","C2","C3","Tall","Round"];
const ACTIONS = ["Self-Directed","Coached","Redirected","Conduct 1","Conduct 2","Conduct 3"];

export default function App(){
  const [form, setForm] = useState({
    day: "Monday",
    period: 4,
    student_name: "",
    class_or_study: "Study",
    study_planner: "Yes",
    zone: "Focus",
    focus_zone: "F1",
    action: "Self-Directed",
    notes: ""
  });
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState([]);
  const [error, setError] = useState(null);

  useEffect(()=>{ fetchRecent() }, []);

  async function fetchRecent(){
    try{
      const res = await pb.collection("lc_tracker").getList(1, 20, { sort: "-created" });
      setRecent(res.items || []);
    }catch(e){
      console.error(e);
      setError("Failed to load recent entries.");
    }
  }

  function update(k, v){
    setForm(s => ({ ...s, [k]: v }));
    if(k === "class_or_study" && v === "Class"){
      setForm(s => ({ ...s, study_planner: "" }));
    }
  }

  async function handleSubmit(e){
    e.preventDefault();
    setLoading(true);
    setError(null);
    try{
      const payload = {
        day: form.day,
        period: Number(form.period),
        student_name: form.student_name,
        class_or_study: form.class_or_study,
        study_planner: form.class_or_study === "Study" ? form.study_planner : "N/A",
        zone: form.zone,
        focus_zone: form.zone === "Focus" ? form.focus_zone : "",
        action: form.action,
        notes: form.notes
      };
      await pb.collection("lc_tracker").create(payload);
      setForm({
        day: "Monday",
        period: 4,
        student_name: "",
        class_or_study: "Study",
        study_planner: "Yes",
        zone: "Focus",
        focus_zone: "F1",
        action: "Self-Directed",
        notes: ""
      });
      await fetchRecent();
    }catch(err){
      console.error(err);
      setError(err?.message || "Submit failed");
    }finally{
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 20, fontFamily: "system-ui, Arial" }}>
      <h2>LC Tracker — Quick Entry</h2>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 8, maxWidth: 720 }}>
        <div>
          <label>Day</label><br/>
          <select value={form.day} onChange={e=>update("day", e.target.value)}>
            {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          &nbsp;
          <label>Period</label>
          <select value={form.period} onChange={e=>update("period", e.target.value)}>
            {PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div>
          <label>Student Name</label><br/>
          <input value={form.student_name} onChange={e=>update("student_name", e.target.value)} required/>
        </div>

        <div>
          <label>Class or Study</label><br/>
          <select value={form.class_or_study} onChange={e=>update("class_or_study", e.target.value)}>
            <option>Class</option>
            <option>Study</option>
          </select>
          {form.class_or_study === "Study" && (
            <>
              &nbsp;<label>Study Planner filled?</label>
              <select value={form.study_planner} onChange={e=>update("study_planner", e.target.value)}>
                <option>Yes</option><option>No</option>
              </select>
            </>
          )}
        </div>

        <div>
          <label>Zone</label><br/>
          <select value={form.zone} onChange={e=>update("zone", e.target.value)}>
            {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
          </select>
          {form.zone === "Focus" && (
            <>
              &nbsp;<label>Focus area</label>
              <select value={form.focus_zone} onChange={e=>update("focus_zone", e.target.value)}>
                {FOCUS_ZONES.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </>
          )}
        </div>

        <div>
          <label>Action</label><br/>
          <select value={form.action} onChange={e=>update("action", e.target.value)}>
            {ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        <div>
          <label>Notes</label><br/>
          <textarea value={form.notes} onChange={e=>update("notes", e.target.value)} rows={3}/>
        </div>

        <div>
          <button type="submit" disabled={loading}>Save Entry</button>
          {error && <span style={{ color: "crimson", marginLeft: 12 }}>{error}</span>}
        </div>
      </form>

      <hr/>

      <h3>Recent entries</h3>
      <button onClick={fetchRecent}>Refresh</button>
      <ul>
        {recent.map(r => (
          <li key={r.id}>
            [{r.day} P{r.period}] {r.student_name} — {r.class_or_study}
            {r.class_or_study === "Study" ? ` (Planner: ${r.study_planner})` : ""} — Zone: {r.zone}{r.zone==="Focus"?`/${r.focus_zone}`:""} — Action: {r.action}
            {r.notes ? ` — ${r.notes}` : ""}
          </li>
        ))}
        {recent.length === 0 && <li>No entries yet</li>}
      </ul>
    </div>
  );
}