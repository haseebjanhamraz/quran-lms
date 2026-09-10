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

export const DEFAULT_TEACHERS: TeacherItem[] = [];

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

/**
 * Matches a schedule slot against activeFilter, supporting:
 * - Real MongoDB teacher ID / _id
 * - Teacher name (case-insensitive substring or exact)
 * - 1-based index (e.g. filter=2 matches 2nd teacher in array)
 * - 0-based index
 */
export function matchTeacherFilter(
  slotData: SlotAssignment | undefined,
  activeFilter: string | null,
  teachers: TeacherItem[],
): boolean {
  if (!slotData) return false;
  if (!activeFilter) return true;

  const f = activeFilter.trim();
  const fLower = f.toLowerCase();

  const slotTeacherId = (slotData.teacherId || (slotData.teacher as any)?.id || (slotData.teacher as any)?._id)?.toString();
  const slotTeacherName = slotData.teacher?.name?.trim().toLowerCase();

  // Direct match by ID
  if (slotTeacherId && (slotTeacherId === f || slotTeacherId.toLowerCase() === fLower)) {
    return true;
  }
  // Direct match by name
  if (slotTeacherName && (slotTeacherName === fLower || slotTeacherName.includes(fLower))) {
    return true;
  }

  // Check if activeFilter is a numeric index (1, 2, 3...) or matches a teacher in the array
  let matchedTeacher: TeacherItem | undefined;

  const num = Number(f);
  if (!isNaN(num) && num > 0 && num <= teachers.length) {
    // 1-based index (e.g., '2' -> 2nd teacher)
    matchedTeacher = teachers[num - 1];
  } else if (!isNaN(num) && num >= 0 && num < teachers.length) {
    // 0-based index
    matchedTeacher = teachers[num];
  }

  if (!matchedTeacher) {
    matchedTeacher = teachers.find(
      (t, idx) =>
        t.id === f ||
        (t as any)._id === f ||
        t.name?.trim().toLowerCase() === fLower ||
        String(idx + 1) === f ||
        String(idx) === f,
    );
  }

  if (matchedTeacher) {
    const tId = (matchedTeacher.id || (matchedTeacher as any)._id)?.toString();
    const tName = matchedTeacher.name?.trim().toLowerCase();

    if (slotTeacherId && tId && (slotTeacherId === tId || slotTeacherId.toLowerCase() === tId.toLowerCase())) {
      return true;
    }
    if (slotTeacherName && tName && (slotTeacherName === tName || slotTeacherName.includes(tName) || tName.includes(slotTeacherName))) {
      return true;
    }
  }

  return false;
}
