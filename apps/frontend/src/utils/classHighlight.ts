/**
 * Determines the row highlighting class based on class session and student attendance status.
 * Requirement:
 * - Completed class -> Green (row-completed)
 * - Student is absent -> Red (row-absent)
 * - Student is on leave -> Purple (row-on-leave)
 */
export function getClassRowHighlight(session: {
  status?: string;
  teacherReport?: { attendanceStatus?: string };
  attendanceStatus?: string;
  isLeave?: boolean;
  studentOnLeave?: boolean;
}): string {
  if (!session) return '';

  const attendance = session.teacherReport?.attendanceStatus || session.attendanceStatus;
  const status = session.status;

  // 1. Student is Absent -> Red
  if (attendance === 'ABSENT') {
    return 'row-absent';
  }

  // 2. Student is on Leave -> Purple
  if (
    status === 'FROZEN' ||
    session.isLeave ||
    session.studentOnLeave ||
    attendance === 'ON_LEAVE' ||
    attendance === 'LEAVE'
  ) {
    return 'row-on-leave';
  }

  // 3. Class is Completed -> Green
  if (status === 'COMPLETED') {
    return 'row-completed';
  }

  return '';
}
