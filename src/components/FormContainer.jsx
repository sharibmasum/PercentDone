import React from 'react'
import { Link } from 'react-router-dom'

export default function FormContainer({
  title,
  subtitle,
  linkText,
  linkTo,
  children,
  onSubmit
}) {
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {title}
          </h2>
          {subtitle && linkText && linkTo && (
            <p className="mt-2 text-center text-sm text-gray-600">
              {subtitle}{' '}
              <Link to={linkTo} className="font-medium text-primary-600 hover:text-primary-500">
                {linkText}
              </Link>
            </p>
          )}
        </div>
        <form className="mt-8 space-y-6" onSubmit={onSubmit}>
          {children}
        </form>
      </div>
    </div>
  )
} 