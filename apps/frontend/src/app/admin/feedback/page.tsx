'use client';

import React, { useState } from 'react';
import { Filter, Search, MessageSquare, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface FeedbackItem {
  id: string;
  studentName: string;
  category: 'Complaint' | 'Suggestion' | 'Technical Issue' | 'Other';
  subject: string;
  message: string;
  status: 'Open' | 'In Progress' | 'Resolved';
  date: string;
  adminNotes: string;
}

const INITIAL_FEEDBACK: FeedbackItem[] = [
  { id: 'FB-001', studentName: 'Ali Khan (Parent)', category: 'Technical Issue', subject: 'Audio not working', message: 'During the last class, the teacher could not hear my son.', status: 'Open', date: '2023-10-25', adminNotes: '' },
  { id: 'FB-002', studentName: 'Sara Ahmed', category: 'Complaint', subject: 'Late class start', message: 'Class started 10 minutes late on Tuesday.', status: 'In Progress', date: '2023-10-24', adminNotes: 'Checking with teacher.' },
  { id: 'FB-003', studentName: 'Omar Farooq', category: 'Suggestion', subject: 'More revision time', message: 'Can we add 5 minutes at the end for revision?', status: 'Resolved', date: '2023-10-20', adminNotes: 'Implemented in new schedule.' },
];

export default function FeedbackComplaints() {
  const [feedback, setFeedback] = useState<FeedbackItem[]>(INITIAL_FEEDBACK);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  
  const [selectedItem, setSelectedItem] = useState<FeedbackItem | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [editStatus, setEditStatus] = useState<FeedbackItem['status']>('Open');

  const filteredData = feedback.filter(item => {
    const matchSearch = item.subject.toLowerCase().includes(search.toLowerCase()) || item.studentName.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === 'All' || item.category === categoryFilter;
    const matchStatus = statusFilter === 'All' || item.status === statusFilter;
    return matchSearch && matchCat && matchStatus;
  });

  const handleOpenModal = (item: FeedbackItem) => {
    setSelectedItem(item);
    setEditNotes(item.adminNotes);
    setEditStatus(item.status);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    setFeedback(prev => prev.map(item => 
      item.id === selectedItem.id ? { ...item, status: editStatus, adminNotes: editNotes } : item
    ));
    setSelectedItem(null);
  };

  const getStatusBadge = (status: string) => {
    if (status === 'Open') return <span className="bg-red-500/10 text-red-500 border border-red-500/20 text-xs font-bold px-2.5 py-1 rounded-full">Open</span>;
    if (status === 'In Progress') return <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-xs font-bold px-2.5 py-1 rounded-full">In Progress</span>;
    return <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-bold px-2.5 py-1 rounded-full">Resolved</span>;
  };

  return (
    <div className="relative mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-display font-bold">Feedback & Complaints</h1>
          <p className="text-muted-foreground mt-1">Review and resolve parent/student feedback and issues.</p>
        </div>
      </div>

      <div className="glass-panel p-4 rounded-xl flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 w-full flex items-center gap-3 bg-background border border-border px-3 py-2 rounded-lg">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search by name or subject..." 
            className="bg-transparent border-none outline-none w-full text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none w-full md:w-40"
          >
            <option value="All">All Categories</option>
            <option value="Complaint">Complaint</option>
            <option value="Suggestion">Suggestion</option>
            <option value="Technical Issue">Technical Issue</option>
            <option value="Other">Other</option>
          </select>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none w-full md:w-40"
          >
            <option value="All">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
      </div>

      <div className="glass-panel rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="p-4 font-semibold text-xs text-muted-foreground uppercase tracking-wider">ID / Date</th>
                <th className="p-4 font-semibold text-xs text-muted-foreground uppercase tracking-wider">Student/Parent</th>
                <th className="p-4 font-semibold text-xs text-muted-foreground uppercase tracking-wider">Category</th>
                <th className="p-4 font-semibold text-xs text-muted-foreground uppercase tracking-wider">Subject</th>
                <th className="p-4 font-semibold text-xs text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="p-4 font-semibold text-xs text-muted-foreground uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filteredData.map(item => (
                <tr key={item.id} className="hover:bg-card/30 transition-colors">
                  <td className="p-4">
                    <span className="font-mono text-xs block font-bold">{item.id}</span>
                    <span className="text-xs text-muted-foreground">{item.date}</span>
                  </td>
                  <td className="p-4 font-medium">{item.studentName}</td>
                  <td className="p-4 text-xs">{item.category}</td>
                  <td className="p-4 font-medium">{item.subject}</td>
                  <td className="p-4">{getStatusBadge(item.status)}</td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => handleOpenModal(item)}
                      className="text-xs bg-secondary hover:bg-secondary/80 text-secondary-foreground px-3 py-1.5 rounded-md font-semibold transition-colors"
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">No feedback found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card border border-border shadow-2xl rounded-2xl w-full max-w-lg p-6 relative">
            <button onClick={() => setSelectedItem(null)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
              <XCircle className="h-6 w-6" />
            </button>
            <h2 className="text-xl font-display font-bold mb-4">Review Feedback</h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">From</p>
                <p className="text-sm font-medium">{selectedItem.studentName}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Subject</p>
                <p className="text-sm font-medium">{selectedItem.subject} <span className="text-xs text-muted-foreground ml-2">({selectedItem.category})</span></p>
              </div>
              <div className="bg-muted/50 p-3 rounded-lg border border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Message</p>
                <p className="text-sm">{selectedItem.message}</p>
              </div>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4 border-t border-border pt-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</label>
                <select 
                  value={editStatus} 
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-2.5 text-sm outline-none"
                >
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Admin Notes / Resolution</label>
                <textarea 
                  value={editNotes} 
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-3 text-sm outline-none min-h-[100px] resize-none"
                  placeholder="Add notes or resolution details here..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setSelectedItem(null)} className="bg-muted hover:bg-muted/80 px-4 py-2 rounded-lg text-sm font-semibold">Cancel</button>
                <button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg text-sm font-semibold shadow-md">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
