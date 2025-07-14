# Study CheckList

A modern React TypeScript application for managing study checklists with a clean, responsive interface.

## 🚀 Tech Stack

- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI primitives
- **Icons**: Lucide React
- **Development**: ESLint, TypeScript, PostCSS

## 📦 Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues automatically
- `npm run type-check` - Run TypeScript type checking
- `npm run validate-env` - Validate development environment
- `npm run clean` - Clean build directory

### Development Server

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Environment Validation

To ensure your development environment is properly configured:

```bash
npm run validate-env
```

This will check for all required configuration files and directories.

## 🏗️ Project Structure

```
src/
├── components/          # React components
│   └── ui/             # Reusable UI components
├── lib/                # Utility functions
├── assets/             # Static assets
├── App.tsx             # Main app component
├── main.tsx            # Application entry point
└── index.css           # Global styles
```

## 🎨 Styling

This project uses Tailwind CSS for styling with the following configuration:

- **Font**: Inter (loaded from Google Fonts)
- **Path aliases**: Use `@/` to import from `src/`
- **Utility classes**: Full Tailwind CSS utility classes available
- **Component styling**: Custom utilities in `src/lib/utils.ts`

## 📱 Components

The project is set up to use Radix UI primitives for accessible, unstyled components:

- Accordion components
- Checkbox components
- Class variance authority for component variants
- Lucide React icons

## 🔧 Configuration Files

- `vite.config.ts` - Vite configuration with path aliases
- `tailwind.config.js` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration
- `tsconfig.json` - TypeScript configuration
- `eslint.config.js` - ESLint configuration

## 🏃‍♂️ Getting Started

1. Install dependencies: `npm install`
2. Validate environment: `npm run validate-env`
3. Start development: `npm run dev`
4. Begin building your study checklist components!

## 📝 Development Notes

- Use TypeScript for all components and utilities
- Follow React best practices and hooks patterns
- Utilize Tailwind CSS for consistent styling
- Leverage Radix UI for accessible components
- Use the `@/` path alias for cleaner imports

## 🤝 Contributing

1. Follow the existing code style
2. Run `npm run lint` before committing
3. Ensure `npm run type-check` passes
4. Test your changes thoroughly

---

Happy coding! 🎉
