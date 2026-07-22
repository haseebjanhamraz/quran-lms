import React, { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';

interface StudentRecord {
  id: string;
  name: string;
  email: string;
  courseTitle: string;
}

interface StudentsTabProps {
  students: StudentRecord[];
  studentsLoading: boolean;
}

export default function StudentsTab({ students, studentsLoading }: StudentsTabProps) {
  const [studentSearchQuery, setStudentSearchQuery] = useState('');

  const filteredStudents = students.filter(
    (st) =>
      st.name.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
      st.email.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
      st.courseTitle.toLowerCase().includes(studentSearchQuery.toLowerCase()),
  );

  return (
    <section className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="font-display text-xl font-bold text-brand">
          Assigned Students Roster
        </h2>
        <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-1.5 max-w-sm w-full shadow-sm">
          <Search size={16} className="text-muted-foreground" />
          <input
            type="text"
            placeholder="Search students or course..."
            value={studentSearchQuery}
            onChange={(e) => setStudentSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-xs w-full placeholder:text-muted-foreground/60 text-foreground"
          />
        </div>
      </div>

      {studentsLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={28} className="animate-spin text-primary" />
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground text-sm">No students found.</div>
      ) : (
        <div className="glass-panel rounded-2xl overflow-hidden border border-border shadow-sm">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="py-3.5 px-6 text-muted-foreground font-semibold text-xs uppercase tracking-wider">Student Name</th>
                <th className="py-3.5 px-6 text-muted-foreground font-semibold text-xs uppercase tracking-wider">Email Address</th>
                <th className="py-3.5 px-6 text-muted-foreground font-semibold text-xs uppercase tracking-wider">Enrolled Course</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredStudents.map((st, i) => (
                <tr key={i} className="hover:bg-muted/40 transition-colors">
                  <td className="py-4 px-6 font-medium text-foreground">{st.name}</td>
                  <td className="py-4 px-6 text-muted-foreground font-mono text-xs">{st.email}</td>
                  <td className="py-4 px-6 text-foreground/80">{st.courseTitle}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
