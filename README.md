This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Universal Trade Charts

This trading journal includes universal chart integration powered by TradesViz, supporting multiple asset classes with intelligent symbol detection and provider fallbacks.

### Features

- **Multi-Asset Support**: Automated detection and visualization for:
  - Futures (NQ, ES, YM, RTY, CL, GC, etc.)
  - Stocks (AAPL, MSFT, TSLA, etc.)
  - Forex (EURUSD, GBPUSD, USDJPY, etc.)
  - Cryptocurrency (BTC, ETH, LTC, etc.)
  - Options (with expiration and strike detection)

- **Smart Symbol Mapping**: Automatic conversion between trading journal symbols and TradesViz format
- **Entry/Exit Visualization**: Automatic annotation of trade entry and exit points on charts
- **Theme Integration**: Dark/light theme support matching your journal preferences
- **Graceful Fallbacks**: Clear error messages for unsupported symbols or disabled features

### Setup

1. **Enable TradesViz Integration**
   ```bash
   # Copy environment template
   cp .env.example .env.local
   
   # Enable TradesViz charts
   echo "NEXT_PUBLIC_TRADESVIZ_ENABLED=true" >> .env.local
   ```

2. **Access Charts**
   - Open any trade in the trade detail modal
   - Click the "Chart" tab to view the interactive chart
   - Charts automatically display entry/exit markers for closed trades

### Environment Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_TRADESVIZ_ENABLED` | `false` | Enable/disable TradesViz chart integration |

### Asset Class Detection

The system automatically detects asset classes using:

1. **Primary**: `market` field in trade data (`FUTURES`, `STOCKS`, `FOREX`, `CRYPTO`, `OPTIONS`)
2. **Fallback**: Symbol pattern matching:
   - Futures: `NQ`, `ES`, `YM`, `CL`, `GC`, etc.
   - Forex: Currency pairs like `EURUSD`, `GBP/USD`
   - Crypto: `BTC`, `ETH` + common suffixes
   - Options: Symbols with expiration dates or CALL/PUT

### Testing

Run the chart-specific E2E tests:

```bash
# Install Cypress (if not already installed)
npm install cypress --save-dev

# Run chart integration tests
npm run cypress:run

# Open Cypress test runner
npm run cypress:open
```

The test suite includes:
- Multi-asset class chart loading verification
- Entry/exit marker validation
- Error handling for disabled/unsupported charts
- Theme and responsive design testing

### Troubleshooting

**Charts not loading?**
- Verify `NEXT_PUBLIC_TRADESVIZ_ENABLED=true` in your environment
- Check browser console for iframe loading errors
- Ensure trade has valid entry date and price data

**Unsupported symbol?**
- Check if asset class is in the supported list
- Verify symbol format matches expected patterns
- Add custom mapping in `src/lib/tradesvizUrl.ts` if needed

**Chart showing wrong data?**
- Verify trade entry/exit dates and prices are accurate
- Check symbol mapping for your specific asset class
- Ensure TradesViz supports the symbol format

### Development

To extend chart support:

1. **Add new asset class**: Update `detectAssetClass()` in `src/lib/tradesvizUrl.ts`
2. **Custom symbol mapping**: Modify `formatSymbolForTradesViz()` function
3. **Test coverage**: Add test cases in `cypress/e2e/universal-charts.cy.ts`

### Architecture

```
src/
├── lib/tradesvizUrl.ts          # Asset detection & URL generation
├── components/TradeChart.tsx     # Chart embed component
└── components/TradeDetailModal.tsx  # Chart integration
```

The system uses a modular architecture with clear separation between:
- Asset class detection logic
- URL generation for different providers
- React component rendering and error handling
- E2E test coverage for reliability
