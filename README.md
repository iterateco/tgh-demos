# TGH Demos

## Development

Install dependencies:
```
yarn
```

Add .env file:
```
VITE_API_URL="http://localhost:9600/api"
VITE_ASSETS_URL="/assets"
```

Start dev server:
```
yarn dev
```

Build for production:
```
export VITE_API_URL="https://thegreathigh.com/api"
export VITE_ASSETS_URL="..."

yarn build
```
