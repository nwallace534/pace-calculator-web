import { ThemeProvider } from "./components/ThemeProvider";
import Calculator from "./modules/Calculator";
import Header from "./modules/Header";

function App() {
  return (
    <ThemeProvider>
      <Header />
      <div className="mt-5">
        <Calculator />
      </div>
    </ThemeProvider>
  );
}

export default App;
