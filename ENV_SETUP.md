# Environment Variables Setup

To enable the AI-powered features for artisans, you need to add the following environment variables to your `.env.local` file:

## Required Environment Variables

### 1. Google Gemini AI API Key
```
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
```

**How to get this:**
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key
5. Paste it in your `.env.local` file

**Note:** The Gemini 1.5 Flash API has a free tier with generous limits:
- 15 requests per minute
- 1000 requests per day
- Perfect for development and small-scale production

### 2. Supabase Configuration (if not already set)
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Complete .env.local Example

Create a `.env.local` file in your project root with:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Google Gemini AI Configuration
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
```

## Security Notes

- ✅ `NEXT_PUBLIC_` prefix means these variables are exposed to the browser (required for client-side usage)
- ✅ The Gemini API key is safe to expose as it has built-in rate limiting and usage controls
- ✅ Never commit your `.env.local` file to version control
- ✅ The `.env.local` file is already in your `.gitignore`

## Testing the Setup

After adding the environment variables:

1. Restart your development server
2. Go to the Seller Dashboard
3. Click "AI Product Creator"
4. Upload an image and click "Analyze with AI"
5. You should see AI-generated descriptions and pricing suggestions

## Troubleshooting

**"Failed to analyze image" error:**
- Check if your Gemini API key is correct
- Verify the API key has access to Gemini Pro Vision
- Check your browser console for detailed error messages

**Rate limiting:**
- The free tier allows 15 requests per minute
- If you hit the limit, wait a minute and try again

**Image analysis not working:**
- Ensure the image URL is accessible
- Try uploading a local image instead of a URL
- Check if the image format is supported (JPEG, PNG, etc.)
