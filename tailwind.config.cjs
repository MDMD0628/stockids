/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#172033",
        paper: "#f7f4ec",
        pine: "#16735f",
        coral: "#d95c45",
        citrus: "#eab308",
        pool: "#0f84a9",
      },
      boxShadow: {
        soft: "0 18px 60px rgba(23, 32, 51, 0.08)",
      },
      fontFamily: {
        sans: [
          "Inter",
          "Pretendard",
          "ui-sans-serif",
          "system-ui",
          "Apple SD Gothic Neo",
          "Malgun Gothic",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
