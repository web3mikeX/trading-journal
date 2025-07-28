/// <reference types="cypress" />

// Custom commands for TradesViz chart testing

Cypress.Commands.add('setupTradeData', () => {
  // Seed test database with trades of different asset classes
  cy.request('POST', '/api/test/seed-trades', {
    trades: [
      {
        id: 'test-futures-1',
        symbol: 'NQ',
        market: 'FUTURES',
        side: 'LONG',
        entryPrice: 20000,
        exitPrice: 20100,
        quantity: 1,
        entryDate: new Date('2025-01-15T09:30:00Z'),
        exitDate: new Date('2025-01-15T15:30:00Z'),
        status: 'CLOSED',
        netPnL: 500
      },
      {
        id: 'test-stocks-1', 
        symbol: 'AAPL',
        market: 'STOCKS',
        side: 'LONG',
        entryPrice: 150,
        exitPrice: 155,
        quantity: 100,
        entryDate: new Date('2025-01-16T09:30:00Z'),
        exitDate: new Date('2025-01-16T15:30:00Z'),
        status: 'CLOSED',
        netPnL: 500
      },
      {
        id: 'test-forex-1',
        symbol: 'EURUSD',
        market: 'FOREX', 
        side: 'SHORT',
        entryPrice: 1.0800,
        exitPrice: 1.0750,
        quantity: 10000,
        entryDate: new Date('2025-01-17T08:00:00Z'),
        exitDate: new Date('2025-01-17T16:00:00Z'),
        status: 'CLOSED',
        netPnL: 500
      },
      {
        id: 'test-crypto-1',
        symbol: 'BTCUSD',
        market: 'CRYPTO',
        side: 'LONG',
        entryPrice: 45000,
        exitPrice: 46000,
        quantity: 0.1,
        entryDate: new Date('2025-01-18T00:00:00Z'),
        exitDate: new Date('2025-01-18T12:00:00Z'),
        status: 'CLOSED',
        netPnL: 100
      },
      {
        id: 'test-options-1',
        symbol: 'AAPL240315C150',
        market: 'OPTIONS',
        side: 'LONG',
        entryPrice: 5.50,
        exitPrice: 7.00,
        quantity: 10,
        entryDate: new Date('2025-01-19T09:30:00Z'),
        exitDate: new Date('2025-01-19T15:30:00Z'),
        status: 'CLOSED',
        netPnL: 1500
      }
    ]
  })
})

// Command to enable/disable TradesViz
Cypress.Commands.add('setTradesVizEnabled', (enabled: boolean) => {
  cy.window().then((win) => {
    win.process = win.process || {}
    win.process.env = win.process.env || {}
    win.process.env.NEXT_PUBLIC_TRADESVIZ_ENABLED = enabled.toString()
  })
})

// Command to authenticate user for testing
Cypress.Commands.add('loginTestUser', () => {
  cy.request({
    method: 'POST',
    url: '/api/auth/signin',
    body: {
      email: 'test@example.com',
      password: 'testpassword123'
    }
  }).then((response) => {
    expect(response.status).to.eq(200)
  })
})

// Command to wait for chart to load
Cypress.Commands.add('waitForChartLoad', () => {
  cy.get('[data-testid="trade-chart-container"] iframe', { timeout: 15000 })
    .should('be.visible')
    .and('have.attr', 'src')
    .and('include', 'tradesviz.com')
})

declare global {
  namespace Cypress {
    interface Chainable {
      setupTradeData(): Chainable<void>
      setTradesVizEnabled(enabled: boolean): Chainable<void>
      loginTestUser(): Chainable<void>
      waitForChartLoad(): Chainable<void>
    }
  }
}