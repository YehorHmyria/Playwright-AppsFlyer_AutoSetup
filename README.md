# AppsFlyer Auto Setup 🚀

AppsFlyer account setup automation using Playwright.

## 📋 Overview

This project is designed to automate routine tasks in the AppsFlyer dashboard, such as:

- Accepting **Review requests**.
- Setting up **Google Ads** integration.
- Configuring **Permissions** for ad networks.
- Setting up **Push API** (Postbacks) for iOS and Android.
- Updating **LinkID** for existing integrations.

## ✨ Key Features

- **Playwright Automation**: Fast and reliable browser action execution.
- **Telegram Notifications**: Detailed logs and reports for success or failure.
- **Watchdog**: Monitoring stuck tests via a custom reporter.
- **Flexibility**: Supports different endpoints for iOS and Android apps.

## 🛠 Setup

### Build Project

```bash
npm install
```

### Environment Variables (`.env`)

Create a `.env` file in the project root and add the following variables:

```env
# AppsFlyer Credentials
AF_EMAIL=your_email@example.com
AF_PASSWORD=your_password

# Telegram Notification (Required)
TG_BOT_TOKEN=your_bot_token
TG_CHAT_LOGS_ID=your_chat_id_for_logs
TG_CHAT_BUYERS_ID=your_chat_id_for_buyers (optional)

# Specific App Setup (used in fill_LinkID)
AF_APP_BUNDLE=com.example.app
AF_LINK_ID=123-456-7890
```

## 🚀 Usage

### 1. Full New App Setup

Starts the process of accepting review, setting up Google Ads, Permissions, and Push API.

```bash
npx playwright test tests/af_login_request_setup.spec.js
```

### 2. Update LinkID

Runs a script for quick LinkID updates in an existing integration.

```bash
npx playwright test tests/fill_LinkID.spec.js
```

## 📂 Project Structure

- `tests/`: Playwright test specifications.
- `utils/`: Helper functions, including Telegram logic.
- `reporters/`: Custom reporters for test status tracking.

---

_Developed for AppsFlyer workflow automation._
