/**
 * Universal Charts E2E Tests
 * Tests TradesViz chart integration across different asset classes
 */

describe('Universal Trade Charts', () => {
  beforeEach(() => {
    // Set TradesViz environment variable
    cy.intercept('GET', '**/api/**', { fixture: 'trades.json' }).as('getTrades')
    
    // Visit dashboard and authenticate (assumes auth is handled)
    cy.visit('/dashboard')
    cy.wait('@getTrades')
  })

  const testCases = [
    {
      symbol: 'NQ',
      assetClass: 'futures',
      description: 'NASDAQ 100 Futures'
    },
    {
      symbol: 'AAPL',
      assetClass: 'stocks', 
      description: 'Apple Stock'
    },
    {
      symbol: 'EURUSD',
      assetClass: 'forex',
      description: 'EUR/USD Forex Pair'
    },
    {
      symbol: 'BTCUSD',
      assetClass: 'crypto',
      description: 'Bitcoin/USD'
    },
    {
      symbol: 'AAPL240315C150',
      assetClass: 'options',
      description: 'Apple Call Option'
    }
  ]

  testCases.forEach(({ symbol, assetClass, description }) => {
    it(`should display TradesViz chart for ${description} (${symbol})`, () => {
      // Click on a trade with the specific symbol
      cy.get('[data-testid="trade-row"]')
        .contains(symbol)
        .click()

      // Trade detail modal should open
      cy.get('[data-testid="trade-detail-modal"]')
        .should('be.visible')

      // Click on Chart tab
      cy.get('[data-testid="chart-tab"]')
        .click()

      // Chart container should be visible
      cy.get('[data-testid="trade-chart-container"]')
        .should('be.visible')

      // Check for TradesViz iframe
      cy.get('[data-testid="trade-chart-container"] iframe')
        .should('exist')
        .and('have.attr', 'src')
        .and('include', 'tradesviz.com/embed')

      // Verify asset class is detected correctly
      cy.get('[data-testid="chart-asset-class"]')
        .should('contain.text', assetClass)

      // Wait for chart to load (entry arrow should appear)
      cy.get('[data-testid="trade-chart-container"] iframe', { timeout: 10000 })
        .should('be.visible')
        
      // Check that chart loaded successfully (no error message)
      cy.get('[data-testid="chart-error"]')
        .should('not.exist')

      // Verify chart dimensions
      cy.get('[data-testid="trade-chart-container"]')
        .should('have.css', 'width')
        .and('not.equal', '0px')
    })
  })

  it('should handle disabled TradesViz gracefully', () => {
    // Mock environment variable as disabled
    cy.window().then((win) => {
      // Override process.env for testing
      win.process = win.process || {}
      win.process.env = win.process.env || {}
      win.process.env.NEXT_PUBLIC_TRADESVIZ_ENABLED = 'false'
    })

    // Click on any trade
    cy.get('[data-testid="trade-row"]')
      .first()
      .click()

    // Trade detail modal should open
    cy.get('[data-testid="trade-detail-modal"]')
      .should('be.visible')

    // Click on Chart tab
    cy.get('[data-testid="chart-tab"]')
      .click()

    // Should show disabled message
    cy.get('[data-testid="chart-error"]')
      .should('be.visible')
      .and('contain.text', 'TradesViz charts are currently disabled')
  })

  it('should handle unsupported asset classes', () => {
    // Test with a CFD or other unsupported asset
    cy.get('[data-testid="trade-row"]')
      .contains('CFD') // Assuming there's a CFD trade
      .click()

    cy.get('[data-testid="trade-detail-modal"]')
      .should('be.visible')

    cy.get('[data-testid="chart-tab"]')
      .click()

    // Should show unsupported message
    cy.get('[data-testid="chart-error"]')
      .should('be.visible')
      .and('contain.text', 'not yet supported')
  })

  it('should display proper entry/exit markers', () => {
    // Test with a closed trade that has both entry and exit
    cy.get('[data-testid="trade-row"]')
      .contains('CLOSED')
      .first()
      .click()

    cy.get('[data-testid="chart-tab"]')
      .click()

    // Verify iframe src contains entry and exit parameters
    cy.get('[data-testid="trade-chart-container"] iframe')
      .should('have.attr', 'src')
      .then((src) => {
        expect(src).to.include('entry_time=')
        expect(src).to.include('entry_price=')
        expect(src).to.include('exit_time=')
        expect(src).to.include('exit_price=')
      })
  })

  it('should maintain chart state when switching tabs', () => {
    // Open trade detail
    cy.get('[data-testid="trade-row"]')
      .first()
      .click()

    // Go to chart tab
    cy.get('[data-testid="chart-tab"]')
      .click()

    // Wait for chart to load
    cy.get('[data-testid="trade-chart-container"] iframe')
      .should('be.visible')

    // Switch to another tab
    cy.get('[data-testid="performance-tab"]')
      .click()

    // Switch back to chart tab
    cy.get('[data-testid="chart-tab"]')
      .click()

    // Chart should still be there (not reloaded)
    cy.get('[data-testid="trade-chart-container"] iframe')
      .should('be.visible')
  })
})

// Test data setup commands
Cypress.Commands.add('setupTradeData', () => {
  // Custom command to seed test data with different asset classes
  cy.request('POST', '/api/test/seed-trades', {
    trades: [
      {
        symbol: 'NQ',
        market: 'FUTURES',
        side: 'LONG',
        entryPrice: 20000,
        exitPrice: 20100,
        status: 'CLOSED'
      },
      {
        symbol: 'AAPL',
        market: 'STOCKS',
        side: 'LONG', 
        entryPrice: 150,
        exitPrice: 155,
        status: 'CLOSED'
      },
      {
        symbol: 'EURUSD',
        market: 'FOREX',
        side: 'SHORT',
        entryPrice: 1.0800,
        exitPrice: 1.0750,
        status: 'CLOSED'
      }
    ]
  })
})