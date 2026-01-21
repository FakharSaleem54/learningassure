import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="bg-gray-50 border-t border-gray-200 pt-16 pb-8">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                    <div>
                        <h4 className="font-bold text-lg mb-4 text-gray-900">Learning Assure</h4>
                        <p className="text-gray-600 mb-6 leading-relaxed">Empowering educators to share knowledge worldwide.</p>
                        <div className="flex gap-4">
                            {['📘', '🐦', '📷', '💼'].map((icon, i) => (
                                <Link key={i} href="#" className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-gray-200 hover:border-primary hover:text-primary transition-colors text-lg">
                                    {icon}
                                </Link>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-900 mb-4">Platform</h4>
                        <ul className="space-y-3">
                            <li><Link href="/courses" className="text-gray-600 hover:text-primary transition-colors">Browse Courses</Link></li>
                            <li><Link href="/bundles" className="text-gray-600 hover:text-primary transition-colors">Course Bundles</Link></li>
                            <li><Link href="/learning-paths" className="text-gray-600 hover:text-primary transition-colors">Learning Paths</Link></li>
                            <li><Link href="/instructor" className="text-gray-600 hover:text-primary transition-colors">Become an Instructor</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-900 mb-4">Community</h4>
                        <ul className="space-y-3">
                            <li><Link href="/forum" className="text-gray-600 hover:text-primary transition-colors">Discussion Forum</Link></li>
                            <li><Link href="#" className="text-gray-600 hover:text-primary transition-colors">Student Community</Link></li>
                            <li><Link href="#" className="text-gray-600 hover:text-primary transition-colors">Instructor Hub</Link></li>
                            <li><Link href="#" className="text-gray-600 hover:text-primary transition-colors">Events & Webinars</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-900 mb-4">Support</h4>
                        <ul className="space-y-3">
                            <li><Link href="/support" className="text-gray-600 hover:text-primary transition-colors">Help Center</Link></li>
                            <li><Link href="/support#contact" className="text-gray-600 hover:text-primary transition-colors">Contact Us</Link></li>
                            <li><Link href="/support" className="text-gray-600 hover:text-primary transition-colors">System Status</Link></li>
                            <li><Link href="/support#contact" className="text-gray-600 hover:text-primary transition-colors">Feedback</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-200 pt-8 mt-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-gray-500">
                        <p>&copy; {new Date().getFullYear()} Learning Assure. All rights reserved.</p>
                        <div className="flex flex-wrap gap-6">
                            <Link href="#" className="hover:text-primary transition-colors">About</Link>
                            <Link href="#" className="hover:text-primary transition-colors">Careers</Link>
                            <Link href="#" className="hover:text-primary transition-colors">Press</Link>
                            <Link href="#" className="hover:text-primary transition-colors">Investors</Link>
                            <Link href="#" className="hover:text-primary transition-colors">Blog</Link>
                        </div>
                        <div className="flex flex-wrap gap-6">
                            <Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link>
                            <Link href="#" className="hover:text-primary transition-colors">Terms of Service</Link>
                            <Link href="#" className="hover:text-primary transition-colors">Cookie Policy</Link>
                            <Link href="#" className="hover:text-primary transition-colors">Accessibility</Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
