import { CourseDetail } from './CourseModal';

export const COURSES: CourseDetail[] = [
  {
    id: 'noorani-qaida',
    title: 'Noorani Qaida for Beginners',
    arabicTitle: 'القاعدة النورانية للمبتدئين',
    tagline: 'Foundational Arabic phonetics & Makharij designed specifically for young learners.',
    level: 'Beginner',
    duration: '3 - 6 Months',
    ageGroup: 'Kids & Beginners (Age 4+)',
    color: 'border-blue-500',
    description:
      'The ideal starting point for children and adults who want to learn how to recite the Holy Quran from scratch. Covers letter recognition, correct pronunciation from vocal points (Makharij), joining letters, and foundational vowels.',
    modules: [
      'Arabic Alphabet recognition and articulation points (Makharij)',
      'Harakat (Fathah, Kasrah, Dammah) and Tanween',
      'Rules of Sukoon (Jazm) and Shaddah (Tashdeed)',
      'Madd letters and elongation rules',
      'Word formation and introductory Quranic passages',
    ],
    features: [
      'Interactive visual flashcards & digital board',
      'Child-friendly pacing with engaging gamification',
      'Regular evaluation by certified QA team',
      'Monthly progress report sent to parents',
    ],
  },
  {
    id: 'tajweed-recitation',
    title: 'Quran Reading with Tajweed',
    arabicTitle: 'تلاوة القرآن الكريم بالتجويد',
    tagline: 'Master fluent recitation adhering to traditional scholarly Tajweed rules.',
    level: 'Intermediate',
    duration: '6 - 12 Months',
    ageGroup: 'All Ages (Kids & Adults)',
    color: 'border-sky-500',
    description:
      'Focuses on fluent Quran recitation with exact theoretical and practical Tajweed rules. Students learn the nuances of Noon Saakinah, Meem Saakinah, Ghunnah, Qalqalah, and proper stopping symbols (Waqf).',
    modules: [
      'Comprehensive rules of Noon and Meem Saakinah',
      'Ahkam Al-Madd (Elongations and their measurements)',
      'Characteristics of letters (Sifaat) and stops (Waqf & Ibtida)',
      'Practical recitation of selected Surahs with teacher correction',
      'Fluency training and melodious recitation techniques',
    ],
    features: [
      '1-on-1 audio & video pronunciation correction',
      'Recorded sessions for homework review',
      'Taught by qualified Alims and Alimahs',
      'Official Tajweed Certificate upon completion',
    ],
  },
  {
    id: 'hifz-program',
    title: 'Hifz-ul-Quran Memorization',
    arabicTitle: 'تحفيظ القرآن الكريم',
    tagline: 'Structured, spiritual memorization program with systematic revision cycles.',
    level: 'Advanced',
    duration: '2 - 3 Years',
    ageGroup: 'Dedicated Students (Age 7+)',
    color: 'border-indigo-500',
    description:
      'A rigorous and nurturing Quran memorization program led by certified Huffaz. Students follow a proven three-part daily routine: Sabaq (New Lesson), Sabqi (Recent Revision), and Manzil (Long-term Retention).',
    modules: [
      'Daily Sabaq memorization (personalized targets)',
      'Sabqi (revision of the current Juz / last 5 pages)',
      'Manzil revision of older Ajza to prevent forgetting',
      'Mutashabihat (similar verses) guidance and retention tactics',
      'Full Quran revision and Ijazah preparation',
    ],
    features: [
      'Daily tracking in student & parent portal',
      'Weekly supervisor review of retention quality',
      'Flexible scheduling adapted to regular school hours',
      'Honors graduation ceremony & accredited certificate',
    ],
  },
  {
    id: 'islamic-studies',
    title: 'Islamic Studies & Daily Duas',
    arabicTitle: 'الدراسات الإسلامية والأدعية',
    tagline: 'Holistic spiritual education covering Salah, Sunnahs, Akhlaq & Seerah.',
    level: 'All Levels',
    duration: 'Ongoing',
    ageGroup: 'Children & Youth',
    color: 'border-cyan-500',
    description:
      'Designed to complement Quranic learning with essential knowledge of Islamic faith and character. Children learn proper Wudu, step-by-step Salah, daily Masnoon Duas, moral values (Akhlaq), and inspiring stories of the Prophets.',
    modules: [
      'Step-by-step Practical Salah & Wudu training',
      '40 Essential Masnoon Duas with English meanings',
      'Pillars of Islam and Iman explained for young minds',
      'Seerah of Prophet Muhammad (PBUH) & Sahabah stories',
      'Islamic Manners: Respecting parents, honesty, kindness',
    ],
    features: [
      'Engaging story-telling methodology',
      'Practical quizzes and printable workbooks',
      'Safe interactive atmosphere encouraging questions',
      'Available in English, Urdu, and Arabic medium',
    ],
  },
];

