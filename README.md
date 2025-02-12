# AI Debate Lords ⚔️

This repository contains a Node.js application that orchestrates epic debates between two large language models (LLMs) where wit and logic are the ultimate weapons.

## Features

- **Modular design:** The application is built with a modular architecture, making it easy to add or remove components as needed.
- **Customizable:** You can easily customize the system prompts for each LLM, the dialog turns, and the overall conversation flow. Want a heated debate on the merits of pineapple on pizza? You got it! 🍕
- **Extensible:** The application can be extended to support different LLMs. Bring on the contenders!
- **Logging:** The entire debate is logged to a file for later analysis and amusement. Who emerged victorious? 🏆

## Getting Started

1. **Clone the repository:**

   ```
   git clone https://github.com/your-username/AI-Debate-Lords.git
   ```

2. **Install dependencies:**

   ```
   cd AI-Debate-Lords
   npm install
   ```

3. **Configure the application:**
   - Update the `config.ts` file with your desired settings, including the API keys for your LLMs and the chosen battleground (topic).
   - Modify the `system_prompt_llm1.txt` and `system_prompt_llm2.txt` files to set the initial instructions for each LLM. Will they be polite or ruthless? 🥊

4. **Run the application:**

   specify your question and how many rounds you want:

   ```
   ts-node index.ts "Do you think public flatulence should be destigmatized?" 9
   ```
   
   or if you have a multi line question:

   ```
   ts-node index.ts "" 9 --file .\the-fart-question.txt
   ```


## Usage

The application will initiate a clash of the titans between the two configured LLMs. The debate will rage on for the specified number of turns, with each LLM generating responses based on the ongoing battle and its initial instructions. The whole showdown will be meticulously recorded in a log file.

## Technical Details

### Architecture

The application follows a modular architecture with the following key components:

- **LLM Manager:** Handles communication with the LLMs, sending prompts and receiving responses.
- **Debate Moderator:** Orchestrates the debate flow, ensuring each LLM gets its turn and enforcing the rules of engagement.
- **Logger:** Records the entire debate for posterity.

### Modules

- **`llm.ts`** – Defines the `LLM` class, which encapsulates the interaction with a single LLM.
- **`conversation.ts`** – Defines the `Conversation` class, which manages the debate flow and turn-taking.
- **`config.ts`** – Stores the application's configuration settings.

### Dependencies

The application relies on the following key dependencies:

- `axios`: For making HTTP requests to the LLMs' APIs.
- `dotenv`: For loading environment variables from a `.env` file.

## Contributing

Want to witness even more spectacular AI battles? Contributions are welcome! Feel free to submit bug reports, feature requests, or pull requests. Maybe you can even train a new gladiator to enter the arena!

## License

This project is licensed under the MIT License - unleash the AI!
