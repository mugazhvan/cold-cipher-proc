import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

describe('Farmer App Initial Scaffold', () => {
  it('renders application title', () => {
    render(<App />)
    expect(screen.getByText('KisanFlow')).toBeDefined()
    expect(screen.getByText('Farmer Interface Scaffold')).toBeDefined()
  })
})
