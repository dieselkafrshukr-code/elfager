# ZERO - Minimalist Clothing Store

A clean, modern, and fully static e-commerce website for minimalist clothing.

## Features

✨ **Modern Design**
- Clean minimalist aesthetic
- Dark/Light theme toggle
- Smooth GSAP animations
- Responsive layout

🛍️ **Shopping Experience**
- Product catalog with static data
- Shopping bag with localStorage persistence
- Simulated checkout process
- Dynamic cart updates

🎨 **Technologies Used**
- Pure HTML, CSS, and JavaScript
- Vite for development
- GSAP for animations
- Lucide Icons
- Google Fonts (Outfit)

## Getting Started

### Prerequisites
- Node.js installed on your system

### Installation

1. Clone or download this repository
2. Navigate to the project directory
3. Install dependencies:
```bash
npm install
```

### Running the Development Server

```bash
npm run dev
```

The site will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

## Project Structure

```
zero-clothing/
├── index.html          # Main HTML file
├── src/
│   ├── main.js        # Main JavaScript logic
│   └── style.css      # Additional styles
├── public/            # Static assets
├── package.json       # Project configuration
└── README.md         # This file
```

## Features Breakdown

### Static Product Data
Products are defined in `main.js` and include:
- Classic Tee - Black (450 EGP)
- Minimalist Hoodie (850 EGP)
- Signature Cap (300 EGP)
- Urban Jacket (1200 EGP)

### Shopping Cart
- Add items to bag
- Remove items from bag
- Persistent storage using localStorage
- Dynamic total calculation

### Theme Toggle
- Light/Dark mode
- Preference saved in localStorage
- Smooth transitions

## Customization

### Adding Products
Edit the `products` array in `src/main.js`:

```javascript
const products = [
  {
    id: "5",
    name: "Your Product Name",
    price_now: 999,
    main_image: "https://your-image-url.com/image.jpg"
  }
];
```

### Changing Colors
Modify CSS variables in `index.html`:

```css
:root {
  --bg-color: #ffffff;
  --text-color: #0c0c0c;
  --accent-color: #000000;
  /* ... */
}
```

## Demo Mode

The checkout process is simulated and doesn't send data to any backend. When a user "orders", an alert will show their order details, but no actual transaction occurs.

## License

This project is open source and available for personal and commercial use.

## Credits

- Images from Unsplash
- Icons by Lucide
- Animations by GSAP
