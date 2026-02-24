/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#fef7ec',
                    100: '#fcebc4',
                    200: '#f9d58a',
                    300: '#f5b83e',
                    400: '#f2a419',
                    500: '#e88b0c',
                    600: '#cc6608',
                    700: '#a9470b',
                    800: '#8a3810',
                    900: '#722e10',
                },
                honey: {
                    50: '#fffbeb',
                    100: '#fff3c6',
                    200: '#ffe588',
                    300: '#ffd24a',
                    400: '#ffc020',
                    500: '#f9a007',
                    600: '#dd7602',
                    700: '#b75206',
                    800: '#943f0c',
                    900: '#7a340d',
                },
                hive: {
                    50: '#f0f9ff',
                    100: '#dff1ff',
                    200: '#b8e4ff',
                    300: '#79cfff',
                    400: '#32b8fe',
                    500: '#079eef',
                    600: '#007dcd',
                    700: '#0064a6',
                    800: '#045489',
                    900: '#0a4671',
                },
                dark: {
                    50: '#f6f6f7',
                    100: '#e2e3e5',
                    200: '#c4c6cb',
                    300: '#a0a3ab',
                    400: '#7c808a',
                    500: '#616570',
                    600: '#4d505a',
                    700: '#3f414a',
                    800: '#2d2f36',
                    900: '#1a1b21',
                    950: '#111218',
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
                display: ['Outfit', 'system-ui', 'sans-serif'],
            },
            animation: {
                'fade-in': 'fadeIn 0.3s ease-out',
                'slide-up': 'slideUp 0.3s ease-out',
                'slide-in-right': 'slideInRight 0.3s ease-out',
                'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
                'bounce-soft': 'bounceSoft 1s ease-in-out infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                slideInRight: {
                    '0%': { opacity: '0', transform: 'translateX(10px)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                },
                pulseSoft: {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0.7' },
                },
                bounceSoft: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-5px)' },
                },
            },
        },
    },
    plugins: [],
};
