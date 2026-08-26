import { LucideIcon } from 'lucide-react';

export interface StepItem {
  num: number;
  label: string;
  icon: LucideIcon;
}

export interface TeacherPersonalInfo {
  name: string;
  preferredName: string;
  email: string;
  password?: string;
  phone: string;
  phoneCode: string;
  country: string;
  cnicOrId: string;
  gender: string;
  dob: string;
  timezone: string;
  profilePicture: string;
}

export interface TeacherQualificationsInfo {
  specialization: string;
  qualification: string;
  employeeId: string;
  joiningDate: string;
  bio: string;
}

export interface TeacherSalaryInfo {
  payType: string;
  baseSalary: string;
  hourlyRate: string;
  country: string;
  currency: string;
}

export interface TeacherGuarantorInfo {
  g1Name: string;
  g1Phone: string;
  g1Email: string;
  g1Relationship: string;
  g1Cnic: string;
  g1Address: string;

  g2Name: string;
  g2Phone: string;
  g2Email: string;
  g2Relationship: string;
  g2Cnic: string;
  g2Address: string;
}
