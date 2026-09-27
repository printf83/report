# Executive Report Aggregator 📊

A lightweight, client-side web application built using **Vite**, **HTML**, **CSS**, and **JavaScript**. This platform is designed to help **Administrators and Clerks** quickly merge, manage, and generate executive reports for **Management and Employers** from multiple disparate data sources.

---

## ✨ Features

- **Data Aggregation:** Seamlessly combines data from various sources into a single, cohesive, print-ready report.
- **100% Client-Side & Serverless:** No backend database or third-party servers required. Everything runs locally inside your browser.
- **Privacy & Security First:**
    - All sensitive data stays on your machine stored within `browser cache`.
    - Data is encrypted locally to prevent unauthorized local access.
    - No data is ever transmitted or uploaded to external servers.
- **Backup & Restore:** Full control over your data with offline export and import capabilities.
- **Customizable Environment:** Powered by Vite environment variables for configurable settings and metadata.

---

## ⚠️ Disclaimer

This application is an **independent, unofficial utility tool** created solely for data processing convenience.

- **No Affiliation:** This project is **NOT affiliated with, endorsed by, or connected to** any government agency, ministry, or corporate vendor (including HeiTech Padu Berhad, KDN, or associated entities).
- **100% Client-Side:** All operations run entirely in your local web browser. No data is sent to external servers or cloud services.
- **No Proprietary Code:** This project uses original, open-source code and components. It does not contain proprietary assets, trademarked logos, or source code from official portals.

---

## 🛠️ Built With

- [Vite](https://vitejs.dev/) - Fast frontend build tool
- HTML5 / CSS3 / JavaScript (ES6+) - Standard web primitives

---

## 🚀 Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) (v16 or higher) installed on your system.

### Installation

1. **Clone the repository:**

    ```bash
    git clone https://github.com/your-username/your-repo-name.git
    cd your-repo-name
    ```

2. **Install dependencies:**

    ```bash
    pnpm install
    ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory (refer to `.env.example` if available):

    ```env
    VITE_GITHUB_URL="https://github.com/your-username/your-repo-name"
    VITE_SOURCE_LC=source
    VITE_SOURCE_UC=SOURCE
    VITE_DATA_1_URL=https://url
    VITE_DATA_1_TITLE=SOURCE TITLE 1
    VITE_DATA_2_URL=https://url
    VITE_DATA_2_TITLE=SOURCE TITLE 2
    VITE_DATA_3_URL=https://url
    VITE_DATA_3_TITLE=SOURCE TITLE 3
    ```

4. **Run the Development Server:**
    ```bash
    pnpm run dev
    ```
    Open your browser and navigate to `http://localhost:5173`.

---

## 📦 Building for Production

To create an optimized production build:

```bash
pnpm run build
```

To preview the production build locally:

```bash
pnpm run preview
```

---

## 🔒 Security & Privacy

This application operates entirely within your browser environment:

1. **Zero External Tracking:** Data entered into this app never leaves your device.
2. **Local Storage Security:** Data stored locally in the browser cache is encrypted.
3. **Data Ownership:** You maintain full ownership over your data through local export/import features.

---

## 📖 How to Use

1. **Input Data:** Enter or paste source data into the provided input forms.
2. **Generate Report:** Click to aggregate and format the data automatically into a standard report.
3. **Print / Export:** Save as a PDF or print directly from your browser.
4. **Backup:** Export your local cache file if you need to transfer session data to another machine or browser.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
