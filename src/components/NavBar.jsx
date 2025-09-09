import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import iconHeader from '../assets/icon.png'

function NavBar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const location = useLocation()

  const isActive = (path) => location.pathname === path

  const baseLink = 'font-semibold'
  const activeClasses = 'text-red-900 border-b border-red-900'
  const inactiveClasses = 'text-red-800 hover:text-red-600'

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3">
            <img src={iconHeader} alt="MaCisanmetungCa Icon" className="h-12 w-12" />
            <div>
              <h1 className="text-2xl font-bold text-red-800">MaCisanmetungCa</h1>
              <p className="text-sm text-gray-600">COMSELECA - MABALACAT CITY COLLEGE</p>
            </div>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className={`${baseLink} ${isActive('/') ? activeClasses : inactiveClasses}`}>HOME</Link>
            <Link to="/about" className={`${baseLink} ${isActive('/about') ? activeClasses : inactiveClasses}`}>ABOUT</Link>
            <Link to="/result" className={`${baseLink} ${isActive('/result') ? activeClasses : inactiveClasses}`}>RESULT</Link>
            <Link to="/vote" className={`${baseLink} ${isActive('/vote') ? activeClasses : inactiveClasses}`}>VOTE</Link>
            <Link to="/login" className={`${baseLink} ${isActive('/login') ? activeClasses : inactiveClasses}`}>LOG IN</Link>
          </nav>

          {/* Mobile menu button */}
          <button
            type="button"
            aria-label="Open menu"
            className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-red-900 hover:text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-red-600"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden px-2 pt-2 pb-3 space-y-1">
            <Link to="/" className={`block px-3 py-2 rounded-md text-base ${isActive('/') ? 'font-semibold text-red-900 border-b border-red-900' : 'text-red-800 hover:bg-red-50'}`}>HOME</Link>
            <Link to="/about" className={`block px-3 py-2 rounded-md text-base ${isActive('/about') ? 'font-semibold text-red-900 border-b border-red-900' : 'text-red-800 hover:bg-red-50'}`}>ABOUT</Link>
            <Link to="/result" className={`block px-3 py-2 rounded-md text-base ${isActive('/result') ? 'font-semibold text-red-900 border-b border-red-900' : 'text-red-800 hover:bg-red-50'}`}>RESULT</Link>
            <Link to="/vote" className={`block px-3 py-2 rounded-md text-base ${isActive('/vote') ? 'font-semibold text-red-900 border-b border-red-900' : 'text-red-800 hover:bg-red-50'}`}>VOTE</Link>
            <Link to="/login" className={`block px-3 py-2 rounded-md text-base ${isActive('/login') ? 'font-semibold text-red-900 border-b border-red-900' : 'text-red-800 hover:bg-red-50'}`}>LOG IN</Link>
          </div>
        )}
      </div>
    </header>
  )
}

export default NavBar


