
import Link from 'next/link'
import Image from 'next/image'

export default function Navbar() {
    return (
        <nav className="border-b border-white/10 bg-black/20 backdrop-blur-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    <div className="flex items-center">
                        <Link href="/" className="flex items-center gap-3 flex-shrink-0">
                            <Image
                                src="/logo.png"
                                alt="TREL-MDM Logo"
                                width={180}
                                height={60}
                                className="h-16 w-auto object-contain"
                                priority
                            />
                            <span className="text-xl font-bold text-white tracking-tight">TREL-MDM</span>
                        </Link>
                        <div className="hidden md:block ml-10">
                            <div className="flex items-baseline space-x-4">
                                <Link href="/" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                                    Dashboard
                                </Link>
                                <Link href="/inventory" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                                    Inventory
                                </Link>
                                <Link href="/people" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                                    People
                                </Link>
                            </div>
                        </div>
                    </div>
                    <div>
                        <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 ring-2 ring-white/20"></div>
                    </div>
                </div>
            </div>
        </nav>
    )
}
