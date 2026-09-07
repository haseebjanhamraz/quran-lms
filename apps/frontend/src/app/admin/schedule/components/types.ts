export interface TeacherItem {
  id: string;
  name: string;
  email?: string;
  assignedDaysCount?: number;
  color?: string;
}

export interface SlotAssignment {
  id?: string;
  _id?: string;
  dayOfWeek: string;
  timeSlotIndex: number;
  startTime: string;
  endTime: string;
  teacherStartTime?: string;
  studentStartTime?: string;
  teacherId: string;
  teacher?: { id: string; name: string; email?: string };
  studentId?: string;
  student?: { id: string; name: string; email?: string; preferredName?: string };
  courseId?: string;
  course?: { id: string; title: string; type?: string };
  enrolledStudents?: any[];
}

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const DEFAULT_TEACHERS: TeacherItem[] = [
  { id: '1', name: 'Qari Muneeb 1', assignedDaysCount: 5 },
  { id: '2', name: 'Sheikh Abdullah', assignedDaysCount: 2 },
  { id: '3', name: 'Ustadh Asad', assignedDaysCount: 3 },
  { id: '4', name: 'Qari Talha', assignedDaysCount: 3 },
  { id: '5', name: 'Sheikh Aziz', assignedDaysCount: 2 },
  { id: '6', name: 'Qari Aamir', assignedDaysCount: 5 },
  { id: '7', name: 'Ustadh Aahil', assignedDaysCount: 6 },
];

export const TEACHER_COLORS = [
  'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30',
  'bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30',
  'bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30',
  'bg-pink-500/20 text-pink-600 dark:text-pink-400 border-pink-500/30',
  'bg-teal-500/20 text-teal-600 dark:text-teal-400 border-teal-500/30',
  'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30',
];

export function getTeacherColor(index: number): string {
  return TEACHER_COLORS[index % TEACHER_COLORS.length];
}
