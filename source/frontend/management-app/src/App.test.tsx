import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

describe('Management App Interface', () => {
  it('renders operator console header texts', () => {
    render(<App />)
    expect(screen.getByText('Government of India • Department of Consumer Affairs')).toBeDefined()
    expect(screen.getByText('Mandi Operational Center & Quality Control Console')).toBeDefined()
  })
})