export interface TestimonialItem {
  quote: string;
  name: string;
  location: string;
  course: string;
  rating: number;
}

export const TESTIMONIALS: TestimonialItem[] = [
  {
    quote:
      'Ain Ul Quran has transformed our 7-year-old son’s relationship with the Quran. The teacher is exceptionally patient, and knowing that every class is monitored by a QA supervisor gives us tremendous peace of mind.',
    name: 'Sister Fatima & Dr. Tariq Al-Mansoor',
    location: 'London, United Kingdom',
    course: 'Noorani Qaida & Tajweed',
    rating: 5,
  },
  {
    quote:
      'Finding a qualified Alimah for my two daughters was difficult until we found this academy. The interactive whiteboard, live lesson reports, and scheduling flexibility fit our busy California schedule perfectly.',
    name: 'Br. Imran Siddiqui',
    location: 'San Jose, California, USA',
    course: 'Quran with Tajweed & Islamic Studies',
    rating: 5,
  },
  {
    quote:
      'My 11-year-old is in the Hifz program, and his retention has improved dramatically. The daily Sabaq, Sabqi, and Manzil tracking in the parent dashboard is unlike any other online academy we tried.',
    name: 'Dr. Khurram & Aisha Zubair',
    location: 'Toronto, Ontario, Canada',
    course: 'Hifz-ul-Quran Program',
    rating: 5,
  },
];

export interface FaqItem {
  q: string;
  a: string;
}

export const FAQS: FaqItem[] = [
  {
    q: 'How do I enroll my child at Ain Ul Quran?',
    a: 'Getting started is simple. Submit our quick admission inquiry form, and our academic team will contact you within 24 hours to evaluate your child’s level, discuss scheduling preferences, and organize your first class.',
  },
  {
    q: 'Are female tutors available for female students and younger kids?',
    a: 'Yes, absolutely. We have an extensive team of certified Alimahs and female Hafizas available for sisters and children, ensuring a comfortable, culturally respectful, and spiritually enriching environment.',
  },
  {
    q: 'How does the Quality Assurance (QA) and monitoring work?',
    a: 'Unlike traditional platforms where teachers are unmonitored, Ain Ul Quran has a dedicated team of Quality Assurance reviewers and supervisors. They periodically evaluate class recordings, monitor punctuality, verify Tajweed correctness, and approve lesson progress reports.',
  },
  {
    q: 'What age can children start learning at Ain Ul Quran?',
    a: 'Children can begin as early as 4.5 to 5 years old. Our Kids Specialist teachers use colorful digital Noorani Qaida, gentle interactive storytelling, and short focused sessions designed for young attention spans.',
  },
  {
    q: 'Can we reschedule classes if we are traveling or unwell?',
    a: 'Yes! Our system provides a built-in Reschedule & Leave Request portal. You can easily request makeup classes or reschedule your session ahead of time directly through your portal dashboard.',
  },
  {
    q: 'What device or software do we need for classes?',
    a: 'You just need any desktop computer, laptop, tablet (iPad or Android), or smartphone with a stable internet connection and a modern web browser. There is no complex software installation needed.',
  },
];
