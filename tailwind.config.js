module.exports = {
    content: [
        './index.html',
        './src/**/*.{js, css}',
        './src/components/**/*.{js,html}',
    ],
    theme: {
        extend: {
            colors: {
                'primary-lightest': '#dbeafe', //blue-100 #dbeafe
                'primary-light': '#dbeafe', //blue-200 #bfdbfe
                'primary-dark': '#60a5fa', //blue-400 #60a5fa
                'primary-darker': '#3b82f6', //blue-500 #3b82f6
                // 100: dbeafe
                // 200: bfdbfe
                // 300: 93c5fd
                // 400: 60a5fa
                // 500: 3b82f6
                // 600: 2563eb
                // 700: 1d4ed8
                // 800: 1e40af
            },
            spacing: {
                'page-padding': '10mm',
            },
            fontFamily: {
                raleway: ['Raleway', 'sans-serif'],
            },
            listStyleType: {
                circle: 'circle',
            },
        },
    },
    plugins: [require('tailwind-scrollbar')],
}