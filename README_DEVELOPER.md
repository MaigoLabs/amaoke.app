## Development server

### Requirements
- Bun
- Docker

### 1. Environment setup
1. Create your `.env` file by renaming `.env.example` to `.env`
2. Add the following variable:
   OPENROUTER_API_KEY=your_key_here
   (Request the key from the repository owner)

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
