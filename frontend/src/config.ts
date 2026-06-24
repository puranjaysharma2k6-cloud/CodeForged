

// Every file imports from here — never access
// import.meta.env directly anywhere else.


const config = {

  // base URL for all API calls
  // dev  → http://localhost:8000
  // prod → https://api.yourapp.com
  apiUrl: import.meta.env.VITE_API_URL as string,
  
  appName: import.meta.env.VITE_APP_NAME as string,

  // derived helper — tells you which environment you're in
  isDev:  import.meta.env.DEV,    // true during npm run dev
  isProd: import.meta.env.PROD,   // true during npm run build

} as const    // as const means these values can't be accidentally mutated

// --------------------------------------------------
// Validate at startup — crash early if misconfigured
// rather than failing silently during a fetch call
// --------------------------------------------------

if (!config.apiUrl) {
  throw new Error(
    'VITE_API_URL is not set. Check your .env.development or .env.production file.'
  )
}

export default config