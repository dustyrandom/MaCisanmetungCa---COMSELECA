import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import iconHeader from '../assets/icon.png'

function NavBar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const location = useLocation()
  const { user, userData, isEmailVerified, logout } = useAuth()

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
          <nav className="hidden md:flex items-center space-x-8 relative">
            <Link to="/" className={`${baseLink} ${isActive('/') ? activeClasses : inactiveClasses}`}>HOME</Link>
            <Link to="/about" className={`${baseLink} ${isActive('/about') ? activeClasses : inactiveClasses}`}>ABOUT</Link>
            <Link to="/result" className={`${baseLink} ${isActive('/result') ? activeClasses : inactiveClasses}`}>RESULT</Link>
            <Link to="/campaigns" className={`${baseLink} ${isActive('/campaigns') ? activeClasses : inactiveClasses}`}>CAMPAIGNS</Link>
            <Link to="/vote" className={`${baseLink} ${isActive('/vote') ? activeClasses : inactiveClasses}`}>VOTE</Link>
            {!user && (
              <Link to="/login" className={`${baseLink} ${isActive('/login') ? activeClasses : inactiveClasses}`}>LOG IN</Link>
            )}
            {user && (
              <>
                {isEmailVerified() && (
                  <Link to="/dashboard" className={`${baseLink} ${isActive('/dashboard') ? activeClasses : inactiveClasses}`}>DASHBOARD</Link>
                )}
              <div className="ml-2 relative">
                <button
                  type="button"
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 focus:outline-none"
                  aria-haspopup="menu"
                  aria-expanded={isProfileOpen}
                >
                  {userData?.profilePicture ? (
                    <img
                      className="h-8 w-8 rounded-full object-cover"
                      src={userData.profilePicture}
                      alt="Profile"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-red-900 text-white flex items-center justify-center text-xs font-bold">
                      {(userData?.name || '').slice(0,2).toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm text-gray-700 font-medium hidden lg:inline">{userData?.name || 'User'}</span>
                  <svg className="h-4 w-4 text-gray-600" viewBox="0 0 20 20" fill="currentColor"><path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"/></svg>
                </button>
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-44 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 z-20">
                    <div className="py-1 text-sm">
                      <div className="px-4 py-2 border-b border-gray-100 text-xs text-gray-600">
                        Role: {userData?.role?.toUpperCase() || 'VOTER'}
                      </div>
                      <Link 
                        to="/profile" 
                        onClick={() => setIsProfileOpen(false)}
                        className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50"
                      >
                        Profile
                      </Link>
                      <button onClick={() => { setIsProfileOpen(false); logout() }} className="w-full text-left px-4 py-2 text-red-700 hover:bg-red-50">Sign out</button>
                    </div>
                  </div>
                )}
              </div>
              </>
            )}
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
          <div className="md:hidden px-4 pb-3 space-y-1">
            <Link to="/" className={`block py-2 text-base ${isActive('/') ? 'text-red-900' : 'text-red-800'}`}>
              <span className={`${isActive('/') ? 'inline-block border-b border-red-900' : ''}`}>HOME</span>
            </Link>
            <Link to="/about" className={`block py-2 text-base ${isActive('/about') ? 'text-red-900' : 'text-red-800'}`}>
              <span className={`${isActive('/about') ? 'inline-block border-b border-red-900' : ''}`}>ABOUT</span>
            </Link>
            <Link to="/result" className={`block py-2 text-base ${isActive('/result') ? 'text-red-900' : 'text-red-800'}`}>
              <span className={`${isActive('/result') ? 'inline-block border-b border-red-900' : ''}`}>RESULT</span>
            </Link>
            <Link to="/campaigns" className={`block py-2 text-base ${isActive('/campaigns') ? 'text-red-900' : 'text-red-800'}`}>
              <span className={`${isActive('/campaigns') ? 'inline-block border-b border-red-900' : ''}`}>CAMPAIGNS</span>
            </Link>
            <Link to="/vote" className={`block py-2 text-base ${isActive('/vote') ? 'text-red-900' : 'text-red-800'}`}>
              <span className={`${isActive('/vote') ? 'inline-block border-b border-red-900' : ''}`}>VOTE</span>
            </Link>
            {!user && (
              <Link to="/login" className={`block py-2 text-base ${isActive('/login') ? 'text-red-900' : 'text-red-800'}`}>
                <span className={`${isActive('/login') ? 'inline-block border-b border-red-900' : ''}`}>LOG IN</span>
              </Link>
            )}
            {user && (
              <>
                {isEmailVerified() && (
                  <Link to="/dashboard" className={`block py-2 text-base ${isActive('/dashboard') ? 'text-red-900' : 'text-red-800'}`}>
                    <span className={`${isActive('/dashboard') ? 'inline-block border-b border-red-900' : ''}`}>DASHBOARD</span>
                  </Link>
                )}
                <div className="py-2 flex justify-between items-center">
                  <span className="text-sm text-gray-700">{userData?.name || 'User'}</span>
                  <span className="text-xs text-gray-500">Role: {userData?.role?.toUpperCase() || 'VOTER'}</span>
                </div>
                <button onClick={logout} className="py-2 text-red-700 font-semibold">LOG OUT</button>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  )
}

export default NavBar


