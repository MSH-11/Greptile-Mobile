# Greptile Mobile

**Greptile Mobile** allows users to perform repository searches and interactions similar to the Greptile web app, but on the go. With this mobile application, you can sign in with your GitHub account, select repositories, and chat with an AI that helps you query and explore your codebase right from your mobile device.

## Features

- **GitHub Authentication**: Securely sign in with your GitHub account to access your repositories.
- **Repository Selection**: Browse your repositories and select the ones you want to interact with.
- **AI-Powered Chat**: Query your repositories, fetch code snippets, and gain insights with the help of an AI.

## Getting Started

### Prerequisites

To get started with Greptile Mobile, you will need:

- **Node.js** and **npm** (or **Yarn**) installed on your machine.
- **Expo CLI**: Install globally using `npm install -g expo-cli`.
- A **GitHub Developer Account** to create OAuth credentials.
- Access to the **Greptile API** (with a valid API key).
- **macOS** (for iOS or Android builds) or a **Windows/Linux** machine (for Android builds).

### Installation

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/your-username/greptile-mobile.git
   cd greptile-mobile
   ```

2. **Install Dependencies:**

   Using npm:

   ```bash
   npm install
   ```

   Or using Yarn:

   ```bash
   yarn install
   ```

3. **Create a `.env` File:**

   Create a `.env` file in the root of your project with the following environment variables:

   ```plaintext
   GITHUB_CLIENT_ID=your_github_client_id
   GITHUB_CLIENT_SECRET=your_github_client_secret
   GREPTILE_API_KEY=your_greptile_api_key
   ```

   Replace `your_github_client_id`, `your_github_client_secret`, and `your_greptile_api_key` with your actual credentials.

4. **Configure OAuth Redirect URI:**

   Since the app has a custom scheme (`com.msh`), set the GitHub OAuth redirect URI to:

   ```
   com.msh://
   ```

   This should be configured in your GitHub OAuth app settings.

## Building the App

### Android

To build and run the app on Android:

```bash
npx expo run:android
```

This command will build and launch the app on an Android emulator (e.g. Android Studio's Emulator).

### iOS

To build and run the app on iOS:

```bash
npx expo run:ios
```

**Note**: You need access to a macOS device to build and run iOS applications locally.


## Contributing

If you'd like to contribute, please fork the repository and use a feature branch. Pull requests are warmly welcome.

## License

This project is licensed under the MIT License.
