import type { Config } from "tailwindcss";

const config: Config = {
  // Tailwind CSS 4 不再需要 darkMode 配置，dark mode 通过 @custom-variant 在 CSS 中定义
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
};

export default config;
