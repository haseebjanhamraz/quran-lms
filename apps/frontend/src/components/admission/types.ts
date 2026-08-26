export interface WeekdayItem {
  key: string;
  label: string;
  short: string;
}

export const WEEKDAYS: WeekdayItem[] = [
  { key: 'Mon', label: 'Monday', short: 'Mon' },
  { key: 'Tue', label: 'Tuesday', short: 'Tue' },
  { key: 'Wed', label: 'Wednesday', short: 'Wed' },
  { key: 'Thu', label: 'Thursday', short: 'Thu' },
  { key: 'Fri', label: 'Friday', short: 'Fri' },
  { key: 'Sat', label: 'Saturday', short: 'Sat' },
  { key: 'Sun', label: 'Sunday', short: 'Sun' },
];

export interface TeacherUser {
  id: string;
  _id?: string;
  name: string;
  preferredName?: string;
  email: string;
  specialization?: string;
  qualification?: string;
  country?: string;
  timezone?: string;
  profilePicture?: string;
  avatar?: string;
}

export interface PersonalInfoState {
  name: string;
  preferredName: string;
  email: string;
  password: string;
  gender: string;
  dob: string;
  country: string;
  phoneCode: string;
  phone: string;
  timezone: string;
  profilePicture: string;
  cameraRestricted: boolean;
}

export interface GuardianInfoState {
  guardianType: string;
  guardianTypeOther: string;
  guardianName: string;
  guardianPhone: string;
  guardianPhoneCode: string;
  guardianEmail: string;
}

export interface EnrollmentStatusState {
  enrollmentDate: string;
  status: string;
  trialStatus: string;
  isDiscontinued: boolean;
  classDuration: number;
  classesPerWeek: number;
  classDays: Array<{ day: string; time: string }>;
  tier: string;
}

export interface FeeInfoState {
  monthlyFee: string;
  currency: string;
  feeWaiverPercent: string;
  customFeeNotes: string;
  isFeeManuallyEdited: boolean;
}
