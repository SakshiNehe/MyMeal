# MyMeal - AI-Powered Meal Planning App

MyMeal is a React Native mobile application that helps users plan their meals using the Google Gemini AI API. The app provides personalized meal suggestions based on user preferences, dietary restrictions, and budget constraints.

## Features

- AI-powered meal planning using Google Gemini API
- Personalized meal suggestions based on user preferences
- Support for dietary restrictions and allergies
- Budget tracking and analysis
- Dark/Light mode support
- Meal history and search functionality
- Weekly meal planning
- Nutrition information tracking

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Expo CLI
- Google Gemini API key

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/my-meal.git
cd my-meal
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create a `.env` file in the root directory and add your Google Gemini API key:
```
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
```

4. Start the development server:
```bash
npm start
# or
yarn start
```

## Project Structure

```
my-meal/
├── app/                 # Expo Router app directory
├── assets/             # Static assets (images, fonts)
├── components/         # Reusable React components
├── context/           # React Context providers
├── services/          # API and service integrations
├── screens/           # Screen components
├── app.config.js      # Expo configuration
├── package.json       # Project dependencies
└── README.md          # Project documentation
```

## Environment Variables

- `EXPO_PUBLIC_GEMINI_API_KEY`: Your Google Gemini API key

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Google Gemini AI API
- Expo
- React Native community
