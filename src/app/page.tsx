import Link from 'next/link';
import CourseCard from '@/components/CourseCard';
import { prisma } from '@/lib/db';
import { User, BookOpen, Clock, Users, Award, Briefcase, Zap, Accessibility, Trophy } from 'lucide-react';

export default async function Home() {
  const coursesRaw = await prisma.course.findMany({
    where: { published: true },
    take: 3,
    orderBy: { createdAt: 'desc' },
    include: { instructor: true }
  });

  // Serialize Decimal to number for Client Components
  const courses = coursesRaw.map(course => ({
    ...course,
    price: Number(course.price),
    createdAt: course.createdAt.toISOString(),
    updatedAt: course.updatedAt.toISOString(),
  }));

  // Get platform stats
  const [userCount, courseCount] = await Promise.all([
    prisma.user.count(),
    prisma.course.count({ where: { published: true } })
  ]);

  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary to-indigo-600 text-white min-h-[500px] flex items-center pt-12 pb-16">
        <div className="absolute inset-0 bg-[url('/assets/pattern.png')] opacity-10 mix-blend-overlay"></div>
        <div className="container mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center relative z-10">
          <div className="text-center lg:text-left">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 leading-tight tracking-tight">
              Learn Anything, <br className="hidden lg:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-200 to-white">Anytime</span>
            </h1>
            <p className="text-lg md:text-xl text-blue-100 mb-8 max-w-lg mx-auto lg:mx-0 leading-relaxed font-light">
              Expand your horizons with expert-led courses. Join a community of learners achieving their goals with legitimate certifications and flexible schedules.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link href="/signup" className="px-8 py-4 bg-white text-primary rounded-full font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all text-lg flex items-center justify-center gap-2 group">
                Get Started Free
                <Zap size={20} className="group-hover:fill-primary" />
              </Link>
              <Link href="/courses" className="px-8 py-4 border-2 border-white/30 hover:bg-white/10 text-white rounded-full font-bold transition-all text-lg flex items-center justify-center gap-2 backdrop-blur-sm">
                Explore Courses
                <BookOpen size={20} />
              </Link>
            </div>
            <div className="mt-8 flex items-center justify-center lg:justify-start gap-4 text-sm text-blue-100/80">
              <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full bg-blue-300 border-2 border-primary" />
                ))}
              </div>
              <p>Join {userCount.toLocaleString()}+ learners today</p>
            </div>
          </div>
          <div className="relative hidden lg:block">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/10 rounded-full blur-3xl -z-10"></div>
            <img
              src="/assets/images/logo.png"
              alt="Learning Assure Logo"
              className="relative z-10 w-full max-w-md mx-auto drop-shadow-2xl animate-float"
              width={400}
              height={400}
            />
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-12 bg-white border-b border-gray-100">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-gray-100">
            <div className="p-4">
              <div className="text-4xl font-bold text-primary mb-1">{userCount.toLocaleString()}+</div>
              <div className="text-sm text-gray-500 font-medium uppercase tracking-wide">Active Learners</div>
            </div>
            <div className="p-4">
              <div className="text-4xl font-bold text-primary mb-1">{courseCount}+</div>
              <div className="text-sm text-gray-500 font-medium uppercase tracking-wide">Courses Available</div>
            </div>
            <div className="p-4">
              <div className="text-4xl font-bold text-primary mb-1">95%</div>
              <div className="text-sm text-gray-500 font-medium uppercase tracking-wide">Completion Rate</div>
            </div>
            <div className="p-4">
              <div className="text-4xl font-bold text-primary mb-1">4.8★</div>
              <div className="text-sm text-gray-500 font-medium uppercase tracking-wide">Average Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Who It's For - Audience Segmentation */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Built for Everyone Who Wants to Grow</h2>
            <p className="text-xl text-gray-600">Whether you're learning new skills, teaching others, or training teams — we've got you covered.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors text-primary">
                <Users size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">For Learners</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Gain skills with flexible, accessible courses tailored to your goals.
                Study at your own pace and earn certificates that validate your achievements.
              </p>
              <Link href="/signup" className="text-primary font-bold hover:text-blue-700 flex items-center gap-1">Start Learning &rarr;</Link>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-accent group-hover:text-white transition-colors text-accent">
                <Award size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">For Instructors</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Share your expertise and reach learners who value quality education.
                Create courses with our intuitive tools and build your teaching portfolio.
              </p>
              <Link href="/signup" className="text-accent font-bold hover:text-orange-700 flex items-center gap-1">Become an Instructor &rarr;</Link>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-purple-600 group-hover:text-white transition-colors text-purple-600">
                <Briefcase size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">For Organizations</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Enterprise-ready solutions for training and professional development.
                Scale your team's skills with comprehensive learning programs.
              </p>
              <Link href="/signup" className="text-purple-600 font-bold hover:text-purple-800 flex items-center gap-1">Contact Sales &rarr;</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Key Benefits */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-blue-50/50 skew-x-12 translate-x-1/2"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Why Choose Learning Assure?</h2>
            <p className="text-xl text-gray-600">We believe education should be accessible, verifiable, and flexible for everyone.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto rounded-full bg-blue-50 text-primary flex items-center justify-center mb-6 shadow-sm">
                <Accessibility size={40} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Accessible by Design</h3>
              <p className="text-gray-600 leading-relaxed max-w-sm mx-auto">
                Built with screen readers, keyboard navigation, and WCAG standards in mind.
                Everyone deserves equal access to quality education.
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 mx-auto rounded-full bg-orange-50 text-accent flex items-center justify-center mb-6 shadow-sm">
                <Trophy size={40} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Verified Achievements</h3>
              <p className="text-gray-600 leading-relaxed max-w-sm mx-auto">
                Earn certificates that employers recognize and trust.
                Your accomplishments are verifiable and shareable across platforms.
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 mx-auto rounded-full bg-green-50 text-green-600 flex items-center justify-center mb-6 shadow-sm">
                <Clock size={40} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Learn on Your Schedule</h3>
              <p className="text-gray-600 leading-relaxed max-w-sm mx-auto">
                Study at your own pace, on any device, whenever it works for you.
                No deadlines, no pressure — just meaningful progress.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-gray-50 border-t border-gray-100">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Simple Steps to Success</h2>
            <p className="text-xl text-gray-600">Getting started with Learning Assure is easy and straightforward.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="text-center relative z-10">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-white border-2 border-primary text-primary flex items-center justify-center text-2xl font-bold mb-6 shadow-md skew-y-3">
                1
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Create Your Account</h3>
              <p className="text-gray-600">Sign up in seconds and tell us about your learning goals.</p>
            </div>
            <div className="text-center relative z-10">
              {/* Connecting Line (Desktop) */}
              <div className="hidden md:block absolute top-8 -left-1/2 w-full h-1 bg-gray-200 -z-10 border-t-2 border-dashed border-gray-300"></div>
              <div className="w-16 h-16 mx-auto rounded-2xl bg-white border-2 border-primary text-primary flex items-center justify-center text-2xl font-bold mb-6 shadow-md -skew-y-3">
                2
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Explore & Enroll</h3>
              <p className="text-gray-600">Browse our course catalog and enroll in topics that interest you.</p>
            </div>
            <div className="text-center relative z-10">
              {/* Connecting Line (Desktop) */}
              <div className="hidden md:block absolute top-8 -left-1/2 w-full h-1 bg-gray-200 -z-10 border-t-2 border-dashed border-gray-300"></div>
              <div className="w-16 h-16 mx-auto rounded-2xl bg-white border-2 border-primary text-primary flex items-center justify-center text-2xl font-bold mb-6 shadow-md skew-y-3">
                3
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Learn & Earn</h3>
              <p className="text-gray-600">Complete courses at your pace and earn verified certificates.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Available Courses */}
      <section className="py-16 bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
        <div className="container max-w-7xl mx-auto px-6 md:px-12">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">Available Courses</h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">Start your learning journey with our most popular courses</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 place-items-center sm:place-items-stretch">
            {courses.map((course: any, index: number) => (
              <div key={course.id} className="w-full">
                <CourseCard course={course} />
              </div>
            ))}
          </div>

          {courses.length > 0 && (
            <div className="mt-12 text-center animate-fade-in-up delay-300">
              <Link href="/courses" className="inline-flex items-center gap-2 text-blue-600 font-bold hover:text-blue-700 group text-lg">
                View All Courses <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
              </Link>
            </div>
          )}

          {courses.length === 0 && (
            <div className="text-center py-16 px-4 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 animate-fade-in-up">
              <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg">No courses available yet. Check back soon!</p>
            </div>
          )}
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-primary text-white text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('/assets/pattern.png')] opacity-10"></div>
        <div className="container mx-auto px-4 relative z-10 max-w-4xl">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Ready to Start Your Learning Journey?
          </h2>
          <p className="text-xl text-blue-100 mb-10 leading-relaxed max-w-2xl mx-auto">
            Join thousands of learners building skills that matter.
            Create your free account today and take the first step toward your goals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup" className="px-8 py-4 bg-white text-primary rounded-full font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all text-lg">
              Get Started Free
            </Link>
            <Link href="/courses" className="px-8 py-4 bg-primary-600 border-2 border-white/30 hover:bg-white/10 text-white rounded-full font-bold transition-all text-lg backdrop-blur-sm">
              Browse Courses
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
