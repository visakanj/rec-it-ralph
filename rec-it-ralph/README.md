# 🎬 Rec-It-Ralph - Movie Recommender

A collaborative movie recommendation app for friend groups to pick movies together democratically.

## Features

- **Theme-based Sessions**: Set a theme like "Animated Movies" or "80s Classics"
- **Contributor System**: Add friends and let everyone suggest 3-5 movies
- **Smart Deduplication**: Automatically handles duplicate movie suggestions
- **Random Selection**: Fair random movie picker from your combined pool
- **Sequel Detection**: Warns if you pick a sequel and suggests starting with the first movie
- **Watch History**: Track what you've watched with undo functionality (24 hours)
- **URL Sharing**: Share your movie list instantly with friends via URL
- **Export/Import**: Backup and restore your data with JSON files
- **Mobile Responsive**: Works great on phones, tablets, and desktop

## How to Use

### 1. Set Up Your Session
1. Open the app in your browser
2. Click "Change" to set a theme (e.g., "Animated Movies")
3. Add contributors by clicking "+ Add Contributor"

### 2. Add Movies
1. Click "Edit" next to each contributor
2. Add 3-5 movie titles per person
3. The app automatically handles duplicates

### 3. Pick Movies
1. Click "🎲 Pick Random Movie" when you're ready to choose
2. If it's a sequel, you'll get a warning with options:
   - **Watch First**: Start with the first movie in the series
   - **Proceed Anyway**: Watch the sequel as planned
   - **Cancel**: Pick a different movie
3. Click "Accept" to move the movie to your watched list

### 4. Share with Friends
- **Share Link**: Click "Share Link" to send your movie list to friends
- **Export**: Download a backup JSON file of your data
- **Import**: Upload a backup file to restore your data

## Technical Details

- **No Server Required**: Runs entirely in your browser
- **Local Storage**: Your data is saved automatically on your device
- **Privacy**: No data is sent to external servers
- **Cross-Platform**: Works on any modern web browser

## Getting Started

1. Download or clone the files
2. Open `index.html` in any modern web browser
3. Start adding contributors and movies!

## Files Structure

```
rec-it-ralph/
├── index.html          # Main app page
├── styles.css          # All styling
├── app.js             # Application logic
├── series-map.json    # Sequel detection database
├── spec-it-ralph.md   # Detailed specification
└── README.md          # This file
```

## Sequel Detection

The app includes smart sequel detection for popular movie series:

- **Animated**: Toy Story, Shrek, How to Train Your Dragon, Frozen, etc.
- **Action**: John Wick, Matrix, Fast & Furious, Mission: Impossible, etc.
- **Fantasy**: Lord of the Rings, Hobbit, Avengers, etc.

Plus heuristic detection for movies with numbers, roman numerals, "Part X", colons, etc.

## Browser Compatibility

- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge
- Any modern mobile browser

## Contributing

This is a simple, self-contained web app. To add more movie series to the sequel detection:

1. Edit `series-map.json`
2. Add your series in the format: `"Series Name": ["Movie 1", "Movie 2", ...]`

## License

Open source - feel free to use, modify, and share!

---

*Built for movie nights with friends! 🍿*