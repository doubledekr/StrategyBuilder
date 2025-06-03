# AI Trading Strategy Builder - React Native TypeScript

An AI-powered mobile trading strategy builder that translates natural language prompts into customizable, backtestable trading strategies.

## Features

- **Natural Language Strategy Creation**: Describe your trading strategy in plain English
- **AI-Powered Strategy Generation**: Uses OpenAI to generate multiple strategy options
- **Real-time Backtesting**: Test strategies against historical market data
- **Strategy Optimization**: Automatically optimize parameters for better performance
- **Strategy Library**: Save and manage your trading strategies
- **Performance Analytics**: Detailed charts and metrics for strategy evaluation

## Tech Stack

- **Frontend**: React Native with TypeScript
- **Backend**: Flask (Python)
- **Navigation**: React Navigation v6
- **Charts**: React Native Chart Kit
- **APIs**: OpenAI GPT-4, TwelveData Market Data
- **Database**: PostgreSQL

## Project Structure

```
├── src/
│   ├── components/          # Reusable React Native components
│   │   └── StrategyCard.tsx
│   ├── navigation/          # Navigation configuration
│   │   └── AppNavigator.tsx
│   ├── screens/            # App screens
│   │   ├── HomeScreen.tsx
│   │   ├── StrategyDetailScreen.tsx
│   │   ├── LibraryScreen.tsx
│   │   └── BacktestScreen.tsx
│   ├── services/           # API services
│   │   └── api.ts
│   ├── types/              # TypeScript type definitions
│   │   └── index.ts
│   └── App.tsx
├── backend/                # Flask backend
│   ├── ai_agent.py
│   ├── backtester.py
│   ├── data_fetcher.py
│   ├── intent_parser.py
│   └── strategy_store.py
├── app.py                  # Flask app entry point
├── tsconfig.json
├── babel.config.js
├── metro.config.js
└── index.js
```

## Installation

### Prerequisites

- Node.js 18+ 
- Python 3.11+
- React Native development environment
- OpenAI API key
- TwelveData API key

### Backend Setup

1. Install Python dependencies:
```bash
pip install flask flask-sqlalchemy gunicorn numpy openai psycopg2-binary requests email-validator
```

2. Set environment variables:
```bash
export OPENAI_API_KEY=your_openai_api_key
export TWELVEDATA_API_KEY=your_twelvedata_api_key
export DATABASE_URL=your_postgres_database_url
export SESSION_SECRET=your_session_secret
```

3. Start the Flask backend:
```bash
gunicorn --bind 0.0.0.0:5000 --reuse-port --reload main:app
```

### React Native Setup

1. Install dependencies:
```bash
npm install
```

2. For iOS:
```bash
npx react-native run-ios
```

3. For Android:
```bash
npx react-native run-android
```

## API Configuration

The mobile app communicates with the Flask backend running on `localhost:5000`. Update the API base URL in `src/services/api.ts` if deploying to a different environment.

## Strategy Creation Flow

1. **Input**: User describes strategy in natural language
2. **Parse**: AI extracts structured intent from user prompt
3. **Generate**: AI creates 3 different trading strategies
4. **Customize**: User can view and modify strategy parameters
5. **Backtest**: Test strategy against historical data
6. **Optimize**: Fine-tune parameters for better performance
7. **Save**: Store successful strategies in personal library

## Key Components

### HomeScreen
- Natural language input for strategy creation
- AI intent parsing and strategy generation
- Step-by-step workflow display

### StrategyDetailScreen
- Detailed strategy parameters and rules
- Backtesting and optimization controls
- Risk management settings

### BacktestScreen
- Performance charts and metrics
- Trade history analysis
- Comparison with buy-and-hold strategy

### LibraryScreen
- Saved strategy management
- Performance comparison tools
- Strategy search and filtering

## TypeScript Features

- **Strict type checking** for all components and services
- **Interface definitions** for all data structures
- **Type-safe navigation** with parameter validation
- **Generic API responses** for consistent error handling
- **Component prop typing** for better development experience

## Dependencies

### React Native Core
- react-native
- react
- typescript
- @types/react
- @types/react-native

### Navigation
- @react-navigation/native
- @react-navigation/stack
- @react-navigation/bottom-tabs
- react-native-screens
- react-native-safe-area-context
- react-native-gesture-handler

### UI Components
- react-native-vector-icons
- react-native-chart-kit
- react-native-svg

### API Communication
- axios

## Environment Variables

```
OPENAI_API_KEY=your_openai_api_key
TWELVEDATA_API_KEY=your_twelvedata_api_key
DATABASE_URL=postgresql://user:password@host:port/database
SESSION_SECRET=your_secret_key
```

## License

ISC License

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

For API key setup:
- OpenAI: https://platform.openai.com
- TwelveData: https://twelvedata.com/pricing