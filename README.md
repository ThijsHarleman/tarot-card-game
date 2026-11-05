# Tarot Card Game

A two-player tarot-inspired card game built with **React, TypeScript, and Vite**.

Players compete to win Major Arcana cards by bidding with cards from their suits. Each player has a deck of Minor Arcana cards and a reserve of court cards. Players take turns playing cards of increasing strength or passing, with the winner of each round claiming the current Major Arcana prize.

The project also includes an AI opponent system and a strategy evolution framework. Different AI strategies can be generated, simulated, evaluated, and evolved over successive generations.

## Getting Started

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Run the test suite:

```bash
npm test
```

## Strategy and Evolution CLI

The project includes four CLI tools for generating and evolving AI strategies. All generated data is stored under:

```text
scripts/strategies/generated/
```

### 1. Generate Strategies

Generate a population of random strategies and append them to the strategy collection.

```bash
npm run generate-strategies -- 100
```

The number specifies how many strategies to generate. Strategies receive sequential names (`strategy_1`, `strategy_2`, etc.) and are saved with their configurations.

### 2. Simulate a Generation

Run simulations for all strategies in a generation.

```bash
npm run simulate-generation -- 1
```

The argument specifies the generation number to simulate.

Simulation results are saved as `simulation-results.csv` inside the corresponding generation directory.

### 3. Evolve a Generation

Create the next generation using the evaluation results of an existing generation.

```bash
npm run evolve-generation -- 1
```

The argument specifies the generation to evolve. The resulting population is saved as the next generation.

Evolution uses:
- **Selection:** Higher-ranked strategies have a greater chance of becoming parents.
- **Elitism:** The best strategies are carried forward unchanged.
- **Mutation:** Selected strategy configurations are modified to create offspring.
- **Random exploration:** New random strategies are introduced to maintain diversity.

This command requires the previous generation to have been evaluated.

### 4. Run the Complete Evolution Process

Start a complete evolution run from an empty generated folder:

```bash
npm run evolve -- 10
```

The argument specifies the total number of generations to create and evaluate.

The process automatically:

1. Creates an initial random population for generation 1.
2. Simulates and evaluates the population.
3. Evolves it into the next generation.
4. Simulates and evaluates the new population.
5. Repeats until the requested number of generations is completed.

The process also supports resuming existing generations, allowing an interrupted run to continue without unnecessarily repeating completed work.
