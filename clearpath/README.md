ClearPath is an AI-powered patient journey system that guides people from 'I need help' to 'I'm walking out the door' — in any language.

- Real-time WebSocket architecture — two screens talking to each other live
- Claude AI doing natural language triage in any language
- Full SQLite database tracking every patient
- End-to-end system: patient app + hospital OS in one

Hospitals are terrifying. You don't speak the language, you don't know where to go, you don't know how long you'll wait. Every other system gives you a form. ClearPath gives you a conversation. 

Features:

User App: 
    * Natural language diagnostic conversation with automatic language detection
    * AI routing to the right department + check-in 
    * Interactive hospital map with animated route and directions
    * Live queue position with estimated wait time via WebSocket
    * "It's your turn" alert pushed from staff dashboard
    * Discharge screen + AI-generated discharge follow-up instructions

Staff Dashboard:
    * Patient sentiment tracking with real-time list
    * AI-generated shift handoff summary
    * Stuck patient detection
    * Call next patient → instantly updates patient's phone
    * Move patient between departments
    * Discharge patient with custom instructions
    * Search and filter by department
    * Urgency badges (high/medium/low)
    * Language detection badge on each patient card

Analytics Page:
    * Total patients today
    * Currently waiting count
    * Discharged today count
    * Languages spoken
    * Patient volume by hour chart
    * Average wait time by department
    * Urgency breakdown


# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
