## Development server

### Requirements
- Bun
- Docker

### 1. Environment setup
1. Create your `.env` file by renaming `.env.example` to `.env`
2. Add the following variables:
   AI_BASE_URL=https://openrouter.ai/api/v1
   AI_KEY=your_key_here
   AI_MODEL=openai/gpt-5.4-mini
   AI_SOCKS_PROXY=
   (Request the key from the repository owner)

   `OPENROUTER_API_KEY` is still supported as a legacy fallback for `AI_KEY`.
   `AI_SOCKS_PROXY` is optional and applies only to LLM requests, for example `socks5://127.0.0.1:1080`. In Docker, `localhost` means the web container itself; when the proxy runs on the host, use `socks5://host.docker.internal:1080` and make sure the proxy listens on an address reachable from the web container.

### 2. Start the database
Run in the project root:
docker compose up

### 3. Install dependencies
Install Bun:
https://bun.com/get

Then install project dependencies:
bun install

### 4. Start development server
bun run dev
