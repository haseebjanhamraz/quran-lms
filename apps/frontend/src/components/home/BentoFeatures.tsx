import React from 'react';
import { Check, Clock } from 'lucide-react';

export default function BentoFeatures() {
  return (
    <section id="features" className="scroll-mt-24 py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center max-w-3xl mx-auto mb-14">
        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mb-3">
          Why Choose Us
        </span>
        <h2 className="font-headline text-3xl sm:text-4xl font-bold text-blue-600 dark:text-blue-400 mb-4">
          Why Choose Ain Ul Quran?
        </h2>
        <p className="text-slate-600 dark:text-slate-300 text-base sm:text-lg">
          We blend traditional scholarly authority with modern educational frameworks, ensuring every lesson is impactful, engaging, and securely monitored.
        </p>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Feature 1: Large Span (Authentic & Monitored) */}
        <div className="bg-white dark:bg-[#0B1528] rounded-2xl p-6 sm:p-8 shadow-md hover:shadow-xl border border-slate-200/80 dark:border-slate-800 border-t-4 border-t-blue-600 md:col-span-2 flex flex-col justify-between transition-all duration-300 hover-lift">
          <div className="mb-6">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center p-2 mb-4 shadow-sm border border-blue-100 dark:border-blue-800/40">
              <img
                src="https://lh3.googleusercontent.com/aida/AEtjO1WhOynQSeNG46MIcwg8RaLo5BL2h-VSZRuBQeigeZgPqpoOeIxNBWgfuSq_-kgVchtWxyxKrf7qFumxCA9ZwcruyAzXF_lLi8e-WFsPqThnsx_1hnYSF4PS5393zbb8nNqkBWpS9wzQKlm0HZYOItMvmI27QQxNod8oDCiA7_sX-irMBFLqt7RlJerNIk0Mco-ZqGWsjqdxjuq2RG6pxqe112xgWWk42lKdmy0UZR6HgGrme5t-XjP8gw"
                alt="Authentic Learning Icon"
                className="w-full h-full object-contain"
              />
            </div>
            <h3 className="font-headline text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">
              Authentic & Monitored
            </h3>
            <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
              Quality assurance for every lesson. Our specialized QA team monitors classes to ensure strict adherence to traditional scholarly standards while maintaining a safe, welcoming digital environment.
            </p>
          </div>
          <div className="h-44 sm:h-52 bg-slate-100 dark:bg-slate-900/60 rounded-xl overflow-hidden relative border border-slate-200/60 dark:border-slate-800">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCaKWrXGkZkhY5MtSz9-s-VR_yDfzXX0WnUVPjkKFOlD5BMxu7WOh_3LK3M1xTqoz4VtEphLhRQDquejfFeN4ri5TusvMBfeZC9cL2qj2oKgRQvQnC0-7p1jZD3oIg7aHiVLmlpx-gPh2MZCTyOLfe6SeNNAX2BeLnbPvmYS_ofZReWCnoY1M5LYY9fdj6dD7bVrREa0v9fjMaiTDDa9Wo7LOopPQlWbW6mBSVFZQ5TcbVSn5kpqc_2"
              alt="Quality Assurance Dashboard Interface"
              className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity"
            />
            <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg bg-black/70 backdrop-blur-sm text-white text-xs font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              Live Supervisory Inspection
            </div>
          </div>
        </div>

        {/* Feature 2: Expert Tutors */}
        <div className="bg-white dark:bg-[#0B1528] rounded-2xl p-6 sm:p-8 shadow-md hover:shadow-xl border border-slate-200/80 dark:border-slate-800 border-t-4 border-t-sky-blue flex flex-col justify-between transition-all duration-300 hover-lift">
          <div>
            <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-950/60 flex items-center justify-center p-2 mb-4 shadow-sm border border-sky-100 dark:border-sky-800/40">
              <img
                src="https://lh3.googleusercontent.com/aida/AEtjO1UvhlFMvXEr8FdXAPlRZyPyLPeF_CsQ9IEVbG-bhrpo4NQV8wSVcp2aHp4ojrA7QNGSFgBWO5Vm_WxzJXns7bQQqLIxVdsC-YwuAwo8gLGnYLkEYrQa3Ehej3nQ1JLGrhYrZy4_3ErLJu3jdWwwzW6eDrcZWcwRcgu0sFuTdmcPp9RIFAcnHhPpeO_PykeqKEh0vd4dW_f1KJAMtvpd7ltAFH55dF2AgxRFiSEoIkeJTLqRXXH2ctiYAQk"
                alt="Expert Tutors Icon"
                className="w-full h-full object-contain"
              />
            </div>
            <h3 className="font-headline text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">
              Expert Tutors
            </h3>
            <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
              Learn from qualified Alims and Alimahs dedicated to spiritual growth and pedagogical excellence. Each tutor undergoes thorough background verification and Tajweed certification.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/80">
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 dark:text-blue-400">
              <Check className="w-4 h-4" />
              <span>Male & Female Certified Scholars</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 dark:text-blue-400 mt-2">
              <Check className="w-4 h-4" />
              <span>Fluent in English, Urdu & Arabic</span>
            </div>
          </div>
        </div>

        {/* Feature 3: Flexible Scheduling */}
        <div className="bg-white dark:bg-[#0B1528] rounded-2xl p-6 sm:p-8 shadow-md hover:shadow-xl border border-slate-200/80 dark:border-slate-800 border-t-4 border-t-sunflower-yellow flex flex-col justify-between transition-all duration-300 hover-lift">
          <div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center p-2 mb-4 shadow-sm border border-amber-100 dark:border-amber-800/40">
              <img
                src="https://lh3.googleusercontent.com/aida/AEtjO1VbGbPD1-L1pOZAT9oY7yc9Rhtu36BZvtziJgTEeS6SAUp95qixG3ZAGpgrXaWXHW3A4mrWOJJwcH5AFyXrC3Sa3aEx4DSIDfA6QFt0bvzUnk1IAsFpjwAF8NGVbMoIRMfL0Z4UJgm7-odEtbVBwfkb_zCNUsr6WhfkmuwhVjCr7cXCfJvMGGKvwGW8JFL5crXRB7pL4K1FYdyHAPdHEG02-7V1A5UQiW__1VohoLujKdo-9e2m1tD3B_I"
                alt="Flexible Scheduling Icon"
                className="w-full h-full object-contain"
              />
            </div>
            <h3 className="font-headline text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">
              Flexible Scheduling
            </h3>
            <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
              Classes that seamlessly fit your family's routine, offering globally accessible 24/7 time slots with easy rescheduling and leave requests.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/80">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-400">
              <Clock className="w-4 h-4" />
              <span>Timezone-Adapted Schedules</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-400 mt-2">
              <Clock className="w-4 h-4" />
              <span>Instant Reschedule Requests</span>
            </div>
          </div>
        </div>

        {/* Feature 4: Span 2 (Kids Specialist) */}
        <div className="bg-white dark:bg-[#0B1528] rounded-2xl p-6 sm:p-8 shadow-md hover:shadow-xl border border-slate-200/80 dark:border-slate-800 border-t-4 border-t-cheerful-orange md:col-span-2 flex flex-col md:flex-row items-center gap-8 transition-all duration-300 hover-lift">
          <div className="flex-1">
            <div className="w-12 h-12 rounded-xl bg-orange-50 dark:bg-orange-950/60 flex items-center justify-center p-2 mb-4 shadow-sm border border-orange-100 dark:border-orange-800/40">
              <img
                src="https://lh3.googleusercontent.com/aida/AEtjO1VLCbmVDaK8QA9cSPtN1OAxBzJzBT96KtP1_eG32LM9lbqHqA1H7cxmloAxnknZU9i8wQFST4Ww2f3DPLZ3pCudnV1nlNtjQsmZGX0C4G_b1e72zWhO-r9_F-x3dxmpj3LATeaDuMQuTffy_SyrzFt4lOObeEhpOvt-3b_p2GpDqcQu2u6eCTfKzTNF6YvAD3iY6TRw-aX3axN0bj84VfScjrPX74Rt4F0sApOLijb2LLK2RvJJaS5a4w"
                alt="Kids Specialist Icon"
                className="w-full h-full object-contain"
              />
            </div>
            <h3 className="font-headline text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">
              Kids Specialist
            </h3>
            <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed mb-4">
              Engaging, interactive methods tailored specifically for young learners to build a lifelong love for the Quran. We replace monotonous repetition with encouragement, badges, and cheerful visual aids.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-100/80 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300">
                Ages 4 - 14
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-100/80 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300">
                Interactive Whiteboard
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-100/80 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300">
                Positive Reinforcement
              </span>
            </div>
          </div>
          <div className="flex-1 w-full h-44 sm:h-56 bg-slate-100 dark:bg-slate-900/60 rounded-xl overflow-hidden relative border border-slate-200/60 dark:border-slate-800">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDJuTsiTUaj582MSbqELD02lXy-KvqrKzNbHUs8Y-fihcTXI77mdRvKnMJMtTJR9_k8unPbVQr3qVTeRAHYlqYr6mQWFysPr6BJx4nRIzKcfwzauR0JhsJn_ZsM6C4zsKnqDRDZAz6fHUme_tppJFZm0fs1bSnLkAvLZ4InWKUucLiiS-PFvYoH4U8vWfp6XqAX9DmofUSVWFE5OgYxLFzDjxPmpttvflGP6YdLNvvnhRI4NmFKHVVe"
              alt="Interactive Kids Learning Digital Illustration"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
